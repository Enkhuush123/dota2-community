#!/bin/bash
echo "Fixing steam-resources for dota2 package..."
rm -rf node_modules/steam-resources
cp -r node_modules/steam/node_modules/steam-resources node_modules/
cd node_modules/steam-resources
npm install protobufjs@4.1.3 --no-save
echo "steam-resources fixed!"
