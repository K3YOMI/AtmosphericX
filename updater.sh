#!/bin/bash

KEEP_EXISTING=false


echo "1. FULL UPGRADE"
echo "  Discard local changes and pull new changes from the repository. (Caution: This will discard local changes such as certificates, cache, and configuration settings.)"
echo "2. PARTIAL UPGRADE"
echo "  Keep existing certificates, cache, and configuration settings. (May Break Structure)"
echo "3. DEPENDENCY UPGRADE"
echo "  Install dependencies (npm install)."
echo "4. INSTALL (GIT)"
echo "  Clone the repository from GitHub."


read -p "Enter your choice (1 or 2): " choice
if [[ $choice == 2 ]]; then
    KEEP_EXISTING=true
fi

if [[ $choice == 3 ]]; then
    cd AtmosphericX
    npm install .
    exit 0
fi

if [[ $choice == 4 ]]; then
    git clone https://github.com/k3yomi/AtmosphericX
    exit 0
fi

if [[ $KEEP_EXISTING == false ]]; then
    echo "Full update, discarding local changes."
    git fetch origin
    git reset --hard origin/main
else 
    echo "Partial update, keeping existing certs, cache, and configuration settings."
    # get the latest main branch and merge it with the current branch
    git fetch origin
    git pull origin main
    echo "Finished fixing conflicts"

 extracted_files=$(git ls-files -- ':!node_modules')
    if [[ -n $extracted_files ]]; then
        echo "Restoring extracted files..."
        for file in $extracted_files; do
            if git diff --quiet -- $file; then
                echo "Restoring $file..."
                if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
                    del "$file"
                else
                    rm "$file"
                fi
            fi
        done
    fi
    missing_files=$(git ls-files --deleted)
    if [[ -n $missing_files ]]; then
        echo "Restoring missing files..."
        git checkout main -- $missing_files
    fi
fi
read -p "Press any key to exit..."
