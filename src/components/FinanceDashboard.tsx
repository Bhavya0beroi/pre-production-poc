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
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Calendar,
  TrendingUp
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
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const approvalsPending = shoots.filter(s => s.status === 'with_swati').length;

  const openPdfViewer = (shoot: Shoot) => {
    setSelectedInvoice(shoot);
    setShowPdfModal(true);
  };

  // Month name mappings
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Parse date and get month/year
  const getMonthYear = (shoot: Shoot): { month: number; year: number } => {
    const dateStr = shoot.date;
    
    // Try ISO format first (YYYY-MM-DD)
    if (dateStr && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const [year, month] = dateStr.split('-').map(Number);
      return { month: month - 1, year };
    }
    
    // Try parsing shootDate
    if (shoot.shootDate) {
      const d = new Date(shoot.shootDate);
      if (!isNaN(d.getTime())) {
        return { month: d.getMonth(), year: d.getFullYear() };
      }
    }
    
    // Try to find month name in date string
    for (let i = 0; i < shortMonthNames.length; i++) {
      if (dateStr?.includes(shortMonthNames[i])) {
        return { month: i, year: new Date().getFullYear() };
      }
    }
    
    // Default to current month
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  };

  // Group shoots by month
  const groupByMonth = (shootList: Shoot[]) => {
    const groups: { [key: string]: Shoot[] } = {};
    
    shootList.forEach(shoot => {
      const { month, year } = getMonthYear(shoot);
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(shoot);
    });
    
    return groups;
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
      vendor: 'Gopala Digital World',
      amount: shoot.approvedAmount || shoot.vendorQuote?.amount || 0,
    }));
  };

  const invoiceData = getInvoiceData();
  const groupedInvoices = groupByMonth(invoiceData);
  
  // Sort months in reverse chronological order (newest first)
  const monthOrder = Object.keys(groupedInvoices).sort((a, b) => b.localeCompare(a));

  // Calculate totals
  const totalPaid = shoots.filter(s => s.paid).reduce((sum, s) => sum + (s.approvedAmount || s.vendorQuote?.amount || 0), 0);
  const totalPending = shoots.filter(s => !s.paid && (s.status === 'pending_invoice' || s.status === 'completed')).reduce((sum, s) => sum + (s.approvedAmount || s.vendorQuote?.amount || 0), 0);
  const totalShoots = invoiceData.length;

  const toggleMonth = (monthKey: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedMonths(newExpanded);
  };

  const formatMonthKey = (key: string) => {
    const [year, month] = key.split('-');
    return `${monthNames[parseInt(month)]} ${year}`;
  };

  const getMonthTotal = (monthShoots: Shoot[]) => {
    return monthShoots.reduce((sum, s) => sum + (s.approvedAmount || s.vendorQuote?.amount || 0), 0);
  };

  const getMonthPaidCount = (monthShoots: Shoot[]) => {
    return monthShoots.filter(s => s.paid).length;
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Left Sidebar */}
      <div 
        className="w-64 flex flex-col"
        style={{ backgroundColor: '#1F2937' }}
      >
        {/* Logo/Brand */}
        <div className="px-6 py-6 border-b" style={{ borderColor: '#374151' }}>
          <h2 className="text-white text-xl">ShootFlow</h2>
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
        {/* Top Header with Stats */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Finance & Invoices</h1>
            <p className="text-gray-500 text-sm mt-1">Track payments and manage invoices</p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm text-blue-600">Total Invoices</div>
                  <div className="text-2xl font-bold text-blue-700">{totalShoots}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm text-green-600">Total Paid</div>
                  <div className="text-2xl font-bold text-green-700">₹{totalPaid.toLocaleString()}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm text-orange-600">Pending</div>
                  <div className="text-2xl font-bold text-orange-700">₹{totalPending.toLocaleString()}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm text-purple-600">Months</div>
                  <div className="text-2xl font-bold text-purple-700">{monthOrder.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterTab('all')}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: filterTab === 'all' ? '#2D60FF' : '#F3F4F6',
                color: filterTab === 'all' ? 'white' : '#6B7280'
              }}
            >
              All ({invoiceData.length})
            </button>
            <button
              onClick={() => setFilterTab('paid')}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: filterTab === 'paid' ? '#27AE60' : '#F3F4F6',
                color: filterTab === 'paid' ? 'white' : '#6B7280'
              }}
            >
              Paid ({shoots.filter(s => s.paid).length})
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: filterTab === 'pending' ? '#F2994A' : '#F3F4F6',
                color: filterTab === 'pending' ? 'white' : '#6B7280'
              }}
            >
              Pending ({shoots.filter(s => !s.paid && (s.status === 'pending_invoice' || s.status === 'completed')).length})
            </button>
          </div>
        </div>

        {/* Monthly Accordion View */}
        <div className="px-8 py-6">
          <div className="space-y-4">
            {monthOrder.map(monthKey => {
              const monthInvoices = groupedInvoices[monthKey];
              if (!monthInvoices || monthInvoices.length === 0) return null;
              
              const isExpanded = expandedMonths.has(monthKey);
              const monthTotal = getMonthTotal(monthInvoices);
              const paidCount = getMonthPaidCount(monthInvoices);
              
              return (
                <div 
                  key={monthKey}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                >
                  {/* Month Header - Clickable */}
                  <button
                    onClick={() => toggleMonth(monthKey)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 text-lg">
                          {formatMonthKey(monthKey)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {monthInvoices.length} shoots • {paidCount} paid
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold" style={{ color: '#27AE60' }}>
                        ₹{monthTotal.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Total Amount</div>
                    </div>
                  </button>
                  
                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      <div className="divide-y divide-gray-100">
                        {monthInvoices.map((invoice) => (
                          <div 
                            key={invoice.id}
                            className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ 
                                  backgroundColor: invoice.paid ? '#E8F5E9' : '#FEF3E2',
                                  color: invoice.paid ? '#27AE60' : '#F2994A'
                                }}
                              >
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{invoice.name}</div>
                                <div className="text-sm text-gray-500">{invoice.date}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <div className="font-semibold text-gray-900">
                                  ₹{invoice.amount.toLocaleString()}
                                </div>
                                <span 
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{ 
                                    backgroundColor: invoice.paid ? '#E8F5E9' : '#FEF3E2',
                                    color: invoice.paid ? '#27AE60' : '#F2994A'
                                  }}
                                >
                                  {invoice.paid ? 'Paid' : 'Pending'}
                                </span>
                              </div>
                              
                              {invoice.paid ? (
                                <button 
                                  onClick={() => openPdfViewer(invoice)}
                                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-blue-50"
                                  style={{ color: '#2D60FF' }}
                                >
                                  <FileText className="w-4 h-4" />
                                  View
                                </button>
                              ) : (
                                <button 
                                  onClick={() => onUploadInvoice(invoice.id)}
                                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border-2"
                                  style={{ borderColor: '#F2994A', color: '#F2994A' }}
                                >
                                  <Upload className="w-4 h-4" />
                                  Upload
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {invoiceData.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
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
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15)', width: '500px' }}
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
                    ₹{(selectedInvoice.approvedAmount || selectedInvoice.vendorQuote?.amount || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50">
                  <div className="text-sm text-gray-500 mb-1">Date</div>
                  <div className="text-lg font-semibold text-gray-900">{selectedInvoice.date}</div>
                </div>
              </div>

              {/* Invoice File */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-3">Invoice Document</div>
                <div 
                  className="border-2 rounded-xl p-4"
                  style={{ borderColor: '#27AE60', backgroundColor: '#F0FDF4' }}
                >
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
                        PDF Document
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shoot Details */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-3">Details</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Vendor</span>
                    <span className="text-gray-900">Gopala Digital World</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Location</span>
                    <span className="text-gray-900">{selectedInvoice.location}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Duration</span>
                    <span className="text-gray-900">{selectedInvoice.duration}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowPdfModal(false);
                  setSelectedInvoice(null);
                }}
                className="w-full py-3 rounded-lg text-white transition-colors font-medium flex items-center justify-center gap-2 hover:opacity-90"
                style={{ backgroundColor: '#2D60FF' }}
              >
                <Download className="w-4 h-4" />
                Download Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

