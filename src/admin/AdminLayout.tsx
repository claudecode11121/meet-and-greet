import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Menu,
  X,
  FileSpreadsheet,
  User,
  ChevronRight
} from 'lucide-react';
import { OverviewView } from './OverviewView';
import { RequestsView } from './RequestsView';
import { EventSettingsView } from './EventSettingsView';
import { AdminProfileView } from './AdminProfileView';
import { ApplicationDetailModal } from './ApplicationDetailModal';

export type AdminTab = 'overview' | 'requests' | 'settings' | 'audit';

interface AdminLayoutProps {
  adminUser: {
    id?: string;
    email: string;
    fullName: string;
    role: string;
  };
  onLogout: () => void;
  onReturnToPublicForm: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  adminUser,
  onLogout,
  onReturnToPublicForm
}) => {
  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');
  const [statusFilterForRequests, setStatusFilterForRequests] = useState<string>('All');
  const [selectedReferenceId, setSelectedReferenceId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigate to requests view with preselected status filter (e.g. from Overview cards)
  const handleNavigateToRequests = (status?: string) => {
    setStatusFilterForRequests(status || 'All');
    setCurrentTab('requests');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open candidate application modal
  const handleOpenApplication = (refId: string) => {
    setSelectedReferenceId(refId);
    setIsDetailModalOpen(true);
  };

  const navItems = [
    {
      id: 'overview' as AdminTab,
      label: 'Overview & Pipeline',
      icon: LayoutDashboard,
      description: 'Pipeline metrics & volume'
    },
    {
      id: 'requests' as AdminTab,
      label: 'Inquiries & Requests',
      icon: Users,
      description: 'Search, review & evaluate'
    },
    {
      id: 'settings' as AdminTab,
      label: 'Event Governance',
      icon: Settings,
      description: 'Capacity & intake status'
    },
    {
      id: 'audit' as AdminTab,
      label: 'Security & Audit Trail',
      icon: ShieldCheck,
      description: 'Operator identity & logs'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F6] text-[#111111] flex flex-col md:flex-row antialiased selection:bg-[#6B1D2F] selection:text-white">
      {/* Mobile Header Bar */}
      <header className="md:hidden bg-white border-b border-[#E5E5E5] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 text-[#555555] hover:text-[#111111] border border-[#E5E5E5] rounded-xs"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <span className="font-serif font-black tracking-widest text-[#111111] text-base leading-none">
              WME
            </span>
            <span className="text-[10px] font-mono text-[#666666] block tracking-wider uppercase">
              Admin Portal
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onReturnToPublicForm}
          className="text-xs font-mono text-[#6B1D2F] hover:underline flex items-center gap-1"
        >
          <span>Public Form</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </header>

      {/* Desktop Left Sidebar / Mobile Overlay Drawer */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-white border-r border-[#E5E5E5] flex flex-col justify-between z-40 transition-transform duration-200 md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Branding Lockup */}
        <div className="p-6 border-b border-[#E5E5E5]">
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-black tracking-widest text-2xl text-[#111111]">
              WME
            </span>
            <span className="text-[9px] font-mono tracking-widest uppercase text-[#888888] font-semibold border-l border-[#CCCCCC] pl-2">
              Talent Ops
            </span>
          </div>
          <p className="text-[11px] font-mono text-[#777777] uppercase tracking-wider mt-1">
            William Morris Endeavor
          </p>
          <div className="mt-3 pt-3 border-t border-[#F0F0F0]">
            <span className="text-[11px] font-sans font-medium text-[#111111] block">
              Keanu Reeves Engagement
            </span>
            <span className="text-[10px] font-mono text-[#666666]">
              Intake & Operations Desk
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xs text-xs font-medium text-left transition-colors ${
                  isActive
                    ? 'bg-[#FAF9F6] text-[#6B1D2F] font-semibold border-l-2 border-[#6B1D2F]'
                    : 'text-[#444444] hover:bg-[#F5F5F5] hover:text-[#111111]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#6B1D2F]' : 'text-[#777777]'}`} />
                <div className="flex-1 truncate">
                  <div className="truncate">{item.label}</div>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#6B1D2F] shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: User & Logout */}
        <div className="p-4 border-t border-[#E5E5E5] bg-[#FBFBFA] space-y-3">
          {/* User Pill */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
              {adminUser.fullName ? adminUser.fullName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[#111111] truncate">
                {adminUser.fullName || 'Administrator'}
              </div>
              <div className="text-[10px] font-mono text-[#666666] truncate">
                {adminUser.email}
              </div>
            </div>
          </div>

          {/* Action Links */}
          <div className="pt-2 border-t border-[#EEEEEE] flex flex-col gap-1.5 text-xs font-mono">
            <button
              type="button"
              onClick={onReturnToPublicForm}
              className="flex items-center gap-2 text-[#555555] hover:text-[#111111] py-1 px-1 transition-colors text-left"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Form Portal</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 text-[#DC2626] hover:text-[#B91C1C] py-1 px-1 transition-colors text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Session</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
        {currentTab === 'overview' && (
          <OverviewView
            onNavigateToRequests={handleNavigateToRequests}
            onOpenApplication={handleOpenApplication}
          />
        )}

        {currentTab === 'requests' && (
          <RequestsView
            initialStatusFilter={statusFilterForRequests}
            onOpenApplication={handleOpenApplication}
          />
        )}

        {currentTab === 'settings' && <EventSettingsView />}

        {currentTab === 'audit' && (
          <AdminProfileView
            adminEmail={adminUser.email}
            adminName={adminUser.fullName}
            adminRole={adminUser.role}
          />
        )}
      </main>

      {/* Application Detail Modal / Drawer */}
      <ApplicationDetailModal
        referenceId={selectedReferenceId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedReferenceId(null);
        }}
        onStatusUpdated={(refId, newStatus) => {
          // Callback if needed for parent refresh
        }}
      />
    </div>
  );
};
