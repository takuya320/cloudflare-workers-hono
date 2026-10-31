FROM node:26.13.0-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends git curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Node.js 25+ no longer bundles Corepack, so install the pnpm version pinned by
# package.json's "packageManager" field directly.
RUN npm install -g pnpm@10.14.0

USER node
