# Code Runner Frontend

Angular 22 application for the online code compiler. Provides a Monaco code editor, language selection, stdin input, and output display.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose), or
- Node.js 24+ and npm 11+ for local development without Docker

## Quick start with Docker Compose

All Docker files live in this directory. The build context is limited to this folder only.

```bash
docker compose build
docker compose up -d
```

The app is served at [http://localhost:4200](http://localhost:4200).

Check service status:

```bash
docker compose ps
```

Stop the stack:

```bash
docker compose down
```

## Project structure

```
.
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
├── .dockerignore
└── src/
```

## Services

| Service  | Description |
|----------|-------------|
| frontend | Angular app built with Node and served by Nginx on port 80 inside the container, mapped to port 4200 on the host. |
| backend  | Placeholder service (Alpine) so the compose file can start. Replace with the real API service when available. |

Both services share the `compiler-network` bridge network so they can communicate by service name.

## Frontend container

The image is built in two stages:

1. **Build** — installs npm dependencies and runs `ng build --configuration=production`.
2. **Serve** — copies compiled assets into Nginx and serves them on port 80.

A health check hits `http://127.0.0.1/health` inside the container. Nginx returns `200 OK` for that route.

Files listed in `.dockerignore` (such as `node_modules` and `dist`) are excluded from the build context.

## Backend placeholder

The backend service is currently a stub that keeps the container running (`sleep infinity`). The frontend shows a connection error until a real backend is added to `docker-compose.yml` on the same network.

When the backend is implemented, it should expose a health endpoint and a code execution API that the frontend calls at `/api` (see `src/environments/`).

## Local development (without Docker)

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm start
```

Open [http://localhost:4200](http://localhost:4200). The app reloads when source files change.

The dev server expects a backend API. Without one running, the health check on load will fail and a connection error is shown in the UI.

## Production build

```bash
npm run build
```

Output is written to `dist/frontend/`.

## Tests

```bash
npm test
```

## Configuration

API base URL is set in environment files:

- Development: `src/environments/environment.ts`
- Production: `src/environments/environment.prod.ts` (uses `/api` for same-origin requests through Nginx)
