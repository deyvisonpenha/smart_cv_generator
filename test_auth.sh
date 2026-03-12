#!/bin/bash

# SmartCV Authentication Test Script
# Tests the JWT authentication endpoints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API Base URL
API_URL="http://localhost:3000/api/v1"

# Test credentials
TEST_EMAIL="test_$(date +%s)@example.com"
TEST_PASSWORD="SecurePassword123!"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SmartCV Authentication Test Suite${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: $2\n"
    else
        echo -e "${RED}✗ FAILED${NC}: $2\n"
        exit 1
    fi
}

# Function to extract JSON value
extract_json() {
    echo "$1" | grep -o "\"$2\"[^,}]*" | sed 's/"'$2'":"\?\([^,"]*\)"\?/\1/'
}

echo -e "${YELLOW}Testing endpoints at: ${API_URL}${NC}\n"

# Test 1: Health Check
echo -e "${BLUE}[1/5] Testing health check endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3000/up)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "Health check endpoint is responding"
else
    print_result 1 "Health check failed (HTTP $HTTP_CODE)"
fi

# Test 2: Signup
echo -e "${BLUE}[2/5] Testing user signup (POST /signup)...${NC}"
echo -e "Email: ${TEST_EMAIL}"
echo -e "Password: ${TEST_PASSWORD}\n"

SIGNUP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"password_confirmation\": \"${TEST_PASSWORD}\"
  }")

HTTP_CODE=$(echo "$SIGNUP_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$SIGNUP_RESPONSE" | sed '$d')

echo "Response Body:"
echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

if [ "$HTTP_CODE" -eq 201 ]; then
    JWT_TOKEN=$(extract_json "$RESPONSE_BODY" "token")
    USER_ID=$(extract_json "$RESPONSE_BODY" "id")
    SUBSCRIPTION_TIER=$(extract_json "$RESPONSE_BODY" "subscription_tier")

    if [ -n "$JWT_TOKEN" ]; then
        print_result 0 "User signup successful (User ID: $USER_ID, Tier: $SUBSCRIPTION_TIER)"
    else
        print_result 1 "Signup returned 201 but no token found"
    fi
else
    print_result 1 "Signup failed (HTTP $HTTP_CODE)"
fi

# Test 3: Login
echo -e "${BLUE}[3/5] Testing user login (POST /login)...${NC}"

LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\"
  }")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

echo "Response Body:"
echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
    LOGIN_TOKEN=$(extract_json "$RESPONSE_BODY" "token")

    if [ -n "$LOGIN_TOKEN" ]; then
        JWT_TOKEN="$LOGIN_TOKEN"  # Use login token for remaining tests
        print_result 0 "User login successful"
    else
        print_result 1 "Login returned 200 but no token found"
    fi
else
    print_result 1 "Login failed (HTTP $HTTP_CODE)"
fi

# Test 4: Current User (Authenticated Request)
echo -e "${BLUE}[4/5] Testing authenticated request (GET /current_user)...${NC}"
echo -e "Using JWT Token: ${JWT_TOKEN:0:20}...${NC}\n"

CURRENT_USER_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/current_user" \
  -H "Authorization: Bearer ${JWT_TOKEN}")

HTTP_CODE=$(echo "$CURRENT_USER_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$CURRENT_USER_RESPONSE" | sed '$d')

echo "Response Body:"
echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
    USER_EMAIL=$(extract_json "$RESPONSE_BODY" "email")

    if [ "$USER_EMAIL" = "$TEST_EMAIL" ]; then
        print_result 0 "Authenticated request successful (User: $USER_EMAIL)"
    else
        print_result 1 "Authenticated request returned wrong user"
    fi
else
    print_result 1 "Authenticated request failed (HTTP $HTTP_CODE)"
fi

# Test 5: Invalid Login
echo -e "${BLUE}[5/5] Testing invalid credentials (negative test)...${NC}"

INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"WrongPassword123!\"
  }")

HTTP_CODE=$(echo "$INVALID_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$INVALID_RESPONSE" | sed '$d')

echo "Response Body:"
echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

if [ "$HTTP_CODE" -eq 401 ]; then
    print_result 0 "Invalid credentials properly rejected (HTTP 401)"
else
    print_result 1 "Invalid credentials should return 401, got HTTP $HTTP_CODE"
fi

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✓ All Tests Passed!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}Test Summary:${NC}"
echo -e "  • Health check: ✓"
echo -e "  • User signup: ✓"
echo -e "  • User login: ✓"
echo -e "  • Authenticated request: ✓"
echo -e "  • Invalid credentials: ✓\n"

echo -e "${BLUE}Your JWT Token:${NC}"
echo -e "${JWT_TOKEN}\n"

echo -e "${YELLOW}Use this token for authenticated requests:${NC}"
echo -e "curl -H \"Authorization: Bearer ${JWT_TOKEN}\" ${API_URL}/current_user\n"

echo -e "${GREEN}Phase 1 Steps 4-5 Complete! Authentication is working! 🎉${NC}\n"
