"use client";

import React, { useState, useEffect, useRef } from "react";
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

  const handleClose = () => {
    setIsOpen(false);
  };

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
  }, []);

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
          className="fixed bottom-0 left-0 right-0 top-[217px] overflow-y-auto bg-black/90 text-white focus:outline-none md:top-[73px]"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-50 text-3xl text-white transition-transform duration-200 hover:scale-110 sm:right-2 sm:top-2 sm:text-2xl"
            aria-label="Close"
            type="button"
          >
            &times;
          </button>
          <div className="pt-4">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>,
    modalRoot,
  );
}
