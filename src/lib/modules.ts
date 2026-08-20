import sharedConstants from '../../shared/constants.json';

/** Repairs at or above this rupee value need a human approval. Below it, they auto-approve. */
export const REPAIR_APPROVAL_THRESHOLD: number = sharedConstants.REPAIR_APPROVAL_THRESHOLD;

export type ModuleKey = 'shoots' | 'repairs';

export interface ModuleAccess {
  shoots: boolean;
  repairs: boolean;
}

export const MEMBER_DEFAULT_MODULE_ACCESS: ModuleAccess = { shoots: true, repairs: false };
export const FULL_MODULE_ACCESS: ModuleAccess = { shoots: true, repairs: true };

/** Admins and super admins always have every module, whatever is stored on the row. */
export function resolveModuleAccess(role: string | undefined, stored: any): ModuleAccess {
  if (role === 'admin' || role === 'super_admin') return { ...FULL_MODULE_ACCESS };

  let raw = stored;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { raw = null; }
  }
  if (!raw || typeof raw !== 'object') return { ...MEMBER_DEFAULT_MODULE_ACCESS };

  const access: ModuleAccess = {
    shoots: raw.shoots !== false,
    repairs: raw.repairs === true,
  };
  // A member with nothing ticked would be locked out of the app entirely.
  if (!access.shoots && !access.repairs) return { ...MEMBER_DEFAULT_MODULE_ACCESS };
  return access;
}

export function formatRupees(amount: number): string {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}
