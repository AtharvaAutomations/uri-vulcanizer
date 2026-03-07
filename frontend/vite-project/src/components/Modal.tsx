/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
}

export default function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-xl w-[600px] max-h-[90vh] overflow-auto">
        <button
          className="absolute right-3 top-3 text-gray-500 text-xl"
          onClick={onClose}
        >
          ✖
        </button>
        {children}
      </div>
    </div>
  );
}
