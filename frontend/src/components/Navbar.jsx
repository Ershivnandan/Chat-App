import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore"; // Import the store
import { LogOut, MessageSquare, Settings, User, Bell, Search } from "lucide-react";
import { useState, useEffect } from "react";

const Navbar = () => {
  const { logout, authUser, filteredUsers, searchUsers, notifications, addNotification, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } = useAuthStore((state) => state);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSendFriendRequest = (reciverId) =>{
    console.log(reciverId)
    sendFriendRequest(reciverId)
  }


  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      searchUsers(searchTerm); 
    }, 500); 

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, searchUsers]);


  const toggleNotifications = () => setShowNotifications(!showNotifications);

  const isFriend = (userId) => {
    return authUser?.friends?.includes(userId);
  };

  const renderNotifications = () => {
    return notifications.map((notif, index) => (
      <li key={index} className="flex justify-between items-center p-2">
        <span className="text-sm">{notif.message}</span>
        <div>
        <button className="btn btn-xs btn-primary bg-green-500" onClick={() => handleNotificationClick(notif, "accept")}>
          Accept
        </button>
        <button className="btn btn-xs btn-primary bg-red-500" onClick={() => handleNotificationClick(notif, "reject")}>
          Reject
        </button>
        </div>
      </li>
    ));
  };

  const handleNotificationClick = (notif, statusType) => {
    
    switch (statusType) {
      case "accept":
        acceptFriendRequest(notif.senderId)
        break;
      case "reject":
        rejectFriendRequest(notif.senderId);
        break;
    
      default:
        break;
    }

    addNotification(notif.id);
  };

  return (
    <header className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg bg-base-100/80">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Chatty</h1>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search friends..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered input-sm w-48"
              />
              <Search className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-500" />
            </div>

            {/* Display filtered users as a list */}
            {filteredUsers && filteredUsers.length > 0 && (
              <div className="absolute top-16 left-0 w-48  border border-base-300 shadow-lg rounded-md mt-2">
                <ul>
                  {filteredUsers.map((user) => (
                    <li key={user._id} className="p-2">
                      <div className="flex items-center justify-between">
                        <span>{user.fullName}</span>
                        {/* Conditionally show the "Send Request" button */}
                        {!isFriend(user._id) ? (
                          <button className="btn btn-xs btn-primary" onClick={()=> handleSendFriendRequest(user._id)}>Send Request</button>
                        ) : (
                          <button className="btn btn-xs btn-disabled" disabled>
                            Friend
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notifications */}
            <button onClick={toggleNotifications} className="relative">
              <Bell className="w-5 h-5 text-primary" />
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {notifications.length}
              </span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 p-2 bg-white border border-base-300 shadow-lg rounded-md w-64">
                <ul className="space-y-2">
                  {renderNotifications()}
                  {notifications.length === 0 && <li>No new notifications</li>}
                </ul>
              </div>
            )}

            <Link to={"/settings"} className="btn btn-sm gap-2 transition-colors">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link to={"/profile"} className="btn btn-sm gap-2">
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button className="flex gap-2 items-center" onClick={logout}>
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
