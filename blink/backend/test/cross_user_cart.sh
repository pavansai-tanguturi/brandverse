#!/usr/bin/env zsh
# Integration test: ensure one user cannot modify another user's cart item
# Usage: PRODUCT_ID=<existing-product-id> API_BASE=http://localhost:8080/api ./test/cross_user_cart.sh

set -euo pipefail

API_BASE=${API_BASE:-http://localhost:8080/api}
PRODUCT_ID=${PRODUCT_ID:?Please set PRODUCT_ID environment variable to an existing product id}

TMPDIR=$(mktemp -d)
COOK1=$TMPDIR/cookie_user1.txt
COOK2=$TMPDIR/cookie_user2.txt

timestamp=$(date +%s)
EMAIL1="test1-${timestamp}+1@gmail.com"
EMAIL2="test2-${timestamp}+2@gmail.com"
PASS="Password123!"

echo "API_BASE=$API_BASE"
echo "PRODUCT_ID=$PRODUCT_ID"

echo "Signing up user1: $EMAIL1"
http_code=$(curl -s -w "%{http_code}" -o $TMPDIR/signup1.json -X POST -H "Content-Type: application/json" -c $COOK1 -d "{\"email\":\"$EMAIL1\",\"password\":\"$PASS\"}" $API_BASE/auth/signup)
if [ "$http_code" -ge 400 ]; then cat $TMPDIR/signup1.json; echo "user1 signup failed (status $http_code)"; exit 2; fi

echo "Signing up user2: $EMAIL2"
http_code=$(curl -s -w "%{http_code}" -o $TMPDIR/signup2.json -X POST -H "Content-Type: application/json" -c $COOK2 -d "{\"email\":\"$EMAIL2\",\"password\":\"$PASS\"}" $API_BASE/auth/signup)
if [ "$http_code" -ge 400 ]; then cat $TMPDIR/signup2.json; echo "user2 signup failed (status $http_code)"; exit 2; fi

echo "User1 adds product to their cart"
http_code=$(curl -s -w "%{http_code}" -o $TMPDIR/add.json -X POST -H "Content-Type: application/json" -b $COOK1 -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":1}" $API_BASE/cart/items)
if [ "$http_code" -ne 201 ]; then cat $TMPDIR/add.json; echo "failed to add cart item as user1 (status $http_code)"; exit 2; fi
item_id=$(jq -r '.id' $TMPDIR/add.json)
if [ -z "$item_id" ] || [ "$item_id" = "null" ]; then echo "Could not determine cart item id"; cat $TMPDIR/add.json; exit 2; fi
echo "Created cart item id: $item_id"

echo "User2 attempts to update user1's cart item (should be 403)"
http_code=$(curl -s -w "%{http_code}" -o $TMPDIR/up.json -X PATCH -H "Content-Type: application/json" -b $COOK2 -d '{"quantity":2}' $API_BASE/cart/items/$item_id)
if [ "$http_code" -eq 403 ]; then echo "PASS: update blocked with 403"; else echo "FAIL: update returned status $http_code"; cat $TMPDIR/up.json; exit 3; fi

echo "User2 attempts to delete user1's cart item (should be 403)"
http_code=$(curl -s -w "%{http_code}" -o $TMPDIR/del.json -X DELETE -b $COOK2 $API_BASE/cart/items/$item_id)
if [ "$http_code" -eq 403 ]; then echo "PASS: delete blocked with 403"; else echo "FAIL: delete returned status $http_code"; cat $TMPDIR/del.json; exit 4; fi

echo "Test completed: cross-user cart protections are working"
exit 0
