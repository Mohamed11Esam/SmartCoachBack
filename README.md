# SmartCoach Backend API

A comprehensive fitness coaching platform backend built with NestJS, featuring AI-powered workout/meal planning, real-time chat, subscription management, and e-commerce capabilities.

## Live Deployment

| Service | URL |
|---------|-----|
| **Backend API** | https://exact-gwenette-fitglow-38dc47eb.koyeb.app |
| **AI Service** | https://mohamedEsam1-smartcoachai.hf.space |
| **API Docs** | https://exact-gwenette-fitglow-38dc47eb.koyeb.app/api |

## Features

- **AI-Powered Planning**: Generate personalized workout and meal plans using RAG + Gemini
- **Coach Marketplace**: Browse, review, and subscribe to coaches
- **Real-time Chat**: WebSocket-based messaging between coaches and customers
- **Progress Tracking**: Log workouts, track metrics, and set fitness goals
- **Subscription System**: Stripe-powered subscription management
- **E-commerce**: Product catalog with shopping cart and orders
- **Push Notifications**: Multi-channel notifications (WebSocket, FCM, Email)
- **Media Uploads**: AWS S3 integration for file storage

## Tech Stack

- **Backend**: NestJS + TypeScript
- **Database**: MongoDB (Atlas)
- **AI**: FastAPI + Google Gemini + RAG
- **Auth**: JWT + Passport
- **Payments**: Stripe
- **Storage**: AWS S3
- **Real-time**: Socket.io
- **Hosting**: Koyeb (Backend) + Hugging Face Spaces (AI)

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your values

# Run development server
npm run start:dev

# API available at http://localhost:3000
# Swagger docs at http://localhost:3000/api
```

### Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://...

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AI Service
AI_SERVICE_URL=https://mohamedEsam1-smartcoachai.hf.space

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=

# Stripe (optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## API Endpoints

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with OTP

### Users
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update profile
- `GET /users/saved` - Get saved workouts/meals

### AI
- `POST /ai/chat` - Chat with AI assistant
- `POST /ai/workout-plan` - Generate workout plan
- `POST /ai/meal-plan` - Generate meal plan

### Coaches
- `GET /coach-profile` - List all coaches
- `GET /coach-profile/:id` - Get coach details
- `POST /coach-profile` - Create coach profile
- `PUT /coach-profile/:id/verify` - Verify coach (Admin)

### Content
- `GET /workouts` - List workouts
- `GET /nutrition` - List meals
- `GET /products` - List products

### Commerce
- `GET /cart` - Get cart
- `POST /cart/add` - Add to cart
- `POST /cart/checkout` - Checkout

### Chat
- `GET /chat/conversations` - Get conversations
- `POST /chat/conversations/:id/messages` - Send message

See full API docs at: https://exact-gwenette-fitglow-38dc47eb.koyeb.app/api

## Project Structure

```
src/
├── modules/
│   ├── auth/          # Authentication & authorization
│   ├── users/         # User management
│   ├── coach-profile/ # Coach profiles & verification
│   ├── coach-client/  # Coach-client relationships
│   ├── ai/            # AI integration
│   ├── chat/          # Real-time messaging
│   ├── workouts/      # Workout content
│   ├── nutrition/     # Nutrition content
│   ├── products/      # E-commerce products
│   ├── cart/          # Shopping cart
│   ├── orders/        # Order management
│   ├── payments/      # Stripe integration
│   ├── notifications/ # Push notifications
│   ├── progress-logs/ # Progress tracking
│   ├── schedule/      # Session scheduling
│   └── media/         # File uploads (S3)
├── common/            # Shared utilities
└── main.ts            # Application entry
```

## Documentation

- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Flutter Integration](./docs/FLUTTER_INTEGRATION.md)
- [Flutter Quick Start](./docs/FLUTTER_QUICK_START.md)
- [AI Integration](./docs/AI_INTEGRATION.md)
- [Postman Collection](./docs/FitGlow_API.postman_collection.json)

## License

UNLICENSED - Private project
