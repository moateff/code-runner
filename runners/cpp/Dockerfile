FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

COPY scripts/ /scripts/

RUN chmod +x /scripts/run.sh
