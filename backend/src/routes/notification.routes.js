import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getNotifications } from "../controllers/notification.controller.js";


const router = express.Router();

router.get('/notifications', protectRoute, getNotifications);

export default router;
