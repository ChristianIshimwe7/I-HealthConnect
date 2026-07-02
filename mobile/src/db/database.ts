import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('ihealthconnect.db');

export const initDB = async () => {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER,
      gravida INTEGER,
      parity INTEGER,
      gestational_age INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      systolic_bp REAL, diastolic_bp REAL,
      fundal_height REAL, glucose REAL,
      hemoglobin REAL, weight REAL,
      family_history INTEGER DEFAULT 0,
      prior_loss INTEGER DEFAULT 0,
      infection INTEGER DEFAULT 0,
      folic_acid TEXT DEFAULT 'none',
      visit_date TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS risk_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visit_id INTEGER NOT NULL,
      overall_score REAL,
      chd_prob REAL, ntd_prob REAL,
      renal_prob REAL, abdominal_prob REAL, cleft_prob REAL,
      risk_tier TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (visit_id) REFERENCES visits(id)
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      risk_score_id INTEGER NOT NULL,
      chw_note TEXT,
      status TEXT DEFAULT 'pending',
      sent_at TEXT DEFAULT (datetime('now')),
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (risk_score_id) REFERENCES risk_scores(id)
    );
  `);
};

export const insertPatient = async (data: {
  name: string; age: number; gravida: number;
  parity: number; gestational_age: number;
}) => {
  const r = await db.runAsync(
    `INSERT INTO patients (name, age, gravida, parity, gestational_age)
     VALUES (?,?,?,?,?)`,
    [data.name, data.age, data.gravida, data.parity, data.gestational_age]
  );
  return r.lastInsertRowId;
};

export const insertVisit = async (patientId: number, v: {
  systolic_bp: number; diastolic_bp: number; fundal_height: number;
  glucose: number; hemoglobin: number; weight: number;
  family_history: boolean; prior_loss: boolean; infection: boolean;
  folic_acid: string;
}) => {
  const r = await db.runAsync(
    `INSERT INTO visits
     (patient_id,systolic_bp,diastolic_bp,fundal_height,glucose,
      hemoglobin,weight,family_history,prior_loss,infection,folic_acid)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [patientId, v.systolic_bp, v.diastolic_bp, v.fundal_height,
     v.glucose, v.hemoglobin, v.weight,
     v.family_history?1:0, v.prior_loss?1:0, v.infection?1:0, v.folic_acid]
  );
  return r.lastInsertRowId;
};

export const insertRiskScore = async (visitId: number, s: {
  overall_score: number; chd_prob: number; ntd_prob: number;
  renal_prob: number; abdominal_prob: number; cleft_prob: number;
  risk_tier: string;
}) => {
  const r = await db.runAsync(
    `INSERT INTO risk_scores
     (visit_id,overall_score,chd_prob,ntd_prob,renal_prob,abdominal_prob,cleft_prob,risk_tier)
     VALUES (?,?,?,?,?,?,?,?)`,
    [visitId, s.overall_score, s.chd_prob, s.ntd_prob,
     s.renal_prob, s.abdominal_prob, s.cleft_prob, s.risk_tier]
  );
  return r.lastInsertRowId;
};

export const insertReferral = async (patientId: number, riskScoreId: number, note: string) => {
  await db.runAsync(
    `INSERT INTO referrals (patient_id, risk_score_id, chw_note) VALUES (?,?,?)`,
    [patientId, riskScoreId, note]
  );
};

export const getRecentPatients = async (limit = 10) =>
  db.getAllAsync<{
    id: number; name: string; age: number; gestational_age: number;
    overall_score: number; risk_tier: string; visit_date: string;
  }>(
    `SELECT p.id, p.name, p.age, p.gestational_age,
            rs.overall_score, rs.risk_tier, v.visit_date
     FROM patients p
     LEFT JOIN visits v ON v.patient_id = p.id
     LEFT JOIN risk_scores rs ON rs.visit_id = v.id
     ORDER BY v.visit_date DESC LIMIT ?`,
    [limit]
  );

export const getDashboardStats = async () => {
  const today = new Date().toISOString().split('T')[0];
  const [screened, highRisk, referrals, offline] = await Promise.all([
    db.getFirstAsync<{count:number}>(
      `SELECT COUNT(*) as count FROM visits WHERE DATE(visit_date)=?`,[today]),
    db.getFirstAsync<{count:number}>(
      `SELECT COUNT(*) as count FROM risk_scores rs
       JOIN visits v ON rs.visit_id=v.id
       WHERE DATE(v.visit_date)=? AND rs.risk_tier='high'`,[today]),
    db.getFirstAsync<{count:number}>(
      `SELECT COUNT(*) as count FROM referrals WHERE DATE(sent_at)=?`,[today]),
    db.getFirstAsync<{count:number}>(
      `SELECT COUNT(*) as count FROM risk_scores WHERE synced=0`),
  ]);
  return {
    screened: screened?.count??0,
    highRisk: highRisk?.count??0,
    referrals: referrals?.count??0,
    offline: offline?.count??0,
  };
};

export const getUnsyncedRecords = () =>
  db.getAllAsync(
    `SELECT rs.*,p.name,p.age,v.systolic_bp,v.diastolic_bp,v.fundal_height,v.glucose,v.hemoglobin
     FROM risk_scores rs
     JOIN visits v ON rs.visit_id=v.id
     JOIN patients p ON v.patient_id=p.id
     WHERE rs.synced=0`
  );

export const markSynced = async (ids: number[]) => {
  const ph = ids.map(()=>'?').join(',');
  await db.runAsync(`UPDATE risk_scores SET synced=1 WHERE id IN (${ph})`,ids);
};
