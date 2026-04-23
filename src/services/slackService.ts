const API_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : 'https://divine-nature-production-c49a.up.railway.app';

export interface SlackMention {
  label: string;   // Display name, e.g. "Bhavya"
  slack_id: string; // Slack member ID, e.g. "U012AB3CD"
}

export interface SlackNotificationPrefs {
  payment_due_7days: boolean;
  payment_due_1day: boolean;
  invoice_uploaded: boolean;
  request_submitted: boolean;
  request_approved_rejected: boolean;
}

export interface SlackSettings {
  webhook_url: string;
  mentions: SlackMention[];
  /** Separate people to tag specifically for quote-approval notifications */
  approvalMentions: SlackMention[];
  notifications: SlackNotificationPrefs;
}

export const DEFAULT_SLACK_PREFS: SlackNotificationPrefs = {
  payment_due_7days: false,
  payment_due_1day: false,
  invoice_uploaded: false,
  request_submitted: false,
  request_approved_rejected: false,
};

export async function getSlackSettings(): Promise<SlackSettings> {
  try {
    const res = await fetch(`${API_URL}/api/slack/settings`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    // approvalMentions is stored inside the notifications JSON to avoid schema change
    const notifs = data.notifications || {};
    const approvalMentions: SlackMention[] = notifs.approvalMentions || [];
    const { approvalMentions: _drop, ...cleanNotifs } = notifs;
    return {
      webhook_url: data.webhook_url || '',
      mentions: data.mentions || [],
      approvalMentions,
      notifications: { ...DEFAULT_SLACK_PREFS, ...cleanNotifs },
    };
  } catch {
    return { webhook_url: '', mentions: [], approvalMentions: [], notifications: DEFAULT_SLACK_PREFS };
  }
}

export async function saveSlackSettings(settings: SlackSettings): Promise<boolean> {
  try {
    // Pack approvalMentions inside notifications so no DB schema change needed
    const notificationsWithApproval = {
      ...settings.notifications,
      approvalMentions: settings.approvalMentions,
    };
    const res = await fetch(`${API_URL}/api/slack/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhook_url: settings.webhook_url,
        mentions: settings.mentions,
        notifications: notificationsWithApproval,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface EquipmentItem {
  name: string;
  quantity: number;
  dailyRate: number;
  days?: number;
}

export interface ShootNotificationData {
  shootName: string;
  dates: string;
  requestorName: string;
  equipment?: EquipmentItem[];
  estimatedBudget?: number;
  appUrl?: string;
  shootId?: string;
}

export async function sendSlackNotification(
  webhookUrl: string,
  shoot: ShootNotificationData,
  mentions: SlackMention[]
): Promise<boolean> {
  if (!webhookUrl) return false;

  const mentionText = mentions
    .map(m => (m.slack_id ? `<@${m.slack_id}>` : m.label))
    .join(' ');

  const totalItems = shoot.equipment?.length ?? 0;
  const budget = shoot.estimatedBudget
    ? `₹${shoot.estimatedBudget.toLocaleString('en-IN')}`
    : '—';

  const appUrl = shoot.appUrl || 'https://pre-production-poc-production.up.railway.app';
  const link = shoot.shootId ? `${appUrl}?shootId=${shoot.shootId}&view=dashboard` : appUrl;

  // Build equipment lines — show all items (split across blocks to respect 3000-char Slack limit)
  const allLines = (shoot.equipment ?? []).map(e => {
    const lineTotal = (e.dailyRate || 0) * (e.quantity || 1) * (e.days || 1);
    const priceStr = lineTotal > 0 ? ` — ₹${lineTotal.toLocaleString('en-IN')}` : '';
    return `• ${e.name} × ${e.quantity}${priceStr}`;
  });
  // Chunk into groups of ~20 lines to stay under per-block character limits
  const chunkLines = (lines: string[], size: number) => {
    const chunks: string[][] = [];
    for (let i = 0; i < lines.length; i += size) chunks.push(lines.slice(i, i + size));
    return chunks;
  };
  const equipmentChunks = chunkLines(allLines, 20);
  const equipmentLines = equipmentChunks[0]?.join('\n') ?? '';
  const extraChunks = equipmentChunks.slice(1);
  const extraCount = 0; // no longer needed — all items shown

  // ── Single-column layout — easy to read, matches email style ──
  const detailsText = [
    `*Shoot Name:*  ${shoot.shootName}`,
    `*Date:*  ${shoot.dates}`,
    `*Requested By:*  ${shoot.requestorName}`,
    `*Total Items:*  ${totalItems}`,
    `*Estimated Budget:*  ${budget}`,
  ].join('\n');

  const blocks: object[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🔔 New Shoot Request Submitted', emoji: true },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: detailsText },
    },
  ];

  if (equipmentLines) {
    blocks.push(
      { type: 'divider' },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*📦 Equipment List*\n${equipmentLines}` },
      },
    );
    // Append continuation chunks (each ≤20 lines, well under 3000-char limit)
    for (const chunk of extraChunks) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: chunk.join('\n') },
      });
    }
  }

  blocks.push(
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: mentionText
          ? `${mentionText} — please review and send to vendor.`
          : '_Please review and send to vendor._',
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Review & Send to Vendor →', emoji: true },
          url: link,
          style: 'primary',
        },
      ],
    },
  );

  // Plain-text fallback required by Slack alongside blocks
  const fallbackText = `🔔 New shoot request: ${shoot.shootName} — by ${shoot.requestorName}`;

  const logLabel = `🔔 New shoot request: ${shoot.shootName} — by ${shoot.requestorName}`;
  try {
    const res = await fetch(`${API_URL}/api/slack/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhook_url: webhookUrl, blocks, text: fallbackText }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const errMsg = err.details || err.error || `HTTP ${res.status}`;
      persistAlertLog(`${logLabel} — failed: ${errMsg}`, 'error');
      throw new Error(errMsg);
    }
    persistAlertLog(logLabel, 'success');
    return true;
  } catch (e: any) {
    throw e;
  }
}

/** Uses the simple /api/slack/test endpoint (plain text, no blocks) to verify the webhook */
export async function testSlackConnection(
  webhookUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/slack/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhook_url: webhookUrl }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.details || err.error || `HTTP ${res.status}`);
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Unknown error' };
  }
}

// ─────────────────────────────────────────────────────────────
// Per-event Slack helpers
// All are fire-and-forget — call with .catch(() => {})
// ─────────────────────────────────────────────────────────────

function persistAlertLog(message: string, type: 'success' | 'error') {
  try {
    const entry = { id: Date.now().toString(), message, timestamp: new Date().toISOString(), type };
    const existing = JSON.parse(localStorage.getItem('slack_alert_log') || '[]');
    const updated = [entry, ...existing].slice(0, 20);
    localStorage.setItem('slack_alert_log', JSON.stringify(updated));
  } catch { /* non-critical */ }
}

async function postToSlack(webhookUrl: string, text: string, blocks: object[]) {
  const res = await fetch(`${API_URL}/api/slack/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ webhook_url: webhookUrl, text, blocks }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const errMsg = err.details || err.error || `HTTP ${res.status}`;
    persistAlertLog(`${text} — failed: ${errMsg}`, 'error');
    throw new Error(errMsg);
  }
  persistAlertLog(text, 'success');
}

