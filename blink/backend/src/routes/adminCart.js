import express from "express";
import {
  adminAddItem,
  adminRemoveItem,
} from "../controllers/adminCartController.js";
import { adminAuth } from "../controllers/authController.js";

const router = express.Router();

// Protect all admin cart endpoints with adminAuth (JWT)
router.post("/cart/items", adminAuth, adminAddItem);
router.delete("/cart/items/:id", adminAuth, adminRemoveItem);

export default router;
