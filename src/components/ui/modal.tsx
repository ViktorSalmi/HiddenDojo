import { useEffect } from "react";

type ModalProps = {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  widthClassName?: string;
};

export function Modal({
  children,
  isOpen,
  onClose,
  widthClassName = "max-w-[440px]",
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full rounded-[14px] bg-[var(--surface)] p-7 shadow-[0_16px_60px_rgba(0,0,0,0.2)] ${widthClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
