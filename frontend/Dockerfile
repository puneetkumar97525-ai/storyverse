# Development image for the StoryVerse frontend (Vite dev server).
# For production you would instead run `npm run build` and serve the generated
# dist/ folder with a static web server (see docs/architecture.md).
FROM node:22-slim

WORKDIR /app

# Install dependencies first so the layer cache survives source edits.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# --host 0.0.0.0 makes the server reachable from outside the container.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
