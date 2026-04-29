# LÓNG SHÌ — Catalog

Premium catalog. Browse, choose size, order via WhatsApp.

## Stack

- React 18 + Vite 5 + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (DB + Storage + Auth)

## Local development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Environment variables

Create a `.env` file at the project root:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

## Deploy on Vercel

1. Push the repo to GitHub.
2. Import the project on [vercel.com](https://vercel.com).
3. Framework preset: **Vite**. Build command: `npm run build`. Output: `dist`.
4. Add the env vars above in Vercel → Project Settings → Environment Variables.
5. Deploy.