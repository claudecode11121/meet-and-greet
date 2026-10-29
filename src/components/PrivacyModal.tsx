import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#191919]/60 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#FFFFFF] border border-[#DAD8D1] p-6 sm:p-10 text-left shadow-xl max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-5 border-b border-[#DAD8D1]">
          <div>
            <span className="block text-[10px] tracking-[0.2em] uppercase font-mono text-[#806746] mb-1">
              Confidentiality Standard
            </span>
            <h3 id="privacy-modal-title" className="text-xl sm:text-2xl font-serif text-[#191919]">
              Privacy &amp; Data Handling Policy
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#77736D] hover:text-[#191919] p-1.5 transition-colors"
            aria-label="Close privacy policy"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-5 text-sm text-[#33312E] leading-relaxed font-sans">
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#191919] mb-1">
              01. Purpose of Data Collection
            </h4>
            <p className="text-[#55524D]">
              All details submitted through this inquiry form—including full name, contact information, geographic location, and message content—are collected solely to evaluate and coordinate private meet-and-greet requests on behalf of talent management.
            </p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#191919] mb-1">
              02. Non-Disclosure &amp; Security
            </h4>
            <p className="text-[#55524D]">
              Submissions are treated with strict confidentiality. Information is never sold, licensed, or shared with commercial marketing lists. Access is restricted to authorized talent relations representatives.
            </p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#191919] mb-1">
              03. Identity Verification
            </h4>
            <p className="text-[#55524D]">
              In accordance with security protocols established for public figures, all attendees may be asked to provide standard identification should a request proceed to formal scheduling.
            </p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#191919] mb-1">
              04. Retention &amp; Inquiries
            </h4>
            <p className="text-[#55524D]">
              Inquiry records are retained only for the duration necessary to review availability. You may contact guest relations at any time to request removal of your submission.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-[#DAD8D1] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline text-xs px-6 py-2.5"
          >
            Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
