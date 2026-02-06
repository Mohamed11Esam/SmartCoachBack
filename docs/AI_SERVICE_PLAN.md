# FastAPI RAG AI Service - Simple Plan

## Overview

A simple AI service using RAG (Retrieval Augmented Generation) to provide personalized fitness and nutrition advice.

```
┌─────────────────────────────────────────────────────────┐
│                   How RAG Works                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. User asks: "What's a good chest workout?"            │
│                         │                                │
│                         ▼                                │
│  2. Search knowledge base for relevant info              │
│     ┌─────────────────────────────┐                     │
│     │  Vector Database (ChromaDB)  │                     │
│     │  - Workout exercises         │                     │
│     │  - Nutrition info            │                     │
│     │  - Fitness tips              │                     │
│     └─────────────────────────────┘                     │
│                         │                                │
│                         ▼                                │
│  3. Combine user question + relevant docs                │
│                         │                                │
│                         ▼                                │
│  4. Send to LLM (OpenAI/Gemini) for answer              │
│                         │                                │
│                         ▼                                │
│  5. Return personalized response                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure (Simple)

```
ai-service/
├── main.py                 # FastAPI app + all endpoints
├── rag.py                  # RAG logic (search + generate)
├── database.py             # ChromaDB setup
├── requirements.txt        # Python dependencies
├── .env                    # API keys
└── data/
    ├── workouts.json       # Workout exercises data
    ├── nutrition.json      # Nutrition/meals data
    └── tips.json           # Fitness tips
```

---

## Tech Stack (Simple & Free Options)

| Component | Technology | Why |
|-----------|------------|-----|
| Framework | FastAPI | Fast, easy, auto-docs |
| Vector DB | ChromaDB | Simple, no setup, runs locally |
| Embeddings | sentence-transformers | Free, runs locally |
| LLM | Google Gemini Free OR OpenAI | Gemini has free tier |

---

## API Endpoints (Must Match NestJS)

Your NestJS backend calls these endpoints:

```python
POST /rag/query          # General chat/questions
POST /rag/plan           # Generate fitness plan
POST /rag/meal-plan      # Generate meal plan
POST /rag/workout-plan   # Generate workout plan
```

---

## Simple Code Plan

### 1. main.py - FastAPI App

```python
from fastapi import FastAPI
from pydantic import BaseModel
from rag import RAGSystem

app = FastAPI(title="SmartCoach AI Service")
rag = RAGSystem()

class QueryRequest(BaseModel):
    query: str
    user_id: str = None

class PlanRequest(BaseModel):
    user_id: str
    goal: str  # "lose_weight", "build_muscle", "stay_fit"
    fitness_level: str  # "beginner", "intermediate", "advanced"
    preferences: dict = {}

@app.post("/rag/query")
async def chat(request: QueryRequest):
    response = rag.query(request.query)
    return {"response": response}

@app.post("/rag/plan")
async def generate_plan(request: PlanRequest):
    plan = rag.generate_fitness_plan(request)
    return {"plan": plan}

@app.post("/rag/meal-plan")
async def generate_meal_plan(request: PlanRequest):
    plan = rag.generate_meal_plan(request)
    return {"plan": plan}

@app.post("/rag/workout-plan")
async def generate_workout(request: PlanRequest):
    plan = rag.generate_workout_plan(request)
    return {"plan": plan}

@app.get("/health")
async def health():
    return {"status": "ok"}
```

### 2. rag.py - RAG Logic

```python
import chromadb
from sentence_transformers import SentenceTransformer
import google.generativeai as genai  # or openai

