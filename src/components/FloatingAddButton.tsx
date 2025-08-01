import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingAddButtonProps {
  onClick: () => void;
  className?: string;
}

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({
  onClick,
  className,
}) => {
  return (
    <motion.div
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "md:bottom-8 md:right-8",
        className,
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        delay: 0.2,
      }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-40 animate-pulse" />

      {/* Main button */}
      <Button
        onClick={onClick}
        size="icon"
        className="relative h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-2xl shadow-blue-500/25 border-0 transition-all duration-300"
      >
        <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
          <Plus className="h-6 w-6" />
        </motion.div>
      </Button>

      {/* Ripple effect */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-blue-500/30"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary ripple */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-purple-500/20"
        animate={{
          scale: [1, 2, 1],
          opacity: [0.2, 0, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      {/* Floating icons animation */}
      <motion.div
        className="absolute -top-2 -right-2 text-yellow-400"
        animate={{
          y: [-5, -15, -5],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Sparkles className="h-4 w-4" />
      </motion.div>
    </motion.div>
  );
};
