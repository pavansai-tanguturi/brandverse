#!/usr/bin/env bash
set -e
echo "Running authController.admin.test.mjs"
node test/authController.admin.test.mjs

echo "Running authController.me.test.mjs"
node test/authController.me.test.mjs

echo "Running authController.logout.test.mjs"
node test/authController.logout.test.mjs

echo "All tests passed"
