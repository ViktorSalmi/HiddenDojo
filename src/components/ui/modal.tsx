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
      className="fixed inset-0 z-[300] flex items-center justify-center bg-[rgba(14,14,14,0.48)] p-4 backdrop-blur-[3px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`panel w-full rounded-[22px] p-7 shadow-[0_22px_80px_rgba(0,0,0,0.18)] ${widthClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
