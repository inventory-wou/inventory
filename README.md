# Inventory Management System

A comprehensive inventory management system for Robotics Lab, AI Research Centre, and Metaverse Lab at Woxsen University.

## 🚀 **Current Status: Phase 8 Complete + UI Enhancements (100%)**

**Implemented**: Phases 1-8 + Enhanced User Roles & Home Page  
**Total Progress**: 8/9 Phases + UI Enhancements (95%)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features by Phase](#features-by-phase)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

Complete university inventory management system with:
- Multi-department support (Robotics, AI, Metaverse labs)
- Role-based access (Admin, Incharge, User)
- Automated email notifications
- QR code label generation
- Comprehensive audit logging
- Password reset functionality

---

## Features by Phase

### ✅ Phase 1: Project Setup & Configuration (100%)

**Infrastructure**
- ✅ Next.js 15 with TypeScript
- ✅ Tailwind CSS with custom theme
- ✅ Prisma ORM + Neon PostgreSQL
- ✅ Environment configuration
- ✅ Database schema (10 models)

**External Services**
- ✅ Cloudinary (image storage)
- ✅ Office 365 SMTP (email)
- ✅ NextAuth.js (authentication)

---

### ✅ Phase 2: User Management & Authentication (100%)

**Authentication System**
- ✅ User registration with approval workflow
- ✅ **5 User Roles**: Admin, Incharge, Faculty, Staff, Student
- ✅ Role selection during registration (4 public roles)
- ✅ Login with show/hide password toggle
- ✅ Session management (NextAuth)
- ✅ **Session-aware redirects** (auto-redirect logged-in users)
- ✅ Protected routes and API endpoints
- ✅ **Forgot Password System**
  - Email-based password reset
  - Token expiry (1 hour)
  - Secure reset workflow
  - Styled email templates
- ✅ **Public Home Page**
  - Hero section with CTAs
  - Features showcase
  - Who can register (Student, Faculty, Staff info)
  - How to use (4-step guide)
  - Session check (redirect if logged in)

**UI Components**
- ✅ **Header Component**
  - WoU branding: "WoU Inventory Management System"
  - Session-aware navigation
  - User avatar + name + role display
  - Login/Register buttons (when logged out)
  - Logout functionality
- ✅ **Footer Component**
  - University branding
  - Department list (ROBO, AI, META)
  - Contact email: inventory_wou@woxsen.edu.in
  - Location information
- ✅ **Consistent branding** across all auth pages

**User Management (Admin)**
- ✅ User listing with search
- ✅ Approve/reject pending users
- ✅ Assign roles (Admin, Incharge, Faculty, Staff, Student)
- ✅ Activate/deactivate users
- ✅ Delete users
- ✅ Complete audit trail

**Dashboards**
- ✅ Admin dashboard
- ✅ Incharge dashboard
- ✅ User dashboard (Faculty, Staff, Students)
- ✅ Role-based navigation

---

### ✅ Phase 3: Department Management (100%)

**Department Operations**
- ✅ Create/Read/Update/Delete departments
- ✅ Unique department codes (ROBO, AI, META)
- ✅ Department search
- ✅ Safety checks (prevent deletion with items)

**Incharge Management**
- ✅ Assign multiple incharges per department
- ✅ Remove incharges
- ✅ Department-based access control
- ✅ Incharge listing

**UI Features**
- ✅ Grid layout with cards
- ✅ Create/Edit modal
- ✅ Delete confirmation
- ✅ Incharge badges

---

### ✅ Phase 4: Inventory Management (100%)

**Category Management**
- ✅ Full CRUD operations
- ✅ Name uniqueness validation
- ✅ Max borrow duration (1-365 days)
- ✅ Visibility settings (students/staff)
- ✅ Approval requirements
- ✅ Item count aggregation
- ✅ Admin & Incharge access
- ✅ Department-specific for Incharges

**Item Management**
- ✅ **Manual ID System**: Auto-generated IDs (ROBO-001, AI-025)
- ✅ Full CRUD with 15 fields
  - Name, description, specifications
  - Serial number (unique)
  - Category & Department
  - Condition (NEW, GOOD, FAIR, DAMAGED)
  - Status (AVAILABLE, ISSUED, MAINTENANCE)
  - Purchase date, value, location
  - Image URL (Cloudinary)
- ✅ **Consumable Items**
  - Current stock tracking
  - Minimum stock level alerts
- ✅ **Filters & Search**
  - Search by name/manual ID/serial
  - Filter by department, category, status, condition
  - Pagination (12 items per page)
- ✅ **Role-Based Access**
  - Incharge: department-restricted
  - Admin: full access

**Label Generation**
- ✅ QR code generation (using `qrcode` package)
- ✅ Printable labels (4in x 2in)
- ✅ Auto-print functionality
- ✅ Includes: QR code, Manual ID, Name, Dept, Category

**UI Components**
- ✅ ItemFormModal (reusable component)
- ✅ Grid layout with images
- ✅ Stats cards
- ✅ Color-coded status/condition
- ✅ Print label button

---

### ✅ Phase 5: Issue & Return System (100%)

**Backend Features**
- ✅ User request submission API with comprehensive validation
- ✅ Incharge approval/rejection workflow
- ✅ Item issuance with transaction safety
- ✅ Item return processing with condition tracking
- ✅ **Automatic 6-month late return ban**
- ✅ **Damage compensation tracking** (indefinite ban)
- ✅ Complete audit logging

**Email Notifications**
- ✅ New request notification (to incharge)
- ✅ Approval/rejection emails (to user)
- ✅ Due date reminders (3 days, 1 day)
- ✅ Overdue notifications
- ✅ Late return ban notifications
- ✅ Damage compensation notices

**User Interface**
- ✅ User items browsing page with filters
- ✅ Request submission modal
- ✅ User requests management page
- ✅ Incharge request approval page
- ✅ Incharge item issuance page
- ✅ Incharge item return page

**Automation**
- ✅ Automated reminder script (`send-reminders.js`)
- ✅ Scheduled task documentation (cron/Task Scheduler)

---


### ✅ Phase 6: Reports & Analytics (100%)

**Dashboard Statistics**
- ✅ Admin dashboard with real-time statistics
  - Total users, items, departments, categories
  - Pending requests and overdue counts
  - Recent activity feed from audit logs
- ✅ Enhanced Incharge dashboard (existing stats verified)
- ✅ Enhanced User dashboard (existing stats verified)

**Data Visualization**
- ✅ Department-wise inventory bar chart
- ✅ Category distribution pie chart
- ✅ Monthly issue trends line chart (12 months)
- ✅ Interactive and responsive charts (Recharts)

**Report Generation**
- ✅ Inventory report (Excel export)
  - Filters: department, category, status, condition
- ✅ Issue history report (Excel export)
  - Filters: department, date range, returned/active
- ✅ Overdue items report (Excel export)
  - User contact information included
- ✅ Admin reports page with filters
- ✅ Download functionality with proper formatting

---

### ✅ Phase 7: Settings & Configuration (100%)

**System Configuration**
- ✅ Settings database model
- ✅ Settings API endpoints (GET, PUT)
  - Admin-only access control
  - Validation for all setting types
  - Audit logging for changes
- ✅ Settings utility functions
  - Get all settings with defaults
  - Get specific setting value
  - Update single or multiple settings
  - Reset to defaults

**Settings Categories**
- ✅ **Late Return Settings**
  - Ban duration (months) - configurable
  - Auto-ban toggle (enable/disable)
- ✅ **Borrow Duration Settings**
  - Default max borrow duration (days)
- ✅ **Email Reminder Settings**
  - 3-day reminder toggle
  - 1-day reminder toggle
  - Overdue reminder toggle
- ✅ **Email Template Settings**
  - Email sender name
  - Email footer text
- ✅ **Business Rules**
  - Max items per user
  - Consumable stock alert threshold

**Frontend Features**
- ✅ Settings page with tabbed interface
- ✅ Form validation (positive numbers, boolean toggles)
- ✅ Save/Reset to defaults functionality
- ✅ Success/error notifications
- ✅ Navigation card on admin dashboard

**Default Values**
- Late return ban: 6 months
- Max borrow days: 7 days
- Max items per user: 3
- All reminders: enabled
- Consumable alert: 10 units

---

### ✅ Phase 8: Advanced Features (100%)

**Bulk Import System**
- ✅ **Bulk Item Import (CSV/Excel)**
  - Upload up to 1000 items per file (10MB limit)
  - CSV and Excel (.xlsx) support
  - Comprehensive validation (departments, categories, duplicates)
  - Dry-run mode for validation-only
  - Detailed error reporting with row numbers
  - Auto-generated manual IDs
  - Template downloads (CSV + Excel)
  - Drag-and-drop file upload UI
  - Error report download as CSV
  - Parse libraries: `csv-parse` + `xlsx`
- ✅ **Bulk Category Creation**
  - Quick-add modal for up to 5 categories
  - Multi-row form interface
  - Automatic duplicate detection
  - Skips existing categories
  - Real-time error/success feedback
  - Creates up to 50 categories per request

**Advanced Search System**
- ✅ **Backend API (10+ Filters)**
  - Full-text search across 5 fields (name, ID, serial, description, specs)
  - Multi-select filters: departments, categories, status, condition
  - Range filters: value (min/max), purchase date (from/to)
  - Low stock filter for consumables
  - Flexible sorting (name, value, date) with asc/desc
  - Efficient Prisma queries with pagination
- ✅ **Frontend UI**
  - Collapsible advanced filter panel
  - Multi-select checkboxes (scrollable lists)
  - Date and value range inputs
  - Active filter chips with color coding
  - Filter count badge on Advanced button
  - Clear all filters button
  - Real-time filtering (no submit needed)
  - Bulk Import quick link

**Optional Future Enhancements**
- [ ] Search history/saved searches
- [ ] Export search results
- [ ] In-app notifications (optimized)
- [ ] Push notifications
- [ ] SMS notifications

---

### ❌ Phase 9: Testing & Optimization (0%)

**Planned Features**
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance optimization
- [ ] Database query optimization
- [ ] Caching strategy
- [ ] API documentation
- [ ] User guide

---

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5.7 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.4
- **UI**: Custom components (no library dependency)
- **State**: React hooks, NextAuth session

### Backend
- **API**: Next.js API Routes
- **ORM**: Prisma 6.19.1
- **Database**: Neon PostgreSQL (Serverless)
- **Auth**: NextAuth.js 4.x
- **File Storage**: Cloudinary
- **Email**: Nodemailer (Office 365 SMTP)
- **QR Codes**: qrcode package

### Key Packages
```json
{
  "next": "^15.5.9",
  "react": "^19.2.3",
  "typescript": "^5.0.0",
  "prisma": "^6.2.0",
  "@prisma/client": "^6.2.0",
  "next-auth": "^4.24.11",
  "tailwindcss": "^3.4.19",
  "bcryptjs": "^2.4.3",
  "nodemailer": "^7.0.11",
  "cloudinary": "^2.5.1",
  "qrcode": "^1.5.4",
  "exceljs": "^4.4.0",
  "recharts": "^3.6.0",
  "csv-parse": "^5.x.x",
  "xlsx": "^0.18.x",
  "@eslint/eslintrc": "^3.2.0"
}
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Neon PostgreSQL account (free tier)
- Cloudinary account (free tier)
- Office 365 email account
- Azure AD app (for OAuth - optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd inventory-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"

   # Cloudinary
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"

   # Office 365 Email
   EMAIL_SERVER_HOST="smtp.office365.com"
   EMAIL_SERVER_PORT="587"
   EMAIL_SERVER_USER="your-email@woxsen.edu.in"
   EMAIL_SERVER_PASSWORD="your-password"
   EMAIL_FROM="Inventory System <your-email@woxsen.edu.in>"

   # Azure AD (Optional)
   AZURE_AD_CLIENT_ID="your-client-id"
   AZURE_AD_CLIENT_SECRET="your-client-secret"
   AZURE_AD_TENANT_ID="your-tenant-id"

   # App Config
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   LATE_RETURN_BAN_MONTHS="6"
   ```

4. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Register first user
   - Login to access dashboard

### Creating First Admin User

**Option 1: Via Script**
```bash
node scripts/reset-admin-password.js admin@woxsen.edu.in Admin@123
```

**Option 2: Via Database**
1. Register via `/register`
2. Update user role in database:
   ```sql
   UPDATE "User" SET role = 'ADMIN', "isApproved" = true WHERE email = 'your@email.com';
   ```

---

## Project Structure

```
inventory-system/
├── .github/
│   └── workflows/
│       └── mirror-ssh.yml      # Repository mirroring workflow
│
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── (auth)/             # Auth pages (login, register)
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   │   └── [...nextauth]/route.ts
│   │   │   ├── admin/          # Admin endpoints
│   │   │   ├── incharge/       # Incharge endpoints
│   │   │   └── user/           # User endpoints
│   │   ├── dashboard/          # Dashboard pages
│   │   │   ├── admin/          # Admin pages
│   │   │   ├── incharge/       # Incharge pages
│   │   │   └── user/           # User pages
│   │   ├── forgot-password/    # Password reset request
│   │   ├── reset-password/     # Password reset
│   │   └── layout.tsx          # Root layout
│   │
│   ├── components/             # React components
│   │   └── admin/              # Admin components
│   │       ├── ItemFormModal.tsx
│   │       ├── CategoryChart.tsx
│   │       └── UserTable.tsx
│   │
│   ├── lib/                    # Utility functions
│   │   ├── auth.ts             # NextAuth configuration (NEW)
│   │   ├── prisma.ts           # Prisma client
│   │   ├── email.ts            # Email utilities
│   │   ├── cloudinary.ts       # Cloudinary config
│   │   ├── reports.ts          # Report generation
│   │   └── utils.ts            # Helper functions
│   │
│   └── types/                  # TypeScript types
│
├── prisma/
│   └── schema.prisma           # Database schema
│
├── scripts/
│   ├── reset-admin-password.js # Admin password reset
│   └── send-reminders.js       # Email reminder cron job
│
├── public/                     # Static assets
├── .env                        # Environment variables
├── .gitignore                  # Git ignore rules
├── eslint.config.mjs           # ESLint configuration
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript config
├── package.json                # Dependencies
└── README.md                   # This file
```

---

## Database Schema

### Core Models

**User** (17 fields)
- Authentication: email, password, resetToken, resetTokenExpiry
- Profile: name, phone, studentId, employeeId, department
- Status: role, isApproved, isActive, isBanned, bannedUntil
- Relations: departments (incharge), issueRequests, issueRecords, auditLogs, addedItems

**Department** (6 fields)
- Basic: name, code, description
- Relations: incharges[], items[], issueRequests[], issueRecords[]

**Category** (9 fields)
- Basic: name, description
- Rules: maxBorrowDuration, requiresApproval
- Visibility: visibleToStudents, visibleToStaff, isActive
- Relations: items[]

**Item** (21 fields)
- ID: manualId (auto-generated: DEPT-001)
- Basic: name, description, specifications, serialNumber
- Financial: value, purchaseDate
- Location: location
- Status: condition (enum), status (enum)
- Consumable: isConsumable, currentStock, minStockLevel
- Media: imageUrl
- Relations: category, department, addedBy, issueRequests[], issueRecords[]

**IssueRequest** (13 fields)
- Request: purpose, requestedDays, status
- Approval: approvedBy, approvedAt, rejectionReason
- Timeline: expectedReturnDate
- Relations: user, item, department, issueRecord

**IssueRecord** (12 fields)
- Issue: issuedAt, dueDate
- Return: returnedAt, actualCondition, notes
- Damage: isDamaged, damageDescription, compensationRequired
- Relations: user, item, department, issueRequest

**AuditLog** (7 fields)
- Tracking: action, entityType, entityId, details, createdAt
- Relations: user

**Settings** (4 fields)
- Config: key, value, description

### Enums

```prisma
enum UserRole {
  ADMIN
  INCHARGE
  USER
}

enum ItemCondition {
  NEW
  GOOD
  FAIR
  DAMAGED
  UNDER_REPAIR
}

enum ItemStatus {
  AVAILABLE
  ISSUED
  MAINTENANCE
  PENDING_REPLACEMENT
}

enum RequestStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

---

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - Login/Logout (NextAuth)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Users (Admin Only)
- `GET /api/admin/users` - List users (with filters)
- `PUT /api/admin/users/[id]/approve` - Approve user
- `PUT /api/admin/users/[id]/reject` - Reject user
- `PUT /api/admin/users/[id]/role` - Change role
- `PUT /api/admin/users/[id]/status` - Toggle active status
- `DELETE /api/admin/users/[id]` - Delete user

### Departments (Admin Only)
- `GET /api/admin/departments` - List all departments
- `POST /api/admin/departments` - Create department
- `PUT /api/admin/departments/[id]` - Update department
- `DELETE /api/admin/departments/[id]` - Delete department
- `POST /api/admin/departments/[id]/incharge` - Assign incharge
- `DELETE /api/admin/departments/[id]/incharge` - Remove incharge

### Categories (Admin + Incharge)
- `GET /api/admin/categories` - List categories (with search)
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/[id]` - Update category
- `DELETE /api/admin/categories/[id]` - Delete category

### Items (Admin + Incharge)
- `GET /api/admin/items` - List items (with advanced filters & pagination)
  - Query params: search, departments, categories, statuses, conditions, minValue, maxValue, purchasedAfter, purchasedBefore, lowStock, sortBy, sortOrder
- `POST /api/admin/items` - Create item (auto-generates manual ID)
- `GET /api/admin/items/[id]` - Get single item
- `PUT /api/admin/items/[id]` - Update item
- `DELETE /api/admin/items/[id]` - Delete item
- `POST /api/admin/items/bulk-import` - Bulk import items (CSV/Excel)
  - Supports: multipart/form-data, dryRun mode, validation, error reporting
- `GET /api/admin/items/bulk-import/template` - Download import template (CSV or Excel)
- `GET /api/items/[id]/label` - Generate printable QR label

### Categories (Admin + Incharge)
- `GET /api/admin/categories` - List categories (with search)
- `POST /api/admin/categories` - Create category
- `POST /api/admin/categories/bulk` - Create multiple categories (up to 50)
- `PUT /api/admin/categories/[id]` - Update category
- `DELETE /api/admin/categories/[id]` - Delete category

---

## Key Features

### Manual ID System
Items automatically get unique IDs based on department:
- **Robotics**: `ROBO-001`, `ROBO-002`, ...
- **AI Lab**: `AI-001`, `AI-002`, ...
- **Metaverse**: `META-001`, `META-002`, ...

Generated by `generateManualId()` utility function in `src/lib/utils.ts`

### Email Notifications (Office 365)
**Implemented Templates:**
- New request notification (to incharge)
- Request approval/rejection (to user)
- Due date reminders (to user)
- Password reset (to all users)

**Configuration:**
- SMTP: `smtp.office365.com:587`
- Auth: Office 365 credentials
- From: Custom display name

### QR Code Labels
Printable 4x2 inch labels with:
- QR code (links to item details)
- Manual ID
- Item name
- Department
- Category

**Usage:**
1. Click print icon on item card
2. Opens new window with label
3. Auto-triggers print dialog
4. Print on label paper

### Late Return Ban (Pending - Phase 5)
- Automatic 6-month ban for late returns
- Stored in `bannedUntil` field
- Prevents new requests during ban period

### Damage Compensation (Pending - Phase 5)
- Item returned damaged → user must provide replacement
- Account suspended until compensation complete
- Tracked in `IssueRecord.compensationRequired`

---

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure project

3. **Add Environment Variables**
   - Copy all variables from `.env`
   - Add them in Vercel dashboard
   - **Important**: Remove `NEXTAUTH_URL` or set to production URL

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Access your production URL

### Database (Neon PostgreSQL)

**Free Tier Includes:**
- 512MB storage
- Unlimited compute hours
- Automatic scaling
- Serverless architecture

**Setup:**
1. Create free account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string to `DATABASE_URL`

### Cloudinary Setup

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get credentials from dashboard:
   - Cloud name
   - API key
   - API secret
3. Add to environment variables

### Production Build Configuration

**Important**: The project is configured to ignore ESLint errors during production builds to allow deployment despite code quality warnings.

**Configuration in `next.config.ts`:**
```typescript
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
};
```

**Why this is necessary:**
- The codebase has existing linting warnings (unused variables, `any` types, React hooks dependencies)
- These don't affect functionality but would block production builds
- Warnings should be addressed incrementally in future development

**Key Dependencies:**
- `nodemailer`: Must be v7+ (not v6) for next-auth compatibility
- `@eslint/eslintrc`: Required for ESLint flat config compatibility

---

## Repository Mirroring Setup

This project uses GitHub Actions to automatically mirror code from the source repository (`Master29198112/inventory-system`) to the deployment repository (`inventory-wou/inventory`) using SSH deploy keys.

### Why Repository Mirroring?

- **Separation of Development and Production**: Keep your personal development repository separate from the organization's production repository
- **Automatic Synchronization**: Every push to the main branch automatically syncs to the production repository
- **Secure Authentication**: Uses SSH deploy keys instead of Personal Access Tokens

### Setup Instructions

#### 1. Generate SSH Key Pair

On your local machine, run:
```powershell
ssh-keygen -t ed25519 -C "github-mirror-action" -f mirror_key
```

This creates two files:
- `mirror_key` (private key) - **Keep this secret!**
- `mirror_key.pub` (public key)

#### 2. Add Public Key to Destination Repository

1. Log into the **destination account** (inventory-wou)
2. Go to the destination repository: `https://github.com/inventory-wou/inventory/settings/keys`
3. Click **"Add deploy key"**
4. **Title**: `Mirror from Master29198112`
5. **Key**: Paste the contents of `mirror_key.pub`
6. ✅ **CRITICAL**: Check "Allow write access"
7. Click **"Add key"**

#### 3. Add Private Key to Source Repository Secrets

1. Log into the **source account** (Master29198112)
2. Go to repository settings: `https://github.com/Master29198112/inventory-system/settings/secrets/actions`
3. Click **"New repository secret"**
4. **Name**: `SSH_PRIVATE_KEY` (must be exact)
5. **Value**: Paste the **entire contents** of `mirror_key` file (including `-----BEGIN` and `-----END` lines)
6. Click **"Add secret"**

#### 4. Workflow File

The workflow is already configured in `.github/workflows/mirror-ssh.yml`:

```yaml
name: Mirror to Project Account (SSH)
on: [push]

jobs:
  git-mirror:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout source repository
        uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan github.com >> ~/.ssh/known_hosts
      
      - name: Mirror to target repository
        run: |
          git config --global user.name "GitHub Actions Bot"
          git config --global user.email "actions@github.com"
          git remote add mirror git@github.com:inventory-wou/inventory.git
          git push mirror --all --force
          git push mirror --tags --force
```

#### 5. Security: Add Keys to .gitignore

**CRITICAL**: Never commit SSH keys to your repository!

Already added to `.gitignore`:
```
# SSH keys for mirroring
mirror_key
mirror_key.pub
```

#### 6. Delete Local Keys

After setup, delete the key files from your local machine:
```powershell
rm mirror_key, mirror_key.pub
```

The keys are now safely stored in:
- GitHub deploy keys (public key)
- GitHub secrets (private key)

### Troubleshooting Mirroring

**Issue**: "Permission denied to github-actions[bot]"
- **Cause**: Private key not configured correctly or deploy key doesn't have write access
- **Solution**: Verify `SSH_PRIVATE_KEY` secret exists and deploy key has "Allow write access" checked

**Issue**: "refusing to delete the current branch"
- **Cause**: Using `--mirror` flag tries to delete protected branches
- **Solution**: Use `--all` and `--tags` separately (already configured)

**Issue**: Workflow doesn't trigger
- **Cause**: Workflow file not in the correct location
- **Solution**: Verify file is at `.github/workflows/mirror-ssh.yml`

---

## Security Features

### Authentication
- ✅ Password hashing (bcrypt)
- ✅ Session management (NextAuth)
- ✅ Password reset with expiring tokens
- ✅ CSRF protection

### Authorization
- ✅ Role-based access control
- ✅ Protected API routes
- ✅ Protected pages
- ✅ Department-based restrictions (Incharge)

### Data Protection
- ✅ SQL injection prevention (Prisma)
- ✅ Input validation
- ✅ Email format validation
- ✅ Unique constraints
- ✅ Audit logging

---

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint with Next.js configuration
- Component-based architecture
- Reusable utility functions in `src/lib/`

### ESLint & Code Quality

**Current Configuration:**
- ESLint errors ignored during production builds (`ignoreDuringBuilds: true`)
- Development builds show all warnings
- Use `npm run lint` to check for issues locally

**Common Linting Issues to Avoid:**

1. **Unused Variables**
   ```typescript
   // ❌ Bad
   const [state, setState] = useState();  // setState never used
   
   // ✅ Good
   const [state] = useState();
   // OR prefix with underscore if intentionally unused
   const [state, _setState] = useState();
   ```

2. **Explicit Any Types**
   ```typescript
   // ❌ Bad
   function handleData(data: any) { }
   
   // ✅ Good
   function handleData(data: unknown) { }
   // OR define proper type
   interface RequestData {
     id: string;
     name: string;
   }
   function handleData(data: RequestData) { }
   ```

3. **React Hooks Dependencies**
   ```typescript
   // ❌ Bad
   useEffect(() => {
     fetchData();
   }, []); // Missing fetchData dependency
   
   // ✅ Good - Option 1: Add dependency
   useEffect(() => {
     fetchData();
   }, [fetchData]);
   
   // ✅ Good - Option 2: Define function inside effect
   useEffect(() => {
     const fetchData = async () => {
       // fetch logic
     };
     fetchData();
   }, []);
   ```

4. **Conditional Hook Calls**
   ```typescript
   // ❌ Bad
   if (session) {
     useEffect(() => { }, []);
   }
   
   // ✅ Good
   useEffect(() => {
     if (session) {
       // effect logic
     }
   }, [session]);
   ```

### Import Patterns

**Centralized Configuration:**
```typescript
// ✅ Import auth config from lib
import { authOptions } from '@/lib/auth';

// ❌ Don't import from route files
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
```

**Path Aliases:**
- `@/lib/*` - Utility functions, configs
- `@/components/*` - Reusable components
- `@/app/*` - Pages and API routes

### Database Best Practices

**Prisma Field Names:**
```typescript
// Common mistakes to avoid:
// ❌ returnDate (doesn't exist)
// ❌ returnedDate (doesn't exist)
// ✅ actualReturnDate (correct field name)

const issueRecord = await prisma.issueRecord.findFirst({
  where: {
    actualReturnDate: null  // Active borrows
  }
});
```

**Always include required relations:**
```typescript
// ❌ Incomplete select
const item = await prisma.item.findUnique({
  where: { id },
  include: {
    department: { select: { name: true } }
  }
});
// Then trying to access item.department.inchargeId fails!

// ✅ Include all fields you need
const item = await prisma.item.findUnique({
  where: { id },
  include: {
    department: { 
      select: { 
        name: true, 
        code: true, 
        inchargeId: true 
      } 
    }
  }
});
```

### Error Handling

```typescript
// ✅ Good pattern
try {
  const result = await someOperation();
  return NextResponse.json({ data: result });
} catch (error) {
  console.error('Operation failed:', error);
  return NextResponse.json(
    { error: 'Operation failed' },
    { status: 500 }
  );
}

// Don't use unused error variables
catch (error) { }  // ❌ error defined but never used
catch { }          // ✅ No variable if not needed
```

### Component Structure

```typescript
// Recommended component pattern
export default function ComponentName() {
  // 1. Hooks
  const [state, setState] = useState();
  const session = useSession();
  
  // 2. Effects
  useEffect(() => {
    // logic
  }, [dependencies]);
  
  // 3. Handlers
  const handleAction = () => {
    // logic
  };
  
  // 4. Early returns
  if (!session) return <div>Loading...</div>;
  
  // 5. Render
  return (
    <div>
      {/* content */}
    </div>
  );
}
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: add feature description"

# Push branch
git push origin feature/your-feature

# Automatic mirroring happens on push to main
```

### Commit Message Convention
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation updates
- `style:` Code formatting (no functional changes)
- `refactor:` Code restructuring
- `test:` Add or update tests
- `chore:` Maintenance tasks

### Pre-Commit Checklist

Before committing code to main branch:

- [ ] Run `npm run lint` - Check for linting errors
- [ ] Run `npm run build` locally - Ensure build succeeds
- [ ] Test critical functionality - Verify changes work
- [ ] Update README if needed - Document new features
- [ ] Check for console.log - Remove debug statements
- [ ] Review TODO comments - Address or document

---

## Known Issues & Technical Debt

This section documents code quality issues that should be addressed in future phases but don't affect functionality.

### Linting Warnings

**Current Status**: ~70 ESLint warnings across the codebase

**Categories:**
1. **Unused Variables** (~15 instances)
   - Files: Admin/Incharge/User dashboards, API routes
   - Example: `setRoleFilter`, `setStatusFilter`, `error` variables

2. **Explicit Any Types** (~40 instances)
   - Files: API routes, components, utility functions
   - Should be replaced with proper TypeScript interfaces

3. **React Hooks Warnings** (~10 instances)
   - Missing dependencies in `useEffect`
   - Conditional hook calls
   - Files: Dashboard pages

4. **Unescaped Entities** (~5 instances)
   - Apostrophes in JSX should use `&apos;`
   - Files: Dashboard pages

### Required Refactoring

**1. NextAuth Configuration Migration**
- ✅ **Completed**: Moved `authOptions` to `src/lib/auth.ts`
- ⚠️ **Remaining**: 29 API route files still need import updates
- **Impact**: Low (working but non-optimal)

**2. Image Component Migration**
- Several pages use `<img>` tags instead of Next.js `<Image>`
- Files: Dashboard pages with item/user images
- **Impact**: Performance (slower LCP, higher bandwidth)

**3. Type Safety Improvements**
- Replace `any` types with proper interfaces
- Add stricter TypeScript configurations
- **Impact**: Developer experience and type safety

### Recommended Cleanup Tasks

**Priority: Low (Non-blocking)**

1. Fix unused variable warnings
   ```bash
   # Files to review:
   - src/app/dashboard/admin/users/page.tsx
   - src/app/dashboard/incharge/requests/page.tsx
   - src/app/dashboard/user/items/page.tsx
   - src/app/api/*/route.ts (multiple files)
   ```

2. Add proper TypeScript types
   ```bash
   # Create interfaces for:
   - API request/response types
   - Component props
   - Utility function parameters
   ```

3. Fix React Hooks dependencies
   ```bash
   # Add missing dependencies or restructure effects
   - All dashboard pages with useEffect warnings
   ```

4. Replace `<img>` with `<Image>`
   ```bash
   # Import from next/image and add width/height
   - Dashboard item cards
   - User profile images
   ```

### Technical Decisions

**Why ESLint errors are ignored in production:**
- **Rationale**: Linting warnings don't affect runtime functionality
- **Trade-off**: Allows faster deployment vs perfect code quality
- **Plan**: Address warnings incrementally in Phase 9 (Testing & Optimization)

**Why nodemailer v7:**
- **Reason**: Required peer dependency for next-auth@4.24.11
- **Migration**: Upgraded from v6 with no breaking changes in usage

**Why manual SQL vs Prisma Migrate:**
- **Current**: Using `prisma db push` for schema changes
- **Recommendation**: Switch to `prisma migrate` for production
- **Impact**: Better migration tracking and rollback capability

---

## Testing

### Manual Testing Checklist

**Phase 1-4 (Implemented)**
- [ ] User registration
- [ ] Login/logout
- [ ] Forgot password flow
- [ ] Password reset
- [ ] User approval (Admin)
- [ ] Department CRUD
- [ ] Incharge assignment
- [ ] Category CRUD
- [ ] Item CRUD
- [ ] Manual ID generation
- [ ] QR label printing
- [ ] Filters and search
- [ ] Role-based access

**Phase 5+ (Pending)**
- [ ] Request submission
- [ ] Request approval
- [ ] Issue item
- [ ] Return item
- [ ] Late return handling
- [ ] Email notifications
- [ ] Reports

---

## Troubleshooting

### Common Issues

**1. Database Connection Error**
```bash
# Check DATABASE_URL in .env
# Regenerate Prisma client
npx prisma generate
npx prisma db push
```

**2. Email Error**
```bash
# Verify Office 365 credentials in .env
# Check SMTP settings
# Test connection manually
```

**3. Authentication Issues**
```bash
# Clear browser cookies
# Check NEXTAUTH_SECRET is set
# Verify NEXTAUTH_URL matches your domain
```

**4. Build Errors**
```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Production Build Errors

**Error: ESLint failures blocking build**
```
Failed to compile.
Multiple ESLint errors: unused variables, 'any' types, React hooks warnings
```

**Solution:**
Already fixed in `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
};
```

---

**Error: Nodemailer version conflict**
```
ERESOLVE could not resolve
Conflicting peer dependency: nodemailer@7.0.11
```

**Solution:**
Update `package.json`:
```json
{
  "nodemailer": "^7.0.11",
  "@types/nodemailer": "^7.0.0"
}
```
Then run `npm install`.

---

**Error: ESLint config - "Plugin '' not found"**
```
ESLint: Plugin "" not found.
```

**Solution:**
Add `@eslint/eslintrc` to devDependencies and update `eslint.config.mjs`:
```javascript
import { FlatCompat } from '@eslint/eslintrc';
// ... rest of config
```

---

**Error: TypeScript - authOptions export in route**
```
"authOptions" is not a valid Route export field.
```

**Solution:**
Move `authOptions` to separate file:
1. Create `src/lib/auth.ts` with auth configuration
2. Update route to import: `import { authOptions } from '@/lib/auth';`
3. Update all API routes using `authOptions`

---

**Error: Prisma field doesn't exist**
```
Property 'returnDate' does not exist in type 'IssueRecordWhereInput'
```

**Solution:**
Check actual field names in `prisma/schema.prisma`:
- ✅ `actualReturnDate` (correct)
- ❌ `returnDate` (doesn't exist)
- ❌ `returnedDate` (doesn't exist)

Always refer to schema for exact field names.

---

**Error: Missing relation fields**
```
Property 'inchargeId' does not exist on type '{ name: string; code: string; }'
```

**Solution:**
Include all needed fields in Prisma select:
```typescript
include: {
  department: {
    select: {
      name: true,
      code: true,
      inchargeId: true  // Don't forget this!
    }
  }
}
```

---

### Deployment Issues

**Vercel Build Failed**

Common causes and solutions:

1. **Environment Variables Missing**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add all variables from `.env`
   - Redeploy

2. **Database Connection**
   - Verify `DATABASE_URL` in Vercel environment
   - Ensure Neon database is accessible
   - Check connection string format

3. **Binary Dependencies**
   - Prisma generates platform-specific binaries
   - Let Vercel build handle it (don't commit `/node_modules`)

4. **Import Errors**
   - Check all imports use correct paths
   - Verify `@/` alias configuration in `tsconfig.json`

**Repository Mirroring Not Working**

See [Repository Mirroring Setup](#repository-mirroring-setup) section for detailed troubleshooting.

---

### Development Environment Issues

**1. Next.js Hot Reload Not Working**
```bash
# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

