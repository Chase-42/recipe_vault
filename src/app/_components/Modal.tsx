"use client";

import { type ElementRef, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

export function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose?: () => void;
}) {
  const router = useRouter();
  const dialogRef = useRef<ElementRef<"dialog">>(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }, []);

  function onDismiss() {
    setIsOpen(false);
    setTimeout(() => {
      if (onClose) {
        onClose();
      } else {
        router.back();
      }
    }, 300);
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.dialog
          ref={dialogRef}
          className="fixed left-0 top-0 h-screen w-screen overflow-y-auto bg-black/90 text-white"
          onClose={onDismiss}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <button
            onClick={onDismiss}
            className="absolute right-4 top-4 z-50 transform text-3xl text-white transition-transform duration-200 hover:scale-110"
            aria-label="Close"
            type="button"
          >
            &times;
          </button>
          <div className="pt-4">{children}</div>
        </motion.dialog>
      )}
    </AnimatePresence>,
    document.getElementById("modal-root")!,
  );
}
