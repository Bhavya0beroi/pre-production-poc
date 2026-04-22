import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Users, Plus, Trash2, KeyRound, X,
  AlertCircle, CheckCircle2, Eye, EyeOff,
  LayoutDashboard, CheckCircle, DollarSign, Package, Archive, Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : 'https://divine-nature-production-c49a.up.railway.app';

const LOCAL_USERS_KEY = 'shootflow_local_users';

export type UserRole = 'user' | 'admin' | 'super_admin';

interface UserRecord {
  email: string;
  name: string;
  role: UserRole;
  department: string;
  created_at?: string;
}

export interface RolePanelProps {
  onBack: () => void;
  currentUserEmail: string;
  onOpenApprovals?: () => void;
  onOpenFinance?: () => void;
  onOpenCatalog?: () => void;
  onOpenArchive?: () => void;
  onOpenSlackSettings?: () => void;
  approvalsPending?: number;
}

const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
  user:        { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  admin:       { bg: '#FDF4FF', text: '#7E22CE', border: '#E9D5FF' },
  super_admin: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
};

interface AddMemberForm {
  name: string; email: string; password: string; role: UserRole; department: string;
}

const SEED_USERS: UserRecord[] = [
  { email: 'bhavya.oberoi@learnapp.co',  name: 'Bhavya Oberoi',  role: 'super_admin', department: '' },
  { email: 'admin@learnapp.com',         name: 'Admin',          role: 'admin',       department: '' },
  { email: 'preproduction@learnapp.com', name: 'ShootFlow Team', role: 'user',        department: 'Production' },
];

function loadLocalUsers(): UserRecord[] {
  try {
    const s = localStorage.getItem(LOCAL_USERS_KEY);
    if (s) return JSON.parse(s);
  } catch { /* ignore */ }
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(SEED_USERS));
  return SEED_USERS;
}
function saveLocalUsers(u: UserRecord[]) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(u));
}

