import re
from typing import Tuple, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import numpy as np

# Comprehensive seed training data covering Food, Groceries, Shopping, Travel, Bills, Subscriptions, Health, Entertainment, Income, etc.
TRAINING_DATA = [
    # Food & Dining
    ("swiggy order food delivery", "Food & Dining"),
    ("zomato restaurant dinner meal", "Food & Dining"),
    ("starbucks coffee latte cappuccino", "Food & Dining"),
    ("mcdonalds burger meal fries", "Food & Dining"),
    ("dominos pizza takeout dinner", "Food & Dining"),
    ("kfc fried chicken lunch", "Food & Dining"),
    ("subway sandwich lunch", "Food & Dining"),
    ("cafe coffee day beverage snacks", "Food & Dining"),
    ("haldirams sweets snacks dinner", "Food & Dining"),
    ("barbeque nation buffet dinner", "Food & Dining"),
    ("dhaba lunch food street", "Food & Dining"),
    ("tea stall chai samosa morning", "Food & Dining"),
    ("bakery pastry cake snacks", "Food & Dining"),

    # Groceries & Essentials
    ("blinkit quick grocery delivery milk eggs", "Groceries"),
    ("zepto grocery veggies daily essentials", "Groceries"),
    ("bigbasket supermarket vegetables fruits", "Groceries"),
    ("dmart supermarket household items", "Groceries"),
    ("reliance fresh grocery staples oil", "Groceries"),
    ("nature basket organic vegetables groceries", "Groceries"),
    ("local kirana store provisions atta dal", "Groceries"),
    ("supermarket household grocery items", "Groceries"),
    ("spencers retail grocery essentials", "Groceries"),
    ("vegetable vendor sabzi mandi fruits", "Groceries"),

    # Shopping & E-Commerce
    ("amazon shopping online electronic clothes", "Shopping"),
    ("flipkart purchase online mobile shoes", "Shopping"),
    ("myntra fashion apparel t-shirt jeans", "Shopping"),
    ("zara clothing shopping fashion apparel", "Shopping"),
    ("h&m fashion clothing dresses shirts", "Shopping"),
    ("ikea home furniture decor shopping", "Shopping"),
    ("ajio online shopping clothes", "Shopping"),
    ("croma electronics retail gadgets", "Shopping"),
    ("nykaa cosmetics beauty makeup skin care", "Shopping"),
    ("apple store iphone macbook accessory", "Shopping"),
    ("shoe store nike sneakers footwear", "Shopping"),

    # Transportation & Fuel
    ("uber trip ride cab taxi", "Transportation"),
    ("ola cabs auto ride travel fare", "Transportation"),
    ("rapido bike taxi commute", "Transportation"),
    ("indian oil petrol fuel diesel pump", "Transportation"),
    ("bharat petroleum petrol pump fuel refill", "Transportation"),
    ("hp fuel petrol station car diesel", "Transportation"),
    ("irctc train ticket railway booking travel", "Transportation"),
    ("makemytrip flight ticket hotel travel", "Transportation"),
    ("indigo airlines flight ticket booking", "Transportation"),
    ("metro rail card recharge smartcard", "Transportation"),
    ("fastag toll highway toll plaza recharge", "Transportation"),
    ("parking fee toll charge vehicle", "Transportation"),

    # Utilities & Bills
    ("electricity bill mpeb power distribution", "Bills & Utilities"),
    ("water board municipal bill payment", "Bills & Utilities"),
    ("airtel broadband wifi postpaid mobile bill", "Bills & Utilities"),
    ("jio fiber recharge mobile prepaid plan", "Bills & Utilities"),
    ("vodafone idea mobile bill payment", "Bills & Utilities"),
    ("adani gas piped gas cylinder payment lpg", "Bills & Utilities"),
    ("indane gas cylinder booking refill", "Bills & Utilities"),
    ("dth tata play recharge dish tv", "Bills & Utilities"),
    ("society maintenance flat monthly fee", "Bills & Utilities"),

    # Subscriptions & Entertainment
    ("netflix monthly streaming subscription 4k", "Subscriptions"),
    ("spotify premium music subscription monthly", "Subscriptions"),
    ("amazon prime video membership annual", "Subscriptions"),
    ("disney hotstar subscription renewal", "Subscriptions"),
    ("youtube premium family subscription", "Subscriptions"),
    ("chatgpt plus openai subscription ai", "Subscriptions"),
    ("github copilot monthly subscription developer", "Subscriptions"),
    ("bookmyshow movie cinema ticket multiplex", "Subscriptions"),
    ("pvr cinemas ticket popcorn movie show", "Subscriptions"),
    ("playstation plus game pass subscription", "Subscriptions"),

    # Health & Medical
    ("apollo pharmacy medicine prescription drugs", "Health & Medical"),
    ("1mg tata online pharmacy healthcare tablets", "Health & Medical"),
    ("pharmeasy medicine order health syrup", "Health & Medical"),
    ("doctor consultation clinic hospital fee", "Health & Medical"),
    ("dental clinic tooth cleaning filling dentist", "Health & Medical"),
    ("pathology lab blood test diagnostic test", "Health & Medical"),
    ("cult fit gym membership fitness annual", "Health & Medical"),
    ("gold gym fitness workout subscription", "Health & Medical"),

    # Housing & Rent
    ("house rent monthly landlord payment", "Housing & Rent"),
    ("flat rent maintenance society deposit", "Housing & Rent"),
    ("room rent pg accommodation monthly", "Housing & Rent"),

    # Income & Earnings
    ("salary credited employer payroll direct deposit", "Salary / Income"),
    ("mp online ltd payroll salary credit monthly", "Salary / Income"),
    ("client freelance payment project milestone invoice", "Salary / Income"),
    ("consulting fee payment received upi", "Salary / Income"),
    ("dividend payout mutual fund stock returns", "Salary / Income"),
    ("interest credited savings account bank quarterly", "Salary / Income"),
    ("cashback reward credited payment app", "Salary / Income"),
    ("refund credited merchant return amount", "Salary / Income"),

    # Investments & Savings
    ("zerodha mutual fund sip equity stock purchase", "Investments"),
    ("groww mutual fund investment sip deduction", "Investments"),
    ("ppf public provident fund deposit savings", "Investments"),
    ("fixed deposit fd creation bank transfer", "Investments"),
    ("crypto bitcoin binance buy investment", "Investments"),
]

