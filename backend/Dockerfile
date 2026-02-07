FROM python:3.9-slim
# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
# Set work directory
WORKDIR /app
# Install system dependencies required for jqdatasdk (pandas/numpy compilation)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*
# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt
# Copy project
COPY . .
# Expose port
EXPOSE 8000
# Run application
CMD ["python", "main.py"]
