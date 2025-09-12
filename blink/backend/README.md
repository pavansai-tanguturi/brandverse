# Backend README — Blink (Express + Supabase)

This README covers running the backend locally and enabling CI (GitHub Actions) for this repository.

Quick start

1. Install dependencies

```bash
cd backend
npm ci
```

2. Create a `.env` file with at least:

- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_KEY
- SESSION_SECRET
- PRODUCT_IMAGES_BUCKET
- AUTH_U, AUTH_P, ADMIN_ID, ADMIN_EMAIL (for admin login)

3. Run the API in development

```bash
npm run dev
```

Integration tests

- `test/cross_user_cart.sh` and `test/profile_integration.sh` are integration scripts that exercise cart ownership protections and profile flows.
- Use `API_BASE` env var to point tests at a running server, e.g.:

```bash
API_BASE=http://localhost:3001/api ./test/profile_integration.sh
```

CI (GitHub Actions)

A workflow is included at `.github/workflows/ci.yml`. It runs unit tests on push/PR, and has an optional `integration` job which runs the integration scripts if the following repository secrets are present:

- SUPABASE_URL — your Supabase project URL
- SUPABASE_SERVICE_KEY — service role key for Supabase (keep secure)
- PRODUCT_IMAGES_BUCKET — storage bucket name used for images
- SESSION_SECRET — session cookie secret
- AUTH_U, AUTH_P, ADMIN_ID, ADMIN_EMAIL — admin credentials used by tests

To enable integration tests in CI:

1. Go to GitHub → Settings → Secrets → Actions
2. Add the secrets listed above
3. The integration job will run automatically on push/PR when secrets are set

Security note
- Use a throwaway/test Supabase project for CI. Don't expose production service role keys in CI.

Need help enabling CI or creating a test Supabase project? I can add step-by-step instructions or a script that provisions a temporary test project (if you want me to proceed, say so).
