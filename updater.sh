#!/bin/bash
# This makes it easier to update/upgrade AtmosphericX Automatically

KEEP_EXISTING=false

echo "1. FULL UPGRADE"
echo "  Discard local changes and pull new changes from the repository. (Caution: This will discard local changes such as certificates, cache, and configuration settings.)"
echo "2. PARTIAL UPGRADE"
echo "  Keep existing certificates, cache, and configuration settings. (Recommended for most users.)"

read -p "Enter your choice (1 or 2): " choice
if [[ $choice == 2 ]]; then
    KEEP_EXISTING=true
fi

if [[ $KEEP_EXISTING == false ]]; then
    echo "Full update, discarding local changes."
    git stash
    git pull origin main
    git stash pop
    git reset --hard
else 
    echo "Partial update, keeping existing certs, cache, and configuration settings."
    git stash
    git pull origin main
    git stash pop
fi
read -p "Press any key to exit..."