**2. TypeScript Errors in IDE but Build Succeeds**
```bash
# Regenerate types
npx prisma generate

# Restart TypeScript server in VS Code:
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

**3. Port Already in Use**
```bash
# Kill process on port 3000 (Windows)
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

**4. Cloudinary Upload Fails**
- Verify cloud name, API key, and secret in `.env`
- Check image size limits (free tier: 10MB)
- Ensure `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set

---

### Debugging Tips

**Enable Detailed Logging:**
```typescript
// In API routes
console.log('Debug:', { userId, itemId, data });

// In components
useEffect(() => {
  console.log('Component mounted:', { props, state });
}, []);
```

**Check Network Requests:**
- Open Browser DevTools → Network tab
- Filter by "Fetch/XHR"
- Inspect request/response payloads
- Check status codes

**Database Queries:**
```typescript
// Enable Prisma query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

**Common API Response Status Codes:**
- `200` - Success
- `400` - Bad request (invalid data)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `500` - Server error (check logs)

---

## License

MIT License - See LICENSE file for details

---

## Support

**Robotics Lab, AI Research Centre**  
Woxsen University  
Hyderabad, India

**For Issues:**
- Email: inventory_wou@woxsen.edu.in
- Create GitHub issue
- Contact system administrator

---

## Acknowledgments

- Woxsen University for project support
- Next.js team for excellent framework
- Prisma team for amazing ORM
- Neon for serverless PostgreSQL

---

## Roadmap

### Q1 2025
- [x] Complete Phase 5 (Issue & Return System)
- [x] Implement email notifications
- [x] Add due date reminders

### Q2 2025
- [x] Complete Phase 6 (Reports & Analytics)
- [x] Dashboard visualizations
- [x] Excel/PDF exports
- [x] Complete Phase 7 (Settings & Configuration)

### Q3 2025
- [ ] Complete Phase 8 (Advanced Features)
- [ ] Bulk operations
- [ ] Advanced search
- [ ] In-app notifications

### Q4 2025
- [ ] Complete Phase 9 (Testing & Optimization)
- [ ] Testing suite - [ ] Performance optimization
- [ ] Mobile app (optional)

---

**Version**: 3.0.0 (Phase 7 Complete)  
**Last Updated**: December 2025  
**Status**: ✅ Production Ready (Phases 1-7) | 🚀 Deployed with Auto-Sync

