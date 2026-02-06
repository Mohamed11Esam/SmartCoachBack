# FitGlow API - Flutter Quick Start

**Base URL:** `http://localhost:3000`

---

## Setup

```yaml
# pubspec.yaml
dependencies:
  dio: ^5.4.0
  socket_io_client: ^2.0.3
```

```dart
// api_client.dart
import 'package:dio/dio.dart';

final dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000'));
String? token;

void setToken(String t) {
  token = t;
  dio.options.headers['Authorization'] = 'Bearer $t';
}
```

---

## Auth

```dart
// Register
final res = await dio.post('/auth/register', data: {
  'email': 'user@example.com',
  'password': '123456',
  'firstName': 'John',
  'lastName': 'Doe',
  'role': 'Customer', // or 'Coach'
});

// Login
final res = await dio.post('/auth/login', data: {
  'email': 'user@example.com',
  'password': '123456',
});
setToken(res.data['access_token']);
final user = res.data['user'];

// Logout
await dio.post('/auth/logout');
```

---

## Profile

```dart
// Get my profile
final res = await dio.get('/users/me');

// Update profile (onboarding)
await dio.put('/users/me', data: {
  'gender': 'Male',
  'height': 180,
  'weight': 75,
  'fitnessGoal': 'Gain Muscle',
  'fitnessLevel': 'Beginner',
  'onboardingCompleted': true,
});
```

---

## Coaches

```dart
// Get all coaches
final res = await dio.get('/coach-profile');
final coaches = res.data as List;

// Get coach details
final res = await dio.get('/coach-profile/$coachId');

// Send request to coach
await dio.post('/coach-client/request', data: {
  'coachId': coachId,
  'message': 'I want to train with you!',
});

// Get my coach (as client)
final res = await dio.get('/coach-client/my-coach');
```

---

## Sessions

```dart
// Get coach availability
final res = await dio.get('/schedule/availability/$coachId', queryParameters: {
  'startDate': '2024-01-15',
  'endDate': '2024-01-22',
});
// Returns: [{ date: "2024-01-15", slots: [{startTime, endTime, isBooked}] }]

// Book a session
await dio.post('/schedule/sessions', data: {
  'coachId': coachId,
  'scheduledDate': '2024-01-15',
  'startTime': '09:00',
  'endTime': '10:00',
});

// Get my sessions
final res = await dio.get('/schedule/sessions/client', queryParameters: {
  'upcoming': true,
});

// Cancel session
await dio.delete('/schedule/sessions/$sessionId');
```

---

## Chat

```dart
// Get conversations
final res = await dio.get('/chat/conversations');

// Start conversation
final res = await dio.post('/chat/conversations', data: {
  'recipientId': oderId,
});

// Get messages
final res = await dio.get('/chat/conversations/$conversationId/messages');

// Send message (REST)
await dio.post('/chat/conversations/$conversationId/messages', data: {
  'content': 'Hello!',
});
```

### WebSocket Chat

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

final socket = IO.io('http://localhost:3000/chat',
  IO.OptionBuilder()
    .setTransports(['websocket'])
    .setAuth({'token': token})
    .build()
);

// Join conversation
socket.emit('joinConversation', conversationId);

// Send message
socket.emit('sendMessage', {
  'conversationId': conversationId,
  'content': 'Hello!',
});

// Receive messages
socket.on('newMessage', (data) {
  print('New message: ${data['content']}');
});

// Typing indicator
socket.emit('typing', {'conversationId': conversationId, 'isTyping': true});
```

---

## Workouts & Meals

```dart
// Get workouts
final res = await dio.get('/workouts');

// Filter workouts
final res = await dio.get('/workouts', queryParameters: {
  'category': 'Strength',
  'difficulty': 'Beginner',
});

// Get meals
final res = await dio.get('/nutrition');

// Save workout
await dio.post('/users/me/saved-workouts/$workoutId');

// Get saved workouts
final res = await dio.get('/users/me/saved-workouts');
```

---

## Store

```dart
// Get products
final res = await dio.get('/products');

// Add to cart
await dio.post('/cart/items', data: {
  'productId': productId,
  'quantity': 1,
});

// Get cart
final res = await dio.get('/cart');

// Checkout
await dio.post('/cart/checkout', data: {
  'shippingAddress': {
    'name': 'John Doe',
    'street': '123 Main St',
    'city': 'Cairo',
    'country': 'Egypt',
    'phone': '+201234567890',
  },
});
```

---

## Notifications

```dart
// Get notifications
final res = await dio.get('/notifications');

// Get unread count
final res = await dio.get('/notifications/unread-count');

// Mark as read
await dio.put('/notifications/$notificationId/read');

// Register FCM token
await dio.post('/notifications/device-token', data: {
  'token': fcmToken,
});
```

---

## File Upload

```dart
// 1. Get presigned URL
final res = await dio.post('/media/presigned-url', data: {
  'fileName': 'photo.jpg',
  'fileType': 'image/jpeg',
});
final uploadUrl = res.data['uploadUrl'];
final fileUrl = res.data['fileUrl'];

// 2. Upload to S3
await Dio().put(uploadUrl, data: imageBytes, options: Options(
  headers: {'Content-Type': 'image/jpeg'},
));

// 3. Use fileUrl in your request
await dio.put('/users/me', data: {'photoUrl': fileUrl});
```

---

## Error Handling

```dart
try {
  await dio.post('/auth/login', data: {...});
} on DioException catch (e) {
  final message = e.response?.data['message'] ?? 'Error';
  print(message);
}
```

---

## Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Need to login |
| 403 | No permission |
| 404 | Not found |

---

**Swagger Docs:** `http://localhost:3000/api`
