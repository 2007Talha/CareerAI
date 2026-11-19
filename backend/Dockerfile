FROM python:3.11-slim

WORKDIR /app

# Install system build dependencies for C-extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application and ML package
COPY app/ ./app/
COPY ../ml/ ./ml/
COPY ../prompts/ ./prompts/

ENV APP_ENV=production
ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
