"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ValidationError } from "~/lib/errors";

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
    throw new ValidationError("Modal root element not found");
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
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="relative h-full w-full">
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-2 top-2 z-[100] flex h-11 w-11 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Close modal"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    modalRoot
  );
}
