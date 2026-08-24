import { useState, useRef } from 'react';
import { X, Upload, FileText, Download, CheckCircle } from 'lucide-react';
import type { RepairRequest } from '../services/repairService';
import { uploadRepairInvoice, confirmRepairPayment, markRepairAsPaid } from '../services/repairService';
import { useAuth } from '../context/AuthContext';

interface RepairInvoiceManagementProps {
  repair: RepairRequest;
  onClose: () => void;
  onUploadSuccess: (updatedRepair: RepairRequest) => void;
}

export function RepairInvoiceManagement({ repair, onClose, onUploadSuccess }: RepairInvoiceManagementProps) {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    setUploadError(null);
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed');
      return;
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must not exceed 10MB');
      return;
    }
    
    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const updatedRepair = await uploadRepairInvoice(user?.email, repair.id, selectedFile);
      onUploadSuccess(updatedRepair);
      onClose();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      const updated = await confirmRepairPayment(user?.email, repair.id);
      onUploadSuccess(updated);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to confirm payment');
      setIsProcessing(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setIsProcessing(true);
    try {
      const updated = await markRepairAsPaid(user?.email, repair.id);
      onUploadSuccess(updated);
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to mark as paid');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (repair.invoiceUrl) {
      window.open(repair.invoiceUrl, '_blank');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
    if (match) {
      const [, year, month, day] = match;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${Number(day)} ${monthNames[Number(month) - 1]} ${year}`;
    }
    return dateStr;
  };

  const deviceLabel = () => {
    const type = repair.deviceType === 'Other' && repair.deviceTypeOther 
      ? repair.deviceTypeOther 
      : repair.deviceType;
    const id = repair.deviceId || 'NA';
    return `${type} · ${id}`;
  };

  const assignedNames = (repair.assignedUsers || []).join(', ') || '—';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ maxWidth: '1100px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between border-b"
          style={{ padding: '24px 32px', borderColor: '#E2E8F0' }}
        >
          <h2 className="font-semibold" style={{ fontSize: '26px', color: '#0F172A' }}>
            Invoice Management
          </h2>
          <button
            onClick={onClose}
            className="hover:bg-gray-100 rounded-lg transition-colors"
            style={{ padding: '8px', color: '#64748B', fontSize: '22px' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Two Column Grid */}
        <div 
          className="flex-1 overflow-auto"
          style={{ padding: '32px' }}
        >
          <div 
            className="grid gap-10"
            style={{ gridTemplateColumns: '1fr 1.2fr' }}
          >
            {/* Left Column - Details & Uploader */}
            <div>
              {/* Repair Details */}
              <h3 className="font-semibold mb-5" style={{ fontSize: '20px', color: '#0F172A' }}>
                Repair Details
              </h3>
              
              <div className="space-y-5">
                <div>
                  <div className="mb-1" style={{ fontSize: '15px', color: '#94A3B8' }}>Item</div>
                  <div style={{ fontSize: '17px', color: '#0F172A' }}>{repair.item}</div>
                </div>
                
                <div>
                  <div className="mb-1" style={{ fontSize: '15px', color: '#94A3B8' }}>Date</div>
                  <div style={{ fontSize: '17px', color: '#0F172A' }}>{formatDate(repair.date)}</div>
                </div>
                
                <div>
                  <div className="mb-1" style={{ fontSize: '15px', color: '#94A3B8' }}>Device</div>
                  <div style={{ fontSize: '17px', color: '#0F172A' }}>{deviceLabel()}</div>
                </div>
                
                <div>
                  <div className="mb-1" style={{ fontSize: '15px', color: '#94A3B8' }}>Assigned To</div>
                  <div style={{ fontSize: '17px', color: '#0F172A' }}>{assignedNames}</div>
                </div>
              </div>

              {/* Status Cards */}
              <div className="space-y-3 mt-6">
                {/* Approved Amount - Green */}
                <div 
                  className="rounded-xl"
                  style={{ backgroundColor: '#F0FDF4', padding: '16px 20px' }}
                >
                  <div style={{ fontSize: '15px', color: '#16A34A' }}>Approved Amount</div>
                  <div className="font-semibold mt-1" style={{ fontSize: '28px', color: '#16A34A' }}>
                    ₹{repair.cost.toLocaleString()}
                  </div>
                </div>

                {/* Payment Status - Amber */}
                <div 
                  className="rounded-xl"
                  style={{ backgroundColor: '#FEF3C7', padding: '16px 20px' }}
                >
                  <div style={{ fontSize: '15px', color: '#D97706' }}>Payment Status</div>
                  <div className="mt-1" style={{ fontSize: '22px', color: '#D97706' }}>
                    Pending
                  </div>
                </div>
              </div>

              {/* Invoice Document Uploader */}
              <div className="mt-7">
                <h3 className="font-semibold mb-4" style={{ fontSize: '20px', color: '#0F172A' }}>
                  Invoice Document
                </h3>

                {repair.invoiceUrl && repair.invoiceFilename ? (
                  /* Already uploaded - show filename and Remove link */
                  <div 
                    className="border-2 border-dashed rounded-xl flex items-center justify-between"
                    style={{ 
                      padding: '20px',
                      borderColor: '#CBD5E1',
                      backgroundColor: '#FAFBFC'
                    }}
                  >
                    <div>
                      <div className="font-medium" style={{ fontSize: '15px', color: '#0F172A' }}>
                        {repair.invoiceFilename}
                      </div>
                      <div style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
                        {(selectedFile?.size || 0) > 0 
                          ? `${(selectedFile.size / 1024).toFixed(1)} KB` 
                          : 'Uploaded'}
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="text-sm hover:underline"
                      style={{ color: '#DC2626' }}
                    >
                      Remove
                    </button>
                  </div>
                ) : selectedFile ? (
                  /* File selected but not uploaded yet */
                  <div 
                    className="border-2 border-dashed rounded-xl flex items-center justify-between"
                    style={{ 
                      padding: '20px',
                      borderColor: '#CBD5E1',
                      backgroundColor: '#FAFBFC'
                    }}
                  >
                    <div>
                      <div className="font-medium" style={{ fontSize: '15px', color: '#0F172A' }}>
                        {selectedFile.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="text-sm hover:underline"
                      style={{ color: '#DC2626' }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  /* Dropzone */
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-xl text-center cursor-pointer transition-all"
                    style={{
                      padding: '40px 20px',
                      borderColor: isDragging ? '#2563EB' : '#CBD5E1',
                      backgroundColor: isDragging ? '#EFF6FF' : '#FAFBFC'
                    }}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span style={{ fontSize: '17px', color: '#334155' }}>Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2.5">
                        <Upload 
                          className="w-8 h-8"
                          strokeWidth={1.5}
                          style={{ color: '#64748B' }}
                        />
                        <div style={{ fontSize: '17px' }}>
                          <span style={{ color: '#2563EB' }}>Click to upload</span>
                          <span style={{ color: '#334155' }}> or drag and drop</span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#94A3B8' }}>
                          PDF files only (max 10MB)
                        </div>
                      </div>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                )}

                {uploadError && (
                  <div 
                    className="mt-3 text-sm px-3 py-2 rounded"
                    style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
                  >
                    {uploadError}
                  </div>
                )}

                {selectedFile && !repair.invoiceUrl && (
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full mt-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50"
                    style={{ 
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF'
                    }}
                  >
                    {isUploading ? 'Uploading...' : 'Upload Invoice'}
                  </button>
                )}
              </div>
            </div>

            {/* Right Column - Preview */}
            <div>
              <h3 className="font-semibold mb-5" style={{ fontSize: '20px', color: '#0F172A' }}>
                Document Preview
              </h3>
              
              <div 
                className="border rounded-xl flex items-center justify-center"
                style={{ 
                  minHeight: '520px',
                  backgroundColor: '#F8FAFC',
                  borderColor: '#E2E8F0'
                }}
              >
                {repair.invoiceUrl ? (
                  <iframe
                    src={repair.invoiceUrl}
                    className="w-full h-full rounded-xl"
                    style={{ minHeight: '520px' }}
                    title="Invoice Preview"
                  />
                ) : selectedFile ? (
                  <iframe
                    src={URL.createObjectURL(selectedFile)}
                    className="w-full h-full rounded-xl"
                    style={{ minHeight: '520px' }}
                    title="Invoice Preview"
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <FileText 
                      className="w-18 h-18 mb-4"
                      strokeWidth={1.5}
                      style={{ color: '#CBD5E1', width: '72px', height: '72px' }}
                    />
                    <div style={{ fontSize: '17px', color: '#94A3B8' }}>
                      Upload a PDF to preview
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Payment Workflow Buttons */}
        {repair.invoiceUrl && (
          <div 
            className="border-t"
            style={{ padding: '24px 32px', borderColor: '#E2E8F0' }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                {/* Download PDF Button */}
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 rounded-lg border-2 flex items-center justify-center gap-2 transition-all font-medium hover:bg-blue-50"
                  style={{ borderColor: '#2D60FF', color: '#2D60FF' }}
                  disabled={isProcessing}
                >
                  <Download className="w-5 h-5" />
                  Download PDF
                </button>

                {/* Finance Confirmed Payment Button */}
                {!repair.paymentConfirmed && !repair.paid && (
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 rounded-lg text-white flex items-center justify-center gap-2 transition-all font-medium hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#F2994A' }}
                  >
                    <CheckCircle className="w-5 h-5" />
                    Finance Confirmed Payment
                  </button>
                )}

                {/* Mark as Paid Button */}
                {repair.paymentConfirmed && !repair.paid && (
                  <button
                    onClick={handleMarkAsPaid}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 rounded-lg text-white flex items-center justify-center gap-2 transition-all font-medium hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#27AE60' }}
                  >
                    <CheckCircle className="w-5 h-5" />
                    Mark as Paid
                  </button>
                )}
              </div>

              {/* Status Indicator */}
              {!repair.paid && (
                <div className="text-sm text-center">
                  {!repair.paymentConfirmed ? (
                    <span className="text-orange-600">
                      ⚠️ Waiting for finance team to confirm payment has been sent to vendor
                    </span>
                  ) : (
                    <span className="text-green-600">
                      ✓ Finance team confirmed payment. You can now mark as paid.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Paid Status Banner */}
        {repair.paid && (
          <div 
            className="px-6 py-4 border-t"
            style={{ 
              borderColor: '#27AE60',
              backgroundColor: '#F0FDF4'
            }}
          >
            <div className="flex items-center justify-center gap-2" style={{ color: '#27AE60' }}>
              <CheckCircle className="w-5 h-5" />
              <span>Payment Completed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
