import {
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  username: string;
  createdAt: Date;
}

export const signInWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const createUserProfile = async (
  user: User,
  username: string,
): Promise<void> => {
  const userDoc = doc(db, "users", user.uid);
  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    username,
    createdAt: new Date(),
  };

  await setDoc(userDoc, userProfile);
};

export const getUserProfile = async (
  uid: string,
): Promise<UserProfile | null> => {
  const userDoc = doc(db, "users", uid);
  const docSnap = await getDoc(userDoc);

  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }

  return null;
};

export const checkUsernameExists = async (
  username: string,
): Promise<boolean> => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("username", "==", username));
  const querySnapshot = await getDocs(q);

  return !querySnapshot.empty;
};

export const searchUsersByUsername = async (
  searchTerm: string,
): Promise<UserProfile[]> => {
  try {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    console.log("Searching for users with term:", searchTerm);

    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);

    const users: UserProfile[] = [];
    const searchTermLower = searchTerm.toLowerCase().trim();

    querySnapshot.forEach((doc) => {
      const userData = doc.data() as UserProfile;

      // Multiple search criteria for better matching
      const usernameMatch = userData.username
        ?.toLowerCase()
        .includes(searchTermLower);
      const displayNameMatch = userData.displayName
        ?.toLowerCase()
        .includes(searchTermLower);
      const emailMatch = userData.email
        ?.toLowerCase()
        .includes(searchTermLower);

      // Check if any of the search criteria match
      if (usernameMatch || displayNameMatch || emailMatch) {
        users.push({
          uid: userData.uid || doc.id,
          username: userData.username || "",
          displayName: userData.displayName || "",
          email: userData.email || "",
          photoURL: userData.photoURL || "",
          createdAt: userData.createdAt || new Date(),
        });
      }
    });

    console.log("Found users:", users);

    // Sort results: exact username matches first, then partial matches
    users.sort((a, b) => {
      const aExactMatch = a.username.toLowerCase() === searchTermLower;
      const bExactMatch = b.username.toLowerCase() === searchTermLower;

      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;

      // If both are exact or both are partial, sort alphabetically
      return a.username.localeCompare(b.username);
    });

    return users;
  } catch (error) {
    console.error("Error searching users:", error);
    throw new Error("Failed to search users");
  }
};
