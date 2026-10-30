import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  Users
} from 'lucide-react';

interface EventSettings {
  intakeStatus: string;
  coordinatorEmail: string;
  capacityLimit: number;
  updatedAt?: string;
  updatedBy?: string;
}

export const EventSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<EventSettings>({
    intakeStatus: 'Active',
    coordinatorEmail: 'talent-ops@wmeagency.com',
    capacityLimit: 50
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('wme_admin_token') || '';
        const res = await fetch('/api/admin/event-settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load event configuration.');
        const json = await res.json();
        if (json.settings) {
          setSettings(json.settings);
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching settings.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const token = localStorage.getItem('wme_admin_token') || '';
      const res = await fetch('/api/admin/event-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update settings.');
      }

      setSettings(json.settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-[#666666]">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#6B1D2F] mb-2" />
        <p className="text-xs font-mono">Loading event governance parameters...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] pb-5">
        <h1 className="text-2xl font-serif font-bold text-[#111111] tracking-tight">
          Event Intake & Governance Parameters
        </h1>
        <p className="text-xs sm:text-sm text-[#666666] mt-0.5 font-sans">
          Configure intake status, attendee capacity limits, and talent coordination contacts.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs rounded-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Configuration saved successfully. Audit trail updated.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs rounded-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Designated Talent Block */}
        <div className="p-5 bg-white border border-[#E5E5E5] rounded-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#666666] font-semibold">
              Designated Talent Representation
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#666666] bg-[#F5F5F5] px-2 py-0.5 rounded-xs">
              <Lock className="w-3 h-3 text-[#888888]" /> Locked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div className="p-3.5 bg-[#FAF9F6] border border-[#EBEAE5] rounded-xs">
              <span className="text-[11px] font-mono text-[#777777] block mb-1">Talent Name</span>
              <strong className="text-base font-serif text-[#111111] font-bold">Keanu Reeves</strong>
            </div>
            <div className="p-3.5 bg-[#FAF9F6] border border-[#EBEAE5] rounded-xs">
              <span className="text-[11px] font-mono text-[#777777] block mb-1">Agency of Record</span>
              <strong className="text-base font-serif text-[#111111] font-bold">WME (William Morris Endeavor)</strong>
            </div>
          </div>
          <p className="text-[11px] text-[#777777]">
            Note: The designated celebrity cannot be modified from the administrative console without re-provisioning the talent engagement agreement.
          </p>
        </div>

        {/* Operational Controls */}
        <div className="p-5 bg-white border border-[#E5E5E5] rounded-xs space-y-5">
          <span className="text-xs font-mono uppercase tracking-wider text-[#666666] font-semibold block">
            Intake Operations
          </span>

          {/* Intake Status */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[#222222]">
              Public Intake Portal Status
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3.5 border rounded-xs cursor-pointer flex items-start gap-3 transition-colors ${
                  settings.intakeStatus === 'Active'
                    ? 'border-[#6B1D2F] bg-[#FAF9F6]'
                    : 'border-[#E5E5E5] bg-white hover:border-[#CCCCCC]'
                }`}
              >
                <input
                  type="radio"
                  name="intakeStatus"
                  value="Active"
                  checked={settings.intakeStatus === 'Active'}
                  onChange={(e) => setSettings({ ...settings, intakeStatus: e.target.value })}
                  className="mt-0.5 text-[#6B1D2F]"
                />
                <div>
                  <div className="text-xs font-semibold text-[#111111] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                    Active / Open
                  </div>
                  <p className="text-[11px] text-[#666666] mt-0.5 leading-relaxed">
                    The public request form is active and processing fan inquiries.
                  </p>
                </div>
              </label>

              <label
                className={`p-3.5 border rounded-xs cursor-pointer flex items-start gap-3 transition-colors ${
                  settings.intakeStatus === 'Paused'
                    ? 'border-[#6B1D2F] bg-[#FAF9F6]'
                    : 'border-[#E5E5E5] bg-white hover:border-[#CCCCCC]'
                }`}
              >
                <input
                  type="radio"
                  name="intakeStatus"
                  value="Paused"
                  checked={settings.intakeStatus === 'Paused'}
                  onChange={(e) => setSettings({ ...settings, intakeStatus: e.target.value })}
                  className="mt-0.5 text-[#6B1D2F]"
                />
                <div>
                  <div className="text-xs font-semibold text-[#111111] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#EAB308]" />
                    Paused / Holding
                  </div>
                  <p className="text-[11px] text-[#666666] mt-0.5 leading-relaxed">
                    Intake is temporarily suspended for review; submissions are held.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Attendee Capacity Limit */}
          <div className="space-y-1.5">
            <label htmlFor="capacityLimit" className="block text-xs font-medium text-[#222222]">
              Maximum Event Capacity (Attendees)
            </label>
            <div className="max-w-xs relative">
              <Users className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="capacityLimit"
                type="number"
                min="1"
                max="500"
                value={settings.capacityLimit}
                onChange={(e) => setSettings({ ...settings, capacityLimit: parseInt(e.target.value, 10) || 1 })}
                className="w-full pl-9 pr-3 py-2 border border-[#CCCCCC] bg-white text-xs text-[#111111] rounded-xs focus:outline-none focus:border-[#6B1D2F] font-mono"
              />
            </div>
            <p className="text-[11px] text-[#777777]">
              Total confirmed attendees permitted before intake triggers capacity advisory.
            </p>
          </div>

          {/* Talent Coordinator Email */}
          <div className="space-y-1.5">
            <label htmlFor="coordinatorEmail" className="block text-xs font-medium text-[#222222]">
              Talent Coordinator Contact Email
            </label>
            <div className="max-w-md relative">
              <Mail className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="coordinatorEmail"
                type="email"
                value={settings.coordinatorEmail}
                onChange={(e) => setSettings({ ...settings, coordinatorEmail: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-[#CCCCCC] bg-white text-xs text-[#111111] rounded-xs focus:outline-none focus:border-[#6B1D2F] font-mono"
              />
            </div>
            <p className="text-[11px] text-[#777777]">
              Internal notifications and inquiries regarding Keanu Reeves schedule will be addressed here.
            </p>
          </div>
        </div>

        {/* Audit Metadata */}
        {settings.updatedAt && (
          <div className="p-3 bg-[#FAF9F6] border border-[#E5E5E5] rounded-xs text-[11px] font-mono text-[#666666] flex flex-wrap items-center justify-between gap-2">
            <span>Last updated by: <strong>{settings.updatedBy || 'System Admin'}</strong></span>
            <span>Timestamp: {new Date(settings.updatedAt).toLocaleString()}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Parameters...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Parameters</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
