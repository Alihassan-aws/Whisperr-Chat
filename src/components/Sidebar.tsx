import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserSearchModal } from "./UserSearchModal";
import { MessageCircle, Settings, UserPlus, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

type View = "chats" | "settings";

interface SidebarProps {
  onViewChange: (view: View) => void;
  currentView: View;
  totalUnread?: number;
  onUserSelect?: (userId: string, username: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onViewChange,
  currentView,
  totalUnread = 0,
  onUserSelect,
}) => {
  const { userProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserSearch, setShowUserSearch] = useState(false);

  const navigationItems = [
    { icon: MessageCircle, label: "Chats", view: "chats" as View, badge: totalUnread > 0 ? totalUnread : undefined },
    { icon: Settings, label: "Settings", view: "settings" as View },
  ];

  const openUserSearch = () => setShowUserSearch(true);

  const handleUserSelect = (userId: string, username: string) => {
    onUserSelect?.(userId, username);
    setShowUserSearch(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-2xl rounded-b-3xl overflow-hidden">
      <div className="p-4 space-y-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-lg opacity-40" />
              <motion.div whileHover={{ scale: 1.1, rotate: 2 }} className="relative p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-xl">
                <MessageCircle className="h-6 w-6 text-white" />
              </motion.div>
            </div>
            <h1 className="text-3xl font-bold text-[#132556] dark:text-white">Whisperr</h1>
          </div>
          <div className="flex items-center gap-2">
            <IconButton icon={UserPlus} onClick={openUserSearch} title="Find users" />
            <div className="w-2" />
            <IconButton onClick={toggleTheme} title="Toggle theme">
              <AnimatePresence mode="wait">
                {theme === "dark" ? (
                  <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Sun className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Moon className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </IconButton>
          </div>
        </motion.div>

        <motion.div whileHover={{ scale: 1.03 }} className="flex items-center gap-3 p-3 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl shadow-2xl">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-blue-200 dark:ring-blue-700 shadow-lg">
              <AvatarImage src={userProfile?.photoURL} />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                {userProfile?.username?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <motion.div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate text-[#132556] dark:text-white">{userProfile?.displayName || userProfile?.username}</h3>
            <p className="text-sm text-[#132556]/70 dark:text-muted-foreground truncate">@{userProfile?.username}</p>
          </div>
        </motion.div>

        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-2xl shadow-xl gap-3">
          {navigationItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <motion.div key={item.view} className="flex-1" whileHover={{ scale: 1.05 }}>
                <Button
                  onClick={() => onViewChange(item.view)}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full h-10 relative rounded-xl transition-all shadow-md",
                    isActive
                      ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 hover:bg-transparent"
                      : "text-[#132556] dark:text-slate-400 hover:shadow-lg hover:bg-transparent"
                  )}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  <span className="font-medium">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1">
                      <Badge className="bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center">
                        {item.badge > 99 ? "99+" : item.badge}
                      </Badge>
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
      <UserSearchModal open={showUserSearch} onClose={() => setShowUserSearch(false)} onSelectUser={handleUserSelect} searchQuery={""} />
    </motion.div>
  );
};

const IconButton = ({ icon: Icon, onClick, className = "", title = "", children }: { icon?: React.ElementType; onClick?: () => void; className?: string; title?: string; children?: React.ReactNode; }) => (
  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
    <Button variant="ghost" size="icon" onClick={onClick} title={title} className={cn("h-9 w-9 rounded-xl shadow-md transition-shadow hover:shadow-xl", className)}>
      {children ?? (Icon && <Icon className="h-4 w-4" />)}
    </Button>
  </motion.div>
);
