<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/40534bdc-818d-41c5-beae-846b1a97d41a

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Create `.env` from `.env.example` and set your environment variables:
   - `GEMINI_API_KEY`
   - `APP_URL`
   - `MONGODB_URI`
   - `MONGODB_DB_NAME` (optional, defaults to `beer_die`)
   - `PORT` (optional locally, defaults to `4000`; set automatically by Render/Railway)
   - `VITE_BACKEND_URL` (optional, defaults to `http://localhost:4000`)
3. Run the frontend:
   `npm run dev`
4. Run the backend:
   `npm run backend:dev`

## Backend health checks

- `GET http://localhost:4000/health`
- `GET http://localhost:4000/health/db`
