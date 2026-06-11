import React, { useState } from 'react';
import { X, Copy, Check, Link } from 'lucide-react';

interface SendToVendorModalProps {
  shootId: string;
  requestGroupId?: string;
  onConfirm: (slot1Name: string, slot2Name: string) => Promise<void> | void;
  onClose: () => void;
}

export function SendToVendorModal({ shootId, requestGroupId, onConfirm, onClose }: SendToVendorModalProps) {
  const [slot1Name, setSlot1Name] = useState('');
  const [slot2Name, setSlot2Name] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linksGenerated, setLinksGenerated] = useState(false);
  const [copied1, setCopied1] = useState(false);
  const [copied2, setCopied2] = useState(false);

  const baseId = requestGroupId || shootId;
  const link1 = `${window.location.origin}?vendor=${baseId}&slot=1`;
  const link2 = `${window.location.origin}?vendor=${baseId}&slot=2`;

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fallbackCopy = (text: string) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch (_) { /* silent */ }
    document.body.removeChild(ta);
  };

  const handleConfirm = async () => {
    if (!slot1Name.trim() || !slot2Name.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm(slot1Name.trim(), slot2Name.trim());
    } catch (e) {
      console.error('Failed to save vendor names to API:', e);
      // Links are generated from local data — show them regardless
    } finally {
      setIsSubmitting(false);
      setLinksGenerated(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Send to Vendors</h2>
            <p className="text-xs text-gray-500 mt-0.5">Enter names for both vendors</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Vendor 1 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Vendor 1 Name
            </label>
            <input
              type="text"
              value={slot1Name}
              onChange={e => setSlot1Name(e.target.value)}
              placeholder="e.g. Gopala Media"
              disabled={linksGenerated}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {/* Vendor 2 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Vendor 2 Name
            </label>
            <input
              type="text"
              value={slot2Name}
              onChange={e => setSlot2Name(e.target.value)}
              placeholder="e.g. XYZ Rentals"
              disabled={linksGenerated}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {/* Generated Links */}
          {linksGenerated && (
            <div className="space-y-3 pt-1">
              <div className="text-xs font-medium text-gray-700">Share these links with each vendor:</div>

              {/* Link 1 */}
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-blue-800">{slot1Name}</span>
                  <span className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">Vendor 1</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-blue-700 truncate font-mono">{link1}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(link1, setCopied1)}
                    className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
                    style={{ backgroundColor: copied1 ? '#D1FAE5' : '#DBEAFE' }}
                  >
                    {copied1 ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                </div>
              </div>

              {/* Link 2 */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-purple-800">{slot2Name}</span>
                  <span className="text-xs text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">Vendor 2</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-purple-700 truncate font-mono">{link2}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(link2, setCopied2)}
                    className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
                    style={{ backgroundColor: copied2 ? '#D1FAE5' : '#EDE9FE' }}
                  >
                    {copied2 ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-purple-600" />}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Link className="w-3 h-3" />
                Each vendor fills their quote independently via their link.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          {!linksGenerated ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!slot1Name.trim() || !slot2Name.trim() || isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#2D60FF' }}
              >
                {isSubmitting ? 'Sending...' : 'Generate Links'}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 rounded-xl text-white text-sm font-medium"
              style={{ backgroundColor: '#27AE60' }}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
