# RealityCheck AI

**Don't trust the listing. Verify the evidence.**

RealityCheck AI helps second-hand buyers spot misleading seller claims. It reads the
seller's description (and optional listing screenshots), inspects photographs of the
_actual_ product with multimodal AI, and produces a verification report that connects
every claim to the visual evidence — clearly separating:

1. **Supported by visible evidence**
2. **Potential discrepancy**
3. **Cannot be verified**

It never claims a product is genuine from photos, never claims hidden defects are
absent, and always reports confidence and limitations.

---

## Architecture

This implementation is a full-stack **Next.js (App Router) + PostgreSQL (Drizzle ORM)**
application — the MERN-equivalent structure, adapted to the deployment platform:

| Requested (MERN)              | Implemented as                                   |
| ----------------------------- | ------------------------------------------------ |
| Express REST API              | Next.js Route Handlers under `src/app/api/*`     |
| MongoDB + Mongoose models     | PostgreSQL + Drizzle ORM (`src/db/schema.ts`)     |
| React + Vite client           | React 19 + Next.js App Router (same React code)  |
| Multer uploads                | Multipart route handler + validated byte storage |
| Tailwind / Framer Motion etc. | Identical                                        |

Database tables mirror the requested models 1:1:

- **users** — id, name, email (unique, indexed), passwordHash (bcrypt), createdAt
- **verifications** — userId (FK), productName, productCategory, listingUrl,
  sellerDescription, additionalDetails, status, errorMessage, timestamps
- **images** — userId, verificationId (FK, cascade), kind (`listing` | `product`),
  fileName, mimeType, sizeBytes, data (bytea), timestamps, indexed
- **analyses** — verificationId (unique FK), modelUsed, productOverview,
  extractedClaims, visualObservations, comparisons, discrepancies,
  unverifiableClaims, followUpQuestions, overallAssessment, durationMs
- **conversations** — verificationId (unique FK), userId, messages (JSONB), timestamps

## Gemma 4 — the intelligence engine

Analysis runs on **Gemma 4 via the official Gemini API** (`@google/genai` SDK).

- Default model: **`gemma-4-31b-it`** (multimodal: text + image input).
- Alternative verified identifier: `gemma-4-26b-a4b-it`.
- Fully configurable: `GEMMA_MODEL=<model-id>` — nothing is hardcoded.
- If the key is missing, rejected, rate-limited or the model id is unavailable, the API
  returns an explicit error and the UI explains exactly what to fix.
  **No AI results are ever fabricated.**

### The analysis pipeline (`src/server/gemini/`)

Four real model calls, each mapped 1:1 to a visible UI stage (streamed over NDJSON —
stages only complete when the underlying model call finishes):

1. `claimExtractor` — extracts every checkable claim from the seller description and
   listing screenshots.
2. `imageAnalysis` — inspects each product photo for scratches, dents, cracks, screen
   damage, wear, missing parts; identifies product/brand/model when visible.
3. `evidenceComparator` — weighs every claim against the visible observations
   (supported / discrepancy / unverifiable, with confidence + limitations).
4. `reportGenerator` — composes the headline, summary, evidence gaps, buyer guidance,
   caveats and seller questions.

Guardrails are baked into every prompt: photos can never prove authenticity or the
absence of internal defects; missing coverage is reported as a gap, never as a pass.

## Setup

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in:

| Variable         | Purpose                                                    |
| ---------------- | ---------------------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string                               |
| `JWT_SECRET`     | Secret for signing session tokens (required in production) |
| `GEMINI_API_KEY` | Google AI Studio key — https://aistudio.google.com/apikey  |
| `GEMMA_MODEL`    | Optional; defaults to `gemma-4-31b-it`                     |

### 3. Database

Any PostgreSQL instance works (local, Docker, Neon, Supabase…):

```bash
# local example
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app_db postgres:16

# create tables
npx drizzle-kit push
```

### 4. Gemma 4 API

1. Get a free key at <https://aistudio.google.com/apikey>.
2. Put it in `.env` as `GEMINI_API_KEY`.
3. Optionally pin a model with `GEMMA_MODEL` (defaults to `gemma-4-31b-it`).
4. The Settings page shows connection status without ever exposing the key.

