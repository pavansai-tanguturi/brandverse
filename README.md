# Brandverse E-commerce Platform

A full-stack e-commerce platform with React frontend and Node.js backend, featuring Razorpay payment integration.

## Features

- 🛍️ Product catalog with categories
- 🛒 Shopping cart management
- 👤 User authentication (OTP-based)
- 📍 Address management
- 💳 Razorpay payment integration
- 📊 Admin dashboard
- 📱 Responsive design

## Tech Stack

### Frontend
- React 19
- React Router
- Tailwind CSS
- Context API for state management

### Backend
- Node.js & Express
- Supabase (PostgreSQL)
- Razorpay Payment Gateway
- Session-based authentication

## Deployment

### Environment Variables

Create `.env` files in both frontend and backend directories:

#### Backend (.env)
```
PORT=3001
SESSION_SECRET=your_session_secret
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
PRODUCT_IMAGES_BUCKET=product-images
FRONTEND_URL=your_frontend_url
ADMIN_ID=your_admin_id
ADMIN_EMAIL=your_admin_email
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

#### Frontend (.env)
```
REACT_APP_API_BASE=your_backend_url
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

### Deploy Backend Separately (Railway/Render)

1. Push code to GitHub
2. Connect your repository to Railway/Render
3. Set environment variables
4. Deploy

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   cd blink/backend && npm install
   cd ../frontend && npm install
   ```
3. Set up environment variables
4. Start backend: `npm start` (from backend directory)
5. Start frontend: `npm start` (from frontend directory)

## API Endpoints

- `GET/POST /api/products` - Product management
- `GET/POST /api/cart` - Cart operations
- `GET/POST /api/addresses` - Address management
- `POST /api/orders` - Order creation
- `POST /api/orders/confirm-payment` - Payment confirmation
- `POST /api/auth/login` - User authentication

## License

MIT License
