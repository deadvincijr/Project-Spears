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

## Safety & Automation Features

1. **Zero-Conflict Automated Sync**:
   - Automatically synchronizes your working files and your local **Git Graph** immediately to the latest commit on `origin/main`.
   - Never requires manual Git or PowerShell commands.
2. **Automatic Local Backups**:
   - If any files were modified or untracked locally, they are safely archived into `_backups\backup_YYYYMMDD_HHMMSS\` before syncing so no work is ever lost.
3. **Local Commit & Branch Protection**:
   - If you committed changes locally that are ahead of GitHub, they are automatically preserved in a timestamped backup branch (`backup/local_main_YYYYMMDD_HHMMSS`).
4. **Self-Healing Git Locks & Cleanup**:
   - Automatically clears stale `.git/*.lock` files left by crashed processes.
   - Automatically cleans up obsolete or duplicate folders (such as older nested `Project Spears/` directories).
5. **No-Git Fallback**:
   - If Git is not installed on a computer, the script automatically falls back to downloading and extracting GitHub's ZIP archive.

---

## Troubleshooting & FAQ

* **Q: Does this work if I have local edits or unsaved files?**
  * Yes! The script automatically creates a timestamped safety backup in `_backups/` before synchronizing, so your edits are always safe and will never trigger merge conflict errors.
* **Q: Why does the Git Graph update immediately?**
  * The updater uses native Git fast-forward synchronization with `origin/main`, ensuring that VS Code, Antigravity IDE, and all Git visualization tools reflect the new commits instantly.


