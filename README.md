# MERN Launchpad

Boilerplate MERN workspace with a Vite React frontend and an Express/MongoDB backend.

## Stack

- React 19 + Vite
- Express 5
- MongoDB + Mongoose
- npm workspaces

## Project Structure

```text
client/
server/
package.json
```

## Getting Started

1. Install dependencies:

	```bash
	npm install
	```

2. Copy environment template files if you want custom values:

	```bash
	copy server\env.example server\.env
	copy client\env.example client\.env
	```

3. Start the frontend and backend together:

	```bash
	npm run dev
	```

## Scripts

- `npm run dev` starts both apps.
- `npm run client` starts the Vite frontend.
- `npm run server` starts the Express backend.
- `npm run build` builds the frontend.
- `npm run check` runs the backend syntax check and frontend build.

## Ports

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## API Endpoints

- `GET /api/health`
- `GET /api/tasks`
- `POST /api/tasks`

## Notes

The backend will start even if MongoDB is not reachable. In that case the health endpoint reports the database as disconnected and the sample tasks endpoints return a `503` response until MongoDB is available.
