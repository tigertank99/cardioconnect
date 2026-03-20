# CardioConnect — Setup Guide

Complete step-by-step guide to deploy your Patient Contact Manager.

**Total time: ~20 minutes**

---

## Step 1: Create a Supabase Account (3 min)

Supabase is a free online database. Think of it as a powerful Google Sheets for your app.

1. Go to **https://supabase.com** and click **Start your project**
2. Sign up with your **GitHub account** or **email**
   - If you don't have GitHub, just use email + password
3. Click **New Project**
   - Organization: your personal org (created automatically)
   - Project name: `cardioconnect`
   - Database password: **save this somewhere safe!**
   - Region: pick **Southeast Asia (Singapore)** for best speed from Kalimantan
4. Wait ~2 minutes for the project to set up

## Step 2: Set Up the Database Tables (3 min)

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open the file `supabase-schema.sql` from this project
4. Copy the entire contents and paste into the SQL Editor
5. Click **Run** (the green play button)
6. You should see "Success. No rows returned" — this means the tables, security policies, and default data are all created

**What this creates:**
- `patients` table — stores patient contact info
- `tags` table — color-coded category tags (10 cardiology defaults pre-loaded)
- `patient_tags` table — links patients to tags
- `templates` table — message templates (4 Indonesian defaults pre-loaded)
- Row Level Security — only logged-in users can access data

## Step 3: Get Your API Keys (1 min)

1. In Supabase dashboard, go to **Settings** → **API** (in left sidebar under Configuration)
2. You need two values:
   - **Project URL** — looks like `https://xxxxx.supabase.co`
   - **anon public key** — a long string starting with `eyJ...`
3. Copy both — you'll need them in Step 5

## Step 4: Create a GitHub Account (skip if you have one)

1. Go to **https://github.com** and sign up
2. This is needed to deploy on Vercel for free

## Step 5: Deploy to Vercel (5 min)

### Option A: Quick Deploy (Recommended)

1. Go to **https://github.com/new** and create a new repository called `cardioconnect`
2. Upload all the project files to this repository:
   - You can use GitHub's web uploader: click **uploading an existing file**
   - Or use Git from terminal (see Option B)
3. Go to **https://vercel.com** and sign in with GitHub
4. Click **Add New** → **Project**
5. Import your `cardioconnect` repository
6. Before deploying, add **Environment Variables**:
   - Click **Environment Variables**
   - Add: `NEXT_PUBLIC_SUPABASE_URL` = your Project URL from Step 3
   - Add: `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key from Step 3
7. Click **Deploy**
8. Wait 1-2 minutes — Vercel will give you a URL like `cardioconnect-xxx.vercel.app`

### Option B: Deploy via Terminal (if you have Node.js)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to the project folder
cd cardioconnect

# Install dependencies
npm install

# Create .env.local with your keys
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL and key

# Test locally
npm run dev
# Open http://localhost:3000

# Deploy
vercel
# Follow prompts, then:
vercel --prod
```

## Step 6: Configure Supabase Auth (2 min)

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL: `https://cardioconnect-xxx.vercel.app`
3. Add to **Redirect URLs**: `https://cardioconnect-xxx.vercel.app/dashboard`
4. Go to **Authentication** → **Providers** → make sure **Email** is enabled

## Step 7: Create Your First Account (1 min)

1. Open your app URL in a browser
2. Click **Need an account? Register**
3. Enter your email and a password (min 6 characters)
4. Check your email for a confirmation link
5. Click the link → you're in!

**For staff accounts:** They go to the same URL and register. All registered users share the same patient database.

---

## Project Structure

```
cardioconnect/
├── app/
│   ├── globals.css          # Global styles + Tailwind
│   ├── layout.js            # Root layout
│   ├── page.js              # Root redirect
│   ├── login/
│   │   └── page.js          # Login/Register page
│   └── dashboard/
│       ├── layout.js        # Dashboard sidebar layout
│       ├── page.js          # Patients list (main page)
│       ├── templates/
│       │   └── page.js      # Message templates manager
│       ├── tags/
│       │   └── page.js      # Tags manager
│       └── data/
│           └── page.js      # Export/Import & data stats
├── lib/
│   ├── supabase.js          # Browser Supabase client
│   └── supabase-server.js   # Server Supabase client
├── middleware.js             # Auth route protection
├── supabase-schema.sql      # Database setup script
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── next.config.js
├── jsconfig.json
├── .env.local.example       # Environment template
└── .gitignore
```

---

## Features

- **Login System** — Email + password auth, staff can register themselves
- **Patient CRUD** — Add, edit, delete patients with full contact details
- **Tags** — Color-coded tags (10 cardiology defaults), filter patients by tags
- **Message Templates** — 4 Indonesian templates pre-loaded, create your own
- **WhatsApp & SMS** — One-click send via wa.me and sms: links
- **Export CSV** — Download patient list for Excel
- **Full Backup** — Export/Import JSON with all data
- **Shared Data** — All staff share the same patient database
- **Mobile Friendly** — Responsive design, works on phone browsers
- **100K+ Capacity** — Supabase free tier supports 500MB

---

## Migrating Data from the Claude Artifact Version

If you've been using the Claude artifact version and have existing patient data:

1. In the artifact version, go to **Data** → **Full Backup (JSON)** to download your data
2. In the new app, go to **Data** → **Load JSON Backup** to import
3. Note: The import will adapt v1 format to the new database structure

---

## Custom Domain (Optional)

Want `patients.yourclinicdomain.com`?

1. In Vercel, go to your project → **Settings** → **Domains**
2. Add your custom domain
3. Follow Vercel's DNS instructions
4. Update Supabase **Site URL** and **Redirect URLs** with the new domain

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid login credentials" | Check email/password, or confirm email first |
| Blank page after login | Check Supabase URL and key in Vercel env variables |
| Can't see patient data | Run the SQL schema script in Step 2 |
| WhatsApp link doesn't work | Works best on mobile; ensure phone has WhatsApp installed |
| Deploy fails on Vercel | Check build logs; usually a missing env variable |

---

## Cost

| Service | Free Tier | Paid (if needed) |
|---------|-----------|-------------------|
| Supabase | 500MB database, 50K monthly active users | From $25/mo |
| Vercel | 100GB bandwidth, unlimited deploys | From $20/mo |
| **Total** | **$0/month** | **$25-45/mo if you outgrow free tier** |

For a single clinic practice, the free tier will last a very long time.
