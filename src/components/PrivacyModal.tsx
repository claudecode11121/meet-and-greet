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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#000000]/60 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#FFFFFF] border border-[#E5E5E5] p-6 sm:p-10 text-left shadow-2xl max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-5 border-b border-[#E5E5E5]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="wme-wordmark text-base text-[#000000]">WME</span>
              <span className="text-[11px] font-mono tracking-wider uppercase text-[#737373]">
                / Privacy Policy
              </span>
            </div>
            <h3 id="privacy-modal-title" className="text-xl sm:text-2xl font-serif text-[#111111]">
              Data Handling &amp; Confidentiality
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#737373] hover:text-[#000000] p-1.5 transition-colors"
            aria-label="Close privacy policy"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-5 text-sm text-[#333333] leading-relaxed font-sans">
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#111111] mb-1">
              01. Purpose of Collection
            </h4>
            <p className="text-[#555555]">
              Personal details submitted through this form—including full name, contact information, geographic location, and message details—are processed solely for the evaluation and coordination of meet &amp; greet inquiries by WME (William Morris Endeavor) on behalf of represented talent.
            </p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#111111] mb-1">
              02. Strict Confidentiality
            </h4>
            <p className="text-[#555555]">
              All submissions are treated confidentially. Information is not sold, rented, or distributed to third-party commercial marketing lists. Access is restricted to authorized WME talent agents, coordinators, and designated management representatives.
            </p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#111111] mb-1">
              03. Identity Verification &amp; Security
            </h4>
            <p className="text-[#555555]">
              Due to standard security protocols for public figures and clients represented by WME, attendee credentials may be verified should an inquiry proceed to active scheduling review.
            </p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#111111] mb-1">
              04. Non-Guarantee
            </h4>
            <p className="text-[#555555]">
              Submitting an inquiry does not constitute a contract, booking agreement, ticket reservation, or commitment of celebrity appearance.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-[#E5E5E5] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline text-xs px-6 py-2.5"
          >
            Understood &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
