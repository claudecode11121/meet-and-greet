import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg luxury-card rounded-2xl p-6 sm:p-8 text-left border border-[#c5a059]/40 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#c5a059]/10 text-[#c5a059]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 id="privacy-modal-title" className="text-xl font-serif font-bold text-white tracking-wide">
              Privacy & Confidentiality Policy
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
            aria-label="Close privacy policy"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm text-zinc-300 leading-relaxed font-sans">
          <p>
            <strong className="text-white">1. Confidentiality of Submissions</strong><br />
            All personal information submitted through this request form—including full name, email, phone number, and location—is held under strict non-disclosure standards. Information is accessed exclusively by authorized talent relations representatives for the sole purpose of evaluating and coordinating meet &amp; greet inquiries.
          </p>

          <p>
            <strong className="text-white">2. No Unsolicited Distribution</strong><br />
            We never sell, lease, or transmit your private details to commercial marketing lists or unauthorized third-party affiliates.
          </p>

          <p>
            <strong className="text-white">3. Security &amp; Talent Safety</strong><br />
            Due to security protocols surrounding public figures and celebrities, submitted details may undergo routine identity verification prior to scheduling confirmation.
          </p>

          <p>
            <strong className="text-white">4. Communication</strong><br />
            You will only be contacted regarding the status, eligibility, or logistical arrangements of your specific meet &amp; greet inquiry.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-sm px-5 py-2.5"
          >
            Understood &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
