# EventSense — AI-Powered Event Budget Predictor with Smart Cost Optimization

---

## Project Overview

**EventSense** is an intelligent AI-powered web platform designed to help users in Sri Lanka plan events with accurate budget predictions and smart vendor recommendations.

The system uses **Machine Learning models** (Random Forest Regression + Logistic Regression) integrated with a modern **React.js + Node.js + Flask** architecture to deliver real-time budget breakdowns, cost optimization suggestions, and vendor recommendations.

---

## Features

- **User Authentication** — Register, Login with Email OTP verification
- **Guest Mode** — Quick budget predictions without registration
- **AI Budget Prediction** — Random Forest Regression model predicts total event cost
- **Smart Cost Optimization** — Budget breakdown across Random Forest Regression Multi output Model
- **Vendor Recommendation** — Logistic Regression model suggests best vendors
- **Prediction History** — Logged-in users can view past predictions
- **Email Summary** — Prediction results sent to user's email automatically
- **Admin Dashboard** — Manage users, view all histories, system control

---

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React.js, TypeScript, Tailwind CSS, JavaScript (ES6) |
| **Backend** | Node.js, Express.js |
| **ML API** | Python, Flask, Scikit-learn |
| **Database** | MongoDB |
| **ML Models** | Random Forest Regression, Multi-Output Regression, Logistic Regression |
| **Libraries** | Pandas, NumPy, Matplotlib, Seaborn, Plotly, Joblib |
| **Dev Tools** | VS Code, GitHub, Google Colab, Google Drive |

---

## Project Structure

```
EventSense-AI-Powered-Event-Budget-Predictor/
│
├── frontend/                    
│   ├── src/
│   │   ├── components/          
│   │   ├── pages/               
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     
│   ├── routes/                  
│   ├── models/                  
│   ├── controllers/
│   ├── server.js
│   └── package.json
│
├── ml_model/                    
│   ├── models/                  
│   ├── app.py                   
│   └── requirements.txt
│
└── README.md
```

---

## Installation & Setup Guide

### Prerequisites

Make sure the following are installed on your machine:

- [Git](https://git-scm.com/downloads)
- [Node.js v18+](https://nodejs.org)
- [Python 3.9+](https://python.org/downloads)
- [MongoDB](https://www.mongodb.com/try/download/community)

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Dulakshi987/EventSense-AI-Powered-Event-Budget-Predictor-with-Smart-Cost-Optimization.git

cd EventSense-AI-Powered-Event-Budget-Predictor-with-Smart-Cost-Optimization
```

---

### Step 2 — Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

> Runs on: `http://localhost:5173`

---

### Step 3 — Backend Setup

```bash
cd backend

npm install
```

Create a `.env` file inside the `backend/` folder:

```env
MONGO_URI=mongodb://localhost:27017/eventsense
JWT_SECRET=your_secret_key_here
PORT=5000
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
FLASK_API_URL=http://localhost:5001
```

Then start the server:

```bash
npm start
```

> Runs on: `http://localhost:5000`

---

### Step 4 — ML Flask API Setup

```bash
cd ml_model

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
venv\Scripts\activate        # Windows
source venv/bin/activate      # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Start Flask API
python app.py
```

> Runs on: `http://localhost:5001`

---

## Admin Login

```
Email:    admin@eventsense.com
Password: admin12345
```

---

## ML Models Used

| Model | Purpose |
|-------|---------|
| Random Forest Regression | Predicts total event cost |
| Multi-Output Regression | Predicts individual service costs simultaneously |
| Logistic Regression | Vendor & venue recommendations |

---
