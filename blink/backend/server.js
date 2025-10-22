import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import authRoutes from "./src/routes/auth.js";
import productRoutes from "./src/routes/products.js";
import cartRoutes from "./src/routes/cart.js";
import orderRoutes from "./src/routes/orders.js";
import adminRoutes from "./src/routes/admin.js";
import customerRoutes from "./src/routes/customers.js";
import adminCartRoutes from "./src/routes/adminCart.js";
import categoryRoutes from "./src/routes/categories.js";
import analyticsRoutes from "./src/routes/analytics.js";
import adminCustomerRoutes from "./src/routes/adminCustomers.js";
import deliveryRoutes from "./src/routes/delivery.js";
import addressRoutes from "./src/routes/addresses.js";
import uploadRoutes from "./src/routes/upload.js";
import bannersRoutes from "./src/routes/banners.js";

dotenv.config();

const app = express();

// Serve uploaded images statically
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "blink", "backend", "uploads")),
);

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://brandverse.onrender.com",
  "https://heartfelt-lily-3bb33d.netlify.app",
  "https://akepatimart.com",
  "https://akepati-mart.vercel.app",
  process.env.DEPLOYMENT_URL,
  process.env.FRONTEND_URL,
  process.env.SUPABASE_URL,
].filter(Boolean);

console.log("Allowed origins:", allowedOrigins);
console.log("FRONTEND_URL from env:", process.env.FRONTEND_URL);

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("CORS request from origin:", origin);
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        console.log("CORS allowed for origin:", origin);
        callback(null, true);
      } else {
        console.log("CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
    ],
    optionsSuccessStatus: 200,
  }),
);

// Ensure preflight requests are handled
app.options(
  "*",
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
    ],
    optionsSuccessStatus: 200,
  }),
);

// Middleware
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // For JWT cookies
app.set("trust proxy", 1);

// Simple request logging
app.use((req, res, next) => {
  if (req.path.includes("/admin") || req.path.includes("/auth")) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log("Cookies:", req.cookies);
    console.log("Authorization header:", req.headers.authorization);
  }
  next();
});

// Routes
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    auth: "JWT",
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Debug endpoint
app.get("/api/debug/auth", (req, res) => {
  res.json({
    cookies: req.cookies,
    authHeader: req.headers.authorization,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/admin", adminCartRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/admin/customers", adminCustomerRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/banners", bannersRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Auth method: JWT (No sessions)`);
  console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
});
