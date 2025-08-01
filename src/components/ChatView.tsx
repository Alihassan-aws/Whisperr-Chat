import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, MoreVertical, Zap, Heart, ChevronDown } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { useMessages } from "@/hooks/useMessages";
import { sendMessage, markMessagesAsRead, setTypingStatus } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";

interface ChatViewProps {
  chatId: string;
  otherUserId: string;
  otherUserName: string;
  onBack: () => void;
}

const containerVariants = {
  hidden: { opacity: 0, x: 100 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: { duration: 0.3 },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
};

export const ChatView: React.FC<ChatViewProps> = ({
  chatId,
  otherUserId,
  otherUserName,
  onBack,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { messages, loading } = useMessages(chatId);
  const { userProfile } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(false);
  const lastMessageCount = useRef(0);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (!scrollAreaRef.current) return;
    
    isAutoScrolling.current = true;
    scrollAreaRef.current.scrollTo({
      top: scrollAreaRef.current.scrollHeight,
      behavior,
    });
    
    // Reset auto-scrolling flag after animation completes
    setTimeout(() => {
      isAutoScrolling.current = false;
      setShowScrollButton(false);
    }, behavior === "smooth" ? 500 : 0);
  }, []);

  // Check if user has scrolled up
  const handleScroll = useCallback(() => {
    if (!scrollAreaRef.current || isAutoScrolling.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100;
    
    setShowScrollButton(!isAtBottom);
  }, []);

  // Setup scroll event listener
  useEffect(() => {
    const scrollElement = scrollAreaRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  // Auto-scroll when opening chat or receiving new messages
  useEffect(() => {
    if (!loading && messages.length > 0) {
      const isNewMessage = messages.length > lastMessageCount.current;
      
      if (isNewMessage || messages.length !== lastMessageCount.current) {
        scrollToBottom(isNewMessage ? "smooth" : "auto");
      }
      
      lastMessageCount.current = messages.length;
    }
  }, [messages, loading, scrollToBottom]);

  // Initial scroll to bottom when chat loads
  useEffect(() => {
    if (chatId && !loading) {
      setTimeout(() => {
        scrollToBottom("auto");
      }, 100);
    }
  }, [chatId, loading, scrollToBottom]);

  // Mark messages as read when at bottom
  useEffect(() => {
    if (chatId && userProfile && !showScrollButton) {
      markMessagesAsRead(chatId, userProfile.uid);
    }
  }, [chatId, userProfile, showScrollButton, messages]);

  // Typing indicator logic
  const handleTyping = useCallback(
    async (typing: boolean) => {
      if (!userProfile) return;
      try {
        await setTypingStatus(chatId, userProfile.uid, typing);
        setIsTyping(typing);
      } catch (error) {
        console.error("Error setting typing status:", error);
      }
    },
    [chatId, userProfile],
  );

  // Textarea auto-resize and typing detection
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setNewMessage(value);

      // Auto-resize textarea
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
        inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
      }

      // Typing indicator
      if (value.trim() && !isTyping) {
        handleTyping(true);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false);
      }, 1000);
    },
    [isTyping, handleTyping],
  );

  // Focus input and scroll to bottom when focusing input
  const handleInputFocus = useCallback(() => {
    setTimeout(() => {
      scrollToBottom("smooth");
    }, 300);
  }, [scrollToBottom]);

  // Send message handler
  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !userProfile || sending) return;

      const messageText = newMessage.trim();
      try {
        setSending(true);
        if (isTyping) {
          await handleTyping(false);
        }
        setNewMessage("");
        if (inputRef.current) {
          inputRef.current.style.height = "48px";
          // Blur the textarea to automatically close the mobile keyboard after sending
          inputRef.current.blur();
        }
        
        await sendMessage(
          userProfile.uid,
          otherUserId,
          messageText,
          userProfile.username,
          otherUserName,
          userProfile.photoURL || "",
          "",
        );
        
        // Scroll after sending
        setTimeout(() => {
          scrollToBottom("smooth");
        }, 100);
      } catch (error) {
        console.error("Error sending message:", error);
        setNewMessage(messageText);
      } finally {
        setSending(false);
      }
    },
    [newMessage, userProfile, sending, isTyping, handleTyping, otherUserId, otherUserName, scrollToBottom],
  );

  // Handle Enter key for sending
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(e);
      }
    },
    [handleSendMessage],
  );

  // Clean up effects
  useEffect(() => {
    return () => {
      if (isTyping && userProfile) {
        handleTyping(false);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, userProfile, handleTyping]);

  return (
    <motion.div
      ref={chatContainerRef}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900"
    >
      {/* Header */}
      <motion.div
        variants={headerVariants}
        className="relative flex items-center gap-3 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm flex-shrink-0 z-10"
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10 bg-white/50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-200" />
          </Button>
        </motion.div>
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-9 w-9 ring-1 ring-blue-200 dark:ring-blue-700">
            <AvatarImage src="" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
              {otherUserName?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-base">
              {otherUserName}
            </h2>
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs text-blue-600 dark:text-blue-400"
                >
                  typing...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea 
          ref={scrollAreaRef} 
          className="h-full w-full absolute inset-0"
        >
          <div className="p-4 pb-6 flex flex-col gap-3 min-h-full">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <motion.div className="flex space-x-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-blue-500 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </motion.div>
              </div>
            ) : messages.length === 0 ? (
              <motion.div
                className="flex items-center justify-center h-full"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center text-gray-700 dark:text-gray-300 max-w-xs">
                  <p className="text-base font-medium">No messages yet</p>
                  <p className="text-sm mt-2 text-gray-400 dark:text-gray-500">
                    Start the conversation! 👋
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {messages.map((message, index) => {
                    const isOwn = message.senderId === userProfile?.uid;
                    const showAvatar =
                      !isOwn &&
                      (index === 0 || messages[index - 1]?.senderId !== message.senderId);
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <MessageBubble
                          message={message}
                          isOwn={isOwn}
                          chatId={chatId}
                          showAvatar={showAvatar}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* WhatsApp-like scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-20 right-4 z-30"
              onClick={() => scrollToBottom("smooth")}
            >
              <Button
                size="icon"
                className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 shadow-lg"
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <motion.div
        ref={inputContainerRef}
        className="p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 flex-shrink-0 z-10"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={inputRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={handleInputFocus}
              placeholder="Message..."
              disabled={sending}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              rows={1}
              className="min-h-[48px] max-h-[120px] pl-4 pr-14 bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none overflow-hidden leading-6 py-3 text-base"
            />
            <AnimatePresence>
              {newMessage.trim() && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-4 top-0 -translate-y-1/2"
                >
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    size="icon"
                    className="h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl shadow-lg shadow-blue-500/25 transition-all duration-200"
                  >
                    {sending ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Heart className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};