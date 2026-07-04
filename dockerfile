FROM node:18-alpine

WORKDIR /app

# Copier les fichiers du backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install

COPY backend/ ./backend

# Copier les fichiers du frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend/ ./frontend

# Construire le frontend
RUN cd frontend && npm run build

# Exposer le port du backend
EXPOSE 3000

# Démarrer le backend
CMD ["sh", "-c", "cd backend && npx prisma db push && npm run start:prod"]