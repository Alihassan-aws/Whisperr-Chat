import { useEffect, useState, useCallback, useRef } from "react";
import { Message, subscribeToMessages } from "@/lib/firestore";

export const useMessages = (chatId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);

  const handleMessagesUpdate = useCallback((newMessages: Message[]) => {
    if (!isMountedRef.current) return;
    setMessages(newMessages);
    setLoading(false);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    setLoading(true);

    try {
      unsubscribeRef.current = subscribeToMessages(
        chatId,
        handleMessagesUpdate,
      );
    } catch (error) {
      console.error("Error subscribing to messages:", error);
      setLoading(false);
    }

    return () => {
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [chatId, handleMessagesUpdate]);

  return { messages, loading };
};
