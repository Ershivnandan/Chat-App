/* eslint-disable no-unused-vars */
import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  searchUsers: async (searchTerm) => {
    if (searchTerm.trim() !== "") {
      try {
        const res = await axiosInstance.get(`/friend/search/${searchTerm}`);
        const data = res.data
        set({ filteredUsers: data });
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    } else {
      set({ filteredUsers: [] });
    }
  },

  sendFriendRequest: async (receiverId) => {
    try {
      const { authUser, socket } = get();
      const res = await axiosInstance.post(`/friend/send-request/${receiverId}`);
      toast.success("Friend request sent successfully.");
  
      // Emit event to notify the recipient in real-time
      if (socket?.connected) {
        socket.emit("friendRequestSent", {
          senderId: authUser._id,
          receiverId,
        });
      }
    } catch (error) {
      toast.error("Error sending friend request.", error.message);
    }
  },  

  acceptFriendRequest: async (senderId) => {
    try {
      const { authUser, socket } = get();
      const res = await axiosInstance.post(`/friend/accept-request/${senderId}`);
      toast.success("Friend request accepted.");
  
      // Emit event to notify the sender
      if (socket?.connected) {
        socket.emit("friendRequestAccepted", {
          senderId,
          receiverId: authUser._id,
        });
      }
    } catch (error) {
      toast.error("Error accepting friend request.");
    }
  },

  rejectFriendRequest: async (senderId) => {
    try {
      const { authUser, socket } = get();
      const res = await axiosInstance.post(`/friend/reject-request/${senderId}`);
      toast.success("Friend request rejected.");
  
      // Emit event to notify the sender
      if (socket?.connected) {
        socket.emit("friendRequestRejected", {
          senderId,
          receiverId: authUser._id,
        });
      }
    } catch (error) {
      toast.error("Error rejecting friend request.");
    }
  },
  

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
