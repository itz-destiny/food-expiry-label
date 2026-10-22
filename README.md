# LabelCheck

**Intelligent Food Label Verification and Consumer Awareness System.**

Shoppers search, scan or photograph a packaged food product and get one clear answer, based on four checks:

1. **Is the expiry date valid?** Expired, missing or unreadable dates fail. Dates within 30 days of expiry are flagged as "approaching expiry".
2. **Is the product in the database?** The product is matched by barcode, NAFDAC number or name against the product registry.
3. **Is the NAFDAC registration number present?** It must be printed, correctly formatted (e.g. `A1-1234`) and match the registered number.
4. **Has the product been reported as suspicious?** Open consumer reports and regulator-confirmed cases are checked.

The result is one of five verdicts: **valid**, **approaching expiry**, **invalid**, **not found** or **suspicious**.

| Page | What it does |
| --- | --- |
| `/` | Landing page, including a scroll-through of the four checks |
| `/verify` | Search by name, NAFDAC number or barcode, **scan a barcode** with the camera, or **verify from a photo** of the label (AI reads the name, barcode, NAFDAC number and expiry date) |
| `/report` | Submit a suspicious product with photo evidence, location and time. The photo is analysed by AI. Requires an account. |
| `/awareness` | Food-safety tips, plus alerts for products confirmed suspicious by an admin |
| `/admin` | Admin/regulator dashboard: review reports and evidence, update their status, record actions taken, see trends, manage the product registry |

## Tech stack

- **Next.js 15** (App Router), React 18, TypeScript, Tailwind CSS, Motion
- **Supabase**: authentication, Postgres with row-level security, private storage for evidence photos
- **Google Gemini** through Genkit, used to read label photos and analyse report photos
- **ZXing** for barcode scanning in every browser
- **Playwright** for end-to-end tests

---

## Setting it up

### 1. What you need

