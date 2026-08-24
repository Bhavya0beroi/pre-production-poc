const API_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : 'https://divine-nature-production-c49a.up.railway.app';

export type RepairAction = 'Repaired' | 'Replaced';
export type RepairDeviceType = 'PC' | 'Laptop' | 'Other';
export type RepairStatus = 'Pending Approval' | 'Pending Invoice' | 'In Finance' | 'Rejected';

export interface RepairApprovalTag {
  name: string;
  slackUserId: string;
}

export interface RepairAssignedUser {
  name: string;
  email?: string;
}

export interface RepairRequest {
  id: string;
  requestorName: string;
  approvalTags: RepairApprovalTag[];
  item: string;
  action: RepairAction;
  deviceType: RepairDeviceType;
  deviceTypeOther?: string | null;
  deviceId: string | null;
  assignedUsers: string[];
  date: string;
  cost: number;
  status: RepairStatus;
  createdBy?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  invoiceUrl?: string | null;
  invoiceFilename?: string | null;
  paymentConfirmed?: boolean;
  paid?: boolean;
  createdAt?: string;
}

export type RepairDraft = Omit<
  RepairRequest,
  'id' | 'status' | 'createdBy' | 'approvedBy' | 'approvedAt' | 'rejectionReason' | 'createdAt'
>;

/** The server decides module access from this header, so every repairs call must carry it. */
function authHeaders(userEmail: string | undefined): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-user-email': userEmail || '',
  };
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error || body.details || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function fetchRepairs(userEmail: string | undefined): Promise<RepairRequest[]> {
  const res = await fetch(`${API_URL}/api/repairs`, { headers: authHeaders(userEmail) });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function createRepair(userEmail: string | undefined, draft: RepairDraft): Promise<RepairRequest> {
  const res = await fetch(`${API_URL}/api/repairs`, {
    method: 'POST',
    headers: authHeaders(userEmail),
    body: JSON.stringify(draft),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function updateRepair(
  userEmail: string | undefined,
  id: string,
  draft: RepairDraft,
): Promise<RepairRequest> {
  const res = await fetch(`${API_URL}/api/repairs/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(userEmail),
    body: JSON.stringify(draft),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function approveRepair(userEmail: string | undefined, id: string): Promise<RepairRequest> {
  const res = await fetch(`${API_URL}/api/repairs/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    headers: authHeaders(userEmail),
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function rejectRepair(
  userEmail: string | undefined,
  id: string,
  rejectionReason: string,
): Promise<RepairRequest> {
  const res = await fetch(`${API_URL}/api/repairs/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    headers: authHeaders(userEmail),
    body: JSON.stringify({ rejectionReason }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function notifyRepair(
  userEmail: string | undefined,
  id: string,
  target: { name: string; slackUserId?: string },
): Promise<void> {
  const res = await fetch(`${API_URL}/api/repairs/${encodeURIComponent(id)}/notify`, {
    method: 'POST',
    headers: authHeaders(userEmail),
    body: JSON.stringify(target),
  });
  if (!res.ok) throw new Error(await readError(res));
}

export async function updateModuleAccess(
  email: string,
  moduleAccess: { shoots: boolean; repairs: boolean },
): Promise<void> {
  console.log('[updateModuleAccess] Updating:', email, moduleAccess);
  const res = await fetch(`${API_URL}/api/users/${encodeURIComponent(email)}/module-access`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moduleAccess }),
  });
  if (!res.ok) {
    const error = await readError(res);
    console.error('[updateModuleAccess] Failed:', error);
    throw new Error(error);
  }
  console.log('[updateModuleAccess] Success');
}

export async function uploadRepairInvoice(
  userEmail: string | undefined,
  id: string,
  file: File,
): Promise<RepairRequest> {
  const formData = new FormData();
  formData.append('invoice', file);
  
  const res = await fetch(`${API_URL}/api/repairs/${encodeURIComponent(id)}/invoice`, {
    method: 'POST',
    headers: {
      'x-user-email': userEmail || '',
    },
    body: formData,
  });
  
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function confirmRepairPayment(
  userEmail: string | undefined,
  id: string,
): Promise<RepairRequest> {
  const res = await fetch(`${API_URL}/api/repairs/${encodeURIComponent(id)}/confirm-payment`, {
    method: 'POST',
    headers: authHeaders(userEmail),
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function markRepairAsPaid(
  userEmail: string | undefined,
  id: string,
): Promise<RepairRequest> {
  const res = await fetch(`${API_URL}/api/repairs/${encodeURIComponent(id)}/mark-paid`, {
    method: 'POST',
    headers: authHeaders(userEmail),
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}
