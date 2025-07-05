cd project_atmospheric_x
npm install .
echo "AtmosphericX dependencies installed successfully. You can now run the project using 'node index.js'."
echo
echo
echo "Do you want to install the latest version of node_characterai to use CharacterAI (Linux installs may have errors)  (Y/n)"
read -r answer
case "$answer" in [Yy]) 
    npm install node_characterai@^2.0.0-beta.10 --no-save;;
esac
exit 0