FROM python:3.12-slim

WORKDIR /workspace

# Optional: safer + smaller runtime
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copy scripts (if you still want wrapper execution)
COPY scripts/ /scripts/

RUN chmod +x /scripts/run.sh
