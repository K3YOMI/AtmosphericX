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
        BLACKLISTED_FILES="execute_update.sh execute_update_unix.sh configurations.bak"
        echo "[INFO] Updating files..."
        git fetch --all
        files_to_update=$(git diff --name-only origin/main | grep -v -E 'execute_update\.sh|execute_update_unix\.sh|configurations\.bak|configurations\.json')
        for file in $files_to_update; do
            git checkout origin/main -- "$file"
        done
    fi
    echo "[INFO] Update complete. Please restart the application to apply changes."
}


fetch_changelogs "$VERSION"
commit_update





read -p "Press enter to continue..."