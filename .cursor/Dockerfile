FROM node:24.4.1-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends git curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Activate the pnpm version pinned by package.json's "packageManager" field so
# installs are deterministic and work without a network prompt.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

USER node
