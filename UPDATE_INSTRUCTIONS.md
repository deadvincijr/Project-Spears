# Project Spears - GitHub Sync Utility

This directory contains automated sync tools to pull the most updated files from the [Project Spears GitHub repository](https://github.com/deadvincijr/Project-Spears).

## Quick Start (Double-Click)

The simplest way to update files on Windows:
- Double-click **`pull_updates.bat`**
- The script will automatically fetch latest changes, display a summary of any files updated or added, and prompt you to press Enter before closing.

---

## Running from PowerShell

Open PowerShell in this directory (`c:\ShellyPrograms\Project Spears`) and run:

```powershell
.\pull_updates.ps1
```

### Options & Parameters

| Parameter | Example | Description |
| :--- | :--- | :--- |
| **Preview / Dry Run** | `.\pull_updates.ps1 -DryRun` | Checks GitHub and previews what files would be updated or added without changing any files on disk. |
| **Filter by Project** | `.\pull_updates.ps1 -Target "Towers"` | Only syncs files for a specific project (`Towers`, `Aegis of the Void`, or `Cabled-In`). |
| **Sub-Repository Git Pull** | `.\pull_updates.ps1 -PullSubRepos` | Also executes `git pull` on local sub-repositories (`Cabled-In` and `Towers`) that have independent `.git` remotes. |
| **Custom Branch** | `.\pull_updates.ps1 -Branch "main"` | Pulls from a specific branch (defaults to `main`). |
| **Disable Backups** | `.\pull_updates.ps1 -NoBackup` | Disables the automatic timestamped backup of modified files before overwriting. |
| **Non-interactive / CI** | `.\pull_updates.ps1 -NoPause` | Skips the "Press Enter to exit" prompt at the end (useful in automated pipelines). |

---

## Safety Features

1. **Automatic Local Backups**:
   - Any local file that has been modified locally will be safely archived into `_backups\backup_YYYYMMDD_HHMMSS\` before being updated with the GitHub version.
2. **Git & Config Protection**:
   - Local `.git` repositories, `.vscode`, `.gemini`, `_backups`, and the updater scripts themselves are protected and never overwritten or deleted.
3. **No-Git Fallback**:
   - If Git is not installed on a computer, the script automatically falls back to downloading and extracting GitHub's ZIP archive.
