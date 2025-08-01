import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { signOut } from "@/lib/auth";

interface SettingsPageProps {
  onBack: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { userProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pageRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Custom edge swipe logic
  useEffect(() => {
    let touchStartX = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchCurrentX = e.touches[0].clientX;
      if (touchStartX < 50 && touchStartX - touchCurrentX > 50) {
        e.preventDefault();
        e.stopImmediatePropagation();
        onBack();
        console.log("Swipe back triggered");
      }
    };

    const element = pageRef.current;
    if (element) {
      element.addEventListener("touchstart", handleTouchStart, { passive: false });
      element.addEventListener("touchmove", handleTouchMove, { passive: false });
      return () => {
        element.removeEventListener("touchstart", handleTouchStart);
        element.removeEventListener("touchmove", handleTouchMove);
      };
    }
  }, [onBack]);

  // Ensure back button works
  const handleBackButton = () => {
    onBack();
  };

  return (
    <div
      ref={pageRef}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
    >
      {/* Header with working back button */}
      <div className="sticky top-0 z-10 bg-white/70 dark:bg-gray-800/70 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 p-4 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={handleBackButton}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Profile Card */}
        <Card className="shadow-sm border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg">Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-xl shadow-sm ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-primary">
                <AvatarImage src={userProfile?.photoURL} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-medium">
                  {userProfile?.username?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {userProfile?.displayName || userProfile?.username}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  @{userProfile?.username}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {userProfile?.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Card */}
        <Card className="shadow-sm border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg">Appearance</CardTitle>
            <CardDescription>Customize how the app looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Moon className="h-5 w-5 text-gray-500" />
                ) : (
                  <Sun className="h-5 w-5 text-gray-500" />
                )}
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode" className="text-base">
                    Dark mode
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Dark/Light Mode
                  </p>
                </div>
              </div>
              <Switch
                id="dark-mode"
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="shadow-sm border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
            <CardDescription>Manage your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card className="shadow-none border-none">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p>Whisperr</p>
              <p>Version 2.0.0</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};