/* ─── Portal modal wrapper ─────────────────────────────────────── */
function Modal({ children }: { children: React.ReactNode }) {
  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '1rem',
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

export function RolePanel({
  onBack, currentUserEmail,
  onOpenApprovals, onOpenFinance, onOpenCatalog, onOpenArchive, onOpenSlackSettings,
  approvalsPending = 0,
}: RolePanelProps) {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingLocal, setUsingLocal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddMemberForm>({
    name: '', email: '', password: '', role: 'user', department: '',
  });
  const [addingUser, setAddingUser] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);

  const [pwModal, setPwModal] = useState<{ email: string; name: string } | null>(null);
  const [pwForm, setPwForm] = useState({ password: '', confirm: '' });
  const [showPwField, setShowPwField] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/users`, { signal: AbortSignal.timeout(4000) });
        if (!res.ok) throw new Error('Failed');
        setUsers(await res.json());
        setUsingLocal(false);
      } catch {
        setUsers(loadLocalUsers());
        setUsingLocal(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRoleChange = async (email: string, newRole: UserRole) => {
    const updated = users.map(u => u.email === email ? { ...u, role: newRole } : u);
    setUsers(updated);
    if (usingLocal) { saveLocalUsers(updated); showToast('success', 'Role updated.'); return; }
    try {
      const res = await fetch(`${API_URL}/api/users/${encodeURIComponent(email)}/role`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error();
      showToast('success', 'Role updated.');
    } catch { showToast('error', 'Failed to update role.'); }
  };

  const handleAddMember = async () => {
    if (!addForm.name || !addForm.email || !addForm.password) {
      showToast('error', 'Name, email and password are required.'); return;
    }
    setAddingUser(true);
    if (usingLocal) {
      const nu: UserRecord = { ...addForm, created_at: new Date().toISOString() };
      const updated = [...users, nu];
      setUsers(updated); saveLocalUsers(updated);
      setShowAddModal(false);
      setAddForm({ name: '', email: '', password: '', role: 'user', department: '' });
      showToast('success', `${nu.name} added.`);
      setAddingUser(false); return;
    }
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed'); }
      const nu = await res.json();
      setUsers(p => [...p, nu]);
      setShowAddModal(false);
      setAddForm({ name: '', email: '', password: '', role: 'user', department: '' });
      showToast('success', `${nu.name} added.`);
    } catch (e: any) { showToast('error', e.message || 'Failed.'); }
    finally { setAddingUser(false); }
  };

  const handleChangePassword = async () => {
    if (!pwForm.password) { showToast('error', 'Password cannot be empty.'); return; }
    if (pwForm.password !== pwForm.confirm) { showToast('error', 'Passwords do not match.'); return; }
    if (!pwModal) return;
    if (usingLocal) { setPwModal(null); showToast('success', 'Password noted.'); return; }
    setSavingPw(true);
    try {
      const res = await fetch(`${API_URL}/api/users/${encodeURIComponent(pwModal.email)}/password`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwForm.password }),
      });
      if (!res.ok) throw new Error();
      setPwModal(null); setPwForm({ password: '', confirm: '' });
      showToast('success', 'Password updated.');
    } catch { showToast('error', 'Failed to update password.'); }
    finally { setSavingPw(false); }
  };

  const handleDelete = async (email: string) => {
    if (email === currentUserEmail) { showToast('error', 'Cannot delete your own account.'); return; }
    if (usingLocal) {
      const updated = users.filter(u => u.email !== email);
      setUsers(updated); saveLocalUsers(updated);
      setDeleteConfirm(null); showToast('success', 'User removed.'); return;
    }
    try {
      const res = await fetch(`${API_URL}/api/users/${encodeURIComponent(email)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setUsers(p => p.filter(u => u.email !== email));
      setDeleteConfirm(null); showToast('success', 'User removed.');
    } catch { showToast('error', 'Failed to delete user.'); }
  };

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const avatarColor = (role: UserRole) =>
    role === 'super_admin' ? '#C2410C' : role === 'admin' ? '#7E22CE' : '#2D60FF';

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#F5F7FA' }}>

      {/* ── Toast portal ── */}
      {toast && ReactDOM.createPortal(
        <div
          style={{
            position: 'fixed', top: 20, right: 20, zIndex: 10000,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 20px', borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,.15)',
            backgroundColor: toast.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: toast.type === 'success' ? '#065F46' : '#991B1B',
            border: `1px solid ${toast.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            fontSize: 14, fontWeight: 500,
          }}
        >
          {toast.type === 'success'
            ? <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
            : <AlertCircle  style={{ width: 16, height: 16, flexShrink: 0 }} />}
          {toast.message}
        </div>,
        document.body,
      )}

      {/* ── Left Sidebar ── */}
      <div className="w-64 flex flex-col flex-shrink-0" style={{ backgroundColor: '#1F2937' }}>
        <div className="px-6 py-6 border-b" style={{ borderColor: '#374151' }}>
          <h2 className="text-white text-xl">ShootFlow</h2>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button onClick={onBack} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-gray-700" style={{ color: '#9CA3AF' }}>
            <LayoutDashboard className="w-5 h-5" /><span>Active Shoots</span>
          </button>
          <button onClick={onOpenApprovals} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left relative hover:bg-gray-700" style={{ color: '#9CA3AF' }}>
            <CheckCircle className="w-5 h-5" /><span>Approvals</span>
            {approvalsPending > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: '#F2994A', color: 'white' }}>
                {approvalsPending}
              </span>
            )}
          </button>
          <button onClick={onOpenFinance} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-gray-700" style={{ color: '#9CA3AF' }}>
            <DollarSign className="w-5 h-5" /><span>Finance & Invoices</span>
          </button>
          <button onClick={onOpenCatalog} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-gray-700" style={{ color: '#9CA3AF' }}>
            <Package className="w-5 h-5" /><span>Catalog</span>
          </button>
          <button onClick={onOpenArchive} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-gray-700" style={{ color: '#9CA3AF' }}>
            <Archive className="w-5 h-5" /><span>Archive</span>
          </button>
          <button onClick={onOpenSlackSettings} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-gray-700" style={{ color: '#9CA3AF' }}>
            <Zap className="w-5 h-5" /><span>Slack Integration</span>
          </button>
          {/* Role Panel — active */}
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left" style={{ backgroundColor: '#2D60FF', color: 'white' }}>
            <Users className="w-5 h-5" /><span>Role Panel</span>
          </button>
        </nav>
        <div className="px-4 py-6 border-t" style={{ borderColor: '#374151' }}>
          <div className="flex items-center gap-3 px-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ backgroundColor: '#2D60FF' }}>
              {isAdmin ? 'A' : 'PT'}
            </div>
            <div>
              <div className="text-white text-sm">{isAdmin ? 'Admin' : 'Pre-production Team'}</div>
              <div className="text-gray-400 text-xs">{isAdmin ? 'Administrator' : 'Team Member'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FFF7ED' }}>
              <Users className="w-5 h-5" style={{ color: '#C2410C' }} />
            </div>
            <div>
              <h1 className="text-gray-900 font-semibold text-lg">Team Members</h1>
              <p className="text-gray-400 text-xs">{users.length} member{users.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90"
            style={{ backgroundColor: '#2D60FF' }}
          >
            <Plus className="w-4 h-4" />Add Member
          </button>
        </div>

        <div className="px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Table head */}
              <div className="grid px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100"
                style={{ gridTemplateColumns: '1fr 180px 180px 100px' }}>
                <span>User</span><span>Role</span><span>Department</span>
                <span className="text-right">Actions</span>
              </div>

              <div className="divide-y divide-gray-50">
                {users.map(u => {
                  const c = ROLE_COLORS[u.role];
                  return (
                    <div key={u.email} className="grid px-6 py-4 items-center hover:bg-gray-50/60"
                      style={{ gridTemplateColumns: '1fr 180px 180px 100px' }}>

                      {/* User */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                          style={{ backgroundColor: avatarColor(u.role) }}>
                          {initials(u.name)}
                        </div>
                        <div>
                          <div className="text-gray-900 text-sm font-medium">
                            {u.name}
                            {u.email === currentUserEmail && <span className="ml-1 text-xs text-gray-400 font-normal">(you)</span>}
                          </div>
                          <div className="text-gray-400 text-xs">{u.email}</div>
                        </div>
                      </div>

                      {/* Role — plain native select, no custom icon overlay */}
                      <div>
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u.email, e.target.value as UserRole)}
                          style={{
                            backgroundColor: c.bg, color: c.text,
                            border: `1px solid ${c.border}`,
                            borderRadius: 8, padding: '4px 8px',
                            fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', outline: 'none',
                          }}
                        >
                          <option value="user">Member</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </div>

                      {/* Department */}
                      <div className="text-gray-500 text-sm">{u.department || '—'}</div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2">
                        <button
                          title="Change password"
                          onClick={() => { setPwModal({ email: u.email, name: u.name }); setPwForm({ password: '', confirm: '' }); setShowPwField(false); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                        ><KeyRound className="w-4 h-4" /></button>
                        <button
                          title="Remove user"
                          onClick={() => setDeleteConfirm(u.email)}
                          disabled={u.email === currentUserEmail}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        ><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  );
                })}
                {users.length === 0 && (
                  <div className="px-6 py-12 text-center text-gray-400 text-sm">No team members yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ MODALS via portal — always full viewport ══ */}

      {/* Add Member */}
      {showAddModal && (
        <Modal>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 24px 16px', borderBottom: '1px solid #F3F4F6' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>Add Team Member</h2>
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: '4px 0 0' }}>Share the email + password with them directly.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Full Name *', type: 'text', placeholder: 'Riya Sharma', key: 'name' },
                { label: 'Email *', type: 'email', placeholder: 'riya@learnapp.com', key: 'email' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{f.label}</label>
                  <input
                    type={f.type} placeholder={f.placeholder}
                    value={addForm[f.key as keyof AddMemberForm] as string}
                    onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 14, color: '#111827', background: '#F9FAFB', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Temporary Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showAddPassword ? 'text' : 'password'} placeholder="e.g. Learnapp@123"
                    value={addForm.password}
                    onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))}
                    style={{ width: '100%', padding: '10px 40px 10px 14px', border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 14, color: '#111827', background: '#F9FAFB', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button type="button" onClick={() => setShowAddPassword(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
                    {showAddPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Role</label>
                  <select value={addForm.role} onChange={e => setAddForm(p => ({ ...p, role: e.target.value as UserRole }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 14, color: '#111827', background: '#F9FAFB', outline: 'none' }}>
                    <option value="user">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Department</label>
                  <select value={addForm.department} onChange={e => setAddForm(p => ({ ...p, department: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 14, color: '#111827', background: '#F9FAFB', outline: 'none' }}>
                    <option value="">None</option>
                    <option value="Product">Product</option>
                    <option value="Production">Production</option>
                    <option value="Finance">Finance</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '0 24px 24px' }}>
              <button onClick={() => setShowAddModal(false)} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #E5E7EB', background: 'white', fontSize: 14, color: '#374151', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAddMember} disabled={addingUser} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#2D60FF', color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: addingUser ? 0.6 : 1 }}>
                {addingUser ? 'Creating…' : 'Create Account'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Change Password */}
      {pwModal && (
        <Modal>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 24px 16px', borderBottom: '1px solid #F3F4F6' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>Change Password</h2>
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: '2px 0 0' }}>{pwModal.name}</p>
              </div>
              <button onClick={() => setPwModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPwField ? 'text' : 'password'} placeholder="Enter new password"
                    value={pwForm.password} onChange={e => setPwForm(p => ({ ...p, password: e.target.value }))}
                    style={{ width: '100%', padding: '10px 40px 10px 14px', border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 14, color: '#111827', background: '#F9FAFB', outline: 'none', boxSizing: 'border-box' }} />
                  <button type="button" onClick={() => setShowPwField(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
                    {showPwField ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Confirm Password</label>
                <input type="password" placeholder="Confirm new password"
                  value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 14, color: '#111827', background: '#F9FAFB', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '0 24px 24px' }}>
              <button onClick={() => setPwModal(null)} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #E5E7EB', background: 'white', fontSize: 14, color: '#374151', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleChangePassword} disabled={savingPw} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#2D60FF', color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: savingPw ? 0.6 : 1 }}>
                {savingPw ? 'Saving…' : 'Update Password'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <Modal>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 380, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 style={{ width: 18, height: 18, color: '#EF4444' }} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>Remove Member</h2>
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: '2px 0 0' }}>{deleteConfirm}</p>
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#4B5563', marginBottom: 24 }}>
              This will permanently remove this user. They will no longer be able to log in.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #E5E7EB', background: 'white', fontSize: 14, color: '#374151', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#EF4444', color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Remove</button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
