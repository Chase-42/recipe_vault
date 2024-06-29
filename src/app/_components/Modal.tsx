"use client";

import { type ElementRef, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

export function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose?: () => void;
}) {
  const router = useRouter();
  const dialogRef = useRef<ElementRef<"dialog">>(null);

  useEffect(() => {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }, []);

  function onDismiss() {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  }

  return createPortal(
    <motion.dialog
      ref={dialogRef}
      className="fixed h-screen w-screen bg-black/90 text-white"
      onClose={onDismiss}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <button
        onClick={onDismiss}
        className="absolute right-4 z-50 transform text-3xl text-white transition-transform duration-200 hover:scale-110"
        aria-label="Close"
        type="button"
      >
        &times;
      </button>
      {children}
    </motion.dialog>,
    document.getElementById("modal-root")!,
  );
}
