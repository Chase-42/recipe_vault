#!/bin/bash

# Fix common linting issues automatically
echo "🔧 Fixing common linting issues..."

# Fix prefer-nullish-coalescing (|| to ??)
echo "📝 Fixing nullish coalescing operators..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/|| ""/\?\? ""/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/|| 0/\?\? 0/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/|| \[\]/\?\? \[\]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/|| {}/\?\? {}/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/|| null/\?\? null/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/|| undefined/\?\? undefined/g'

# Fix no-explicit-any (any to unknown)
echo "📝 Fixing explicit any types..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/: any\b/: unknown/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/\.\.\. any\[\]/\.\.\. unknown\[\]/g'

# Fix unused variables by prefixing with underscore
echo "📝 Fixing unused variables..."
# This is more complex and should be done manually

# Fix floating promises by adding void
echo "📝 Adding void to floating promises..."
# This requires manual inspection as it's context-dependent

echo "✅ Basic linting fixes applied!"
echo "🔍 Run 'npm run lint' to see remaining issues that need manual fixing"
echo "💡 Consider running 'npm run lint:fix' for automatic ESLint fixes"