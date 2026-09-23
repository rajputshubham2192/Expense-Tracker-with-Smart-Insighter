# 💰 Expense Tracker with Smart Insighter
### *An AI/ML-Powered Financial Intelligence Platform*

---

## 🌟 Project Overview

**Expense Tracker with Smart Insighter** is a comprehensive financial intelligence and expense management web application. It combines automated transaction tracking, budget management, and interactive analytics with advanced Machine Learning algorithms to provide users with actionable financial insights, spending forecasts, anomaly detection, and intelligent categorization.

---

## 🚀 Key Features & Capabilities

- 🤖 **NLP Auto-Categorization**: Automatic transaction sorting with confidence scoring using TF-IDF vectorization and Machine Learning classifiers.
- 📈 **Predictive Spending Forecast**: Time-series velocity regression projecting month-end totals and overspending risks based on historical velocity.
- 🛡️ **Anomaly & Outlier Detection**: Isolation Forest and statistical Z-score algorithms flagging abnormal spending spikes and unusual patterns.
- 🔁 **Subscription Hike Radar**: Automatically tracks recurring charges and detects hidden price hikes over billing cycles.
- 🎯 **Smart Budget Safeguards**: Category-wise and overall monthly budget targets with dynamic status tracking.
- 📅 **Dynamic 60-Day Spending Heatmap**: Interactive GitHub-style calendar matrix for daily spending density visualization.
- 📄 **Bank Statement & CSV Importer**: Multi-format parser with automated bulk AI categorization and anomaly scanning.
- 🧠 **Adaptive Online Learning**: Continuously refines classification accuracy based on user re-classifications and feedback.
- 👑 **Administrator Oversight Portal**: System-wide dashboard for admins to inspect cumulative platform metrics, user engagement, and category-level spending distributions.
- 🔒 **Secure Architecture**: JWT-based session authentication, Bcrypt password hashing, and role-based access control (RBAC).

---

## 🏗️ Architecture & Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database ORM**: SQLAlchemy
- **Data Processing & ML**: Scikit-Learn, NumPy, Pandas
- **Security**: JWT (JSON Web Tokens), Passlib (Bcrypt)

### Frontend
- **Framework**: React (Vite)
- **Styling**: Vanilla CSS (Custom Glassmorphism Design System)
- **Icons**: Lucide React
- **Data Visualization**: Recharts, Custom Heatmap Matrix

---

## 🏛️ Project Directory Structure

```
Expense Tracker Project/
├── backend/
│   ├── app/
│   │   ├── api/             # REST API Endpoints (Auth, Transactions, Budgets, AI, Analytics, Admin)
│   │   ├── core/            # Configuration, Database Engine, JWT & Security Utilities
│   │   ├── models/          # SQLAlchemy Database Models (User, Transaction, Budget, Feedback, etc.)
│   │   ├── schemas/         # Pydantic Request & Response Validation Schemas
│   │   ├── services/        # AI/ML Engines (NLP Categorizer, Forecaster, Anomaly Detection, Clustering)
│   │   └── main.py          # FastAPI Application Entrypoint
│   ├── requirements.txt     # Python Dependencies
│   ├── seed_data.py         # Sample Data Generator
│   └── sample_bank_statement.csv # Test Bank Statement Dataset
├── frontend/
│   ├── src/
│   │   ├── api/             # API Client & Interceptors
│   │   ├── context/         # Auth Context & Global State Management
│   │   ├── components/      # UI Components (Navbar, Sidebar, StatCard, Heatmap, Modals)
│   │   ├── pages/           # Application Views (Dashboard, Transactions, Budgets, Categories, AI Insights)
│   │   └── index.css        # Design System & Theme Styles
│   ├── package.json
│   └── vite.config.js
└── README.md                # Project Documentation
```
