import os
import sys
from datetime import date, timedelta
import random

# Ensure UTF-8 standard output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add parent directory to path so app imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.api.auth import DEFAULT_CATEGORIES
from app.services.ml_categorizer import categorizer
from app.services.ml_anomaly import AnomalyDetectionService

def seed_database():
    print("[*] Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if demo user exists
        demo_email = "shubhamkumar@gmail.com"
        existing_user = db.query(User).filter(User.email == demo_email).first()

        if existing_user:
            print(f"[!] Demo user '{demo_email}' already exists. Updating details...")
            existing_user.full_name = "SHUBHAM KUMAR SINGH"
            existing_user.role = "admin"
            db.commit()
            user = existing_user
        else:
            print(f"[+] Creating demo admin user '{demo_email}'...")
            user = User(
                email=demo_email,
                full_name="SHUBHAM KUMAR SINGH",
                hashed_password=get_password_hash("Password@123"),
                role="admin",
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)


            # Create default categories
            print("[+] Seeding default categories...")
            for cat_name, cat_type, icon, color in DEFAULT_CATEGORIES:
                cat = Category(
                    name=cat_name,
                    type=cat_type,
                    icon=icon,
                    color=color,
                    is_default=True,
                    user_id=user.id
                )
                db.add(cat)
            db.commit()

        # Cache category map
        cats = db.query(Category).filter(Category.user_id == user.id).all()
        cat_map = {c.name: c.id for c in cats}

        # Check existing transactions
        tx_count = db.query(Transaction).filter(Transaction.user_id == user.id).count()
        if tx_count < 10:
            print("[+] Generating realistic 60-day historical transactions & AI features...")
            today = date.today()

            # Monthly recurring salaries
            db.add(Transaction(
                amount=75000.0,
                type="income",
                description="MP Online Ltd Monthly Stipend / Payroll Credit",
                date=today.replace(day=1),
                category_id=cat_map.get("Salary / Income"),
                user_id=user.id,
                ai_categorized=True,
                confidence_score=0.99
            ))
            db.add(Transaction(
                amount=75000.0,
                type="income",
                description="MP Online Ltd Monthly Stipend / Payroll Credit",
                date=(today.replace(day=1) - timedelta(days=28)).replace(day=1),
                category_id=cat_map.get("Salary / Income"),
                user_id=user.id,
                ai_categorized=True,
                confidence_score=0.99
            ))

            # Sample expenses
            raw_sample_expenses = [
                # Food
                ("Swiggy Order #48912 Dinner", 420.0, "Food & Dining", 2),
                ("Zomato Biryani Lunch", 580.0, "Food & Dining", 5),
                ("Starbucks Flat White & Muffin", 380.0, "Food & Dining", 7),
                ("Dominos Pizza Weekend Party", 1150.0, "Food & Dining", 12),
                ("Swiggy Gourmet Order", 850.0, "Food & Dining", 16),
                ("Cafe Coffee Day Snack", 260.0, "Food & Dining", 22),
                
                # Groceries
                ("Blinkit Instant Groceries & Dairy", 640.0, "Groceries", 3),
                ("Zepto Daily Milk & Vegetables", 310.0, "Groceries", 8),
                ("DMart Monthly Supermarket Run", 4650.0, "Groceries", 14),
                ("BigBasket Organic Staples", 1850.0, "Groceries", 25),

                # Subscriptions (with a price hike to trigger Smart Insighter!)
                ("Netflix Premium Ultra HD Plan", 649.0, "Subscriptions", 4, True, "monthly"),
                ("Netflix Premium Ultra HD Plan (Previous)", 499.0, "Subscriptions", 34, True, "monthly"),
                ("Spotify Music Premium Individual", 119.0, "Subscriptions", 9, True, "monthly"),
                ("Spotify Music Premium Individual (Previous)", 119.0, "Subscriptions", 39, True, "monthly"),

                # Bills & Utilities
                ("MPEB Bhopal Electricity Bill", 2450.0, "Bills & Utilities", 6),
                ("Airtel Fiber Gigabit Wifi Bill", 1179.0, "Bills & Utilities", 11),
                ("Indane LPG Gas Cylinder", 950.0, "Bills & Utilities", 21),

                # Transportation
                ("Uber Premier Ride to MP Online HQ", 320.0, "Transportation", 1),
                ("Indian Oil Petrol Pump Fuel Refill", 2500.0, "Transportation", 10),
                ("Rapido Auto Commute", 85.0, "Transportation", 18),
                ("Fastag Highway Toll Recharge", 500.0, "Transportation", 26),

                # Shopping
                ("Amazon.in Wireless Bluetooth Earbuds", 2999.0, "Shopping", 13),
                ("Myntra Premium Cotton Shirts", 1850.0, "Shopping", 20),

                # Health
                ("Apollo Pharmacy Vitamin Supplements", 780.0, "Health & Medical", 15),

                # Anomaly Spike (Flagged for live demonstration)
                ("Luxury Electronics Store Flash Purchase (Spike)", 28500.0, "Shopping", 19)
            ]

            for item in raw_sample_expenses:
                desc = item[0]
                amt = item[1]
                cat_name = item[2]
                days_ago = item[3]
                is_recurring = item[4] if len(item) > 4 else False
                freq = item[5] if len(item) > 5 else None

                cat_id = cat_map.get(cat_name)
                tx_date = today - timedelta(days=days_ago)

                # Anomaly check
                is_anomaly = "Spike" in desc or amt > 20000
                anom_score = 0.92 if is_anomaly else 0.15

                tx = Transaction(
                    amount=amt,
                    type="expense",
                    description=desc,
                    raw_text=desc,
                    date=tx_date,
                    payment_method="UPI / HDFC NetBanking",
                    category_id=cat_id,
                    user_id=user.id,
                    is_recurring=is_recurring,
                    recurring_frequency=freq,
                    ai_categorized=True,
                    confidence_score=0.96,
                    is_anomaly=is_anomaly,
                    anomaly_score=anom_score
                )
                db.add(tx)
            db.commit()

        # Also create a second user to demonstrate multi-user admin inspection
        second_email = "user@mponline.gov.in"
        existing_user2 = db.query(User).filter(User.email == second_email).first()
        today = date.today()
        if not existing_user2:
            print(f"[+] Creating second user '{second_email}' for admin inspection demo...")
            user2 = User(
                email=second_email,
                full_name="Priya Patel (MP Online Staff)",
                hashed_password=get_password_hash("Password@123"),
                role="user",
                is_active=True
            )
            db.add(user2)
            db.commit()
            db.refresh(user2)

            for cat_name, cat_type, icon, color in DEFAULT_CATEGORIES:
                db.add(Category(name=cat_name, type=cat_type, icon=icon, color=color, is_default=True, user_id=user2.id))
            db.commit()

            u2_cats = {c.name: c.id for c in db.query(Category).filter(Category.user_id == user2.id).all()}
            
            # User 2 transactions (Spends more on Shopping & Travel!)
            db.add(Transaction(amount=60000.0, type="income", description="Monthly Salary Credit", date=today.replace(day=1), category_id=u2_cats.get("Salary / Income"), user_id=user2.id, ai_categorized=True, confidence_score=0.99))
            db.add(Transaction(amount=12500.0, type="expense", description="Zara & H&M Fashion Mall Shopping", date=today - timedelta(days=5), category_id=u2_cats.get("Shopping"), user_id=user2.id, ai_categorized=True, confidence_score=0.95))
            db.add(Transaction(amount=8400.0, type="expense", description="Amazon Home & Kitchen Appliances", date=today - timedelta(days=10), category_id=u2_cats.get("Shopping"), user_id=user2.id, ai_categorized=True, confidence_score=0.96))
            db.add(Transaction(amount=4500.0, type="expense", description="MakeMyTrip Weekend Hotel Booking", date=today - timedelta(days=12), category_id=u2_cats.get("Transportation"), user_id=user2.id, ai_categorized=True, confidence_score=0.94))
            db.add(Transaction(amount=2100.0, type="expense", description="Barbeque Nation Family Dinner", date=today - timedelta(days=15), category_id=u2_cats.get("Food & Dining"), user_id=user2.id, ai_categorized=True, confidence_score=0.98))
            db.commit()

        # Create monthly budgets
        cur_month = date.today().month
        cur_year = date.today().year

        existing_b = db.query(Budget).filter(Budget.user_id == user.id, Budget.month == cur_month, Budget.year == cur_year).first()
        if not existing_b:
            print("[+] Seeding monthly budget targets...")
            # Overall monthly budget
            db.add(Budget(
                amount=50000.0,
                month=cur_month,
                year=cur_year,
                threshold_alert=80.0,
                category_id=None,
                user_id=user.id
            ))
            # Food category budget
            if "Food & Dining" in cat_map:
                db.add(Budget(
                    amount=6000.0,
                    month=cur_month,
                    year=cur_year,
                    threshold_alert=75.0,
                    category_id=cat_map["Food & Dining"],
                    user_id=user.id
                ))
            # Shopping category budget
            if "Shopping" in cat_map:
                db.add(Budget(
                    amount=10000.0,
                    month=cur_month,
                    year=cur_year,
                    threshold_alert=80.0,
                    category_id=cat_map["Shopping"],
                    user_id=user.id
                ))
            db.commit()

        print("\n[SUCCESS] Seed data successfully generated!")
        print("--------------------------------------------------------")
        print(f"Admin Account    : shubhamkumar@gmail.com")
        print("Password         : Password@123")
        print(f"Demo User Account: user@mponline.gov.in")
        print("Password         : Password@123")
        print("--------------------------------------------------------")


    except Exception as e:
        print(f"[ERROR] Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
