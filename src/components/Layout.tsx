import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RealTimeChatList } from "./RealTimeChatList";
import { ChatView } from "./ChatView";
import { SettingsPage } from "./SettingsPage";
import { UserSearchModal } from "./UserSearchModal";
import { Sidebar } from "./Sidebar";
import { generateChatId } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type View = "chats" | "settings";

const layoutVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.05,
    },
  },
};

const sidebarVariants = {
  hidden: { x: -100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
};

const contentVariants = {
  hidden: { x: 100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
};

const useSwipeBack = (element: HTMLElement | null, onSwipeLeft: () => void) => {
  useEffect(() => {
    if (!element) return;

    let startX = 0;
    const threshold = 50;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      if (startX - endX > threshold) onSwipeLeft();
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [element, onSwipeLeft]);
};

export const Layout: React.FC = () => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [currentView, setCurrentView] = useState<View>("chats");
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const { userProfile } = useAuth();
  const layoutRef = useRef<HTMLDivElement>(null);

  const handleChatSelect = useCallback(
    (chatId: string, otherUserId: string, otherUserName: string) => {
      setSelectedChatId(chatId);
      setSelectedUserId(otherUserId);
      setSelectedUserName(otherUserName);
    },
    [],
  );

  const handleUserSelect = useCallback(
    (userId: string, username: string) => {
      if (!userProfile) return;

      const chatId = generateChatId(userProfile.uid, userId);
      setSelectedChatId(chatId);
      setSelectedUserId(userId);
      setSelectedUserName(username);
      setShowUserSearch(false);
    },
    [userProfile],
  );

  const handleBackToChats = useCallback(() => {
    setSelectedChatId(null);
    setSelectedUserId(null);
    setSelectedUserName("");
  }, []);

  const handleViewChange = useCallback(
    (view: View) => {
      setCurrentView(view);
      if (view === "chats") {
        handleBackToChats();
      }
    },
    [handleBackToChats],
  );

  const handleCloseUserSearch = useCallback(() => {
    setShowUserSearch(false);
  }, []);

  const handleUnreadCountChange = useCallback((count: number) => {
    setTotalUnreadCount(count);
  }, []);

  useSwipeBack(layoutRef.current, handleBackToChats);

  const welcomeScreen = useMemo(
    () => (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800 relative overflow-hidden"
      >
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl" />
        </div>

        <div className="relative text-center text-slate-500 dark:text-slate-400 max-w-md mx-auto p-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="relative mb-8"
          >
            <div className="relative p-6 bg-gradient-to-r from-blue-100/50 to-purple-100/50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full backdrop-blur-sm">
              <svg
                className="h-16 w-16 text-blue-600 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <h2 className="text-4xl font-bold text-[#132556] dark:text-white mb-3">
              Welcome to Whisperr
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Select a conversation to start messaging
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              or use search to find friends
            </p>
          </motion.div>
        </div>
      </motion.div>
    ),
    [],
  );

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error("Layout error:", error);
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (currentView === "settings") {
    return <SettingsPage onBack={() => handleViewChange("chats")} />;
  }

  return (
    <motion.div
      ref={layoutRef}
      variants={layoutVariants}
      initial="hidden"
      animate="visible"
      className="h-screen flex bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 overflow-hidden"
    >
      {/* Desktop Sidebar */}
      <motion.div
        variants={sidebarVariants}
        className="hidden md:flex md:w-80 lg:w-96 flex-col bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 shadow-sm"
      >
        <Sidebar
          onViewChange={handleViewChange}
          currentView={currentView}
          totalUnread={totalUnreadCount}
          onUserSelect={handleUserSelect}
        />
        <RealTimeChatList
          selectedChatId={selectedChatId}
          onChatSelect={handleChatSelect}
          onUnreadCountChange={handleUnreadCountChange}
        />
      </motion.div>

      {/* Mobile Chat List */}
      <motion.div
        className={cn(
          "md:hidden flex flex-col w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl",
          selectedChatId && "hidden",
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Sidebar
          onViewChange={handleViewChange}
          currentView={currentView}
          totalUnread={totalUnreadCount}
          onUserSelect={handleUserSelect}
        />
        <RealTimeChatList
          selectedChatId={selectedChatId}
          onChatSelect={handleChatSelect}
          onUnreadCountChange={handleUnreadCountChange}
        />
      </motion.div>

      {/* Chat View */}
      <motion.div
        variants={contentVariants}
        className={cn(
          "flex-1 flex flex-col min-w-0 relative",
          !selectedChatId && "hidden md:flex",
        )}
      >
        <AnimatePresence mode="wait">
          {selectedChatId && selectedUserId ? (
            <ChatView
              key={selectedChatId}
              chatId={selectedChatId}
              otherUserId={selectedUserId}
              otherUserName={selectedUserName}
              onBack={handleBackToChats}
            />
          ) : (
            welcomeScreen
          )}
        </AnimatePresence>
      </motion.div>

      {/* User Search Modal */}
      <UserSearchModal
        open={showUserSearch}
        onClose={handleCloseUserSearch}
        onSelectUser={handleUserSelect}
      />
    </motion.div>
  );
};