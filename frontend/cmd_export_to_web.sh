echo '[0] Clearing ./dist folder'
rm -rf ./dist

echo '[1] Building web version'
pnpm exec expo export -p web

echo '[2] Clearing our BE public folder'
rm -rf ../backend/public/*

sleep 1

echo '[3] Copying files to BE public folder'
mv ./dist/* ../backend/public/
