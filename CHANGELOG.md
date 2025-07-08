# Changelog

All notable changes to this project will be documented in this file.

---

## [1.3.0] - 2025-07-11

### ✨ Added

### 🛠 Improved

### 🐛 Fixed

---

## [1.2.0] - 2025-07-04

### 🛠 Improved
#### 🧱 Frontend Architecture
- Cleaned up Axios interceptor setup:
  - Created Axios instances: `axiosJWT` (authenticated) and `axiosBase` (unauthenticated)
  - Attached required headers directly in the Axios instances
  - Removed redundant header declarations throughout the codebase

- Modularized backend API service functions:
  - `UserService`, `AuthService`

#### 🧰 Utilities
- Added reusable utility modules to eliminate redundant logic:
  - `localStorageUtil`: Handles safe access and lifecycle management for localStorage and session data
  - `jwtUtil`: Centralizes JWT decoding, expiration checks, and validation
  - `errorUtil`: Formats Axios/network errors and standardizes error handling with `AppError`

#### 🧠 Redux Refactor
- Modularized Redux state management:
  - `userSlice`: Manages user authentication and profile state
  - `alertSlice`: Manages alert dialog messages and types

- Wrapped raw Redux `dispatch`/`selector` with `useReduxUser()` and `useReduxAlert()` custom hooks for cleaner component usage
- Added `showSuccess()` and `showError()` utilities to trigger consistent UI alerts

#### 🔐 AuthContext
- Refactored `AuthContext` to centralize all login/logout/token logic and reduce coupling with API service layers
- The login page no longer manually fetches tokens or user info — `AuthContext.login()` handles everything internally
- Implemented auto-session restore on app load by reading persisted Redux state or localStorage session
- Added `refreshAccessToken()` to silently update expired tokens using a valid refresh token

#### 🧹 Code Cleanup
- Removed `media` folder from the `public/` directory to reduce build size
- Replaced raw `console.log` calls with structured logging methods: `logInfo`, `logDebug`, `logWarn`, `logError`

---

## [1.1.0] - 2025-06-27

### 🛠 Improved
- Changed login label from “Name” to “User name”
- Updated placeholder (hint) texts in the Login and Register forms for better clarity
- Replaced browser alert() with a custom React alert box; prevented unwanted page reloads during form submission

---

## [1.0.0] - 2025-06-20

### 🛠 Initial Restoration Release

- Adopted legacy TOEIC project as foundation
- Added missing dependencies to ensure successful build
- Verified and stabilized project structure (FastAPI backend, React frontend)
- Verified AI features still work
- Ensured compatibility between frontend/backend for CRUD flow

📌 This release marks the transition to an actively maintained version of the project. Future versions will focus on new features, refactoring, and improved reliability.

