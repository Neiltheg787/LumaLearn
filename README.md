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
BUTTERBASE_APP_ID=app_f7a779663k7k
```

Do not prefix private keys with `VITE_` or `NEXT_PUBLIC_`. The browser only calls local `/api/*` routes; external services are contacted by server-side route handlers.

Optional provider hosts may be set if your EverOS or Butterbase dashboard gives a project-specific API URL:

```bash
EVEROS_API_BASE_URL=
BUTTERBASE_API_BASE_URL=https://api.butterbase.ai/v1/app_f7a779663k7k
```

## EverOS memory

EverOS is used as the long-term student memory layer. The server-only adapter in `lib/everos.ts` exposes:

- `createStudentMemory()`
- `retrieveRelevantMemories()`
- `saveLessonMemory()`
- `updateMasteryMemory()`

When a lesson starts, `/api/tutor/respond` retrieves relevant EverOS memories and injects a memory summary into the Gemini tutoring prompt. Lesson completion and mastery updates write back to EverOS. If EverOS is unavailable, tutoring continues with no crash and the UI uses cached memory context.

## Butterbase backend

Butterbase is the primary persistent backend. The connected MCP provisioned the available app `app_f7a779663k7k` with the verified API base `https://api.butterbase.ai/v1/app_f7a779663k7k`. The account plan allowed only one app, so the existing Butterbase app was selected for LumaLearn.

The server-only adapter in `lib/butterbase.ts` uses Butterbase's auto-generated REST table API. Butterbase requires lowercase snake_case identifiers, so the LumaLearn resources map to:

- `Students` -> `students`
- `Lessons` -> `lessons`
- `Progress` -> `progress`
- `QuizAttempts` -> `quiz_attempts`
- `Scans` -> `scans`
- `Achievements` -> `achievements`
- `Leaderboard` -> `leaderboard`

Required production variables:

```bash
BUTTERBASE_API_KEY=
BUTTERBASE_APP_ID=app_f7a779663k7k
BUTTERBASE_API_BASE_URL=https://api.butterbase.ai/v1/app_f7a779663k7k
```

Do not expose `BUTTERBASE_API_KEY` through `NEXT_PUBLIC_` variables. The frontend never calls Butterbase directly. It reads dashboard data from `/api/dashboard`, writes scans via `/api/analyze-page`, writes progress via `/api/progress/update`, and completes lessons through `/api/lesson/complete`.

After adding Butterbase environment variables, run this to verify server configuration:

```bash
curl -X POST https://YOUR_VERCEL_DOMAIN/api/butterbase/setup
```

Lesson completion is idempotent by `progress.id = studentId:lessonId`. A duplicate completion updates progress metadata but does not add points or create a second achievement.

If Butterbase is unavailable, `/api/dashboard` returns cached demo data with a fallback warning instead of leaving the app blank.

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

- `/api/dashboard`: reads student streaks, points, mastery, scans, recommendations, and lessons from Butterbase with cached fallback.
- `/api/analyze-page`: returns Gemini analysis when `GEMINI_API_KEY` is set and stores scan metadata in Butterbase.
- `/api/tutor/respond`: retrieves EverOS memory, injects it into Gemini context, evaluates answers server-side, and falls back safely.
- `/api/memory/retrieve` and `/api/memory/save`: read and write EverOS student memories.
- `/api/progress/update`: calculates mastery deterministically, saves progress to Butterbase, and records mastery changes in EverOS.
- `/api/lesson/complete`: persists completed lesson, quiz attempt, achievement, leaderboard update, and EverOS lesson memory.
- `/api/butterbase/setup`: creates or verifies Butterbase collections server-side.

If an API route fails in production, confirm the environment variables are present in Vercel and redeploy. Never place private keys in browser-visible variables.

## Secret verification

Run this before deployment:

```bash
rg "GEMINI_API_KEY|EVEROS_API_KEY|BUTTERBASE_API_KEY|VITE_|NEXT_PUBLIC_" .
```

Private keys should only appear in server route code, README instructions, and `.env.example`, never in client components or bundled public assets.
