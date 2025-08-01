import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  Timestamp,
  deleteDoc,
  getDoc,
  getDocs,
  writeBatch,
  deleteField,
  setDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db, generateChatId } from "./firebase";

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Timestamp;
  chatId: string;
  readBy: { [uid: string]: Timestamp };
  delivered: boolean;
  edited?: boolean;
  editedAt?: Timestamp;
}

export interface Chat {
  id: string;
  participants: string[];
  participantNames: { [uid: string]: string };
  participantAvatars: { [uid: string]: string };
  lastMessage: string;
  lastMessageTime: Timestamp;
  lastMessageSender: string;
  unreadCount: { [uid: string]: number };
  typingUsers: { [uid: string]: Timestamp };
  createdAt: Timestamp;
  totalMessages: number;
}

export const sendMessage = async (
  senderId: string,
  receiverId: string,
  text: string,
  senderName: string,
  receiverName: string,
  senderAvatar: string = "",
  receiverAvatar: string = "",
): Promise<void> => {
  try {
    const chatId = generateChatId(senderId, receiverId);
    const messagesRef = collection(db, "chats", chatId, "messages");

    const messageData = {
      text,
      senderId,
      senderName,
      timestamp: serverTimestamp(),
      chatId,
      readBy: { [senderId]: serverTimestamp() },
      delivered: false,
      edited: false,
    };

    await addDoc(messagesRef, messageData);

    // Update chat metadata with proper unread count logic
    const chatRef = doc(db, "chats", chatId);

    // Get current chat data
    let currentUnreadCount = { [receiverId]: 0, [senderId]: 0 };
    try {
      const chatDoc = await getDoc(chatRef);
      if (chatDoc.exists()) {
        const existingData = chatDoc.data();
        currentUnreadCount = {
          ...existingData.unreadCount,
          [receiverId]: (existingData.unreadCount?.[receiverId] || 0) + 1,
          [senderId]: 0,
        };
      } else {
        currentUnreadCount[receiverId] = 1;
      }
    } catch (error) {
      currentUnreadCount[receiverId] = 1;
    }

    const chatData = {
      participants: [senderId, receiverId],
      participantNames: {
        [senderId]: senderName,
        [receiverId]: receiverName,
      },
      participantAvatars: {
        [senderId]: senderAvatar,
        [receiverId]: receiverAvatar,
      },
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      lastMessageSender: senderId,
      unreadCount: currentUnreadCount,
      typingUsers: {},
      createdAt: serverTimestamp(),
      totalMessages: increment(1),
    };

    await setDoc(chatRef, chatData, { merge: true });
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const subscribeToMessages = (
  chatId: string,
  callback: (messages: Message[]) => void,
): (() => void) => {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp || Timestamp.now(),
        } as Message);
      });
      callback(messages);
    },
    (error) => {
      console.error("Messages subscription error:", error);
      callback([]);
    },
  );
};

export const subscribeToChats = (
  userId: string,
  callback: (chats: Chat[]) => void,
  errorCallback?: (error: Error) => void,
): (() => void) => {
  try {
    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("participants", "array-contains", userId));

    return onSnapshot(
      q,
      (snapshot) => {
        try {
          const chats: Chat[] = [];
          snapshot.forEach((doc) => {
            const chatData = doc.data();

            if (chatData.participants && Array.isArray(chatData.participants)) {
              chats.push({
                id: doc.id,
                ...chatData,
                lastMessage: chatData.lastMessage || "",
                lastMessageTime: chatData.lastMessageTime || Timestamp.now(),
                lastMessageSender: chatData.lastMessageSender || "",
                unreadCount: chatData.unreadCount || {},
                typingUsers: chatData.typingUsers || {},
                participantAvatars: chatData.participantAvatars || {},
                participantNames: chatData.participantNames || {},
                createdAt: chatData.createdAt || Timestamp.now(),
                totalMessages: chatData.totalMessages || 0,
              } as Chat);
            }
          });

          // Sort by lastMessageTime in JavaScript
          chats.sort((a, b) => {
            const timeA = a.lastMessageTime?.toMillis() || 0;
            const timeB = b.lastMessageTime?.toMillis() || 0;
            return timeB - timeA;
          });

          callback(chats);
        } catch (error) {
          console.error("Error processing chat data:", error);
          if (errorCallback) {
            errorCallback(error as Error);
          }
        }
      },
      (error) => {
        console.error("Chat subscription error:", error);
        if (errorCallback) {
          errorCallback(error);
        }
      },
    );
  } catch (error) {
    console.error("Error setting up chat subscription:", error);
    if (errorCallback) {
      errorCallback(error as Error);
    }
    return () => {};
  }
};

