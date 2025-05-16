#!/bin/bash

# Test script for the backend API
# This script makes requests to various endpoints to verify they're working

BASE_URL="http://localhost:3000"

echo "Testing API endpoints..."
echo "========================"
echo

# Test health endpoint
echo "Testing health endpoint..."
curl -v $BASE_URL/health
echo
echo "------------------------"
echo

# Test auth endpoints
echo "Testing auth endpoints..."
echo "Register endpoint:"
curl -v -X POST $BASE_URL/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
echo
echo "------------------------"
echo

# Login and get token
echo "Login endpoint:"
TOKEN=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get token. Skipping authenticated requests."
else
  echo "Successfully logged in and got token."
  echo
  echo "------------------------"
  echo

  # Test notes endpoints with authentication
  echo "Testing notes endpoints with authentication..."
  echo "Get notes endpoint:"
  curl -v $BASE_URL/api/v1/notes \
    -H "Authorization: Bearer $TOKEN"
  echo
  echo "------------------------"
  echo

  # Test creating a note
  echo "Create note endpoint:"
  curl -v -X POST $BASE_URL/api/v1/notes \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"title":"Test Note","content":"This is a test note","tags":["test"]}'
  echo
  echo "------------------------"
  echo
fi

echo "API testing complete!"
