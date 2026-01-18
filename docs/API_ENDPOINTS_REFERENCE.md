# API Endpoints Reference

> **Base URL**: `http://localhost:3000` (Mobile: `10.0.2.2:3000`)

---

## 🔐 Auth Module

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Create a new account | - |
| `POST` | `/auth/login` | Authenticate and get JWT | - |
| `POST` | `/auth/send-otp` | Request email verification OTP | - |
| `POST` | `/auth/verify-otp` | Verify OTP code | - |
| `POST` | `/auth/refresh` | Refresh access token using refresh token | - |
| `POST` | `/auth/logout` | Invalidate refresh token | Yes |

---

## 👤 Users Module

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/users/me` | Get current user profile | Yes |
| `PUT` | `/users/me` | Update current user profile | Yes |
| `GET` | `/users` | List all users | Admin |
| `GET` | `/users/:id` | Get specific user details | Admin |
| `PATCH` | `/users/:id/ban` | **Block user login access** | Admin |
| `GET` | `/admin/dashboard` | Get high-level system stats | Admin |

---

## 🏋️ Coach Profiles

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/coach-profile` | **Search Coaches**. Params: `search`, `specialties`, `isVerified` | - |
| `GET` | `/coach-profile/me` | Get current coach's profile | Coach |
| `POST` | `/coach-profile` | Create coach profile | Coach |
| `PUT` | `/coach-profile/:id` | Update coach profile | Coach |
| `PATCH` | `/coach-profile/:id/verify` | Mark coach as verified | Admin |
| `GET` | `/coach-profile/:id` | Get public profile by ID | - |
| `POST` | `/coach-profile/:id/rate` | Leave a review/rating | Yes |
| `GET` | `/coach-profile/:id/reviews` | Get public reviews | - |

---

## 🤖 AI Module

| Method | Endpoint | Description | Auth | Body |
|---|---|---|---|---|
| `POST` | `/ai/chat` | RAG-based Chat | Yes | `{ query: string }` |
| `POST` | `/ai/plan` | Generate full fitness plan | Yes | `{ userData: object }` |
| `POST` | `/ai/meal-plan` | Generate meal plan | Yes | `{ diet, calories, ... }` |
| `POST` | `/ai/workout-plan` | Generate workout plan | Yes | `{ goals, fitnessLevel... }` |
| `GET` | `/ai/history` | Get past chat sessions | Yes | - |

---

## 💳 Payments Module

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/payments/create-checkout-session` | Initialize Stripe Checkout | Yes |
| `POST` | `/payments/webhook` | Stripe Webhook Listener | Public |

---

## 📈 Progress Module

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/progress-logs` | Create a daily log | Yes |
| `GET` | `/progress-logs/my-logs` | Get history of logs | Yes |
| `GET` | `/progress-logs/stats` | Get usage statistics | Yes |
| `POST` | `/progress-logs/metrics` | Log weight/body fat | Yes |
| `GET` | `/progress-logs/metrics` | Get metrics history | Yes |
| `POST` | `/progress-logs/goals` | Set a new fitness goal | Yes |
| `GET` | `/progress-logs/goals` | View active goals | Yes |
| `PUT` | `/progress-logs/goals/:id` | Update goal progress | Yes |

---

## 🔔 Notifications Module

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/notifications/device-token` | Register FCM Token | Yes |
| `DELETE` | `/notifications/device-token` | Remove FCM Token | Yes |
| `GET` | `/notifications` | List notifications | Yes |
| `PATCH` | `/notifications/:id/read` | Mark read | Yes |
| `DELETE` | `/notifications/:id` | Delete notification | Yes |

---

## 💪 Workouts & 🍎 Nutrition (Content)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/workouts` | Search/List Workouts | - |
| `GET` | `/workouts/:id` | Get Workout Details | - |
| `POST` | `/workouts` | Create Workout | Admin |
| `GET` | `/nutrition` | Search/List Nutrition info | - |
| `GET` | `/nutrition/:id` | Get Nutrition Details | - |
| `POST` | `/nutrition` | Create Nutrition Entry | Admin |

---

## 📅 Plans (Coach Created)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/plans` | Create a structured plan for a client | Coach |
| `PUT` | `/plans/:id` | Update a plan | Coach |
| `GET` | `/plans/active` | Get current user's active plan | Yes |
