"""
Seed script — run once after DB is ready.
Creates demo user + demo business so you can test immediately.

    cd backend
    python seed.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, init_db
from app.models.user import User
from app.models.business import Business
from app.utils.security import get_password_hash

# create all tables first
init_db()

db = SessionLocal()

# ── demo user ─────────────────────────────────────────────────────────────────
DEMO_EMAIL    = "raj@example.com"
DEMO_PASSWORD = "SecurePass123!"
DEMO_NAME     = "Rajesh Kumar"

user = db.query(User).filter(User.email == DEMO_EMAIL).first()

if user:
    print(f"✓ Demo user already exists  →  {DEMO_EMAIL}")
else:
    user = User(
        full_name=DEMO_NAME,
        email=DEMO_EMAIL,
        hashed_password=get_password_hash(DEMO_PASSWORD),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"✓ Created demo user  →  {DEMO_EMAIL} / {DEMO_PASSWORD}")

# ── demo business ─────────────────────────────────────────────────────────────
biz = db.query(Business).filter(Business.user_id == user.id).first()

if biz:
    print(f"✓ Demo business already exists  →  {biz.business_name} ({biz.business_type})")
else:
    biz = Business(
        user_id=user.id,
        business_name="Sunrise Petrol Bunk",
        business_type="petrol_bunk",
        employee_count_estimate="1-10",
    )
    db.add(biz)
    db.commit()
    db.refresh(biz)
    print(f"✓ Created demo business  →  {biz.business_name}")

db.close()

print()
print("─" * 45)
print("  Seed complete!")
print(f"  Email:    {DEMO_EMAIL}")
print(f"  Password: {DEMO_PASSWORD}")
print("  API Docs: http://localhost:8000/docs")
print("─" * 45)