class RAGSystem:
    def __init__(self):
        # Load embedding model (runs locally, free)
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')

        # Setup ChromaDB (local vector database)
        self.chroma = chromadb.Client()
        self.collection = self.chroma.get_or_create_collection("fitness")

        # Setup LLM (Gemini free tier)
        genai.configure(api_key="YOUR_GEMINI_KEY")
        self.llm = genai.GenerativeModel('gemini-pro')

        # Load knowledge base
        self._load_knowledge_base()

    def _load_knowledge_base(self):
        """Load fitness data into vector DB"""
        # Load from JSON files and add to ChromaDB
        pass

    def query(self, question: str) -> str:
        # 1. Search relevant docs
        results = self.collection.query(
            query_texts=[question],
            n_results=3
        )

        # 2. Build prompt with context
        context = "\n".join(results['documents'][0])
        prompt = f"""You are a fitness coach assistant.

Context information:
{context}

User question: {question}

Provide a helpful, accurate response based on the context."""

        # 3. Get LLM response
        response = self.llm.generate_content(prompt)
        return response.text

    def generate_workout_plan(self, request) -> dict:
        # Similar logic with workout-specific prompt
        pass

    def generate_meal_plan(self, request) -> dict:
        # Similar logic with nutrition-specific prompt
        pass
```

### 3. requirements.txt

```
fastapi==0.109.0
uvicorn==0.27.0
chromadb==0.4.22
sentence-transformers==2.3.1
google-generativeai==0.3.2
python-dotenv==1.0.0
pydantic==2.5.3
```

---

## Knowledge Base (Sample Data)

### data/workouts.json
```json
{
  "exercises": [
    {
      "name": "Push-ups",
      "muscle_group": "chest",
      "difficulty": "beginner",
      "description": "Classic bodyweight exercise for chest and triceps",
      "instructions": "Start in plank position, lower body until chest nearly touches floor, push back up",
      "sets": 3,
      "reps": "10-15"
    },
    {
      "name": "Bench Press",
      "muscle_group": "chest",
      "difficulty": "intermediate",
      "description": "Barbell exercise for chest strength",
      "instructions": "Lie on bench, grip bar slightly wider than shoulders, lower to chest, press up",
      "sets": 4,
      "reps": "8-12"
    }
    // ... more exercises
  ]
}
```

### data/nutrition.json
```json
{
  "meals": [
    {
      "name": "Protein Oatmeal",
      "type": "breakfast",
      "calories": 450,
      "protein": 30,
      "carbs": 55,
      "fat": 12,
      "ingredients": ["oats", "protein powder", "banana", "almond milk"],
      "goal": ["build_muscle", "stay_fit"]
    }
    // ... more meals
  ]
}
```

---

## Setup Steps

### Step 1: Create Project
```bash
mkdir ai-service
cd ai-service
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### Step 2: Get Free Gemini API Key
1. Go to: https://makersuite.google.com/app/apikey
2. Create API key (free)
3. Add to `.env` file:
```
GEMINI_API_KEY=your-key-here
```

### Step 3: Add Knowledge Base
- Create `data/` folder
- Add JSON files with workout/nutrition data

### Step 4: Run Service
```bash
uvicorn main:app --reload --port 8000
```

### Step 5: Test
- Open http://localhost:8000/docs (Swagger UI)
- Test the endpoints

---

## Integration with NestJS

Your NestJS `.env`:
```
AI_SERVICE_URL=http://localhost:8000
```

The NestJS AI module already calls these endpoints - no changes needed!

---

## For Your Demo

1. **Prepare 20-30 exercises** in workouts.json
2. **Prepare 15-20 meals** in nutrition.json
3. **Add some fitness tips** in tips.json
4. The AI will use this data + LLM to give smart responses

---

## Timeline

| Task | Effort |
|------|--------|
| Setup FastAPI project | Simple |
| Create knowledge base JSON | Simple |
| Implement RAG logic | Medium |
| Test endpoints | Simple |
| Connect with NestJS | Already done! |

---

## Alternative: Even Simpler (No RAG)

If RAG is too complex, you can make it simpler:

```python
@app.post("/rag/query")
async def chat(request: QueryRequest):
    prompt = f"""You are SmartCoach, a fitness AI assistant.

User question: {request.query}

Provide helpful fitness/nutrition advice."""

    response = llm.generate_content(prompt)
    return {"response": response.text}
```

This just uses the LLM directly without RAG - easier but less accurate.

---

## Questions to Decide

1. **LLM Choice**: Gemini (free) or OpenAI (paid)?
2. **RAG or Simple**: Full RAG or just LLM prompts?
3. **Data**: Do you have fitness data or need me to create sample data?
