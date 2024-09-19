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
      onClose ? onClose() : router.back();
    }, 300);
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.dialog
          ref={dialogRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 text-white"
          onClose={onDismiss}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="relative mx-auto w-full max-w-5xl">
            <button
              onClick={onDismiss}
              className="absolute right-4 top-4 z-50 text-3xl text-white transition-transform duration-200 hover:scale-110"
              aria-label="Close"
              type="button"
            >
              &times;
            </button>
            <div className="mt-12 max-h-[calc(100vh-100px)] overflow-y-auto">
              {children}
            </div>
          </div>
        </motion.dialog>
      )}
    </AnimatePresence>,
    document.getElementById("modal-root")!,
  );
}
