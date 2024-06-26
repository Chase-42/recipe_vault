"use client";

import { type ElementRef, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

interface ModalProps {
	children: React.ReactNode;
	onClose?: () => void;
}

export function Modal({ children, onClose }: ModalProps) {
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
		<dialog
			ref={dialogRef}
			className="absolute h-screen w-screen bg-black/90 text-white"
			onClose={onDismiss}
		>
			<button
				onClick={onDismiss}
				className="absolute top-4 right-4 transform text-3xl text-white transition-transform duration-200 hover:scale-110"
				aria-label="Close"
				type="button"
			>
				&times;
			</button>
			{children}
		</dialog>,
		document.getElementById("modal-root")!,
	);
}
