# Page & Pine — Library Portal

React frontend for the library user module, authentication, and seat management. It includes student registration and login, JWT-backed sessions, role-protected routes, student/admin dashboards, all/available seat views, admin seat CRUD, and the Phase 1 user directory.

## Run locally

1. Start the Spring Boot backend and make sure the listed auth, user, and seat endpoints are available.
2. In this directory, install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and set `VITE_API_URL` to the backend origin (default: `https://lair-setting-urologist.ngrok-free.dev`).
4. Start the development server with `npm run dev`.

The frontend calls `POST /users` for student registration; `POST /auth/login`; `GET /seats`, `GET /seats/available`, `GET /seats/{seatId}`, `POST /seats`, `PUT /seats/{seatId}`, `DELETE /seats/{seatId}`; and the Phase 1 user CRUD endpoints. Students can switch between `GET /seats` and `GET /seats/available`; admins use `GET /seats` and can manage seat records. Bearer tokens are attached automatically to API calls after login. A `401` clears the local session and redirects to Login; a `403` displays Access Denied.

Registration always submits the `STUDENT` role. Admin-only controls are guarded in the frontend, but the backend must enforce authorization independently. The login response is expected to include a JWT (`token`, `accessToken`, or `jwt`) and the user role either in the response or in JWT claims. Seat create/update submits `seatNumber`, `floor`, and `status`; align field names and floor type with the existing backend DTO if its schema differs.

The Phase 1 admin user directory supports create, view, update, and delete. Its create form requires a password; edit omits an empty password. Passwords must be securely hashed by the backend and must never be returned to the frontend. If frontend and backend origins differ, configure backend CORS to allow the Vite development origin. The ngrok URL may also require the backend tunnel's expected host/header configuration.
