import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  MessageCircle,
  Check,
  X,
  Shield,
  Sparkles,
  Users,
  Lock,
  Zap,
} from "lucide-react";
import {
  signInWithGoogle,
  createUserProfile,
  checkUsernameExists,
} from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

export const AuthForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  );
  const [isValidating, setIsValidating] = useState(false);
  const { user, needsUsername, setUserProfile } = useAuth();

  const validateUsername = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameAvailable(null);
      setUsernameError("");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError(
        "Username can only contain letters, numbers, and underscores",
      );
      setUsernameAvailable(false);
      return;
    }

    setIsValidating(true);
    setUsernameError("");

    try {
      const exists = await checkUsernameExists(value);
      if (exists) {
        setUsernameError("Username already taken");
        setUsernameAvailable(false);
      } else {
        setUsernameError("");
        setUsernameAvailable(true);
      }
    } catch (error) {
      setUsernameError("Error checking username");
      setUsernameAvailable(false);
    } finally {
      setIsValidating(false);
    }
  }, []);

  useEffect(() => {
    if (!username) return;

    const timeoutId = setTimeout(() => {
      validateUsername(username);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, validateUsername]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !username || !usernameAvailable) return;

    try {
      setLoading(true);
      await createUserProfile(user, username);
      const newProfile = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        username,
        createdAt: new Date(),
      };
      setUserProfile(newProfile);
    } catch (error) {
      console.error("Profile creation error:", error);
      setUsernameError("Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, "");
    setUsername(value);
    setUsernameAvailable(null);

    if (value.length > 0 && value.length < 3) {
      setUsernameError("Username must be at least 3 characters");
    } else {
      setUsernameError("");
    }
  };

  const getUsernameIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (usernameAvailable === true) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    if (usernameAvailable === false) {
      return <X className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  if (needsUsername && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 relative overflow-hidden">
        {/* Static background elements - reduced animations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-400/5 rounded-full blur-3xl" />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative w-full max-w-md z-10"
        >
          <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl shadow-black/5">
            <CardHeader className="text-center pb-6 pt-8">
              <motion.div
                variants={itemVariants}
                className="mx-auto mb-6 relative"
              >
                <div className="relative p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                  Join Whisperr Chat
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300 mt-2">
                  Choose your unique username to start messaging
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent className="space-y-6 pb-8">
              <motion.form
                variants={itemVariants}
                onSubmit={handleUsernameSubmit}
                className="space-y-5"
              >
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Enter username"
                      value={username}
                      onChange={handleUsernameChange}
                      disabled={loading}
                      className={cn(
                        "h-12 pl-4 pr-12 text-base bg-white/70 dark:bg-slate-700/70 border-2 rounded-xl transition-all duration-200",
                        usernameError
                          ? "border-red-400 focus:border-red-500"
                          : usernameAvailable
                            ? "border-green-400 focus:border-green-500"
                            : "border-slate-300 dark:border-slate-600 focus:border-blue-500",
                      )}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {getUsernameIcon()}
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {username.length >= 3 &&
                      !usernameError &&
                      usernameAvailable === true && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
                        >
                          <Sparkles className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                            Perfect! Username is available
                          </span>
                        </motion.div>
                      )}

                    {usernameError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Alert
                          variant="destructive"
                          className="border-red-200 dark:border-red-800"
                        >
                          <X className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {usernameError}
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    3+ characters, letters, numbers, and underscores only
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
                  disabled={
                    loading ||
                    !username ||
                    !usernameAvailable ||
                    !!usernameError
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating your profile...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Start Chatting
                    </>
                  )}
                </Button>
              </motion.form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 relative overflow-hidden">
      {/* Static background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-400/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-md z-10"
      >
        <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl shadow-black/5">
          <CardHeader className="text-center pb-6 pt-8">
            <motion.div
              variants={itemVariants}
              className="mx-auto mb-6 relative"
            >
              <div className="relative p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl">
                <MessageCircle className="h-10 w-10 text-white" />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <CardTitle className="text-4xl font-bold text-[#132556] dark:text-white">
                Whisperr
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300 mt-2 text-base">
                Secure messaging for the modern world
              </CardDescription>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700"
            >
              <div className="text-center">
                <Lock className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                <p className="text-xs text-slate-500">Secure</p>
              </div>
              <div className="text-center">
                <Users className="h-6 w-6 mx-auto text-purple-500 mb-1" />
                <p className="text-xs text-slate-500">Private</p>
              </div>
              <div className="text-center">
                <Zap className="h-6 w-6 mx-auto text-cyan-500 mb-1" />
                <p className="text-xs text-slate-500">Fast</p>
              </div>
            </motion.div>
          </CardHeader>

          <CardContent className="pb-8">
            <motion.div variants={itemVariants}>
              <Button
                onClick={handleGoogleSignIn}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 dark:border-gray-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-200 shadow-lg transition-all duration-200 rounded-xl font-semibold"
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
