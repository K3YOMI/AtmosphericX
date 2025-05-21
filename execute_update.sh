#!/bin/bash
cat storage/logo | sed 's/ Version: {VERSION}//'

VERSION=$(cat version)
FULL_REWRITE="false"

fetch_changelogs() {
    local version="$1"
    local url="https://k3yomi.github.io/update/atmosx_header.json"
    changelog=$(curl -s -f "$url" | awk -v ver="\"$version\"" 'BEGIN { found=0 }$1 ~ ver":" { found=1 }found && /^\s*}/ { exit }found { print }')
    echo ============================ CURRENT VERSION ============================
    if [ -n "$changelog" ]; then
        updated=$(echo "$changelog" | grep '"updated"' | sed 's/.*: "\(.*\)".*/\1/')
        ver=$(echo "$changelog" | grep '"version"' | sed 's/.*: "\(.*\)".*/\1/')
        headline=$(echo "$changelog" | grep '"headline"' | sed 's/.*: "\(.*\)".*/\1/')
        changelogs=$(echo "$changelog" | awk '/"changelogs"/,/\]/' | grep -o '"[^"]\+"' | sed 's/"//g')
        rewrite=$(echo "$changelog" | grep '"rewrite"' | sed 's/.*: \(.*\),*/\1/' | tr -d ' ')
        echo "Version: v$ver"
        echo "Updated: $updated"
        echo "Full Rewrite: $rewrite"
        FULL_REWRITE=$rewrite
        if [ -n "$headline" ] && [ "$headline" != "null" ]; then
            echo "Headline: $headline"
        fi
        if [ -n "$changelogs" ]; then
            echo "Changelogs:"
            echo "$changelogs" | while read -r line; do
                echo "  - $line"
            done
        else
            echo "No changelogs available for this version."
        fi
    else
        echo "No changelogs available for this version."
    fi
    echo =============================== END OF LOG ==============================
}
commit_update() {
    if [ "$FULL_REWRITE" = "true" ]; then
        echo "[WARNING] This update requires a full rewrite of your configurations and project files, would you like to update it still? (y/n)"
        echo "[INFO] A backup of your configurations will be created in configurations.bak"
        read -r answer
        if [ "$answer" = "y" ]; then
            echo "Backing up old configuration file..."
            cp -r configurations.json configurations.bak
            echo "[INFO] Configuration file backed up in configurations.bak"
            git fetch --all
            git reset --hard origin/main
            git clean -fd -e execute_update.sh -e configurations.bak
        else
            echo "[INFO] Exiting updater..."
            exit 0
        fi
    else
        git fetch --all
        git stash push -u -m "Auto-stash before update"
        git pull --rebase --prune origin main
        git clean -fd -e execute_update.sh -e configurations.bak
        git stash pop || echo "[INFO] No stashed changes to apply."
        # Restore missing files and replace non-locally changed files
        for file in $(git ls-tree --name-only -r HEAD); do
            if [ ! -e "$file" ]; then
                git checkout -- "$file" 2>/dev/null
                echo "[INFO] '$file' was missing and has been restored from the repository."
            else
                # Check if file is locally modified
                if ! git diff --quiet -- "$file"; then
                    # Locally modified, skip replacing
                    continue
                fi
                # Not locally modified, replace with repo version
                git checkout -- "$file" 2>/dev/null
                echo "[INFO] '$file' was replaced with the repository version."
            fi
        done
    fi

    echo "[INFO] Update complete. Please restart the application to apply changes."
}


fetch_changelogs "$VERSION"
commit_update





read -p "Press enter to continue..."