- **Node.js 22 or newer** and npm ([nodejs.org](https://nodejs.org)). Check with `node -v`.
- **Git**
- A free **Supabase** account: [supabase.com](https://supabase.com)
- A free **Google AI Studio** API key for Gemini: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- (Optional, for hosting) a **Vercel** account: [vercel.com](https://vercel.com)

### 2. Get the code

```bash
git clone https://github.com/itz-destiny/food-expiry-label.git
cd food-expiry-label
npm install
```

### 3. Create the Supabase database

1. In the Supabase dashboard, click **New project**. Choose a name, a database password and a region close to your users, then wait for it to finish starting.
2. Open **SQL Editor → New query** and run these files from the repo **in this order**. For each one, paste the whole file and click **Run**:
   1. `supabase/migrations/20261022080500_init_labelcheck.sql` creates the tables, security rules, evidence storage bucket and helper functions.
   2. `supabase/migrations/20261022081000_private_is_admin.sql` hides the admin check from the public API.
   3. `supabase/seed.sql` adds 8 **sample** products so you can try the app straight away. These products are invented; replace them with real registry data before real use.

   <details><summary>Prefer the Supabase CLI?</summary>

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```
   Then run `supabase/seed.sql` in the SQL Editor.
   </details>

3. Open **Project Settings → API keys** (or **Connect**) and copy:
   - the **Project URL** (`https://xxxx.supabase.co`)
   - the **publishable key** (`sb_publishable_…`). The older **anon** key also works.

   Never use the `service_role` / secret key in this app.

### 4. Add your environment variables

Copy the example file and fill it in:

```bash
cp .env.example .env.local
```

| Variable | Where to get it | Required |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → publishable (or anon) key | Yes |
| `GOOGLE_GENAI_API_KEY` | Google AI Studio → API key | For photo reading and AI analysis |

`.env.local` is ignored by git, so never commit your keys. Without the Gemini key the app still works, but "Verify from a photo" and the AI analysis on reports are switched off.

### 5. Run it

```bash
npm run dev
```

Open **http://localhost:9002**. On the **Verify** page, try typing `Tropika` or the barcode `6150000000051`.

> The camera only works on `localhost` or over **HTTPS**. To test scanning on your phone, use the deployed site (step 8), because a plain `http://` network address won't get camera access.

### 6. Set up sign-up emails

In Supabase, open **Authentication → URL Configuration** and set:

- **Site URL**: `http://localhost:9002` while developing, or your live URL once deployed
- **Redirect URLs**: add `http://localhost:9002/**`, plus your live URL with `/**` on the end

Otherwise the confirmation link in sign-up emails won't bring people back to the app.

### 7. Make yourself an admin

1. Sign up on the site and confirm your email.
2. In Supabase, open **Table Editor → profiles**, find your row and change `role` from `consumer` to `admin`.
3. Refresh the site. **Dashboard** (`/admin`) now opens for you.

New sign-ups are always consumers. Only someone with access to the Supabase dashboard can make an admin, and users cannot promote themselves.

### 8. Deploy to Vercel (automatic deploys from GitHub)

1. Push the code to your own GitHub repository.
2. On [vercel.com/new](https://vercel.com/new), import the repository. Vercel detects Next.js; keep the default settings.
3. Under **Environment Variables**, add the same three variables from step 4 for Production, Preview and Development.
4. Click **Deploy**. After that, every push to the main branch deploys automatically.
5. Go back to step 6 and add your `https://….vercel.app` address to Supabase.

If you add or change environment variables later, **redeploy** (Deployments → ⋯ → Redeploy). The `NEXT_PUBLIC_` values are built into the site at build time, so a rebuild is needed to pick them up.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 9002 |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | TypeScript check |
| `npm run test:e2e` | End-to-end tests (see below) |

## Tests

```bash
npx playwright install chrome   # only if Google Chrome isn't installed
npm run test:e2e
```

The suite builds the app and runs it on port 9010. It covers:

- the verification engine's five verdicts
- every page on desktop and mobile
- barcode scanning from a photo and from a simulated camera
- verifying from a label photo, which needs `GOOGLE_GENAI_API_KEY`
- Supabase security rules, checking what an anonymous visitor can and can't do

The **signed-in** tests (submitting a report, the admin review, adding a product) need two existing, email-confirmed accounts, one of which is an admin. Put them in a `.env.test.local` file:

```
E2E_USER_EMAIL=...
E2E_USER_PASSWORD=...
E2E_ADMIN_EMAIL=...
E2E_ADMIN_PASSWORD=...
```

These tests create real rows: one report, which is dismissed at the end, and one product whose name starts with `[E2E]`. Run them against a test project, not production.

## Project structure

```
src/
  app/                pages: /, /verify, /report, /awareness, /admin, /login, /signup
  ai/                 Genkit setup and AI flows (label reading, report photo analysis)
  components/         UI: landing sections, verify workspace, report form, admin dashboard, scanner
  hooks/use-registry  loads products and anonymised report signals
  lib/
    verification.ts   the four checks and verdict logic
    data.ts           Supabase reads and writes
    barcode.ts        barcode scanning (built-in detector or ZXing)
supabase/
  migrations/         database schema and security policies
  seed.sql            sample products
tests/e2e/            Playwright tests and fixtures
```

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "Supabase isn't configured" on the site | The `NEXT_PUBLIC_SUPABASE_*` variables are missing. Add them to `.env.local` locally, or in Vercel, then restart or redeploy. |
| "0 products in the registry" / alerts unavailable | The migrations or `seed.sql` weren't run, or the URL or key is wrong. |
| Vercel build says "Vulnerable version of Next.js detected" | Update Next.js (`npm install next@15`) and push again. |
| Camera doesn't open | Allow camera access in the browser, and use `localhost` or HTTPS. "Scan from photo" and "Verify from a photo" work anywhere. |
| "Couldn't read that label" | Usually a blurry or glare-covered photo, or Gemini is briefly overloaded. The app automatically tries backup models. Retry, or type the details in. |
| Admin dashboard says "isn't an administrator" | Set your `role` to `admin` in the `profiles` table (step 7). |
| Sign-up email link goes to the wrong site | Update **Site URL** and **Redirect URLs** in Supabase (step 6). |