### 5. Run

```bash
npm run dev        # development
npm run build && npm run start    # production
```

Open http://localhost:3000 — register, create a verification, upload the seller's
actual product photos, run the analysis.

## API surface

| Method & path                     | Purpose                                       |
| --------------------------------- | --------------------------------------------- |
| `POST /api/auth/register`         | Create account (bcrypt hash, JWT cookie)      |
| `POST /api/auth/login`            | Sign in                                       |
| `POST /api/auth/logout`           | Sign out                                      |
| `GET /api/auth/me` · `PATCH`      | Current session / update profile              |
| `POST /api/auth/password`         | Change password                               |
| `POST /api/uploads`               | Multipart image upload (validated, ≤6 MB each)|
| `GET / DELETE /api/images/:id`    | Serve/remove own images (auth-checked)        |
| `GET / POST /api/verifications`   | List (search, pagination) / create            |
| `GET / DELETE /api/verifications/:id` | Load bundle / delete (cascades)           |
| `POST /api/analysis/:id`          | Run the pipeline — streams NDJSON stage events|
| `GET /api/analysis/:id`           | Fetch a stored report                         |
| `GET / POST /api/assistant/:id`   | Buyer-assistant chat history / ask a question |
| `GET /api/stats`                  | Real dashboard aggregates                     |
| `GET /api/config`                 | AI configuration status (never the key)       |

All private routes enforce session auth and row-level ownership checks; uploads are
type/size validated; analysis and assistant endpoints are rate-limited per user;
passwords are bcrypt-hashed; errors are sanitized (no stack traces leak).

## Project structure

```
src/
  app/
    page.tsx                  Landing
    login/ register/          Auth pages
    app/
      dashboard/              Stats + charts (real DB data)
      new/                    Verification wizard (drag & drop, real progress)
      verify/[id]/            Verification report (claims vs evidence)
      verify/[id]/analyze/    Streaming analysis workspace
      verify/[id]/assistant/  Buyer assistant chat
      history/                Search, paginate, delete
      settings/               Profile, password, AI engine status
    api/                      REST route handlers (see table above)
  components/                 UI system, landing, report, dropzone, charts…
  server/
    auth.ts                   JWT sessions (jose) + bcrypt
    gemini/                   gemma client, prompts, parser, pipeline
    queries.ts                Shared DB queries
    validators.ts             zod schemas
    http.ts rate-limit.ts env.ts images.ts
  db/                         Drizzle schema + client
  lib/                        Shared types, client fetch helpers, formatting
```

## Feature checklist

- [x] Register / login / logout, bcrypt + JWT httpOnly cookie, protected routes
- [x] Dashboard with real aggregate stats, activity chart, claim-outcome donut
- [x] Verification wizard: listing URL **or** screenshots **or** text-only
- [x] Multi-image evidence upload: drag & drop, validation, real progress, remove
- [x] Gemma 4 multimodal pipeline with staged, streamed progress (no fake %)
- [x] Report: product overview, claims × evidence comparison cards, discrepancy
      states, confidence meters, limitations, unverifiable claims, seller
      questions (copy), photo evidence lightbox, final assessment + caveats
- [x] Buyer assistant grounded in the report, with honesty guardrails
- [x] History with search, pagination, delete (cascading)
- [x] Settings: profile, password change, AI engine status
- [x] Rate limiting, input validation, ownership checks, sanitized errors

## Known limitations

- The platform could not scrape marketplace pages — and by design we don't pretend to:
  paste the description and/or upload listing screenshots instead.
- Rate limiting is in-memory (single instance). Swap in Redis for multi-instance.
- Uploaded images live in PostgreSQL (`bytea`). For high-volume production, move the
  `images` storage to Cloudinary/S3 behind the existing route — URLs are already
  abstracted through `ImageMeta.url`.
- Removing an image mid-wizard deletes it; uploads abandoned without creating a
  verification are orphaned rows (a periodic cleanup job can prune them).
- Photo analysis only covers what's visible: it cannot prove authenticity, internal
  state, battery cycles or repair history — the report states this for every claim.
- Free-tier Gemini keys have modest rate limits; the app surfaces 429s gracefully with
  retry guidance.
