/* eslint-disable no-unused-vars */
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  pendingRequests: [], // For storing incoming friend requests
  isUsersLoading: false,
  isMessagesLoading: false,

  // Get the list of friends for sidebar (filtered)
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const { authUser } = useAuthStore.getState();
      const res = await axiosInstance.get("/messages/users");
      // Filter users to show only friends
      const friends = res.data.filter(user => user.friends.includes(authUser._id));
      set({ users: friends });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Get messages with selected user
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Send a message to the selected user
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  // Subscribe to messages for real-time updates
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });

    // Listen for friend request notifications
    socket.on("friendRequestSent", (data) => {
      toast.success(`You have a new friend request from ${data.senderId}`);
      // Optionally, update the pending requests list
      set((state) => ({
        pendingRequests: [...state.pendingRequests, data],
      }));
    });

    socket.on("friendRequestAccepted", (data) => {
      toast.success(`You are now friends with ${data.senderId}`);
      // Remove the accepted request from pending list and update friends list
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((request) => request.senderId !== data.senderId),
      }));
      get().getUsers(); // Update users/friends list
    });

    socket.on("friendRequestRejected", (data) => {
      toast.error(`Your friend request to ${data.senderId} was rejected.`);
      // Remove the rejected request from pending list
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((request) => request.senderId !== data.senderId),
      }));
    });
  },

  // Unsubscribe from messages when no longer needed
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("friendRequestSent");
    socket.off("friendRequestAccepted");
    socket.off("friendRequestRejected");
  },

  // Set the selected user for messaging
  setSelectedUser: (selectedUser) => set({ selectedUser }),

  // Handle sending friend requests
  sendFriendRequest: async (receiverId) => {
    try {
      const { authUser, socket } = get();
      const res = await axiosInstance.post(`/friend-request/send/${receiverId}`);
      toast.success("Friend request sent successfully.");

      // Emit event to notify the recipient in real-time
      if (socket?.connected) {
        socket.emit("friendRequestSent", {
          senderId: authUser._id,
          receiverId,
        });
      }
    } catch (error) {
      toast.error("Error sending friend request.");
    }
  },

  // Handle accepting friend requests
  acceptFriendRequest: async (senderId) => {
    try {
      const { authUser, socket } = get();
      const res = await axiosInstance.post(`/friend-request/accept/${senderId}`);
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

  // Handle rejecting friend requests
  rejectFriendRequest: async (senderId) => {
    try {
      const { authUser, socket } = get();
      const res = await axiosInstance.post(`/friend-request/reject/${senderId}`);
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
}));
