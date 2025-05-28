#!/bin/bash
cat storage/logo | sed 's/ Version: {VERSION}//'

VERSION=$(cat version)
FULL_REWRITE="false"

check_skipped_update() {
    local current_version="$1"
    local latest_version="$2"
    local url="https://k3yomi.github.io/update/atmosx_header.json"
    changelog_data=$(curl -s -f "$url")
    skipped_rewrites=()
    found_rewrite="false"
    versions=()
    mapfile -t versions < <(echo "$changelog_data" | grep '"version"' | sed 's/.*: "\(.*\)".*/\1/' | sort -V)
    for version in "${versions[@]}"; do
        if [[ "$(printf "%s\n%s" "$current_version" "$version" | sort -V | head -n 1)" == "$current_version" ]] &&
           [[ "$(printf "%s\n%s" "$version" "$latest_version" | sort -V | head -n 1)" == "$version" ]]; then
            rewrite_flag=$(echo "$changelog_data" | awk -v ver="\"$version\"" '
                $0 ~ ver {found=1} 
                found && /"rewrite":/ {print $2; exit}' | tr -d ',')
            echo "Checking version: $version for rewrite flag: $rewrite_flag"
            if [[ "$rewrite_flag" == "true" ]]; then
                skipped_rewrites+=("$version")
                found_rewrite="true"
            fi
        fi
    done
    if [ "$found_rewrite" = "true" ]; then
        echo "[WARNING] You skipped a version that required a full rewrite!"
        echo "Skipped versions requiring rewrites: ${skipped_rewrites[*]}"
        echo "[INFO] The update process will enforce a full rewrite."
        FULL_REWRITE="true"
    else
        echo "[INFO] No skipped full rewrites detected."
    fi
}

fetch_changelogs() {
    local version="$1"
    local url="https://k3yomi.github.io/update/atmosx_header.json"
    local new_version="https://raw.githubusercontent.com/k3yomi/AtmosphericX/main/version"
    new_version=$(curl -s -f "$new_version")

    if [ "$version" != "$new_version" ]; then
        echo "Your current version: $version"
        echo "A newer version is available: $new_version"
    else
        echo "You are already on the latest version: $version"
    fi

    changelog=$(curl -s -f "$url" | awk -v ver="\"$new_version\"" 'BEGIN { found=0 }$1 ~ ver":" { found=1 }found && /^\s*}/ { exit }found { print }')
    echo ============================ LATEST VERSION ============================
    
    if [ -n "$changelog" ]; then
        updated=$(echo "$changelog" | grep '"updated"' | sed 's/.*: "\(.*\)".*/\1/')
        ver=$(echo "$changelog" | grep '"version"' | sed 's/.*: "\(.*\)".*/\1/')
        headline=$(echo "$changelog" | grep '"headline"' | sed 's/.*: "\(.*\)".*/\1/')
        changelogs=$(echo "$changelog" | awk '/"changelogs"/,/\]/' | grep -o '"[^"]\+"' | sed 's/"//g')
        rewrite=$(echo "$changelog" | grep '"rewrite"' | sed 's/.*: \(.*\),*/\1/' | tr -d ' ')

        echo "Version: v$ver"
        echo "Updated: $updated"
        echo "Full Rewrite Required: $rewrite"
        
        FULL_REWRITE=$rewrite
        FULL_REWRITE=$(echo "$FULL_REWRITE" | tr -d '\r' | xargs)
        
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
        echo "[INFO] A backup of your configurations will be created in configurations.bak"
        echo "[WARNING] This update requires a full rewrite of your configurations and project files."
        echo "Would you like to proceed? (y/n)"
        read -r answer
        if [ "$answer" = "y" ]; then
            echo "Backing up old configuration file..."
            cp -r configurations.json configurations.bak
            echo "[INFO] Configuration file backed up in configurations.bak"
            git fetch --all
            git reset --hard origin/main
            cd project_atmospheric_x
            npm install .
        else
            echo "[INFO] Exiting updater..."
            exit 0
        fi
    else
        echo "[INFO] Updating files..."
        git fetch --all
        files_to_update=$(git diff --name-only origin/main | grep -v -E 'update\.sh|configurations\.bak|configurations\.json')
        for file in $files_to_update; do
            echo "Updating $file..."
            git checkout origin/main -- "$file"
        done
        cd project_atmospheric_x
        npm install .
    fi
    echo "[INFO] Update complete. Please restart the application to apply changes."
}

# Run the update process
fetch_changelogs "$VERSION"
check_skipped_update "$VERSION"
commit_update

read -p "Press enter to continue..."
