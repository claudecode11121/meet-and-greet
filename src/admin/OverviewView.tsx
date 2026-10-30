import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  UserCheck,
  XCircle,
  ExternalLink,
  Shield,
  Loader2,
  Calendar
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface StatsData {
  total: number;
  submitted: number;
  underReview: number;
  awaitingResponse: number;
  approved: number;
  confirmed: number;
  rejected: number;
  cancelled: number;
  recent7Days: number;
}

interface RecentSubmission {
  referenceId: string;
  submittedAt: string;
  status: string;
  personalInfo: {
    fullName: string;
    email: string;
    city: string;
    country: string;
  };
  meetAndGreetInfo: {
    meetingType: string;
    preferredDate?: string;
    attendees: string;
  };
}

interface OverviewViewProps {
  onNavigateToRequests: (filterStatus?: string) => void;
  onOpenApplication: (referenceId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigateToRequests,
  onOpenApplication
}) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentItems, setRecentItems] = useState<RecentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverviewData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('wme_admin_token') || '';
      const [statsRes, listRes] = await Promise.all([
        fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/submissions?limit=5&sortBy=submittedAt&sortOrder=desc', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!statsRes.ok || !listRes.ok) {
        throw new Error('Failed to retrieve intake metrics.');
      }

      const statsJson = await statsRes.json();
      const listJson = await listRes.json();

      setStats(statsJson.stats);
      setRecentItems(listJson.submissions || []);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('wme_admin_token') || '';
      const res = await fetch('/api/admin/export/csv', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('CSV generation failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wme-keanu-reeves-inquiries-${new Date().toISOString().split('T')[0]}.csv`;
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

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header & Fast Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] tracking-widest text-[#6B1D2F] uppercase font-bold">
              Talent Management & Operations
            </span>
            <span className="text-[#CCCCCC]">/</span>
            <span className="font-mono text-[10px] text-[#666666] uppercase">
              Confidential Intake
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#111111] tracking-tight">
            Keanu Reeves Meet & Greet Inquiries
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-1 font-sans">
            WME Centralized intake, applicant vetting, and candidate scheduling.
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
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateToRequests()}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
          >
            <span>View All Inquiries</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xs text-[#991B1B] text-xs">
          {error}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#666666] font-semibold">
            Application Pipeline Metrics
          </h2>
          <span className="text-[11px] font-mono text-[#888888]">
            Click any metric to filter requests
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Total Submissions */}
          <button
            type="button"
            onClick={() => onNavigateToRequests('All')}
            className="p-4 bg-white border border-[#E5E5E5] hover:border-[#6B1D2F] rounded-xs text-left transition-all group shadow-2xs"
          >
            <div className="flex items-center justify-between text-[#666666] mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider">Total</span>
              <Users className="w-3.5 h-3.5 text-[#888888] group-hover:text-[#6B1D2F]" />
            </div>
            <div className="text-2xl font-serif font-bold text-[#111111]">
              {isLoading ? '—' : stats?.total}
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#888888]">
              {stats?.recent7Days || 0} in past 7 days
            </div>
          </button>

          {/* Submitted (New) */}
          <button
            type="button"
            onClick={() => onNavigateToRequests('Submitted')}
            className="p-4 bg-white border border-[#E5E5E5] hover:border-[#2563EB] rounded-xs text-left transition-all group shadow-2xs"
          >
            <div className="flex items-center justify-between text-[#666666] mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider">Submitted</span>
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
            </div>
            <div className="text-2xl font-serif font-bold text-[#111111]">
              {isLoading ? '—' : stats?.submitted}
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#2563EB]">
              New applications
            </div>
          </button>

          {/* Under Review */}
          <button
            type="button"
            onClick={() => onNavigateToRequests('Under Review')}
            className="p-4 bg-white border border-[#E5E5E5] hover:border-[#D97706] rounded-xs text-left transition-all group shadow-2xs"
          >
            <div className="flex items-center justify-between text-[#666666] mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider">Under Review</span>
              <span className="w-2 h-2 rounded-full bg-[#D97706]" />
            </div>
            <div className="text-2xl font-serif font-bold text-[#111111]">
              {isLoading ? '—' : stats?.underReview}
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#D97706]">
              In vetting queue
            </div>
          </button>

          {/* Awaiting Response */}
          <button
            type="button"
            onClick={() => onNavigateToRequests('Awaiting Response')}
            className="p-4 bg-white border border-[#E5E5E5] hover:border-[#9333EA] rounded-xs text-left transition-all group shadow-2xs"
          >
            <div className="flex items-center justify-between text-[#666666] mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider">Awaiting Fan</span>
              <span className="w-2 h-2 rounded-full bg-[#9333EA]" />
            </div>
            <div className="text-2xl font-serif font-bold text-[#111111]">
              {isLoading ? '—' : stats?.awaitingResponse}
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#9333EA]">
              Info requested
            </div>
          </button>

          {/* Approved */}
          <button
            type="button"
            onClick={() => onNavigateToRequests('Approved')}
            className="p-4 bg-white border border-[#E5E5E5] hover:border-[#0D9488] rounded-xs text-left transition-all group shadow-2xs"
          >
            <div className="flex items-center justify-between text-[#666666] mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider">Approved</span>
              <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
            </div>
            <div className="text-2xl font-serif font-bold text-[#111111]">
              {isLoading ? '—' : stats?.approved}
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#0D9488]">
              Ready for schedule
            </div>
          </button>

          {/* Confirmed */}
          <button
            type="button"
            onClick={() => onNavigateToRequests('Confirmed')}
            className="p-4 bg-white border border-[#E5E5E5] hover:border-[#16A34A] rounded-xs text-left transition-all group shadow-2xs"
          >
            <div className="flex items-center justify-between text-[#666666] mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider">Confirmed</span>
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            </div>
            <div className="text-2xl font-serif font-bold text-[#111111]">
              {isLoading ? '—' : stats?.confirmed}
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#16A34A]">
              Locked in schedule
            </div>
          </button>

          {/* Rejected / Cancelled */}
          <button
            type="button"
            onClick={() => onNavigateToRequests('Rejected')}
            className="p-4 bg-white border border-[#E5E5E5] hover:border-[#DC2626] rounded-xs text-left transition-all group shadow-2xs"
          >
            <div className="flex items-center justify-between text-[#666666] mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider">Closed</span>
              <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
            </div>
            <div className="text-2xl font-serif font-bold text-[#111111]">
              {isLoading ? '—' : (stats ? stats.rejected + stats.cancelled : 0)}
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#888888]">
              Rejected / Cancelled
            </div>
          </button>
        </div>
      </div>

      {/* Talent & Event Governance Card */}
      <div className="border border-[#E5E5E5] bg-[#FFFFFF] p-5 rounded-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#6B1D2F]" />
            <h3 className="text-sm font-semibold text-[#111111]">
              WME Representation & Compliance Directives
            </h3>
          </div>
          <p className="text-xs text-[#555555] max-w-2xl leading-relaxed">
            All submitted applications are legally privileged fan inquiries for <strong>Keanu Reeves</strong>. Submissions do not represent binding tickets or paid reservations. Applications must undergo thorough identity and background vetting by the talent management operations desk prior to approval.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] rounded-xs">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            Intake Online
          </span>
          <span className="px-3 py-1 bg-[#F5F5F5] border border-[#E5E5E5] text-[#444444] rounded-xs">
            Assigned Talent: Keanu Reeves
          </span>
        </div>
      </div>

      {/* Recent Inquiries Preview Table */}
      <div className="border border-[#E5E5E5] bg-[#FFFFFF] rounded-xs">
        <div className="p-4 sm:p-5 border-b border-[#E5E5E5] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-serif font-bold text-[#111111]">
              Recent Fan Submissions
            </h3>
            <p className="text-xs text-[#666666] font-mono mt-0.5">
              Latest applications received through public portal
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToRequests()}
            className="text-xs text-[#6B1D2F] hover:text-[#521624] font-mono flex items-center gap-1 font-semibold"
          >
            <span>See all inquiries</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-[#666666]">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#6B1D2F] mb-2" />
            <p className="text-xs font-mono">Loading recent submissions...</p>
          </div>
        ) : recentItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#888888] font-mono">
            No submissions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] border-b border-[#E5E5E5] font-mono uppercase text-[10px] text-[#666666] tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Applicant</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Format</th>
                  <th className="px-4 py-3 font-semibold">Preferred Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {recentItems.map((item) => (
                  <tr
                    key={item.referenceId}
                    className="hover:bg-[#FBFBFA] transition-colors cursor-pointer"
                    onClick={() => onOpenApplication(item.referenceId)}
                  >
                    <td className="px-4 py-3 font-mono font-medium text-[#111111]">
                      {item.referenceId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#111111]">{item.personalInfo.fullName}</div>
                      <div className="text-[11px] text-[#666666] font-mono">{item.personalInfo.email}</div>
                    </td>
                    <td className="px-4 py-3 text-[#444444]">
                      {item.personalInfo.city}, {item.personalInfo.country}
                    </td>
                    <td className="px-4 py-3 text-[#444444]">
                      <span className="font-mono text-[11px]">
                        {item.meetAndGreetInfo.meetingType || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#444444] font-mono text-[11px]">
                      {item.meetAndGreetInfo.preferredDate
                        ? new Date(item.meetAndGreetInfo.preferredDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'Flexible'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenApplication(item.referenceId);
                        }}
                        className="btn-secondary text-xs py-1 px-2.5"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
