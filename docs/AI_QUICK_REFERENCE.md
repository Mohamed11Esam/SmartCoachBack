# SmartCoach AI - Quick Reference

## Live URLs

| Service | URL |
|---------|-----|
| AI Service | https://mohamedEsam1-smartcoachai.hf.space |
| Backend API | https://exact-gwenette-fitglow-38dc47eb.koyeb.app |
| API Docs | https://exact-gwenette-fitglow-38dc47eb.koyeb.app/api |

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/ai/chat` | POST | JWT | Chat with AI |
| `/ai/plan` | POST | JWT | Full fitness plan |
| `/ai/workout-plan` | POST | JWT | Workout plan |
| `/ai/meal-plan` | POST | JWT | Meal plan |
| `/ai/history` | GET | JWT | Chat history |

## Request Examples

### Chat
```bash
curl -X POST https://exact-gwenette-fitglow-38dc47eb.koyeb.app/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is a good beginner workout?"}'
```

### Workout Plan
```json
POST /ai/workout-plan
{
  "fitnessLevel": "Beginner",
  "goals": ["muscle_gain"],
  "duration": 45,
  "equipment": ["dumbbells"],
  "targetMuscles": ["chest", "back"]
}
```

### Meal Plan
```json
POST /ai/meal-plan
{
  "diet": "balanced",
  "targetCalories": 2000,
  "mealsPerDay": 3,
  "allergies": []
}
```

## Health Checks

```bash
# AI Service
curl https://mohamedEsam1-smartcoachai.hf.space/health

# Backend API
curl https://exact-gwenette-fitglow-38dc47eb.koyeb.app/
```

## Direct AI Service Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | Detailed health status |
| `/docs` | GET | Swagger documentation |
| `/rag/query` | POST | Direct AI chat |
| `/rag/workout-plan` | POST | Generate workout plan |
| `/rag/meal-plan` | POST | Generate meal plan |
| `/rag/plan` | POST | Generate complete fitness plan |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| AI not responding | Check HF Spaces status, may need restart |
| Auth error | Verify JWT token is valid |
| Slow first request | Normal - cold start takes 10-30s on free tier |
| 500 error | Check if GEMINI_API_KEY secret is set in HF Spaces |

## Local Development

```bash
# 1. Start AI Service (Port 8000)
cd D:\SmartCoachAI
venv\Scripts\activate
uvicorn main:app --reload --port 8000

# 2. Start NestJS Backend (Port 3000)
cd D:\SmartCoachBack
npm run start:dev

# Set in .env
AI_SERVICE_URL=http://localhost:8000
```

## GitHub Repos

| Component | Repository |
|-----------|------------|
| Backend | https://github.com/Mohamed11Esam/SmartCoachBack |
| AI Service | https://github.com/Mohamed11Esam/SmartCoachAI |
