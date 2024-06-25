"use client";

import { type ElementRef, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function Modal({
	children,
	onClose,
}: { children: React.ReactNode; onClose: () => void }) {
	const dialogRef = useRef<ElementRef<"dialog">>(null);

	useEffect(() => {
		if (!dialogRef.current?.open) {
			dialogRef.current?.showModal();
		}
	}, []);

	function onDismiss() {
		onClose();
	}

	return createPortal(
		<dialog
			ref={dialogRef}
			className="fixed inset-0 flex items-center justify-center bg-black/90 text-white p-4"
			onClose={onDismiss}
		>
			<div className="relative p-6 rounded-md w-full max-w-lg mx-auto">
				<button
					onClick={onDismiss}
					className="absolute top-2 right-2 text-2xl text-white"
					aria-label="Close"
					type="button"
				>
					&times;
				</button>
				{children}
			</div>
		</dialog>,
		document.getElementById("modal-root")!,
	);
}
