import { useEffect, useState, useCallback, useRef } from "react";
import { Chat, subscribeToChats, createTestChat } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";

export const useChats = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, userProfile } = useAuth();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);

  const handleChatsUpdate = useCallback((newChats: Chat[]) => {
    if (!isMountedRef.current) return;

    setChats(newChats);
    setLoading(false);
    setError(null);
  }, []);

  const handleError = useCallback((error: Error) => {
    if (!isMountedRef.current) return;

    console.error("Error in chat subscription:", error);
    setError(error.message);
    setLoading(false);
  }, []);

  const createTestChatIfNeeded = useCallback(async () => {
    if (!isMountedRef.current || !userProfile || chats.length > 0) return;

    try {
      console.log("Creating test chat for development...");
      await createTestChat(userProfile.uid, userProfile.username);
    } catch (error) {
      console.error("Failed to create test chat:", error);
    }
  }, [userProfile, chats.length]);

  const setupSubscription = useCallback(() => {
    if (!user || !userProfile) {
      setChats([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Setting up chat subscription for user:", userProfile.uid);
      unsubscribeRef.current = subscribeToChats(
        userProfile.uid,
        handleChatsUpdate,
        handleError,
      );
    } catch (err) {
      console.error("Failed to subscribe to chats:", err);
      setError("Failed to load chats");
      setLoading(false);
    }
  }, [user, userProfile, handleChatsUpdate, handleError]);

  useEffect(() => {
    isMountedRef.current = true;
    setupSubscription();

    return () => {
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        console.log("Cleaning up chat subscription");
        unsubscribeRef.current();
      }
    };
  }, [setupSubscription]);

  // Create test chat if no chats exist (for development)
  useEffect(() => {
    if (!loading && chats.length === 0 && userProfile && isMountedRef.current) {
      const timer = setTimeout(createTestChatIfNeeded, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, chats.length, userProfile, createTestChatIfNeeded]);

  const retry = useCallback(() => {
    if (user && userProfile) {
      setupSubscription();
    }
  }, [user, userProfile, setupSubscription]);

  return { chats, loading, error, retry };
};
