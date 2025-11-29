# -----------------------------------
# 1. Build Stage
# -----------------------------------
FROM node:22 AS build
WORKDIR /

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Build Vite frontend
RUN npm run build

# -----------------------------------
# 2. Run Stage
# -----------------------------------
FROM node:22
WORKDIR /

# Copy ONLY necessary built files
COPY --from=build /dist ./dist
COPY server.js ./
COPY package*.json ./

# Install ONLY production dependencies (including express)
RUN npm ci --production

# Cloud Run requires PORT env
ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]
