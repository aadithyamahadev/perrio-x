-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  experiment_group TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Concepts table
CREATE TABLE concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  subject TEXT,
  name TEXT
);

-- Memory parameters table
CREATE TABLE memory_parameters (
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  user_id UUID REFERENCES users(id),
  concept_id UUID REFERENCES concepts(id),
  stability FLOAT DEFAULT 1.0,
  last_review TIMESTAMP,
  PRIMARY KEY (tenant_id, user_id, concept_id)
);

-- Retrieval events table
CREATE TABLE retrieval_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  user_id UUID REFERENCES users(id),
  concept_id UUID REFERENCES concepts(id),
  correct BOOLEAN,
  response_time FLOAT,
  created_at TIMESTAMP DEFAULT now()
);

-- Indexes for retrieval_events
CREATE INDEX idx_retrieval_events_user_id ON retrieval_events(user_id);
CREATE INDEX idx_retrieval_events_concept_id ON retrieval_events(concept_id);
CREATE INDEX idx_retrieval_events_tenant_id ON retrieval_events(tenant_id);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  concept_id UUID REFERENCES concepts(id),
  question_text TEXT,
  correct_answer TEXT
);

CREATE INDEX idx_questions_concept_id ON questions(concept_id);
CREATE INDEX idx_questions_tenant_id ON questions(tenant_id);

-- Question translations table  (language = 'en' | 'hi' | 'te')
-- English is the canonical source stored in the `questions` table.
-- This table stores only non-English overrides.
CREATE TABLE question_translations (
  tenant_id  UUID  NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  question_id UUID  REFERENCES questions(id) ON DELETE CASCADE,
  language   TEXT  NOT NULL CHECK (language IN ('hi', 'te')),
  question_text TEXT NOT NULL,
  hint       TEXT,
  PRIMARY KEY (tenant_id, question_id, language)
);

CREATE INDEX idx_qtrans_question_id ON question_translations(question_id);
CREATE INDEX idx_qtrans_tenant_lang ON question_translations(tenant_id, language);

ALTER TABLE question_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON question_translations FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::UUID);

-- RLS Policies — tenant isolation on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE retrieval_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Each table is only accessible for matching tenant_id.
-- In production replace these with JWT-claim-based policies.
CREATE POLICY "tenant_isolation" ON users FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID) WITH CHECK (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY "tenant_isolation" ON concepts FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID) WITH CHECK (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY "tenant_isolation" ON memory_parameters FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID) WITH CHECK (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY "tenant_isolation" ON retrieval_events FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID) WITH CHECK (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY "tenant_isolation" ON questions FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID) WITH CHECK (tenant_id = current_setting('app.tenant_id')::UUID);

-- Migration from old schema (run on existing DBs):
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
-- ALTER TABLE concepts ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
-- ALTER TABLE questions ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
-- ALTER TABLE retrieval_events ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
-- ALTER TABLE memory_parameters ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
-- ALTER TABLE memory_parameters DROP CONSTRAINT IF EXISTS memory_parameters_pkey;
-- ALTER TABLE memory_parameters ADD PRIMARY KEY (tenant_id, user_id, concept_id);

-- Additive columns (safe on existing DBs)
ALTER TABLE retrieval_events ADD COLUMN IF NOT EXISTS attempt_number INT DEFAULT 1;
ALTER TABLE concepts ADD COLUMN IF NOT EXISTS explanation TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS hint TEXT;
