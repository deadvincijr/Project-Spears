<#
.SYNOPSIS
    Pulls the latest files from the Project Spears GitHub repository.

.DESCRIPTION
    This script syncs the latest version of files from the Project Spears GitHub 
    repository (https://github.com/deadvincijr/Project-Spears) into the local workspace.
    
    Key Features:
    - Automatically checks GitHub for updated files
    - Smart directory mapping (automatically handles nested or flat game folders)
    - Safety backup: archives any modified local files to '_backups\' before overwriting
    - Preserves local .git folders, backup folders, and developer configs
    - Works with Git CLI and automatically falls back to GitHub ZIP download if Git is missing
    - Optional support to pull nested Git sub-repositories (Cabled-In, Towers)
    - Preview mode with -DryRun
    - One-click friendly for Windows

.PARAMETER RepoUrl
    The GitHub repository URL. Default: 'https://github.com/deadvincijr/Project-Spears.git'

.PARAMETER Branch
    The branch to pull from. Default: 'main'

.PARAMETER Target
    Specific project to update ('All', 'Aegis of the Void', 'Cabled-In', 'Towers'). Default: 'All'

.PARAMETER NoBackup
    Disables the automatic timestamped backup of overwritten files.

.PARAMETER DryRun
    Previews what files would be updated or added without modifying anything on disk.

.PARAMETER Force
    Overwrites local files without prompting.

.PARAMETER PullSubRepos
    Also executes 'git pull' inside any sub-folders that are independent git repositories.

.PARAMETER NoPause
    Skips the 'Press Enter to exit' prompt at the end.

.EXAMPLE
    .\pull_updates.ps1
    Pulls all updated files from GitHub main branch with automatic backup.

.EXAMPLE
    .\pull_updates.ps1 -DryRun
    Previews what files would be updated or added without making changes.

.EXAMPLE
    .\pull_updates.ps1 -Target "Towers"
    Updates only files for the Towers project.

.EXAMPLE
    .\pull_updates.ps1 -PullSubRepos
    Pulls Project-Spears updates and also runs 'git pull' on Cabled-In and Towers repositories.
#>

[CmdletBinding()]
param (
    [string]$RepoUrl = "https://github.com/deadvincijr/Project-Spears.git",
    [string]$Branch = "main",
    [string]$Target = "All",
    [switch]$NoBackup,
    [switch]$DryRun,
    [switch]$Force,
    [switch]$PullSubRepos,
    [switch]$NoPause
)

# Output helper functions
function Write-LogInfo($msg)    { Write-Host " [INFO]    $msg" -ForegroundColor Cyan }
function Write-LogSuccess($msg) { Write-Host " [SUCCESS] $msg" -ForegroundColor Green }
function Write-LogWarn($msg)    { Write-Host " [WARN]    $msg" -ForegroundColor Yellow }
function Write-LogError($msg)   { Write-Host " [ERROR]   $msg" -ForegroundColor Red }
function Write-LogAction($tag, $msg, $color = "White") {
    Write-Host (" {0,-10} " -f "[$tag]") -NoNewline -ForegroundColor $color
    Write-Host $msg
}

# Resolve local root directory (where this script resides)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ScriptDir) {
    $ScriptDir = (Get-Location).Path
}

# Banner
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "             PROJECT SPEARS - GITHUB SYNC UTILITY                " -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Workspace : $ScriptDir" -ForegroundColor Gray
Write-Host " Remote    : $RepoUrl ($Branch)" -ForegroundColor Gray
Write-Host " Target    : $Target" -ForegroundColor Gray
if ($DryRun) {
    Write-Host " Mode      : DRY RUN (Preview only - no files will be changed)" -ForegroundColor Magenta
} else {
    Write-Host " Mode      : LIVE UPDATE" -ForegroundColor Green
}
Write-Host "=================================================================`n" -ForegroundColor Cyan

# Check if git is available
$hasGit = $false
try {
    $oldEAP = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    $gitVer = & git --version 2>$null
    $ErrorActionPreference = $oldEAP
    if ($LASTEXITCODE -eq 0 -and $gitVer) {
        $hasGit = $true
        Write-LogInfo "Git detected: $gitVer"
    }
} catch {
    $hasGit = $false
}

