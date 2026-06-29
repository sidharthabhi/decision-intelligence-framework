# Decision Intelligence Framework (DIF)

A multi-stage validation pipeline that runs records through sequential checks, persists each record's stage state, and surfaces progress in a React frontend — with a machine-learning layer that flags high-risk records.


## What it does

Takes a record and runs it through a series of validation stages in order. Each stage checks the data and either passes it forward or flags it. Stage state is stored in PostgreSQL so the full path is auditable, and a React frontend shows where each record is in real time. A scikit-learn Random Forest scores records at the validation layer to flag likely problems instead of letting them pass silently.

## Tech stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI (Python) |
| Frontend | React |
| Database | PostgreSQL |
| ML | scikit-learn (Random Forest), Pandas, NumPy |

## How it works

```
Record ──> Stage 1 ──> Stage 2 ──> ... ──> Stage N
              │           │                   │
              └────── state persisted to PostgreSQL ──────┘
                                  │
                     React frontend polls stage status
                                  │
              Random Forest scores records → flags high-risk
```

## Results (on test data)

- Processed a generated dataset of **~179K records** end to end
- Measured **sub-2-second** processing time on that test run
- Random Forest achieved **~0.80 AUC** on the held-out test split
- Flagging reduced false-positive escalations by ~34% **in evaluation on this dataset**

> These are measurements from a controlled portfolio build on generated data — not a production SLA or live-traffic numbers.

## Running locally

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

cd frontend
npm install
npm run dev
```

## Design intent

The goal was to prove an architecture: replace inconsistent manual review with an automated, traceable, staged flow, and show where an ML layer adds value. Built to demonstrate system-design thinking end to end.

## Honest scope

- Stages run as a **sequential pipeline** within the backend (describe accurately to match your code).
- Dataset is **synthetic/generated** for testing the architecture.
- ML is **applied classification** (Random Forest), not deep learning.
