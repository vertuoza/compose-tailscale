import React, { ReactNode } from 'react';
import Button from './Button';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string; // Optional prop to control the max width
}

const Modal: React.FC<ModalProps> = ({
  title,
  onClose,
  children,
  maxWidth = 'max-w-4xl' // Default max width
}) => {
  // Handle click outside to close the modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if the backdrop itself was clicked, not its children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className={`bg-linear-dark-lighter rounded-lg border border-linear-border w-full ${maxWidth} max-h-[80vh] flex flex-col`}>
        <div className="p-4 border-b border-linear-border flex justify-between items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
