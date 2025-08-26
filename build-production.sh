#!/bin/bash

# Pre-deployment Build and Preparation Script
# AllCattle Farm Production Build

set -e

echo "🏗️  AllCattle Farm Production Build"
echo "=================================="
echo ""

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -f "next.config.js" ]]; then
    echo "❌ Not in AllCattle Farm project directory"
    echo "Please run this script from the project root"
    exit 1
fi

echo "📋 Step 1: Environment Preparation"
echo "---------------------------------"

# Check if production environment file exists
if [[ ! -f ".env.production" ]]; then
    echo "❌ .env.production file not found"
    echo "Creating template .env.production file..."
    cp .env.production .env.production.example
    echo "Please edit .env.production with your production values"
    exit 1
fi

echo "✅ Environment file found"

# Validate required environment variables
echo "Validating environment variables..."
source .env.production

required_vars=(
    "NODE_ENV"
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
    "DATABASE_URL"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        missing_vars+=("$var")
    fi
done

if [[ ${#missing_vars[@]} -gt 0 ]]; then
    echo "❌ Missing required environment variables:"
    printf '  %s\n' "${missing_vars[@]}"
    exit 1
fi

echo "✅ Environment variables validated"
echo ""

echo "📋 Step 2: Dependencies Check"
echo "----------------------------"

# Check Node.js version
node_version=$(node --version)
echo "Node.js version: $node_version"

if [[ ! "$node_version" =~ ^v1[89] ]]; then
    echo "⚠️  Recommended Node.js version is 18.x or 19.x"
fi

# Install dependencies
echo "Installing dependencies..."
npm ci --only=production

echo "✅ Dependencies installed"
echo ""

echo "📋 Step 3: Database Schema Validation"
echo "------------------------------------"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Validate database schema
echo "Validating database schema..."
if npx prisma validate; then
    echo "✅ Database schema is valid"
else
    echo "❌ Database schema validation failed"
    exit 1
fi

echo ""

echo "📋 Step 4: TypeScript Compilation"
echo "--------------------------------"

# Type check
echo "Running TypeScript check..."
if npx tsc --noEmit; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    echo "Please fix TypeScript errors before deployment"
    exit 1
fi

echo ""

echo "📋 Step 5: Linting and Code Quality"
echo "----------------------------------"

# Run ESLint
echo "Running ESLint..."
if npm run lint; then
    echo "✅ Linting passed"
else
    echo "⚠️  Linting issues found (non-blocking)"
fi

echo ""

echo "📋 Step 6: Production Build"
echo "--------------------------"

# Clean previous build
echo "Cleaning previous build..."
rm -rf .next

# Build for production
echo "Building for production..."
NODE_ENV=production npm run build

if [[ -d ".next" ]]; then
    echo "✅ Production build successful"
else
    echo "❌ Production build failed"
    exit 1
fi

# Build size analysis
echo ""
echo "Build analysis:"
echo "---------------"
du -sh .next
echo ""
find .next -name "*.js" -type f | wc -l | xargs echo "JavaScript files:"
find .next -name "*.css" -type f | wc -l | xargs echo "CSS files:"
echo ""

echo "📋 Step 7: Build Optimization Check"
echo "----------------------------------"

# Check for build optimization
if [[ -f ".next/BUILD_ID" ]]; then
    build_id=$(cat .next/BUILD_ID)
    echo "Build ID: $build_id"
fi

# Check if static files are generated
if [[ -d ".next/static" ]]; then
    echo "✅ Static files generated"
    static_size=$(du -sh .next/static | cut -f1)
    echo "Static files size: $static_size"
else
    echo "❌ Static files not generated"
fi

echo ""

echo "📋 Step 8: Security Check"
echo "------------------------"

# Check for sensitive files
echo "Checking for sensitive files in build..."
if find .next -name "*.env*" -o -name "*secret*" -o -name "*key*" | grep -q .; then
    echo "⚠️  Sensitive files found in build directory"
    find .next -name "*.env*" -o -name "*secret*" -o -name "*key*"
else
    echo "✅ No sensitive files in build"
fi

echo ""

echo "📋 Step 9: Deployment Package Creation"
echo "-------------------------------------"

# Create deployment package
DEPLOY_DIR="allcattle-deploy-$(date +%Y%m%d_%H%M%S)"
echo "Creating deployment package: $DEPLOY_DIR"

mkdir -p "$DEPLOY_DIR"

# Copy essential files
cp -r .next "$DEPLOY_DIR/"
cp -r public "$DEPLOY_DIR/"
cp -r prisma "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/"
cp next.config.js "$DEPLOY_DIR/"
cp .env.production "$DEPLOY_DIR/.env.local"

# Copy deployment scripts
cp deploy-production.sh "$DEPLOY_DIR/"
cp setup-ssl.sh "$DEPLOY_DIR/"
cp setup-dns.sh "$DEPLOY_DIR/"

# Make scripts executable
chmod +x "$DEPLOY_DIR"/*.sh

# Create deployment info
cat > "$DEPLOY_DIR/DEPLOYMENT_INFO.txt" << EOF
AllCattle Farm Deployment Package
=================================

Build Date: $(date)
Build ID: $(cat .next/BUILD_ID 2>/dev/null || echo "N/A")
Node.js Version: $(node --version)
NPM Version: $(npm --version)

Deployment Instructions:
1. Upload this entire directory to your server
2. Run ./setup-dns.sh to verify DNS configuration
3. Run ./deploy-production.sh to deploy the application
4. Run ./setup-ssl.sh to configure SSL certificate

Files Included:
- .next/ (Next.js build output)
- public/ (Static assets)
- prisma/ (Database schema and client)
- package.json (Dependencies)
- .env.local (Production environment variables)
- Deployment scripts

Server Requirements:
- Node.js 18.x or higher
- PostgreSQL 13.x or higher
- Nginx
- PM2 (for process management)
- Certbot (for SSL certificates)

Domain: allcattle.farm
Server: 139.180.186.21 (Singapore)
EOF

# Create archive
tar -czf "$DEPLOY_DIR.tar.gz" "$DEPLOY_DIR"
deploy_size=$(du -sh "$DEPLOY_DIR.tar.gz" | cut -f1)

echo "✅ Deployment package created: $DEPLOY_DIR.tar.gz ($deploy_size)"
echo ""

echo "📋 Step 10: Pre-deployment Checklist"
echo "------------------------------------"

echo "✅ Production build completed"
echo "✅ TypeScript compilation passed"
echo "✅ Database schema validated"
echo "✅ Deployment package created"
echo ""

echo "🎯 Ready for Deployment!"
echo "======================="
echo ""
echo "📦 Deployment package: $DEPLOY_DIR.tar.gz"
echo "📏 Package size: $deploy_size"
echo ""
echo "🚀 Next Steps:"
echo "1. Verify DNS configuration:"
echo "   ./setup-dns.sh"
echo ""
echo "2. Upload to server:"
echo "   scp $DEPLOY_DIR.tar.gz root@139.180.186.21:/tmp/"
echo ""
echo "3. Deploy on server:"
echo "   ssh root@139.180.186.21"
echo "   cd /tmp && tar -xzf $DEPLOY_DIR.tar.gz"
echo "   cd $DEPLOY_DIR && ./deploy-production.sh"
echo ""
echo "4. Configure SSL:"
echo "   ./setup-ssl.sh"
echo ""
echo "🌐 Final URL: https://allcattle.farm"
echo ""

# Cleanup
read -p "Remove temporary deployment directory? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$DEPLOY_DIR"
    echo "✅ Temporary directory cleaned up"
fi

echo ""
echo "🎉 Pre-deployment preparation complete!"
