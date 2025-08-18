"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "~/lib/utils";

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  className?: string;
}

interface DrawerContentProps {
  children: React.ReactNode;
  className?: string;
  side?: "left" | "right" | "top" | "bottom";
  onClose: () => void;
}

const DrawerContent = React.forwardRef<HTMLDivElement, DrawerContentProps>(
  ({ children, className, side = "bottom", onClose }, ref) => {
    const sideVariants = {
      left: {
        initial: { x: "-100%" },
        animate: { x: 0 },
        exit: { x: "-100%" },
      },
      right: {
        initial: { x: "100%" },
        animate: { x: 0 },
        exit: { x: "100%" },
      },
      top: {
        initial: { y: "-100%" },
        animate: { y: 0 },
        exit: { y: "-100%" },
      },
      bottom: {
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%" },
      },
    };

    const sideClasses = {
      left: "left-0 top-0 h-full w-80 max-w-[80vw]",
      right: "right-0 top-0 h-full w-80 max-w-[80vw]",
      top: "top-0 left-0 w-full h-80 max-h-[80vh]",
      bottom: "bottom-0 left-0 w-full h-[70vh] max-h-[70vh] rounded-t-lg",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "fixed z-50 bg-background border shadow-lg",
          sideClasses[side],
          className
        )}
        initial={sideVariants[side].initial}
        animate={sideVariants[side].animate}
        exit={sideVariants[side].exit}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {/* Drag handle for bottom drawer */}
        {side === "bottom" && (
          <div className="flex justify-center pt-2 pb-4">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        )}

        {children}
      </motion.div>
    );
  }
);
DrawerContent.displayName = "DrawerContent";

const DrawerOverlay = React.forwardRef<
  HTMLDivElement,
  { className?: string; onClick?: () => void }
>(({ className, onClick }, ref) => (
  <motion.div
    ref={ref}
    className={cn("fixed inset-0 z-40 bg-black/50", className)}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    onClick={onClick}
  />
));
DrawerOverlay.displayName = "DrawerOverlay";

export function Drawer({ open, onOpenChange, children, side = "bottom", className }: DrawerProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [open, onOpenChange]);

  if (!mounted) {
    return null;
  }

  const portalRoot = document.getElementById("modal-root") ?? document.body;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <DrawerOverlay onClick={() => onOpenChange(false)} />
          <DrawerContent
            side={side}
            className={className}
            onClose={() => onOpenChange(false)}
          >
            {children}
          </DrawerContent>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}