-- ============================================================================
-- PERRIO-X  —  Multi-tenancy migration
-- ============================================================================
-- Run this ONCE in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/rkpboggxuqhnjbzztmoq/sql/new
--
-- What it does:
--   1. Adds tenant_id (UUID, default 00000000-…) to all 5 existing tables.
--   2. Rebuilds the memory_parameters primary key to include tenant_id.
--   3. Creates the question_translations table.
--   4. Adds missing indexes.
--   5. Makes all tables accessible via the anon key (public_all policy).
--
-- Safe to re-run — every statement uses IF NOT EXISTS / IF EXISTS guards.
-- ============================================================================

-- 1. Add tenant_id columns ------------------------------------------------

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL
    DEFAULT '00000000-0000-0000-0000-000000000000';

ALTER TABLE concepts
  ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL
    DEFAULT '00000000-0000-0000-0000-000000000000';

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL
    DEFAULT '00000000-0000-0000-0000-000000000000';

ALTER TABLE retrieval_events
  ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL
    DEFAULT '00000000-0000-0000-0000-000000000000';

ALTER TABLE memory_parameters
  ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL
    DEFAULT '00000000-0000-0000-0000-000000000000';

-- 2. Rebuild memory_parameters PK to include tenant_id --------------------
-- The old PK is (user_id, concept_id). The code upserts on
-- (tenant_id, user_id, concept_id), so the PK must match.

ALTER TABLE memory_parameters
  DROP CONSTRAINT IF EXISTS memory_parameters_pkey;

ALTER TABLE memory_parameters
  ADD PRIMARY KEY (tenant_id, user_id, concept_id);

-- 3. Create question_translations table -----------------------------------

CREATE TABLE IF NOT EXISTS question_translations (
  tenant_id    UUID  NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  question_id  UUID  NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  language     TEXT  NOT NULL CHECK (language IN ('hi', 'te')),
  question_text TEXT NOT NULL,
  hint         TEXT,
  PRIMARY KEY (tenant_id, question_id, language)
);

-- 4. Indexes --------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_users_tenant
  ON users(tenant_id);

CREATE INDEX IF NOT EXISTS idx_concepts_tenant
  ON concepts(tenant_id);

CREATE INDEX IF NOT EXISTS idx_questions_tenant
  ON questions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_retrieval_events_tenant
  ON retrieval_events(tenant_id);

CREATE INDEX IF NOT EXISTS idx_memory_parameters_tenant
  ON memory_parameters(tenant_id);

CREATE INDEX IF NOT EXISTS idx_qtrans_question_id
  ON question_translations(question_id);

CREATE INDEX IF NOT EXISTS idx_qtrans_tenant_lang
  ON question_translations(tenant_id, language);

-- 5. RLS — allow public (anon key) access --------------------------------
-- Matches the project's existing pattern. Replace with tenant-isolation
-- policies when you add real multi-tenant auth.

ALTER TABLE question_translations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'question_translations' AND policyname = 'public_all'
  ) THEN
    EXECUTE 'CREATE POLICY "public_all" ON question_translations FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ============================================================================
-- Done!  Re-run  node scripts/seed-translations.mjs  to insert demo translations.
-- ============================================================================
