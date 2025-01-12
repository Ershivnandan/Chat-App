import User from "../models/user.model.js";
import FriendRequest from "../models/friend.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Search users by name (excluding logged-in user)
export const searchUsers = async (req, res) => {
  const { name } = req.params;

  console.log(name)
  const loggedInUserId = req.user._id;
  try {
    const users = await User.find({
      fullName: { $regex: name, $options: "i" },
      _id: { $ne: loggedInUserId },
    }).select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.log("Error in searchUsers", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Send a friend request
// Send a friend request
export const sendFriendRequest = async (req, res) => {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
  
    try {
      const existingRequest = await FriendRequest.findOne({ senderId, receiverId });
  
      if (existingRequest) {
        return res.status(400).json({ message: "Request already sent" });
      }
  
      const newRequest = new FriendRequest({ senderId, receiverId });
      await newRequest.save();
  
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("friendRequestReceived", { senderId, receiverId });
      }
  
      res.status(201).json(newRequest);
    } catch (error) {
      console.log("Error in sendFriendRequest", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  

// Accept a friend request
export const acceptFriendRequest = async (req, res) => {
    const { id: requestId } = req.params;
  
    try {
      const request = await FriendRequest.findById(requestId);
  
      if (!request || request.status !== "pending") {
        return res.status(400).json({ message: "Invalid request" });
      }
  
      request.status = "accepted";
      await request.save();
  
      // Add users as friends (you can create a "friends" array in the User model)
      const sender = await User.findById(request.senderId);
      const receiver = await User.findById(request.receiverId);
  
      sender.friends.push(receiver._id);
      receiver.friends.push(sender._id);
  
      await sender.save();
      await receiver.save();
  
      // Clean up notifications related to the friend request
      await Notification.deleteOne({ senderId: request.senderId, receiverId: request.receiverId, type: 'friendRequest' });
  
      // Emit the friendRequestAccepted event for real-time updates
      const receiverSocketId = getReceiverSocketId(receiver._id);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("friendRequestAccepted", { senderId: sender._id, receiverId: receiver._id });
      }
  
      res.status(200).json({ message: "Friend request accepted" });
    } catch (error) {
      console.log("Error in acceptFriendRequest", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
// Reject a friend request
export const rejectFriendRequest = async (req, res) => {
  const { id: requestId } = req.params;

  try {
    const request = await FriendRequest.findById(requestId);

    if (!request || request.status !== "pending") {
      return res.status(400).json({ message: "Invalid request" });
    }

    request.status = "rejected";
    await request.save();

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.log("Error in rejectFriendRequest", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
