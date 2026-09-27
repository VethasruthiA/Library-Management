# Page & Pine — User Management

Phase 1 frontend for managing library users. It supports listing, searching, viewing, creating, editing, and deleting users through the backend REST API.

## Run locally

1. Start the backend and make sure its user endpoints are available under `/users`.
2. In this directory, install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and set `VITE_API_URL` to the backend origin (default: `http://localhost:8080`).
4. Start the development server with `npm run dev`.

The frontend calls `POST /users`, `GET /users`, `GET /users/{id}`, `PUT /users/{id}`, and `DELETE /users/{id}`. If the frontend and backend use different origins, configure the backend to allow the Vite development origin via CORS.

The create form requires a password. On edit, the password field is optional and is omitted from the request when left blank. User passwords should be securely hashed by the backend and must never be returned to the frontend.
