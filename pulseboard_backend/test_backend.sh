#!/bin/bash
# Test the backend endpoints

echo "Testing Request to http://localhost:8082/api/auth/register"
curl -X POST http://localhost:8082/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@iitj.ac.in","password":"password123"}' \
  -v

echo -e "\n\n--------------------------------\n"

echo "Testing Request to http://localhost:8082/api/auth/login"
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@iitj.ac.in","password":"password123"}' \
  -v
