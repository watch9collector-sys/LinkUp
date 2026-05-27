This is a [Next.js](https://nextjs.org) app for **LinkUp** (V1 MVP).

## Local development

- **Node:** use **20+** (see `.nvmrc`).
- **Env:** add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
- **Dev server:** `npm run dev` (port **3030**, binds `0.0.0.0` for LAN/mobile). Same as `npm run dev:lan`.
- **Supabase SQL (run in order in SQL Editor):**
  1. `supabase/migrations/20260212160000_linkups_schema.sql`
  2. `supabase/migrations/20260523100000_linkups_coordinates.sql` **(required if Explore/LinkUps error on `latitude` / `longitude`)**
  3. `supabase/migrations/20260518130000_profile_images_storage.sql`
  4. `supabase/migrations/20260523110000_support_requests.sql`
- **Auth redirect URLs (Supabase → Authentication → URL configuration):** add each origin you test from, plus the password reset path:
  - `http://localhost:3030/auth/reset-password`
  - `http://<your-lan-ip>:3030/auth/reset-password` (mobile Safari)
  - `https://<your-production-domain>/auth/reset-password`
  - Optional: set `NEXT_PUBLIC_SITE_URL` in `.env.local` for production email links when not testing from the browser origin.
- **Verify:** `npm run verify:supabase` and `npm run verify:storage`

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3030](http://localhost:3030) on desktop or your Mac’s LAN IP (for example `http://192.168.1.11:3030`) on mobile.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
