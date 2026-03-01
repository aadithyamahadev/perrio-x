-- Migration: add question_translations table
-- Run this once in the Supabase SQL Editor, then run:
--   node scripts/seed-translations.mjs

CREATE TABLE IF NOT EXISTS question_translations (
  tenant_id     UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  question_id   UUID REFERENCES questions(id) ON DELETE CASCADE,
  language      TEXT NOT NULL CHECK (language IN ('hi', 'te')),
  question_text TEXT NOT NULL,
  hint          TEXT,
  PRIMARY KEY (tenant_id, question_id, language)
);

CREATE INDEX IF NOT EXISTS idx_qtrans_question_id
  ON question_translations(question_id);

CREATE INDEX IF NOT EXISTS idx_qtrans_tenant_lang
  ON question_translations(tenant_id, language);

ALTER TABLE question_translations ENABLE ROW LEVEL SECURITY;

-- Allow public read/write (same policy style as other tables in this project)
DROP POLICY IF EXISTS "public_all" ON question_translations;
CREATE POLICY "public_all"
  ON question_translations FOR ALL
  USING (true) WITH CHECK (true);
