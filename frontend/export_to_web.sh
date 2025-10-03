cat '[0] Clearing ./dist folder'
rm -rf ./dist

cat '[1] Building web version'
pnpm exec expo export -p web

cat '[2] Clearing our BE public folder'
rm -rf ../backend/public/*

sleep 1

cat '[3] Copying files to BE public folder'
mv ./dist/* ../backend/public/