function mentionLine(mentions: SlackMention[]) {
  if (!mentions.length) return null;
  return mentions.map(m => (m.slack_id ? `<@${m.slack_id}>` : `@${m.label}`)).join(' ');
}

function buildBlocks(
  header: string,
  details: Record<string, string>,
  mentions: SlackMention[],
  link?: string,
  linkLabel?: string,
): object[] {
  const detailText = Object.entries(details)
    .map(([k, v]) => `*${k}:*  ${v}`)
    .join('\n');

  const blocks: object[] = [
    { type: 'header', text: { type: 'plain_text', text: header, emoji: true } },
    { type: 'divider' },
    { type: 'section', text: { type: 'mrkdwn', text: detailText } },
  ];

  const mt = mentionLine(mentions);
  if (mt) {
    blocks.push({ type: 'divider' });
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: mt } });
  }

  if (link && linkLabel) {
    blocks.push({
      type: 'actions',
      elements: [{
        type: 'button',
        text: { type: 'plain_text', text: linkLabel, emoji: true },
        url: link,
        style: 'primary',
      }],
    });
  }

  return blocks;
}

const APP = 'https://pre-production-poc-production.up.railway.app';

export async function slackQuoteSubmitted(
  webhookUrl: string,
  shoot: { id: string; name: string; dates: string; amount: number },
  approvalMentions: SlackMention[],
) {
  const link = `${APP}?shootId=${shoot.id}&view=approvals`;
  const blocks = buildBlocks(
    '💰 Quote Received — Needs Approval',
    {
      'Shoot': shoot.name,
      'Date': shoot.dates,
      'Vendor Total': `₹${shoot.amount.toLocaleString('en-IN')}`,
      'Action Needed': 'Review and approve the quote',
    },
    approvalMentions,
    link,
    'Review & Approve →',
  );
  await postToSlack(webhookUrl, `💰 Quote received for ${shoot.name} — needs approval`, blocks);
}

