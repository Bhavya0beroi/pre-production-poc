import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSlackSettings, type SlackMention } from '../services/slackService';
import { REPAIR_APPROVAL_THRESHOLD, formatRupees } from '../lib/modules';
import type {
  RepairAction,
  RepairApprovalTag,
  RepairAssignedUser,
  RepairDeviceType,
  RepairDraft,
  RepairRequest,
} from '../services/repairService';

const API_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : 'https://divine-nature-production-c49a.up.railway.app';

interface CreateRepairRequestModalProps {
  onClose: () => void;
  onSubmit: (draft: RepairDraft) => Promise<void>;
  /** Present when correcting a request that is still pending approval. */
  initialRepair?: RepairRequest | null;
}

type FieldErrors = Partial<Record<
  'requestorName' | 'approvalTags' | 'item' | 'action' | 'deviceType' | 'deviceTypeOther' | 'assignedUsers' | 'date' | 'cost',
  string
>>;

const ACTIONS: RepairAction[] = ['Repaired', 'Replaced'];
const DEVICE_TYPES: RepairDeviceType[] = ['PC', 'Laptop', 'Other'];

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: '#334155',
};

const inputStyle: React.CSSProperties = {
  height: 42,
  width: '100%',
  padding: '0 12px',
  fontSize: 14,
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  background: '#FFFFFF',
  boxSizing: 'border-box',
  outline: 'none',
  color: '#0F172A',
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const twoColStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
};

const chipContainerStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 42,
  padding: '6px 8px',
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  background: '#FFFFFF',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 6,
  boxSizing: 'border-box',
  cursor: 'text',
};

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 8px',
  fontSize: 13,
  borderRadius: 6,
  background: '#EFF6FF',
  color: '#2563EB',
  border: 'none',
  whiteSpace: 'nowrap',
};

const chipInputStyle: React.CSSProperties = {
  border: 'none',
  outline: 'none',
  padding: 0,
  margin: 0,
  fontSize: 14,
  background: 'transparent',
  flex: 1,
  minWidth: 120,
  height: 28,
  boxSizing: 'border-box',
  color: '#0F172A',
};

const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = '#2563EB';
};

