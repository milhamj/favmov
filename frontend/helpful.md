# Clear build cache
```
rm -rf .expo .expo-shared dist node_modules/.pnpm
pnpm install
pnpm exec expo export -p web
```