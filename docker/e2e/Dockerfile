# Playwright e2e images for Math Defender.
#
# Two targets share this file:
#   - web:      mobile web projects (Chromium from the Playwright base image, no Electron binary)
#   - electron: Electron projects (Electron's own Chromium under Xvfb, no Playwright browsers)
#
# Build through docker/e2e/compose.yml (npm run test:e2e:docker:*), not directly.

# Must match the installed @playwright/test version; the web stage fails the build on drift.
ARG PLAYWRIGHT_VERSION=1.64.1
ARG NODE_VERSION=24

# ---------------------------------------------------------------------------
# web: runs `npm run test:e2e:web` (playwright.config.ts webServer builds + previews the app)
# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble AS web
ARG PLAYWRIGHT_VERSION

ENV CI=1 \
    E2E_DOCKER=1 \
    E2E_TARGET=web \
    E2E_ARTIFACTS_DIR=/app/e2e-artifacts \
    ELECTRON_SKIP_BINARY_DOWNLOAD=1

WORKDIR /app
RUN chown pwuser:pwuser /app
USER pwuser

COPY --chown=pwuser:pwuser package.json package-lock.json ./
RUN npm ci --no-audit --no-fund \
 && node -e "const v=require('@playwright/test/package.json').version; if (v !== process.argv[1]) { console.error('Playwright image v' + process.argv[1] + ' does not match installed @playwright/test ' + v + '. Update PLAYWRIGHT_VERSION in docker/e2e/Dockerfile and compose.yml.'); process.exit(1); }" "${PLAYWRIGHT_VERSION}"

COPY --chown=pwuser:pwuser . .

CMD ["npm", "run", "test:e2e:web"]

# ---------------------------------------------------------------------------
# electron: runs `npm run test:e2e:electron` under Xvfb against the prebuilt e2e renderer
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS electron

# Xvfb for a virtual display plus the shared libraries Electron's Chromium loads on Linux.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      xvfb xauth \
      libgtk-3-0 libnss3 libasound2 libgbm1 libdrm2 libxshmfence1 \
      libxss1 libxtst6 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 \
      libatk-bridge2.0-0 libatspi2.0-0 libcups2 libpango-1.0-0 libcairo2 \
      fonts-liberation ca-certificates \
 && rm -rf /var/lib/apt/lists/*

ENV CI=1 \
    E2E_DOCKER=1 \
    E2E_TARGET=electron \
    E2E_ARTIFACTS_DIR=/app/e2e-artifacts \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY --chown=node:node . .
# Electron loads build/ directly; E2E_TARGET=electron disables the Playwright webServer.
RUN npm run build:web:e2e

# Every command (including snapshot updates) gets a virtual display.
ENTRYPOINT ["xvfb-run", "-a", "--server-args=-screen 0 1920x1080x24"]
CMD ["npm", "run", "test:e2e:electron"]
