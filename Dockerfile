# Stage 1: build the React app
FROM node:22-alpine AS web
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend .
RUN npm run build

# Stage 2: FastAPI serves the API, the built app, and the local pages
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend backend
COPY --from=web /app/frontend/dist frontend/dist
WORKDIR /app/backend
ENV PORT=8001
EXPOSE 8001
CMD uvicorn server:app --host 0.0.0.0 --port $PORT
