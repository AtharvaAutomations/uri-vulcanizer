FROM node:20

WORKDIR /app

COPY package*.json ./

# Install ALL deps including dev (needed for build)
RUN npm install

COPY . .

# Install TypeScript explicitly (safety)
RUN npm install -g typescript

# Build
RUN npm run build

CMD ["node", "dist/plc.js"]