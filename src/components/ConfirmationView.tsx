import React, { useState } from 'react';
import { Copy, Check, ArrowRight } from 'lucide-react';

export interface SubmissionResult {
  referenceId: string;
  submittedAt: string;
  summary: {
    fullName: string;
    email: string;
    celebrityName: string;
    meetingType: string;
    attendees: string;
    preferredDate?: string | null;
  };
}

interface ConfirmationViewProps {
  data: SubmissionResult;
  onReset: () => void;
}

export const ConfirmationView: React.FC<ConfirmationViewProps> = ({ data, onReset }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyReference = () => {
    if (data.referenceId) {
      navigator.clipboard.writeText(data.referenceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formattedDate = data.summary.preferredDate
    ? new Date(data.summary.preferredDate + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Flexible / Unspecified';

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E5E5E5] p-4 sm:p-7 md:p-10 text-left shadow-sm rounded-[2px] min-w-0">
      {/* WME Brand Header Lockup */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 sm:pb-6 mb-5 sm:mb-6 border-b border-[#E5E5E5]">
        <div className="flex items-baseline gap-2 sm:gap-3">
          <span className="wme-wordmark text-xl sm:text-2xl text-[#111111]">WME</span>
          <span className="text-[11px] sm:text-xs font-mono tracking-wider uppercase text-[#737373]">
            / William Morris Endeavor
          </span>
        </div>
        <span className="text-[10px] sm:text-[11px] font-mono tracking-wider text-[#6B1D2F] font-semibold uppercase bg-[#6B1D2F]/5 px-2 py-0.5 rounded-[2px] border border-[#6B1D2F]/20">
          REF: {data.referenceId}
        </span>
      </div>

      {/* Main Heading */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#111111] leading-tight mb-4 sm:mb-5">
        Request Received
      </h2>

      {/* Required Confirmation Body Text */}
      <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-[#444444] leading-relaxed max-w-xl font-sans mb-6 sm:mb-8">
        <p>
          Thank you for your interest in meeting Keanu Reeves. Your request has been submitted successfully. If further information or an opportunity becomes available, you will be contacted using the details provided.
        </p>
        <p className="text-xs sm:text-sm text-[#737373] pt-3 border-t border-[#E5E5E5]">
          Submitting this form does not guarantee a meeting or confirm a reservation.
        </p>
      </div>

      {/* Reference ID Block */}
      <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 rounded-[2px] min-w-0">
        <div className="min-w-0">
          <span className="block text-[10px] tracking-wider uppercase text-[#737373] font-mono">
            Inquiry Reference Code
          </span>
          <span className="font-mono text-sm sm:text-base font-semibold text-[#111111] tracking-wider break-all">
            {data.referenceId}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopyReference}
          className="btn-outline text-xs px-3.5 py-2 self-start sm:self-auto shrink-0"
          title="Copy Reference ID"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#6B1D2F]" />
              <span className="text-[#6B1D2F]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Reference</span>
            </>
          )}
        </button>
      </div>

      {/* Summary of Inquired Details */}
      <div className="border-t border-[#E5E5E5] pt-5 sm:pt-6 mb-6 sm:mb-8 min-w-0">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#111111] mb-3.5 sm:mb-4 font-mono">
          Submission Summary
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-4 gap-x-6 text-sm font-sans min-w-0">
          <div className="border-b border-[#F0F0F0] pb-2.5 sm:pb-3 min-w-0">
            <span className="block text-[11px] text-[#737373] uppercase tracking-wider mb-0.5 font-mono">
              Celebrity
            </span>
            <span className="font-medium text-[#111111]">Keanu Reeves</span>
          </div>

          <div className="border-b border-[#F0F0F0] pb-2.5 sm:pb-3 min-w-0">
            <span className="block text-[11px] text-[#737373] uppercase tracking-wider mb-0.5 font-mono">
              Preferred Format
            </span>
            <span className="font-medium text-[#111111]">{data.summary.meetingType}</span>
          </div>

          <div className="border-b border-[#F0F0F0] pb-2.5 sm:pb-3 min-w-0">
            <span className="block text-[11px] text-[#737373] uppercase tracking-wider mb-0.5 font-mono">
              Attendees
            </span>
            <span className="font-medium text-[#111111]">{data.summary.attendees}</span>
          </div>

          <div className="border-b border-[#F0F0F0] pb-2.5 sm:pb-3 min-w-0">
            <span className="block text-[11px] text-[#737373] uppercase tracking-wider mb-0.5 font-mono">
              Preferred Date
            </span>
            <span className="font-medium text-[#111111]">{formattedDate}</span>
          </div>

          <div className="border-b border-[#F0F0F0] pb-2.5 sm:pb-3 sm:col-span-2 min-w-0">
            <span className="block text-[11px] text-[#737373] uppercase tracking-wider mb-0.5 font-mono">
              Contact Details
            </span>
            <span className="font-medium text-[#111111] break-words">
              {data.summary.fullName} &lt;{data.summary.email}&gt;
            </span>
          </div>
        </div>
      </div>

      {/* Reset Action */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onReset}
          className="btn-outline text-xs px-5 py-2.5 w-full sm:w-auto"
        >
          <span>Submit Another Request</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
