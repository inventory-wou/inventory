# Inventory Management System

A comprehensive inventory management system for Robotics Lab, AI Research Centre, and Metaverse Lab at Woxsen University.

## 🚀 **Current Status: Phase 6 Complete (100%)**

**Implemented**: Phases 1-6 (Complete)  
**Total Progress**: 6/9 Phases (67%)

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
- ✅ Login with show/hide password toggle
- ✅ Session management (NextAuth)
- ✅ Protected routes and API endpoints
- ✅ **Forgot Password System**
  - Email-based password reset
  - Token expiry (1 hour)
  - Secure reset workflow
  - Styled email templates

**User Management (Admin)**
- ✅ User listing with search
- ✅ Approve/reject pending users
- ✅ Assign roles (Admin, Incharge, User)
- ✅ Activate/deactivate users
- ✅ Delete users
- ✅ Complete audit trail

**Dashboards**
- ✅ Admin dashboard
- ✅ Incharge dashboard
- ✅ User dashboard
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

### ❌ Phase 7: Settings & Configuration (0%)

**Planned Features**
- [ ] System settings page
- [ ] Configurable late return ban duration
- [ ] Max borrow duration
- [ ] Reminder schedules
- [ ] Email template customization
- [ ] Business rules configuration

---

### ❌ Phase 8: Advanced Features (0%)

**Planned Features**
- [ ] Bulk item import (CSV/Excel)
- [ ] Bulk category creation
- [ ] Advanced search
- [ ] In-app notifications
- [ ] Push notifications
- [ ] SMS notifications (optional)

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
  "next": "^15.5.7",
  "react": "^19.0.0",
  "typescript": "^5.0.0",
  "prisma": "^6.19.1",
  "@prisma/client": "^6.19.1",
  "next-auth": "^4.24.8",
  "tailwindcss": "^3.4.0",
  "bcryptjs": "^2.4.3",
  "nodemailer": "^6.9.0",
  "cloudinary": "^2.0.0",
  "qrcode": "^1.5.0"
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
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── (auth)/             # Auth pages (login, register)
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   └── admin/          # Admin endpoints
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
│   │       └── ItemFormModal.tsx
│   │
│   ├── lib/                    
# Utility functions
│   │   ├── prisma.ts           # Prisma client
│   │   ├── email.ts            # Email utilities
│   │   ├── cloudinary.ts       # Cloudinary config
│   │   └── utils.ts            # Helper functions
│   │
│   └── types/                  # TypeScript types
│
├── prisma/
│   └── schema.prisma           # Database schema
│
├── scripts/
│   └── reset-admin-password.js # Admin password reset
│
├── public/                     # Static assets
├── .env                        # Environment variables
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript config
└── package.json
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
- `GET /api/admin/items` - List items (with filters & pagination)
- `POST /api/admin/items` - Create item (auto-generates manual ID)
- `GET /api/admin/items/[id]` - Get single item
- `PUT /api/admin/items/[id]` - Update item
- `DELETE /api/admin/items/[id]` - Delete item
- `GET /api/items/[id]/label` - Generate printable QR label

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
- TypeScript strict mode
- ESLint + Prettier
- Component-based architecture
- Reusable utilities

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: add feature description"

# Push and create PR
git push origin feature/your-feature
```

### Commit Messages
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Add tests
- `chore:` Maintenance

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
```

**2. email Error**
```bash
# Verify Office 365 credentials in .env
# Check SMTP settings
# Test with: node scripts/test-email.js
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
rm -rf .next
npm run build
```

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
- [ ] Complete Phase 5 (Issue & Return System)
- [ ] Implement email notifications
- [ ] Add due date reminders

### Q2 2025
- [ ] Complete Phase 6 (Reports & Analytics)
- [ ] Dashboard visualizations
- [ ] Excel/PDF exports

### Q3 2025
- [ ] Settings & configuration
- [ ] Bulk operations
- [ ] Advanced search

### Q4 2025
- [ ] Testing suite
- [ ] Performance optimization
- [ ] Mobile app (optional)

---

**Version**: 1.0.0 (Phase 4 Complete)  
**Last Updated**: December 2025  
**Status**: ✅ Production Ready (Phases 1-4)

