import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, searchUsers } from "../controllers/friend.controller.js";

const router = express.Router();

// Search users by name
router.get("/search/:name", protectRoute, searchUsers);

// Send a friend request
router.post("/send-request/:id", protectRoute, sendFriendRequest);

// Accept a friend request
router.put("/accept-request/:id", protectRoute, acceptFriendRequest);

// Reject a friend request
router.put("/reject-request/:id", protectRoute, rejectFriendRequest);

export default router;
