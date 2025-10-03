rm -rf ./dist

pnpm exec expo export -p web

rm -rf ../backend/public/*

sleep 1

mv ./dist/* ../backend/public/
