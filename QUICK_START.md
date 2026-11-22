# ⚡ Quick Start Guide - Green Drive NoiseSense AI

## 🚀 Get Running in 2 Minutes

### Step 1: Install Dependencies

```bash
cd green-drive-noisesense-ai

# Install root dependencies
npm install

# Install frontend
cd frontend
npm install

# Install backend
cd ../backend
pip install -r requirements.txt
```

### Step 2: Start Development Server

**Option A: Run Everything at Once**
```bash
cd green-drive-noisesense-ai
npm run dev
```

**Option B: Run Separately (Recommended)**

**Terminal 1 - Frontend:**
```bash
cd green-drive-noisesense-ai/frontend
npm run dev
```
👉 Open: **http://localhost:5173**

**Terminal 2 - Backend:**
```bash
cd green-drive-noisesense-ai/backend
python -m uvicorn main:app --reload --port 8000
```
👉 API: **http://localhost:8000**

### Step 3: Access the Application

- **Dashboard**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs
- **Backend Health**: http://localhost:8000

---

## 📊 Populate Demo Data

Once the backend is running:

```bash
curl -X POST http://localhost:8000/api/demo/populate
```

This creates:
- ✅ 5 Kolkata locations
- ✅ Sample noise readings
- ✅ Demo alerts

---

## 🎯 What's Available Now

### Dashboard Features
- 📊 Real-time metrics (5 locations)
- 🚨 Active alert tracking
- 📈 Priority rankings
- 📢 Recent alerts feed

### Interactive Map
- 🗺️ 5 Kolkata locations
- 🎨 Color-coded status (Green/Orange/Red)
- 📍 Click for details
- 📊 Location statistics

### Analytics
- 📈 Noise trends over time
- 🔄 Location comparison
- 🎵 Sound type distribution
- 📥 CSV export

### Settings
- ⚙️ Configure thresholds (Critical/Warning)
- 🧠 AI model info
- 🔌 Hardware integration status
- 📋 System information

---

## 🔥 Key Features Working

✅ **Dashboard** - Real-time metrics and statistics  
✅ **Map** - Interactive location monitoring  
✅ **Alerts** - Automatic alert system  
✅ **Analytics** - Charts and reports  
✅ **Settings** - Configuration page  
✅ **API** - Full REST backend  
✅ **Database** - SQLite with ORM  
✅ **AI** - Sound classification ready  

---

## 📱 Browser Access

All pages work on mobile and desktop:
- Dashboard ✓
- Map ✓
- Analytics ✓
- Settings ✓

Responsive design with Tailwind CSS

---

## 🧠 AI Sound Classification

Ready to use with:
- **Google YAMNet** - 500+ sound types
- **TensorFlow** - Deep learning
- **librosa** - Audio processing

Currently using demo classification. To use real AI:
```bash
# Backend handles YAMNet automatically
# Just upload an audio file via API
POST /api/classify-audio
```

---

## 📡 Hardware Integration (Ready)

The system is ready for:
- **ESP32 + INMP441** microphone
- Real sensor data streaming
- WiFi connection
- API endpoints configured

---

## 🛠️ Common Issues

### "Cannot find module" error
```bash
cd frontend && npm install
cd ../backend && pip install -r requirements.txt
```

### Port 5173 or 8000 already in use
```bash
# Frontend (use different port)
npm run dev -- --port 5174

# Backend (use different port)
python -m uvicorn main:app --port 8001
```

### Database issues
```bash
rm backend/noisesense.db  # Delete existing
# Restart backend - new DB will be created
```

---

## 🔗 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Dashboard | http://localhost:5173 | Main app |
| API | http://localhost:8000 | Backend |
| API Docs | http://localhost:8000/docs | Interactive docs |
| Health | http://localhost:8000/api/health | System status |

---

## 📚 Next Steps

1. **Explore Dashboard** - See real-time metrics
2. **Check Map** - Interact with 5 locations
3. **View Analytics** - Analyze trends
4. **Configure Settings** - Adjust thresholds
5. **Review API** - at http://localhost:8000/docs

---

## 💡 Tips

- Use **Demo Mode** in Settings for testing
- Explore **API Documentation** at `/docs`
- Check **Console** for real-time updates
- Try **exporting** data as CSV
- Configure **thresholds** for your use case

---

## 🎉 You're Ready!

Your Green Drive NoiseSense AI system is ready to monitor environmental noise. Start the servers and visit the dashboard!

Need help? Check the full README.md for detailed documentation.

**Happy Monitoring!** 🌱🔊
