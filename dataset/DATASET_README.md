# I-HealthConnect — Paired Ultrasound + Clinical Dataset
## Labeled Ultrasound Images Linked to CHW-Level Risk Signals

---

## What this dataset is

This is a **paired multimodal dataset** where every ultrasound image has a
corresponding clinical record collected at the same patient visit. The pairing
is done via `patient_id`.

```
┌─────────────────────────────────────────────────────────────┐
│  For each patient:                                           │
│                                                              │
│  ULTRASOUND IMAGE          CLINICAL RECORD (CHW-level)       │
│  ─────────────────         ───────────────────────────────   │
│  What specialist sees  ←─► age, BP, fundal height,          │
│  on the scan               glucose, hemoglobin, weight,      │
│  (ground truth label)      family history, folic acid...     │
│                                                              │
│  VSD detected          ←─► systolic=138, Hb=10.4,           │
│  (label_chd = 1)           family_history=1, folic=none      │
│                                                              │
│  Intact anatomy        ←─► systolic=112, Hb=12.2,           │
│  (all labels = 0)          family_history=0, folic=ongoing   │
└─────────────────────────────────────────────────────────────┘
```

The ML model is trained to learn this mapping:
**Clinical signals (X) → Ultrasound diagnosis (Y)**

So at deployment, CHWs input only the clinical data — the model predicts
what the ultrasound would have shown.

---

## Dataset Structure

```
dataset/
├── ultrasound_images/          ← Labeled ultrasound images (224×224 grayscale PNG)
│   ├── normal/                 400 images — healthy fetal anatomy
│   ├── chd/                    120 images — congenital heart disease
│   ├── ntd/                     90 images — neural tube defect
│   ├── renal/                   76 images — renal anomaly
│   ├── abdominal/               56 images — abdominal wall defect
│   └── cleft/                   48 images — cleft lip / palate
│
├── clinical_records/           ← Paired CHW-level clinical data
│   ├── paired_dataset.csv      790 rows — full paired data (image + clinical + findings)
│   ├── ml_ready_dataset.csv    790 rows — ML features + labels only (use for training)
│   ├── us_chw_signal_mapping.csv  Signal link reference (US findings ↔ CHW signals)
│   ├── class_normal.csv        400 rows — normal cases
│   ├── class_chd.csv           120 rows — CHD cases
│   ├── class_ntd.csv            90 rows — NTD cases
│   ├── class_renal.csv          76 rows — renal cases
│   ├── class_abdominal.csv      56 rows — abdominal cases
│   └── class_cleft.csv          48 rows — cleft cases
│
└── metadata/
    └── image_metadata.csv      Image registry (patient_id, path, labels)
```

**Total: 790 paired records × 790 labeled ultrasound images**

---

## Column Reference — ml_ready_dataset.csv

### Identifiers
| Column | Description |
|--------|-------------|
| `patient_id` | Unique 12-character ID linking image to clinical record |
| `image_file` | Exact PNG filename (e.g. `a3f9b12c_chd_0042.png`) |
| `image_class` | Class folder: normal / chd / ntd / renal / abdominal / cleft |

### Clinical Feature Columns (X — CHW inputs)

| Column | Type | Equipment | Key clinical signal for |
|--------|------|-----------|------------------------|
| `age` | int (years) | Structured form | CHD (older), NTD (younger), Abdominal (very young) |
| `gravida` | int 1–8 | Structured form | Prior pregnancy anomaly risk |
| `parity` | int 0–7 | Structured form | Delivery history |
| `gestational_age` | int (weeks) | Structured form | Timing of scan |
| `systolic_bp` | int (mmHg) | BP cuff | CHD, Renal (hypertension link) |
| `diastolic_bp` | int (mmHg) | BP cuff | CHD, Renal |
| `fundal_height` | float (cm) | Tape measure | NTD (low), Abdominal (high), Renal (low) |
| `glucose` | float (mg/dL) | Glucose strip | CHD, Renal (diabetes link) |
| `hemoglobin` | float (g/dL) | HemoCue strip | CHD, Cleft (anaemia, smoking proxy) |
| `weight` | float (kg) | Weight scale | Abdominal (low weight), CHD (obesity) |
| `family_history` | 0/1 | Structured form | Cleft (65%), CHD (58%), NTD (45%) |
| `prior_loss` | 0/1 | Structured form | NTD (42%), CHD (32%) |
| `infection` | 0/1 | Structured form | Cleft (38% — rubella/CMV), NTD (20%) |
| `folic_acid` | none/first/ongoing | Structured form | NTD (72% none), Cleft (60% none) |

