# AI Gym Coach API - Integration Guide

**Base URL**: `http://localhost:3000` (Emulator: `10.0.2.2:3000`)
**Swagger UI**: `http://localhost:3000/api`

---

## 🚀 Key Updates & Features

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| **Advanced Search** | `/coach-profile?search=John&specialties=Yoga` | GET | Search coaches by Name OR Specialty |
| **User Ban** | `/users/:id/ban` | PATCH | **Admin Only**. Blocks user login (returns 401). |
| **Verify Coach** | `/coach-profile/:id/verify` | PATCH | **Admin Only**. Marks coach as verified. |
| **Subscription** | `/payments/create-checkout-session` | POST | Creates Stripe Session. Webhook handles activation. |

---

## 📱 Mobile Integration (Flutter)

### 1. Networking
Use `dio` or `http`.
**Important**: For Android Emulator, use `10.0.2.2:3000` as the Base URL. `localhost` will not work.

### 2. Authentication Flow
1. **Login**: `POST /auth/login` -> Store `access_token` and `refresh_token` in `flutter_secure_storage`.
2. **Access**: Send `Authorization: Bearer <token>` in headers.
3. **Banned Users**: Handle `401 Unauthorized` with message "User is banned". Redirect to Login page with error.

### 3. Push Notifications (FCM)
1. **Setup**: Use `firebase_messaging` package.
2. **Get Token**: `FirebaseMessaging.instance.getToken()`.
3. **Register**: Send token to backend:
   ```dart
   POST /notifications/device-token
   {
     "token": "fcm_token_string"
   }
   ```
4. **Receive**: Listen to `FirebaseMessaging.onMessage`.

### 4. Real-time Chat
Use `socket_io_client`.
```dart
IO.Socket socket = IO.io('http://10.0.2.2:3000', <String, dynamic>{
    'transports': ['websocket'],
    'autoConnect': false,
    'extraHeaders': {'Authorization': 'Bearer $token'} // Pass JWT here
});
socket.connect();
socket.emit('joinRoom', 'user-$userId');
```

---

## 💻 Web Integration (Next.js)

### 1. Payments (Stripe)
1.  **Select Coach**: User clicks "Subscribe".
2.  **Call Backend**: `POST /payments/create-checkout-session` with `{ coachId, priceId }`.
3.  **Redirect**: Backend returns `{ url }`. Redirect user to `url` (Stripe Checkout).
4.  **Success**: Stripe redirects back to `STRIPE_SUCCESS_URL` (e.g., `/dashboard?success=true`).
5.  **State**: Backend Webhook automatically updates `user.subscriptionStatus` to `active`.

### 2. Coach Search
Use the new Search API with debouncing.
```typescript
const searchCoaches = async (term: string) => {
  const res = await api.get(`/coach-profile?search=${term}`);
  return res.data;
}
```

---

## 📚 Endpoint Reference

### Authentication

**Login**
User login. Checks if user is banned.
```http
POST /auth/login
```
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Register**
```http
POST /auth/register
```
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "Customer", // or "Coach"
  "firstName": "John",
  "lastName": "Doe"
}
```

### Coach Profiles

**Search & Filter**
Find coaches by name or specialty.
```http
GET /coach-profile?search=Ryan&specialties=Bodybuilding,Yoga&isVerified=true
```

**Verify (Admin)**
```http
PATCH /coach-profile/:id/verify
```

### Users

**Ban User (Admin)**
```http
PATCH /users/:id/ban
```

### Workouts

**Filter**
```http
GET /workouts?difficulty=Advanced&tags=HIIT&minDuration=20
```

### AI Features

**Chat**
```http
POST /ai/chat
{ "query": "How to do a deadlift?" }
```

**Generate Plan**
```http
POST /ai/workflow-plan
{ "fitnessLevel": "Beginner", "goals": ["weight_loss"] }
```
