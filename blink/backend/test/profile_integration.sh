#!/usr/bin/env bash
set -euo pipefail
API_BASE=${API_BASE:-http://localhost:8080/api}
TMP=$(mktemp -d)
COOKIE=$TMP/cookie.txt
timestamp=$(date +%s)
EMAIL="profile-${timestamp}@gmail.com"
PASS="Password123!"

echo "Signing up: $EMAIL"
code=$(curl -s -w "%{http_code}" -o $TMP/signup.json -X POST -H "Content-Type: application/json" -c $COOKIE -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" $API_BASE/auth/signup)
if [ "$code" -ge 400 ]; then cat $TMP/signup.json; echo "signup failed"; exit 2; fi

echo "Updating profile (full_name, phone)"
curl -s -b $COOKIE -X PATCH -H "Content-Type: application/json" -d '{"full_name":"Test User","phone":"+15551234567"}' $API_BASE/customers/me | jq .

echo "Uploading avatar"
curl -s -b $COOKIE -X POST -F "avatar=@/dev/stdin;filename=avatar.png;type=image/png" $API_BASE/customers/me/avatar < <(head -c 100 /dev/urandom) | jq .

echo "Fetching /me"
curl -s -b $COOKIE $API_BASE/customers/me | jq .

echo "Deleting account"
curl -s -b $COOKIE -X DELETE $API_BASE/customers/me | jq .

echo "Profile integration completed"
