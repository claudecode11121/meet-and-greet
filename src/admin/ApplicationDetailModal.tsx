import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Video,
  FileText,
  ShieldCheck,
  Clock,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Send,
  Loader2,
  ExternalLink,
  CreditCard,
  PenTool,
  ZoomIn,
  Lock,
  KeyRound,
  Eye
} from 'lucide-react';
import { StatusBadge, VALID_STATUSES, StatusType } from './StatusBadge';

export interface ApplicationRecord {
  referenceId: string;
  submittedAt: string;
  status: string;
  statusHistory?: Array<{
    fromStatus: string | null;
    toStatus: string;
    timestamp: string;
    changedBy: string;
    reason?: string;
  }>;
  internalNotes?: Array<{
    id: string;
    text: string;
    createdAt: string;
    authorName: string;
    authorEmail: string;
  }>;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    country: string;
    city: string;
  };
  meetAndGreetInfo: {
    celebrityName: string;
    meetingType: string;
    preferredDate?: string | null;
    attendees: string;
    reason?: string;
    message?: string;
  };
  identification?: {
    idType: string;
    idNumber: string;
    idCountry: string;
    idDocumentData?: string;
    idFileName?: string;
    idFileSize?: string;
  };
  signature?: {
    signatureType: 'drawn' | 'typed';
    signatureData: string;
    signeeName: string;
    signedAt: string;
  };
  confirmations?: {
    confirmedAccurate: boolean;
    acknowledgedPrivacy: boolean;
    consentTimestamp: string;
  };
}

