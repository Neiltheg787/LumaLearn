# LumaLearn

LumaLearn is an AI-powered visual learning prototype for STEM education. It preserves the original ARcademy 3D assets, MindAR targets, and legacy AR pages while adding a Vercel-ready Next.js app with responsive desktop, tablet, and mobile experiences.

## What is included

- Responsive desktop dashboard with sidebar navigation, learning activity, saved scans, mastery, points, and recommendations.
- Camera-first Scan & Explore page with upload fallback, Demo Heart Lesson fallback, WebGL model viewer, QR handoff, and tutor panel.
- Server-side API routes for page analysis, tutor responses, memory save/retrieve, and progress updates.
- Fixed local model whitelist for Gemini selection: `heart`, `bunsen_burner`, `sodium`, `lithium`, `newtons_cradle`, `periodic_table`, `sodium_chloride`, `helium`, and `carbon`.
- Deterministic mastery scoring in application code.
- Demo Mode when Gemini, EverOS, or Butterbase credentials are unavailable.
- Legacy AR page at `/ar.html` using the original A-Frame, AR.js, MindAR, local models, and gesture scripts.

## Local setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

To verify production behavior locally:

```bash
npm run build
npm run start
```

## Environment variables

Create `.env.local` from `.env.example`:

```bash
GEMINI_API_KEY=
EVEROS_API_KEY=
BUTTERBASE_API_KEY=
BUTTERBASE_PROJECT_ID=
```

Do not prefix private keys with `VITE_` or `NEXT_PUBLIC_`. The browser only calls local `/api/*` routes; external services are contacted by server-side route handlers.

## Demo Mode

If any external credential is missing, LumaLearn shows a Demo Mode badge and returns structured fallback data. The heart lesson remains fully demoable:

1. Open `/scan`.
2. Select `Demo Heart Lesson`.
3. Inspect the beating heart model.
4. Answer the tutor question about where deoxygenated blood enters the heart.
5. Review the deterministic mastery and points update.

## Vercel deployment

1. Import `https://github.com/Neiltheg787/LumaLearn` into Vercel.
2. Use the default Next.js framework detection.
3. Add the server-side environment variables listed above in Vercel Project Settings.
4. Deploy with the standard commands:

```bash
npm install
npm run build
```

No custom `vercel.json` is required for this single Next.js project.

## Camera testing

Camera access requires HTTPS in production. Vercel provides HTTPS automatically.

- Desktop: open `/scan`; if camera permission is denied or unavailable, use upload or `Demo Heart Lesson`.
- Mobile Safari or Chrome: open `/scan`, allow camera access, and use the compact scanner/tutor flow.
- Legacy AR: open `/ar.html` for the original MindAR/A-Frame experience.

## Troubleshooting API routes

- `/api/analyze-page`: returns Gemini analysis when `GEMINI_API_KEY` is set; otherwise returns heart demo analysis.
- `/api/tutor/respond`: evaluates answers server-side and returns a Socratic response.
- `/api/memory/retrieve` and `/api/memory/save`: provide the EverOS/Butterbase integration surface and demo responses until credentials are configured.
- `/api/progress/update`: calculates mastery deterministically without relying on an LLM-generated score.

If an API route fails in production, confirm the environment variables are present in Vercel and redeploy. Never place private keys in browser-visible variables.

## Secret verification

Run this before deployment:

```bash
rg "GEMINI_API_KEY|EVEROS_API_KEY|BUTTERBASE_API_KEY|VITE_|NEXT_PUBLIC_" .
```

Private keys should only appear in server route code, README instructions, and `.env.example`, never in client components or bundled public assets.
