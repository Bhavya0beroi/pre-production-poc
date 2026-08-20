import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutDashboard,
  CheckCircle,
  DollarSign,
  Package,
  Archive,
  Plus,
  Wrench,
  Search,
  Edit3,
  Bell,
  Send,
  Loader,
  LogOut,
  User,
  Shield,
  Crown,
  Users,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSlackSettings, type SlackMention } from '../services/slackService';
import type { RepairRequest, RepairStatus } from '../services/repairService';
import { RepairInvoiceManagement } from './RepairInvoiceManagement';

interface RepairsDashboardProps {
  repairs: RepairRequest[];
  onOpenNewRequest: () => void;
  onEditRepair: (repairId: string) => void;
  onNotifyRepair: (repairId: string, target: { name: string; slackUserId?: string }) => Promise<void>;
  onBack: () => void;
  onOpenApprovals: () => void;
  onOpenFinance: () => void;
  onOpenCatalog: () => void;
  onOpenArchive: () => void;
  onOpenSlackSettings?: () => void;
  onOpenRolePanel?: () => void;
  approvalsPending?: number;
  onLogout?: () => void;
  accessError?: string | null;
  onRefreshRepairs: () => Promise<void>;
}

type StatFilter = 'all' | 'pendingApproval' | 'pendingInvoice' | 'inFinance';
type TypeFilter = 'all' | 'Repaired' | 'Replaced';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Renders "1 Jan 2026" from a stored YYYY-MM-DD value. */
function formatRepairDate(value: string): string {
  if (!value) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    const [, year, month, day] = match;
    return `${Number(day)} ${SHORT_MONTHS[Number(month) - 1]} ${year}`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return `${parsed.getDate()} ${SHORT_MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

const STATUS_STYLES: Record<RepairStatus, { bg: string; color: string }> = {
  'Pending Approval': { bg: '#FEF3E2', color: '#F2994A' },
  'Pending Invoice': { bg: '#EFF6FF', color: '#3B82F6' },
  'In Finance': { bg: '#E8F5E9', color: '#27AE60' },
  Rejected: { bg: '#FEE2E2', color: '#DC2626' },
};

const ACTION_CHIP_STYLES = {
  Repaired: { bg: '#E8F5E9', color: '#27AE60' },
  Replaced: { bg: '#EFF6FF', color: '#2D60FF' },
};

export function RepairsDashboard({
  repairs,
  onOpenNewRequest,
  onEditRepair,
  onNotifyRepair,
  onBack,
  onOpenApprovals,
  onOpenFinance,
  onOpenCatalog,
  onOpenArchive,
  onOpenSlackSettings,
  onOpenRolePanel,
  approvalsPending = 0,
  onLogout,
  accessError = null,
  onRefreshRepairs,
}: RepairsDashboardProps) {
  const { isAdmin, isSuperAdmin, moduleAccess, user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<StatFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [search, setSearch] = useState('');

  const [slackWebhook, setSlackWebhook] = useState('');
  const [slackMembers, setSlackMembers] = useState<SlackMention[]>([]);
  const [notifyOpenFor, setNotifyOpenFor] = useState<string | null>(null);
  const [notifyInput, setNotifyInput] = useState('');
  const [notifyStatus, setNotifyStatus] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({});
  const notifyRef = useRef<HTMLDivElement>(null);
  
  const [selectedRepairForInvoice, setSelectedRepairForInvoice] = useState<RepairRequest | null>(null);

  useEffect(() => {
    getSlackSettings()
      .then(s => {
        setSlackWebhook(s.webhook_url || '');
        setSlackMembers(s.mentions || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifyRef.current && !notifyRef.current.contains(e.target as Node)) {
        setNotifyOpenFor(null);
        setNotifyInput('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sendNotify = async (repair: RepairRequest, name: string, slackUserId?: string) => {
    const key = `${repair.id}:${name}`;
    setNotifyStatus(p => ({ ...p, [key]: 'sending' }));
    try {
      await onNotifyRepair(repair.id, { name, slackUserId });
      setNotifyStatus(p => ({ ...p, [key]: 'sent' }));
    } catch {
      setNotifyStatus(p => ({ ...p, [key]: 'error' }));
    }
    setTimeout(() => setNotifyStatus(p => { const n = { ...p }; delete n[key]; return n; }), 3000);
  };

  const counts = useMemo(() => ({
    all: repairs.length,
    pendingApproval: repairs.filter(r => r.status === 'Pending Approval').length,
    pendingInvoice: repairs.filter(r => r.status === 'Pending Invoice').length,
    inFinance: repairs.filter(r => r.status === 'In Finance').length,
  }), [repairs]);

  const summaryCards: { id: StatFilter; title: string; count: number; color: string }[] = [
    { id: 'all', title: 'All', count: counts.all, color: '#1F2937' },
    { id: 'pendingApproval', title: 'Pending Approval', count: counts.pendingApproval, color: '#F2994A' },
    { id: 'pendingInvoice', title: 'Pending Invoice', count: counts.pendingInvoice, color: '#3B82F6' },
    { id: 'inFinance', title: 'In Finance', count: counts.inFinance, color: '#27AE60' },
  ];

  const tableData = useMemo(() => {
    let rows = repairs;

    if (selectedFilter === 'pendingApproval') rows = rows.filter(r => r.status === 'Pending Approval');
    else if (selectedFilter === 'pendingInvoice') rows = rows.filter(r => r.status === 'Pending Invoice');
    else if (selectedFilter === 'inFinance') rows = rows.filter(r => r.status === 'In Finance');

    if (typeFilter !== 'all') rows = rows.filter(r => r.action === typeFilter);

    const term = search.trim().toLowerCase();
    if (term) {
      rows = rows.filter(r => {
        const haystack = [
          r.item,
          r.deviceId || '',
          r.requestorName,
          ...(r.assignedUsers || []).map(u => u.name),
        ].join(' ').toLowerCase();
        return haystack.includes(term);
      });
    }

    return rows;
  }, [repairs, selectedFilter, typeFilter, search]);

  const tableTitle = selectedFilter === 'pendingApproval'
    ? 'Requests Waiting for Approval'
    : selectedFilter === 'pendingInvoice'
      ? 'Requests Pending Invoice'
      : selectedFilter === 'inFinance'
        ? 'Requests in Finance'
        : 'All Repair & Replacement Requests';

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Left Sidebar */}
      <div className="w-64 flex flex-col" style={{ backgroundColor: '#1F2937' }}>
        <div className="px-6 py-6 border-b" style={{ borderColor: '#374151' }}>
          <h2 className="text-white text-xl">ShootFlow</h2>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {moduleAccess.shoots && (
            <button
              onClick={onBack}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-700"
              style={{ color: '#9CA3AF' }}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Active Shoots</span>
            </button>
          )}

          {/* IT Assets & Repairs — active */}
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors"
            style={{ backgroundColor: '#2D60FF', color: 'white' }}
          >
            <Wrench className="w-5 h-5" />
            <span>IT Assets &amp; Repairs</span>
          </button>

          <button
            onClick={onOpenApprovals}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors relative hover:bg-gray-700"
            style={{ color: '#9CA3AF' }}
          >
            <CheckCircle className="w-5 h-5" />
            <span>Approvals</span>
            {approvalsPending > 0 && (
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: '#F2994A', color: 'white' }}
              >
                {approvalsPending}
              </span>
            )}
          </button>

          <button
            onClick={onOpenFinance}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-700"
            style={{ color: '#9CA3AF' }}
          >
            <DollarSign className="w-5 h-5" />
            <span>Finance &amp; Invoices</span>
          </button>

          {moduleAccess.shoots && (
            <button
              onClick={onOpenCatalog}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-700"
              style={{ color: '#9CA3AF' }}
            >
              <Package className="w-5 h-5" />
              <span>Catalog</span>
            </button>
          )}

          <button
            onClick={onOpenArchive}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-700"
            style={{ color: '#9CA3AF' }}
          >
            <Archive className="w-5 h-5" />
            <span>Archive</span>
          </button>

          {isAdmin && onOpenSlackSettings && (
            <button
              onClick={onOpenSlackSettings}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-700"
              style={{ color: '#9CA3AF' }}
            >
              <Zap className="w-5 h-5" />
              <span>Slack Integration</span>
            </button>
          )}

          {onOpenRolePanel && (
            <button
              onClick={onOpenRolePanel}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-700"
              style={{ color: '#9CA3AF' }}
            >
              <Users className="w-5 h-5" />
              <span>Role Panel</span>
            </button>
          )}
        </nav>

        {/* User Profile */}
        <div className="px-4 py-4 border-t" style={{ borderColor: '#374151' }}>
          <div className="flex items-center gap-3 px-2 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: isSuperAdmin ? '#C2410C' : isAdmin ? '#8B5CF6' : '#2D60FF' }}
            >
              {isSuperAdmin ? <Crown className="w-5 h-5" /> : isAdmin ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white text-sm font-medium truncate">
                {user?.name || (isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Team Member')}
              </div>
              <div className="text-gray-400 text-xs flex items-center gap-1">
                {isSuperAdmin ? (
                  <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 rounded text-xs">Super Admin</span>
                ) : isAdmin ? (
                  <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">Administrator</span>
                ) : (
                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs">Team Member</span>
                )}
              </div>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900">IT Assets &amp; Repairs</h1>
              <p className="text-gray-500 text-sm">Raise and track equipment repair and replacement requests</p>
            </div>
            <button
              onClick={onOpenNewRequest}
              className="px-8 py-3 rounded-full text-white flex items-center gap-2 transition-colors font-medium hover:opacity-90"
              style={{ backgroundColor: '#2D60FF' }}
            >
              <Plus className="w-5 h-5" />
              New Request
            </button>
          </div>
        </div>

        <div className="px-8 py-8">
          {accessError && (
            <div
              className="mb-6 px-4 py-3 rounded-xl text-sm"
              style={{ backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}
            >
              {accessError}
            </div>
          )}

          {/* Summary Widgets */}
          <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
            {summaryCards.map(card => {
              const isActive = selectedFilter === card.id;
              return (
                <button
                  key={card.id}
                  onClick={() => setSelectedFilter(card.id)}
                  className="bg-white rounded-xl p-6 text-left transition-all cursor-pointer"
                  style={{
                    border: isActive ? '2px solid #2D60FF' : '1px solid #E5E7EB',
                    boxShadow: isActive ? '0 4px 12px rgba(45, 96, 255, 0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  <div className="text-sm text-gray-500 mb-2">{card.title}</div>
                  <div className="text-3xl" style={{ color: isActive ? '#2D60FF' : card.color }}>
                    {card.count}
                  </div>
                </button>
              );
            })}
          </div>

          {/* The Data Table */}
          <div className="bg-white rounded-xl border border-gray-200" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
              <h2 className="text-gray-900">{tableTitle}</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  {!search && (
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  )}
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search requests..."
                    className={`${search ? 'pl-3' : 'pl-9'} pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400`}
                    style={{ width: 240 }}
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as TypeFilter)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-700"
                >
                  <option value="all">All Types</option>
                  <option value="Repaired">Repaired</option>
                  <option value="Replaced">Replaced</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm text-gray-700 font-medium w-[30%]">Item</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-700 font-medium w-[18%]">Assigned To</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-700 font-medium w-[12%]">Date</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-700 font-medium w-[14%]">Status</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-700 font-medium w-[14%]">Action</th>
                    <th className="px-3 py-3 text-center text-sm text-gray-700 font-medium w-[6%]">Edit</th>
                    <th className="px-3 py-3 text-center text-sm text-gray-700 font-medium w-[6%]">Notify</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tableData.map(repair => {
                    const statusStyle = STATUS_STYLES[repair.status] || STATUS_STYLES['Pending Approval'];
                    const chip = ACTION_CHIP_STYLES[repair.action] || ACTION_CHIP_STYLES.Repaired;
                    // A decided request is locked — only pending ones can still be corrected.
                    const editable = repair.status === 'Pending Approval';

                    return (
                      <tr key={repair.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900">{repair.item}</span>
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                              style={{ backgroundColor: chip.bg, color: chip.color }}
                            >
                              {repair.action}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {repair.deviceType === 'Other' && repair.deviceTypeOther ? repair.deviceTypeOther : repair.deviceType} · {repair.deviceId || 'NA'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {(repair.assignedUsers || []).map(u => u.name).join(', ') || '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{formatRepairDate(repair.date)}</td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                            style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                          >
                            {repair.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {repair.status === 'Pending Approval' && (
                            <span
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                              style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                            >
                              Waiting for Approval
                            </span>
                          )}
                          {repair.status === 'Pending Invoice' && (
                            <button
                              onClick={() => setSelectedRepairForInvoice(repair)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                              style={{
                                color: '#EA580C',
                                border: '1px solid #EA580C',
                                backgroundColor: 'transparent',
                              }}
                            >
                              Upload Invoice
                            </button>
                          )}
                          {repair.status === 'In Finance' && repair.invoiceFilename && (
                            <button
                              onClick={() => setSelectedRepairForInvoice(repair)}
                              className="text-sm font-medium hover:underline"
                              style={{ color: '#2563EB' }}
                            >
                              {repair.invoiceFilename}
                            </button>
                          )}
                          {repair.status === 'Rejected' && (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-4 text-center">
                          <button
                            onClick={() => editable && onEditRepair(repair.id)}
                            disabled={!editable}
                            title={editable ? 'Edit request' : 'Locked — this request has already been decided'}
                            className="p-2 rounded-lg transition-colors hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            style={{ color: '#9CA3AF' }}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="px-3 py-4 text-center relative">
                          <div ref={notifyOpenFor === repair.id ? notifyRef : undefined} className="relative inline-block">
                            <button
                              onClick={() => {
                                setNotifyOpenFor(notifyOpenFor === repair.id ? null : repair.id);
                                setNotifyInput('');
                              }}
                              title="Quick Notify via Slack"
                              className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              style={{ color: notifyOpenFor === repair.id ? '#2D60FF' : '#9CA3AF' }}
                            >
                              <Bell className="w-4 h-4" />
                            </button>

                            {notifyOpenFor === repair.id && (
                              <div
                                className="absolute right-0 top-9 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-3"
                                style={{ width: '230px' }}
                              >
                                <p className="text-xs font-semibold text-gray-600 mb-2">Notify via Slack</p>

                                {slackWebhook ? (
                                  <>
                                    {slackMembers.length > 0 && (
                                      <div className="space-y-1 mb-2">
                                        {slackMembers.map(m => {
                                          const key = `${repair.id}:${m.label}`;
                                          const st = notifyStatus[key] || 'idle';
                                          return (
                                            <button
                                              key={m.label}
                                              disabled={st === 'sending'}
                                              onClick={() => sendNotify(repair, m.label, m.slack_id)}
                                              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors"
                                              style={{ border: '1px solid #E5E7EB' }}
                                            >
                                              <span className="font-medium text-gray-800">@{m.label}</span>
                                              {st === 'sending' && <Loader className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
                                              {st === 'sent' && <span className="text-xs text-green-600 font-medium">✓ Sent</span>}
                                              {st === 'error' && <span className="text-xs text-red-500 font-medium">✗ Failed</span>}
                                              {st === 'idle' && <Send className="w-3.5 h-3.5 text-gray-400" />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}

                                    <div className="flex gap-1.5 mt-1">
                                      <input
                                        type="text"
                                        value={notifyInput}
                                        onChange={e => setNotifyInput(e.target.value)}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter' && notifyInput.trim()) {
                                            sendNotify(repair, notifyInput.trim());
                                            setNotifyInput('');
                                          }
                                        }}
                                        placeholder="Type name / ID…"
                                        className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
                                      />
                                      <button
                                        disabled={!notifyInput.trim()}
                                        onClick={() => { sendNotify(repair, notifyInput.trim()); setNotifyInput(''); }}
                                        className="px-2 py-1.5 rounded-lg text-white text-xs disabled:opacity-40"
                                        style={{ backgroundColor: '#2D60FF' }}
                                      >
                                        <Send className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-xs text-gray-400 text-center py-2">
                                    Configure Slack webhook in<br />Slack Integration settings first.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {tableData.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No repair requests in this category.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Management Modal */}
      {selectedRepairForInvoice && (
        <RepairInvoiceManagement
          repair={selectedRepairForInvoice}
          onClose={() => setSelectedRepairForInvoice(null)}
          onUploadSuccess={async () => {
            await onRefreshRepairs();
            setSelectedRepairForInvoice(null);
          }}
        />
      )}
    </div>
  );
}
