import express from "express";
import {
  getDashboardAnalytics,
  exportAnalytics,
} from "../controllers/analyticsController.js";
import { adminAuth } from "../controllers/authController.js";

const router = express.Router();

// Protect analytics endpoints with adminAuth (JWT)
router.get("/dashboard", adminAuth, getDashboardAnalytics);
router.get("/export", adminAuth, exportAnalytics);

export default router;
