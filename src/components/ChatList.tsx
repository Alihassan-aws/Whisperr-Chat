import React from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Chat } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";

interface ChatListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onChatSelect: (
    chatId: string,
    otherUserId: string,
    otherUserName: string,
  ) => void;
  loading: boolean;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChatId,
  onChatSelect,
  loading,
}) => {
  const { userProfile } = useAuth();

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
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
  };

  const getOtherUser = (chat: Chat) => {
    const otherUserId = chat.participants.find((id) => id !== userProfile?.uid);
    const otherUserName = otherUserId ? chat.participantNames[otherUserId] : "";
    const otherUserAvatar = otherUserId
      ? chat.participantAvatars?.[otherUserId]
      : "";
    return { otherUserId, otherUserName, otherUserAvatar };
  };

  const getUnreadCount = (chat: Chat): number => {
    if (!userProfile?.uid) return 0;
    return chat.unreadCount?.[userProfile.uid] || 0;
  };

  const getLastMessageStatus = (chat: Chat) => {
    if (chat.lastMessageSender !== userProfile?.uid) return null;

    // This is a simplified version - in a real app you'd need to check the actual message
    // For now, we'll show delivered if it's not the current user's message
    return <CheckCheck className="h-3 w-3 text-gray-400" />;
  };

  const getTypingIndicator = (chat: Chat): string | null => {
    if (!chat.typingUsers) return null;

    const typingUserIds = Object.entries(chat.typingUsers)
      .filter(([uid, timestamp]) => {
        if (uid === userProfile?.uid) return false;
        const now = new Date();
        const typingTime = timestamp.toDate();
        return now.getTime() - typingTime.getTime() < 3000; // 3 seconds
      })
      .map(([uid]) => uid);

    if (typingUserIds.length === 0) return null;

    const typingNames = typingUserIds
      .map((uid) => chat.participantNames[uid])
      .join(", ");
    return `${typingNames} ${typingUserIds.length === 1 ? "is" : "are"} typing...`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading chats...</div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-gray-500">
          <p className="text-sm">No chats yet</p>
          <p className="text-xs mt-1">
            Start a conversation using the + button
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 hide-scrollbar">
      <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
        {chats.map((chat, index) => {
          const { otherUserId, otherUserName, otherUserAvatar } =
            getOtherUser(chat);
          const isSelected = selectedChatId === chat.id;
          const unreadCount = getUnreadCount(chat);
          const typingIndicator = getTypingIndicator(chat);

          return (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() =>
                otherUserId && onChatSelect(chat.id, otherUserId, otherUserName)
              }
              className={cn(
                "flex items-center gap-3 p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 cursor-pointer transition-all duration-200",
                "border-l-4 border-transparent hover:border-whatsapp-green-400",
                isSelected &&
                  "bg-whatsapp-green-50 dark:bg-whatsapp-green-900/10 border-l-whatsapp-green-500",
              )}
            >
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-gray-200 dark:ring-gray-700">
                  <AvatarImage src={otherUserAvatar} />
                  <AvatarFallback className="bg-gradient-to-br from-whatsapp-green-500 to-whatsapp-green-600 text-white font-medium">
                    {otherUserName?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>

                {/* Online indicator */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3
                    className={cn(
                      "font-medium truncate",
                      unreadCount > 0
                        ? "text-gray-900 dark:text-gray-100 font-semibold"
                        : "text-gray-700 dark:text-gray-300",
                    )}
                  >
                    {otherUserName || "Unknown User"}
                  </h3>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(chat.lastMessageTime)}
                    </span>

                    {unreadCount > 0 && (
                      <Badge
                        variant="default"
                        className="bg-whatsapp-green-500 hover:bg-whatsapp-green-600 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {chat.lastMessageSender === userProfile?.uid &&
                    getLastMessageStatus(chat)}

                  <p
                    className={cn(
                      "text-sm truncate flex-1",
                      typingIndicator
                        ? "text-whatsapp-green-600 dark:text-whatsapp-green-400 italic"
                        : unreadCount > 0
                          ? "text-gray-900 dark:text-gray-100 font-medium"
                          : "text-gray-600 dark:text-gray-400",
                    )}
                  >
                    {typingIndicator || (
                      <>
                        {chat.lastMessageSender === userProfile?.uid &&
                          !typingIndicator &&
                          "You: "}
                        {chat.lastMessage}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
