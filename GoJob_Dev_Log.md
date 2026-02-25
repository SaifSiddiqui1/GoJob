# JobVault — Full Development Session Log
> All changes, fixes, and features built across this conversation.

---

## 🏗️ Project Overview

**JobVault** is an AI-powered SaaS platform featuring:
- ATS-friendly resume builder with 12 professional templates
- Job aggregation from external APIs (Adzuna, Remotive, RemoteOK, Arbeitnow)
- AI integrations (Gemini 1.5 Flash)
- Authentication via Email/OTP, Google OAuth, GitHub OAuth
- Admin panel for job moderation and user management

**Stack:** MERN (MongoDB Atlas, Express, React 18 + Vite, Node.js)

---

## ✅ Part 1 — Backend Fixes

### MongoDB Connection
- Fixed DNS resolution errors by forcing Node.js to use Google DNS (`8.8.8.8`)
- Corrected MongoDB URI format: `mongodb+srv://.../jobvault?appName=Cluster0`
- Added retry logic for connection failures
- Fixed syntax error in `fetchJobs.js`

### Resume Routes (`server/src/routes/resume.js`)
- Replaced Puppeteer PDF generation with browser **print-to-PDF** approach
  - Route now returns a print-ready HTML page with `window.print()` auto-trigger
  - User saves as PDF via browser's Ctrl+P dialog
- Fixed `/upload` route to return `resume._id` (was causing "Cannot read _id" error)
- Increased free download limit from **2 → 20**
- Integrated `generateTemplateHTML()` from new server-side template service

### AI Service (`server/src/services/aiService.js`)
- Fixed Gemini API: switched from `gemini-2.0-flash` (quota=0) to `gemini-1.5-flash` on `v1beta` endpoint (1500 req/day free)

### Job Aggregator (`server/src/services/jobAggregator.js`)
- **Fixed Adzuna 400 error:**
  - Removed invalid `content_type` URL parameter
  - Added proper `Accept: application/json` header
  - Switched from `/in/` (India, unreliable) → `/gb/` (UK) with `/us/` fallback
  - Added per-country success logging
- Sources: Adzuna, Remotive, RemoteOK, Arbeitnow

### Resume Templates Service (`server/src/services/resumeTemplates.js`)
- Created **new server-side CommonJS template engine**
- 12 templates with distinct HTML structure generators:
  1. **Classic** — Black/White serif, single column
  2. **Modern** — Blue accents, single column
  3. **Executive** — Navy serif, formal header
  4. **StandOut** — Dark navy left sidebar
  5. **Professional** — Grey left sidebar
  6. **Creative** — Pink/fuchsia left sidebar
  7. **Eloquent** — Purple serif, centered
  8. **Maverick** — Bold black header + two-column
  9. **Trailblazer** — Maroon right sidebar
  10. **Artistic** — Burnt orange, warm background
  11. **Dynamic** — Bold blue wide left sidebar
  12. **Minimal** — Mint green accents, airy

### Admin Routes (`server/src/routes/admin.js`)
- Already had: `GET/POST/PUT/DELETE /admin/jobs`, approve/reject workflow
- `POST /admin/jobs/fetch` — manually triggers Adzuna fetch

---

## ✅ Part 2 — Authentication Fixes

### OAuth (`server/src/routes/auth.js`)
- Added `prompt=select_account` to Google OAuth (forces account picker)
- Added `allow_signup=true` to GitHub OAuth
- Fixed `redirect_uri_mismatch` for Google (needed `http://localhost:5000/api/auth/google/callback` in Cloud Console)

### OTP System
- Implemented OTP for signup email verification
- Implemented OTP for password reset flow
- Auto-logs OTP to server console in development mode for easy testing

### Login Fixes
- Resolved "Invalid credentials" for OAuth users
- Fixed `LoginPage` and `SignupPage` to use static imports for `authStore`

---

## ✅ Part 3 — Frontend: Resume Builder

### ResumeBuilderPage.jsx — Complete Rebuild

**Two-pane layout (like bettercv.com):**
- **Left (44%)** — Scrollable form: template picker + all sections
- **Right (56%)** — Live A4 iframe preview that updates as you type

**Template Picker:**
- 3×4 grid of cards showing **real scaled-down iframe thumbnails** of each template
- Each thumbnail renders actual template HTML with sample data (Alex Johnson)
- Selected template shows blue border + checkmark
- Switching template instantly updates the main preview

**Form sections (collapsible):**
- Personal Information (name, email, phone, location, LinkedIn, GitHub, summary + AI generate button)
- Experience (with current role checkbox, MM/YYYY date inputs)
- Education (with grade/CGPA field)
- Skills (tag-based input per group)

