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

  const appUrl = shoot.appUrl || 'https://pre-production-poc.up.railway.app';
  const link = shoot.shootId ? `${appUrl}?shootId=${shoot.shootId}` : appUrl;

  // Build equipment lines (max 10 to keep message clean)
  const equipmentLines = (shoot.equipment ?? [])
    .slice(0, 10)
    .map(e => `• ${e.name} × ${e.quantity}`)
    .join('\n');
  const extraCount = (shoot.equipment?.length ?? 0) - 10;

  const blocks: object[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🔔 New Shoot Request Submitted', emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Shoot Name*\n${shoot.shootName}` },
        { type: 'mrkdwn', text: `*Date*\n${shoot.dates}` },
        { type: 'mrkdwn', text: `*Requested By*\n${shoot.requestorName}` },
        { type: 'mrkdwn', text: `*Total Items*\n${totalItems}` },
        { type: 'mrkdwn', text: `*Estimated Budget*\n${budget}` },
      ],
    },
  ];

  if (equipmentLines) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*📦 Equipment List*\n${equipmentLines}${extraCount > 0 ? `\n_…and ${extraCount} more_` : ''}`,
      },
    });
  }

  blocks.push(
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: mentionText
          ? `${mentionText} — please review and send to vendor.`
          : 'Please review and send to vendor.',
      },
      accessory: {
        type: 'button',
        text: { type: 'plain_text', text: 'Review & Send to Vendor →', emoji: true },
        url: link,
        style: 'primary',
      },
    },
  );

  try {
    const res = await fetch(`${API_URL}/api/slack/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhook_url: webhookUrl, blocks }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
