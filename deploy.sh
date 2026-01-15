#!/bin/bash

# Deployment Script for POD System
# Run this on the server (42.192.204.147)

echo "Starting Deployment..."

# 1. Pull latest code
echo "Pulling latest code..."
git pull origin main

# 2. Build and Start Containers
# --build triggers frontend rebuild
echo "Building and starting containers (Frontend:3002, Backend:8001)..."
docker-compose up -d --build

echo "Containers are running!"
echo "NOTE: Since you have an existing Nginx, please configure it to proxy:"
echo "  - pod.travelmind.cloud -> localhost:3002"
echo "  - pod.travelmind.cloud/api -> localhost:8001/api"
echo "  - pod.travelmind.cloud/static -> localhost:8001/static"
echo "Use 'host_nginx_config.conf' as a reference."

