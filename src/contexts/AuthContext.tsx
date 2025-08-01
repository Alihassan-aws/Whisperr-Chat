import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { UserProfile, getUserProfile } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  needsUsername: boolean;
  error: string | null;
  setUserProfile: (profile: UserProfile) => void;
  retry: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserProfile = useCallback(async (currentUser: User) => {
    try {
      setError(null);
      setLoading(true);

      const profile = await getUserProfile(currentUser.uid);
      if (profile) {
        setUserProfile(profile);
        setNeedsUsername(false);
      } else {
        setUserProfile(null);
        setNeedsUsername(true);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      setError("Failed to load user profile");
      setUserProfile(null);
      setNeedsUsername(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    if (user) {
      loadUserProfile(user);
    }
  }, [user, loadUserProfile]);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;

      try {
        setUser(currentUser);
        setError(null);

        if (currentUser) {
          await loadUserProfile(currentUser);
        } else {
          setUserProfile(null);
          setNeedsUsername(false);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Auth state change error:", error);
          setError("Authentication error");
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [loadUserProfile]);

  const handleSetUserProfile = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    setNeedsUsername(false);
    setError(null);
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    needsUsername,
    error,
    setUserProfile: handleSetUserProfile,
    retry,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
