import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Chat, deleteChat, getTotalUnreadCount } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useChats } from "@/hooks/useChats";
import { cn } from "@/lib/utils";
import {
  Check,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  MessageCircle,
  Trash2,
  Pin,
  VolumeX,
  Archive,
  Sparkles,
  Clock,
  Zap,
  Loader2,
} from "lucide-react";

interface RealTimeChatListProps {
  selectedChatId: string | null;
  onChatSelect: (
    chatId: string,
    otherUserId: string,
    otherUserName: string,
  ) => void;
  onUnreadCountChange?: (count: number) => void;
}

const SkeletonLoader = () => (
  <div className="space-y-2 p-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3">
        <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />
        </div>
        <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
    ))}
  </div>
);

export const RealTimeChatList: React.FC<RealTimeChatListProps> = ({
  selectedChatId,
  onChatSelect,
  onUnreadCountChange,
}) => {
  const { chats, loading, error, retry } = useChats();
  const { userProfile } = useAuth();
  const chatListRef = useRef<HTMLDivElement>(null);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [longPressActive, setLongPressActive] = useState(false);

  // Calculate and report total unread count
  useEffect(() => {
    if (userProfile && onUnreadCountChange) {
      const totalUnread = getTotalUnreadCount(chats, userProfile.uid);
      onUnreadCountChange(totalUnread);
    }
  }, [chats, userProfile, onUnreadCountChange]);

  const formatTime = useCallback((timestamp: any) => {
    if (!timestamp) return "";

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffTime = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) {
        return "now";
      } else if (diffMinutes < 60) {
        return `${diffMinutes}m`;
      } else if (diffHours < 24) {
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      } else if (diffDays === 1) {
        return "Yesterday";
      } else if (diffDays < 7) {
        return date.toLocaleDateString("en-US", { weekday: "short" });
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
    } catch (error) {
      return "";
    }
  }, []);

  const getOtherUser = useCallback(
    (chat: Chat) => {
      if (!userProfile)
        return { otherUserId: "", otherUserName: "", otherUserAvatar: "" };

      const otherUserId = chat.participants.find(
        (id) => id !== userProfile.uid,
      );
      const otherUserName = otherUserId
        ? chat.participantNames[otherUserId] || "Unknown User"
        : "";
      const otherUserAvatar = otherUserId
        ? chat.participantAvatars?.[otherUserId] || ""
        : "";
      return { otherUserId: otherUserId || "", otherUserName, otherUserAvatar };
    },
    [userProfile],
  );

  const getUnreadCount = useCallback(
    (chat: Chat): number => {
      if (!userProfile?.uid) return 0;
      return chat.unreadCount?.[userProfile.uid] || 0;
    },
    [userProfile?.uid],
  );

  const getLastMessageStatus = useCallback(
    (chat: Chat) => {
      if (!userProfile || chat.lastMessageSender !== userProfile.uid)
        return null;
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <CheckCheck className="h-3 w-3 text-blue-500" />
        </motion.div>
      );
    },
    [userProfile],
  );

  const getTypingIndicator = useCallback(
    (chat: Chat): string | null => {
      if (!chat.typingUsers || !userProfile) return null;

      try {
        const typingUserIds = Object.entries(chat.typingUsers)
          .filter(([uid, timestamp]) => {
            if (uid === userProfile.uid) return false;
            const now = new Date();
            const typingTime = timestamp.toDate();
            return now.getTime() - typingTime.getTime() < 3000;
          })
          .map(([uid]) => uid);

        if (typingUserIds.length === 0) return null;

        const typingNames = typingUserIds
          .map((uid) => chat.participantNames[uid] || "Someone")
          .join(", ");
        return `${typingNames} ${typingUserIds.length === 1 ? "is" : "are"} typing...`;
      } catch (error) {
        return null;
      }
    },
    [userProfile],
  );

  const handleTouchStart = useCallback((chatId: string) => {
    const timer = setTimeout(() => {
      setLongPressActive(true);
      setChatToDelete(chatId);
      if ("navigator" in window && "vibrate" in navigator) {
        navigator.vibrate(100);
      }
    }, 500);

    setLongPressTimer(timer);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setLongPressActive(false);
  }, [longPressTimer]);

  const handleDeleteChat = useCallback(async () => {
    if (!chatToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteChat(chatToDelete);
      setChatToDelete(null);
    } catch (error) {
      console.error("Error deleting chat:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [chatToDelete, isDeleting]);

  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm mx-auto"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-red-500 rounded-full blur-lg opacity-20" />
            <div className="relative p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Connection Issue
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            {error}
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={retry}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return <SkeletonLoader />;
  }

  if (chats.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-slate-500 max-w-sm mx-auto"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-20" />
            <div className="relative p-6 bg-blue-50 dark:bg-blue-900/30 rounded-full">
              <MessageCircle className="h-16 w-16 text-blue-500 mx-auto" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-3">
            No conversations yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            Start a conversation using the search icon
          </p>
          <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
            <Sparkles className="h-3 w-3" />
            <span>A test chat will be created automatically</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="flex-1 hide-scrollbar" ref={chatListRef}>
        <div className="p-2">
          <AnimatePresence>
            {chats.map((chat, index) => {
              const { otherUserId, otherUserName, otherUserAvatar } =
                getOtherUser(chat);
              const isSelected = selectedChatId === chat.id;
              const unreadCount = getUnreadCount(chat);
              const typingIndicator = getTypingIndicator(chat);

              if (!otherUserId) return null;

              return (
                <ContextMenu key={chat.id}>
                  <ContextMenuTrigger asChild>
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, scale: 0.95 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                      onClick={() =>
                        onChatSelect(chat.id, otherUserId, otherUserName)
                      }
                      onTouchStart={() => handleTouchStart(chat.id)}
                      onTouchEnd={handleTouchEnd}
                      onTouchCancel={handleTouchEnd}
                      className={cn(
                        "relative flex items-center gap-3 p-3 m-1 rounded-2xl cursor-pointer transition-all duration-200 group",
                        "hover:bg-slate-50 dark:hover:bg-slate-700/50 active:scale-[0.98]",
                        isSelected &&
                          "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 shadow-lg shadow-blue-500/10",
                        longPressActive &&
                          "bg-red-50 dark:bg-red-900/20 scale-95",
                      )}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <motion.div
                          layoutId="selectedChat"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-r-full"
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}

                      <div className="relative flex-shrink-0">
                        <Avatar className="h-12 w-12 ring-2 ring-slate-200 dark:ring-slate-600 transition-all duration-200 group-hover:ring-blue-300 dark:group-hover:ring-blue-600">
                          <AvatarImage src={otherUserAvatar} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold text-sm">
                            {otherUserName?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>

                        {/* Enhanced Online indicator */}
                        <motion.div
                          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />

                        {/* Typing indicator overlay */}
                        {typingIndicator && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -left-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                          >
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="w-2 h-2 bg-white rounded-full"
                            />
                          </motion.div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3
                            className={cn(
                              "font-semibold truncate transition-colors duration-200",
                              unreadCount > 0
                                ? "text-slate-900 dark:text-slate-100"
                                : "text-slate-700 dark:text-slate-300",
                            )}
                          >
                            {otherUserName}
                          </h3>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className={cn(
                                "text-xs transition-colors duration-200",
                                unreadCount > 0
                                  ? "text-blue-600 dark:text-blue-400 font-medium"
                                  : "text-slate-500 dark:text-slate-400",
                              )}
                            >
                              <Clock className="h-3 w-3 inline mr-1" />
                              {formatTime(chat.lastMessageTime)}
                            </span>

                            <AnimatePresence>
                              {unreadCount > 0 && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 180 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 30,
                                  }}
                                >
                                  <Badge
                                    variant="default"
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center shadow-lg"
                                  >
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                  </Badge>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {chat.lastMessageSender === userProfile?.uid &&
                            getLastMessageStatus(chat)}

                          <p
                            className={cn(
                              "text-sm truncate flex-1 transition-colors duration-200",
                              typingIndicator
                                ? "text-blue-600 dark:text-blue-400 italic font-medium"
                                : unreadCount > 0
                                  ? "text-slate-800 dark:text-slate-200 font-medium"
                                  : "text-slate-500 dark:text-slate-400",
                            )}
                          >
                            <AnimatePresence mode="wait">
                              {typingIndicator ? (
                                <motion.span
                                  key="typing"
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5 }}
                                  className="flex items-center gap-1"
                                >
                                  <Zap className="h-3 w-3" />
                                  {typingIndicator}
                                </motion.span>
                              ) : (
                                <motion.span
                                  key="message"
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5 }}
                                >
                                  {chat.lastMessageSender ===
                                    userProfile?.uid && "You: "}
                                  {chat.lastMessage}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </p>
                        </div>
                      </div>

                      {/* Hover effect overlay */}
                      <motion.div
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        layoutId={`hover-${chat.id}`}
                      />
                    </motion.div>
                  </ContextMenuTrigger>

                  <ContextMenuContent className="w-56 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-xl">
                    <ContextMenuItem className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <Pin className="h-4 w-4" />
                      Pin Chat
                    </ContextMenuItem>
                    <ContextMenuItem className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <VolumeX className="h-4 w-4" />
                      Mute Notifications
                    </ContextMenuItem>
                    <ContextMenuItem className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <Archive className="h-4 w-4" />
                      Archive Chat
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => setChatToDelete(chat.id)}
                      className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Chat
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Enhanced Delete confirmation dialog */}
      <AlertDialog
        open={!!chatToDelete}
        onOpenChange={() => setChatToDelete(null)}
      >
        <AlertDialogContent className="w-[90vw] max-w-md mx-auto bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle className="text-lg">
                Delete Chat?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-300">
              This action cannot be undone. This will permanently delete the
              chat and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChat}
              disabled={isDeleting}
              className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};