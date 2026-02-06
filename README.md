# SmartCoach Backend API

A comprehensive fitness coaching platform backend built with NestJS, featuring AI-powered workout/meal planning, real-time chat, subscription management, and e-commerce capabilities.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [API Documentation](#api-documentation)
- [Module Documentation](#module-documentation)
- [Database Schema](#database-schema)
- [Authentication Flow](#authentication-flow)
- [Real-time Features](#real-time-features)
- [Production Deployment](#production-deployment)
- [Security Considerations](#security-considerations)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

SmartCoach is a fitness coaching platform that connects customers with professional coaches. The platform provides:

- **AI-Powered Planning**: Generate personalized workout and meal plans using AI
- **Coach Marketplace**: Browse, review, and subscribe to coaches
- **Real-time Chat**: WebSocket-based messaging between coaches and customers
- **Progress Tracking**: Log workouts, track metrics, and set fitness goals
- **Subscription System**: Stripe-powered subscription management
- **E-commerce**: Product catalog with shopping cart and orders
- **Push Notifications**: Multi-channel notifications (WebSocket, FCM, Email)
- **Media Uploads**: AWS S3 integration for file storage

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Applications                       │
│                  (Mobile App / Web App / Admin)                  │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
            ┌───────────────┐          ┌───────────────┐
            │   REST API    │          │   WebSocket   │
            │  (HTTP/HTTPS) │          │  (Socket.io)  │
            └───────┬───────┘          └───────┬───────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       NestJS Application                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   Auth   │ │   Users  │ │  Coach   │ │   Plans  │           │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   Chat   │ │ Payments │ │    AI    │ │ Products │           │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Workouts │ │Nutrition │ │ Progress │ │Notifica- │           │
│  │  Module  │ │  Module  │ │  Module  │ │  tions   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐                                      │
│  │   Cart   │ │  Media   │                                      │
│  │  Module  │ │  Module  │                                      │
│  └──────────┘ └──────────┘                                      │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
   ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
   │   MongoDB   │        │   AWS S3    │        │   Stripe    │
   │  (Database) │        │  (Storage)  │        │  (Payments) │
   └─────────────┘        └─────────────┘        └─────────────┘
          │
          │                       ▲                       ▲
          ▼                       │                       │
   ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
   │  AI Service │        │  Firebase   │        │    SMTP     │
   │  (External) │        │    (FCM)    │        │   (Email)   │
   └─────────────┘        └─────────────┘        └─────────────┘
```

### Design Patterns

- **Repository Pattern**: Abstract data access layer for database operations
- **Factory Pattern**: PlanFactory for creating plan instances
- **Strategy Pattern**: Multiple authentication strategies (Local, JWT)
- **Guard Pattern**: Authentication and authorization guards
- **Decorator Pattern**: Custom decorators for roles, public routes, and current user

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | NestJS 11.0.1 |
| Language | TypeScript 5.7.3 |
| Database | MongoDB with Mongoose 8.20.1 |
| Authentication | Passport.js, JWT, bcrypt |
| Real-time | Socket.io 4.8.1 |
| Payments | Stripe 20.0.0 |
| File Storage | AWS S3 |
| Push Notifications | Firebase Admin SDK |
| Email | Nodemailer 7.0.11 |
| Documentation | Swagger/OpenAPI |
| Validation | class-validator, class-transformer |
| Rate Limiting | @nestjs/throttler |

---

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- MongoDB 6.x+ (local or cloud)
- (Optional) Docker & Docker Compose

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd SmartCoachBack

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure environment variables (see below)

# Run database seed (optional)
npm run seed

# Start development server
npm run start:dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start` | Start production build |
| `npm run start:dev` | Start with hot-reload (development) |
| `npm run start:debug` | Start with debugger attached |
| `npm run start:prod` | Start optimized production build |
| `npm run build` | Build TypeScript to JavaScript |
| `npm run lint` | Run ESLint and fix issues |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage report |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run seed` | Seed database with sample data |

---

## Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# ===========================================
# APPLICATION
# ===========================================
NODE_ENV=development          # development | production | test
PORT=3000                     # Server port

# ===========================================
# DATABASE
# ===========================================
MONGODB_URI=mongodb://localhost:27017/smartcoach

# ===========================================
# AUTHENTICATION
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d             # Token expiration (e.g., 7d, 24h, 60m)

# ===========================================
# AI SERVICE (External)
# ===========================================
AI_SERVICE_URL=http://localhost:8000

# ===========================================
# STRIPE (Payments)
# ===========================================
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=http://localhost:3000/payment/success
STRIPE_CANCEL_URL=http://localhost:3000/payment/cancel

# ===========================================
# AWS S3 (File Storage)
# ===========================================
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=smartcoach-uploads

# ===========================================
# FIREBASE (Push Notifications)
# ===========================================
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json

# ===========================================
# EMAIL (SMTP)
# ===========================================
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
EMAIL_FROM=SmartCoach <noreply@smartcoach.com>
```

### Configuration Notes

- **JWT_SECRET**: Use a strong, random string (32+ characters) in production
- **STRIPE_WEBHOOK_SECRET**: Obtained from Stripe Dashboard > Webhooks
- **FIREBASE_CREDENTIALS_PATH**: Download service account JSON from Firebase Console
- **SMTP**: Can be left empty for development (emails logged to console)

---

## API Documentation

Once the server is running, access the interactive Swagger documentation at:

```
http://localhost:3000/api
```

### API Endpoints Summary

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/auth` | Registration, login, OTP, password reset |
| Users | `/users` | User profile management |
| Admin | `/admin` | Dashboard and admin operations |
| Coach Profile | `/coach-profile` | Coach profiles and reviews |
| Plans | `/plans` | Workout/nutrition plans |
| Workouts | `/workouts` | Free workout content |
| Nutrition | `/nutrition` | Free nutrition content |
| Progress Logs | `/progress-logs` | Progress tracking and goals |
| Chat | `/chat` | Conversations and messages |
| AI | `/ai` | AI-powered features |
| Payments | `/payments` | Subscriptions and checkout |
| Notifications | `/notifications` | Push notification management |
| Media | `/media` | File upload URLs |
| Products | `/products` | Product catalog |
| Cart | `/cart` | Shopping cart and orders |

---

## Module Documentation

### Auth Module (`/auth`)

Handles user authentication and authorization.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/register` | POST | Public | Register new user |
| `/auth/login` | POST | Public | Login with credentials |
| `/auth/send-otp` | POST | Public | Send OTP for verification |
| `/auth/verify-otp` | POST | Public | Verify OTP code |
| `/auth/forgot-password` | POST | Public | Request password reset |
| `/auth/reset-password` | POST | Public | Reset password with OTP |
| `/auth/refresh` | POST | Public | Refresh access token |
| `/auth/logout` | POST | JWT | Logout and invalidate tokens |

### Users Module (`/users`)

User profile and management operations.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/users/me` | GET | JWT | Get current user profile |
| `/users/me` | PUT | JWT | Update current user profile |
| `/users` | GET | Admin | List all users |
| `/users/:id` | GET | Admin | Get specific user |
| `/users/:id/ban` | PUT | Admin | Ban/unban user |

### Coach Profile Module (`/coach-profile`)

Coach discovery and profile management.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/coach-profile` | POST | Coach | Create coach profile |
| `/coach-profile/me` | GET | Coach | Get own coach profile |
| `/coach-profile/:id` | PUT | Coach | Update coach profile |
| `/coach-profile/:id/verify` | PUT | Admin | Verify coach |
| `/coach-profile` | GET | Public | List all coaches |
| `/coach-profile/:id` | GET | Public | Get coach details |
| `/coach-profile/:id/rate` | POST | JWT | Rate/review coach |
| `/coach-profile/:id/reviews` | GET | Public | Get coach reviews |

### Plans Module (`/plans`)

Workout and nutrition plan management.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/plans` | POST | Coach | Create new plan |
| `/plans/:id` | PUT | Coach | Update plan (versioned) |
| `/plans/active` | GET | JWT | Get active plan |

### AI Module (`/ai`)

AI-powered fitness features.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/ai/chat` | POST | JWT | Chat with AI assistant |
| `/ai/plan` | POST | JWT | Generate fitness plan |
| `/ai/meal-plan` | POST | JWT | Generate meal plan |
| `/ai/workout-plan` | POST | JWT | Generate workout plan |
| `/ai/history` | GET | JWT | Get chat history |

### Payments Module (`/payments`)

Stripe subscription management.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/payments/plans` | GET | Public | Get subscription plans |
| `/payments/create-checkout-session` | POST | JWT | Create Stripe checkout |
| `/payments/webhook` | POST | Public | Stripe webhook handler |

**Subscription Tiers:**
- **Basic**: $29.99/month - AI chat, workout library
- **Pro**: $49.99/month - Personal coaching, custom plans
- **Elite**: $99.99/month - Premium features, priority support

### Products Module (`/products`)

E-commerce product catalog.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/products` | GET | Public | List products (with filters) |
| `/products/:id` | GET | Public | Get product details |
| `/products` | POST | Admin | Create product |
| `/products/:id` | PUT | Admin | Update product |
| `/products/:id` | DELETE | Admin | Delete product |
| `/products/:id/review` | POST | JWT | Review product |

### Cart Module (`/cart`)

Shopping cart and order management.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/cart` | GET | JWT | Get cart |
| `/cart/add` | POST | JWT | Add item to cart |
| `/cart/:productId` | PUT | JWT | Update quantity |
| `/cart/:productId` | DELETE | JWT | Remove item |
| `/cart/checkout` | POST | JWT | Create order |
| `/cart/orders` | GET | JWT | Get orders |

---

## Database Schema

### User
```typescript
{
  email: string (unique)
  passwordHash: string
  role: 'Customer' | 'Coach' | 'Admin'
  firstName: string
  lastName: string
  isVerified: boolean
  isBanned: boolean
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'none'
  subscriptionId: string
  subscribedCoachId: ObjectId
  stripeCustomerId: string
  fcmTokens: string[]
  refreshToken: string (hashed)
}
```

### CoachProfile
```typescript
{
  userId: ObjectId (ref: User)
  bio: string
  specialties: string[]
  experienceYears: number
  certifications: string[]
  socialLinks: object
  averageRating: number
  isVerified: boolean
}
```

### Plan
```typescript
{
  userId: ObjectId (ref: User)
  coachId: ObjectId (ref: User)
  status: 'active' | 'archived'
  versionNumber: number
  goal: string
  days: [{
    dayNumber: number
    exercises: [{ exerciseId, sets, reps, weight }]
    meals: []
  }]
}
```

### Product
```typescript
{
  name: string
  description: string
  price: number
  salePrice: number
  images: string[]
  category: 'supplements' | 'equipment' | 'apparel' | 'accessories'
  stock: number
  isActive: boolean
  averageRating: number
  ratings: [{ userId, rating, comment, createdAt }]
}
```

---

## Authentication Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │         │   Backend   │         │  Database   │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │  POST /auth/register  │                       │
       │──────────────────────>│                       │
       │                       │  Hash password        │
       │                       │  (bcrypt, salt: 10)   │
       │                       │──────────────────────>│
       │                       │  Store user           │
       │  201 Created          │<──────────────────────│
       │<──────────────────────│                       │
       │                       │                       │
       │  POST /auth/login     │                       │
       │──────────────────────>│                       │
       │                       │  Validate credentials │
       │                       │──────────────────────>│
       │                       │<──────────────────────│
       │                       │  Generate JWT         │
       │  { accessToken,       │  (60 min expiry)      │
       │    refreshToken }     │                       │
       │<──────────────────────│                       │
       │                       │                       │
       │  GET /protected       │                       │
       │  Authorization: Bearer│                       │
       │──────────────────────>│                       │
       │                       │  Verify JWT           │
       │                       │  Check roles          │
       │  200 OK / 401 / 403   │                       │
       │<──────────────────────│                       │
```

### Token Payload
```json
{
  "email": "user@example.com",
  "sub": "user_id",
  "role": "Customer",
  "isVerified": true,
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## Real-time Features

### WebSocket Gateway

Connect to the WebSocket server at the same port as the HTTP server.

**Chat Events:**
```javascript
// Connect with authentication
const socket = io('http://localhost:3000', {
  auth: { token: 'Bearer <jwt_token>' }
});

// Join a conversation room
socket.emit('joinRoom', { conversationId: '...' });

// Send a message
socket.emit('sendMessage', {
  conversationId: '...',
  content: 'Hello!'
});

// Receive new messages
socket.on('newMessage', (message) => {
  console.log(message);
});
```

**Notification Events:**
```javascript
// Receive real-time notifications
socket.on('notification', (notification) => {
  console.log(notification);
});
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique `JWT_SECRET` (32+ characters)
- [ ] Configure production MongoDB (MongoDB Atlas recommended)
- [ ] Set up Stripe live keys and webhook
- [ ] Configure AWS S3 bucket with proper CORS
- [ ] Set up Firebase project for push notifications
- [ ] Configure production SMTP service
- [ ] Set up SSL/TLS certificates
- [ ] Configure rate limiting for your expected traffic
- [ ] Set up logging and monitoring
- [ ] Configure health checks

### Docker Deployment

```dockerfile
# Dockerfile (already included)
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

Build and run:
```bash
# Build the application
npm run build

# Build Docker image
docker build -t smartcoach-backend .

# Run container
docker run -d \
  --name smartcoach \
  -p 3000:3000 \
  --env-file .env.production \
  smartcoach-backend
```

### Docker Compose (Recommended)

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/smartcoach
    env_file:
      - .env.production
    depends_on:
      - mongo
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3

  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:
```

### Cloud Platform Deployment

#### AWS (Elastic Beanstalk / ECS)
1. Create ECR repository and push Docker image
2. Configure ECS task definition or EB environment
3. Set environment variables in task definition
4. Configure Application Load Balancer with SSL
5. Set up CloudWatch for logging

#### Google Cloud (Cloud Run / GKE)
1. Push image to Artifact Registry
2. Deploy to Cloud Run or GKE
3. Configure environment variables
4. Set up Cloud Load Balancing with SSL

#### Heroku
```bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create smartcoach-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=<your-mongodb-uri>
# ... set other variables

# Deploy
git push heroku main
```

### Performance Optimization

1. **Enable Compression**
   ```typescript
   // main.ts
   import * as compression from 'compression';
   app.use(compression());
   ```

2. **Enable Helmet (Security Headers)**
   ```typescript
   import helmet from 'helmet';
   app.use(helmet());
   ```

3. **Cluster Mode (PM2)**
   ```bash
   npm install -g pm2
   pm2 start dist/main.js -i max --name smartcoach
   ```

4. **MongoDB Indexes** (Already configured)
   - User: role, isBanned, subscriptionStatus
   - CoachProfile: specialties, isVerified
   - Product: text index on name/description

### Monitoring & Logging

1. **Application Monitoring**
   - Use services like DataDog, New Relic, or Sentry
   - Monitor API response times, error rates

2. **Log Aggregation**
   - Configure Winston or Pino for structured logging
   - Send logs to CloudWatch, Logstash, or similar

3. **Health Endpoint**
   - `GET /` returns basic health check
   - Consider adding database connectivity check

### Scaling Considerations

1. **Horizontal Scaling**
   - Application is stateless (except WebSocket)
   - Use Redis adapter for Socket.io in multi-instance setup

2. **Database Scaling**
   - Use MongoDB Atlas with auto-scaling
   - Configure read replicas for read-heavy workloads

3. **File Storage**
   - S3 with CloudFront CDN for media files
   - Presigned URLs reduce backend bandwidth

---

## Security Considerations

### Implemented Security Features

| Feature | Implementation |
|---------|----------------|
| Password Hashing | bcrypt with salt rounds: 10 |
| JWT Expiration | 60 minutes (configurable) |
| Refresh Token Rotation | Hashed storage, invalidation on logout |
| Rate Limiting | Global: 100 req/min, Auth endpoints: stricter |
| Input Validation | class-validator with whitelist |
| CORS | Enabled globally |
| Role-Based Access | @Roles decorator with RolesGuard |
| Webhook Verification | Stripe signature validation |

### Production Security Checklist

- [ ] Use HTTPS only (redirect HTTP to HTTPS)
- [ ] Set secure cookie options
- [ ] Implement CSRF protection for web clients
- [ ] Enable Helmet.js security headers
- [ ] Review and restrict CORS origins
- [ ] Use environment-specific secrets
- [ ] Enable request logging for audit trail
- [ ] Set up WAF (Web Application Firewall)
- [ ] Regular dependency updates (`npm audit`)
- [ ] Implement IP blocking for repeated failures

### Environment Security

```bash
# Never commit .env files
echo ".env*" >> .gitignore

# Use secrets management in production
# - AWS Secrets Manager
# - HashiCorp Vault
# - Google Secret Manager
```

---

## Testing

### Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

### Test Structure

```
src/
├── auth/
│   ├── auth.service.ts
│   └── auth.service.spec.ts
├── users/
│   ├── users.service.ts
│   └── users.service.spec.ts
test/
└── jest-e2e.json
```

### Coverage Goals

| Metric | Target |
|--------|--------|
| Statements | > 80% |
| Branches | > 75% |
| Functions | > 80% |
| Lines | > 80% |

---

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```
Error: MongoNetworkError: connect ECONNREFUSED
```
- Verify MongoDB is running: `mongod --version`
- Check MONGODB_URI in .env
- Ensure network connectivity to database

**JWT Token Invalid**
```
Error: JsonWebTokenError: invalid signature
```
- Ensure JWT_SECRET matches between token generation and validation
- Check token hasn't been tampered with
- Verify token hasn't expired

**Stripe Webhook Fails**
```
Error: Webhook signature verification failed
```
- Verify STRIPE_WEBHOOK_SECRET is correct
- Ensure raw body parsing for webhook endpoint
- Check Stripe Dashboard for webhook logs

**S3 Access Denied**
```
Error: AccessDenied: Access Denied
```
- Verify AWS credentials are correct
- Check S3 bucket policy and CORS configuration
- Ensure IAM user has s3:PutObject permission

**Firebase Notification Failed**
```
Error: Firebase credentials not found
```
- Download service account JSON from Firebase Console
- Set FIREBASE_CREDENTIALS_PATH to correct path
- Verify JSON file is valid

### Debug Mode

```bash
# Run with debug logging
DEBUG=* npm run start:dev

# NestJS specific debugging
npm run start:debug
```

### Health Check

```bash
# Check if API is running
curl http://localhost:3000/

# Expected response
# { "message": "SmartCoach API is running" }
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- Follow ESLint configuration
- Use Prettier for formatting
- Write tests for new features
- Update documentation as needed

---

## License

This project is proprietary software. All rights reserved.

---

## Support

For questions or issues:
- Create a GitHub issue
- Contact the development team