class SmartMLCategorizer:
    def __init__(self):
        self.texts = [item[0] for item in TRAINING_DATA]
        self.labels = [item[1] for item in TRAINING_DATA]
        self.pipeline: Optional[Pipeline] = None
        self._train_initial_model()

    def _clean_text(self, text: str) -> str:
        """Standardize raw bank transaction and description texts."""
        if not text:
            return ""
        text = str(text).lower()
        # Remove special bank symbols, UPI IDs suffixes, reference codes
        text = re.sub(r'upi/[0-9a-z_@\-]+/|neft-|rtgs-|imps-|pos\s[0-9]+', ' ', text)
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def _train_initial_model(self):
        """Train TF-IDF + Multinomial Naive Bayes pipeline."""
        cleaned_texts = [self._clean_text(t) for t in self.texts]
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)),
            ('clf', MultinomialNB(alpha=0.1))
        ])
        self.pipeline.fit(cleaned_texts, self.labels)

    def predict(self, raw_description: str) -> Tuple[str, float]:
        """Predicts the category and outputs confidence score between 0.0 and 1.0."""
        cleaned = self._clean_text(raw_description)
        if not cleaned:
            return "Other", 0.5

        # Check for explicit keywords first (Rule fallback for instant precision)
        lower_raw = raw_description.lower()
        if any(w in lower_raw for w in ["salary", "payroll", "dividend", "interest credited"]):
            return "Salary / Income", 0.98
        if any(w in lower_raw for w in ["rent", "landlord"]):
            return "Housing & Rent", 0.95

        try:
            probs = self.pipeline.predict_proba([cleaned])[0]
            classes = self.pipeline.classes_
            best_idx = np.argmax(probs)
            pred_category = classes[best_idx]
            confidence = float(probs[best_idx])
            
            # Bound confidence smoothly
            confidence = round(max(0.55, min(0.99, confidence)), 2)
            return pred_category, confidence
        except Exception:
            pred = self.pipeline.predict([cleaned])[0]
            return pred, 0.75

    def add_user_feedback(self, text: str, corrected_category: str):
        """Adaptive online learning: updates model memory with user feedback."""
        cleaned = self._clean_text(text)
        if cleaned and corrected_category:
            # Add weighted feedback instances to reinforce user preference
            self.texts.extend([cleaned] * 3)
            self.labels.extend([corrected_category] * 3)
            self._train_initial_model()

# Global Singleton instance
categorizer = SmartMLCategorizer()