interface ApplicationDetailModalProps {
  referenceId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: (referenceId: string, newStatus: string) => void;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  referenceId,
  isOpen,
  onClose,
  onStatusUpdated
}) => {
  const [data, setData] = useState<ApplicationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status update state
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusReason, setStatusReason] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusConfirmPending, setStatusConfirmPending] = useState(false);
  const [statusSuccessMessage, setStatusSuccessMessage] = useState<string | null>(null);

  // Note state
  const [newNoteText, setNewNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteSuccessMessage, setNoteSuccessMessage] = useState<string | null>(null);

  // Government ID Inspection Modal state
  const [isInspectingId, setIsInspectingId] = useState(false);

  // VIP Access Card & OATH Activation state
  const [cardActivated, setCardActivated] = useState<boolean>(false);
  const [cardPayment, setCardPayment] = useState<any>(null);
  const [isTogglingCard, setIsTogglingCard] = useState<boolean>(false);
  const [showAdminGiftCardModal, setShowAdminGiftCardModal] = useState<boolean>(false);
  const [adminSelectedImage, setAdminSelectedImage] = useState<string | null>(null);

  // Check card activation status
  useEffect(() => {
    if (referenceId) {
      fetch('/api/card/status/WME-KR26-0813-VIP')
        .then(res => res.json())
        .then(resData => {
          if (resData.success) {
            setCardActivated(Boolean(resData.activated));
            setCardPayment(resData.payment || null);
          } else {
            setCardActivated(false);
            setCardPayment(null);
          }
        })
        .catch(() => {});
    }
  }, [referenceId, isOpen]);

  const handleToggleCardActivation = async () => {
    setIsTogglingCard(true);
    try {
      if (cardActivated) {
        await fetch('/api/card/deactivate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: 'WME-KR26-0813-VIP' })
        });
        setCardActivated(false);
      } else {
        const res = await fetch('/api/card/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: 'WME-KR26-0813-VIP', pin: '813-026', adminOverride: true })
        });
        const d = await res.json();
        if (d.success) {
          setCardActivated(true);
          if (d.activation?.payment) {
            setCardPayment(d.activation.payment);
          }
        }
      }
    } catch (err) {
      console.error('Failed to toggle card activation:', err);
    } finally {
      setIsTogglingCard(false);
    }
  };

  // Fetch application detail whenever referenceId changes
  useEffect(() => {
    if (!isOpen || !referenceId) {
      setData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('wme_admin_token') || '';
        const res = await fetch(`/api/admin/submissions/${referenceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error('Failed to load application details.');
        }

        const json = await res.json();
        if (isMounted) {
          setData(json.submission);
          setSelectedStatus(json.submission.status);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'An error occurred while loading application.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [isOpen, referenceId]);

  // Handle escape key
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

  // Handle status select change
  const handleStatusSelectChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    // If selecting a high impact status (Approved, Confirmed, Rejected, Cancelled), show confirmation prompt
    if (['Approved', 'Confirmed', 'Rejected', 'Cancelled'].includes(newStatus)) {
      setStatusConfirmPending(true);
    } else {
      setStatusConfirmPending(false);
    }
  };

  // Submit status update
  const handleUpdateStatus = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!referenceId || !selectedStatus) return;

    setIsUpdatingStatus(true);
    setStatusSuccessMessage(null);
    try {
      const token = localStorage.getItem('wme_admin_token') || '';
      const res = await fetch(`/api/admin/submissions/${referenceId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: selectedStatus,
          reason: statusReason
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update status.');
      }

      setData(json.submission);
      setStatusConfirmPending(false);
      setStatusReason('');
      setStatusSuccessMessage(`Status updated to ${selectedStatus}.`);
      if (onStatusUpdated) {
        onStatusUpdated(referenceId, selectedStatus);
      }
      setTimeout(() => setStatusSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Add internal note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceId || !newNoteText.trim()) return;

    setIsAddingNote(true);
    setNoteSuccessMessage(null);
    try {
      const token = localStorage.getItem('wme_admin_token') || '';
      const res = await fetch(`/api/admin/submissions/${referenceId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newNoteText.trim() })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to add note.');
      }

      if (data) {
        setData({
          ...data,
          internalNotes: json.notes
        });
      }
      setNewNoteText('');
      setNoteSuccessMessage('Internal note added.');
      setTimeout(() => setNoteSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error saving internal note');
    } finally {
      setIsAddingNote(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 border-l border-[#E5E5E5] animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#E5E5E5] bg-[#FBFBFA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-wider text-[#666666] bg-white border border-[#E5E5E5] px-2 py-0.5 rounded-xs">
              {data ? data.referenceId : referenceId}
            </span>
            {data && <StatusBadge status={data.status} />}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#666666] hover:text-[#111111] hover:bg-[#EAEAEA] rounded-xs transition-colors"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && (
            <div className="py-20 flex flex-col items-center justify-center text-[#666666]">
              <Loader2 className="w-6 h-6 animate-spin text-[#6B1D2F] mb-2" />
              <p className="text-xs font-mono">Retrieving application details from intake records...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xs text-[#991B1B] text-xs">
              {error}
            </div>
          )}

          {data && (
            <>
              {/* Applicant Header Lockup */}
              <div className="border border-[#E5E5E5] bg-[#FFFFFF] p-5 rounded-xs">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#F0F0F0] pb-3 mb-4">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[#111111] tracking-tight">
                      {data.personalInfo.fullName}
                    </h2>
                    <p className="text-xs text-[#666666] font-mono mt-0.5">
                      Submitted on {new Date(data.submittedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-xs font-mono text-[#444444] bg-[#F5F5F5] px-2.5 py-1 rounded-xs inline-flex items-center gap-1.5 self-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                    Celebrity: <strong className="text-[#111111]">{data.meetAndGreetInfo.celebrityName}</strong>
                  </div>
                </div>

                {/* Personal Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[#444444]">
                    <Mail className="w-3.5 h-3.5 text-[#888888] shrink-0" />
                    <a
                      href={`mailto:${data.personalInfo.email}`}
                      className="text-[#111111] hover:text-[#6B1D2F] hover:underline font-mono"
                    >
                      {data.personalInfo.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-[#444444]">
                    <Phone className="w-3.5 h-3.5 text-[#888888] shrink-0" />
                    <span className="font-mono">{data.personalInfo.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#444444]">
                    <MapPin className="w-3.5 h-3.5 text-[#888888] shrink-0" />
                    <span>{data.personalInfo.city}, {data.personalInfo.country}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#444444]">
                    <Users className="w-3.5 h-3.5 text-[#888888] shrink-0" />
                    <span>Party Size: <strong className="text-[#111111]">{data.meetAndGreetInfo.attendees}</strong></span>
                  </div>
                </div>
              </div>

              {/* Event & Preference Details */}
              <div className="border border-[#E5E5E5] bg-[#FFFFFF] p-5 rounded-xs space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#666666] font-semibold">
                  Meet & Greet Preferences
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-[#FBFBFA] border border-[#EEEEEE] rounded-xs">
                    <span className="text-[#777777] block text-[11px] mb-1">Preferred Meeting Format</span>
                    <span className="font-medium text-[#111111] text-sm">
                      {data.meetAndGreetInfo.meetingType || 'No preference indicated'}
                    </span>
                  </div>
                  <div className="p-3 bg-[#FBFBFA] border border-[#EEEEEE] rounded-xs">
                    <span className="text-[#777777] block text-[11px] mb-1">Preferred Date</span>
                    <span className="font-medium text-[#111111] text-sm">
                      {data.meetAndGreetInfo.preferredDate
                        ? new Date(data.meetAndGreetInfo.preferredDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'Flexible / Any available date'}
                    </span>
                  </div>
                </div>

                {/* Why Keanu Reeves Statement */}
                <div>
                  <span className="text-[11px] font-mono uppercase text-[#777777] block mb-1.5">
                    Fan Statement (Why Keanu Reeves?)
                  </span>
                  <div className="p-3.5 bg-[#FAF9F6] border-l-2 border-[#6B1D2F] border-y border-r border-[#EEEEEE] text-xs text-[#222222] leading-relaxed italic whitespace-pre-line rounded-r-xs">
                    {data.meetAndGreetInfo.reason ? `"${data.meetAndGreetInfo.reason}"` : <span className="text-[#999999] not-italic">No statement provided.</span>}
                  </div>
                </div>

                {/* Additional Message */}
                {data.meetAndGreetInfo.message && (
                  <div>
                    <span className="text-[11px] font-mono uppercase text-[#777777] block mb-1.5">
                      Additional Message
                    </span>
                    <div className="p-3 bg-[#FFFFFF] border border-[#E5E5E5] text-xs text-[#333333] leading-relaxed whitespace-pre-line rounded-xs">
                      {data.meetAndGreetInfo.message}
                    </div>
                  </div>
                )}

                {/* Compliance & Consent */}
                <div className="pt-2 border-t border-[#F0F0F0] flex flex-wrap gap-4 text-[11px] text-[#666666]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Information certified accurate by fan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>WME Privacy Policy acknowledged</span>
                  </div>
                </div>
              </div>

              {/* Government Identification & Vetting */}
              <div className="border border-[#E5E5E5] bg-[#FFFFFF] p-5 rounded-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#666666] font-semibold flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-[#6B1D2F]" />
                    <span>Government Identification & Vetting</span>
                  </h3>
                  {data.identification?.idDocumentData ? (
                    <span className="text-[10px] font-mono text-[#15803D] bg-[#F0FDF4] px-2 py-0.5 border border-[#BBF7D0] rounded-xs inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                      <span>ID Attached & Encrypted</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[#737373] bg-[#F5F5F5] px-2 py-0.5 rounded-xs">
                      Pre-verification record
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#FBFBFA] border border-[#EEEEEE] rounded-xs">
                    <span className="text-[#777777] block text-[11px] mb-1">Document Type</span>
                    <span className="font-medium text-[#111111]">
                      {data.identification?.idType || 'Not specified'}
                    </span>
                  </div>
                  <div className="p-3 bg-[#FBFBFA] border border-[#EEEEEE] rounded-xs">
                    <span className="text-[#777777] block text-[11px] mb-1">Document Number</span>
                    <span className="font-mono font-medium text-[#111111]">
                      {data.identification?.idNumber || '—'}
                    </span>
                  </div>
                  <div className="p-3 bg-[#FBFBFA] border border-[#EEEEEE] rounded-xs">
                    <span className="text-[#777777] block text-[11px] mb-1">Issuing Jurisdiction</span>
                    <span className="font-medium text-[#111111]">
                      {data.identification?.idCountry || data.personalInfo.country || '—'}
                    </span>
                  </div>
                </div>

                {/* ID Document Scan / Card Image */}
                {data.identification?.idDocumentData ? (
                  <div className="p-3 bg-[#FAF9F6] border border-[#EEEEEE] rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => setIsInspectingId(true)}
                        className="w-16 h-12 bg-white border border-[#D4D4D8] rounded-xs overflow-hidden shrink-0 cursor-pointer group relative shadow-2xs"
                        title="Click to enlarge"
                      >
                        <img
                          src={data.identification.idDocumentData}
                          alt="Government ID thumbnail"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ZoomIn className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#111111]">
                          {data.identification.idFileName || 'Government ID Card Photo'}
                        </div>
                        <div className="text-[11px] font-mono text-[#666666]">
                          {data.identification.idFileSize || 'Encrypted File'} • Photo Match Ready
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn-admin-inspect-id"
                      onClick={() => setIsInspectingId(true)}
                      className="btn-outline text-[11px] py-1.5 px-3 self-end sm:self-auto inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect ID Document</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-[#FAFAFA] border border-dashed border-[#DDDDDD] rounded-xs text-center text-xs text-[#888888]">
                    No government-issued ID image was provided for this application record.
                  </div>
                )}
              </div>

              {/* Legal Execution & Digital Signature */}
              <div className="border border-[#E5E5E5] bg-[#FFFFFF] p-5 rounded-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#666666] font-semibold flex items-center gap-2">
                    <PenTool className="w-3.5 h-3.5 text-[#6B1D2F]" />
                    <span>Legal Execution & Digital Signature</span>
                  </h3>
                  {data.signature?.signatureData ? (
                    <span className="text-[10px] font-mono text-[#15803D] bg-[#F0FDF4] px-2 py-0.5 border border-[#BBF7D0] rounded-xs inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                      <span>Legally Executed ({data.signature.signatureType})</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[#737373] bg-[#F5F5F5] px-2 py-0.5 rounded-xs">
                      Pre-verification record
                    </span>
                  )}
                </div>

                {data.signature?.signatureData ? (
                  <div className="space-y-3">
                    {/* Visual Signature Panel */}
                    <div className="p-4 bg-[#FAF9F6] border border-[#E5E5E5] rounded-xs">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777]">
                          Applicant Signature Record ({data.signature.signatureType === 'typed' ? 'Formal E-Sign' : 'Drawn Signature'})
                        </span>
                        <span className="text-[10px] font-mono text-[#6B1D2F]">
                          Certified Verifiable
                        </span>
                      </div>
                      <div className="min-h-[70px] bg-white border border-[#EAEAEA] p-3 rounded-xs flex items-center justify-center">
                        <img
                          src={data.signature.signatureData}
                          alt="Applicant Signature"
                          className="max-h-20 max-w-full object-contain"
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] font-mono text-[#555555]">
                        <span>Signee: <strong className="text-[#111111]">{data.signature.signeeName || data.personalInfo.fullName}</strong></span>
                        <span>Executed: {new Date(data.signature.signedAt || data.submittedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-[#F9FAFB] border border-[#EEEEEE] rounded-xs text-[11px] text-[#666666] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
                      <span>Affirmed under penalty of false representation with matching government ID declaration.</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-[#FAFAFA] border border-dashed border-[#DDDDDD] rounded-xs text-center text-xs text-[#888888]">
                    No digital signature recorded for this candidate inquiry.
                  </div>
                )}
              </div>

              {/* VIP Access Card & OATH Activation */}
              <div className="border border-[#D4AF37]/50 bg-[#0C0C12] text-white p-5 rounded-xs space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#F3E5AB] font-semibold">
                      VIP Access Pass &amp; OATH PIN Activation
                    </h3>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-xs font-semibold uppercase ${
                    cardActivated 
                      ? 'bg-[#22C55E]/20 text-[#4ADE80] border border-[#22C55E]/40' 
                      : 'bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/40'
                  }`}>
                    {cardActivated ? 'OATH ACTIVATED' : 'PENDING ACTIVATION'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-2.5 bg-[#14141E] border border-[#262638] rounded-xs">
                    <span className="text-[#888899] block text-[10px] uppercase">Credential Ref</span>
                    <span className="font-semibold text-white">WME-KR26-0813-VIP</span>
                  </div>
                  <div className="p-2.5 bg-[#14141E] border border-[#262638] rounded-xs">
                    <span className="text-[#888899] block text-[10px] uppercase">Generated PIN</span>
                    <span className="font-bold text-[#F3E5AB] text-sm tracking-wider">813-026</span>
                  </div>
                  <div className="p-2.5 bg-[#14141E] border border-[#262638] rounded-xs">
                    <span className="text-[#888899] block text-[10px] uppercase">Security Standard</span>
                    <span className="text-[#A1A1AA]">OATH RFC-4226 / AES-256</span>
                  </div>
                </div>

                {/* Gift Card Payment Accreditation Status */}
                <div className="p-3 bg-[#12121A] border border-[#222232] rounded-xs space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
                      VIP Accreditation Fee Payment
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-xs font-bold uppercase ${
                      cardPayment && cardPayment.status === 'VERIFIED'
                        ? 'bg-[#22C55E]/15 text-[#4ADE80] border border-[#22C55E]/30'
                        : 'bg-[#D4AF37]/15 text-[#F3E5AB] border border-[#D4AF37]/30'
                    }`}>
                      {cardPayment && cardPayment.status === 'VERIFIED' ? 'GIFT CARD VERIFIED' : 'PAYMENT PENDING'}
                    </span>
                  </div>

                  {cardPayment && (cardPayment.status === 'VERIFIED' || cardPayment.totalPaid > 0) ? (
                    <div className="text-[11px] text-[#86EFAC] space-y-2 pt-1 font-mono">
                      <div className="flex items-center justify-between">
                        <span>TOTAL CREDITED:</span>
                        <strong className="text-white text-xs">${cardPayment.totalPaid || cardPayment.amount}.00 {cardPayment.currency || 'USD'}</strong>
                      </div>
                      
                      {Array.isArray(cardPayment.cards) && cardPayment.cards.length > 0 ? (
                        <div className="pt-2 space-y-1.5 border-t border-[#262638]">
                          <span className="text-[10px] text-[#A1A1AA] block uppercase">
                            Accredited Vouchers ({cardPayment.cards.length}):
                          </span>
                          {cardPayment.cards.map((c: any, idx: number) => (
                            <div key={c.id || idx} className="bg-[#09090F] p-2 rounded-xs border border-[#202030] flex items-center justify-between text-[10px]">
                              <div>
                                <span className="text-white font-bold">{c.giftCardType}</span>
                                <span className="text-[#4ADE80] font-semibold ml-1.5">+${c.amount}.00</span>
                                <div className="text-[#F3E5AB] font-mono mt-0.5">{c.giftCardCodeMasked} {c.giftCardPin ? `• PIN: ${c.giftCardPin}` : ''}</div>
                              </div>
                              {c.giftCardImage && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAdminSelectedImage(c.giftCardImage);
                                    setShowAdminGiftCardModal(true);
                                  }}
                                  className="flex items-center gap-1 text-[#D4AF37] hover:underline cursor-pointer"
                                >
                                  <img src={c.giftCardImage} alt="Card Scan" className="w-6 h-4 object-cover rounded border border-[#D4AF37]/40" />
                                  <Eye className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          <div>PROVIDER: <strong className="text-white">{cardPayment.giftCardType}</strong> (${cardPayment.amount} {cardPayment.currency})</div>
                          <div>CLAIM CODE: <span className="text-[#F3E5AB]">{cardPayment.giftCardCodeMasked || cardPayment.giftCardCode}</span> {cardPayment.giftCardPin ? `• PIN: ${cardPayment.giftCardPin}` : ''}</div>
                          {cardPayment.giftCardImage && (
                            <div className="pt-2 mt-1 border-t border-[#262638] flex items-center justify-between">
                              <span className="text-[10px] text-[#A1A1AA]">GIFT CARD PROOF:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminSelectedImage(cardPayment.giftCardImage);
                                  setShowAdminGiftCardModal(true);
                                }}
                                className="inline-flex items-center gap-1.5 text-[11px] text-[#D4AF37] hover:underline cursor-pointer"
                              >
                                <img
                                  src={cardPayment.giftCardImage}
                                  alt="Card Proof Thumbnail"
                                  className="w-7 h-5 object-cover rounded border border-[#D4AF37]/50"
                                />
                                <Eye className="w-3.5 h-3.5" />
                                <span>Inspect Card Photo</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-[10px] text-[#666677]">PAYMENT ID: {cardPayment.paymentId} • {new Date(cardPayment.paidAt).toLocaleString()}</div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#A1A1AA] pt-1">
                      Required Deposit: <strong className="text-[#F3E5AB]">$500.00 USD</strong> via accepted Gift Card prior to VIP venue admittance.
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#222230]">
                  <a
                    href="/verify?ref=WME-KR26-0813-VIP&guest=Brenda+Wright&pin=813-026"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-[#D4AF37] hover:underline flex items-center gap-1.5"
                  >
                    <span>Open VIP Pass &amp; Activation Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={handleToggleCardActivation}
                    disabled={isTogglingCard}
                    className={`text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-xs transition-colors font-semibold flex items-center gap-1.5 ${
                      cardActivated
                        ? 'bg-[#1C1C24] text-[#A1A1AA] hover:text-[#DC2626] border border-[#333344]'
                        : 'bg-[#D4AF37] text-black hover:bg-[#F3E5AB]'
                    }`}
                  >
                    {isTogglingCard ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : cardActivated ? (
                      <span>Deactivate Pass</span>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Activate via PIN 813-026</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Update & Workflow Management */}
              <div className="border border-[#E5E5E5] bg-[#FFFFFF] p-5 rounded-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#666666] font-semibold">
                    Application Workflow & Status
                  </h3>
                  <span className="text-[11px] font-mono text-[#888888]">Current: {data.status}</span>
                </div>

                {statusSuccessMessage && (
                  <div className="p-2.5 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs rounded-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{statusSuccessMessage}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <label htmlFor="status-select" className="block text-xs font-medium text-[#333333]">
                    Change Status To:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      id="status-select"
                      value={selectedStatus}
                      onChange={(e) => handleStatusSelectChange(e.target.value)}
                      className="border border-[#CCCCCC] bg-white px-3 py-2 text-xs text-[#111111] rounded-xs focus:outline-none focus:border-[#6B1D2F] flex-1 font-mono"
                    >
                      {VALID_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st} {st === data.status ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>

                    {!statusConfirmPending && selectedStatus !== data.status && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus()}
                        disabled={isUpdatingStatus}
                        className="btn-primary text-xs py-2 px-4 whitespace-nowrap self-start"
                      >
                        {isUpdatingStatus ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          'Save Status'
                        )}
                      </button>
                    )}
                  </div>

                  {/* Confirmation Dialog for High Impact Statuses */}
                  {statusConfirmPending && selectedStatus !== data.status && (
                    <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xs space-y-2.5 mt-2">
                      <div className="flex items-start gap-2 text-xs text-[#92400E]">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-[#D97706] mt-0.5" />
                        <div>
                          <strong className="font-semibold">Confirm Status Transition to "{selectedStatus}"</strong>
                          <p className="mt-0.5 text-[11px] leading-relaxed">
                            {selectedStatus === 'Approved' && 'This candidate will be marked as Approved for review and potential scheduling. Note: Approval is separate from Final Confirmation.'}
                            {selectedStatus === 'Confirmed' && 'This candidate will be locked in as Confirmed for the Keanu Reeves meet-and-greet schedule.'}
                            {selectedStatus === 'Rejected' && 'This request will be designated as not moving forward.'}
                            {selectedStatus === 'Cancelled' && 'This request will be marked as cancelled.'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="status-reason" className="block text-[11px] font-mono text-[#78350F] mb-1">
                          Audit Trail Reason / Justification (Required for this transition):
                        </label>
                        <input
                          id="status-reason"
                          type="text"
                          value={statusReason}
                          onChange={(e) => setStatusReason(e.target.value)}
                          placeholder="e.g. Schedule verified by talent team / Over capacity"
                          className="w-full border border-[#FCD34D] bg-white px-2.5 py-1.5 text-xs text-[#111111] rounded-xs focus:outline-none focus:border-[#6B1D2F]"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus()}
                          disabled={isUpdatingStatus}
                          className="bg-[#6B1D2F] text-white hover:bg-[#521624] text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-xs transition-colors"
                        >
                          {isUpdatingStatus ? 'Recording...' : `Confirm & Update to ${selectedStatus}`}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStatus(data.status);
                            setStatusConfirmPending(false);
                            setStatusReason('');
                          }}
                          className="text-xs text-[#666666] hover:text-[#111111] px-2 py-1.5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Audit History Timeline */}
                <div className="pt-3 border-t border-[#F0F0F0]">
                  <span className="text-[11px] font-mono uppercase text-[#777777] block mb-2">
                    Status Change History
                  </span>
                  <div className="space-y-2">
                    {(data.statusHistory && data.statusHistory.length > 0) ? (
                      data.statusHistory.map((hist, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[11px] font-mono bg-[#FAFAFA] p-2 rounded-xs border border-[#EEEEEE]">
                          <Clock className="w-3.5 h-3.5 text-[#888888] shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#111111]">
                                {hist.fromStatus ? `${hist.fromStatus} → ` : ''}{hist.toStatus}
                              </span>
                              <span className="text-[#888888]">
                                {new Date(hist.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className="text-[#666666] mt-0.5">
                              By {hist.changedBy} {hist.reason ? `— Note: "${hist.reason}"` : ''}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#888888]">No status changes recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Private Staff Internal Notes */}
              <div className="border border-[#E5E5E5] bg-[#FFFFFF] p-5 rounded-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#6B1D2F]" />
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#666666] font-semibold">
                      Private Internal Notes
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono bg-[#F5F5F5] text-[#555555] px-2 py-0.5 rounded-xs">
                    Confidential · Visible to WME Staff Only
                  </span>
                </div>

                {noteSuccessMessage && (
                  <div className="p-2 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs rounded-xs flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{noteSuccessMessage}</span>
                  </div>
                )}

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Add an internal staff note (e.g. Identity verified, VIP flag, special accommodations requested)..."
                    className="w-full border border-[#CCCCCC] bg-white p-2.5 text-xs text-[#111111] rounded-xs focus:outline-none focus:border-[#6B1D2F]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isAddingNote || !newNoteText.trim()}
                      className="bg-[#111111] hover:bg-[#333333] disabled:opacity-50 text-white text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-xs flex items-center gap-1.5 transition-colors"
                    >
                      {isAddingNote ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      <span>Record Note</span>
                    </button>
                  </div>
                </form>

                {/* Notes List */}
                <div className="space-y-2.5 pt-2">
                  {(data.internalNotes && data.internalNotes.length > 0) ? (
                    data.internalNotes.map((note) => (
                      <div key={note.id} className="p-3 bg-[#FAF9F6] border border-[#E9E8E4] rounded-xs text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono text-[#777777] border-b border-[#EAE9E4] pb-1">
                          <span className="font-semibold text-[#111111]">{note.authorName} ({note.authorEmail})</span>
                          <span>
                            {new Date(note.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-[#222222] whitespace-pre-line pt-0.5 leading-relaxed">
                          {note.text}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#888888] italic py-2 text-center">
                      No internal notes recorded for this application yet.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5E5E5] bg-[#FBFBFA] flex items-center justify-between text-xs">
          <span className="font-mono text-[#888888] text-[11px]">
            WME Talent Management System
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs py-1.5 px-4"
          >
            Close Panel
          </button>
        </div>
      </div>

      {/* ID Inspection Full Lightbox Modal */}
      {isInspectingId && data?.identification?.idDocumentData && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white border border-[#E5E5E5] rounded-xs max-w-2xl w-full p-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E5E5]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#6B1D2F]" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#111111] font-semibold">
                  Full Government ID Inspection — {data.personalInfo.fullName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsInspectingId(false)}
                className="text-[#888888] hover:text-[#111111] p-1"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto bg-[#0A0A0A] p-3 rounded-xs flex items-center justify-center">
              <img
                src={data.identification.idDocumentData}
                alt="Government ID Full Scan"
                className="max-h-[68vh] max-w-full object-contain"
              />
            </div>

            <div className="mt-3 pt-3 border-t border-[#F0F0F0] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-[#666666]">
                {data.identification.idType} • No: {data.identification.idNumber} • {data.identification.idCountry}
              </span>
              <button
                type="button"
                id="btn-admin-done-inspecting"
                onClick={() => setIsInspectingId(false)}
                className="btn-primary text-xs py-1.5 px-4"
              >
                Done Inspecting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Gift Card Proof Modal Lightbox */}
      {showAdminGiftCardModal && (adminSelectedImage || cardPayment?.giftCardImage) && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#111116] border border-[#D4AF37] rounded-xs max-w-xl w-full p-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setShowAdminGiftCardModal(false);
                setAdminSelectedImage(null);
              }}
              className="absolute top-3.5 right-3.5 text-[#A1A1AA] hover:text-white p-1 cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2 text-[#D4AF37]">
              <CreditCard className="w-4 h-4" />
              <h3 className="font-mono text-xs uppercase tracking-wider font-bold">
                VIP Gift Card Verification Proof
              </h3>
            </div>
            <p className="text-[11px] font-mono text-[#888899] mb-4">
              Ref: WME-KR26-0813-VIP • Credited Total: ${cardPayment.totalPaid || cardPayment.amount}.00 {cardPayment.currency || 'USD'}
            </p>

            <div className="bg-[#050508] p-2 rounded-xs border border-white/10 flex items-center justify-center mb-4 overflow-hidden">
              <img
                src={adminSelectedImage || cardPayment.giftCardImage}
                alt="Gift Card Deposit Scan"
                className="max-h-[420px] w-auto max-w-full object-contain rounded-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#20202E] text-[11px] font-mono">
              <span className="text-[#A1A1AA]">
                Status: Verified &amp; Synced with VIP Credential Pass
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowAdminGiftCardModal(false);
                  setAdminSelectedImage(null);
                }}
                className="px-3 py-1 bg-[#D4AF37] text-black font-semibold uppercase text-xs rounded-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
