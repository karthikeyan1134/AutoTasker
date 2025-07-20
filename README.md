# 📊 Task Analyser

Task Analyser is a productivity and task management tool that integrates with Gmail using the Google API. It automatically fetches tasks from emails and organizes them using natural language processing (NLP). Users can view tasks, analyze deadlines, and track completion.

---

## 🚀 Features

- 🔐 Google OAuth 2.0 login with secure sessions
- 📥 Gmail integration to fetch task-related emails
- 🧠 NLP model to extract and prioritize tasks
- 📅 Deadline and priority classification
- ✅ Task tracking and analysis dashboard
- 🌐 Full-stack architecture using React + Node.js
- 📊 MongoDB database for persistent storage

---

## 🏗️ Tech Stack

| Frontend     | Backend           | Database | APIs & Tools         |
| ------------ | ----------------- | -------- | -------------------- |
| React.js     | Node.js (Express) | MongoDB  | Gmail API, OAuth 2.0 |
| Tailwind CSS | Passport.js       | Mongoose | JWT / Sessions       |

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/karthikeyan1134/Task-analyser.git
cd Task-analyser
```

### 2. Backend Setup (/backend)

```bash
cd backend
npm install
```

Create a .env file in /backend:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
MONGO_URI=your_mongodb_uri
SESSION_SECRET=your_session_secret
FRONTEND_URL=http://localhost:3000
```

Start the backend server:

```bash
npm start
```

### 3. Frontend Setup (/frontend)

```bash
cd ../frontend
npm install
npm start
```

---

### 🔑 Google OAuth Setup

- Go to Google Cloud Console
- Create a new project or select an existing one
- Enable the Gmail API
- Set up OAuth consent screen (External)
- Create OAuth 2.0 Client ID:
  - Application type: Web
  - Authorized JavaScript Origins: http://localhost:3000
  - Authorized Redirect URIs: http://localhost:5000/auth/google/callback
- Copy the Client ID and Secret into your .env file

---

### 🧠 NLP Model

- The backend uses an NLP module to extract tasks from Gmail messages.
- Uses keyword extraction and date parsing to determine task urgency.

---

### 🔒 Security & Session Management

- Backend uses express-session to manage user sessions
- Sessions are stored securely in cookies and protected by CORS
- CORS is enabled for cross-origin requests from frontend

---

## 🛠️ Project Structure

```
Task-analyser/
│
├── backend/            # Node.js backend with Express
│   ├── routes/         # Auth and Gmail routes
│   ├── controllers/    # Request handlers
│   ├── models/         # Mongoose models
│   └── utils/          # NLP, Gmail API logic
│
├── frontend/           # React frontend
│   ├── components/     # UI Components
│   ├── pages/          # Views / Routes
│   └── services/       # Axios API calls
│
└── README.md
```

---

## ✨ Demo

🚀 Hosted link: [Coming soon]

---

## 👨‍💻 Author

Karthikeyan1134

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

### ✅ What You Should Do:

- Replace `images/dashboard.png` etc., with the actual image paths you upload.
- Insert your actual OAuth credentials in `.env` (but don’t commit them to GitHub).
- Replace demo URLs and add a live link if you deploy it.
