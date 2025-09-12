#!/usr/bin/env bash
# Quick collection of curl commands to exercise the backend API.
# Save this file as test/curl_commands.sh and run: bash test/curl_commands.sh
# It uses cookie.txt to persist session between requests.

set -euo pipefail
COOKIE_FILE="cookie.txt"
API_BASE="http://localhost:3001/api"

echo "Using API: $API_BASE"

# helper: run curl and pretty-print JSON if jq exists
function pretty() {
  if command -v jq >/dev/null 2>&1; then
    jq '.'
  else
    cat
  fi
}

# 1) Signup (creates user and saves session cookie)
echo "\n== Signup =="
curl -s -c "$COOKIE_FILE" -X POST "$API_BASE/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"pavasai@gmail.com","password":"password123","full_name":"Test User"}' | pretty || true

# 1b) Test duplicate signup prevention
echo "\n== Duplicate signup test =="
curl -s -X POST "$API_BASE/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"pavasai@gmail.com","password":"password123","full_name":"Test User"}' | pretty || true

# Profile flow: get / update / avatar / delete
echo "\n== Profile: get me =="
curl -s -b "$COOKIE_FILE" -X GET "$API_BASE/customers/me" | pretty || true

echo "\n== Profile: update me =="
curl -s -b "$COOKIE_FILE" -X PATCH "$API_BASE/customers/me" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Updated Name","bio":"I love Brandverse","marketing_opt_in":true}' | pretty || true

echo "\n== Profile: upload avatar =="
curl -s -b "$COOKIE_FILE" -X POST "$API_BASE/customers/me/avatar" \
  -F "avatar=@test/sample-image.png" | pretty || true

echo "\n== Profile: delete me =="
curl -s -b "$COOKIE_FILE" -X DELETE "$API_BASE/customers/me" | pretty || true

# 2) Login (regular user)
echo "\n== Login (user) =="
curl -s -c "$COOKIE_FILE" -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"pavasai@gmail.com","password":"password123"}' | pretty || true

# 3) Login (admin)
echo "\n== Login (admin) =="
curl -s -c "$COOKIE_FILE" -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"admin123"}' | pretty || true

# 4) Current session user
echo "\n== Current user =="
curl -s -b "$COOKIE_FILE" -X GET "$API_BASE/auth/user" | pretty || true

# 5) List products
echo "\n== Products list =="
curl -s -X GET "$API_BASE/products" | pretty || true

# 6) Get product by id (using actual UUID)
echo "\n== Product detail (using real product ID) =="
curl -s -X GET "$API_BASE/products/e0c0c996-0472-437c-af1f-8ad5c22da9d4" | pretty || true

# 6b) Upload product image (requires admin session)
echo "\n== Upload product image =="
curl -s -b "$COOKIE_FILE" -X POST "$API_BASE/products/e0c0c996-0472-437c-af1f-8ad5c22da9d4/images" \
  -F "images=@test/sample-image.png" | pretty || true

# 6c) Verify product with uploaded image
echo "\n== Product detail (after image upload) =="
curl -s -X GET "$API_BASE/products/e0c0c996-0472-437c-af1f-8ad5c22da9d4" | pretty || true

# 6d) Update product stock (admin only)
echo "\n== Update product stock =="
curl -s -b "$COOKIE_FILE" -X PATCH "$API_BASE/products/e0c0c996-0472-437c-af1f-8ad5c22da9d4" \
  -H "Content-Type: application/json" \
  -d '{"stock_quantity":10}' | pretty || true

# 7) Get cart (requires session cookie)
echo "\n== Get cart =="
curl -s -b "$COOKIE_FILE" -X GET "$API_BASE/cart" | pretty || true

# 8) Add to cart (using correct route /cart/items)
echo "\n== Add to cart =="
curl -s -b "$COOKIE_FILE" -X POST "$API_BASE/cart/items" \
  -H "Content-Type: application/json" \
  -d '{"productId":"e0c0c996-0472-437c-af1f-8ad5c22da9d4","quantity":2}' | pretty || true

# 9) Create order (requires session cookie)
echo "\n== Create order =="
curl -s -b "$COOKIE_FILE" -X POST "$API_BASE/orders" \
  -H "Content-Type: application/json" \
  -d '{"shippingAddress":"123 Main St","paymentMethod":"credit_card"}' | pretty || true

# 10) List orders (requires session cookie)
echo "\n== List orders =="
curl -s -b "$COOKIE_FILE" -X GET "$API_BASE/orders" | pretty || true

# 11) Admin analytics summary (requires admin session)
echo "\n== Admin analytics =="
curl -s -b "$COOKIE_FILE" -X GET "$API_BASE/admin/analytics/summary" | pretty || true

# 12) Logout
echo "\n== Logout =="
curl -s -b "$COOKIE_FILE" -X POST "$API_BASE/auth/logout" | pretty || true

echo "\nDone. Cookie file: $COOKIE_FILE"
