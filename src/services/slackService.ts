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
    return {
      webhook_url: data.webhook_url || '',
      mentions: data.mentions || [],
      notifications: { ...DEFAULT_SLACK_PREFS, ...(data.notifications || {}) },
    };
  } catch {
    return { webhook_url: '', mentions: [], notifications: DEFAULT_SLACK_PREFS };
  }
}

export async function saveSlackSettings(settings: SlackSettings): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/slack/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
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
  const link = shoot.shootId ? `${appUrl}?shootId=${shoot.shootId}` : appUrl;

  // Build equipment lines (max 15 to keep message clean)
  const equipmentLines = (shoot.equipment ?? [])
    .slice(0, 15)
    .map(e => {
      const lineTotal = (e.dailyRate || 0) * (e.quantity || 1) * (e.days || 1);
      const priceStr = lineTotal > 0 ? ` — ₹${lineTotal.toLocaleString('en-IN')}` : '';
      return `• ${e.name} × ${e.quantity}${priceStr}`;
    })
    .join('\n');
  const extraCount = (shoot.equipment?.length ?? 0) - 15;

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
        text: {
          type: 'mrkdwn',
          text: `*📦 Equipment List*\n${equipmentLines}${extraCount > 0 ? `\n_…and ${extraCount} more_` : ''}`,
        },
      },
    );
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

  try {
    const res = await fetch(`${API_URL}/api/slack/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhook_url: webhookUrl, blocks, text: fallbackText }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.details || err.error || `HTTP ${res.status}`);
    }
    return true;
  } catch (e: any) {
    // Re-throw so callers can show the actual Slack error
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
