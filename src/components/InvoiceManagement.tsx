import { useState, useRef } from 'react';
import { X, Upload, FileText, ExternalLink, CheckCircle } from 'lucide-react';
import type { Shoot } from '../App';

interface InvoiceManagementProps {
  shoot: Shoot;
  onUploadInvoice: (shootId: string, fileName: string) => void;
  onMarkPaid: (shootId: string) => void;
  onClose: () => void;
}

export function InvoiceManagement({ shoot, onUploadInvoice, onMarkPaid, onClose }: InvoiceManagementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    if (file.type === 'application/pdf') {
      onUploadInvoice(shoot.id, file.name);
      setShowPreview(true);
    } else {
      alert('Please upload a PDF file');
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
                  
                  <div 
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: '#F0FDF4' }}
                  >
                    <div className="text-sm mb-1" style={{ color: '#27AE60' }}>
                      Approved Amount
                    </div>
                    <div className="text-2xl" style={{ color: '#27AE60' }}>
                      ₹{shoot.approvedAmount?.toLocaleString()}
                    </div>
                  </div>
                  
                  <div 
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: shoot.paid ? '#F0FDF4' : '#FEF3C7' }}
                  >
                    <div className="text-sm mb-1" style={{ color: shoot.paid ? '#27AE60' : '#F2994A' }}>
                      Payment Status
                    </div>
                    <div style={{ color: shoot.paid ? '#27AE60' : '#F2994A' }}>
                      {shoot.paid ? 'Paid' : 'Unpaid'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div>
                <h3 className="text-lg mb-3">Invoice Document</h3>
                
                {!shoot.invoiceFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
                    style={{
                      borderColor: isDragging ? '#2D60FF' : '#E2E8F0',
                      backgroundColor: isDragging ? '#EEF2FF' : '#F8FAFC'
                    }}
                  >
                    <Upload 
                      className="w-12 h-12 mx-auto mb-3" 
                      style={{ color: isDragging ? '#2D60FF' : '#94A3B8' }}
                    />
                    <p className="mb-2">
                      <span style={{ color: '#2D60FF' }}>Click to upload</span> or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">PDF files only</p>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div 
                    className="border-2 rounded-xl p-4 flex items-center justify-between"
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
                        <div>{shoot.invoiceFile.name}</div>
                        <div className="text-sm" style={{ color: '#27AE60' }}>Uploaded successfully</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setShowPreview(true)}
                      className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                      style={{ color: '#27AE60' }}
                    >
                      <ExternalLink className="w-5 h-5" />
                    </button>
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
                {shoot.invoiceFile && showPreview ? (
                  <div className="h-full flex flex-col items-center justify-center bg-gray-50">
                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">{shoot.invoiceFile.name}</p>
                    <p className="text-sm text-gray-500">PDF Preview</p>
                    <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 max-w-xs">
                      <div className="text-center mb-4">
                        <div className="text-sm text-gray-500 mb-2">INVOICE</div>
                        <div className="text-xs text-gray-400 mb-4">#{Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Equipment Rental</span>
                          <span>₹{shoot.approvedAmount?.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 flex justify-between">
                          <span>Total</span>
                          <span>₹{shoot.approvedAmount?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center text-gray-400">
                      <FileText className="w-16 h-16 mx-auto mb-3 opacity-50" />
                      <p>No document uploaded yet</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {shoot.invoiceFile && !shoot.paid && (
          <div className="p-6 border-t border-gray-100">
            <button
              onClick={handleVerifyAndPay}
              className="w-full py-4 rounded-xl text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ backgroundColor: '#27AE60' }}
            >
              <CheckCircle className="w-5 h-5" />
              Verify & Send for Payment
            </button>
          </div>
        )}
        
        {shoot.paid && (
          <div 
            className="p-6 border-t"
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