**Live Preview:**
- `<iframe srcDoc={generateTemplateHTML(resume, templateId)}>` — updates every render
- Shows correct structural layout per template (sidebar position, header style)
- A4 dimensions: 794×1123px
- Green pulse dot + template name in preview header

### SkillTagInput Component Bug Fixes
- **Bug 1:** All skill groups shared `id="skill-tag-input"` → typing always went to first group
  - **Fix:** Replaced `document.getElementById` with `useRef` per instance
- **Bug 2:** Blank white screen when clicking a skill tag
  - **Fix:** Added missing `useRef` to React import

---

## ✅ Part 4 — Resume Templates (Client)

### `client/src/utils/resumeTemplates.js`
- Defined `TEMPLATES` array (12 entries with id, name, desc, colors, layout)
- Added `SAMPLE_RESUME` with realistic placeholder data (Alex Johnson)
- `generateTemplateHTML(resume, templateId, { preview })`:
  - `preview: false` (default) → includes print bar with "Save as PDF" button
  - `preview: true` → no print bar, renders cleanly from top (for thumbnails)
- Exported `TEMPLATE_PREVIEWS` — pre-generated HTML map for all 12 templates (used as thumbnail srcDoc)

---

## ✅ Part 5 — Profile Page Fixes

### ProfilePage.jsx
- Fixed gender dropdown display
- Fixed file input overlay covering entire page
  - **Root cause:** Absolute-positioned input without relative parent
  - **Fix:** Wrapped in `<label>` with `position: relative` + `overflow: hidden`, input uses `sr-only`
- Added resume upload section to profile

---

## ✅ Part 6 — Admin Panel

### AdminLoginPage.jsx (NEW)
- **URL:** `/admin/login`
- Dark professional design: black background, grid pattern, red shield icon
- Validates credentials → checks `user.role === 'admin'`
- Non-admin accounts: "Access denied. This portal is for administrators only."
- Link back to regular login

### App.jsx Route Changes
- Added `/admin/login` as public route
- `AdminRoute` guard now redirects to `/admin/login` instead of `/login`

### AdminJobs.jsx
- Approve/Reject/Delete job cards
- "Fetch New Jobs" button → calls `POST /api/admin/jobs/fetch`
- Status tabs: pending / approved / rejected / all
- Pagination

---

## ✅ Part 7 — Other UI Fixes

### Settings Page
- Simplified language selection
- Dark Mode toggle (functional)
- Job Alerts toggle

### Dashboard
- Premium upgrade modal on "Upgrade to Premium" button

### Downloads
- `ResumePage.jsx` download button opens print-ready HTML in new tab
- Tracks download count via POST then opens tab

---

## 🔑 Environment Variables Required

```env
# server/.env
MONGODB_URI=mongodb+srv://user:pass@cluster.af82v4t.mongodb.net/jobvault?appName=Cluster0
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key

GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

ADZUNA_APP_ID=xxxxxxxx          # ✅ Added and working
ADZUNA_API_KEY=xxxxxxxxxxxxxxxx  # ✅ Added and working

RESEND_API_KEY=xxx               # ⚠️ Free tier: owner email only
FROM_EMAIL=onboarding@resend.dev

CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

---

## 🚨 Known Remaining Issues

| # | Issue | Status |
|---|-------|--------|
| 1 | Resend free tier — emails only go to owner address | ⚠️ Needs domain verification |
| 2 | Cloudinary credentials needed for file uploads | ⚠️ Add to .env |
| 3 | Admin job/study material manual creation form | 🔲 Not yet built |
| 4 | Profile contact number admin approval workflow | 🔲 Not yet built |

---

## 🛠️ How to Run

```bash
# Terminal 1 — Backend
cd E:\Vibe\JobVault\server
node src/app.js

# Terminal 2 — Frontend
cd E:\Vibe\JobVault\client
npm run dev
```

**URLs:**
- App: `http://localhost:5173`
- Admin Panel: `http://localhost:5173/admin/login`
- API: `http://localhost:5000/api`

---

## 👤 Make Account Admin (one-time)

```powershell
cd E:\Vibe\JobVault\server
node -e "require('dotenv').config(); const dns=require('dns'); dns.setServers(['8.8.8.8']); const mongoose=require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(async()=>{ const U=require('./src/models/User'); const u=await U.findOneAndUpdate({email:'YOUR_EMAIL'},{role:'admin'},{new:true}); console.log(u?'Admin set: '+u.email:'Not found'); process.exit(); })"
```

---

*Generated: 2026-02-22 | JobVault Dev Session*
