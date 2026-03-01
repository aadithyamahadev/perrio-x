# PERRIO-X

A spaced-repetition learning system built with **Next.js 16**, **Supabase**, and **TypeScript**.  
PERRIO-X guides learners through a structured cognitive cycle — Prime → Encode → Retrieve — and adapts scheduling based on memory science.

---

## Cognitive Cycle

```
PRIME → ENCODE → RETRIEVE
          ↓          ↓
       (correct)  REFERENCE
          ↓          ↓
      OVERLEARN   (retry)
          ↓
       COMPLETE
```

| Stage | Description |
|-------|-------------|
| **PRIME** | Full primer with examples (100+ words). User reads at their own pace and clicks Continue. |
| **ENCODE** | Concept explanation shown for active study. |
| **RETRIEVE** | Free-text answer question. Answer matching is normalised for spacing, punctuation and capitalisation. |
| **REFERENCE** | Shown after a wrong answer — concept explanation with a retry option. |
| **OVERLEARN** | Extra questions triggered when memory stability exceeds threshold (> 3.0). |
| **COMPLETE** | Summary card showing updated memory stability. |

---

## Experiment Groups

Users are randomly assigned to one of three scheduling strategies on first visit:

| Group | Strategy |
|-------|----------|
| `blocked` | Always reviews concepts from the same subject |
| `static` | Round-robin rotation across subjects |
| `adaptive` | Selects the concept with the lowest predicted recall probability (spaced repetition) |

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: Supabase (PostgreSQL)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Memory model**: Custom stability-based recall probability (SRS)

---

## Project Structure

```
app/
  page.tsx              # Main state-machine router
  api/
    export/route.ts     # Export retrieval data as CSV
    seed/route.ts       # Seed API endpoint
    stats/route.ts      # Per-user stats
components/
  PrimeView.tsx         # Primer display with Continue button
  EncodeView.tsx        # Explanation display
  RetrieveView.tsx      # Answer input
  ReferenceView.tsx     # Wrong-answer reference
  OverlearnView.tsx     # Over-learning questions
  CompleteView.tsx      # Session complete summary
  TopicSelector.tsx     # Topic picker UI
hooks/
  usePerrioStateMachine.ts  # All app logic and state
lib/
  memory.ts             # Recall probability & stability update
  primers.ts            # 100+ word primers with examples per concept
  scheduler.ts          # Blocked / static / adaptive schedulers
  supabase.ts           # Supabase client
  types.ts              # Shared TypeScript types
scripts/
  seed.mjs              # Seed concepts and base questions
  seed-more-questions.mjs  # Add extra questions per concept
  seed-explanations.mjs    # Add explanations to concepts
  seed-hints.mjs           # Add hints to questions
  seed-overlearn.mjs       # Seed overlearn question sets
supabase/
  schema.sql            # Full database schema
```

---

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/aadithyamahadev/perrio.git
cd perrio
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the Supabase SQL editor
3. Copy your project URL and anon key

### 3. Configure environment

Create `.env.local` in the project root with your Supabase keys as before:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Optional text‑to‑speech backends

The application can synthesize audio for prompts using one of several
backends.  The route at `/api/tts` will attempt them in order:

1. **ElevenLabs cloud** – when `ELEVENLABS_API_KEY` is set the code will
   call the ElevenLabs TTS API directly; a small voice map is built in and
   can be extended with the IDs from your dashboard.  This service already
   supports multiple languages, so it often replaces the older local
   servers.
2. **Local Qwen3‑TTS server / sglang** – set `QWEN_TTS_URL` to the address of a
  running local TTS server. You can run the included FastAPI wrapper around
  Qwen3‑TTS (`qwen_tts_server.py`) or use an `sglang`-based server. Example
  sglang command that launches a local HTTP server (adjust paths/flags as
  required for your environment):

```bash
python -m sglang.launch_server \
  --model-path Qwen/Qwen3.5-35B-A3B \
  --port 8000 \
  --tp-size 8 \
  --mem-fraction-static 0.8 \
  --context-length 262144 \
  --reasoning-parser qwen3
```

Then point `QWEN_TTS_URL` at the server's TTS endpoint, for example:

```env
QWEN_TTS_URL=http://127.0.0.1:8000/tts
```
3. **Hugging Face Inference API** – set `HF_TTS_MODEL` and `HF_TOKEN` to
  use any compatible HF audio model (e.g. `tts-perennial/some-model`) as a
  cloud fallback.

For example:

```env
ELEVENLABS_API_KEY=sk_b50194d931d7022a24ed6a66520c95a205a5fcd7b04bf88b
QWEN_TTS_URL=http://127.0.0.1:8001/tts
HF_TTS_MODEL=tts-perennial/mymodel
HF_TOKEN=hf_xxx
```

The previous Coqui XTTS server is no longer shipped with the repository
and its files have been removed, since the cloud providers above cover
the required multilingual behaviour with simpler setup.

### 4. Seed the database

```bash
node scripts/seed.mjs
node scripts/seed-explanations.mjs
node scripts/seed-hints.mjs
node scripts/seed-more-questions.mjs
node scripts/seed-overlearn.mjs
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Schema

| Table | Description |
|-------|-------------|
| `users` | User records with assigned experiment group |
| `concepts` | Learning concepts (subject + name + explanation) |
| `questions` | Questions with correct answers and optional hints |
| `memory_parameters` | Per-user per-concept stability and last review time |
| `retrieval_events` | Full log of every answer attempt |

---

## Deploying

Deploy instantly on [Vercel](https://vercel.com/new):

1. Push to GitHub
2. Import the repo in Vercel
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables
4. Deploy