### Label Columns (Y — from ultrasound)

| Column | Ultrasound finding | Prevalence |
|--------|-------------------|-----------|
| `label_chd` | VSD, cardiomegaly, asymmetric chambers | 15.2% |
| `label_ntd` | Lemon sign, open spine, ventriculomegaly | 11.4% |
| `label_renal` | Pyelectasis, MCDK, oligohydramnios | 9.6% |
| `label_abdominal` | Bowel herniation, polyhydramnios | 7.1% |
| `label_cleft` | Cleft lip, palate gap, nasal bone deviation | 6.1% |

---

## Ultrasound ↔ CHW Signal Mapping

This is the core research contribution — the explicit link between what the
ultrasound shows and what the CHW can detect without imaging:

### Congenital Heart Disease (CHD)
| Ultrasound marker | CHW-level proxy | Threshold |
|-------------------|----------------|-----------|
| VSD (ventricular septal defect) | Systolic BP elevation | >130 mmHg |
| Cardiomegaly (CTR >0.55) | Hemoglobin low | <11 g/dL |
| Pericardial effusion | Family history | = 1 |
| Abnormal 4-chamber view | Glucose elevated | >100 mg/dL |
| Aortic malalignment | No folic acid | = 'none' |

### Neural Tube Defect (NTD)
| Ultrasound marker | CHW-level proxy | Threshold |
|-------------------|----------------|-----------|
| Open spina bifida L3-L4 | No folic acid supplementation | = 'none' |
| Lemon sign (skull deformity) | Fundal height below expected | diff < −2cm |
| Ventriculomegaly >10mm | Prior pregnancy loss | = 1 |
| Banana sign (cerebellar displacement) | Family history | = 1 |
| Meningocele sac | Young maternal age | < 24 years |

### Renal Anomaly
| Ultrasound marker | CHW-level proxy | Threshold |
|-------------------|----------------|-----------|
| Pyelectasis APD >7mm | Low fundal height | diff < −3cm |
| MCDK (multicystic kidney) | Glucose elevated | >110 mg/dL |
| AFI 4cm (oligohydramnios) | BP elevated | systolic >125 |
| Empty fetal bladder | Infection/UTI | = 1 |
| Echogenic kidneys | Family history | = 1 |

### Abdominal Wall Defect (Gastroschisis)
| Ultrasound marker | CHW-level proxy | Threshold |
|-------------------|----------------|-----------|
| Bowel herniation | Very young mother | < 22 years |
| Absent anterior wall | Elevated fundal height | diff > +2cm |
| AFI 24cm (polyhydramnios) | Low maternal weight | < 55 kg |
| Free-floating bowel loops | Low hemoglobin | < 11 g/dL |
| No covering membrane | No folic acid | = 'none' |

### Cleft Lip / Palate
| Ultrasound marker | CHW-level proxy | Threshold |
|-------------------|----------------|-----------|
| Disrupted upper lip contour | Family history positive | = 1 (65%) |
| Hard palate gap | Infection (rubella/CMV) | = 1 |
| Nasal bone deviation | No folic acid | = 'none' |
| Philtrum disruption | Low hemoglobin | < 11 g/dL (smoking proxy) |

---

## Ultrasound Image Specifications

