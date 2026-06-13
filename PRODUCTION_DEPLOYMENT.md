# CareGrid Production Deployment

This repository contains two deployable applications:

- `client`: React/Vite frontend for Vercel
- `server`: Express API for Render
- MongoDB Atlas: production database

Never commit `.env` files, API keys, Gmail App Passwords, database credentials, or JWT secrets.

## 1. Prepare GitHub

From the repository root:

```bash
git init
git add .
git status
git commit -m "Prepare CareGrid for production"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Before committing, confirm `server/.env`, all `node_modules`, `dist`, and log files do not appear in `git status`.

## 2. Create MongoDB Atlas Database

1. Create an Atlas project and cluster.
2. Create a dedicated database user with a strong generated password and only the permissions required for the CareGrid database.
3. Add Render's outbound IP ranges to Atlas Network Access when your Render plan provides static outbound IPs.
4. If static outbound IPs are unavailable, Atlas may require temporary `0.0.0.0/0` access. Use a strong unique database password and restrict this later.
5. Copy the SRV connection string and include the database name:

```text
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/doctorApp?retryWrites=true&w=majority
```

URL-encode special characters in the database password.

## 3. Deploy Backend on Render

The repository includes `render.yaml`. In Render:

1. Select **New > Blueprint** and connect the GitHub repository.
2. Render detects `render.yaml`.
3. Set every secret marked `sync: false`.
4. Deploy and confirm `https://YOUR-SERVICE.onrender.com/api/health` returns:

```json
{ "success": true, "status": "healthy" }
```

Required Render environment variables:

```text
NODE_ENV=production
MONGO_URI=<MongoDB Atlas SRV URI>
CLIENT_URLS=https://YOUR-PROJECT.vercel.app
JWT_SECRET=<at least 32 random characters>
OPENAI_API_KEY=<secret>
CLOUDINARY_CLOUD_NAME=<secret>
CLOUDINARY_API_KEY=<secret>
CLOUDINARY_API_SECRET=<secret>
EMAIL_USER=<Gmail address>
EMAIL_APP_PASSWORD=<Gmail App Password>
ADMIN_EMAIL=<initial super-admin email>
ADMIN_PASSWORD=<strong initial super-admin password>
```

`ADMIN_EMAIL` and `ADMIN_PASSWORD` create the first admin only when the production database has no admin. After successful creation, remove `ADMIN_PASSWORD` from Render.

Render settings when deploying manually instead of Blueprint:

```text
Root Directory: server
Build Command: npm ci --omit=dev
Start Command: npm start
Health Check Path: /api/health
```

## 4. Deploy Frontend on Vercel

1. Import the same GitHub repository into Vercel.
2. Set **Root Directory** to `client`.
3. Framework preset should detect **Vite**.
4. Add this Vercel environment variable for Production and Preview:

```text
VITE_API_URL=https://YOUR-SERVICE.onrender.com
```

5. Deploy.
6. Copy the final Vercel URL into Render's `CLIENT_URLS`, then redeploy Render.

When using multiple allowed frontends, separate them with commas:

```text
CLIENT_URLS=https://production.vercel.app,https://custom-domain.com
```

## 5. Production Verification

Test these flows after deployment:

1. `/api/health` returns HTTP 200.
2. Doctor registration rejects anything except a 10-digit mobile number.
3. Doctor registration requires email OTP before website creation.
4. Doctor and super-admin login require password followed by OTP.
5. Doctor forgot-password OTP and reset work; old sessions become invalid.
6. Appointment booking appears in doctor and super-admin panels.
7. Unauthorized API requests return 401/403.
8. Requests from an origin not listed in `CLIENT_URLS` are rejected.
9. Image upload, replacement, and discard work.
10. Google Maps directions use clinic name and address.

## 6. Operational Security

- Rotate any secret that has ever been pasted into chat, committed, or shared.
- Enable GitHub secret scanning and branch protection.
- Enable MFA on GitHub, Vercel, Render, MongoDB Atlas, Gmail, Cloudinary, and OpenAI.
- Back up Atlas and monitor database access/activity.
- Review Render and application logs without logging OTPs, passwords, or secrets.
- Run `npm audit --omit=dev` in both `client` and `server` before releases.
- Review OpenAI/data-processing requirements before using patient-related data in production.
