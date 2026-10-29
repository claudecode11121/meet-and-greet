import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, Calendar, Users, Star, Mail, ArrowRight, ShieldAlert } from 'lucide-react';

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
    <div className="w-full max-w-2xl mx-auto luxury-card p-6 sm:p-10 border border-[#c5a059]/30 text-left transition-all duration-300">
      {/* Header with Luxury Crest & Checkmark */}
      <div className="text-center pb-8 border-b border-white/10">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] mb-4">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div className="text-xs tracking-[0.25em] text-[#c5a059] uppercase font-semibold mb-2">
          Request Acknowledged
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
          Thank You, {data.summary.fullName}
        </h2>
        <p className="mt-2 text-zinc-400 text-sm sm:text-base max-w-md mx-auto font-sans leading-relaxed">
          Your meet &amp; greet inquiry has been recorded and submitted to guest relations for management review.
        </p>

        {/* Reference Code Card */}
        <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-3 bg-[#18181f] border border-[#c5a059]/30 px-5 py-3.5">
          <div className="text-left">
            <span className="block text-[11px] tracking-wider uppercase text-zinc-400 font-medium">
              Inquiry Reference ID
            </span>
            <span className="font-mono text-base font-semibold text-[#f7e2a9] tracking-wider">
              {data.referenceId}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyReference}
            className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 transition-colors uppercase tracking-wider"
            title="Copy Reference ID"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#c5a059]" />
                <span className="text-[#c5a059]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary of Inquired Details */}
      <div className="py-6 border-b border-white/10">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
          Request Summary
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-sans">
          <div className="flex items-start gap-3 p-3.5 bg-white/[0.02] border border-white/5">
            <Star className="w-4 h-4 text-[#c5a059] mt-0.5 shrink-0" />
            <div>
              <span className="block text-xs text-zinc-500 uppercase tracking-wider">Celebrity</span>
              <span className="font-medium text-white">{data.summary.celebrityName}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-white/[0.02] border border-white/5">
            <Users className="w-4 h-4 text-[#c5a059] mt-0.5 shrink-0" />
            <div>
              <span className="block text-xs text-zinc-500 uppercase tracking-wider">Meeting Type &amp; Guests</span>
              <span className="font-medium text-white">
                {data.summary.meetingType} ({data.summary.attendees})
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-white/[0.02] border border-white/5">
            <Calendar className="w-4 h-4 text-[#c5a059] mt-0.5 shrink-0" />
            <div>
              <span className="block text-xs text-zinc-500 uppercase tracking-wider">Preferred Date</span>
              <span className="font-medium text-white">{formattedDate}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-white/[0.02] border border-white/5">
            <Mail className="w-4 h-4 text-[#c5a059] mt-0.5 shrink-0" />
            <div className="overflow-hidden">
              <span className="block text-xs text-zinc-500 uppercase tracking-wider">Contact Email</span>
              <span className="font-medium text-white truncate block">{data.summary.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Crucial Notice / Disclaimer */}
      <div className="my-6 p-4 bg-[#c5a059]/5 border border-[#c5a059]/20 flex items-start gap-3 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
        <ShieldAlert className="w-5 h-5 text-[#c5a059] shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block font-medium mb-1">
            Important Notice Regarding Availability
          </strong>
          Submitting this request does not guarantee a meeting, booking, or celebrity appearance. All arrangements depend strictly on talent schedules, official management discretion, and security approvals. Our team will contact you via email if your inquiry can be scheduled.
        </div>
      </div>

      {/* Action to submit another inquiry */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onReset}
          className="btn-secondary text-sm px-6 py-3"
        >
          <span>Submit Another Request</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
