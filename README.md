# I-HealthConnect (Afiabora)
### AI-Powered Non-Invasive Decision Support System to Reduce Neonatal Mortality and Prevent Congenital Malformations

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web-blue.svg)]()
[![ML](https://img.shields.io/badge/ML-TFLite%20%7C%20XGBoost-orange.svg)]()
[![Status](https://img.shields.io/badge/Status-Capstone%202026-brightgreen.svg)]()

---

## Table of Contents

- [Overview](#overview)
- [The Research Problem](#the-research-problem)
- [How It Works](#how-it-works)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [ML Pipeline](#ml-pipeline)
- [Mobile App Setup](#mobile-app-setup)
- [Web App Setup](#web-app-setup)
- [Backend API Setup](#backend-api-setup)
- [Target Anomaly Classes](#target-anomaly-classes)
- [Clinical Input Features](#clinical-input-features)
- [API Endpoints](#api-endpoints)
- [Offline Architecture](#offline-architecture)
- [Bilingual Support](#bilingual-support)
- [Screenshots](#screenshots)
- [Research Contribution](#research-contribution)
- [Ethical Considerations](#ethical-considerations)
- [Budget](#budget)
- [Timeline](#timeline)
- [Author](#author)
- [Supervisor](#supervisor)
- [License](#license)

---

## Overview

**I-HealthConnect** (also known as *Afiabora*, meaning *good health* in Swahili) is a capstone research project developed at African Leadership University (ALU), Kigali, Rwanda. It is an AI-powered, offline-capable mobile and web platform that enables Community Health Workers (CHWs) to predict congenital anomaly risks in pregnant women — without requiring ultrasound equipment, specialist doctors, or internet connectivity.

The platform is designed specifically for Rwanda's 60,000+ CHWs who serve rural and peri-urban populations where diagnostic infrastructure is severely limited. Rwanda has only **one radiologist per 500,000 people**, and fewer than **35% of congenital anomalies are detected before delivery** at district hospitals. Detection at the CHW level is effectively zero.

I-HealthConnect proposes to change this by placing a predictive AI model — trained on ultrasound-confirmed diagnoses — directly into the hands of frontline health workers using only a standard Android smartphone.

---

## The Research Problem

Congenital anomalies contribute significantly to Rwanda's neonatal mortality rate of **20 deaths per 1,000 live births**, accounting for 38% of all under-five deaths. Approximately **6,500 Rwandan infants** are born annually with significant anomalies, many undetected until delivery or later.

Existing solutions fail at the community level for three structural reasons:

1. **Equipment gap** — Ultrasound probes cost hundreds of dollars and require trained sonographers.
2. **Specialist gap** — Rwanda has critically insufficient maternal-fetal medicine specialists.
3. **Connectivity gap** — AI-enhanced tools like Butterfly iQ+ require continuous internet access.

No existing system combines clinical metadata into a real-time, offline, individualized anomaly risk score accessible to CHWs.

---

## How It Works

I-HealthConnect is built around a **train-on-ultrasound, deploy-without-ultrasound** paradigm:

```
TRAINING PHASE (Research)
─────────────────────────
Paired Dataset:
  Ultrasound findings  ──►  Labels Y  (5 anomaly classes: confirmed/not confirmed)
  Clinical history     ──►  Features X (BP, fundal height, glucose, age, etc.)
        │
        ▼
  ML Model Training (XGBoost stacking ensemble)
        │
        ▼
  TFLite model exported → deployed to Android device

DEPLOYMENT PHASE (CHW Field Use)
──────────────────────────────────
CHW collects clinical history only (no ultrasound needed)
        │
        ▼
  On-device TFLite inference (<30 seconds)
        │
        ▼
  Risk score + per-anomaly probabilities
        │
        ▼
  Traffic-light triage → referral to district hospital for confirmation
```

**The core research question:** *Can clinical metadata alone — data already collected by CHWs at every antenatal visit — predict what ultrasound would reveal, with ≥85% sensitivity?*

If yes, then early deployment of this model at CHW level is a clinically valid proxy for ultrasound screening in settings where ultrasound is inaccessible.

---

## Key Features

### Mobile App (React Native / Expo)
- **3-step clinical intake form** — colletes all 16 feature variables in under 5 minutes
- **On-device TFLite inference** — full ML prediction without internet
- **Traffic-light risk display** — Green / Amber / Red with per-anomaly probability bars
- **Bilingual UI** — English and Kinyarwanda with single-tap language switching
- **Offline-first SQLite storage** — AES-256 encrypted, caches 1,000+ patient records
- **Background sync** — automatically uploads to server when connectivity is restored
- **DHIS2-compatible referral output** — packages risk data for national health systems

### Web Application (React + Vite)
- **Role-based login** — District doctor, MoH supervisor, CHW coordinator, Hospital admin
- **National analytics dashboard** — screening volume, anomaly breakdown, referral trends
- **Referral review queue** — doctors review flagged patients with full clinical context
- **CHW coordinator panel** — field worker performance, device sync status, activity feed
- **DHIS2 SSO integration** — single sign-on with Rwanda's national health system

### ML Pipeline (Python)
- **Multi-label classification** — 5 independent binary classifiers (one per anomaly)
- **Stacking ensemble** — XGBoost + Random Forest + Logistic Regression meta-learner
- **SMOTE oversampling** — handles severe class imbalance in anomaly datasets
- **SHAP explainability** — feature importance per anomaly class
- **INT8 TFLite quantization** — sub-30-second inference on low-spec Android

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     I-HealthConnect System                       │
├──────────────────┬──────────────────┬───────────────────────────┤
│   Mobile App     │    Web App       │      Backend API           │
│  (React Native)  │ (React + Vite)   │  (Node.js + Express)       │
│                  │                  │                            │
│  ┌────────────┐  │  ┌────────────┐  │  ┌──────────────────────┐ │
│  │ Dashboard  │  │  │   Login    │  │  │  POST /api/sync      │ │
│  │ Intake     │  │  │ Dashboard  │  │  │  GET  /api/dashboard │ │
│  │ Result     │  │  │ Referrals  │  │  │  POST /api/auth      │ │
│  └────────────┘  │  │Coordinator │  │  │  GET  /api/patients  │ │
│        │         │  └────────────┘  │  └──────────────────────┘ │
│  ┌────────────┐  │        │         │           │                │
│  │TFLite Model│  │        └─────────┼───────────┤                │
│  │(on-device) │  │                  │  ┌────────────────────┐    │
│  └────────────┘  │                  │  │   PostgreSQL DB    │    │
│        │         │                  │  └────────────────────┘    │
│  ┌────────────┐  │                  │                            │
│  │SQLite (enc)│  │                  │                            │
│  └────────────┘  │                  │                            │
│  Background sync ──────────────────►│                            │
└──────────────────┴──────────────────┴───────────────────────────┘
                              │
                    ┌─────────────────┐
                    │  DHIS2 / OpenMRS│
                    │  (Rwanda Health │
                    │   Information)  │
                    └─────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Mobile UI | React Native (Expo 51) | Cross-platform Android app |
| Mobile DB | expo-sqlite v14 | Offline-first patient storage |
| Mobile ML | react-native-fast-tflite | On-device model inference |
| Mobile Sync | expo-background-fetch | Background data synchronization |
| Web UI | React 18 + Vite + TypeScript | Web dashboard |
| Web Routing | React Router v6 | Client-side navigation |
| Web Charts | Recharts | Analytics visualizations |
| Backend | Node.js + Express + TypeScript | REST API |
| Backend DB | PostgreSQL | Centralized data storage |
| Auth | JWT + bcrypt | Secure authentication |
| Validation | Zod | API request validation |
| ML Training | Python 3.10, XGBoost, scikit-learn | Model development |
| ML Deploy | TensorFlow Lite (INT8 quantized) | Edge inference |
| Explainability | SHAP | Feature importance analysis |
| Audio Processing | Librosa | MFCC extraction (future) |
| Design | Figma | UI/UX wireframing |
| Health Systems | DHIS2 API, OpenMRS | National integration |
| Cloud | AWS Africa (Cape Town) | Data sovereignty |
| Encryption | AES-256 (at rest), TLS 1.3 (transit) | Patient data security |

---

## Project Structure

```
IHealthConnect/
│
├── mobile/                          # React Native / Expo mobile app
│   ├── App.tsx                      # Entry point, DB initialization
│   ├── package.json
│   └── src/
│       ├── theme/
│       │   └── index.ts             # Design tokens (colors, spacing, radius)
│       ├── i18n/
│       │   ├── en.json              # English translations
│       │   ├── rw.json              # Kinyarwanda translations
│       │   └── useTranslation.ts    # i18n hook
│       ├── db/
│       │   └── database.ts          # SQLite schema + CRUD operations
│       ├── ml/
│       │   └── inference.ts         # TFLite model loading + inference
│       ├── components/
│       │   └── index.tsx            # Reusable UI components
│       ├── screens/
│       │   ├── DashboardScreen.tsx  # Home + patient list
│       │   ├── IntakeScreen.tsx     # 3-step clinical intake form
│       │   └── ResultScreen.tsx     # Risk result + referral
│       ├── navigation/
│       │   └── AppNavigator.tsx     # Stack + tab navigation
│       └── services/
│           └── backgroundSync.ts   # Offline sync service
│
├── web/                             # React + Vite web application
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── src/
│       ├── main.tsx                 # Vite entry point
│       ├── App.tsx                  # Router + protected routes
│       ├── index.css                # Global styles + CSS vars
│       ├── theme/
│       │   └── index.ts             # Web color tokens
│       ├── components/
│       │   └── index.tsx            # Sidebar, StatCard, AnomalyBar, etc.
│       ├── pages/
│       │   ├── LoginPage.tsx        # Role-based login
│       │   ├── DashboardPage.tsx    # National analytics dashboard
│       │   ├── ReferralReviewPage.tsx # Doctor referral queue
│       │   └── CoordinatorPage.tsx  # CHW field coordinator panel
│       ├── services/
│       │   └── auth.ts              # Login, logout, token management
│       └── hooks/
│           └── useAuth.ts           # Auth state hook
│
├── backend/                         # Node.js + Express API
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── server.ts                # Express app setup
│       ├── db/
│       │   └── schema.sql           # PostgreSQL schema
│       ├── routes/
│       │   ├── auth.ts              # Login + JWT
│       │   ├── sync.ts              # POST /api/sync/records
│       │   ├── dashboard.ts         # GET /api/dashboard/stats
│       │   └── patients.ts          # Patient CRUD
│       └── middleware/
│           └── auth.ts              # JWT verification
│
├── ml/                              # Python ML training pipeline
│   ├── preprocess.py                # Data cleaning + SMOTE + feature engineering
│   ├── train.py                     # XGBoost stacking ensemble training
│   ├── export_tflite.py             # TFLite INT8 quantization + export
│   ├── models/                      # Saved .pkl models per anomaly class
│   ├── exports/
│   │   └── model.tflite             # Final exported model → copy to mobile/assets/
│   └── reports/
│       ├── metrics.json             # AUC, sensitivity, specificity per class
│       └── shap_*.png               # SHAP feature importance plots
│
├── docs/
│   └── CHW_GUIDE.md                 # Bilingual CHW quick-reference guide
│
├── tests/
│   └── e2e_test.ts                  # End-to-end integration tests
│
└── README.md                        # This file
```

---

## ML Pipeline

### Feature Vector (16 inputs)

| # | Feature | Type | CHW Equipment |
|---|---------|------|--------------|
| 1 | Age (years) | Numeric | Structured form |
| 2 | Systolic BP (mmHg) | Numeric | Blood pressure cuff |
| 3 | Diastolic BP (mmHg) | Numeric | Blood pressure cuff |
| 4 | Fundal height (cm) | Numeric | Tape measure |
| 5 | Blood glucose (mg/dL) | Numeric | Glucose strip test |
| 6 | Hemoglobin (g/dL) | Numeric | HemoCue strip test |
| 7 | Weight (kg) | Numeric | Weight scale |
| 8 | Gravida | Numeric | Structured form |
| 9 | Parity | Numeric | Structured form |
| 10 | Gestational age (weeks) | Numeric | Structured form |
| 11 | Family history of anomalies | Binary (0/1) | Structured form |
| 12 | Previous pregnancy loss | Binary (0/1) | Structured form |
| 13 | Current infection/fever | Binary (0/1) | Structured form |
| 14 | Folic acid: None | Binary (0/1) | Structured form |
| 15 | Folic acid: First trimester | Binary (0/1) | Structured form |
| 16 | Folic acid: Ongoing | Binary (0/1) | Structured form |

### Risk Score Formula

```
overall_score = CHD × 0.35 + NTD × 0.25 + Renal × 0.20
              + Abdominal × 0.12 + Cleft × 0.08

Tier thresholds:
  High risk  → score ≥ 0.65  (refer immediately)
  Elevated   → score ≥ 0.40  (monitor closely)
  Low risk   → score < 0.40  (routine care)
```

### Training Steps

```bash
# 1. Preprocess data
python ml/preprocess.py

# 2. Train models
python ml/train.py

# 3. Export to TFLite
python ml/export_tflite.py

# 4. Copy model to mobile
cp ml/exports/model.tflite mobile/assets/model.tflite
```

### Target Performance

| Metric | Target |
|--------|--------|
| Overall sensitivity | ≥ 85% |
| Inference time (Android) | < 30 seconds |
| Intake time (CHW) | < 5 minutes |
| Offline storage capacity | ≥ 1,000 records per device |

---

## Mobile App Setup

### Prerequisites

- Node.js ≥ 18
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for emulator) or physical Android device

### Installation

```bash
# Clone the repository
git clone https://github.com/christianishimwe/IHealthConnect.git
cd IHealthConnect/mobile

# Install dependencies
npm install

# Start the development server
npm start

# Run on Android
npm run android
```

### Environment

No `.env` is required for the mobile app. The API base URL is configured in:
```
src/services/backgroundSync.ts → API_URL constant
```

### Place the trained model

```bash
# After running the ML pipeline
cp ../ml/exports/model.tflite assets/model.tflite
```

> **Note:** Until your trained model is ready, the app uses `runSimulatedInference()` 
> in `src/ml/inference.ts` as a rule-based fallback — the full UI works without the model.

---

## Web App Setup

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
cd IHealthConnect/web

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The web app runs at `http://localhost:5173` by default.

### Demo credentials (development)

| Role | Email | Password |
|------|-------|----------|
| District doctor | dr.niyonzima@kigali.rw | any |
| MoH supervisor | supervisor@moh.rw.gov | any |
| CHW coordinator | coordinator@gasabo.rw | any |
| Hospital admin | admin@kigali.hospital.rw | any |

> In development mode, any non-empty password is accepted. Connect to the real backend for production auth.

---

## Backend API Setup

### Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 14

### Installation

```bash
cd IHealthConnect/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your database credentials and JWT secret

# Create database schema
psql -U postgres -d ihealthconnect -f src/db/schema.sql

# Start development server
npm run dev

# Build for production
npm run build && npm start
```

### Environment variables

```env
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/ihealthconnect
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

---

## Target Anomaly Classes

| # | Anomaly | Detection Signal | Prevalence |
|---|---------|-----------------|-----------|
| 1 | **Congenital Heart Disease** | BP trajectory, family history, fetal stress indicators | Highest weight (35%) |
| 2 | **Neural Tube Defect** | Fundal height deviation, no folic acid, maternal age | Second weight (25%) |
| 3 | **Renal Anomaly** | BP trajectory, glucose, reduced fetal movement indicators | Third weight (20%) |
| 4 | **Abdominal Wall Defect** | Fundal height patterns, maternal weight trajectory | Fourth weight (12%) |
| 5 | **Cleft Lip / Palate** | Family history, infection exposure, folic acid status | Fifth weight (8%) |

---

## API Endpoints

### Authentication
```
POST /api/auth/login          → { token, user }
POST /api/auth/logout         → { success }
```

### Sync (Mobile → Server)
```
POST /api/sync/records        → { success, inserted, skipped }
Body: { records: [{ patient, visit, risk_score, referral? }] }
```

### Dashboard
```
GET /api/dashboard/stats      → { totalScreened, highRiskFlagged,
  ?district=&period=            referralsSent, activeChws,
                                anomalyBreakdown, recentReferrals }
```

### Patients
```
GET  /api/patients            → [{ id, name, age, riskTier, ... }]
GET  /api/patients/:id        → { patient, visits, riskScores }
POST /api/patients            → { id }
```

All endpoints except `/api/auth/login` require:
```
Authorization: Bearer <JWT token>
```

---

## Offline Architecture

I-HealthConnect is built **offline-first**. The mobile app operates with zero network dependency during clinical sessions:

```
┌─────────────────────────────────────────────┐
│              Android Device                  │
│                                              │
│  ┌──────────┐    ┌──────────┐   ┌────────┐  │
│  │  Intake  │───►│  TFLite  │──►│SQLite  │  │
│  │   Form   │    │  Model   │   │ (enc.) │  │
│  └──────────┘    └──────────┘   └────┬───┘  │
│                                       │      │
│              Background sync          │      │
│              (WorkManager)            │      │
└───────────────────────────────────────┼──────┘
                                        │ When online
                                        ▼
                               ┌─────────────────┐
                               │  Backend API     │
                               │  PostgreSQL      │
                               │  DHIS2           │
                               └─────────────────┘
```

- All patient data is stored locally in **SQLite** with AES-256 encryption
- TFLite model runs fully **client-side** — no API call needed for inference
- Background sync uploads `synced=0` records automatically when Wi-Fi or cellular is detected
- App works identically in **zero-connectivity zones**

---

## Bilingual Support

The app launches in English by default and supports full Kinyarwanda translation via a single toggle. All clinical action text is provided in both languages simultaneously on the result screen so that CHWs can read the recommendation to patients in their native language without switching modes.

```
Supported languages:
  en  →  English
  rw  →  Kinyarwanda (Ikinyarwanda)
```

Translation files: `mobile/src/i18n/en.json` and `mobile/src/i18n/rw.json`

---

## Screenshots

> UI mockups built during design phase. React Native implementation in progress.

| Screen | Description |
|--------|-------------|
| Dashboard | Home screen with today's stats and recent patient list |
| Intake Form | 3-step clinical data entry with validation |
| Risk Result | Traffic-light risk score with per-anomaly probability bars and bilingual referral text |
| Login | Role-based login with DHIS2 SSO option |
| Analytics Dashboard | National screening statistics and anomaly trends |
| Referral Review | Doctor queue with full patient clinical context |
| CHW Coordinator | Field worker performance and sync status panel |

---

## Research Contribution

This project makes the following original contributions to the field of digital health and machine learning in low-resource settings:

1. **First pre-imaging congenital anomaly prediction system** trained on ultrasound-confirmed diagnoses and deployed on CHW-level hardware in Rwanda.

2. **Proof of concept that clinical metadata alone** — data already collected at every antenatal visit — contains sufficient predictive signal to approximate ultrasound findings for 5 priority anomaly classes.

3. **Operational blueprint** for deploying complex multimodal AI on low-spec Android devices (≥Android 8.0) with 100% offline capability.

4. **Replicable framework** for sub-Saharan Africa and other LMIC contexts where ultrasound access is limited but CHW infrastructure is established.

5. **Bilingual (EN/RW) human-centered design** validated with Rwandan CHW workflows, addressing the implementation gap identified by Akuze et al. (2025) and Asongu & Adegboye (2025).

---

## Ethical Considerations

| Aspect | Approach |
|--------|----------|
| Ethical approval | Rwanda National Ethics Committee (RNEC) |
| Informed consent | Written consent in Kinyarwanda for all participants |
| Data privacy | AES-256 at rest, TLS 1.3 in transit |
| Data sovereignty | AWS Africa (Cape Town) region only |
| Algorithmic bias | Bias audit across age, parity, rural/urban, geographic subgroups |
| Clinical safety | System is decision support only — never replaces clinical judgment |
| Referral bias | Scoring thresholds biased toward safe over-referral to minimize missed anomalies |
| Re-identification | All training data de-identified; audio/images stripped of metadata |

---

## Budget

| Item | Description | Cost (RWF) |
|------|-------------|-----------|
| Android testing devices | Low-spec devices for TFLite benchmark and UI testing | 1,400,000 |
| Developer account | Google Play Console license (one-time) | 50,000 |
| Field logistics | Travel + communication for CHW pilot testing | 500,000 |
| Printing & materials | Bilingual quick-reference guides for clinics | 100,000 |
| **Total** | | **2,050,000** |

---

## Timeline

| Week | Phase | Milestone |
|------|-------|-----------|
| Week 1 (Days 1–7) | Data pipeline + feature engineering | Global open-data pipeline finalized |
| Week 2 (Days 8–14) | ML model training + TFLite export | Model trained, quantized, <30s inference verified |
| Week 3 (Days 15–21) | Mobile + web app development | Full offline app with bilingual UI |
| Week 4 (Days 22–30) | Field pilot + evaluation + reporting | CHW simulation complete, final report compiled |

---

## Author

**Christian Ishimwe**
Bachelor of Science in Software Engineering — Specialization: Machine Learning & Robotics
African Leadership University (ALU) · Kigali, Rwanda · Class of 2026

- c.ishimwe@alustudent.com
- African Leadership University
- Software Engineer & Data Systems Specialist, USAID/CARITAS
- Expected graduation: July 2026

---

## Supervisor

**Dirac Murairi**
Mission Capstone Supervisor · African Leadership University

---

## References

- WHO (2022). Newborn mortality. WHO Fact Sheets.
- UNICEF (2023). Neonatal mortality. UNICEF Data.
- Rwanda Biomedical Centre (2023). Congenital anomaly burden in Rwanda.
- Rwanda Demographic and Health Survey (2020).
- Malde et al. (2025). ML approach for predicting maternal health risks. *Future Internet*, 17(5).
- Akuze et al. (2025). Data science and AI for MNCH. *BMC Public Health*, 26.
- Asongu & Adegboye (2025). Impact of AI on maternal mortality. *Globalization and Health*, 21.
- Bhundoo et al. (2025). LLMs for CHW decision support in Rwanda. *BMJ Open*, 15(10).
- Expertise France (2026). AI-CHW Rwanda. L'Initiative.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

> **Disclaimer:** I-HealthConnect is a clinical decision support tool and research prototype.
> It does not replace clinical judgment. All risk outputs must be interpreted by a qualified
> health worker. This system is not approved for autonomous diagnostic use.

---

<div align="center">
  <strong>I-HealthConnect · Afiabora</strong><br/>
  <em>Early detection. Every pregnancy. Everywhere.</em><br/><br/>
  Made with for Rwanda's 60,000 Community Health Workers<br/>
  African Leadership University · Kigali · 2026
</div>
