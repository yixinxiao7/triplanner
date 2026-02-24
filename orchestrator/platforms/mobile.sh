#!/usr/bin/env bash
# Platform config: Mobile Application (React Native + Expo + Express + PostgreSQL)
# Sourced by orchestrate.sh when PLATFORM=mobile

PLATFORM_NAME="Mobile Application"
PLATFORM_DESCRIPTION="Cross-platform mobile app with React Native (Expo) and Express REST API backend"

# ── Tech Stack ───────────────────────────────────────────────────────
PLATFORM_FRONTEND="React Native (Expo SDK)"
PLATFORM_BACKEND="Node.js + Express"
PLATFORM_DATABASE="PostgreSQL + Knex.js"
PLATFORM_AUTH="JWT (access + refresh tokens) + Secure Storage"

# ── Directory Layout ─────────────────────────────────────────────────
PLATFORM_FRONTEND_DIR="mobile"
PLATFORM_BACKEND_DIR="backend"
PLATFORM_SHARED_DIR="shared"
PLATFORM_INFRA_DIR="infra"

# ── Commands ─────────────────────────────────────────────────────────
PLATFORM_FRONTEND_INSTALL="cd ${PROJECT_ROOT}/mobile && npm install"
PLATFORM_BACKEND_INSTALL="cd ${PROJECT_ROOT}/backend && npm install"
PLATFORM_FRONTEND_BUILD="cd ${PROJECT_ROOT}/mobile && npx expo export"
PLATFORM_BACKEND_BUILD=""
PLATFORM_FRONTEND_DEV="cd ${PROJECT_ROOT}/mobile && npx expo start"
PLATFORM_BACKEND_DEV="cd ${PROJECT_ROOT}/backend && npm run dev"
PLATFORM_FRONTEND_TEST="cd ${PROJECT_ROOT}/mobile && npm test"
PLATFORM_BACKEND_TEST="cd ${PROJECT_ROOT}/backend && npm test"
PLATFORM_MIGRATE="cd ${PROJECT_ROOT}/backend && npm run migrate"
PLATFORM_MIGRATE_ROLLBACK="cd ${PROJECT_ROOT}/backend && npm run migrate:rollback"
PLATFORM_DB_START="cd ${PROJECT_ROOT}/infra && docker-compose up -d"

# ── URLs ─────────────────────────────────────────────────────────────
PLATFORM_FRONTEND_URL="exp://localhost:8081"  # Expo dev server
PLATFORM_BACKEND_URL="http://localhost:3000"
PLATFORM_HEALTH_ENDPOINT="${PLATFORM_BACKEND_URL}/api/v1/health"

# ── Architecture Template ────────────────────────────────────────────
platform_architecture_overrides() {
    cat <<'ARCH'
## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Mobile App | React Native + Expo | Cross-platform iOS/Android with Expo managed workflow |
| Backend | Node.js + Express | REST API with JWT authentication |
| Database | PostgreSQL | Relational database with Knex.js for query building and migrations |
| Auth | JWT (jsonwebtoken) | Access tokens (15 min) + refresh tokens (7 days), stored in Expo SecureStore |
| Navigation | React Navigation | Stack and tab navigation |
| State | React Context + hooks | No external state library unless complexity demands it |
| Hosting | TBD | Backend: container hosting, App: App Store / Google Play / Expo EAS |
| CI/CD | TBD | EAS Build for mobile, GitHub Actions for backend |

## Environments

| Environment | Mobile | Backend URL | Purpose |
|------------|--------|-------------|---------|
| Local | Expo Go on device/simulator | http://localhost:3000 | Development |
| Staging | Internal TestFlight / Internal Track | TBD | Pre-release testing |
| Production | App Store / Google Play | TBD | Live app |

## Mobile-Specific Conventions

### Navigation
- Use React Navigation with typed routes
- Stack navigator for auth flows, tab navigator for main app
- Deep linking support for key screens

### Storage
- Expo SecureStore for auth tokens (never AsyncStorage for secrets)
- AsyncStorage for non-sensitive preferences and cache
- No storing sensitive data in Redux/state that persists

### Networking
- API client uses the same base pattern as web (shared/types/)
- Handle offline gracefully: queue failed requests, show offline indicator
- Respect mobile data constraints: paginate aggressively, lazy-load images

### Platform-Specific
- Use Platform.select() for iOS/Android differences
- Test on both iOS and Android simulators
- Respect safe areas (notch, home indicator)
- Support both light and dark mode via Appearance API

## Hard Constraints

- All API endpoints must be RESTful
- No ORM magic — use explicit query builder (Knex)
- Mobile app must handle offline state gracefully
- All environment-specific config goes through app.config.js (Expo) or .env (backend)
- No circular dependencies between modules
- Shared types between mobile and backend via shared/ directory
ARCH
}

