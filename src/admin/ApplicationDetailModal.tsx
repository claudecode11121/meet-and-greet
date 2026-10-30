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
  ExternalLink
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
    </div>
  );
};
