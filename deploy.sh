#!/bin/bash

# Deployment Script for POD System
# Run this on the server (42.192.204.147)

echo "Starting Deployment..."

# 1. Pull latest code
echo "Pulling latest code..."
git pull origin main

# 2. Build and Start Containers
# --build triggers frontend rebuild
echo "Building and starting containers (Frontend:3000, Backend:8000)..."
docker-compose up -d --build

echo "Containers are running!"
echo "NOTE: Since you have an existing Nginx, please configure it to proxy:"
echo "  - pod.travelmind.cloud -> localhost:3000"
echo "  - pod.travelmind.cloud/api -> localhost:8000/api"
echo "  - pod.travelmind.cloud/static -> localhost:8000/static"
echo "Use 'host_nginx_config.conf' as a reference."

