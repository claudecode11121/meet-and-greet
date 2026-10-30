import React from 'react';

export const VALID_STATUSES = [
  'Submitted',
  'Under Review',
  'Awaiting Response',
  'Approved',
  'Confirmed',
  'Rejected',
  'Cancelled'
] as const;

export type StatusType = (typeof VALID_STATUSES)[number];

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || '').toLowerCase().replace(/_/g, ' ');

  let classes = 'bg-[#F4F4F5] text-[#3F3F46] border-[#E4E4E7]';
  let dotColor = 'bg-[#71717A]';

  if (norm.includes('submitted')) {
    classes = 'bg-[#F4F4F5] text-[#27272A] border-[#D4D4D8]';
    dotColor = 'bg-[#71717A]';
  } else if (norm.includes('under review')) {
    classes = 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]';
    dotColor = 'bg-[#D97706]';
  } else if (norm.includes('awaiting response')) {
    classes = 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]';
    dotColor = 'bg-[#3B82F6]';
  } else if (norm.includes('approved')) {
    classes = 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]';
    dotColor = 'bg-[#10B981]';
  } else if (norm.includes('confirmed')) {
    classes = 'bg-[#6B1D2F]/10 text-[#6B1D2F] border-[#6B1D2F]/30 font-semibold';
    dotColor = 'bg-[#6B1D2F]';
  } else if (norm.includes('rejected')) {
    classes = 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]';
    dotColor = 'bg-[#9CA3AF]';
  } else if (norm.includes('cancelled')) {
    classes = 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]';
    dotColor = 'bg-[#DC2626]';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider border rounded-[2px] shrink-0 ${padding} ${classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{status}</span>
    </span>
  );
};
