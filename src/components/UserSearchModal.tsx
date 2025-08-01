import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Loader2,
  Users,
  MessageCircle,
  Sparkles,
  Zap,
  Globe,
  Star,
  UserPlus,
  X,
} from "lucide-react";
import { UserProfile, searchUsersByUsername } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { generateChatId } from "@/lib/firebase";
import { cn } from "@/lib/utils";

interface UserSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectUser: (userId: string, username: string) => void;
  searchQuery?: string;
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 50 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: { duration: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

const userItemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

export const UserSearchModal: React.FC<UserSearchModalProps> = ({
  open,
  onClose,
  onSelectUser,
  searchQuery: initialSearchQuery = "",
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const { userProfile } = useAuth();

  // Reset search when modal opens/closes
  useEffect(() => {
    if (open) {
      setSearchTerm(initialSearchQuery);
      setError("");
    } else {
      setSearchTerm("");
      setUsers([]);
      setError("");
    }
  }, [open, initialSearchQuery]);

  // Real-time search effect
  useEffect(() => {
    if (!searchTerm.trim()) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      setError("");

      try {
        console.log("Searching for:", searchTerm);
        const results = await searchUsersByUsername(searchTerm);
        console.log("Search results:", results);

        // Filter out current user
        const filteredResults = results.filter(
          (user) => user.uid !== userProfile?.uid,
        );
        setUsers(filteredResults);

        if (filteredResults.length === 0 && searchTerm.length >= 3) {
          setError("No users found with this username");
        }
      } catch (error) {
        console.error("Error searching users:", error);
        setError("Error searching users. Please try again.");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, userProfile?.uid]);

  const handleUserSelect = (user: UserProfile) => {
    console.log("Selecting user:", user);
    onSelectUser(user.uid, user.username);
    onClose();
    setSearchTerm("");
    setUsers([]);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setError("");
  };

  const EmptyState = ({
    type,
  }: {
    type: "initial" | "no-results" | "loading" | "error";
  }) => {
    const configs = {
      initial: {
        icon: Users,
        title: "Find your friends",
        description: "Search by username to start a conversation",
        color: "font-bold text-[#132556] dark:text-white",
      },
      "no-results": {
        icon: Search,
        title: "No users found",
        description: "Try a different username or check spelling",
        color: "text-orange-500",
      },
      loading: {
        icon: Loader2,
        title: "Searching...",
        description: "Finding users that match your search",
        color: "text-blue-500",
      },
      error: {
        icon: X,
        title: "Search Error",
        description: error || "Something went wrong",
        color: "text-red-500",
      },
    };

    const config = configs[type];
    const Icon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-64 text-center p-6"
      >
        <div
          className={cn("relative mb-4", type === "loading" && "animate-spin")}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-20" />
          <div className="relative p-4 bg-slate-50 dark:bg-slate-700 rounded-full">
            <Icon className={cn("h-8 w-8", config.color)} />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {config.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {config.description}
        </p>
      </motion.div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-0 shadow-2xl">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <DialogHeader className="pb-4">
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-3"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-sm opacity-30" />
                <div className="relative p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-[#132556] dark:text-white">
                  Find Users
                </DialogTitle>
              </div>
            </motion.div>
          </DialogHeader>

          <motion.div variants={itemVariants} className="space-y-4">
            {/* Enhanced search input */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <Input
                placeholder="Type username to search..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 h-12 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                autoFocus
              />
              {searchTerm && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-4 top-2 transform -translate-y-1/2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {users.length} found
                    </Badge>
                  )}
                </motion.div>
              )}
            </div>

            {/* Results area */}
            <ScrollArea className="h-64">
              <AnimatePresence mode="wait">
                {loading ? (
                  <EmptyState type="loading" />
                ) : error ? (
                  <EmptyState type="error" />
                ) : users.length === 0 ? (
                  <EmptyState
                    type={searchTerm.trim() ? "no-results" : "initial"}
                  />
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2 p-2"
                  >
                    {users.map((user, index) => (
                      <motion.div
                        key={user.uid}
                        variants={userItemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-auto p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                          onClick={() => handleUserSelect(user)}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="relative">
                              <Avatar className="h-12 w-12 ring-2 ring-slate-200 dark:ring-slate-600">
                                <AvatarImage src={user.photoURL} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                                  {user.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>

                              {/* Online indicator */}
                              <motion.div
                                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            </div>

                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                  {user.displayName || user.username}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  <Globe className="h-2 w-2 mr-1" />
                                  Online
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Zap className="h-3 w-3" />@{user.username}
                              </p>
                            </div>

                            <motion.div
                              whileHover={{ rotate: 15 }}
                              className="text-blue-500"
                            >
                              <MessageCircle className="h-5 w-5" />
                            </motion.div>
                          </div>
                        </Button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollArea>

            {/* Quick actions */}
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Sparkles className="h-3 w-3" />
                <span>Real-time search</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Star className="h-3 w-3" />
                <span>
                  {searchTerm
                    ? `${users.length} results`
                    : "Start typing to search"}
                </span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};