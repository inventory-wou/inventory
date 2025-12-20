# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-20

### Added

#### Phase 1: Project Setup & Configuration
- Next.js 15 project with TypeScript and Tailwind CSS
- Prisma ORM with Neon PostgreSQL integration
- Complete database schema (10 models, 100+ fields)
- Environment configuration with .env support
- Cloudinary integration for image storage
- Office 365 SMTP email integration
- NextAuth.js authentication setup

#### Phase 2: User Management & Authentication
- User registration with approval workflow
- Login system with show/hide password toggle
- Forgot password functionality
  - Email-based password reset
  - Secure token generation (1-hour expiry)
  - Styled email templates
- Admin user management
  - Approve/reject pending users
  - Role assignment (Admin, Incharge, User)
  - Activate/deactivate users
  - Delete users
- Role-based dashboards (Admin, Incharge, User)
- Session management and protected routes
- Complete audit trail for user actions

#### Phase 3: Department Management
- Full CRUD operations for departments
- Unique department codes (ROBO, AI, META)
- Multiple incharge assignment per department
- Department-based access control
- Search and filtering capabilities
- Safety checks to prevent deletion with items

#### Phase 4: Inventory Management
- **Category Management**
  - Full CRUD operations
  - Max borrow duration configuration (1-365 days)
  - Visibility settings (students/staff)
  - Approval requirements
  - Item count aggregation
  - Admin & Incharge access with department restrictions
  
- **Item Management**
  - Automatic manual ID generation (DEPT-001 format)
  - 15 comprehensive fields (name, description, specs, serial, etc.)
  - Condition tracking (NEW, GOOD, FAIR, DAMAGED, UNDER_REPAIR)
  - Status tracking (AVAILABLE, ISSUED, MAINTENANCE, PENDING_REPLACEMENT)
  - Consumable item support with stock tracking
  - Image URL support (Cloudinary)
  - Purchase date and value tracking
  - Role-based access with department restrictions
  
- **Search & Filtering**
  - Search by name, manual ID, serial number
  - Filter by department, category, status, condition
  - Pagination (12 items per page)
  - Stats cards (Total, Available, Issued, Damaged)
  
- **QR Code Label Generation**
  - Printable 4x2 inch labels
  - QR code with item details
  - Includes manual ID, name, department, category
  - Auto-print functionality

- **Reusable Components**
  - ItemFormModal component for create/edit operations
  - Grid layouts with images and placeholders
  - Color-coded status and condition indicators

#### Email System
- Professional HTML email templates
- Password reset emails
- Request notification emails (pending Phase 5)
- Approval/rejection emails (pending Phase 5)
- Due date reminders (pending Phase 5)
- Office 365 SMTP configuration

#### Documentation
- Comprehensive README with phase-by-phase features
- Detailed setup guide (SETUP.md)
- Complete feature verification report
- API documentation
- Database schema documentation
- Contributing guidelines
- MIT License

### Security Features
- Password hashing with bcrypt
- Secure session management
- Password reset with expiring tokens
- Role-based access control
- Protected API routes and pages
- SQL injection prevention (Prisma)
- Input validation on all forms
- Audit logging for all critical actions

### Developer Experience
- TypeScript strict mode
- Tailwind CSS with custom theme
- Reusable utility functions
- Comprehensive .gitignore
- Environment variable templates
- Helper scripts (password reset)
- Database management scripts

## [Unreleased]

### Planned for Future Releases

#### Phase 5: Issue & Return System
- User request submission
- Approval workflow for incharges
- Issue item to user
- Due date calculation
- Return item interface
- Condition verification
- Damage reporting and compensation
- Automatic 6-month late return ban
- Email notification automation

#### Phase 6: Reports & Analytics
- Dashboard analytics and charts
- Department-wise statistics
- Category-wise breakdowns
- Inventory reports (Excel/PDF)
- Issue history reports
- User activity tracking
- Overdue items report

#### Phase 7: Settings & Configuration
- Global settings page
- Configurable late return ban duration
- Max borrow duration settings
- Reminder schedule configuration
- Email template customization
- Business rules management

#### Phase 8: Advanced Features
- Bulk item import (CSV/Excel)
- Bulk category creation
- Advanced search functionality
- In-app notifications
- Push notifications
- SMS notifications (optional)

#### Phase 9: Testing & Optimization
- Unit test suite
- Integration tests
- End-to-end tests
- Performance optimization
- Database query optimization
- Caching strategy
- Complete API documentation
- User and admin guides

---

## Version History

- **1.0.0** (2025-12-20) - Initial release with Phases 1-4 complete
- **0.1.0** (2024-12-17) - Project initialization

---

For upgrade instructions and breaking changes, see [UPGRADING.md](UPGRADING.md).
