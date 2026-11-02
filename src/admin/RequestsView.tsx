import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  FileSpreadsheet,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Calendar,
  Users,
  MapPin,
  Mail,
  Loader2,
  ExternalLink,
  CreditCard,
  PenTool,
  CheckCircle2
} from 'lucide-react';
import { StatusBadge, VALID_STATUSES } from './StatusBadge';

interface SubmissionItem {
  referenceId: string;
  submittedAt: string;
  status: string;
  cardPayment?: any;
  cardActivation?: any;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    city: string;
    country: string;
  };
  meetAndGreetInfo: {
    meetingType: string;
    preferredDate?: string;
    attendees: string;
  };
  identification?: {
    idType: string;
    idNumber: string;
    idCountry: string;
    hasDocument: boolean;
  } | null;
  signature?: {
    signatureType: 'drawn' | 'typed';
    signeeName: string;
    signedAt: string;
    hasSignature: boolean;
  } | null;
  notesCount: number;
}

interface RequestsViewProps {
  initialStatusFilter?: string;
  onOpenApplication: (referenceId: string) => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  initialStatusFilter = 'All',
  onOpenApplication
}) => {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(12);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [meetingTypeFilter, setMeetingTypeFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [sortBy, setSortBy] = useState<'submittedAt' | 'fullName'>('submittedAt');

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync initialStatusFilter if changed from parent
  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
      setCurrentPage(1);
    }
  }, [initialStatusFilter]);

  // Fetch submissions from API
  const fetchSubmissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('wme_admin_token') || '';
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        search: debouncedSearch,
        status: statusFilter,
        meetingType: meetingTypeFilter
      });

      const res = await fetch(`/api/admin/submissions?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to load submissions.');
      }

      const json = await res.json();
      setSubmissions(json.submissions || []);
      setTotalCount(json.pagination?.total || 0);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Error loading inquiries.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [currentPage, debouncedSearch, statusFilter, meetingTypeFilter, sortBy, sortOrder]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setStatusFilter('All');
    setMeetingTypeFilter('All');
    setSortBy('submittedAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Export current filtered set as CSV
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('wme_admin_token') || '';
      const params = new URLSearchParams({
        search: debouncedSearch,
        status: statusFilter,
        meetingType: meetingTypeFilter
      });

      const res = await fetch(`/api/admin/export/csv?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wme-keanu-reeves-inquiries-filtered-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Failed to download CSV export.');
    } finally {
      setIsExporting(false);
    }
  };

  const hasActiveFilters =
    debouncedSearch.trim() !== '' ||
    statusFilter !== 'All' ||
    meetingTypeFilter !== 'All';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-5">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#111111] tracking-tight">
            Meet & Greet Requests Management
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-0.5 font-sans">
            Review, evaluate, and manage fan applications for Keanu Reeves.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-2"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#6B1D2F]" />
            )}
            <span>Export Filtered (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-[#E5E5E5] rounded-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, ref ID, city..."
              className="w-full pl-9 pr-3 py-2 border border-[#CCCCCC] bg-white text-xs text-[#111111] rounded-xs focus:outline-none focus:border-[#6B1D2F]"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-[#CCCCCC] bg-white text-xs text-[#111111] rounded-xs focus:outline-none focus:border-[#6B1D2F] font-mono"
            >
              <option value="All">All Statuses ({totalCount})</option>
              {VALID_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Meeting Type Filter */}
          <div>
            <select
              value={meetingTypeFilter}
              onChange={(e) => {
                setMeetingTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-[#CCCCCC] bg-white text-xs text-[#111111] rounded-xs focus:outline-none focus:border-[#6B1D2F] font-mono"
            >
              <option value="All">All Meeting Formats</option>
              <option value="In-person">In-person</option>
              <option value="Virtual">Virtual</option>
              <option value="No preference">No preference</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('_');
                setSortBy(sb as any);
                setSortOrder(so as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-[#CCCCCC] bg-white text-xs text-[#111111] rounded-xs focus:outline-none focus:border-[#6B1D2F] font-mono"
            >
              <option value="submittedAt_desc">Date: Newest First</option>
              <option value="submittedAt_asc">Date: Oldest First</option>
              <option value="fullName_asc">Applicant Name (A-Z)</option>
              <option value="fullName_desc">Applicant Name (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips & Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-[#F0F0F0] text-xs">
            <span className="text-[#666666] font-mono text-[11px]">
              Active filters applied. Found {totalCount} matching record{totalCount === 1 ? '' : 's'}.
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[#6B1D2F] hover:text-[#521624] font-mono text-[11px] flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset all filters</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xs text-[#991B1B] text-xs">
          {error}
        </div>
      )}

      {/* Main Table (Desktop / Tablet) */}
      <div className="border border-[#E5E5E5] bg-[#FFFFFF] rounded-xs overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="py-16 text-center text-[#666666]">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#6B1D2F] mb-2" />
            <p className="text-xs font-mono">Retrieving matching candidate records...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm font-medium text-[#111111]">No inquiries match your criteria</p>
            <p className="text-xs text-[#666666] max-w-sm mx-auto">
              Try adjusting your search terms or clearing status filters to view all incoming requests.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-secondary text-xs py-1.5 px-3 font-mono"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] border-b border-[#E5E5E5] font-mono uppercase text-[10px] text-[#666666] tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Reference</th>
                    <th className="px-4 py-3 font-semibold">Applicant</th>
                    <th className="px-4 py-3 font-semibold">Location</th>
                    <th className="px-4 py-3 font-semibold">Format & Size</th>
                    <th className="px-4 py-3 font-semibold">Preferred Date</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">VIP Escrow</th>
                    <th className="px-4 py-3 font-semibold text-center">Notes</th>
                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  {submissions.map((sub) => (
                    <tr
                      key={sub.referenceId}
                      onClick={() => onOpenApplication(sub.referenceId)}
                      className="hover:bg-[#FBFBFA] transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3.5 font-mono font-medium text-[#111111] group-hover:text-[#6B1D2F]">
                        {sub.referenceId}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-[#111111]">{sub.personalInfo.fullName}</div>
                        <div className="text-[11px] text-[#666666] font-mono">{sub.personalInfo.email}</div>
                        {(sub.identification?.idType || sub.signature?.hasSignature) && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {sub.identification?.idType && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#444444] bg-[#F5F5F5] px-1.5 py-0.5 rounded-[2px] border border-[#E5E5E5]">
                                <CreditCard className="w-2.5 h-2.5 text-[#6B1D2F]" />
                                <span>{sub.identification.idType}</span>
                              </span>
                            )}
                            {sub.signature?.hasSignature && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#15803D] bg-[#F0FDF4] px-1.5 py-0.5 rounded-[2px] border border-[#BBF7D0]">
                                <PenTool className="w-2.5 h-2.5 text-[#16A34A]" />
                                <span>Signed</span>
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[#444444]">
                        <div>{sub.personalInfo.city}</div>
                        <div className="text-[11px] text-[#777777]">{sub.personalInfo.country}</div>
                      </td>
                      <td className="px-4 py-3.5 text-[#444444]">
                        <span className="font-mono text-[11px] block">{sub.meetAndGreetInfo.meetingType || '—'}</span>
                        <span className="text-[11px] text-[#777777]">{sub.meetAndGreetInfo.attendees}</span>
                      </td>
                      <td className="px-4 py-3.5 text-[#444444] font-mono text-[11px]">
                        {sub.meetAndGreetInfo.preferredDate
                          ? new Date(sub.meetAndGreetInfo.preferredDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : <span className="text-[#888888]">Flexible</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        {sub.cardPayment && (sub.cardPayment.status === 'VERIFIED' || sub.cardPayment.isFullyPaid || (Number(sub.cardPayment.totalPaid) >= 500)) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#065F46] bg-[#ECFDF5] px-2 py-0.5 rounded-[2px] border border-[#A7F3D0] font-semibold" title={`Accredited Vouchers: ${Array.isArray(sub.cardPayment.cards) ? sub.cardPayment.cards.length : 1}`}>
                            <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                            <span>${sub.cardPayment.totalPaid || 500}.00 (Gift Card)</span>
                          </span>
                        ) : sub.cardPayment && Number(sub.cardPayment.totalPaid) > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#92400E] bg-[#FFFBEB] px-2 py-0.5 rounded-[2px] border border-[#FDE68A] font-semibold">
                            <span>${sub.cardPayment.totalPaid}.00 Partial</span>
                          </span>
                        ) : (
                          <span className="text-[#999999] text-[10px]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {sub.notesCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#666666] bg-[#F5F5F5] px-2 py-0.5 rounded-xs">
                            <MessageSquare className="w-3 h-3 text-[#6B1D2F]" />
                            {sub.notesCount}
                          </span>
                        ) : (
                          <span className="text-[#CCCCCC] font-mono text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenApplication(sub.referenceId);
                          }}
                          className="btn-secondary text-xs py-1 px-3 group-hover:border-[#6B1D2F]"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (<768px) */}
            <div className="md:hidden divide-y divide-[#E5E5E5]">
              {submissions.map((sub) => (
                <div
                  key={sub.referenceId}
                  onClick={() => onOpenApplication(sub.referenceId)}
                  className="p-4 space-y-2.5 active:bg-[#F9FAFB] cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-[#111111]">
                      {sub.referenceId}
                    </span>
                    <StatusBadge status={sub.status} />
                  </div>

                  <div>
                    <h3 className="font-medium text-[#111111] text-sm">{sub.personalInfo.fullName}</h3>
                    <p className="text-xs text-[#666666] font-mono">{sub.personalInfo.email}</p>
                    {(sub.identification?.idType || sub.signature?.hasSignature) && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {sub.identification?.idType && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#444444] bg-[#F5F5F5] px-1.5 py-0.5 rounded-[2px] border border-[#E5E5E5]">
                            <CreditCard className="w-2.5 h-2.5 text-[#6B1D2F]" />
                            <span>{sub.identification.idType}</span>
                          </span>
                        )}
                        {sub.signature?.hasSignature && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#15803D] bg-[#F0FDF4] px-1.5 py-0.5 rounded-[2px] border border-[#BBF7D0]">
                            <PenTool className="w-2.5 h-2.5 text-[#16A34A]" />
                            <span>Signed</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#555555]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#888888]" />
                      {sub.personalInfo.city}, {sub.personalInfo.country}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#888888]" />
                      {sub.meetAndGreetInfo.meetingType} ({sub.meetAndGreetInfo.attendees})
                    </span>
                  </div>

                  {sub.cardPayment && (
                    <div className="pt-1">
                      {sub.cardPayment.status === 'VERIFIED' || sub.cardPayment.isFullyPaid || (Number(sub.cardPayment.totalPaid) >= 500) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#065F46] bg-[#ECFDF5] px-2 py-0.5 rounded-[2px] border border-[#A7F3D0] font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                          <span>${sub.cardPayment.totalPaid || 500}.00 VIP Escrow Paid</span>
                        </span>
                      ) : Number(sub.cardPayment.totalPaid) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#92400E] bg-[#FFFBEB] px-2 py-0.5 rounded-[2px] border border-[#FDE68A] font-semibold">
                          <span>${sub.cardPayment.totalPaid}.00 / $500.00 Partial Escrow</span>
                        </span>
                      ) : null}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-[#888888]">
                    <span>
                      {new Date(sub.submittedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="text-[#6B1D2F] font-semibold underline underline-offset-2">
                      View details &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-[#FAF9F6] border-t border-[#E5E5E5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="font-mono text-[#666666] text-[11px]">
                Showing {submissions.length > 0 ? (currentPage - 1) * limit + 1 : 0} to{' '}
                {Math.min(currentPage * limit, totalCount)} of {totalCount} inquiries
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || isLoading}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <span className="font-mono text-xs px-2 text-[#444444]">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || isLoading}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 disabled:opacity-40"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
