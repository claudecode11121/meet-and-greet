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
        className="relative w-full max-w-xl bg-[#FFFFFF] border border-[#E5E5E5] p-6 sm:p-10 text-left shadow-2xl max-h-[88vh] overflow-y-auto rounded-[2px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-5 border-b border-[#E5E5E5]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="wme-wordmark text-base text-[#111111]">WME</span>
              <span className="text-[11px] font-mono tracking-wider uppercase text-[#6B1D2F] font-semibold">
                / Confidentiality Standard
              </span>
            </div>
            <h3 id="privacy-modal-title" className="text-xl sm:text-2xl font-serif text-[#111111]">
              Privacy &amp; Data Handling Policy
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#737373] hover:text-[#111111] p-1.5 transition-colors rounded-[2px]"
            aria-label="Close privacy policy"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-5 text-sm text-[#333333] leading-relaxed font-sans">
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#111111] mb-1">
              01. Scope of Inquiry Processing
            </h4>
            <p className="text-[#555555]">
              Personal details submitted through this form—including full name, contact information, country of residence, and request notes—are processed exclusively to evaluate fan meet-and-greet interest for Keanu Reeves on behalf of talent management.
            </p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#111111] mb-1">
              02. Strict Confidentiality &amp; Security
            </h4>
            <p className="text-[#555555]">
              All submissions are treated confidentially. Information is not sold, rented, or distributed to commercial lists. Access is restricted to authorized representatives evaluating inquiries.
            </p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#111111] mb-1">
              03. Identity Verification &amp; Security Protocols
            </h4>
            <p className="text-[#555555]">
              Due to standard security protocols established for public figures, all attendees may be asked to provide standard identification should an inquiry proceed to formal scheduling consideration.
            </p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#111111] mb-1">
              04. Non-Affiliation &amp; Non-Guarantee Notice
            </h4>
            <p className="text-[#555555]">
              Submitting an inquiry does not constitute an official booking contract, ticket reservation, or confirmed appearance with Keanu Reeves.
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