# ── Setup Steps ──────────────────────────────────────────────────────
platform_setup() {
    log_info "Setting up Mobile platform..."

    # Check for Expo CLI
    if ! command -v npx &>/dev/null; then
        log_error "npx not found — install Node.js 18+ first"
        return 1
    fi

    # Create mobile directory if it doesn't exist (first-time setup)
    if [[ ! -d "${PROJECT_ROOT}/mobile" ]]; then
        log_info "Scaffolding React Native (Expo) project..."
        mkdir -p "${PROJECT_ROOT}/mobile"

        # Create a minimal Expo project structure
        cat > "${PROJECT_ROOT}/mobile/package.json" <<'PKGJSON'
{
  "name": "mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.0",
    "react-native-safe-area-context": "~5.0.0",
    "react-native-screens": "~4.0.0",
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/native-stack": "^7.0.0",
    "@react-navigation/bottom-tabs": "^7.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "jest": "^29.7.0",
    "jest-expo": "~52.0.0",
    "@testing-library/react-native": "^12.4.0",
    "eslint": "^8.57.0"
  },
  "jest": {
    "preset": "jest-expo"
  }
}
PKGJSON

        cat > "${PROJECT_ROOT}/mobile/app.config.js" <<'APPCONFIG'
export default {
  expo: {
    name: "app",
    slug: "app",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "app",
    newArchEnabled: true,
    ios: { supportsTablet: true },
    android: { adaptiveIcon: { backgroundColor: "#ffffff" } },
    plugins: ["expo-router", "expo-secure-store"],
    extra: {
      apiUrl: process.env.API_URL || "http://localhost:3000",
    },
  },
};
APPCONFIG

        mkdir -p "${PROJECT_ROOT}/mobile/app"
        mkdir -p "${PROJECT_ROOT}/mobile/src/components"
        mkdir -p "${PROJECT_ROOT}/mobile/src/hooks"
        mkdir -p "${PROJECT_ROOT}/mobile/src/utils"
        mkdir -p "${PROJECT_ROOT}/mobile/src/styles"

        # Create API client for mobile
        cat > "${PROJECT_ROOT}/mobile/src/utils/api.js" <<'APICLIENT'
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

async function request(method, path, body = null) {
  const token = await SecureStore.getItemAsync('auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const response = await fetch(`${API_URL}${path}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw { status: response.status, ...data.error };
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
};
APICLIENT

        log_success "Mobile project scaffolded"
    fi

    # Install backend dependencies
    if [[ -f "${PROJECT_ROOT}/backend/package.json" ]]; then
        log_info "Installing backend dependencies..."
        (cd "${PROJECT_ROOT}/backend" && npm install 2>&1) || log_warn "Backend npm install had issues"
    fi

    # Install mobile dependencies
    if [[ -f "${PROJECT_ROOT}/mobile/package.json" ]]; then
        log_info "Installing mobile dependencies..."
        (cd "${PROJECT_ROOT}/mobile" && npm install 2>&1) || log_warn "Mobile npm install had issues"
    fi

    # Start database
    if command -v docker &>/dev/null; then
        log_info "Starting PostgreSQL via Docker..."
        (cd "${PROJECT_ROOT}/infra" && docker-compose up -d 2>&1 || docker compose up -d 2>&1) || log_warn "Docker had issues"
    else
        log_warn "Docker not available — database must be set up manually"
    fi

    # Backend .env
    if [[ ! -f "${PROJECT_ROOT}/backend/.env" ]] && [[ -f "${PROJECT_ROOT}/backend/.env.example" ]]; then
        cp "${PROJECT_ROOT}/backend/.env.example" "${PROJECT_ROOT}/backend/.env"
    fi

    log_success "Mobile platform setup complete"
}

platform_teardown() {
    log_info "Tearing down Mobile platform..."
    if command -v docker-compose &>/dev/null; then
        (cd "${PROJECT_ROOT}/infra" && docker-compose down 2>&1) || true
    elif command -v docker &>/dev/null; then
        (cd "${PROJECT_ROOT}/infra" && docker compose down 2>&1) || true
    fi
}
