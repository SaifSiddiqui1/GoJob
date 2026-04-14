
🚀 JobVault
Your Smart Job Aggregation & Management System


JobVault is a powerful, automated job collection and management platform designed to gather, clean, classify, and store job listings from multiple sources in one place. It leverages automation workflows, AI classification, and structured storage to help users track and manage job opportunities efficiently.


📌 Table of Contents
Overview
Features
Tech Stack
Architecture
Workflow
Installation
Environment Variables
Usage
API Endpoints
Screenshots (Optional)
Future Enhancements
Contributing
License
🧠 Overview

JobVault is built to solve the problem of scattered job listings across multiple platforms. Instead of manually searching, JobVault:

Collects job data automatically (Telegram, APIs, etc.)
Filters and extracts relevant job links
Scrapes job details from career pages
Cleans and structures data
Stores it in a centralized database
Optionally enhances data using AI

✨ Features
🔍 Job Aggregation
Collect jobs from:
Telegram channels
Job APIs (Remotive, Arbeitnow, Adzuna)
Manual inputs


🧹 Data Cleaning
Extract only valid job URLs
Remove duplicates using Redis caching
Normalize job data (salary, location, etc.)


🤖 AI-Powered Classification
Categorize jobs automatically
Tag skills, roles, and experience levels
ATS-friendly structuring


📄 Job Scraping
Extract details from job pages:
Title
Company
Location
Salary
Description
Requirements


📊 Data Storage
MongoDB Atlas for persistent storage
Structured schema for fast querying


⚡ Automation
Fully automated pipelines using n8n
Real-time processing via webhooks


🛠️ Tech Stack
Frontend
React 18 + Vite
Tailwind CSS
Zustand (State Management)


Backend
Node.js + Express
MongoDB Atlas
Redis (Upstash)


Automation
n8n (Workflow automation)
AI Integration
Google Gemini API
HuggingFace (fallback)


Deployment
Vercel (Frontend)
Render (Backend)
Cloudinary (File storage)


🏗️ Architecture
Telegram / APIs / Manual Input
            ↓
        n8n Workflow
            ↓
   Link Extraction & Cleaning
            ↓
      Duplicate Check (Redis)
            ↓
     Job Page Scraping
            ↓
   AI Classification (Gemini)
            ↓
       MongoDB Storage
            ↓
        Admin / Frontend

        
🔄 Workflow
User sends job message via Telegram
n8n captures the message
Extracts job links
Filters only valid career/job URLs
Checks Redis for duplicates
Opens job page and scrapes data
Sends data to AI for classification
Stores structured job data in MongoDB
Displays jobs in dashboard


⚙️ Installation
1. Clone the Repository
git clone https://github.com/yourusername/jobvault.git
cd jobvault
2. Install Dependencies
npm install
3. Setup Backend
cd backend
npm install
4. Setup Frontend
cd frontend
npm install
🔐 Environment Variables


Create a .env file in the backend:

PORT=5000

MONGO_URI=your_mongodb_uri

REDIS_URL=your_redis_url

JWT_SECRET=your_secret_key


GEMINI_API_KEY=your_gemini_api_key

HUGGINGFACE_API_KEY=your_hf_key

CLOUDINARY_URL=your_cloudinary_url


▶️ Usage
Run Backend
npm run server
Run Frontend
npm run dev
Start n8n
n8n start


📡 API Endpoints
Jobs
GET /api/jobs → Get all jobs
POST /api/jobs → Add new job
GET /api/jobs/:id → Get job by ID
DELETE /api/jobs/:id → Delete job
AI
POST /api/ai/classify → Classify job data



🚀 Future Enhancements
🔔 Job alerts (Email / WhatsApp / Telegram)
📈 Analytics dashboard (job trends, skills demand)
🧠 Advanced AI resume-job matching
🌍 Multi-country job filtering
💼 Employer job posting panel
🔍 Semantic job search (vector DB)
📊 Salary prediction model
🤝 Contributing

Contributions are welcome!

Fork the repo
Create a new branch
Commit your changes
Push and create a PR


📜 License

This project is licensed under the MIT License.

💡 Author

Saif Siddiqui

Full Stack Developer
AI SaaS Builder (GoJob, JobVault)
⭐ Support

If you like this project:

Star ⭐ the repository
Share with others
Contribute improvements
