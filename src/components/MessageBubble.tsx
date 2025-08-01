import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Message, deleteMessage, getMessageReadStatus } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Trash2,
  Check,
  CheckCheck,
  Copy,
  Reply,
  Forward,
  Heart,
  Smile,
  Clock,
  Zap,
} from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  chatId: string;
  showAvatar?: boolean;
}

const messageVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.8,
    rotateX: -15,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -20,
    transition: { duration: 0.2 },
  },
};

const bubbleHoverVariants = {
  hover: {
    scale: 1.02,
    y: -2,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  chatId,
  showAvatar = false,
}) => {
  const [deleting, setDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { userProfile } = useAuth();

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleDelete = async () => {
    if (!isOwn || deleting) return;

    try {
      setDeleting(true);
      await deleteMessage(chatId, message.id);
    } catch (error) {
      console.error("Error deleting message:", error);
      setDeleting(false);
    }
  };

  const getReadReceiptIcon = () => {
    if (!isOwn) return null;

    const readStatus = getMessageReadStatus(message, userProfile?.uid || "");

    switch (readStatus) {
      case "sent":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <Check className="h-3 w-3 text-slate-400" />
          </motion.div>
        );
      case "delivered":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <CheckCheck className="h-3 w-3 text-slate-400" />
          </motion.div>
        );
      case "read":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <CheckCheck className="h-3 w-3 text-blue-500" />
          </motion.div>
        );
      default:
        return null;
    }
  };

  const handleLongPress = () => {
    if ("navigator" in window && "vibrate" in navigator) {
      navigator.vibrate(50);
    }
  };

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        "flex mb-2 group relative",
        isOwn ? "justify-end" : "justify-start",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <motion.div
            variants={bubbleHoverVariants}
            whileHover="hover"
            className={cn(
              "relative max-w-xs lg:max-w-sm xl:max-w-md cursor-pointer",
              isOwn ? "ml-12" : "mr-12",
            )}
            onTouchStart={() => {
              const timer = setTimeout(handleLongPress, 500);
              const cancelLongPress = () => {
                clearTimeout(timer);
                document.removeEventListener("touchend", cancelLongPress);
                document.removeEventListener("touchmove", cancelLongPress);
              };
              document.addEventListener("touchend", cancelLongPress);
              document.addEventListener("touchmove", cancelLongPress);
            }}
          >
            {/* Message bubble with enhanced styling */}
            <div
              className={cn(
                "relative px-4 py-2 rounded-3xl shadow-sm transition-all duration-300 transition-colors",
                "backdrop-blur-sm border border-opacity-20",
                isOwn
                  ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-br-md shadow-blue-500/25 border-blue-400"
                  : "bg-white/80 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600 shadow-slate-500/10",
                deleting && "opacity-50 scale-95",
                "hover:shadow-lg",
              )}
            >
              {/* Message content */}
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.text}
              </p>

              {/* Time and status */}
              <div
                className={cn(
                  "flex items-center justify-end gap-1 mt-1",
                  isOwn
                    ? "text-white/70"
                    : "text-slate-500 dark:text-slate-400",
                )}
              >
                <Clock className="h-2.5 w-2.5" />
                <span className="text-xs">{formatTime(message.timestamp)}</span>
                {getReadReceiptIcon()}
              </div>

              {/* Glow effect for own messages */}
              {isOwn && (
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 opacity-20 blur-lg -z-10" />
              )}
            </div>

            {/* Enhanced message tail */}
            <div
              className={cn(
                "absolute w-0 h-0 transition-all duration-300",
                isOwn
                  ? "right-0 bottom-0 border-l-[12px] border-l-blue-500 border-b-[12px] border-b-transparent"
                  : "left-0 bottom-0 border-r-[12px] border-r-white dark:border-r-slate-700 border-b-[12px] border-b-transparent",
              )}
            />

            {/* Hover actions */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  className={cn(
                    "absolute -top-12 flex items-center gap-1 bg-white dark:bg-slate-800 rounded-full px-2 py-1 shadow-lg border border-slate-200 dark:border-slate-600",
                    isOwn ? "right-0" : "left-0",
                  )}
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                  >
                    <Heart className="h-3 w-3 text-red-500" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                  >
                    <Smile className="h-3 w-3 text-yellow-500" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                  >
                    <Reply className="h-3 w-3 text-blue-500" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-48 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-2xl">
          <ContextMenuItem className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
            <Reply className="h-4 w-4" />
            Reply
          </ContextMenuItem>
          <ContextMenuItem className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
            <Forward className="h-4 w-4" />
            Forward
          </ContextMenuItem>
          <ContextMenuItem className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
            <Copy className="h-4 w-4" />
            Copy Text
          </ContextMenuItem>
          {isOwn && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Deleting..." : "Delete Message"}
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </motion.div>
  );
};