export const deleteMessage = async (
  chatId: string,
  messageId: string,
): Promise<void> => {
  try {
    const messageRef = doc(db, "chats", chatId, "messages", messageId);
    await deleteDoc(messageRef);

    // Update chat's last message if this was the last message
    // In a real app, you'd fetch the new last message and update the chat
    console.log(`Message ${messageId} deleted from chat ${chatId}`);
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};

export const markMessagesAsRead = async (
  chatId: string,
  userId: string,
): Promise<void> => {
  try {
    // Update chat unread count to 0 for this user
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      [`unreadCount.${userId}`]: 0,
    });

    // Mark individual messages as read
    const messagesRef = collection(db, "chats", chatId, "messages");
    const unreadQuery = query(
      messagesRef,
      where("senderId", "!=", userId),
      orderBy("senderId"),
      orderBy("timestamp", "desc"),
    );

    const snapshot = await getDocs(unreadQuery);
    const batch = writeBatch(db);

    snapshot.docs.forEach((docSnap) => {
      const messageData = docSnap.data();
      if (!messageData.readBy || !messageData.readBy[userId]) {
        const messageRef = doc(db, "chats", chatId, "messages", docSnap.id);
        batch.update(messageRef, {
          [`readBy.${userId}`]: serverTimestamp(),
        });
      }
    });

    await batch.commit();
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
};

export const setTypingStatus = async (
  chatId: string,
  userId: string,
  isTyping: boolean,
): Promise<void> => {
  try {
    const chatRef = doc(db, "chats", chatId);

    if (isTyping) {
      await updateDoc(chatRef, {
        [`typingUsers.${userId}`]: serverTimestamp(),
      });
    } else {
      await updateDoc(chatRef, {
        [`typingUsers.${userId}`]: deleteField(),
      });
    }
  } catch (error) {
    console.error("Error setting typing status:", error);
  }
};

export const getMessageReadStatus = (
  message: Message,
  currentUserId: string,
): "sent" | "delivered" | "read" => {
  if (message.senderId !== currentUserId) return "read";

  const otherUserIds = Object.keys(message.readBy || {}).filter(
    (uid) => uid !== currentUserId,
  );

  if (otherUserIds.length > 0) return "read";
  if (message.delivered) return "delivered";
  return "sent";
};

export const deleteChat = async (chatId: string): Promise<void> => {
  try {
    // Delete all messages in the chat
    const messagesRef = collection(db, "chats", chatId, "messages");
    const messagesSnapshot = await getDocs(messagesRef);

    const batch = writeBatch(db);
    messagesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the chat document
    const chatRef = doc(db, "chats", chatId);
    batch.delete(chatRef);

    await batch.commit();
    console.log(`Chat ${chatId} deleted successfully`);
  } catch (error) {
    console.error("Error deleting chat:", error);
    throw error;
  }
};

export const getTotalUnreadCount = (chats: Chat[], userId: string): number => {
  return chats.reduce((total, chat) => {
    return total + (chat.unreadCount?.[userId] || 0);
  }, 0);
};

export const createTestChat = async (
  userId: string,
  userName: string,
): Promise<void> => {
  try {
    const testUserId = "test-user-123";
    const testUserName = "Test User";
    const chatId = generateChatId(userId, testUserId);

    const chatData = {
      participants: [userId, testUserId],
      participantNames: {
        [userId]: userName,
        [testUserId]: testUserName,
      },
      participantAvatars: {
        [userId]: "",
        [testUserId]: "",
      },
      lastMessage: "Hello! This is a test message.",
      lastMessageTime: serverTimestamp(),
      lastMessageSender: testUserId,
      unreadCount: { [userId]: 1, [testUserId]: 0 },
      typingUsers: {},
      createdAt: serverTimestamp(),
      totalMessages: 1,
    };

    const chatRef = doc(db, "chats", chatId);
    await setDoc(chatRef, chatData);

    console.log("Test chat created successfully");
  } catch (error) {
    console.error("Error creating test chat:", error);
  }
};