export async function slackQuoteApproved(
  webhookUrl: string,
  shoot: { id: string; name: string; dates: string; amount?: number },
  mentions: SlackMention[],
) {
  const link = `${APP}?shootId=${shoot.id}&view=dashboard`;
  const blocks = buildBlocks(
    '✅ Quote Approved',
    {
      'Shoot': shoot.name,
      'Date': shoot.dates,
      'Approved Amount': shoot.amount ? `₹${shoot.amount.toLocaleString('en-IN')}` : '—',
      'Status': 'Ready for shoot',
    },
    mentions,
    link,
    'View Shoot →',
  );
  await postToSlack(webhookUrl, `✅ Quote approved for ${shoot.name}`, blocks);
}

export async function slackQuoteRejected(
  webhookUrl: string,
  shoot: { id: string; name: string; dates: string; reason?: string },
  mentions: SlackMention[],
) {
  const link = `${APP}?shootId=${shoot.id}&view=dashboard`;
  const blocks = buildBlocks(
    '❌ Quote Rejected — Sent Back to Vendor',
    {
      'Shoot': shoot.name,
      'Date': shoot.dates,
      'Reason': shoot.reason || 'No reason provided',
      'Status': 'Vendor will revise and resubmit',
    },
    mentions,
    link,
    'View Shoot →',
  );
  await postToSlack(webhookUrl, `❌ Quote rejected for ${shoot.name}`, blocks);
}

export async function slackInvoiceUploaded(
  webhookUrl: string,
  shoot: { id: string; name: string; dates: string; fileName: string },
  mentions: SlackMention[],
) {
  const link = `${APP}?shootId=${shoot.id}&view=finance`;
  const blocks = buildBlocks(
    '📄 Invoice Uploaded — Action Required',
    {
      'Shoot': shoot.name,
      'Date': shoot.dates,
      'File': shoot.fileName,
      'Action Needed': 'Review invoice and mark as paid',
    },
    mentions,
    link,
    'View Invoice →',
  );
  await postToSlack(webhookUrl, `📄 Invoice uploaded for ${shoot.name}`, blocks);
}

export async function slackPaymentCompleted(
  webhookUrl: string,
  shoot: { id: string; name: string; dates: string; amount?: number },
  mentions: SlackMention[],
) {
  const link = `${APP}?shootId=${shoot.id}&view=finance`;
  const blocks = buildBlocks(
    '💵 Payment Completed',
    {
      'Shoot': shoot.name,
      'Date': shoot.dates,
      'Amount Paid': shoot.amount ? `₹${shoot.amount.toLocaleString('en-IN')}` : '—',
      'Status': 'Completed ✓',
    },
    mentions,
    link,
    'View Shoot →',
  );
  await postToSlack(webhookUrl, `💵 Payment completed for ${shoot.name}`, blocks);
}
