import { useState } from 'react';
import { 
  LayoutDashboard, 
  CheckCircle, 
  DollarSign, 
  Package, 
  Archive,
  FileText, 
  Upload,
  X,
  Download,
  ExternalLink
} from 'lucide-react';
import type { Shoot } from '../App';
import { useAuth } from '../context/AuthContext';

interface FinanceDashboardProps {
  shoots: Shoot[];
  onBack: () => void;
  onUploadInvoice: (shootId: string) => void;
  onOpenApprovals: () => void;
  onOpenCatalog: () => void;
  onOpenArchive: () => void;
}

type FilterTab = 'all' | 'paid' | 'pending';

export function FinanceDashboard({ shoots, onBack, onUploadInvoice, onOpenApprovals, onOpenCatalog, onOpenArchive }: FinanceDashboardProps) {
  const { isAdmin } = useAuth();
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Shoot | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const approvalsPending = shoots.filter(s => s.status === 'with_swati').length;

  const openPdfViewer = (shoot: Shoot) => {
    setSelectedInvoice(shoot);
    setShowPdfModal(true);
  };

  // Month name mappings
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const shortMonthMap: { [key: string]: number } = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  // Group shoots by month
  const groupByMonth = (shootList: Shoot[]) => {
    const groups: { [key: string]: Shoot[] } = {};
    
    shootList.forEach(shoot => {
      const dateStr = shoot.date;
      let monthIndex = -1;
      let year = new Date().getFullYear();
      
      // Try to extract month from date string (e.g., "Dec 15 - Dec 18" or "Oct 12-13")
      for (const [shortMonth, index] of Object.entries(shortMonthMap)) {
        if (dateStr.includes(shortMonth)) {
          monthIndex = index;
          break;
        }
      }
      
      // If shoot has shootDate, use that for accurate year
      if (shoot.shootDate) {
        const shootDateObj = new Date(shoot.shootDate);
        if (!isNaN(shootDateObj.getTime())) {
          monthIndex = shootDateObj.getMonth();
          year = shootDateObj.getFullYear();
        }
      }
      
      if (monthIndex === -1) monthIndex = new Date().getMonth();
      
      const monthKey = `${monthNames[monthIndex]} ${year}`;
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(shoot);
    });
    
    return groups;
  };

  // Sort months chronologically
  const sortMonthsChronologically = (months: string[]) => {
    return months.sort((a, b) => {
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      const indexA = monthNames.indexOf(monthA);
      const indexB = monthNames.indexOf(monthB);
      const yearDiff = parseInt(yearA) - parseInt(yearB);
      if (yearDiff !== 0) return yearDiff;
      return indexA - indexB;
    });
  };

  // Filter invoice data
  const getInvoiceData = () => {
    let filtered = shoots.filter(s => 
      s.status === 'pending_invoice' || 
      s.status === 'completed' || 
      s.paid
    );

    if (filterTab === 'paid') {
      filtered = filtered.filter(s => s.paid);
    } else if (filterTab === 'pending') {
      filtered = filtered.filter(s => !s.paid);
    }

    return filtered.map(shoot => ({
      ...shoot,
      vendor: 'Gopala Media',
      amount: shoot.approvedAmount || shoot.vendorQuote?.amount || 0,
    }));
  };

  const invoiceData = getInvoiceData();
  const groupedInvoices = groupByMonth(invoiceData);
  const monthOrder = sortMonthsChronologically(Object.keys(groupedInvoices));

  const totalPaid = shoots.filter(s => s.paid).reduce((sum, s) => sum + (s.approvedAmount || 0), 0);
  const totalPending = shoots.filter(s => s.status === 'pending_invoice').reduce((sum, s) => sum + (s.approvedAmount || 0), 0);

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Left Sidebar */}
      <div 
        className="w-64 flex flex-col"
        style={{ backgroundColor: '#1F2937' }}
      >
        {/* Logo/Brand */}
        <div className="px-6 py-6 border-b" style={{ borderColor: '#374151' }}>
          <h2 className="text-white text-xl">Pre-Production POC</h2>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={onBack}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-700"
            style={{ color: '#9CA3AF' }}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Active Shoots</span>
          </button>

          <button
            onClick={onOpenApprovals}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors relative hover:bg-gray-700"
            style={{ color: '#9CA3AF' }}
          >
            <CheckCircle className="w-5 h-5" />
            <span>Approvals</span>
            {approvalsPending > 0 && (
              <span 
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: '#F2994A', color: 'white' }}
              >
                {approvalsPending}
              </span>
            )}
          </button>

          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors"
            style={{ backgroundColor: '#2D60FF', color: 'white' }}
          >
            <DollarSign className="w-5 h-5" />
            <span>Finance & Invoices</span>
          </button>

          <button
            onClick={onOpenCatalog}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-700"
            style={{ color: '#9CA3AF' }}
          >
            <Package className="w-5 h-5" />
            <span>Catalog</span>
          </button>

          <button
            onClick={onOpenArchive}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-700"
            style={{ color: '#9CA3AF' }}
          >
            <Archive className="w-5 h-5" />
            <span>Archive</span>
          </button>
        </nav>

        {/* User Profile */}
        <div className="px-4 py-6 border-t" style={{ borderColor: '#374151' }}>
          <div className="flex items-center gap-3 px-4">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: '#2D60FF' }}
            >
              {isAdmin ? 'A' : 'PT'}
            </div>
            <div>
              <div className="text-white text-sm">{isAdmin ? 'Admin' : 'Pre-production Team'}</div>
              <div className="text-gray-400 text-xs">{isAdmin ? 'Administrator' : 'Team Member'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900">Invoice Management</h1>
              <p className="text-gray-500 text-sm">Track payments and manage invoices</p>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Paid</div>
                <div className="text-xl" style={{ color: '#27AE60' }}>₹{totalPaid.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Pending Payment</div>
                <div className="text-xl" style={{ color: '#F2994A' }}>₹{totalPending.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFilterTab('all')}
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: filterTab === 'all' ? '#EFF6FF' : 'transparent',
                color: filterTab === 'all' ? '#2D60FF' : '#6B7280'
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilterTab('paid')}
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: filterTab === 'paid' ? '#E8F5E9' : 'transparent',
                color: filterTab === 'paid' ? '#27AE60' : '#6B7280'
              }}
            >
              Paid
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: filterTab === 'pending' ? '#FEF3E2' : 'transparent',
                color: filterTab === 'pending' ? '#F2994A' : '#6B7280'
              }}
            >
              Pending Payment
            </button>
            <div className="ml-auto text-sm text-gray-500">
              Sort by Month
            </div>
          </div>
        </div>

        {/* Invoice Table (Grouped by Month) */}
        <div className="px-8 py-8">
          <div className="space-y-8">
            {monthOrder.map(month => {
              const monthInvoices = groupedInvoices[month];
              
              if (!monthInvoices || monthInvoices.length === 0) return null;
              
              return (
                <div key={month}>
                  {/* Group Header */}
                  <div className="mb-4">
                    <h3 className="text-gray-900">{month}</h3>
                  </div>

                  {/* Month Table */}
                  <div 
                    className="bg-white rounded-xl border border-gray-200"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm text-gray-700">Shoot Name</th>
                            <th className="px-6 py-3 text-left text-sm text-gray-700">Date</th>
                            <th className="px-6 py-3 text-left text-sm text-gray-700">Vendor</th>
                            <th className="px-6 py-3 text-left text-sm text-gray-700">Amount</th>
                            <th className="px-6 py-3 text-left text-sm text-gray-700">Status</th>
                            <th className="px-6 py-3 text-left text-sm text-gray-700">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {monthInvoices.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-gray-900">{invoice.name}</td>
                              <td className="px-6 py-4 text-gray-600">{invoice.date}</td>
                              <td className="px-6 py-4 text-gray-600">Gopala Media</td>
                              <td className="px-6 py-4 text-gray-900">₹{invoice.amount.toLocaleString()}</td>
                              <td className="px-6 py-4">
                                {invoice.paid ? (
                                  <span 
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs"
                                    style={{ backgroundColor: '#E8F5E9', color: '#27AE60' }}
                                  >
                                    Paid
                                  </span>
                                ) : (
                                  <span 
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs"
                                    style={{ backgroundColor: '#FEF3E2', color: '#F2994A' }}
                                  >
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {invoice.paid ? (
                                  <button 
                                    onClick={() => openPdfViewer(invoice)}
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                                  >
                                    <FileText className="w-4 h-4" />
                                    View PDF
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => onUploadInvoice(invoice.id)}
                                    className="flex items-center gap-2 px-3 py-1.5 border-2 rounded-lg text-sm transition-colors"
                                    style={{ borderColor: '#F2994A', color: '#F2994A' }}
                                  >
                                    <Upload className="w-4 h-4" />
                                    Upload Invoice
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}

            {invoiceData.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No invoices found for the selected filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPdfModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
          <div 
            className="bg-white rounded-2xl max-h-[90vh] overflow-hidden flex flex-col"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15)', width: '600px' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Invoice Details</h2>
                <p className="text-sm text-gray-500">{selectedInvoice.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowPdfModal(false);
                  setSelectedInvoice(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6">
              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl" style={{ backgroundColor: '#F0FDF4' }}>
                  <div className="text-sm mb-1" style={{ color: '#27AE60' }}>Amount Paid</div>
                  <div className="text-2xl font-bold" style={{ color: '#27AE60' }}>
                    ₹{selectedInvoice.approvedAmount?.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50">
                  <div className="text-sm text-gray-500 mb-1">Payment Date</div>
                  <div className="text-lg font-semibold text-gray-900">{selectedInvoice.date}</div>
                </div>
              </div>

              {/* Invoice File Preview */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-3">Invoice Document</div>
                <div 
                  className="border-2 rounded-xl p-6"
                  style={{ borderColor: '#27AE60', backgroundColor: '#F0FDF4' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#27AE60' }}
                      >
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {selectedInvoice.invoiceFile?.name || 'invoice.pdf'}
                        </div>
                        <div className="text-sm" style={{ color: '#27AE60' }}>
                          PDF Document • Ready to download
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF Preview Area */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-3">Preview</div>
                <div 
                  className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50"
                  style={{ height: '250px' }}
                >
                  <div className="h-full flex flex-col items-center justify-center">
                    <FileText className="w-16 h-16 text-gray-300 mb-4" />
                    <div className="bg-white rounded-lg border border-gray-200 p-4 max-w-xs w-full">
                      <div className="text-center mb-4">
                        <div className="text-sm text-gray-500 mb-1">INVOICE</div>
                        <div className="text-xs text-gray-400">
                          #{selectedInvoice.id.toUpperCase().slice(0, 8)}
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Shoot</span>
                          <span className="text-gray-900">{selectedInvoice.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Vendor</span>
                          <span className="text-gray-900">Gopala Media</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 flex justify-between font-medium">
                          <span>Total</span>
                          <span style={{ color: '#27AE60' }}>
                            ₹{selectedInvoice.approvedAmount?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shoot Details */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-3">Shoot Details</div>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Location</span>
                    <span className="text-gray-900">{selectedInvoice.location}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Duration</span>
                    <span className="text-gray-900">{selectedInvoice.duration}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Equipment Items</span>
                    <span className="text-gray-900">{selectedInvoice.equipment.length} items</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Simulate download
                    const link = document.createElement('a');
                    link.href = '#';
                    link.download = selectedInvoice.invoiceFile?.name || 'invoice.pdf';
                    alert(`Downloading: ${selectedInvoice.invoiceFile?.name || 'invoice.pdf'}`);
                  }}
                  className="flex-1 py-3 rounded-lg border-2 transition-colors font-medium flex items-center justify-center gap-2 hover:bg-blue-50"
                  style={{ borderColor: '#2D60FF', color: '#2D60FF' }}
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    // Simulate open in new tab
                    alert('Opening PDF in new tab...');
                    window.open('#', '_blank');
                  }}
                  className="flex-1 py-3 rounded-lg text-white transition-colors font-medium flex items-center justify-center gap-2 hover:opacity-90"
                  style={{ backgroundColor: '#2D60FF' }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in New Tab
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
