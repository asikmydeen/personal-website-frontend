#!/bin/bash

# Development script for the backend

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "Please update the .env file with your actual configuration values."
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run the server using nodemon for auto-reload
echo "Starting development server..."
npx nodemon src/index.js