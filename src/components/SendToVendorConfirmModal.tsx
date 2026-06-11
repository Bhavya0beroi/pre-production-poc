import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';

interface SendToVendorConfirmModalProps {
  shootId: string;
  shootName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function SendToVendorConfirmModal({ shootId, shootName, onConfirm, onClose }: SendToVendorConfirmModalProps) {
  const [copied, setCopied] = useState(false);

  // Generate vendor link
  const vendorLink = `${window.location.origin}?vendor=${shootId}`;

  const copyToClipboard = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(vendorLink).catch(() => fallbackCopy(vendorLink));
    } else {
      fallbackCopy(vendorLink);
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

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl" style={{ maxHeight: '90vh', overflow: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Send to Vendor</h2>
            <p className="text-sm text-gray-600 mt-1">{shootName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-6">
          <p className="text-base text-gray-700 mb-4">
            Copy this link and send it to <strong>Gopala Media</strong> to get their quote:
          </p>

          {/* Vendor Link Box */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor Quote Form Link
            </label>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-300">
              <input
                type="text"
                value={vendorLink}
                readOnly
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 font-mono"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={copyToClipboard}
                className="flex-shrink-0 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all"
                style={{ backgroundColor: copied ? '#10B981' : '#2D60FF' }}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 inline mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 inline mr-1" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-medium text-gray-900 mb-1">Next Steps:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Copy the link above using the "Copy" button</li>
                <li>Send this link to Gopala Media (via email, WhatsApp, etc.)</li>
                <li>Click "Confirm Sent to Vendor" below to mark this as "Waiting for Quote"</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-3 rounded-lg border-2 border-gray-300 text-base font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-5 py-3 rounded-lg text-white text-base font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: '#2D60FF' }}
          >
            Confirm Sent to Vendor
          </button>
        </div>
      </div>
    </div>
  );
}
