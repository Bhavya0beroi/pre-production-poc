import { useState, useRef } from 'react';
import { X, Upload, FileText, ExternalLink, CheckCircle, Download } from 'lucide-react';
import type { Shoot } from '../App';

const API_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : 'https://divine-nature-production-c49a.up.railway.app';

const resolveUrl = (url: string | null | undefined): string =>
  url ? (url.startsWith('/') ? `${API_URL}${url}` : url) : '';

const MAX_PDF_BYTES = 10 * 1024 * 1024;

interface InvoiceManagementProps {
  shoot: Shoot;
  onUploadInvoice: (shootId: string, file: File) => Promise<void>;
  onConfirmPayment: (shootId: string) => void;
  onMarkPaid: (shootId: string) => void;
  onClose: () => void;
}

export function InvoiceManagement({ shoot, onUploadInvoice, onConfirmPayment, onMarkPaid, onClose }: InvoiceManagementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewSrc =
    shoot.invoiceFile?.data ||
    (shoot.invoiceFile?.url && shoot.invoiceFile.url !== '#'
      ? resolveUrl(shoot.invoiceFile.url)
      : '');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file.');
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setUploadError('PDF is too large. Maximum size is 10 MB.');
      return;
    }

    setIsUploading(true);
    try {
      await onUploadInvoice(shoot.id, file);
      setShowPreview(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(`Failed to save to database. Please try again.\n\nError: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleVerifyAndPay = () => {
    onMarkPaid(shoot.id);
    onClose();
  };

  const handleDownload = () => {
    if (shoot.invoiceFile?.data) {
      const link = document.createElement('a');
      link.href = shoot.invoiceFile.data;
      link.download = shoot.invoiceFile.name || 'invoice.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (shoot.invoiceFile?.url && shoot.invoiceFile.url !== '#') {
      window.open(resolveUrl(shoot.invoiceFile.url), '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl">Invoice Management</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Left Side - Form Data */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg mb-4">Shoot Details</h3>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Shoot Name</div>
                    <div>{shoot.name}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Date</div>
                    <div>{shoot.date}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Location</div>
                    <div>{shoot.location}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Approved Amount</div>
                    <div className="text-xl font-semibold" style={{ color: '#27AE60' }}>
                      ₹{(shoot.approvedAmount || shoot.vendorQuote?.amount || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg mb-4">Upload Invoice PDF</h3>

                {uploadError && (
                  <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm whitespace-pre-wrap">
                    {uploadError}
                  </div>
                )}

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {isUploading ? (
                    <p className="text-gray-600">Uploading...</p>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm mb-1">
                        <span style={{ color: '#2D60FF' }}>Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF files only (max 10MB)</p>
                    </>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>

                {shoot.invoiceFile && (
                  <div
                    className="border-2 rounded-xl p-4 flex items-center justify-between mt-4"
                    style={{ borderColor: '#27AE60', backgroundColor: '#F0FDF4' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#27AE60' }}
                      >
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{shoot.invoiceFile.name}</div>
                        <div className="text-sm" style={{ color: '#27AE60' }}>
                          {previewSrc ? 'Ready to preview' : 'File reference saved'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {previewSrc && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload();
                          }}
                          className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                          style={{ color: '#27AE60' }}
                          title="Download PDF"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPreview(true);
                        }}
                        className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                        style={{ color: '#27AE60' }}
                        title="Preview"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Preview */}
            <div>
              <h3 className="text-lg mb-3">Document Preview</h3>

              <div
                className="border-2 border-gray-200 rounded-xl overflow-hidden"
                style={{ height: '500px' }}
              >
                {previewSrc ? (
                  <iframe src={previewSrc} className="w-full h-full" title="PDF Preview" />
                ) : shoot.invoiceFile && showPreview ? (
                  <div className="h-full flex flex-col items-center justify-center bg-gray-50">
                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">{shoot.invoiceFile.name}</p>
                    <p className="text-sm text-gray-500 mb-4">PDF file stored</p>
                    <p className="text-xs text-gray-400 px-8 text-center">
                      Upload a new PDF to enable preview and download
                    </p>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center text-gray-400">
                      <FileText className="w-16 h-16 mx-auto mb-3 opacity-50" />
                      <p>Upload a PDF to preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 p-6 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>

          <div className="flex gap-3">
            {shoot.invoiceFile && !shoot.paymentConfirmed && (
              <button
                onClick={() => onConfirmPayment(shoot.id)}
                className="px-6 py-3 rounded-xl border-2 transition-colors flex items-center gap-2"
                style={{ borderColor: '#2D60FF', color: '#2D60FF' }}
              >
                <CheckCircle className="w-5 h-5" />
                Confirm Payment Sent
              </button>
            )}

            {shoot.invoiceFile && shoot.paymentConfirmed && !shoot.paid && (
              <button
                onClick={handleVerifyAndPay}
                className="px-6 py-3 rounded-xl text-white transition-colors flex items-center gap-2"
                style={{ backgroundColor: '#27AE60' }}
              >
                <CheckCircle className="w-5 h-5" />
                Mark as Paid
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
