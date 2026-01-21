# Mobile Architecture & Integration Guide

## Overview
The `thulobazaar` monorepo is well-structured for mobile development. The backend (`apps/api`) exposes a standard REST API that is already consumed by a shared TypeScript client (`packages/api-client`). This means the mobile app can replicate the exact same logic without requiring new backend endpoints.

## 1. API Architecture
**Source of Truth**: `packages/api-client/src/index.ts`
This file defines the entire capability of the application. The mobile app should mirror this structure in Dart.

### Recommendation
Create a Service Layer in Flutter that mimics the `ApiClient` class:
- `lib/core/api/api_client.dart` (Main class)
- `lib/core/api/methods/auth.dart`
- `lib/core/api/methods/ads.dart`
etc.

### HTTP Client
- **Base URL**: `http://<your-ip>:5000` (Localhost) or Production URL.
- **Library**: Use `dio` in Flutter (equivalent to `axios`).
- **Auth**: Implement an Interceptor to attach `Authorization: Bearer <token>` to every request.

## 2. Authentication Strategy

### Standard Login (Email/Phone)
- **Endpoint**: `POST /api/auth/login`
- **Payload**: `{ email: "...", password: "..." }`
- **Response**: `{ user: User, token: "jwt_token..." }`
- **Action**: Store `token` in `flutter_secure_storage`.

### Social Login (Google)
The backend currently uses a **Redirect Flow** (optimized for Web).
- **Endpoint**: `GET /api/auth/google` -> Redirects to Google -> Redirects to `/api/auth/callback/google` -> Redirects to `FRONTEND_URL/api/auth/oauth-callback?token=...`

**Mobile Implementation (Zero Backend Changes)**:
1. Use the `flutter_web_auth_2` package.
2. Open `http://<backend>/api/auth/google`.
3. Listen for the redirect scheme (e.g., `thulobazaar://`).
4. **Note**: You may need to update the backend to allow redirecting to a custom variable `CALLBACK_URL` or simply intercept the web redirect if using a WebView.
   * *Easier Alternative*: Add a specialized `POST /api/auth/google-mobile` endpoint that accepts an ID Token from the native Google SDK.

## 3. Real-time Features
- **Library**: `socket_io_client` for Flutter.
- **Connection**: Connect to the root URL.
- **Events**:
  - `message:new` (Incoming chat messages)
  - `notification:new` (General notifications)

## 4. Shared Resources
- **Assets**: You are already copying assets from `apps/web/public`.
- **Types**: `packages/types` contains all the TypeScript interfaces. You will need to convert these to Dart classes (or use a generator like `json_serializable`).


## 5. Local Data Persistence (Android & iOS)
**Requirement**: "Saved Drafts" for ads must be stored locally on the device and NOT synced to the backend until published.

### Strategy
- **Library**: `shared_preferences` (for simple JSON) or `hive` (for structured data/performance).
- **Data Structure**:
  ```json
  [
    {
      "id": "uuid_v4",
      "title": "Untitled Ad",
      "category": "Mobiles",
      "last_edited": "2024-01-21T10:00:00Z",
      "data": { ...form_fields... }
    }
  ]
  ```
- **Workflow**:
  1. User taps "Start New Ad" -> Create temporary draft object.
  2. User changes screen/closes app -> Save draft to Local Storage.
  3. User opens "Post Ad" screen -> Load list from Local Storage.
  4. User clicks "Publish" -> Submit to API -> On success, remove from Local Storage.

## Summary
✅ **Ready to Build**: No significant backend work is required.
auth, ads, categories, and messaging APIs are fully exposed.
⚠️ **Caution**: Social Auth flow might need a slight tweak for a native UX, but is achievable with current endpoints via WebView.
