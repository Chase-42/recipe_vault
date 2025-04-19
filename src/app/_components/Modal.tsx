"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export function Modal({ children, onClose }: ModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<Element | null>(null);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    previouslyFocusedElement.current = document.activeElement;
    if (modalRef.current) {
      modalRef.current.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocusedElement.current instanceof HTMLElement) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [handleClose]);

  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) {
    throw new Error("Modal root element not found");
  }

  return createPortal(
    <AnimatePresence
      onExitComplete={() => {
        onClose ? onClose() : router.back();
      }}
    >
      {isOpen && (
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          className="pointer-events-auto fixed inset-0 z-50 flex h-full items-center justify-center bg-black/90 text-white focus:outline-none"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <button
            onClick={handleClose}
            className="absolute right-1 top-0 z-50 animate-fade-in-down text-xl text-[hsl(var(--recipe-red))] transition-all duration-200 hover:scale-110 hover:opacity-80 sm:right-2 sm:top-1 sm:text-3xl"
            aria-label="Close"
            type="button"
          >
            &times;
          </button>

          <div className="h-full w-full">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>,
    modalRoot,
  );
}