# Create temp directory for downloading/cloning
$TempBase = Join-Path $env:TEMP ("project_spears_sync_" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $TempBase -Force | Out-Null

$commitInfo = "N/A"
$downloadSucceeded = $false
$cloneDir = Join-Path $TempBase "repo"

try {
    if ($hasGit) {
        Write-LogInfo "Fetching latest changes from GitHub via Git..."
        
        $oldEAP = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        & git clone --depth 1 --quiet --branch $Branch $RepoUrl $cloneDir 2>&1 | Out-Null
        $cloneExit = $LASTEXITCODE
        $ErrorActionPreference = $oldEAP

        if ($cloneExit -eq 0 -and (Test-Path -LiteralPath $cloneDir)) {
            $downloadSucceeded = $true
            try {
                $commitInfo = (& git -C $cloneDir log -1 --format="%h - %s (%ad)" --date=relative 2>$null)
            } catch {
                $commitInfo = "Commit fetched successfully"
            }
            Write-LogSuccess "Cloned latest commit: $commitInfo"
        } else {
            Write-LogWarn "Git clone failed. Attempting fallback to GitHub Zip download..."
        }
    }

    # Fallback to ZIP download if git clone didn't happen or failed
    if (-not $downloadSucceeded) {
        Write-LogInfo "Downloading latest repository zip from GitHub..."
        $zipUrl = $RepoUrl -replace "\.git$", ""
        $zipUrl = "$zipUrl/archive/refs/heads/$Branch.zip"
        $zipFile = Join-Path $TempBase "repo.zip"
        $extractDir = Join-Path $TempBase "repo_extract"

        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $zipUrl -OutFile $zipFile -UseBasicParsing
        Expand-Archive -Path $zipFile -DestinationPath $extractDir -Force
        
        # The zip extracts into a folder named <Repo>-<Branch>
        $innerDir = Get-ChildItem -Path $extractDir -Directory | Select-Object -First 1
        if ($innerDir) {
            $cloneDir = $innerDir.FullName
            $downloadSucceeded = $true
            $commitInfo = "Latest on branch $Branch"
            Write-LogSuccess "Downloaded and extracted zip successfully."
        } else {
            throw "Failed to extract contents from GitHub zip archive."
        }
    }

    # Determine remote source directory
    # If the remote repo has an inner "Project Spears" folder, use it
    $remoteSourceDir = $cloneDir
    $innerSpears = Join-Path $cloneDir "Project Spears"
    if (Test-Path -LiteralPath $innerSpears -PathType Container) {
        $remoteSourceDir = $innerSpears
        Write-LogInfo "Detected and mapped remote directory: 'Project Spears/'"
    }

    # Gather all files from remote source
    $allRemoteFiles = Get-ChildItem -Path $remoteSourceDir -Recurse -File

    # Filter out git internal files if any
    $remoteFiles = $allRemoteFiles | Where-Object {
        $_.FullName -notmatch "[\\/]\.git([\\/]|$)"
    }

    Write-LogInfo "Found $($remoteFiles.Count) remote files to evaluate.`n"

    # Setup counters and backup structure
    $countIdentical = 0
    $countUpdated   = 0
    $countAdded     = 0
    $countSkipped   = 0
    $backupList     = @()
    $timestamp      = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFolder   = Join-Path $ScriptDir "_backups\backup_$timestamp"

    # Files and folders to ignore/protect locally
    $ignoredPatterns = @(
        "^\.git([\\/]|$)",
        "^_backups([\\/]|$)",
        "^pull_updates\.(ps1|bat)$",
        "^\.vscode([\\/]|$)",
        "^\.gemini([\\/]|$)"
    )

    foreach ($file in $remoteFiles) {
        # Calculate relative path from remoteSourceDir
        $relPath = $file.FullName.Substring($remoteSourceDir.Length).TrimStart('\', '/')

        # Handle remote "Cabled In\Cabled-In" nesting if present
        $localRelPath = $relPath
        if ($localRelPath -match "^Cabled In\\Cabled-In") {
            $localRelPath = $localRelPath -replace "^Cabled In\\Cabled-In", "Cabled-In"
        } elseif ($localRelPath -match "^Cabled In\\") {
            $localRelPath = $localRelPath -replace "^Cabled In\\", "Cabled-In\"
        }

        # Filter by Target if specified
        if ($Target -ne "All") {
            $firstSegment = ($localRelPath -split "[\\/]")[0]
            if ($firstSegment -notlike "*$Target*") {
                $countSkipped++
                continue
            }
        }

        # Check if file matches ignored patterns
        $isIgnored = $false
        foreach ($pat in $ignoredPatterns) {
            if ($localRelPath -match $pat) {
                $isIgnored = $true
                break
            }
        }
        if ($isIgnored) {
            continue
        }

        $localFilePath = Join-Path $ScriptDir $localRelPath
        $localFileExists = Test-Path -LiteralPath $localFilePath

        if ($localFileExists) {
            # Compute hashes to compare
            $remoteHash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
            $localHash  = (Get-FileHash -LiteralPath $localFilePath -Algorithm SHA256).Hash

            if ($remoteHash -eq $localHash) {
                $countIdentical++
                # File is already up to date
                continue
            } else {
                # File has updates on GitHub
                $countUpdated++
                Write-LogAction "UPDATE" $localRelPath "Yellow"

                if (-not $DryRun) {
                    # Backup local version before overwriting
                    if (-not $NoBackup) {
                        $backupTarget = Join-Path $backupFolder $localRelPath
                        $backupTargetParent = Split-Path -Parent $backupTarget
                        if (-not (Test-Path -LiteralPath $backupTargetParent)) {
                            New-Item -ItemType Directory -Path $backupTargetParent -Force | Out-Null
                        }
                        Copy-Item -LiteralPath $localFilePath -Destination $backupTarget -Force
                        $backupList += $localRelPath
                    }

                    # Overwrite with updated file
                    Copy-Item -LiteralPath $file.FullName -Destination $localFilePath -Force
                }
            }
        } else {
            # New file from GitHub
            $countAdded++
            Write-LogAction "NEW" $localRelPath "Green"

            if (-not $DryRun) {
                $destParent = Split-Path -Parent $localFilePath
                if (-not (Test-Path -LiteralPath $destParent)) {
                    New-Item -ItemType Directory -Path $destParent -Force | Out-Null
                }
                Copy-Item -LiteralPath $file.FullName -Destination $localFilePath -Force
            }
        }
    }

    # Handle Sub-repository Git Pulls if requested
    if ($PullSubRepos -and $hasGit) {
        Write-Host "`n--- Checking Sub-Repositories ---" -ForegroundColor Cyan
        $subRepos = @("Cabled-In", "Towers")
        foreach ($sub in $subRepos) {
            $subPath = Join-Path $ScriptDir $sub
            $gitDir = Join-Path $subPath ".git"
            if (Test-Path -LiteralPath $gitDir) {
                Write-LogInfo "Running 'git pull' in $sub..."
                if (-not $DryRun) {
                    $oldEAP = $ErrorActionPreference
                    $ErrorActionPreference = "Continue"
                    $subPull = & git -C $subPath pull 2>&1
                    $subExit = $LASTEXITCODE
                    $ErrorActionPreference = $oldEAP

                    if ($subExit -eq 0) {
                        Write-LogSuccess "$sub git pull completed: $subPull"
                    } else {
                        Write-LogWarn "$sub git pull returned: $subPull"
                    }
                } else {
                    Write-LogAction "DRY-RUN" "Would run 'git pull' in $sub" "Magenta"
                }
            }
        }
    }

    # Summary Display
    Write-Host "`n=================================================================" -ForegroundColor Cyan
    Write-Host "                         SYNC SUMMARY                            " -ForegroundColor White
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host " GitHub Commit    : $commitInfo" -ForegroundColor Gray
    Write-Host " Files Identical  : $countIdentical (already up to date)" -ForegroundColor DarkGray
    Write-Host " Files Updated    : $countUpdated" -ForegroundColor $(if ($countUpdated -gt 0) { "Yellow" } else { "Gray" })
    Write-Host " Files Added      : $countAdded" -ForegroundColor $(if ($countAdded -gt 0) { "Green" } else { "Gray" })
    if ($Target -ne "All") {
        Write-Host " Files Skipped    : $countSkipped (outside target '$Target')" -ForegroundColor DarkGray
    }

    if ($backupList.Count -gt 0 -and -not $DryRun) {
        Write-Host "`n Safety Backup Saved:" -ForegroundColor Cyan
        Write-Host " Directory: $backupFolder" -ForegroundColor Gray
        Write-Host " ($($backupList.Count) local file(s) safely backed up prior to overwrite)" -ForegroundColor Gray
    }

    if ($DryRun) {
        Write-Host "`n [!] DRY RUN COMPLETED: No changes were written to disk." -ForegroundColor Magenta
    } elseif ($countUpdated -eq 0 -and $countAdded -eq 0) {
        Write-Host "`n Your local workspace is fully up to date with Project Spears GitHub!" -ForegroundColor Green
    } else {
        Write-Host "`n Update complete! Your workspace has been updated." -ForegroundColor Green
    }
    Write-Host "=================================================================`n" -ForegroundColor Cyan

} catch {
    Write-LogError "An error occurred during sync: $_"
    Write-Host $_.ScriptStackTrace -ForegroundColor DarkRed
} finally {
    # Clean up temp folder
    if (Test-Path -LiteralPath $TempBase) {
        Remove-Item -LiteralPath $TempBase -Recurse -Force -ErrorAction SilentlyContinue
    }

    # Pause on completion if run interactively
    if (-not $NoPause) {
        try {
            if ([Environment]::UserInteractive -and -not [Console]::IsInputRedirected) {
                Write-Host "Press Enter to exit..." -ForegroundColor Gray
                [void][Console]::ReadLine()
            }
        } catch {
            # Ignore if input stream cannot be read
        }
    }
}