| Property | Value |
|----------|-------|
| Format | PNG (grayscale) |
| Size | 224 × 224 pixels |
| Color mode | L (8-bit grayscale) |
| Naming | `{patient_id}_{class}_{index:04d}.png` |
| View type | Standard obstetric 2D ultrasound simulation |

### What each image class shows

**normal/** — Well-formed fetal oval body, round skull, normal 4-chamber heart
with bright pulsation center, intact spine dots, adequate dark amniotic fluid
surrounding the fetus.

**chd/** — Abnormal heart: asymmetric ventricular chambers, bright VSD defect
line at septum, cardiomegaly box overlay showing CTR >0.55, pericardial
effusion dark halo, misdirected aortic outflow.

**ntd/** — Lemon-shaped skull (frontal indentation), banana sign (curved
cerebellum), open spine with visible gap at L3-L4, meningocele sac bulge,
ventriculomegaly annotation >10mm.

**renal/** — Left kidney with bright echogenicity and dark dilated pelvis
(pyelectasis >7mm), right kidney showing multicystic pattern (MCDK),
empty/small bladder, low fluid annotation (AFI 4cm).

**abdominal/** — Bowel loops floating freely outside fetal body through right
paraumbilical wall defect (gastroschisis), or omphalocele sac containing
liver/bowel. High fluid annotation (AFI 24cm polyhydramnios).

**cleft/** — Coronal face view: bilateral orbits visible, disrupted upper lip
curve with gap marker, palate gap, deviated nasal bone annotation.

---

## How to use for ML training

### Option A — Image classification only (CNN)
Train a CNN (MobileNetV3) to classify ultrasound images into 6 classes.
Images are labeled by folder name.

```python
from torchvision import datasets, transforms
dataset = datasets.ImageFolder(
    root='ultrasound_images/',
    transform=transforms.Compose([
        transforms.Grayscale(1),
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
    ])
)
# Classes: abdominal, chd, cleft, normal, ntd, renal
```

### Option B — Clinical tabular model (recommended for CHW deployment)
Use `ml_ready_dataset.csv` with the preprocess.py pipeline:

```bash
cp clinical_records/ml_ready_dataset.csv IHealthConnect/ml/data/raw/dataset.csv
cd IHealthConnect/ml
python preprocess.py --input data/raw/dataset.csv --output data/processed/
python train.py
python export_tflite.py
```

### Option C — Multimodal (image + clinical, advanced)
Join images with clinical records via `patient_id`, feed both streams
into a late-fusion model that combines CNN image features with tabular
clinical features. This is the most powerful approach.

```python
import pandas as pd
df = pd.read_csv('clinical_records/paired_dataset.csv')
# df has: patient_id, image_path, all 14 clinical features, all 5 labels
# Load image: PIL.Image.open(f'ultrasound_images/{row.image_class}/{row.image_file}')
```

---

## Signal Reference Card (for CHWs)

| If CHW sees this... | Suspect this anomaly | Refer? |
|--------------------|---------------------|--------|
| BP >130 + low Hb + family history | Congenital Heart Disease | 🔴 Yes |
| No folic acid + fundal height low + prior loss | Neural Tube Defect | 🔴 Yes |
| Fundal height low + glucose >110 + BP elevated | Renal Anomaly | 🔴 Yes |
| Mother <22 yrs + fundal height high + low weight | Abdominal Wall Defect | 🔴 Yes |
| Family history + infection + no folic acid | Cleft Lip / Palate | 🟡 Monitor |

---

## Disclaimer

This is a **synthetic research dataset** generated with clinically grounded
statistical distributions. Ultrasound images are synthetic simulations of
diagnostic markers — they are NOT real patient scans. For clinical deployment,
models must be retrained on real paired data and validated by a medical ethics
board (RNEC) before use.

---

*I-HealthConnect · Capstone 2026 · Christian Ishimwe · ALU · Kigali, Rwanda*
