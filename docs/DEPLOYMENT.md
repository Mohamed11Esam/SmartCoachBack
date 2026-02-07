# SmartCoach Deployment Guide

## Live URLs

| Service | URL | Platform |
|---------|-----|----------|
| **Backend API** | https://exact-gwenette-fitglow-38dc47eb.koyeb.app | Koyeb |
| **AI Service** | https://mohamedEsam1-smartcoachai.hf.space | Hugging Face Spaces |
| **Database** | MongoDB Atlas | Cloud |
| **API Docs** | https://exact-gwenette-fitglow-38dc47eb.koyeb.app/api | Swagger UI |

---

## Backend (NestJS) - Koyeb

### Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `JWT_EXPIRES_IN` | Token expiration (e.g., `7d`) |
| `AI_SERVICE_URL` | `https://mohamedEsam1-smartcoachai.hf.space` |
| `NODE_ENV` | `production` |
| `PORT` | `8000` |

### Deployment Steps

1. Push code to GitHub
2. Koyeb auto-deploys from `main` branch
3. Uses Docker builder with `Dockerfile`

### Health Check

```bash
curl https://exact-gwenette-fitglow-38dc47eb.koyeb.app/
# Returns: Hello World!
```

---

## AI Service (FastAPI) - Hugging Face Spaces

### Environment Variables (Secrets)

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | Detailed health status |
| `/docs` | GET | Swagger documentation |
| `/rag/query` | POST | Chat with AI |
| `/rag/workout-plan` | POST | Generate workout plan |
| `/rag/meal-plan` | POST | Generate meal plan |
| `/rag/plan` | POST | Generate complete fitness plan |

### Health Check

```bash
curl https://mohamedEsam1-smartcoachai.hf.space/health
# Returns: {"status":"healthy","rag_initialized":true}
```

---

## MongoDB Atlas

### Connection String Format

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database>?retryWrites=true&w=majority
```

### Network Access

- Allow access from anywhere: `0.0.0.0/0`
- Required for cloud platforms (Koyeb, HF Spaces)

---

## Flutter Integration

Update API base URL in Flutter app:

```dart
class ApiConfig {
  static const String baseUrl = 'https://exact-gwenette-fitglow-38dc47eb.koyeb.app';
}
```

---

## Dashboard Integration

Update `.env` in dashboard:

```env
VITE_API_BASE_URL=https://exact-gwenette-fitglow-38dc47eb.koyeb.app
```

---

## Redeployment

### Backend (Koyeb)
```bash
git push origin main
# Koyeb auto-deploys
```

### AI Service (HF Spaces)
```bash
git push hf main
# HF Spaces auto-deploys
```

---

## Troubleshooting

### MongoDB Connection Failed
- Check `MONGODB_URI` is correct
- Ensure IP `0.0.0.0/0` is whitelisted in Atlas

### AI Service Not Responding
- Check `GEMINI_API_KEY` secret is set in HF Spaces
- Restart the Space from Settings

### 401 Unauthorized
- JWT token expired
- Call `/auth/refresh` with refresh token
