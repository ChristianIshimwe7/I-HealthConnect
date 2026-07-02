-- I-HealthConnect PostgreSQL Schema
-- Run: psql -U postgres -d ihealthconnect -f src/db/schema.sql

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('doctor','supervisor','coordinator','admin','chw')),
  district      TEXT NOT NULL DEFAULT 'Kigali',
  sector        TEXT,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Patients ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chw_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  age              INTEGER NOT NULL CHECK (age BETWEEN 10 AND 60),
  gravida          INTEGER NOT NULL CHECK (gravida >= 1),
  parity           INTEGER NOT NULL DEFAULT 0 CHECK (parity >= 0),
  gestational_age  INTEGER NOT NULL CHECK (gestational_age BETWEEN 4 AND 42),
  district         TEXT NOT NULL DEFAULT 'Kigali',
  sector           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at        TIMESTAMPTZ
);

-- ── Visits ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  chw_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  systolic_bp     NUMERIC(5,1) NOT NULL,
  diastolic_bp    NUMERIC(5,1) NOT NULL,
  fundal_height   NUMERIC(5,1) NOT NULL,
  glucose         NUMERIC(6,1) NOT NULL,
  hemoglobin      NUMERIC(4,1) NOT NULL,
  weight          NUMERIC(5,1) NOT NULL,
  family_history  BOOLEAN NOT NULL DEFAULT FALSE,
  prior_loss      BOOLEAN NOT NULL DEFAULT FALSE,
  infection       BOOLEAN NOT NULL DEFAULT FALSE,
  folic_acid      TEXT NOT NULL DEFAULT 'none'
                  CHECK (folic_acid IN ('none','first','ongoing')),
  visit_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Risk scores ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS risk_scores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id        UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  overall_score   NUMERIC(4,2) NOT NULL CHECK (overall_score BETWEEN 0 AND 1),
  chd_prob        NUMERIC(4,2) NOT NULL CHECK (chd_prob BETWEEN 0 AND 1),
  ntd_prob        NUMERIC(4,2) NOT NULL CHECK (ntd_prob BETWEEN 0 AND 1),
  renal_prob      NUMERIC(4,2) NOT NULL CHECK (renal_prob BETWEEN 0 AND 1),
  abdominal_prob  NUMERIC(4,2) NOT NULL CHECK (abdominal_prob BETWEEN 0 AND 1),
  cleft_prob      NUMERIC(4,2) NOT NULL CHECK (cleft_prob BETWEEN 0 AND 1),
  risk_tier       TEXT NOT NULL CHECK (risk_tier IN ('high','elevated','low')),
  model_version   TEXT NOT NULL DEFAULT 'v1.0',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Referrals ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  risk_score_id   UUID NOT NULL REFERENCES risk_scores(id) ON DELETE CASCADE,
  chw_note        TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','declined','completed')),
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  doctor_note     TEXT
);

-- ── Sync log (tracks mobile upload batches) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chw_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  device_id     TEXT,
  records_sent  INTEGER NOT NULL DEFAULT 0,
  records_ok    INTEGER NOT NULL DEFAULT 0,
  records_skip  INTEGER NOT NULL DEFAULT 0,
  synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_patients_chw        ON patients(chw_id);
CREATE INDEX IF NOT EXISTS idx_patients_district   ON patients(district);
CREATE INDEX IF NOT EXISTS idx_visits_patient      ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_date         ON visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_risk_scores_visit   ON risk_scores(visit_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_tier    ON risk_scores(risk_tier);
CREATE INDEX IF NOT EXISTS idx_referrals_status    ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_sent      ON referrals(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_patient   ON referrals(patient_id);

-- ── Updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
