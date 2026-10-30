import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  User,
  KeyRound,
  Clock,
  History,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  timestamp: string;
  adminEmail: string;
  action: string;
  targetRefId?: string | null;
  details?: any;
}

interface AdminProfileViewProps {
  adminEmail?: string;
  adminRole?: string;
  adminName?: string;
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({
  adminEmail,
  adminRole = 'Talent Operations Administrator',
  adminName = 'WME Staff Administrator'
}) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    setError(null);
    try {
      const token = localStorage.getItem('wme_admin_token') || '';
      const res = await fetch('/api/admin/audit-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to retrieve audit log.');
      const json = await res.json();
      setLogs(json.logs || []);
    } catch (err: any) {
      setError(err.message || 'Error loading audit logs.');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatActionName = (action: string) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
        return <span className="text-[#16A34A] font-semibold">User Authentication</span>;
      case 'STATUS_CHANGE':
        return <span className="text-[#2563EB] font-semibold">Status Updated</span>;
      case 'ADD_INTERNAL_NOTE':
        return <span className="text-[#9333EA] font-semibold">Internal Note Recorded</span>;
      case 'EXPORT_CSV':
        return <span className="text-[#D97706] font-semibold">CSV Export Triggered</span>;
      case 'UPDATE_EVENT_SETTINGS':
        return <span className="text-[#6B1D2F] font-semibold">Event Parameters Modified</span>;
      default:
        return <span>{action}</span>;
    }
  };

  return (
    <div className="max-w-5xl space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] pb-5">
        <h1 className="text-2xl font-serif font-bold text-[#111111] tracking-tight">
          Administrator Profile & Security Audit Trail
        </h1>
        <p className="text-xs sm:text-sm text-[#666666] mt-0.5 font-sans">
          Active administrative identity, cryptographic credentials verification, and tamper-resistant audit logs.
        </p>
      </div>

      {/* Admin Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-[#E5E5E5] rounded-xs space-y-3">
          <div className="flex items-center gap-2 text-[#6B1D2F]">
            <User className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">
              Operator Account
            </span>
          </div>
          <div>
            <div className="font-serif text-lg font-bold text-[#111111]">{adminName}</div>
            <div className="text-xs font-mono text-[#555555] mt-0.5">{adminEmail || 'admin@wmeagency.com'}</div>
          </div>
          <div className="pt-2 border-t border-[#F0F0F0]">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#166534] bg-[#F0FDF4] px-2.5 py-1 rounded-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              Role: {adminRole}
            </span>
          </div>
        </div>

        <div className="p-5 bg-white border border-[#E5E5E5] rounded-xs space-y-3">
          <div className="flex items-center gap-2 text-[#6B1D2F]">
            <KeyRound className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">
              Security Protocol
            </span>
          </div>
          <div className="space-y-1 text-xs text-[#444444]">
            <div className="flex items-center gap-1.5 text-[#16A34A]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-semibold">scrypt Password Hashing</span>
            </div>
            <p className="text-[11px] text-[#666666]">
              64-byte cryptographic salt with memory-hard work factor.
            </p>
          </div>
          <div className="pt-2 border-t border-[#F0F0F0] text-[11px] font-mono text-[#666666]">
            HMAC-SHA256 Signed Bearer Session
          </div>
        </div>

        <div className="p-5 bg-white border border-[#E5E5E5] rounded-xs space-y-3">
          <div className="flex items-center gap-2 text-[#6B1D2F]">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">
              Data Protection
            </span>
          </div>
          <p className="text-xs text-[#555555] leading-relaxed">
            All fan submissions and sensitive personal data are protected under WME representation standards and encrypted transmission.
          </p>
          <div className="pt-2 border-t border-[#F0F0F0] text-[11px] font-mono text-[#666666]">
            CSV Formula Injection Shield: Active
          </div>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="border border-[#E5E5E5] bg-white rounded-xs">
        <div className="p-4 sm:p-5 border-b border-[#E5E5E5] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#6B1D2F]" />
              <h3 className="text-sm font-serif font-bold text-[#111111]">
                Administrative Audit Trail
              </h3>
            </div>
            <p className="text-xs text-[#666666] font-mono mt-0.5">
              Historical record of status modifications, internal notes, and administrative logins.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchLogs}
            disabled={isLoadingLogs}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            <span>Refresh Trail</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-[#FEF2F2] border-b border-[#FCA5A5] text-[#991B1B] text-xs">
            {error}
          </div>
        )}

        {isLoadingLogs ? (
          <div className="py-16 text-center text-[#666666]">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#6B1D2F] mb-2" />
            <p className="text-xs font-mono">Loading audit trail entries...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#888888] font-mono">
            No audit logs recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] border-b border-[#E5E5E5] font-mono uppercase text-[10px] text-[#666666] tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Administrator</th>
                  <th className="px-4 py-3 font-semibold">Target Ref</th>
                  <th className="px-4 py-3 font-semibold">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FBFBFA] transition-colors font-mono text-[11px]">
                    <td className="px-4 py-3 text-[#666666] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 font-sans">
                      {formatActionName(log.action)}
                    </td>
                    <td className="px-4 py-3 text-[#111111]">
                      {log.adminEmail}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#111111]">
                      {log.targetRefId || '—'}
                    </td>
                    <td className="px-4 py-3 text-[#666666] max-w-xs truncate font-sans">
                      {log.details ? (
                        typeof log.details === 'object' ? (
                          log.details.fromStatus ? (
                            <span>{log.details.fromStatus} &rarr; <strong>{log.details.toStatus}</strong> {log.details.reason ? `("${log.details.reason}")` : ''}</span>
                          ) : (
                            JSON.stringify(log.details)
                          )
                        ) : (
                          String(log.details)
                        )
                      ) : (
                        '—'
                      )}
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
