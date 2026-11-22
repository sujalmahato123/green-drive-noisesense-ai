#!/bin/bash

# Project root = folder containing this script
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Starting Green Drive NoiseSense AI..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📡 Starting Backend (FastAPI) on port 8000...${NC}"
cd "$ROOT/backend"
python3 -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
sleep 2

echo ""
echo -e "${BLUE}🎨 Starting Frontend (Vite) on port 5173...${NC}"
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🌱 Green Drive NoiseSense AI is running!${NC}"
echo ""
echo -e "📊 Dashboard: ${BLUE}http://localhost:5173${NC}"
echo -e "🔌 API: ${BLUE}http://localhost:8000${NC}"
echo -e "📚 API Docs: ${BLUE}http://localhost:8000/docs${NC}"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for both processes
wait
