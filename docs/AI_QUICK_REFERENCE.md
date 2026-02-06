# SmartCoach AI - Quick Reference

## Start Services

```bash
# 1. Start AI Service (Port 8000) - SEPARATE REPO
cd D:\SmartCoachAI
venv\Scripts\activate
uvicorn main:app --reload --port 8000

# 2. Start NestJS Backend (Port 3000)
cd D:\SmartCoachBack
npm run start:dev
```

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
```json
POST /ai/chat
{
  "query": "What's a good beginner workout?"
}
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

## Environment Variables

### NestJS (.env)
```
AI_SERVICE_URL=http://localhost:8000
```

### AI Service (.env)
```
GEMINI_API_KEY=your-key-here
PORT=8000
```

## Health Checks

```bash
# AI Service
curl http://localhost:8000/health

# NestJS
curl http://localhost:3000/health
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| AI not responding | Check if AI service is running on port 8000 |
| Auth error | Verify JWT token is valid |
| Slow first request | Normal - model loading takes 5-10s |
| CORS error | AI service has CORS enabled by default |

## File Locations

| Component | Path |
|-----------|------|
| AI Service | `D:\SmartCoachAI` |
| NestJS Backend | `D:\SmartCoachBack` |
| AI Docs | `D:\SmartCoachBack\docs\AI_INTEGRATION.md` |
