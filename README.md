# AllCattle Farm - Livestock Management System

A comprehensive multi-tenant livestock monitoring and management platform built with Next.js, TypeScript, and PostgreSQL.

## 🚀 Features

### Core Functionality
- **Multi-tenant Architecture**: Support for multiple tenants, companies, and farms
- **Animal Management**: Track individual animals with comprehensive profiles
- **Health Monitoring**: Monitor animal health with vaccination schedules and treatments
- **Production Tracking**: Track milk production, breeding cycles, and reproductive health
- **Media Management**: Upload and manage photos/videos with S3 storage
- **Role-Based Access Control**: Fine-grained permissions across tenant hierarchy
- **Real-time Analytics**: Comprehensive reporting and farm analytics

### Technical Features
- **Modern Stack**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT sessions
- **File Storage**: AWS S3 compatible storage with signed URLs
- **API**: RESTful APIs with Zod validation
- **Responsive Design**: Mobile-first responsive interface

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Storage**: AWS S3 (or compatible)
- **Deployment**: Vercel, Docker support

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- AWS S3 bucket (or compatible storage)

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd /var/allcattel
npm install
```

### 2. Environment Setup

Copy the environment file and configure your settings:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your database and AWS credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/allcattle"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="ap-southeast-1"
AWS_S3_BUCKET="allcattle-media"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed with demo data
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🔐 Demo Credentials

After seeding, you can log in with:

- **Superadmin**: admin@allcattle.farm / admin123
- **Farm Manager**: manager@greenvalley.farm / admin123

## 🏗 Architecture

### Multi-Tenant Hierarchy

```
Tenant (Organization)
├── Company (Business Unit)
│   ├── Farm (Physical Location)
│   │   ├── Animals
│   │   ├── Measurements
│   │   ├── Health Records
│   │   └── Production Data
│   └── Farm 2...
└── Company 2...
```

### Database Schema

Key entities:
- **Tenants**: Top-level organizations
- **Companies**: Business units within tenants
- **Farms**: Physical farm locations
- **Animals**: Individual livestock with full profiles
- **Measurements**: Weight, height, body measurements
- **Health Events**: Vaccinations, treatments, diagnoses
- **Milk Yield**: Daily milk production records
- **Media**: Photos and videos with S3 storage

### RBAC (Role-Based Access Control)

Roles:
- `SUPERADMIN`: Global system administrator
- `TENANT_ADMIN`: Tenant-level administrator
- `COMPANY_ADMIN`: Company-level administrator
- `FARM_MANAGER`: Farm operations manager
- `ENUMERATOR`: Field data collector
- `VET`: Veterinarian with health access
- `ANALYST`: Read-only analytics access

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Animals
- `GET /api/animals?farmId={id}` - List animals
- `POST /api/animals` - Create new animal
- `GET /api/animals/{id}` - Get animal details
- `PUT /api/animals/{id}` - Update animal
- `DELETE /api/animals/{id}` - Delete animal

### Measurements
- `GET /api/animals/{id}/measurements` - Animal measurements
- `POST /api/animals/{id}/measurements` - Add measurement

### Health
- `GET /api/animals/{id}/health` - Health records
- `POST /api/animals/{id}/health` - Add health event

### Production
- `GET /api/animals/{id}/milk` - Milk production records
- `POST /api/animals/{id}/milk` - Add milk yield

### Media
- `POST /api/animals/{id}/media` - Get signed upload URL
- `GET /api/animals/{id}/media` - List animal media

## 🔧 Development

### Database Operations

```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma db push --force-reset

# Generate migrations
npx prisma migrate dev --name init
```

### Code Quality

```bash
# Lint code
npm run lint

# Type checking
npx tsc --noEmit
```

## 📂 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   └── layout.tsx         # Root layout
├── components/            # React components
│   └── ui/               # shadcn/ui components
└── lib/                  # Utilities and configurations
    ├── auth.ts           # NextAuth configuration
    ├── prisma.ts         # Database client
    ├── rbac.ts           # Role-based access control
    ├── s3.ts             # AWS S3 utilities
    ├── utils.ts          # General utilities
    └── validations.ts    # Zod schemas
```

## 🌟 Key Features Implementation

### 1. Multi-tenant Data Isolation
- Tenant ID embedded in all data queries
- Row-level security with Prisma
- Context switching in UI

### 2. Media Management
- Direct S3 uploads with signed URLs
- Image resizing and video transcoding
- CDN delivery with secure access

### 3. Real-time Updates
- WebSocket integration for live data
- MQTT support for IoT devices
- Background job processing

### 4. Analytics & Reporting
- Production metrics and KPIs
- Health trend analysis
- Farm performance dashboards

## 🚀 Deployment

### Docker

```bash
# Build image
docker build -t allcattle-farm .

# Run container
docker run -p 3000:3000 allcattle-farm
```

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions:
- Email: support@allcattle.farm
- Documentation: [docs.allcattle.farm](https://docs.allcattle.farm)
- Issues: [GitHub Issues](https://github.com/qobear/alcattel/issues)
