echo '[0] Clearing ./dist folder'
mkdir -p ./dist
rm -rf ./dist

echo '[1] Building web version'
pnpm exec expo export --clear -p web

echo '[2] Clearing our BE public folder'
mkdir -p ../backend/public
rm -rf ../backend/public/*

sleep 1

echo '[3] Copying files to BE public folder'
mv ./dist/* ../backend/public/
