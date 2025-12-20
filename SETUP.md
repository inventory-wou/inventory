# Inventory Management System - Setup Guide

## Step 1: Get Neon PostgreSQL Database

1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project named "inventory-system"
4. Copy the connection string from the dashboard
5. Paste it in `.env` file as `DATABASE_URL`

## Step 2: Get Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Go to Dashboard
4. Copy:
   - Cloud Name
   - API Key
   - API Secret
5. Paste them in `.env` file

## Step 3: Set up Azure AD for Office 365 OAuth

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Name: "Inventory Management System"
5. Redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`
6. After creation, copy:
   - Application (client) ID → `AZURE_AD_CLIENT_ID`
   - Directory (tenant) ID → `AZURE_AD_TENANT_ID`
7. Go to "Certificates & secrets" → "New client secret"
8. Copy the secret value → `AZURE_AD_CLIENT_SECRET`

## Step 4: Configure Office 365 Email

1. Use your Woxsen University email (@woxsen.edu.in)
2. Generate an app password (if 2FA is enabled):
   - Go to Office 365 account security
   - Create app password
3. Add to `.env`:
   - `EMAIL_SERVER_USER`: your email
   - `EMAIL_SERVER_PASSWORD`: your password or app password

## Step 5: Generate NextAuth Secret

Run this command:
```bash
openssl rand -base64 32
```

Copy the output to `.env` as `NEXTAUTH_SECRET`

## Step 6: Initialize Database

```bash
npx prisma generate
npx prisma db push
```

## Step 7: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Next Steps

After setup, you'll need to:
1. Create the first admin account
2. Add departments (Robotics Lab, AI Lab, Metaverse Lab)
3. Assign incharges to departments
4. Add categories and items
5. Configure business rules in settings

## Troubleshooting

### Database Connection Issues
- Ensure your Neon PostgreSQL connection string is correct
- Check if your IP is whitelisted (Neon auto-whitelists)

### Email Not Sending
- Verify Office 365 credentials
- Check if app password is needed
- Ensure SMTP settings are correct

### OAuth Issues
- Verify Azure AD redirect URI matches exactly
- Check client ID and secret are correct
- Ensure tenant ID is correct
