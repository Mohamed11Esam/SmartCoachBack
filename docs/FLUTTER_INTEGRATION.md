# FitGlow Backend - Flutter Integration Guide

Complete API documentation with Dart/Flutter code examples.

**Base URL**: `http://localhost:3000` (development) | `https://api.fitglow.com` (production)

---

## Table of Contents

1. [Setup & Configuration](#1-setup--configuration)
2. [Authentication](#2-authentication)
3. [User Profile & Onboarding](#3-user-profile--onboarding)
4. [Coaches](#4-coaches)
5. [Coach-Client Relationships](#5-coach-client-relationships)
6. [Scheduling & Sessions](#6-scheduling--sessions)
7. [Chat (REST + WebSocket)](#7-chat-rest--websocket)
8. [Workouts & Nutrition](#8-workouts--nutrition)
9. [Store & Cart](#9-store--cart)
10. [Notifications](#10-notifications)
11. [File Uploads](#11-file-uploads)

---

## 1. Setup & Configuration

### Dependencies (pubspec.yaml)

```yaml
dependencies:
  dio: ^5.4.0              # HTTP client
  socket_io_client: ^2.0.3  # WebSocket for chat
  firebase_messaging: ^14.7.0  # Push notifications
  shared_preferences: ^2.2.2   # Token storage
  image_picker: ^1.0.7     # Image selection
  http_parser: ^4.0.2      # File uploads
```

### API Client Setup

```dart
// lib/core/api/api_client.dart
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static const String baseUrl = 'http://localhost:3000';

  late Dio _dio;
  String? _accessToken;
  String? _refreshToken;

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_accessToken != null) {
          options.headers['Authorization'] = 'Bearer $_accessToken';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Try to refresh token
          final refreshed = await _refreshTokens();
          if (refreshed) {
            // Retry the request
            final opts = error.requestOptions;
            opts.headers['Authorization'] = 'Bearer $_accessToken';
            final response = await _dio.fetch(opts);
            return handler.resolve(response);
          }
        }
        return handler.next(error);
      },
    ));
  }

  Future<void> setTokens(String accessToken, String refreshToken) async {
    _accessToken = accessToken;
    _refreshToken = refreshToken;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', accessToken);
    await prefs.setString('refresh_token', refreshToken);
  }

  Future<void> loadTokens() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString('access_token');
    _refreshToken = prefs.getString('refresh_token');
  }

  Future<bool> _refreshTokens() async {
    if (_refreshToken == null) return false;
    try {
      final response = await _dio.post('/auth/refresh', data: {
        'refresh_token': _refreshToken,
      });
      _accessToken = response.data['access_token'];
      _refreshToken = response.data['refresh_token'];
      await setTokens(_accessToken!, _refreshToken!);
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<void> clearTokens() async {
    _accessToken = null;
    _refreshToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
  }

  Dio get dio => _dio;
  String? get accessToken => _accessToken;
  bool get isLoggedIn => _accessToken != null;
}

// Global instance
final api = ApiClient();
```

---

## 2. Authentication

### Models

```dart
// lib/models/user.dart
class User {
  final String id;
  final String email;
  final String role; // 'Customer', 'Coach', 'Admin'
  final String? firstName;
  final String? lastName;
  final String? photoUrl;
  final bool isVerified;
  final bool onboardingCompleted;
  final String? fitnessGoal;
  final String? fitnessLevel;

  User({
    required this.id,
    required this.email,
    required this.role,
    this.firstName,
    this.lastName,
    this.photoUrl,
    this.isVerified = false,
    this.onboardingCompleted = false,
    this.fitnessGoal,
    this.fitnessLevel,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'],
      email: json['email'],
      role: json['role'],
      firstName: json['firstName'],
      lastName: json['lastName'],
      photoUrl: json['photoUrl'],
      isVerified: json['isVerified'] ?? false,
      onboardingCompleted: json['onboardingCompleted'] ?? false,
      fitnessGoal: json['fitnessGoal'],
      fitnessLevel: json['fitnessLevel'],
    );
  }
}
```

### Auth Service

```dart
// lib/services/auth_service.dart
import 'package:dio/dio.dart';

class AuthService {
  final Dio _dio = api.dio;

  /// Register a new user
  /// POST /auth/register
  Future<User> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String role = 'Customer',
  }) async {
    final response = await _dio.post('/auth/register', data: {
      'email': email,
      'password': password,
      'firstName': firstName,
      'lastName': lastName,
      'role': role,
    });
    return User.fromJson(response.data);
  }

  /// Login
  /// POST /auth/login
  Future<User> login(String email, String password) async {
    final response = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });

    await api.setTokens(
      response.data['access_token'],
      response.data['refresh_token'],
    );

    return User.fromJson(response.data['user']);
  }

  /// Send OTP for email verification
  /// POST /auth/send-otp
  Future<void> sendOtp(String email) async {
    await _dio.post('/auth/send-otp', data: {'email': email});
  }

  /// Verify OTP
  /// POST /auth/verify-otp
  Future<void> verifyOtp(String email, String otp) async {
    await _dio.post('/auth/verify-otp', data: {
      'email': email,
      'otp': otp,
    });
  }

  /// Forgot password - sends reset OTP
  /// POST /auth/forgot-password
  Future<void> forgotPassword(String email) async {
    await _dio.post('/auth/forgot-password', data: {'email': email});
  }

  /// Reset password with OTP
  /// POST /auth/reset-password
  Future<void> resetPassword(String email, String otp, String newPassword) async {
    await _dio.post('/auth/reset-password', data: {
      'email': email,
      'otp': otp,
      'newPassword': newPassword,
    });
  }

  /// Logout
  /// POST /auth/logout
  Future<void> logout() async {
    await _dio.post('/auth/logout');
    await api.clearTokens();
  }
}

final authService = AuthService();
```

### Usage Example

```dart
// Login screen
Future<void> handleLogin() async {
  try {
    final user = await authService.login(
      emailController.text,
      passwordController.text,
    );

    if (!user.onboardingCompleted) {
      Navigator.pushReplacementNamed(context, '/onboarding');
    } else {
      Navigator.pushReplacementNamed(context, '/home');
    }
  } on DioException catch (e) {
    final message = e.response?.data['message'] ?? 'Login failed';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }
}
```

---

## 3. User Profile & Onboarding

### Profile Service

```dart
// lib/services/profile_service.dart
class ProfileService {
  final Dio _dio = api.dio;

  /// Get current user profile
  /// GET /users/me
  Future<User> getProfile() async {
    final response = await _dio.get('/users/me');
    return User.fromJson(response.data);
  }

  /// Update profile
  /// PUT /users/me
  Future<User> updateProfile({
    String? firstName,
    String? lastName,
    String? photoUrl,
    DateTime? dateOfBirth,
    String? gender,       // 'Male', 'Female', 'Other'
    double? height,       // in cm
    double? weight,       // in kg
    String? fitnessGoal,  // 'Lose Weight', 'Gain Muscle', 'Stay Fit', etc.
    String? fitnessLevel, // 'Beginner', 'Intermediate', 'Advanced'
    List<String>? healthConditions,
    String? workoutLocation, // 'Home', 'Gym', 'Both'
    List<String>? preferredTrainingDays,
    int? preferredWorkoutDuration,
    List<String>? dietaryPreferences,
  }) async {
    final response = await _dio.put('/users/me', data: {
      if (firstName != null) 'firstName': firstName,
      if (lastName != null) 'lastName': lastName,
      if (photoUrl != null) 'photoUrl': photoUrl,
      if (dateOfBirth != null) 'dateOfBirth': dateOfBirth.toIso8601String(),
      if (gender != null) 'gender': gender,
      if (height != null) 'height': height,
      if (weight != null) 'weight': weight,
      if (fitnessGoal != null) 'fitnessGoal': fitnessGoal,
      if (fitnessLevel != null) 'fitnessLevel': fitnessLevel,
      if (healthConditions != null) 'healthConditions': healthConditions,
      if (workoutLocation != null) 'workoutLocation': workoutLocation,
      if (preferredTrainingDays != null) 'preferredTrainingDays': preferredTrainingDays,
      if (preferredWorkoutDuration != null) 'preferredWorkoutDuration': preferredWorkoutDuration,
      if (dietaryPreferences != null) 'dietaryPreferences': dietaryPreferences,
    });
    return User.fromJson(response.data);
  }

  /// Complete onboarding
  /// PUT /users/me/complete-onboarding
  Future<void> completeOnboarding() async {
    await _dio.put('/users/me', data: {'onboardingCompleted': true});
  }

  /// Update notification preferences
  /// PUT /users/me
  Future<void> updateNotificationPreferences({
    bool? emailNotifications,
    bool? pushNotifications,
  }) async {
    await _dio.put('/users/me', data: {
      if (emailNotifications != null) 'emailNotifications': emailNotifications,
      if (pushNotifications != null) 'pushNotifications': pushNotifications,
    });
  }
}

final profileService = ProfileService();
```

### Onboarding Flow Example

```dart
// Onboarding screen - Step by step
class OnboardingScreen extends StatefulWidget {
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int currentStep = 0;

  // Collected data
  String? gender;
  DateTime? dateOfBirth;
  double? height;
  double? weight;
  String? fitnessGoal;
  String? fitnessLevel;
  List<String> healthConditions = [];

  Future<void> completeOnboarding() async {
    try {
      await profileService.updateProfile(
        gender: gender,
        dateOfBirth: dateOfBirth,
        height: height,
        weight: weight,
        fitnessGoal: fitnessGoal,
        fitnessLevel: fitnessLevel,
        healthConditions: healthConditions,
      );
      await profileService.completeOnboarding();
      Navigator.pushReplacementNamed(context, '/home');
    } catch (e) {
      // Handle error
    }
  }
}
```

---

## 4. Coaches

### Models

```dart
// lib/models/coach.dart
class Coach {
  final String id;
  final String oderId;
  final String name;
  final String? photoUrl;
  final String? bio;
  final List<String> specialties;
  final int experienceYears;
  final double averageRating;
  final int totalReviews;
  final bool isVerified;
  final double? hourlyRate;

  Coach({
    required this.id,
    required this.oderId,
    required this.name,
    this.photoUrl,
    this.bio,
    this.specialties = const [],
    this.experienceYears = 0,
    this.averageRating = 0,
    this.totalReviews = 0,
    this.isVerified = false,
    this.hourlyRate,
  });

  factory Coach.fromJson(Map<String, dynamic> json) {
    final user = json['userId'] as Map<String, dynamic>?;
    return Coach(
      id: json['_id'],
      oderId: user?['_id'] ?? '',
      name: '${user?['firstName'] ?? ''} ${user?['lastName'] ?? ''}'.trim(),
      photoUrl: user?['photoUrl'],
      bio: json['bio'],
      specialties: List<String>.from(json['specialties'] ?? []),
      experienceYears: json['experienceYears'] ?? 0,
      averageRating: (json['averageRating'] ?? 0).toDouble(),
      totalReviews: json['totalReviews'] ?? 0,
      isVerified: json['isVerified'] ?? false,
      hourlyRate: json['hourlyRate']?.toDouble(),
    );
  }
}

class Review {
  final String id;
  final String oderId;
  final String userName;
  final String? userPhoto;
  final int rating;
  final String? comment;
  final DateTime createdAt;

  Review({
    required this.id,
    required this.oderId,
    required this.userName,
    this.userPhoto,
    required this.rating,
    this.comment,
    required this.createdAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    final user = json['userId'] as Map<String, dynamic>?;
    return Review(
      id: json['_id'],
      oderId: user?['_id'] ?? '',
      userName: '${user?['firstName'] ?? ''} ${user?['lastName'] ?? ''}'.trim(),
      userPhoto: user?['photoUrl'],
      rating: json['rating'],
      comment: json['comment'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
```

### Coach Service

```dart
// lib/services/coach_service.dart
class CoachService {
  final Dio _dio = api.dio;

  /// Get all coaches with optional filters
  /// GET /coach-profile
  Future<List<Coach>> getCoaches({
    String? specialty,
    int? minRating,
    int? minExperience,
    bool? verifiedOnly,
    String? sortBy, // 'rating', 'experience', 'reviews'
  }) async {
    final response = await _dio.get('/coach-profile', queryParameters: {
      if (specialty != null) 'specialty': specialty,
      if (minRating != null) 'minRating': minRating,
      if (minExperience != null) 'minExperience': minExperience,
      if (verifiedOnly != null) 'verifiedOnly': verifiedOnly,
      if (sortBy != null) 'sortBy': sortBy,
    });
    return (response.data as List).map((j) => Coach.fromJson(j)).toList();
  }

  /// Get coach by ID
  /// GET /coach-profile/:id
  Future<Coach> getCoachById(String coachProfileId) async {
    final response = await _dio.get('/coach-profile/$coachProfileId');
    return Coach.fromJson(response.data);
  }

  /// Get coach reviews
  /// GET /coach-profile/:id/reviews
  Future<List<Review>> getCoachReviews(String coachProfileId) async {
    final response = await _dio.get('/coach-profile/$coachProfileId/reviews');
    return (response.data as List).map((j) => Review.fromJson(j)).toList();
  }

  /// Submit a review for a coach
  /// POST /coach-profile/:id/reviews
  Future<Review> submitReview(String coachProfileId, int rating, String? comment) async {
    final response = await _dio.post('/coach-profile/$coachProfileId/reviews', data: {
      'rating': rating,
      if (comment != null) 'comment': comment,
    });
    return Review.fromJson(response.data);
  }
}

final coachService = CoachService();
```

### Usage Example

```dart
// Coaches list screen
class CoachesScreen extends StatefulWidget {
  @override
  State<CoachesScreen> createState() => _CoachesScreenState();
}

class _CoachesScreenState extends State<CoachesScreen> {
  List<Coach> coaches = [];
  String? selectedSpecialty;
  bool verifiedOnly = false;

  @override
  void initState() {
    super.initState();
    loadCoaches();
  }

  Future<void> loadCoaches() async {
    final result = await coachService.getCoaches(
      specialty: selectedSpecialty,
      verifiedOnly: verifiedOnly,
      sortBy: 'rating',
    );
    setState(() => coaches = result);
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: coaches.length,
      itemBuilder: (context, index) {
        final coach = coaches[index];
        return ListTile(
          leading: CircleAvatar(
            backgroundImage: coach.photoUrl != null
              ? NetworkImage(coach.photoUrl!)
              : null,
          ),
          title: Text(coach.name),
          subtitle: Text('${coach.specialties.join(", ")} • ⭐ ${coach.averageRating}'),
          trailing: coach.isVerified ? Icon(Icons.verified, color: Colors.blue) : null,
          onTap: () => Navigator.pushNamed(context, '/coach/${coach.id}'),
        );
      },
    );
  }
}
```

---

## 5. Coach-Client Relationships

### Models

```dart
// lib/models/client_request.dart
class ClientRequest {
  final String id;
  final String clientId;
  final String coachId;
  final String status; // 'pending', 'accepted', 'rejected', 'canceled'
  final String? message;
  final String trainingType; // 'online', 'in-person'
  final DateTime createdAt;
  final String? rejectionReason;

  ClientRequest({
    required this.id,
    required this.clientId,
    required this.coachId,
    required this.status,
    this.message,
    required this.trainingType,
    required this.createdAt,
    this.rejectionReason,
  });

  factory ClientRequest.fromJson(Map<String, dynamic> json) {
    return ClientRequest(
      id: json['_id'],
      clientId: json['clientId'] is Map ? json['clientId']['_id'] : json['clientId'],
      coachId: json['coachId'] is Map ? json['coachId']['_id'] : json['coachId'],
      status: json['status'],
      message: json['message'],
      trainingType: json['trainingType'] ?? 'online',
      createdAt: DateTime.parse(json['createdAt']),
      rejectionReason: json['rejectionReason'],
    );
  }
}
```

### Coach-Client Service

```dart
// lib/services/coach_client_service.dart
class CoachClientService {
  final Dio _dio = api.dio;

  // ═══════════════════════════════════════════════════
  // CLIENT ENDPOINTS
  // ═══════════════════════════════════════════════════

  /// Send coaching request to a coach
  /// POST /coach-client/request
  Future<ClientRequest> sendRequest({
    required String coachId,
    String? message,
    String trainingType = 'online',
  }) async {
    final response = await _dio.post('/coach-client/request', data: {
      'coachId': coachId,
      if (message != null) 'message': message,
      'trainingType': trainingType,
    });
    return ClientRequest.fromJson(response.data);
  }

  /// Get my sent requests (as client)
  /// GET /coach-client/my-requests
  Future<List<ClientRequest>> getMyRequests() async {
    final response = await _dio.get('/coach-client/my-requests');
    return (response.data as List).map((j) => ClientRequest.fromJson(j)).toList();
  }

  /// Cancel a pending request
  /// DELETE /coach-client/request/:id
  Future<void> cancelRequest(String requestId) async {
    await _dio.delete('/coach-client/request/$requestId');
  }

  /// Get my current coach (as client)
  /// GET /coach-client/my-coach
  Future<Map<String, dynamic>?> getMyCoach() async {
    final response = await _dio.get('/coach-client/my-coach');
    return response.data;
  }

  // ═══════════════════════════════════════════════════
  // COACH ENDPOINTS
  // ═══════════════════════════════════════════════════

  /// Get pending requests (as coach)
  /// GET /coach-client/pending-requests
  Future<List<ClientRequest>> getPendingRequests() async {
    final response = await _dio.get('/coach-client/pending-requests');
    return (response.data as List).map((j) => ClientRequest.fromJson(j)).toList();
  }

  /// Accept or reject a request (as coach)
  /// PUT /coach-client/request/:id/respond
  Future<ClientRequest> respondToRequest(
    String requestId, {
    required String status, // 'accepted' or 'rejected'
    String? rejectionReason,
  }) async {
    final response = await _dio.put('/coach-client/request/$requestId/respond', data: {
      'status': status,
      if (rejectionReason != null) 'rejectionReason': rejectionReason,
    });
    return ClientRequest.fromJson(response.data);
  }

  /// Get my clients (as coach)
  /// GET /coach-client/my-clients
  Future<List<Map<String, dynamic>>> getMyClients({bool activeOnly = true}) async {
    final response = await _dio.get('/coach-client/my-clients', queryParameters: {
      'activeOnly': activeOnly,
    });
    return List<Map<String, dynamic>>.from(response.data);
  }

  /// Get client details (as coach)
  /// GET /coach-client/client/:clientId
  Future<Map<String, dynamic>> getClientDetails(String clientId) async {
    final response = await _dio.get('/coach-client/client/$clientId');
    return response.data;
  }

  /// Update client progress (as coach)
  /// PUT /coach-client/client/:clientId
  Future<void> updateClient(String clientId, {
    String? notes,
    int? progressPercentage,
  }) async {
    await _dio.put('/coach-client/client/$clientId', data: {
      if (notes != null) 'notes': notes,
      if (progressPercentage != null) 'progressPercentage': progressPercentage,
    });
  }

  /// Get coach statistics
  /// GET /coach-client/stats
  Future<Map<String, dynamic>> getCoachStats() async {
    final response = await _dio.get('/coach-client/stats');
    return response.data;
  }
}

final coachClientService = CoachClientService();
```

### Usage Example

```dart
// Send request to coach
Future<void> sendCoachRequest(String coachId) async {
  try {
    await coachClientService.sendRequest(
      coachId: coachId,
      message: "Hi! I'd love to train with you.",
      trainingType: 'online',
    );
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Request sent!')),
    );
  } on DioException catch (e) {
    final message = e.response?.data['message'] ?? 'Failed to send request';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }
}

// Coach responding to request
Future<void> acceptRequest(String requestId) async {
  await coachClientService.respondToRequest(requestId, status: 'accepted');
}

Future<void> rejectRequest(String requestId, String reason) async {
  await coachClientService.respondToRequest(
    requestId,
    status: 'rejected',
    rejectionReason: reason,
  );
}
```

---

## 6. Scheduling & Sessions

### Models

```dart
// lib/models/session.dart
class Session {
  final String id;
  final String coachId;
  final String clientId;
  final String? coachName;
  final String? clientName;
  final DateTime scheduledDate;
  final String startTime; // "09:00"
  final String endTime;   // "10:00"
  final int duration;
  final String sessionType; // 'online', 'in-person'
  final String status; // 'scheduled', 'confirmed', 'in-progress', 'completed', 'canceled', 'no-show'
  final String? title;
  final String? notes;
  final String? meetingLink;
  final String? location;

  Session({
    required this.id,
    required this.coachId,
    required this.clientId,
    this.coachName,
    this.clientName,
    required this.scheduledDate,
    required this.startTime,
    required this.endTime,
    this.duration = 60,
    required this.sessionType,
    required this.status,
    this.title,
    this.notes,
    this.meetingLink,
    this.location,
  });

  factory Session.fromJson(Map<String, dynamic> json) {
    final coach = json['coachId'] as Map<String, dynamic>?;
    final client = json['clientId'] as Map<String, dynamic>?;
    return Session(
      id: json['_id'],
      coachId: coach?['_id'] ?? json['coachId'],
      clientId: client?['_id'] ?? json['clientId'],
      coachName: coach != null ? '${coach['firstName']} ${coach['lastName']}' : null,
      clientName: client != null ? '${client['firstName']} ${client['lastName']}' : null,
      scheduledDate: DateTime.parse(json['scheduledDate']),
      startTime: json['startTime'],
      endTime: json['endTime'],
      duration: json['duration'] ?? 60,
      sessionType: json['sessionType'] ?? 'online',
      status: json['status'],
      title: json['title'],
      notes: json['notes'],
      meetingLink: json['meetingLink'],
      location: json['location'],
    );
  }
}

class TimeSlot {
  final String id;
  final int dayOfWeek; // 0 = Sunday, 6 = Saturday
  final String startTime;
  final String endTime;
  final int duration;
  final String sessionType;
  final bool isAvailable;

  TimeSlot({
    required this.id,
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    this.duration = 60,
    this.sessionType = 'online',
    this.isAvailable = true,
  });

  factory TimeSlot.fromJson(Map<String, dynamic> json) {
    return TimeSlot(
      id: json['_id'] ?? json['slotId'],
      dayOfWeek: json['dayOfWeek'],
      startTime: json['startTime'],
      endTime: json['endTime'],
      duration: json['duration'] ?? 60,
      sessionType: json['sessionType'] ?? 'online',
      isAvailable: json['isAvailable'] ?? !(json['isBooked'] ?? false),
    );
  }
}
```

### Schedule Service

```dart
// lib/services/schedule_service.dart
class ScheduleService {
  final Dio _dio = api.dio;

  // ═══════════════════════════════════════════════════
  // CLIENT ENDPOINTS
  // ═══════════════════════════════════════════════════

  /// Get coach availability for date range
  /// GET /schedule/availability/:coachId
  Future<List<Map<String, dynamic>>> getCoachAvailability(
    String coachId,
    DateTime startDate,
    DateTime endDate,
  ) async {
    final response = await _dio.get('/schedule/availability/$coachId', queryParameters: {
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
    });
    // Returns: [{ date: "2024-01-15", slots: [...] }, ...]
    return List<Map<String, dynamic>>.from(response.data);
  }

  /// Book a session
  /// POST /schedule/sessions
  Future<Session> bookSession({
    required String coachId,
    required DateTime scheduledDate,
    required String startTime,
    required String endTime,
    String? timeSlotId,
    String sessionType = 'online',
    String? title,
    String? notes,
  }) async {
    final response = await _dio.post('/schedule/sessions', data: {
      'coachId': coachId,
      'scheduledDate': scheduledDate.toIso8601String(),
      'startTime': startTime,
      'endTime': endTime,
      if (timeSlotId != null) 'timeSlotId': timeSlotId,
      'sessionType': sessionType,
      if (title != null) 'title': title,
      if (notes != null) 'notes': notes,
    });
    return Session.fromJson(response.data);
  }

  /// Get my sessions (as client)
  /// GET /schedule/sessions/client
  Future<List<Session>> getClientSessions({bool upcoming = false}) async {
    final response = await _dio.get('/schedule/sessions/client', queryParameters: {
      if (upcoming) 'upcoming': true,
    });
    return (response.data as List).map((j) => Session.fromJson(j)).toList();
  }

  /// Cancel a session
  /// DELETE /schedule/sessions/:id
  Future<void> cancelSession(String sessionId, {String? reason}) async {
    await _dio.delete('/schedule/sessions/$sessionId', data: {
      if (reason != null) 'reason': reason,
    });
  }

  // ═══════════════════════════════════════════════════
  // COACH ENDPOINTS
  // ═══════════════════════════════════════════════════

  /// Create a recurring time slot
  /// POST /schedule/time-slots
  Future<TimeSlot> createTimeSlot({
    required int dayOfWeek,
    required String startTime,
    required String endTime,
    int duration = 60,
    String sessionType = 'online',
    bool isRecurring = true,
  }) async {
    final response = await _dio.post('/schedule/time-slots', data: {
      'dayOfWeek': dayOfWeek,
      'startTime': startTime,
      'endTime': endTime,
      'duration': duration,
      'sessionType': sessionType,
      'isRecurring': isRecurring,
    });
    return TimeSlot.fromJson(response.data);
  }

  /// Get my time slots (as coach)
  /// GET /schedule/time-slots
  Future<List<TimeSlot>> getMyTimeSlots() async {
    final response = await _dio.get('/schedule/time-slots');
    return (response.data as List).map((j) => TimeSlot.fromJson(j)).toList();
  }

  /// Delete a time slot
  /// DELETE /schedule/time-slots/:id
  Future<void> deleteTimeSlot(String slotId) async {
    await _dio.delete('/schedule/time-slots/$slotId');
  }

  /// Get my sessions (as coach)
  /// GET /schedule/sessions/coach
  Future<List<Session>> getCoachSessions({
    bool upcoming = false,
    String? date,
  }) async {
    final response = await _dio.get('/schedule/sessions/coach', queryParameters: {
      if (upcoming) 'upcoming': true,
      if (date != null) 'date': date,
    });
    return (response.data as List).map((j) => Session.fromJson(j)).toList();
  }

  /// Update session status (as coach)
  /// PUT /schedule/sessions/:id
  Future<Session> updateSession(
    String sessionId, {
    String? status, // 'confirmed', 'completed', 'canceled'
    String? meetingLink,
    String? coachNotes,
    String? cancelReason,
  }) async {
    final response = await _dio.put('/schedule/sessions/$sessionId', data: {
      if (status != null) 'status': status,
      if (meetingLink != null) 'meetingLink': meetingLink,
      if (coachNotes != null) 'coachNotes': coachNotes,
      if (cancelReason != null) 'cancelReason': cancelReason,
    });
    return Session.fromJson(response.data);
  }

  /// Get calendar view (as coach)
  /// GET /schedule/calendar
  Future<Map<String, List<dynamic>>> getCoachCalendar(int month, int year) async {
    final response = await _dio.get('/schedule/calendar', queryParameters: {
      'month': month,
      'year': year,
    });
    return Map<String, List<dynamic>>.from(response.data);
  }

  /// Get schedule statistics (as coach)
  /// GET /schedule/stats
  Future<Map<String, dynamic>> getScheduleStats() async {
    final response = await _dio.get('/schedule/stats');
    return response.data;
  }
}

final scheduleService = ScheduleService();
```

### Usage Example

```dart
// Booking screen
class BookSessionScreen extends StatefulWidget {
  final String coachId;
  BookSessionScreen({required this.coachId});

  @override
  State<BookSessionScreen> createState() => _BookSessionScreenState();
}

class _BookSessionScreenState extends State<BookSessionScreen> {
  DateTime selectedDate = DateTime.now();
  List<Map<String, dynamic>> availability = [];
  Map<String, dynamic>? selectedSlot;

  @override
  void initState() {
    super.initState();
    loadAvailability();
  }

  Future<void> loadAvailability() async {
    final endDate = selectedDate.add(Duration(days: 7));
    availability = await scheduleService.getCoachAvailability(
      widget.coachId,
      selectedDate,
      endDate,
    );
    setState(() {});
  }

  Future<void> bookSession() async {
    if (selectedSlot == null) return;

    try {
      await scheduleService.bookSession(
        coachId: widget.coachId,
        scheduledDate: DateTime.parse(selectedSlot!['date']),
        startTime: selectedSlot!['startTime'],
        endTime: selectedSlot!['endTime'],
        timeSlotId: selectedSlot!['slotId'],
        title: 'Training Session',
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Session booked!')),
      );
      Navigator.pop(context);
    } on DioException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.response?.data['message'] ?? 'Booking failed')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Book Session')),
      body: ListView.builder(
        itemCount: availability.length,
        itemBuilder: (context, index) {
          final day = availability[index];
          final slots = day['slots'] as List;
          return ExpansionTile(
            title: Text(day['date']),
            children: slots.map((slot) {
              final isBooked = slot['isBooked'] ?? false;
              return ListTile(
                title: Text('${slot['startTime']} - ${slot['endTime']}'),
                subtitle: Text(slot['sessionType']),
                enabled: !isBooked,
                trailing: isBooked ? Text('Booked') : null,
                onTap: () => setState(() => selectedSlot = {...slot, 'date': day['date']}),
                selected: selectedSlot?['slotId'] == slot['slotId'],
              );
            }).toList(),
          );
        },
      ),
      bottomNavigationBar: Padding(
        padding: EdgeInsets.all(16),
        child: ElevatedButton(
          onPressed: selectedSlot != null ? bookSession : null,
          child: Text('Book Session'),
        ),
      ),
    );
  }
}
```

---

## 7. Chat (REST + WebSocket)

### Models

```dart
// lib/models/chat.dart
class Conversation {
  final String id;
  final String oderId;
  final String otherUserName;
  final String? otherUserPhoto;
  final String? lastMessage;
  final DateTime? lastMessageAt;
  final int unreadCount;
  final bool isCoach;

  Conversation({
    required this.id,
    required this.oderId,
    required this.otherUserName,
    this.otherUserPhoto,
    this.lastMessage,
    this.lastMessageAt,
    this.unreadCount = 0,
    this.isCoach = false,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    final otherUser = json['otherUser'] as Map<String, dynamic>?;
    return Conversation(
      id: json['_id'],
      oderId: otherUser?['_id'] ?? '',
      otherUserName: '${otherUser?['firstName'] ?? ''} ${otherUser?['lastName'] ?? ''}'.trim(),
      otherUserPhoto: otherUser?['photoUrl'],
      lastMessage: json['lastMessage'],
      lastMessageAt: json['lastMessageAt'] != null ? DateTime.parse(json['lastMessageAt']) : null,
      unreadCount: json['unreadCount'] ?? 0,
      isCoach: json['isCoach'] ?? false,
    );
  }
}

class Message {
  final String id;
  final String conversationId;
  final String senderId;
  final String? senderName;
  final String content;
  final String messageType; // 'text', 'image', 'file'
  final String? fileUrl;
  final bool isRead;
  final bool isDelivered;
  final DateTime createdAt;

  Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    this.senderName,
    required this.content,
    this.messageType = 'text',
    this.fileUrl,
    this.isRead = false,
    this.isDelivered = false,
    required this.createdAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    final sender = json['senderId'] as Map<String, dynamic>?;
    return Message(
      id: json['_id'],
      conversationId: json['conversationId'],
      senderId: sender?['_id'] ?? json['senderId'],
      senderName: sender != null ? '${sender['firstName']} ${sender['lastName']}' : null,
      content: json['content'],
      messageType: json['messageType'] ?? 'text',
      fileUrl: json['fileUrl'],
      isRead: json['isRead'] ?? false,
      isDelivered: json['isDelivered'] ?? false,
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
```

### Chat Service (REST API)

```dart
// lib/services/chat_service.dart
class ChatService {
  final Dio _dio = api.dio;

  /// Get all conversations
  /// GET /chat/conversations
  Future<List<Conversation>> getConversations() async {
    final response = await _dio.get('/chat/conversations');
    return (response.data as List).map((j) => Conversation.fromJson(j)).toList();
  }

  /// Start or get existing conversation
  /// POST /chat/conversations
  Future<Conversation> startConversation(String recipientId, {String? initialMessage}) async {
    final response = await _dio.post('/chat/conversations', data: {
      'recipientId': recipientId,
      if (initialMessage != null) 'initialMessage': initialMessage,
    });
    return Conversation.fromJson(response.data);
  }

  /// Get messages in a conversation
  /// GET /chat/conversations/:id/messages
  Future<List<Message>> getMessages(String conversationId, {int limit = 50, String? before}) async {
    final response = await _dio.get('/chat/conversations/$conversationId/messages', queryParameters: {
      'limit': limit,
      if (before != null) 'before': before,
    });
    return (response.data as List).map((j) => Message.fromJson(j)).toList();
  }

  /// Send a message (REST alternative)
  /// POST /chat/conversations/:id/messages
  Future<Message> sendMessage(String conversationId, String content, {String messageType = 'text', String? fileUrl}) async {
    final response = await _dio.post('/chat/conversations/$conversationId/messages', data: {
      'content': content,
      'messageType': messageType,
      if (fileUrl != null) 'fileUrl': fileUrl,
    });
    return Message.fromJson(response.data);
  }

  /// Mark conversation as read
  /// POST /chat/conversations/:id/read
  Future<void> markAsRead(String conversationId) async {
    await _dio.post('/chat/conversations/$conversationId/read');
  }

  /// Get total unread count
  /// GET /chat/unread-count
  Future<int> getUnreadCount() async {
    final response = await _dio.get('/chat/unread-count');
    return response.data['unreadCount'];
  }
}

final chatService = ChatService();
```

### WebSocket Chat Manager

```dart
// lib/services/chat_socket.dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class ChatSocket {
  IO.Socket? _socket;
  final _messageController = StreamController<Message>.broadcast();
  final _typingController = StreamController<Map<String, dynamic>>.broadcast();
  final _onlineController = StreamController<Map<String, dynamic>>.broadcast();

  Stream<Message> get messageStream => _messageController.stream;
  Stream<Map<String, dynamic>> get typingStream => _typingController.stream;
  Stream<Map<String, dynamic>> get onlineStream => _onlineController.stream;

  void connect() {
    if (_socket != null) return;

    _socket = IO.io(
      '${ApiClient.baseUrl}/chat',
      IO.OptionBuilder()
        .setTransports(['websocket'])
        .setAuth({'token': api.accessToken})
        .build(),
    );

    _socket!.onConnect((_) {
      print('Chat socket connected');
    });

    _socket!.on('newMessage', (data) {
      _messageController.add(Message.fromJson(data));
    });

    _socket!.on('messageNotification', (data) {
      // New message in a conversation you're not currently viewing
      _messageController.add(Message.fromJson(data['message']));
    });

    _socket!.on('userTyping', (data) {
      _typingController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('messagesRead', (data) {
      // Handle read receipts
    });

    _socket!.on('userOnline', (data) {
      _onlineController.add({'userId': data['userId'], 'online': true});
    });

    _socket!.on('userOffline', (data) {
      _onlineController.add({'userId': data['userId'], 'online': false});
    });

    _socket!.on('error', (data) {
      print('Chat socket error: $data');
    });

    _socket!.connect();
  }

  void joinConversation(String conversationId) {
    _socket?.emit('joinConversation', conversationId);
  }

  void leaveConversation(String conversationId) {
    _socket?.emit('leaveConversation', conversationId);
  }

  void sendMessage(String conversationId, String content, {String messageType = 'text', String? fileUrl}) {
    _socket?.emit('sendMessage', {
      'conversationId': conversationId,
      'content': content,
      'messageType': messageType,
      if (fileUrl != null) 'fileUrl': fileUrl,
    });
  }

  void markAsRead(String conversationId) {
    _socket?.emit('markAsRead', conversationId);
  }

  void sendTyping(String conversationId, bool isTyping) {
    _socket?.emit('typing', {
      'conversationId': conversationId,
      'isTyping': isTyping,
    });
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  void dispose() {
    disconnect();
    _messageController.close();
    _typingController.close();
    _onlineController.close();
  }
}

final chatSocket = ChatSocket();
```

### Chat Screen Example

```dart
// lib/screens/chat_screen.dart
class ChatScreen extends StatefulWidget {
  final String conversationId;
  ChatScreen({required this.conversationId});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<Message> messages = [];
  bool isOtherUserTyping = false;
  StreamSubscription? _messageSubscription;
  StreamSubscription? _typingSubscription;

  @override
  void initState() {
    super.initState();
    loadMessages();
    connectSocket();
  }

  Future<void> loadMessages() async {
    messages = await chatService.getMessages(widget.conversationId);
    setState(() {});
    scrollToBottom();
  }

  void connectSocket() {
    chatSocket.connect();
    chatSocket.joinConversation(widget.conversationId);
    chatSocket.markAsRead(widget.conversationId);

    _messageSubscription = chatSocket.messageStream.listen((message) {
      if (message.conversationId == widget.conversationId) {
        setState(() => messages.add(message));
        scrollToBottom();
        chatSocket.markAsRead(widget.conversationId);
      }
    });

    _typingSubscription = chatSocket.typingStream.listen((data) {
      setState(() => isOtherUserTyping = data['isTyping'] ?? false);
    });
  }

  void scrollToBottom() {
    Future.delayed(Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void sendMessage() {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;

    chatSocket.sendMessage(widget.conversationId, content);
    _messageController.clear();
    chatSocket.sendTyping(widget.conversationId, false);
  }

  @override
  void dispose() {
    chatSocket.leaveConversation(widget.conversationId);
    _messageSubscription?.cancel();
    _typingSubscription?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Chat')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              itemCount: messages.length,
              itemBuilder: (context, index) {
                final message = messages[index];
                final isMe = message.senderId == currentUserId;
                return Align(
                  alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: EdgeInsets.all(8),
                    padding: EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isMe ? Colors.blue : Colors.grey[300],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      message.content,
                      style: TextStyle(color: isMe ? Colors.white : Colors.black),
                    ),
                  ),
                );
              },
            ),
          ),
          if (isOtherUserTyping)
            Padding(
              padding: EdgeInsets.all(8),
              child: Text('Typing...', style: TextStyle(color: Colors.grey)),
            ),
          Padding(
            padding: EdgeInsets.all(8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
                    ),
                    onChanged: (text) {
                      chatSocket.sendTyping(widget.conversationId, text.isNotEmpty);
                    },
                  ),
                ),
                SizedBox(width: 8),
                IconButton(
                  icon: Icon(Icons.send),
                  onPressed: sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 8. Workouts & Nutrition

### Models

```dart
// lib/models/workout.dart
class Workout {
  final String id;
  final String title;
  final String? description;
  final String? imageUrl;
  final String? videoUrl;
  final String category;
  final String difficulty;
  final int duration; // minutes
  final int caloriesBurn;
  final List<String> equipment;
  final List<String> targetMuscles;
  final bool isSaved;

  Workout({
    required this.id,
    required this.title,
    this.description,
    this.imageUrl,
    this.videoUrl,
    required this.category,
    required this.difficulty,
    this.duration = 0,
    this.caloriesBurn = 0,
    this.equipment = const [],
    this.targetMuscles = const [],
    this.isSaved = false,
  });

  factory Workout.fromJson(Map<String, dynamic> json) {
    return Workout(
      id: json['_id'],
      title: json['title'],
      description: json['description'],
      imageUrl: json['imageUrl'],
      videoUrl: json['videoUrl'],
      category: json['category'] ?? '',
      difficulty: json['difficulty'] ?? 'Beginner',
      duration: json['duration'] ?? 0,
      caloriesBurn: json['caloriesBurn'] ?? 0,
      equipment: List<String>.from(json['equipment'] ?? []),
      targetMuscles: List<String>.from(json['targetMuscles'] ?? []),
    );
  }
}

// lib/models/nutrition.dart
class Meal {
  final String id;
  final String title;
  final String? description;
  final String? imageUrl;
  final String category;
  final int calories;
  final int protein;
  final int carbs;
  final int fat;
  final int prepTime;
  final List<String> ingredients;
  final List<String> dietaryTags;
  final bool isSaved;

  Meal({
    required this.id,
    required this.title,
    this.description,
    this.imageUrl,
    required this.category,
    this.calories = 0,
    this.protein = 0,
    this.carbs = 0,
    this.fat = 0,
    this.prepTime = 0,
    this.ingredients = const [],
    this.dietaryTags = const [],
    this.isSaved = false,
  });

  factory Meal.fromJson(Map<String, dynamic> json) {
    return Meal(
      id: json['_id'],
      title: json['title'],
      description: json['description'] ?? json['content'],
      imageUrl: json['imageUrl'],
      category: json['category'] ?? '',
      calories: json['calories'] ?? 0,
      protein: json['protein'] ?? 0,
      carbs: json['carbs'] ?? 0,
      fat: json['fat'] ?? 0,
      prepTime: json['prepTime'] ?? 0,
      ingredients: List<String>.from(json['ingredients'] ?? []),
      dietaryTags: List<String>.from(json['dietaryTags'] ?? []),
    );
  }
}
```

### Content Service

```dart
// lib/services/content_service.dart
class ContentService {
  final Dio _dio = api.dio;

  // ═══════════════════════════════════════════════════
  // WORKOUTS
  // ═══════════════════════════════════════════════════

  /// Get all workouts with filters
  /// GET /workouts
  Future<List<Workout>> getWorkouts({
    String? category,
    String? difficulty,
    String? targetMuscle,
    int? maxDuration,
  }) async {
    final response = await _dio.get('/workouts', queryParameters: {
      if (category != null) 'category': category,
      if (difficulty != null) 'difficulty': difficulty,
      if (targetMuscle != null) 'targetMuscle': targetMuscle,
      if (maxDuration != null) 'maxDuration': maxDuration,
    });
    return (response.data as List).map((j) => Workout.fromJson(j)).toList();
  }

  /// Get workout by ID
  /// GET /workouts/:id
  Future<Workout> getWorkoutById(String id) async {
    final response = await _dio.get('/workouts/$id');
    return Workout.fromJson(response.data);
  }

  /// Save/bookmark a workout
  /// POST /users/me/saved-workouts/:id
  Future<void> saveWorkout(String workoutId) async {
    await _dio.post('/users/me/saved-workouts/$workoutId');
  }

  /// Remove saved workout
  /// DELETE /users/me/saved-workouts/:id
  Future<void> unsaveWorkout(String workoutId) async {
    await _dio.delete('/users/me/saved-workouts/$workoutId');
  }

  /// Get saved workouts
  /// GET /users/me/saved-workouts
  Future<List<Workout>> getSavedWorkouts() async {
    final response = await _dio.get('/users/me/saved-workouts');
    return (response.data as List).map((j) => Workout.fromJson(j)).toList();
  }

  // ═══════════════════════════════════════════════════
  // NUTRITION / MEALS
  // ═══════════════════════════════════════════════════

  /// Get all meals with filters
  /// GET /nutrition
  Future<List<Meal>> getMeals({
    String? category,
    String? dietaryTag,
    int? maxCalories,
  }) async {
    final response = await _dio.get('/nutrition', queryParameters: {
      if (category != null) 'category': category,
      if (dietaryTag != null) 'dietaryTag': dietaryTag,
      if (maxCalories != null) 'maxCalories': maxCalories,
    });
    return (response.data as List).map((j) => Meal.fromJson(j)).toList();
  }

  /// Get meal by ID
  /// GET /nutrition/:id
  Future<Meal> getMealById(String id) async {
    final response = await _dio.get('/nutrition/$id');
    return Meal.fromJson(response.data);
  }

  /// Save/bookmark a meal
  /// POST /users/me/saved-meals/:id
  Future<void> saveMeal(String mealId) async {
    await _dio.post('/users/me/saved-meals/$mealId');
  }

  /// Remove saved meal
  /// DELETE /users/me/saved-meals/:id
  Future<void> unsaveMeal(String mealId) async {
    await _dio.delete('/users/me/saved-meals/$mealId');
  }

  /// Get saved meals
  /// GET /users/me/saved-meals
  Future<List<Meal>> getSavedMeals() async {
    final response = await _dio.get('/users/me/saved-meals');
    return (response.data as List).map((j) => Meal.fromJson(j)).toList();
  }
}

final contentService = ContentService();
```

---

## 9. Store & Cart

### Models

```dart
// lib/models/product.dart
class Product {
  final String id;
  final String title;
  final String? description;
  final double price;
  final double? salePrice;
  final String? imageUrl;
  final List<String> images;
  final String category;
  final int stock;
  final bool isActive;

  Product({
    required this.id,
    required this.title,
    this.description,
    required this.price,
    this.salePrice,
    this.imageUrl,
    this.images = const [],
    required this.category,
    this.stock = 0,
    this.isActive = true,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['_id'],
      title: json['title'],
      description: json['description'],
      price: (json['price'] ?? 0).toDouble(),
      salePrice: json['salePrice']?.toDouble(),
      imageUrl: json['imageUrl'],
      images: List<String>.from(json['images'] ?? []),
      category: json['category'] ?? '',
      stock: json['stock'] ?? 0,
      isActive: json['isActive'] ?? true,
    );
  }
}

class CartItem {
  final String productId;
  final String name;
  final double price;
  final String? image;
  int quantity;

  CartItem({
    required this.productId,
    required this.name,
    required this.price,
    this.image,
    this.quantity = 1,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      productId: json['productId'],
      name: json['name'],
      price: (json['price'] ?? 0).toDouble(),
      image: json['image'],
      quantity: json['quantity'] ?? 1,
    );
  }
}
```

### Store Service

```dart
// lib/services/store_service.dart
class StoreService {
  final Dio _dio = api.dio;

  /// Get all products
  /// GET /products
  Future<List<Product>> getProducts({String? category}) async {
    final response = await _dio.get('/products', queryParameters: {
      if (category != null) 'category': category,
    });
    return (response.data as List).map((j) => Product.fromJson(j)).toList();
  }

  /// Get product by ID
  /// GET /products/:id
  Future<Product> getProductById(String id) async {
    final response = await _dio.get('/products/$id');
    return Product.fromJson(response.data);
  }

  /// Get cart
  /// GET /cart
  Future<Map<String, dynamic>> getCart() async {
    final response = await _dio.get('/cart');
    return response.data;
  }

  /// Add item to cart
  /// POST /cart/items
  Future<void> addToCart(String productId, {int quantity = 1}) async {
    await _dio.post('/cart/items', data: {
      'productId': productId,
      'quantity': quantity,
    });
  }

  /// Update cart item quantity
  /// PUT /cart/items/:productId
  Future<void> updateCartItem(String productId, int quantity) async {
    await _dio.put('/cart/items/$productId', data: {
      'quantity': quantity,
    });
  }

  /// Remove item from cart
  /// DELETE /cart/items/:productId
  Future<void> removeFromCart(String productId) async {
    await _dio.delete('/cart/items/$productId');
  }

  /// Apply promo code
  /// POST /cart/apply-promo
  Future<Map<String, dynamic>> applyPromoCode(String code) async {
    final response = await _dio.post('/cart/apply-promo', data: {'code': code});
    return response.data;
  }

  /// Checkout
  /// POST /cart/checkout
  Future<Map<String, dynamic>> checkout({
    required Map<String, dynamic> shippingAddress,
    String? promoCode,
  }) async {
    final response = await _dio.post('/cart/checkout', data: {
      'shippingAddress': shippingAddress,
      if (promoCode != null) 'promoCode': promoCode,
    });
    return response.data;
  }

  /// Get orders
  /// GET /cart/orders
  Future<List<Map<String, dynamic>>> getOrders() async {
    final response = await _dio.get('/cart/orders');
    return List<Map<String, dynamic>>.from(response.data);
  }
}

final storeService = StoreService();
```

---

## 10. Notifications

### Setup Firebase Messaging

```dart
// lib/services/notification_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';

class NotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final Dio _dio = api.dio;

  Future<void> initialize() async {
    // Request permission
    await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // Get FCM token
    final token = await _fcm.getToken();
    if (token != null) {
      await registerDeviceToken(token);
    }

    // Listen for token refresh
    _fcm.onTokenRefresh.listen(registerDeviceToken);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Foreground message: ${message.notification?.title}');
      // Show local notification or update UI
    });

    // Handle background/terminated message taps
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      // Navigate to relevant screen based on message.data
      handleNotificationTap(message.data);
    });
  }

  /// Register device token with backend
  /// POST /notifications/device-token
  Future<void> registerDeviceToken(String token) async {
    await _dio.post('/notifications/device-token', data: {'token': token});
  }

  /// Remove device token (on logout)
  /// DELETE /notifications/device-token
  Future<void> removeDeviceToken(String token) async {
    await _dio.delete('/notifications/device-token', data: {'token': token});
  }

  /// Get notifications
  /// GET /notifications
  Future<List<Map<String, dynamic>>> getNotifications({bool unreadOnly = false}) async {
    final response = await _dio.get('/notifications', queryParameters: {
      if (unreadOnly) 'unreadOnly': true,
    });
    return List<Map<String, dynamic>>.from(response.data);
  }

  /// Get unread count
  /// GET /notifications/unread-count
  Future<int> getUnreadCount() async {
    final response = await _dio.get('/notifications/unread-count');
    return response.data['count'];
  }

  /// Mark notification as read
  /// PUT /notifications/:id/read
  Future<void> markAsRead(String notificationId) async {
    await _dio.put('/notifications/$notificationId/read');
  }

  /// Mark all as read
  /// PUT /notifications/read-all
  Future<void> markAllAsRead() async {
    await _dio.put('/notifications/read-all');
  }

  void handleNotificationTap(Map<String, dynamic> data) {
    final type = data['type'];
    switch (type) {
      case 'message':
        // Navigate to chat
        navigatorKey.currentState?.pushNamed('/chat/${data['conversationId']}');
        break;
      case 'session_booked':
      case 'session_confirmed':
      case 'session_canceled':
        navigatorKey.currentState?.pushNamed('/sessions/${data['sessionId']}');
        break;
      case 'client_request':
        navigatorKey.currentState?.pushNamed('/clients/requests');
        break;
      // ... handle other types
    }
  }
}

final notificationService = NotificationService();
```

---

## 11. File Uploads

### Media Upload Service

```dart
// lib/services/media_service.dart
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http_parser/http_parser.dart';

class MediaService {
  final Dio _dio = api.dio;

  /// Get presigned URL for S3 upload
  /// POST /media/presigned-url
  Future<Map<String, String>> getPresignedUrl(String fileName, String fileType) async {
    final response = await _dio.post('/media/presigned-url', data: {
      'fileName': fileName,
      'fileType': fileType,
    });
    return {
      'uploadUrl': response.data['uploadUrl'],
      'fileUrl': response.data['fileUrl'],
    };
  }

  /// Upload file to S3
  Future<String> uploadFile(XFile file) async {
    final fileName = file.name;
    final fileType = file.mimeType ?? 'application/octet-stream';

    // 1. Get presigned URL
    final urls = await getPresignedUrl(fileName, fileType);

    // 2. Upload to S3
    final bytes = await file.readAsBytes();
    await Dio().put(
      urls['uploadUrl']!,
      data: bytes,
      options: Options(
        headers: {
          'Content-Type': fileType,
        },
      ),
    );

    // 3. Return the file URL
    return urls['fileUrl']!;
  }

  /// Pick and upload image
  Future<String?> pickAndUploadImage({ImageSource source = ImageSource.gallery}) async {
    final picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: source);

    if (image == null) return null;

    return uploadFile(image);
  }

  /// Pick and upload video
  Future<String?> pickAndUploadVideo({ImageSource source = ImageSource.gallery}) async {
    final picker = ImagePicker();
    final XFile? video = await picker.pickVideo(source: source);

    if (video == null) return null;

    return uploadFile(video);
  }
}

final mediaService = MediaService();
```

### Usage Example

```dart
// Profile photo upload
Future<void> updateProfilePhoto() async {
  try {
    final imageUrl = await mediaService.pickAndUploadImage();
    if (imageUrl != null) {
      await profileService.updateProfile(photoUrl: imageUrl);
      setState(() => user.photoUrl = imageUrl);
    }
  } catch (e) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Failed to upload image')),
    );
  }
}

// Send image in chat
Future<void> sendImageMessage(String conversationId) async {
  final imageUrl = await mediaService.pickAndUploadImage();
  if (imageUrl != null) {
    chatSocket.sendMessage(
      conversationId,
      imageUrl,
      messageType: 'image',
      fileUrl: imageUrl,
    );
  }
}
```

---

## API Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/expired token) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 409 | Conflict (e.g., email already exists) |
| 429 | Too Many Requests (rate limited) |
| 500 | Server Error |

---

## Error Handling

```dart
// lib/core/api/error_handler.dart
String getErrorMessage(DioException error) {
  if (error.response != null) {
    final data = error.response!.data;
    if (data is Map && data['message'] != null) {
      return data['message'];
    }
    switch (error.response!.statusCode) {
      case 400: return 'Invalid request';
      case 401: return 'Please login again';
      case 403: return 'You don\'t have permission';
      case 404: return 'Not found';
      case 429: return 'Too many requests. Please wait.';
      default: return 'Something went wrong';
    }
  }
  if (error.type == DioExceptionType.connectionTimeout ||
      error.type == DioExceptionType.receiveTimeout) {
    return 'Connection timeout. Please check your internet.';
  }
  return 'Network error. Please try again.';
}
```

---

## Quick Reference

### Endpoint Prefixes

| Module | Prefix |
|--------|--------|
| Auth | `/auth` |
| Users | `/users` |
| Coach Profiles | `/coach-profile` |
| Coach-Client | `/coach-client` |
| Schedule | `/schedule` |
| Chat | `/chat` |
| Workouts | `/workouts` |
| Nutrition | `/nutrition` |
| Products | `/products` |
| Cart | `/cart` |
| Notifications | `/notifications` |
| Media | `/media` |

### WebSocket Namespaces

| Namespace | Purpose |
|-----------|---------|
| `/chat` | Real-time messaging |
| `/notifications` | Push notifications |

---

**Need help?** Check the Swagger docs at `http://localhost:3000/api` for full API details.
