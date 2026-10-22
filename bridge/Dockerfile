# =========================================================================
# GRM WHATSAPP CRM — DOCKERFILE FOR BAILEYS WEBSOCKET BRIDGE
# =========================================================================

FROM node:20-alpine

WORKDIR /app

# Install native dependencies required for audio/qrcode if any
RUN apk add --no-cache ffmpeg python3 make g++

# Copy package descriptors
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy bridge source files
COPY . .

# Ensure auth sessions directory exists
RUN mkdir -p auth_sessions

EXPOSE 3000

CMD ["node", "server.js"]
