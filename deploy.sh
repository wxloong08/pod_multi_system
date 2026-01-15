#!/bin/bash

# Deployment Script for POD System
# Run this on the server (42.192.204.147)

echo "Starting Deployment..."

# 1. Pull latest code
echo "Pulling latest code..."
git pull origin main

# 2. Build and Start Containers
# --build triggers frontend rebuild to bake in API URL
echo "Building and starting containers..."
docker-compose up -d --build

echo "Deployment Complete!"
echo "Check status with: docker-compose ps"
