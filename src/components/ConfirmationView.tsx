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
    <div className="w-full bg-[#FFFFFF] border border-[#DAD8D1] p-8 sm:p-12 text-left shadow-sm">
      {/* Category Tag */}
      <div className="mb-4">
        <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#806746]">
          [ INTAKE REFERENCE: {data.referenceId} ]
        </span>
      </div>

      {/* Main Editorial Heading */}
      <h2 className="text-3xl sm:text-4xl font-serif text-[#191919] leading-tight mb-6">
        Thank you for your interest.
      </h2>

      {/* Confirmation Body Text as instructed */}
      <div className="space-y-4 text-sm sm:text-base text-[#55524D] leading-relaxed max-w-xl font-sans mb-8">
        <p>
          Your request has been received successfully. If further information is required, you may be contacted using the details provided.
        </p>
        <p className="text-xs sm:text-sm text-[#77736D] pt-2 border-t border-[#DAD8D1]">
          Please note that submitting this form does not guarantee a meeting.
        </p>
      </div>

      {/* Reference & Copy Row */}
      <div className="bg-[#F7F6F2] border border-[#DAD8D1] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="block text-[10px] tracking-wider uppercase text-[#77736D] font-mono">
            Submission Reference Code
          </span>
          <span className="font-mono text-base font-semibold text-[#191919] tracking-wider">
            {data.referenceId}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopyReference}
          className="btn-outline text-xs px-4 py-2 self-start sm:self-auto"
          title="Copy Reference ID"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Reference</span>
            </>
          )}
        </button>
      </div>

      {/* Summary Table */}
      <div className="border-t border-[#DAD8D1] pt-6 mb-8">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#191919] mb-4 font-mono">
          Inquiry Record Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm font-sans">
          <div className="border-b border-[#EAE8E1] pb-3">
            <span className="block text-[11px] text-[#77736D] uppercase tracking-wider mb-0.5">
              Celebrity Requested
            </span>
            <span className="font-medium text-[#191919]">{data.summary.celebrityName}</span>
          </div>

          <div className="border-b border-[#EAE8E1] pb-3">
            <span className="block text-[11px] text-[#77736D] uppercase tracking-wider mb-0.5">
              Meeting Preference
            </span>
            <span className="font-medium text-[#191919]">{data.summary.meetingType}</span>
          </div>

          <div className="border-b border-[#EAE8E1] pb-3">
            <span className="block text-[11px] text-[#77736D] uppercase tracking-wider mb-0.5">
              Number of Attendees
            </span>
            <span className="font-medium text-[#191919]">{data.summary.attendees}</span>
          </div>

          <div className="border-b border-[#EAE8E1] pb-3">
            <span className="block text-[11px] text-[#77736D] uppercase tracking-wider mb-0.5">
              Preferred Date
            </span>
            <span className="font-medium text-[#191919]">{formattedDate}</span>
          </div>

          <div className="border-b border-[#EAE8E1] pb-3 sm:col-span-2">
            <span className="block text-[11px] text-[#77736D] uppercase tracking-wider mb-0.5">
              Registered Contact
            </span>
            <span className="font-medium text-[#191919]">
              {data.summary.fullName} &lt;{data.summary.email}&gt;
            </span>
          </div>
        </div>
      </div>

      {/* Reset Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onReset}
          className="btn-outline text-xs px-6 py-3"
        >
          <span>Submit Another Request</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
