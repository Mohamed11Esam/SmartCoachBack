# SmartCoach AI Integration Guide

Complete documentation for the AI service and its integration with the NestJS backend.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [AI Service Setup](#ai-service-setup)
3. [NestJS Integration](#nestjs-integration)
4. [API Endpoints](#api-endpoints)
5. [Data Models](#data-models)
6. [Flutter Integration](#flutter-integration)
7. [Configuration](#configuration)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Flutter App   │      │  NestJS Backend │      │   AI Service    │
│                 │ HTTP │   (Port 3000)   │ HTTP │   (Port 8000)   │
│  - UI/UX        │─────>│  - Auth (JWT)   │─────>│  - RAG System   │
│  - State Mgmt   │<─────│  - Validation   │<─────│  - Gemini AI    │
│                 │      │  - DB Storage   │      │  - Knowledge DB │
└─────────────────┘      └────────┬────────┘      └─────────────────┘
                                  │
                         ┌────────▼────────┐
                         │    MongoDB      │
                         │  - Users        │
                         │  - Chat History │
                         │  - Workouts     │
                         └─────────────────┘
```

### Why This Architecture?

| Benefit | Description |
|---------|-------------|
| **Security** | API keys stored on server only, never exposed to client |
| **Authentication** | NestJS validates JWT before calling AI service |
| **Rate Limiting** | Control AI usage per user |
| **Caching** | Cache common responses in NestJS |
| **Logging** | Track all AI interactions |
| **Fallbacks** | NestJS provides fallback responses if AI is down |

---

## AI Service Setup

### Location

After separation, the AI service lives at: `D:\SmartCoachAI`

### Prerequisites

- Python 3.10 or higher
- Google Gemini API key (free)

### Installation

```bash
# Navigate to AI service
cd D:\SmartCoachAI

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Environment Setup

Create `.env` file:

```env
# Required - Get free key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-api-key-here

# Optional
PORT=8000
HOST=0.0.0.0
```

### Running the Service

```bash
# Development (with auto-reload)
uvicorn main:app --reload --port 8000

# Production
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Verify Installation

```bash
# Health check
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","rag_initialized":true}
```

---

## NestJS Integration

### Module Structure

```
src/modules/ai/
├── ai.module.ts        # Module definition
├── ai.controller.ts    # HTTP endpoints
├── ai.service.ts       # Business logic & AI service calls
└── dto/
    ├── ai.dto.ts               # Request/Response DTOs
    └── generate-workout.dto.ts  # Workout-specific DTO
```

### AI Service Configuration

In NestJS `.env`:

```env
AI_SERVICE_URL=http://localhost:8000
```

### Service Methods

The `AiService` class provides these methods:

```typescript
// Chat with AI
async chat(query: string): Promise<ChatResponse>

// Generate complete fitness plan
async generatePlan(userData: any): Promise<PlanResponse>

// Generate workout plan
async generateWorkoutPlan(preferences: GenerateWorkoutDto): Promise<WorkoutPlanResponse>

// Generate meal plan
async generateMealPlan(preferences: any): Promise<MealPlanResponse>

// Get user's chat history
async getHistory(userId: string): Promise<HistoryResponse[]>
```

### Error Handling

The NestJS service includes:
- Automatic error catching from AI service
- Fallback responses when AI is unavailable
- Proper HTTP status codes

---

## API Endpoints

### NestJS Endpoints (For Flutter)

All endpoints require JWT authentication.

#### 1. Chat with AI

```http
POST /ai/chat
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "query": "What's a good chest workout for beginners?"
}
```

**Response:**
```json
{
  "response": "Here's a great beginner chest workout...",
  "sources": ["Push-ups", "Bench Press basics"]
}
```

#### 2. Generate Fitness Plan

```http
POST /ai/plan
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "userData": {
    "goal": "build_muscle",
    "fitnessLevel": "beginner",
    "durationWeeks": 4
  }
}
```

#### 3. Generate Workout Plan

```http
POST /ai/workout-plan
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "fitnessLevel": "Beginner",
  "duration": 45,
  "goals": ["strength", "endurance"],
  "equipment": ["dumbbells", "bodyweight"]
}
```

**Response:**
```json
{
  "plan": {
    "name": "Beginner Strength Builder",
    "days_per_week": 3,
    "workouts": [
      {
        "day": 1,
        "name": "Full Body Workout",
        "duration_minutes": 45,
        "exercises": [
          {
            "name": "Squats",
            "sets": 3,
            "reps": "10-12",
            "rest_seconds": 60
          }
        ],
        "warmup": "5 min light cardio",
        "cooldown": "5 min stretching"
      }
    ]
  }
}
```

#### 4. Generate Meal Plan

```http
POST /ai/meal-plan
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "diet": "balanced",
  "targetCalories": 2500,
  "mealsPerDay": 4,
  "allergies": ["peanuts"]
}
```

**Response:**
```json
{
  "plan": {
    "name": "Muscle Builder Meal Plan",
    "goal": "build_muscle",
    "daily_calories": 2500,
    "meals_per_day": 4,
    "daily_plan": [
      {
        "meal": "Breakfast",
        "time": "7:00 AM",
        "name": "Protein Oatmeal Bowl",
        "calories": 550,
        "protein_g": 35,
        "ingredients": ["oats", "protein powder", "banana", "almond milk"]
      }
    ],
    "tips": ["Eat protein with every meal", "Stay hydrated"]
  }
}
```

#### 5. Get Chat History

```http
GET /ai/history
Authorization: Bearer <jwt_token>
```

**Response:**
```json
[
  {
    "id": "conv_123",
    "title": "Chest workout question...",
    "date": "2024-01-15T10:30:00Z"
  }
]
```

### AI Service Endpoints (Internal)

These are called by NestJS, not directly by Flutter.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | Detailed health status |
| `/rag/query` | POST | Chat/Q&A |
| `/rag/plan` | POST | Complete fitness plan |
| `/rag/workout-plan` | POST | Workout plan only |
| `/rag/meal-plan` | POST | Meal plan only |

---

## Data Models

### Request DTOs

```typescript
// Chat request
class ChatDto {
  query: string;  // Required - the user's question
}

// Workout plan request
enum FitnessLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

class GenerateWorkoutDto {
  fitnessLevel: FitnessLevel;      // Required - Beginner, Intermediate, or Advanced
  goals: string[];                  // Required - e.g., ['muscle_gain', 'fat_loss', 'endurance']
  duration: number;                 // Required - 15 to 120 minutes
  equipment?: string[];             // Optional - e.g., ['dumbbells', 'barbell', 'bodyweight']
  targetMuscles?: string[];         // Optional - e.g., ['chest', 'back', 'legs']
}

// Meal plan request
class GenerateMealPlanDto {
  diet?: string;                    // Optional - 'keto', 'vegan', 'balanced'
  targetCalories?: number;          // Optional - 1000 to 5000
  allergies?: string[];             // Optional - e.g., ['peanuts', 'dairy']
  mealsPerDay?: number;             // Optional - default 3
}

// General fitness plan request
class GeneratePlanDto {
  userData: {
    age?: number;
    weight?: number;
    height?: number;
    fitnessLevel?: string;
    goals?: string[];
  };
}
```

### Response Models

```typescript
// Chat response
interface ChatResponse {
  response: string;
  sources?: string[];
}

// Workout plan response
interface WorkoutPlanResponse {
  plan: {
    name: string;
    days_per_week: number;
    workouts: Workout[];
  };
  user_id: string;
}

interface Workout {
  day: number;
  name: string;
  duration_minutes: number;
  exercises: Exercise[];
  warmup: string;
  cooldown: string;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
}

// Meal plan response
interface MealPlanResponse {
  plan: {
    name: string;
    goal: string;
    daily_calories: number;
    meals_per_day: number;
    daily_plan: Meal[];
    tips: string[];
  };
  user_id: string;
}

interface Meal {
  meal: string;      // 'Breakfast', 'Lunch', etc.
  time: string;
  name: string;
  calories: number;
  protein_g: number;
  ingredients: string[];
}
```

---

## Flutter Integration

### API Service Example

```dart
import 'package:dio/dio.dart';

class AiApiService {
  final Dio _dio;
  final String baseUrl = 'http://your-backend-url:3000';

  AiApiService(this._dio);

  // Set auth token
  void setAuthToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  // Chat with AI
  Future<ChatResponse> chat(String query) async {
    final response = await _dio.post(
      '$baseUrl/ai/chat',
      data: {'query': query},
    );
    return ChatResponse.fromJson(response.data);
  }

  // Generate workout plan
  Future<WorkoutPlanResponse> generateWorkoutPlan({
    required String fitnessLevel,
    required int duration,
    required List<String> goals,
    List<String>? equipment,
  }) async {
    final response = await _dio.post(
      '$baseUrl/ai/workout-plan',
      data: {
        'fitnessLevel': fitnessLevel,
        'duration': duration,
        'goals': goals,
        'equipment': equipment,
      },
    );
    return WorkoutPlanResponse.fromJson(response.data);
  }

  // Generate meal plan
  Future<MealPlanResponse> generateMealPlan({
    String? diet,
    int? targetCalories,
    int? mealsPerDay,
    List<String>? allergies,
  }) async {
    final response = await _dio.post(
      '$baseUrl/ai/meal-plan',
      data: {
        'diet': diet,
        'targetCalories': targetCalories,
        'mealsPerDay': mealsPerDay,
        'allergies': allergies,
      },
    );
    return MealPlanResponse.fromJson(response.data);
  }

  // Get chat history
  Future<List<ChatHistory>> getChatHistory() async {
    final response = await _dio.get('$baseUrl/ai/history');
    return (response.data as List)
        .map((e) => ChatHistory.fromJson(e))
        .toList();
  }
}
```

### Model Classes

```dart
class ChatResponse {
  final String response;
  final List<String>? sources;

  ChatResponse({required this.response, this.sources});

  factory ChatResponse.fromJson(Map<String, dynamic> json) {
    return ChatResponse(
      response: json['response'],
      sources: json['sources']?.cast<String>(),
    );
  }
}

class WorkoutPlanResponse {
  final WorkoutPlan plan;

  WorkoutPlanResponse({required this.plan});

  factory WorkoutPlanResponse.fromJson(Map<String, dynamic> json) {
    return WorkoutPlanResponse(
      plan: WorkoutPlan.fromJson(json['plan']),
    );
  }
}

class WorkoutPlan {
  final String name;
  final int daysPerWeek;
  final List<Workout> workouts;

  WorkoutPlan({
    required this.name,
    required this.daysPerWeek,
    required this.workouts,
  });

  factory WorkoutPlan.fromJson(Map<String, dynamic> json) {
    return WorkoutPlan(
      name: json['name'],
      daysPerWeek: json['days_per_week'],
      workouts: (json['workouts'] as List)
          .map((e) => Workout.fromJson(e))
          .toList(),
    );
  }
}
```

### Usage in Widget

```dart
class WorkoutPlanScreen extends StatefulWidget {
  @override
  _WorkoutPlanScreenState createState() => _WorkoutPlanScreenState();
}

class _WorkoutPlanScreenState extends State<WorkoutPlanScreen> {
  final AiApiService _aiService = getIt<AiApiService>();
  WorkoutPlan? _plan;
  bool _loading = false;

  Future<void> _generatePlan() async {
    setState(() => _loading = true);

    try {
      final response = await _aiService.generateWorkoutPlan(
        fitnessLevel: 'Beginner',
        duration: 45,
        goals: ['strength', 'muscle_building'],
      );
      setState(() => _plan = response.plan);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('AI Workout Plan')),
      body: _loading
          ? Center(child: CircularProgressIndicator())
          : _plan != null
              ? WorkoutPlanWidget(plan: _plan!)
              : Center(
                  child: ElevatedButton(
                    onPressed: _generatePlan,
                    child: Text('Generate Workout Plan'),
                  ),
                ),
    );
  }
}
```

---

## Configuration

### Environment Variables

#### NestJS Backend (.env)

```env
# AI Service URL
AI_SERVICE_URL=http://localhost:8000

# For production with Docker
AI_SERVICE_URL=http://ai-service:8000
```

#### AI Service (.env)

```env
# Required
GEMINI_API_KEY=your-gemini-api-key

# Optional
PORT=8000
HOST=0.0.0.0
```

### Docker Compose (Production)

```yaml
version: '3.8'

services:
  backend:
    build: ./SmartCoachBack
    ports:
      - "3000:3000"
    environment:
      - AI_SERVICE_URL=http://ai-service:8000
    depends_on:
      - mongodb
      - ai-service

  ai-service:
    build: ./SmartCoachAI
    ports:
      - "8000:8000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

---

## Troubleshooting

### Common Issues

#### 1. AI Service Not Responding

```bash
# Check if service is running
curl http://localhost:8000/health

# Check logs
# In AI service terminal, look for errors
```

**Solutions:**
- Verify AI service is running on port 8000
- Check `AI_SERVICE_URL` in NestJS .env
- Ensure no firewall blocking port 8000

#### 2. "GEMINI_API_KEY not set"

```bash
# Verify .env file exists
cat .env

# Verify key is loaded
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.getenv('GEMINI_API_KEY'))"
```

**Solutions:**
- Create .env file from .env.example
- Get API key from https://aistudio.google.com/app/apikey
- Restart AI service after adding key

#### 3. Slow Responses

The first request may be slow due to:
- Model loading (sentence transformers)
- TF-IDF index building

**Solutions:**
- First request takes ~5-10 seconds, subsequent requests are faster
- Consider adding a warmup request on service startup

#### 4. NestJS Can't Connect to AI Service

```typescript
// Error: connect ECONNREFUSED 127.0.0.1:8000
```

**Solutions:**
- Start AI service before NestJS
- Check AI_SERVICE_URL in NestJS .env
- In Docker, use service name (ai-service) not localhost

#### 5. CORS Errors

AI service has CORS enabled for all origins by default. If issues persist:

```python
# In main.py, verify CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Knowledge Base

The AI service includes a knowledge base with:

| Category | Count | File |
|----------|-------|------|
| Exercises | 25 | `data/workouts.json` |
| Meals | 20 | `data/nutrition.json` |
| Tips | 25 | `data/tips.json` |

### Adding More Data

To expand the knowledge base, add entries to the JSON files:

```json
// data/workouts.json
{
  "exercises": [
    {
      "name": "Exercise Name",
      "muscle_group": "chest|back|legs|shoulders|arms|core|full body|cardio",
      "difficulty": "beginner|intermediate|advanced",
      "description": "What this exercise does",
      "instructions": "How to perform it",
      "sets": 3,
      "reps": "10-12",
      "equipment": "none|barbell|dumbbells|machine"
    }
  ]
}
```

After adding data, restart the AI service to rebuild the search index.

---

## API Testing

### Using cURL

```bash
# Chat
curl -X POST http://localhost:3000/ai/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "Best exercises for back pain?"}'

# Workout Plan
curl -X POST http://localhost:3000/ai/workout-plan \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fitnessLevel": "Beginner", "duration": 30, "goals": ["strength"]}'
```

### Using Swagger

1. Start NestJS backend
2. Open http://localhost:3000/api
3. Click "Authorize" and enter JWT token
4. Test endpoints directly

---

## Summary

| Component | Location | Port | Purpose |
|-----------|----------|------|---------|
| Flutter App | Mobile | - | User interface |
| NestJS Backend | `D:\SmartCoachBack` | 3000 | API, Auth, DB |
| AI Service | `D:\SmartCoachAI` | 8000 | RAG + Gemini AI |
| MongoDB | Docker/Local | 27017 | Data storage |

**Flow:** Flutter -> NestJS (auth + validation) -> AI Service -> Response
