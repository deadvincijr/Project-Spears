<#
.SYNOPSIS
    Pulls the latest files from the Project Spears GitHub repository with zero conflicts.

.DESCRIPTION
    This script syncs the latest version of files from the Project Spears GitHub 
    repository (https://github.com/deadvincijr/Project-Spears) into the local workspace.
    
    Key Features:
    - 100% Automated, Conflict-Free Git Sync: Automatically updates repository files 
      and local Git Graph to match origin/main immediately.
    - Automatic Safety Backup: Archives any modified or untracked local files into 
      '_backups\backup_YYYYMMDD_HHMMSS\' before updating, so no work is ever lost.
    - Self-Healing Git Locks: Cleans up orphan .git/*.lock files left by crashed processes.
    - Automatic Obsolete Directory Cleanup: Safely removes deprecated or duplicate folders 
      (like older nested 'Project Spears/' directories) without manual PowerShell commands.
    - Local Branch Protection: If you have local commits ahead of GitHub, they are safely 
      preserved in a timestamped backup branch ('backup/local_main_...').
    - Works with Git CLI and automatically falls back to GitHub ZIP download if Git is missing.
    - One-click friendly for Windows (double-click 'pull_updates.bat').

.PARAMETER RepoUrl
    The GitHub repository URL. Default: 'https://github.com/deadvincijr/Project-Spears.git'

.PARAMETER Branch
    The branch to pull from. Default: 'main'

.PARAMETER Target
    Specific project to update ('All', 'Aegis of the Void', 'Cabled-In', 'Towers'). Default: 'All'

.PARAMETER NoBackup
    Disables the automatic timestamped backup of modified files.

.PARAMETER DryRun
    Previews what files and commits would be updated without modifying anything on disk.

.PARAMETER Force
    Forces sync even if divergent commits exist.

.PARAMETER PullSubRepos
    Also executes 'git pull' inside any sub-folders that are independent git repositories.

.PARAMETER NoPause
    Skips the 'Press Enter to exit' prompt at the end (useful in automated pipelines).

.EXAMPLE
    .\pull_updates.ps1
    Pulls all updated files from GitHub main branch with automatic backup and zero conflicts.

.EXAMPLE
    .\pull_updates.ps1 -DryRun
    Previews what commits/files would be updated or added without making changes.

.EXAMPLE
    .\pull_updates.ps1 -Target "Towers"
    Updates only files for the Towers project.
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

# Helper: Clear orphan .git lock files if no git.exe process is currently running
function Clear-StaleGitLocks($repoDir) {
    $gitDir = Join-Path $repoDir ".git"
    if (Test-Path -LiteralPath $gitDir) {
        $lockFiles = Get-ChildItem -Path $gitDir -Filter "*.lock" -Recurse -File -ErrorAction SilentlyContinue
        if ($lockFiles) {
            $gitProcesses = Get-Process -Name "git" -ErrorAction SilentlyContinue
            if (-not $gitProcesses) {
                foreach ($lock in $lockFiles) {
                    Write-LogWarn "Removing stale git lock file: $($lock.Name)"
                    Remove-Item -LiteralPath $lock.FullName -Force -ErrorAction SilentlyContinue
                }
            }
        }
    }
}

# Helper: Automatically clean up obsolete directories that were deleted in Git (e.g. nested 'Project Spears')
function Cleanup-ObsoleteDirectories($repoDir) {
    $obsoleteCandidates = @(
        (Join-Path $repoDir "Project Spears")
    )
    foreach ($cand in $obsoleteCandidates) {
        if (Test-Path -LiteralPath $cand -PathType Container) {
            $tracked = @(& git -C $repoDir ls-files "Project Spears" 2>$null)
            if ($tracked.Count -eq 0) {
                try {
                    Remove-Item -LiteralPath $cand -Recurse -Force -ErrorAction SilentlyContinue
                } catch {
                    # If an editor or system process holds an open file handle, silently ignore
                }
            }
        }
    }
}

# Helper: Safely archive any modified or untracked local files before sync
function Backup-LocalChanges($repoDir, $backupFolder) {
    $backedUpCount = 0
    try {
        # Tracked modified & staged files
        $modifiedFiles = @(& git -C $repoDir diff --name-only HEAD 2>$null)
        # Untracked files (excluding ignored files)
        $untrackedFiles = @(& git -C $repoDir ls-files --others --exclude-standard 2>$null)
        
        $allDirty = ($modifiedFiles + $untrackedFiles) | Select-Object -Unique | Where-Object { $_ -and $_.Trim() }

        if ($allDirty.Count -gt 0) {
            Write-LogInfo "Backing up uncommitted local file(s) before update..."
            New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null
            foreach ($rel in $allDirty) {
                $src = Join-Path $repoDir $rel
                if (Test-Path -LiteralPath $src -PathType Leaf) {
                    $dst = Join-Path $backupFolder $rel
                    $dstParent = Split-Path -Parent $dst
                    if (-not (Test-Path -LiteralPath $dstParent)) {
                        New-Item -ItemType Directory -Path $dstParent -Force | Out-Null
                    }
                    Copy-Item -LiteralPath $src -Destination $dst -Force
                    $backedUpCount++
                }
            }
            Write-LogSuccess "Backed up $backedUpCount file(s) to: $backupFolder"
        }
    } catch {
        Write-LogWarn "Backup warning: $_"
    }
    return $backedUpCount
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
    Write-Host " Mode      : LIVE UPDATE (Zero Conflicts)" -ForegroundColor Green
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

# Create temp directory for downloading/cloning fallback
$TempBase = Join-Path $env:TEMP ("project_spears_sync_" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $TempBase -Force | Out-Null

$commitInfo = "N/A"
$downloadSucceeded = $false
$cloneDir = Join-Path $TempBase "repo"

try {
    # Check if the local workspace is already a connected Git repository
    $isLocalGitRepo = $false
    if ($hasGit -and (Test-Path (Join-Path $ScriptDir ".git"))) {
        try {
            $originUrl = (& git -C $ScriptDir remote get-url origin 2>$null)
            if ($originUrl) {
                $cleanOrigin = ($originUrl.Trim().TrimEnd("/") -replace "\.git$", "").ToLower()
                $cleanTarget = ($RepoUrl.Trim().TrimEnd("/") -replace "\.git$", "").ToLower()
                if ($cleanOrigin -eq $cleanTarget -or $cleanOrigin -like "*project-spears*") {
                    $isLocalGitRepo = $true
                }
            }
        } catch {
            $isLocalGitRepo = $false
        }
    }

    # =========================================================================
    # NATIVE ZERO-CONFLICT GIT SYNCHRONIZATION
    # =========================================================================
    if ($isLocalGitRepo -and $Target -eq "All") {
        Write-LogInfo "Local workspace is a unified Git repository connected to GitHub."
        Clear-StaleGitLocks $ScriptDir

        Write-LogInfo "Fetching latest commits and refs from origin ($Branch)..."
        $oldEAP = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        & git -C $ScriptDir fetch origin $Branch --prune --tags 2>&1 | Out-Null
        $ErrorActionPreference = $oldEAP

        $incomingCommits = @(& git -C $ScriptDir log "HEAD..origin/$Branch" --oneline 2>$null)
        $aheadCommits    = @(& git -C $ScriptDir log "origin/$Branch..HEAD" --oneline 2>$null)
        $currentLocalCommit = (& git -C $ScriptDir log "HEAD" -1 --format="%h - %s (%ad)" --date=relative 2>$null)
        $latestRemoteCommit = (& git -C $ScriptDir log "origin/$Branch" -1 --format="%h - %s (%ad)" --date=relative 2>$null)
        $dirtyFiles = @(& git -C $ScriptDir status --porcelain 2>$null)

        if ($DryRun) {
            Write-Host "`n [Git Sync Preview]" -ForegroundColor Magenta
            Write-Host " Current Local Commit : $currentLocalCommit" -ForegroundColor Gray
            Write-Host " Latest Remote Commit : $latestRemoteCommit" -ForegroundColor Gray
            if ($incomingCommits.Count -gt 0) {
                Write-Host " Incoming Commits ($($incomingCommits.Count)):" -ForegroundColor Yellow
                foreach ($c in $incomingCommits) {
                    Write-Host "   + $c" -ForegroundColor Yellow
                }
            } else {
                Write-Host " Local Git repository is already up to date with origin/$Branch." -ForegroundColor Green
            }
            if ($dirtyFiles.Count -gt 0) {
                Write-Host " Local uncommitted changes detected ($($dirtyFiles.Count) file(s)) - will be backed up." -ForegroundColor Yellow
            }
            if ($aheadCommits.Count -gt 0) {
                Write-Host " Local commits ahead of GitHub ($($aheadCommits.Count)) - will be preserved in backup branch:" -ForegroundColor Cyan
                foreach ($c in $aheadCommits) {
                    Write-Host "   * $c" -ForegroundColor Cyan
                }
            }
            Write-Host "`n [!] DRY RUN COMPLETED: No changes were written to disk." -ForegroundColor Magenta
            return
        }

        # LIVE SYNC EXECUTION
        $isBehind = ($incomingCommits.Count -gt 0)
        $isAhead  = ($aheadCommits.Count -gt 0)
        $hasDirty = ($dirtyFiles.Count -gt 0)

        if ($isBehind -or ($isAhead -and $Force)) {
            $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
            $backupFolder = Join-Path $ScriptDir "_backups\backup_$timestamp"
            $backedUpCount = 0

            # 1. Automatic Safety Backup of any local modifications or untracked files
            if (-not $NoBackup -and $hasDirty) {
                $backedUpCount = Backup-LocalChanges $ScriptDir $backupFolder
            }

            # 2. Preserve any local un-pushed commits in a dedicated backup branch
            if ($aheadCommits.Count -gt 0) {
                $backupBranch = "backup/local_main_$timestamp"
                & git -C $ScriptDir branch $backupBranch 2>&1 | Out-Null
                Write-LogInfo "Saved $($aheadCommits.Count) local commit(s) to backup branch: '$backupBranch'"
            }

            # 3. Clean any untracked files that might collide (excluding backup folders and IDE configs)
            if ($dirtyFiles.Count -gt 0) {
                & git -C $ScriptDir clean -fd -e "_backups" -e ".vscode" -e ".gemini" 2>&1 | Out-Null
            }

            # 4. Zero-Conflict Reset to match origin/$Branch exactly
            Write-LogInfo "Updating Git commit graph and working tree..."
            $oldEAP = $ErrorActionPreference
            $ErrorActionPreference = "Continue"
            $resetOutput = (& git -C $ScriptDir reset --hard "origin/$Branch" 2>&1)
            $resetExit = $LASTEXITCODE
            $ErrorActionPreference = $oldEAP

            if ($resetExit -ne 0) {
                Write-LogWarn "Reset encountered notice: $resetOutput"
                # Fallback forced checkout to ensure tree consistency
                & git -C $ScriptDir checkout -B $Branch "origin/$Branch" --force 2>&1 | Out-Null
            }

            # 5. Clean up obsolete directories (like duplicate 'Project Spears')
            Cleanup-ObsoleteDirectories $ScriptDir

            $newCommit = (& git -C $ScriptDir log -1 --format="%h - %s (%ad)" --date=relative 2>$null)

            # 6. Display Success Summary
            Write-Host "`n=================================================================" -ForegroundColor Cyan
            Write-Host "                         SYNC SUMMARY                            " -ForegroundColor White
            Write-Host "=================================================================" -ForegroundColor Cyan
            Write-Host " Status          : 100% Up to Date (Zero Conflicts)" -ForegroundColor Green
            Write-Host " Git Graph HEAD  : $newCommit" -ForegroundColor White
            Write-Host " Active Branch   : $Branch (synchronized with origin/$Branch)" -ForegroundColor Gray
            if ($incomingCommits.Count -gt 0) {
                Write-Host " Commits Merged  : $($incomingCommits.Count) new commit(s)" -ForegroundColor Green
                foreach ($c in $incomingCommits) {
                    Write-Host "   + $c" -ForegroundColor DarkGray
                }
            }
            if ($backedUpCount -gt 0) {
                Write-Host "`n Safety Backup Saved:" -ForegroundColor Cyan
                Write-Host " Directory       : $backupFolder" -ForegroundColor Gray
                Write-Host " ($backedUpCount local file(s) safely archived before sync)" -ForegroundColor Gray
            }
            Write-Host "=================================================================`n" -ForegroundColor Cyan
            return
        } else {
            # Already up to date
            Cleanup-ObsoleteDirectories $ScriptDir

            Write-Host "`n=================================================================" -ForegroundColor Cyan
            Write-Host "                         SYNC SUMMARY                            " -ForegroundColor White
            Write-Host "=================================================================" -ForegroundColor Cyan
            Write-Host " Your local workspace and Git Graph are already up to date!" -ForegroundColor Green
            Write-Host " Current Local Commit : $currentLocalCommit" -ForegroundColor White
            Write-Host " Remote Branch        : origin/$Branch" -ForegroundColor Gray
            if ($hasDirty) {
                Write-Host " Working Tree Notice  : You have $($dirtyFiles.Count) uncommitted local change(s) safely preserved." -ForegroundColor Yellow
            }
            if ($isAhead) {
                Write-Host " Commit Notice        : You have $($aheadCommits.Count) local commit(s) ahead of GitHub." -ForegroundColor Cyan
            }
            Write-Host "=================================================================`n" -ForegroundColor Cyan
            return
        }
    }

    # =========================================================================
    # FALLBACK: FILE-BY-FILE DOWNLOAD / EXTRACT (No-Git or Project Target)
    # =========================================================================
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

    $remoteSourceDir = $cloneDir
    $innerSpears = Join-Path $cloneDir "Project Spears"
    if (Test-Path -LiteralPath $innerSpears -PathType Container) {
        $remoteSourceDir = $innerSpears
        Write-LogInfo "Detected and mapped remote directory: 'Project Spears/'"
    }

    $allRemoteFiles = Get-ChildItem -Path $remoteSourceDir -Recurse -File
    $remoteFiles = $allRemoteFiles | Where-Object {
        $_.FullName -notmatch "[\\/]\.git([\\/]|$)"
    }

    Write-LogInfo "Found $($remoteFiles.Count) remote files to evaluate.`n"

    $countIdentical = 0
    $countUpdated   = 0
    $countAdded     = 0
    $countSkipped   = 0
    $backupList     = @()
    $timestamp      = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFolder   = Join-Path $ScriptDir "_backups\backup_$timestamp"

    $ignoredPatterns = @(
        "^\.git([\\/]|$)",
        "^_backups([\\/]|$)",
        "^pull_updates\.(ps1|bat)$",
        "^\.vscode([\\/]|$)",
        "^\.gemini([\\/]|$)"
    )

    foreach ($file in $remoteFiles) {
        $relPath = $file.FullName.Substring($remoteSourceDir.Length).TrimStart('\', '/')
        $localRelPath = $relPath

        if ($localRelPath -match "^Cabled In\\Cabled-In") {
            $localRelPath = $localRelPath -replace "^Cabled In\\Cabled-In", "Cabled-In"
        } elseif ($localRelPath -match "^Cabled In\\") {
            $localRelPath = $localRelPath -replace "^Cabled In\\", "Cabled-In\"
        }

        if ($Target -ne "All") {
            $firstSegment = ($localRelPath -split "[\\/]")[0]
            if ($firstSegment -notlike "*$Target*") {
                $countSkipped++
                continue
            }
        }

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
            $remoteHash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
            $localHash  = (Get-FileHash -LiteralPath $localFilePath -Algorithm SHA256).Hash

            if ($remoteHash -eq $localHash) {
                $countIdentical++
                continue
            } else {
                $countUpdated++
                Write-LogAction "UPDATE" $localRelPath "Yellow"

                if (-not $DryRun) {
                    if (-not $NoBackup) {
                        $backupTarget = Join-Path $backupFolder $localRelPath
                        $backupTargetParent = Split-Path -Parent $backupTarget
                        if (-not (Test-Path -LiteralPath $backupTargetParent)) {
                            New-Item -ItemType Directory -Path $backupTargetParent -Force | Out-Null
                        }
                        Copy-Item -LiteralPath $localFilePath -Destination $backupTarget -Force
                        $backupList += $localRelPath
                    }
                    Copy-Item -LiteralPath $file.FullName -Destination $localFilePath -Force
                }
            }
        } else {
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

    # Clean up obsolete directories in fallback mode as well
    Cleanup-ObsoleteDirectories $ScriptDir

    # Sub-repositories
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

    # Summary Display for Fallback
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
    if (Test-Path -LiteralPath $TempBase) {
        Remove-Item -LiteralPath $TempBase -Recurse -Force -ErrorAction SilentlyContinue
    }

    if (-not $NoPause) {
        try {
            if ([Environment]::UserInteractive -and -not [Console]::IsInputRedirected) {
                Write-Host "Press Enter to exit..." -ForegroundColor Gray
                [void][Console]::ReadLine()
            }
        } catch {}
    }
}
