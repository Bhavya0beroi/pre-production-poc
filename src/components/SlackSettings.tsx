import React, { useState, useEffect } from 'react';
import {
  Plus,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Save,
  LayoutDashboard,
  CheckCircle,
  DollarSign,
  Package,
  Archive,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import {
  testSlackConnection,
  getSlackSettings,
  saveSlackSettings,
  sendSlackNotification,
  DEFAULT_SLACK_PREFS,
  type SlackSettings as SlackSettingsType,
  type SlackMention,
} from '../services/slackService';

interface SlackSettingsProps {
  onBack: () => void;
  onOpenApprovals?: () => void;
  onOpenFinance?: () => void;
  onOpenCatalog?: () => void;
  onOpenArchive?: () => void;
  onOpenRolePanel?: () => void;
  approvalsPending?: number;
}

interface AlertLog {
  id: string;
  message: string;
  timestamp: string;
  type: 'success' | 'error';
}

const NOTIFICATION_LABELS: { key: string; label: string }[] = [
  { key: 'payment_due_7days', label: 'Payment due in 7 days' },
  { key: 'payment_due_1day', label: 'Payment due in 1 day' },
  { key: 'invoice_uploaded', label: 'Invoice uploaded' },
];

export function SlackSettings({
  onBack,
  onOpenApprovals,
  onOpenFinance,
  onOpenCatalog,
  onOpenArchive,
  onOpenRolePanel,
  approvalsPending = 0,
}: SlackSettingsProps) {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [settings, setSettings] = useState<SlackSettingsType>({
    webhook_url: '',
    mentions: [],
    approvalMentions: [],
    notifications: DEFAULT_SLACK_PREFS,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [alertLog, setAlertLog] = useState<AlertLog[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    (async () => {
      const s = await getSlackSettings();
      setSettings(s);
      setLoading(false);
    })();
    const loadLog = () => {
      try {
        const stored = localStorage.getItem('slack_alert_log');
        if (stored) setAlertLog(JSON.parse(stored));
      } catch { /* ignore */ }
    };
    loadLog();
    // Refresh log whenever another tab/component writes to localStorage
    const onStorage = (e: StorageEvent) => { if (e.key === 'slack_alert_log') loadLog(); };
    window.addEventListener('storage', onStorage);
    // Also poll every 5 s for same-tab updates (postToSlack runs in same window)
    const poll = setInterval(loadLog, 5000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(poll); };
  }, []);

  const addAlert = (message: string, type: 'success' | 'error') => {
    const entry: AlertLog = {
      id: Date.now().toString(),
      message,
      timestamp: new Date().toISOString(),
      type,
    };
    setAlertLog(prev => {
      const updated = [entry, ...prev].slice(0, 20);
      localStorage.setItem('slack_alert_log', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveSlackSettings(settings);
    setSaving(false);
    if (ok) {
      showToast('success', 'Slack settings saved successfully.');
    } else {
      showToast('error', 'Failed to save. Make sure the server is running.');
    }
  };

  const handleTestConnection = async () => {
    if (!settings.webhook_url) {
      showToast('error', 'Please enter a Webhook URL first.');
      return;
    }
    setTesting(true);
    const { ok, error } = await testSlackConnection(settings.webhook_url);
    setTesting(false);
    if (ok) {
      showToast('success', 'Test message sent to Slack! ✅');
      addAlert('Test connection — message delivered to Slack', 'success');
    } else {
      // Show the exact error Slack returned so user knows what to fix
      const detail = error?.includes('no_service')
        ? 'Webhook URL is invalid or has been revoked. Please generate a new one from api.slack.com/apps.'
        : error?.includes('channel_not_found')
        ? 'Channel not found. Make sure the Slack app is added to the channel.'
        : error?.includes('HTTP 4')
        ? `Slack rejected the request: ${error}. Try regenerating the webhook.`
        : error || 'Unknown error. Check the webhook URL.';
      showToast('error', `Failed: ${detail}`);
      addAlert(`Test failed — ${detail}`, 'error');
    }
  };

  const addMention = () =>
    setSettings(s => ({ ...s, mentions: [...s.mentions, { label: '', slack_id: '' }] }));

  const updateMention = (i: number, field: keyof SlackMention, value: string) =>
    setSettings(s => {
      const updated = [...s.mentions];
      updated[i] = { ...updated[i], [field]: value };
      return { ...s, mentions: updated };
    });

  const removeMention = (i: number) =>
    setSettings(s => ({ ...s, mentions: s.mentions.filter((_, idx) => idx !== i) }));

  const addApprovalMention = () =>
    setSettings(s => ({ ...s, approvalMentions: [...(s.approvalMentions || []), { label: '', slack_id: '' }] }));

  const updateApprovalMention = (i: number, field: keyof SlackMention, value: string) =>
    setSettings(s => {
      const updated = [...(s.approvalMentions || [])];
      updated[i] = { ...updated[i], [field]: value };
      return { ...s, approvalMentions: updated };
    });

  const removeApprovalMention = (i: number) =>
    setSettings(s => ({ ...s, approvalMentions: (s.approvalMentions || []).filter((_, idx) => idx !== i) }));

  const toggleNotification = (key: string) =>
    setSettings(s => ({
      ...s,
      notifications: {
        ...s.notifications,
        [key]: !s.notifications[key as keyof typeof s.notifications],
      },
    }));

  if (loading) {
    return (
      <div className="flex h-screen" style={{ backgroundColor: '#F5F7FA' }}>
        <Sidebar
          onBack={onBack}
          onOpenApprovals={onOpenApprovals}
          onOpenFinance={onOpenFinance}
          onOpenCatalog={onOpenCatalog}
          onOpenArchive={onOpenArchive}
          onOpenRolePanel={onOpenRolePanel}
          approvalsPending={approvalsPending}
          isAdmin={!!isAdmin}
          isSuperAdmin={!!isSuperAdmin}
        />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Left Sidebar */}
      <Sidebar
        onBack={onBack}
        onOpenApprovals={onOpenApprovals}
        onOpenFinance={onOpenFinance}
        onOpenCatalog={onOpenCatalog}
        onOpenArchive={onOpenArchive}
        onOpenRolePanel={onOpenRolePanel}
        approvalsPending={approvalsPending}
        isAdmin={!!isAdmin}
        isSuperAdmin={!!isSuperAdmin}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto" style={{ backgroundColor: '#F5F5F0' }}>
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium"
          style={{
            backgroundColor: toast.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: toast.type === 'success' ? '#065F46' : '#991B1B',
            border: `1px solid ${toast.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          }}
        >
          {toast.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Page title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Slack Integration Settings</h1>

        {/* Two-column cards */}
        <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* LEFT — Connect Slack Workspace */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Card header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#4A154B' }}
              >
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-gray-900 font-semibold text-base">Connect Slack Workspace</h2>
                <p className="text-gray-400 text-xs">Automate your procurement lifecycle notifications.</p>
              </div>
            </div>

            <p className="text-gray-500 text-sm mb-5 leading-relaxed">
              Paste your Slack Incoming Webhook URL. ShootFlow will send shoot request
              alerts and notifications to your chosen channel.
            </p>

            {/* Webhook URL */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Webhook URL
              </label>
              <input
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={settings.webhook_url}
                onChange={e => setSettings(s => ({ ...s, webhook_url: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
                style={{ borderColor: '#E5E5E5', backgroundColor: '#FAFAFA' }}
              />
            </div>

            {/* Notify People */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Notify People
                </label>
                <button
                  onClick={addMention}
                  className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Person
                </button>
              </div>

              {settings.mentions.length > 0 && (
                <div className="space-y-2">
                  {settings.mentions.map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Name"
                        value={m.label}
                        onChange={e => updateMention(i, 'label', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
                        style={{ borderColor: '#E5E5E5', backgroundColor: '#FAFAFA' }}
                      />
                      <input
                        type="text"
                        placeholder="Slack User ID (U012AB3CD)"
                        value={m.slack_id}
                        onChange={e => updateMention(i, 'slack_id', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 font-mono"
                        style={{ borderColor: '#E5E5E5', backgroundColor: '#FAFAFA' }}
                      />
                      <button
                        onClick={() => removeMention(i)}
                        className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approval Reviewer — tagged specifically when quote needs approval */}
            <div className="mb-5 p-4 rounded-xl border-2 border-dashed" style={{ borderColor: '#FCD34D', backgroundColor: '#FFFBEB' }}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#92400E' }}>
                    Approval Reviewer
                  </label>
                  <p className="text-xs mt-0.5" style={{ color: '#A16207' }}>
                    Tagged <strong>only</strong> when a quote is submitted and needs approval
                  </p>
                </div>
                <button
                  onClick={addApprovalMention}
                  className="flex items-center gap-1 text-xs font-medium transition-colors"
                  style={{ color: '#D97706' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              {(settings.approvalMentions || []).length === 0 && (
                <p className="text-xs mt-2" style={{ color: '#B45309' }}>
                  No approval reviewer set — quote notifications will use "Notify People" above.
                </p>
              )}

              {(settings.approvalMentions || []).length > 0 && (
                <div className="space-y-2 mt-2">
                  {(settings.approvalMentions || []).map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Name (e.g. Bhavya)"
                        value={m.label}
                        onChange={e => updateApprovalMention(i, 'label', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2"
                        style={{ borderColor: '#FCD34D', backgroundColor: '#FFFDE7' }}
                      />
                      <input
                        type="text"
                        placeholder="Slack ID (U012AB3CD)"
                        value={m.slack_id}
                        onChange={e => updateApprovalMention(i, 'slack_id', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 font-mono"
                        style={{ borderColor: '#FCD34D', backgroundColor: '#FFFDE7' }}
                      />
                      <button
                        onClick={() => removeApprovalMention(i)}
                        className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-yellow-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {testing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Test Connection
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#2D60FF' }}
              >
                {saving
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Save className="w-3.5 h-3.5" />}
                Save Changes
              </button>
            </div>
          </div>

          {/* RIGHT — Notification Preferences */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-gray-900 font-semibold text-base mb-5">Notification Preferences</h2>

            <div className="divide-y divide-gray-100">
              {NOTIFICATION_LABELS.map(({ key, label }) => {
                const enabled = settings.notifications[key as keyof typeof settings.notifications] ?? false;
                return (
                  <div key={key} className="flex items-center justify-between py-3">
                    <span className="text-gray-600 text-sm">{label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => toggleNotification(key)}
                      className="inline-flex items-center flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                      style={{
                        width: 44,
                        height: 24,
                        backgroundColor: enabled ? '#2D60FF' : '#D1D5DB',
                        padding: 2,
                      }}
                    >
                      <span
                        className="inline-block rounded-full bg-white shadow-sm transition-transform duration-200"
                        style={{
                          width: 16,
                          height: 16,
                          transform: enabled ? 'translateX(20px)' : 'translateX(0px)',
                        }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Alerts Sent — full width */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-gray-900 font-semibold text-base">Recent Alerts Sent</h2>
            <button
              onClick={() => {
                setAlertLog([]);
                localStorage.removeItem('slack_alert_log');
              }}
              className="text-xs font-semibold uppercase tracking-widest transition-colors"
              style={{ color: '#E8823A' }}
            >
              {alertLog.length > 0 ? 'Clear Log' : 'Live Activity Log'}
            </button>
          </div>

          {alertLog.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              No alerts sent yet. Configure Slack above to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {alertLog.map(log => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: log.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                  }}
                >
                  {log.type === 'success'
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    : <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                  <span className="flex-1 text-gray-700">{log.message}</span>
                  <span className="text-gray-400 text-xs flex-shrink-0">
                    {new Date(log.timestamp).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

// ── Sidebar helper component ──────────────────────────────────────────────────
interface SidebarProps {
  onBack: () => void;
  onOpenApprovals?: () => void;
  onOpenFinance?: () => void;
  onOpenCatalog?: () => void;
  onOpenArchive?: () => void;
  onOpenRolePanel?: () => void;
  approvalsPending: number;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

function Sidebar({
  onBack,
  onOpenApprovals,
  onOpenFinance,
  onOpenCatalog,
  onOpenArchive,
  onOpenRolePanel,
  approvalsPending,
  isAdmin,
  isSuperAdmin,
}: SidebarProps) {
  return (
    <div className="w-64 flex flex-col flex-shrink-0" style={{ backgroundColor: '#1F2937' }}>
      {/* Logo */}
      <div className="px-6 py-6 border-b" style={{ borderColor: '#374151' }}>
        <h2 className="text-white text-xl">ShootFlow</h2>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <button
          onClick={onBack}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-700"
          style={{ color: '#9CA3AF' }}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Active Shoots</span>
        </button>

        {onOpenApprovals && (
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
        )}

        {onOpenFinance && (
          <button
            onClick={onOpenFinance}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-700"
            style={{ color: '#9CA3AF' }}
          >
            <DollarSign className="w-5 h-5" />
            <span>Finance & Invoices</span>
          </button>
        )}

        {onOpenCatalog && (
          <button
            onClick={onOpenCatalog}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-700"
            style={{ color: '#9CA3AF' }}
          >
            <Package className="w-5 h-5" />
            <span>Catalog</span>
          </button>
        )}

        {onOpenArchive && (
          <button
            onClick={onOpenArchive}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-700"
            style={{ color: '#9CA3AF' }}
          >
            <Archive className="w-5 h-5" />
            <span>Archive</span>
          </button>
        )}

        {/* Slack Integration — active */}
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left"
          style={{ backgroundColor: '#2D60FF', color: 'white' }}
        >
          <Zap className="w-5 h-5" />
          <span>Slack Integration</span>
        </button>

        {/* Role Panel — always visible */}
        <button
          onClick={() => onOpenRolePanel?.()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-700"
          style={{ color: '#9CA3AF' }}
        >
          <Users className="w-5 h-5" />
          <span>Role Panel</span>
        </button>

      </nav>

      {/* User badge */}
      <div className="px-4 py-6 border-t" style={{ borderColor: '#374151' }}>
        <div className="flex items-center gap-3 px-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: '#2D60FF' }}
          >
            {isAdmin ? 'A' : 'PT'}
          </div>
          <div>
            <div className="text-white text-sm">{isAdmin ? 'Admin' : 'Pre-production Team'}</div>
            <div className="text-gray-400 text-xs">{isAdmin ? 'Administrator' : 'Team Member'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
