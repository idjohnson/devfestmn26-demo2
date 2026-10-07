FROM node:22-alpine
RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-eng poppler-utils
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY public ./public
USER node
EXPOSE 3000
ENV OLLAMA_URL=http://host.docker.internal:11434 OLLAMA_MODEL_FAST=gemma4:e4b OLLAMA_MODEL_DETAILED=medgemma1.5:4b
CMD ["node", "src/server.js"]
