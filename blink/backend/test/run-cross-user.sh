#!/usr/bin/env bash
set -euo pipefail
API_BASE=${API_BASE:-http://localhost:8080/api}
echo "Using API_BASE=$API_BASE"
products=$(curl -sSf "$API_BASE/products")
pid=$(echo "$products" | jq -r '.[0].id // empty')
if [ -z "$pid" ]; then echo "ERROR: no product id found"; exit 2; fi
echo "Found product id: $pid"
PRODUCT_ID=$pid API_BASE=$API_BASE ./test/cross_user_cart.sh