const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = '#E2E8F0';
};

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T | '';
  onChange: (next: T) => void;
}) {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        overflow: 'hidden',
        height: 38,
        boxSizing: 'border-box',
      }}
    >
      {options.map((option, index) => {
        const active = value === option;
        const isLast = index === options.length - 1;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              cursor: 'pointer',
              border: 'none',
              borderRight: isLast ? 'none' : '1px solid #E2E8F0',
              background: active ? '#EFF6FF' : '#FFFFFF',
              color: active ? '#2563EB' : '#334155',
              fontWeight: active ? 500 : 400,
              boxSizing: 'border-box',
              height: '100%',
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function CreateRepairRequestModal({ onClose, onSubmit, initialRepair = null }: CreateRepairRequestModalProps) {
  const { user } = useAuth();
  const isEditing = !!initialRepair;

  const [requestorName, setRequestorName] = useState(initialRepair?.requestorName ?? user?.name ?? '');
  const [approvalTags, setApprovalTags] = useState<RepairApprovalTag[]>(initialRepair?.approvalTags ?? []);
  const [approvalInput, setApprovalInput] = useState('');
  const [item, setItem] = useState(initialRepair?.item ?? '');
  const [action, setAction] = useState<RepairAction | ''>(initialRepair?.action ?? 'Repaired');
  const [deviceType, setDeviceType] = useState<RepairDeviceType | ''>(initialRepair?.deviceType ?? 'PC');
  const [deviceTypeOther, setDeviceTypeOther] = useState(initialRepair?.deviceTypeOther ?? '');
  const [deviceId, setDeviceId] = useState(initialRepair?.deviceId ?? '');
  const [deviceNA, setDeviceNA] = useState(isEditing ? initialRepair?.deviceId == null : false);
  const [assignedUsers, setAssignedUsers] = useState<string[]>(initialRepair?.assignedUsers ?? []);
  const [assignedInput, setAssignedInput] = useState('');
  const [date, setDate] = useState(initialRepair?.date ?? '');
  const [cost, setCost] = useState(initialRepair ? String(initialRepair.cost) : '');

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [slackDirectory, setSlackDirectory] = useState<SlackMention[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<RepairAssignedUser[]>([]);
  const [showApprovalOptions, setShowApprovalOptions] = useState(false);
  const [showAssignedOptions, setShowAssignedOptions] = useState(false);
  const approvalBoxRef = useRef<HTMLDivElement>(null);
  const assignedBoxRef = useRef<HTMLDivElement>(null);
  const approvalInputRef = useRef<HTMLInputElement>(null);
  const assignedInputRef = useRef<HTMLInputElement>(null);

  // Prefill the approval tags from the Approval Reviewer list on the Slack Integration page.
  useEffect(() => {
    getSlackSettings()
      .then(settings => {
        const directory = [...(settings.approvalMentions || []), ...(settings.mentions || [])]
          .filter(m => m.label);
        setSlackDirectory(directory);
        if (!isEditing) {
          setApprovalTags(
            (settings.approvalMentions || [])
              .filter(m => m.label)
              .map(m => ({ name: m.label, slackUserId: m.slack_id || '' }))
          );
        }
      })
      .catch(() => {});
  }, [isEditing]);

  useEffect(() => {
    fetch(`${API_URL}/api/users`)
      .then(r => (r.ok ? r.json() : []))
      .then((rows: any[]) => {
        setDirectoryUsers(
          (Array.isArray(rows) ? rows : [])
            .filter(r => r?.name)
            .map(r => ({ name: r.name, email: r.email }))
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (approvalBoxRef.current && !approvalBoxRef.current.contains(e.target as Node)) setShowApprovalOptions(false);
      if (assignedBoxRef.current && !assignedBoxRef.current.contains(e.target as Node)) setShowAssignedOptions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const costValue = Number(cost);
  const hasCost = cost.trim() !== '' && Number.isFinite(costValue);
  // Everything below the threshold skips approval, so the tag field is dead weight there.
  const needsApproval = !hasCost || costValue >= REPAIR_APPROVAL_THRESHOLD;

  const approvalSuggestions = useMemo(() => {
    const term = approvalInput.trim().toLowerCase();
    return slackDirectory
      .filter(m => !approvalTags.some(t => t.name.toLowerCase() === m.label.toLowerCase()))
      .filter(m => !term || m.label.toLowerCase().includes(term))
      .slice(0, 6);
  }, [slackDirectory, approvalTags, approvalInput]);

  const assignedSuggestions = useMemo(() => {
    const term = assignedInput.trim().toLowerCase();
    return directoryUsers
      .filter(u => !assignedUsers.some(name => name.toLowerCase() === u.name.toLowerCase()))
      .filter(u => !term || u.name.toLowerCase().includes(term))
      .slice(0, 6);
  }, [directoryUsers, assignedUsers, assignedInput]);

  const addApprovalTag = (tag: RepairApprovalTag) => {
    if (!tag.name.trim()) return;
    if (approvalTags.some(t => t.name.toLowerCase() === tag.name.trim().toLowerCase())) return;
    setApprovalTags(prev => [...prev, { name: tag.name.trim(), slackUserId: tag.slackUserId || '' }]);
    setApprovalInput('');
    setErrors(prev => ({ ...prev, approvalTags: undefined }));
  };

  const addAssignedUser = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (assignedUsers.some(n => n.toLowerCase() === trimmed.toLowerCase())) return;
    setAssignedUsers(prev => [...prev, trimmed]);
    setAssignedInput('');
    setErrors(prev => ({ ...prev, assignedUsers: undefined }));
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!requestorName.trim()) next.requestorName = 'Requestor name is required.';
    if (!item.trim()) next.item = 'Item is required.';
    if (!action) next.action = 'Choose Repaired or Replaced.';
    if (!deviceType) next.deviceType = 'Choose a device type.';
    if (deviceType === 'Other' && !deviceTypeOther.trim()) {
      next.deviceTypeOther = 'Please specify the device type.';
    }
    if (assignedUsers.length === 0) next.assignedUsers = 'Assign at least one user.';
    if (!date) next.date = 'Date is required.';
    if (!hasCost || costValue <= 0) next.cost = 'Cost must be greater than 0.';
    if (hasCost && costValue >= REPAIR_APPROVAL_THRESHOLD && approvalTags.length === 0) {
      next.approvalTags = 'Tag at least one person for approval.';
    }
    return next;
  };

  const handleSubmit = async () => {
    const found = validate();
    setErrors(found);
    setSubmitError('');
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        requestorName: requestorName.trim(),
        approvalTags: needsApproval ? approvalTags : [],
        item: item.trim(),
        action: action as RepairAction,
        deviceType: deviceType as RepairDeviceType,
        deviceTypeOther: deviceType === 'Other' && deviceTypeOther.trim() ? deviceTypeOther.trim() : null,
        deviceId: deviceNA || !deviceId.trim() ? null : deviceId.trim(),
        assignedUsers,
        date,
        cost: costValue,
      });
    } catch (e: any) {
      setSubmitError(e?.message || 'Could not submit this request.');
      setSubmitting(false);
    }
  };

  const errorText = (key: keyof FieldErrors) =>
    errors[key] ? <p style={{ fontSize: 12, marginTop: 4, color: '#DC2626', margin: '4px 0 0' }}>{errors[key]}</p> : null;

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    marginTop: 4,
    background: '#FFFFFF',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    border: '1px solid #E2E8F0',
    padding: '4px 0',
    zIndex: 50,
    boxSizing: 'border-box',
  };

  const dropdownItemStyle: React.CSSProperties = {
    width: '100%',
    textAlign: 'left',
    padding: '8px 12px',
    fontSize: 14,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    boxSizing: 'border-box',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFFFF',
          borderRadius: 12,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0F172A', margin: 0 }}>
              {isEditing ? 'Edit Request' : 'Create New Request'}
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 2, marginBottom: 0 }}>
              Log equipment work and its cost
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0 }}
          >
            <X style={{ width: 20, height: 20, color: '#64748B' }} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: 24,
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            boxSizing: 'border-box',
          }}
        >
          {/* 1. Requestor Name */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Requestor Name</label>
            <input
              type="text"
              value={requestorName}
              onChange={e => setRequestorName(e.target.value)}
              placeholder="Your name"
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            {errorText('requestorName')}
          </div>

          {/* 2. Tag for Approval */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Tag for Approval</label>
            <div ref={approvalBoxRef} style={{ position: 'relative', width: '100%' }}>
              <div
                style={{
                  ...chipContainerStyle,
                  opacity: needsApproval ? 1 : 0.5,
                  pointerEvents: needsApproval ? 'auto' : 'none',
                }}
                onClick={() => approvalInputRef.current?.focus()}
              >
                {approvalTags.map(tag => (
                  <span key={tag.name} style={chipStyle}>
                    @{tag.name}
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setApprovalTags(prev => prev.filter(t => t.name !== tag.name));
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        lineHeight: 0,
                      }}
                    >
                      <X style={{ width: 12, height: 12, color: 'rgba(37, 99, 235, 0.7)' }} />
                    </button>
                  </span>
                ))}
                <input
                  ref={approvalInputRef}
                  type="text"
                  value={approvalInput}
                  onChange={e => { setApprovalInput(e.target.value); setShowApprovalOptions(true); }}
                  onFocus={() => setShowApprovalOptions(true)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && approvalInput.trim()) {
                      e.preventDefault();
                      const match = slackDirectory.find(m => m.label.toLowerCase() === approvalInput.trim().toLowerCase());
                      addApprovalTag({ name: match?.label || approvalInput, slackUserId: match?.slack_id || '' });
                    }
                  }}
                  placeholder="Add..."
                  style={chipInputStyle}
                />
              </div>

              {showApprovalOptions && approvalSuggestions.length > 0 && (
                <div style={dropdownStyle}>
                  {approvalSuggestions.map(m => (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => addApprovalTag({ name: m.label, slackUserId: m.slack_id })}
                      style={dropdownItemStyle}
                      onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ color: '#0F172A' }}>@{m.label}</span>
                      {m.slack_id && <span style={{ color: '#94A3B8', fontSize: 12, marginLeft: 8 }}>{m.slack_id}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Live routing hint — reacts as the cost is typed */}
            <p style={{ fontSize: 12, color: '#64748B', marginTop: 6, marginBottom: 0 }}>
              {needsApproval && hasCost
                ? `${formatRupees(REPAIR_APPROVAL_THRESHOLD)} and above — these people will be tagged on Slack for approval.`
                : !hasCost
                  ? `Requests of ${formatRupees(REPAIR_APPROVAL_THRESHOLD)} and above need approval.`
                  : `Under ${formatRupees(REPAIR_APPROVAL_THRESHOLD)} — this will be approved automatically. No one will be tagged.`}
            </p>
            {errorText('approvalTags')}
          </div>

          {/* 3. Item */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Item</label>
            <input
              type="text"
              value={item}
              onChange={e => setItem(e.target.value)}
              placeholder="e.g., Motherboard, LCD Screen"
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            {errorText('item')}
          </div>

          {/* 4. Action | Device Type */}
          <div style={twoColStyle}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Action</label>
              <SegmentedControl options={ACTIONS} value={action} onChange={setAction} />
              {errorText('action')}
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Device Type</label>
              <SegmentedControl
                options={DEVICE_TYPES}
                value={deviceType}
                onChange={(val) => {
                  setDeviceType(val);
                  if (val !== 'Other') setDeviceTypeOther('');
                }}
              />
              {errorText('deviceType')}
            </div>
          </div>

          {/* 4a. Specify Device Type (when Other is selected) */}
          {deviceType === 'Other' && (
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Specify Device Type</label>
              <input
                type="text"
                value={deviceTypeOther}
                onChange={(e) => setDeviceTypeOther(e.target.value)}
                placeholder="e.g., UPS, Printer, Monitor"
                style={inputStyle}
              />
              {errorText('deviceTypeOther')}
            </div>
          )}

          {/* 5. Device ID */}
          <div style={fieldGroupStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <label style={{ ...labelStyle, margin: 0 }}>Device ID</label>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: '#64748B',
                  cursor: 'pointer',
                  margin: 0,
                }}
              >
                <input
                  type="checkbox"
                  checked={deviceNA}
                  onChange={e => {
                    setDeviceNA(e.target.checked);
                    if (e.target.checked) setDeviceId('');
                  }}
                  style={{ width: 14, height: 14, accentColor: '#2563EB', margin: 0 }}
                />
                Mark as NA
              </label>
            </div>
            <input
              type="text"
              value={deviceId}
              onChange={e => setDeviceId(e.target.value)}
              disabled={deviceNA}
              placeholder="Enter Device Asset ID"
              style={{
                ...inputStyle,
                ...(deviceNA ? { backgroundColor: '#F8FAFC', color: '#94A3B8' } : {}),
              }}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>

          {/* 6. Assigned Users */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Assigned Users</label>
            <div ref={assignedBoxRef} style={{ position: 'relative', width: '100%' }}>
              <div
                style={chipContainerStyle}
                onClick={() => assignedInputRef.current?.focus()}
              >
                {assignedUsers.map(name => (
                  <span key={name} style={chipStyle}>
                    {name}
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setAssignedUsers(prev => prev.filter(n => n !== name));
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        lineHeight: 0,
                      }}
                    >
                      <X style={{ width: 12, height: 12, color: 'rgba(37, 99, 235, 0.7)' }} />
                    </button>
                  </span>
                ))}
                <input
                  ref={assignedInputRef}
                  type="text"
                  value={assignedInput}
                  onChange={e => { setAssignedInput(e.target.value); setShowAssignedOptions(true); }}
                  onFocus={() => setShowAssignedOptions(true)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && assignedInput.trim()) {
                      e.preventDefault();
                      addAssignedUser(assignedInput.trim());
                    }
                  }}
                  placeholder="Add..."
                  style={chipInputStyle}
                />
              </div>

              {showAssignedOptions && assignedSuggestions.length > 0 && (
                <div style={dropdownStyle}>
                  {assignedSuggestions.map(u => (
                    <button
                      key={u.name}
                      type="button"
                      onClick={() => addAssignedUser(u.name)}
                      style={dropdownItemStyle}
                      onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ color: '#0F172A' }}>{u.name}</span>
                      {u.email && <span style={{ color: '#94A3B8', fontSize: 12, marginLeft: 8 }}>{u.email}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errorText('assignedUsers')}
          </div>

          {/* 7. Date | Cost */}
          <div style={twoColStyle}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              {errorText('date')}
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Cost</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8',
                    fontSize: 14,
                    pointerEvents: 'none',
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  placeholder="0.00"
                  style={{ ...inputStyle, paddingLeft: 28 }}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
              {errorText('cost')}
            </div>
          </div>

          {submitError && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 14,
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                border: '1px solid #FECACA',
                boxSizing: 'border-box',
              }}
            >
              {submitError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
            background: '#FFFFFF',
            boxSizing: 'border-box',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#2563EB',
              fontSize: 14,
              padding: '10px 16px',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              background: submitting ? '#94A3B8' : '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxSizing: 'border-box',
            }}
          >
            <Save style={{ width: 16, height: 16 }} />
            {submitting ? 'Submitting…' : isEditing ? 'Save changes' : 'Submit request'}
          </button>
        </div>
      </div>
    </div>
  );
}
