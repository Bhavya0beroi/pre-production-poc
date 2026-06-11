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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Send to Vendor</h2>
            <p className="text-sm text-gray-500 mt-0.5">{shootName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          <p className="text-sm text-gray-700">
            Copy this link and send it to <strong>Gopala Media</strong> to get their quote:
          </p>

          {/* Vendor Link */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-blue-900 mb-1">Vendor Quote Form Link</p>
                <p className="text-sm text-blue-700 truncate font-mono">{vendorLink}</p>
              </div>
              <button
                onClick={copyToClipboard}
                className="flex-shrink-0 p-2.5 rounded-lg transition-colors"
                style={{ backgroundColor: copied ? '#D1FAE5' : '#DBEAFE' }}
                title="Copy link"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-blue-600" />
                )}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <ExternalLink className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600">
              After sending this link to the vendor, click <strong>"Confirm Sent"</strong> below to mark this shoot as "Waiting for Quote".
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors"
            style={{ backgroundColor: '#2D60FF' }}
          >
            Confirm Sent to Vendor
          </button>
        </div>
      </div>
    </div>
  );
}
