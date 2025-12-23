import { useState, useMemo } from 'react';
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
  ChevronDown,
  ChevronRight,
  Calendar,
  TrendingUp,
  BarChart3,
  List
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
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
type ViewMode = 'list' | 'chart';
type ChartView = 'monthly' | 'daily';

export function FinanceDashboard({ shoots, onBack, onUploadInvoice, onOpenApprovals, onOpenCatalog, onOpenArchive }: FinanceDashboardProps) {
  const { isAdmin } = useAuth();
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Shoot | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [chartView, setChartView] = useState<ChartView>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
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

  // Helper to safely parse amount as number
  const parseAmount = (shoot: Shoot): number => {
    // Try approved amount first, then vendor quote
    let amount = shoot.approvedAmount ?? shoot.vendorQuote?.amount ?? 0;
    
    // Handle string amounts (from database)
    if (typeof amount === 'string') {
      // Remove any non-numeric characters except decimal point
      const cleaned = amount.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    // Ensure it's a valid number
    const num = Number(amount);
    return isNaN(num) ? 0 : num;
  };

  // Parse date and get month/year
  const getMonthYear = (shoot: Shoot): { month: number; year: number; day: number } => {
    const dateStr = shoot.date;
    
    if (dateStr && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return { month: month - 1, year, day };
    }
    
    if (shoot.shootDate) {
      const d = new Date(shoot.shootDate);
      if (!isNaN(d.getTime())) {
        return { month: d.getMonth(), year: d.getFullYear(), day: d.getDate() };
      }
    }
    
    for (let i = 0; i < shortMonthNames.length; i++) {
      if (dateStr?.includes(shortMonthNames[i])) {
        return { month: i, year: new Date().getFullYear(), day: 1 };
      }
    }
    
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear(), day: now.getDate() };
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
      amount: parseAmount(shoot),
    }));
  };

  const invoiceData = getInvoiceData();
  const groupedInvoices = groupByMonth(invoiceData);
  const monthOrder = Object.keys(groupedInvoices).sort((a, b) => a.localeCompare(b));

  // Calculate totals - explicitly ensure numeric addition
  const totalPaid = shoots.filter(s => s.paid).reduce((sum: number, s) => {
    return Number(sum) + parseAmount(s);
  }, 0);
  const totalPending = shoots.filter(s => !s.paid && (s.status === 'pending_invoice' || s.status === 'completed')).reduce((sum: number, s) => {
    return Number(sum) + parseAmount(s);
  }, 0);
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

  const toggleInvoice = (invoiceId: string) => {
    const newExpanded = new Set(expandedInvoices);
    if (newExpanded.has(invoiceId)) {
      newExpanded.delete(invoiceId);
    } else {
      newExpanded.add(invoiceId);
    }
    setExpandedInvoices(newExpanded);
  };

  const formatMonthKey = (key: string) => {
    const [year, month] = key.split('-');
    return `${monthNames[parseInt(month)]} ${year}`;
  };

  const formatShortMonth = (key: string) => {
    const [, month] = key.split('-');
    return shortMonthNames[parseInt(month)];
  };

  const getMonthTotal = (monthShoots: Shoot[]) => {
    return monthShoots.reduce((sum: number, s) => Number(sum) + parseAmount(s), 0);
  };

  const getMonthPaidCount = (monthShoots: Shoot[]) => {
    return monthShoots.filter(s => s.paid).length;
  };

  // Chart data
  const chartData = useMemo(() => {
    if (chartView === 'monthly') {
      return monthOrder.map(monthKey => {
        const monthShoots = groupedInvoices[monthKey] || [];
        const total = getMonthTotal(monthShoots);
        return {
          name: formatShortMonth(monthKey),
          fullName: formatMonthKey(monthKey),
          monthKey,
          amount: total,
          shoots: monthShoots.length,
        };
      });
    } else {
      // Daily view for selected month
      if (!selectedMonth || !groupedInvoices[selectedMonth]) return [];
      
      const monthShoots = groupedInvoices[selectedMonth];
      const dailyData: { [key: string]: { amount: number; shoots: number } } = {};
      
      monthShoots.forEach(shoot => {
        const { day } = getMonthYear(shoot);
        const dayKey = String(day).padStart(2, '0');
        if (!dailyData[dayKey]) {
          dailyData[dayKey] = { amount: 0, shoots: 0 };
        }
        dailyData[dayKey].amount = Number(dailyData[dayKey].amount) + parseAmount(shoot);
        dailyData[dayKey].shoots += 1;
      });
      
      return Object.keys(dailyData).sort().map(day => ({
        name: `Day ${parseInt(day)}`,
        fullName: `${formatMonthKey(selectedMonth)} - Day ${parseInt(day)}`,
        amount: dailyData[day].amount,
        shoots: dailyData[day].shoots,
      }));
    }
  }, [chartView, selectedMonth, groupedInvoices, monthOrder]);

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{payload[0].payload.fullName}</p>
          <p className="text-green-600 text-lg font-bold">₹{payload[0].value.toLocaleString()}</p>
          <p className="text-gray-500 text-sm">{payload[0].payload.shoots} shoots</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Left Sidebar */}
      <div className="w-64 flex flex-col" style={{ backgroundColor: '#1F2937' }}>
        <div className="px-6 py-6 border-b" style={{ borderColor: '#374151' }}>
          <h2 className="text-white text-xl">ShootFlow</h2>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <button onClick={onBack} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-700" style={{ color: '#9CA3AF' }}>
            <LayoutDashboard className="w-5 h-5" />
            <span>Active Shoots</span>
          </button>
          <button onClick={onOpenApprovals} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors relative hover:bg-gray-700" style={{ color: '#9CA3AF' }}>
            <CheckCircle className="w-5 h-5" />
            <span>Approvals</span>
            {approvalsPending > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: '#F2994A', color: 'white' }}>{approvalsPending}</span>
            )}
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors" style={{ backgroundColor: '#2D60FF', color: 'white' }}>
            <DollarSign className="w-5 h-5" />
            <span>Finance & Invoices</span>
          </button>
          <button onClick={onOpenCatalog} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-700" style={{ color: '#9CA3AF' }}>
            <Package className="w-5 h-5" />
            <span>Catalog</span>
          </button>
          <button onClick={onOpenArchive} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-700" style={{ color: '#9CA3AF' }}>
            <Archive className="w-5 h-5" />
            <span>Archive</span>
          </button>
        </nav>

        <div className="px-4 py-6 border-t" style={{ borderColor: '#374151' }}>
          <div className="flex items-center gap-3 px-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#2D60FF' }}>{isAdmin ? 'A' : 'PT'}</div>
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
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Finance & Invoices</h1>
              <p className="text-gray-400 text-sm">Track payments and spending trends</p>
            </div>
            {/* View Toggle - Top Right */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'chart' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Chart
              </button>
            </div>
          </div>
        </div>

        {/* Tabs + Stats Row */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Tabs */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  filterTab === 'all' 
                    ? 'text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={filterTab === 'all' ? { backgroundColor: '#2D60FF' } : {}}
              >
                All ({invoiceData.length})
              </button>
              <button
                onClick={() => setFilterTab('paid')}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  filterTab === 'paid' 
                    ? 'text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={filterTab === 'paid' ? { backgroundColor: '#2D60FF' } : {}}
              >
                Paid ({shoots.filter(s => s.paid).length})
              </button>
              <button
                onClick={() => setFilterTab('pending')}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  filterTab === 'pending' 
                    ? 'text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={filterTab === 'pending' ? { backgroundColor: '#2D60FF' } : {}}
              >
                Pending ({shoots.filter(s => !s.paid && (s.status === 'pending_invoice' || s.status === 'completed')).length})
              </button>
            </div>

            {/* Right: Stats + Filter */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-400">Total Paid</div>
                  <div className="text-lg font-bold text-gray-900">₹{totalPaid.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-400">Pending</div>
                  <div className="text-lg font-bold text-gray-900">₹{totalPending.toLocaleString()}</div>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <List className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-8 py-6">
          {viewMode === 'chart' ? (
            /* Chart View */
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Monthly Spending Trend</h3>
                    <p className="text-sm text-gray-500 mt-1">Overview of monthly expenses</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Total</div>
                    <div className="text-2xl font-bold" style={{ color: '#27AE60' }}>
                      ₹{totalPaid.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#27AE60" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#27AE60" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#27AE60" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorAmount)"
                        dot={{ r: 6, fill: '#27AE60', stroke: '#fff', strokeWidth: 2 }}
                        activeDot={{ r: 8, fill: '#27AE60', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                {monthOrder.slice(-6).map(monthKey => {
                  const monthShoots = groupedInvoices[monthKey] || [];
                  const total = getMonthTotal(monthShoots);
                  
                  return (
                    <div
                      key={monthKey}
                      className="bg-white rounded-xl border border-gray-200 p-4"
                      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                    >
                      <div className="text-sm text-gray-500">{formatMonthKey(monthKey)}</div>
                      <div className="text-xl font-bold mt-1" style={{ color: '#27AE60' }}>₹{total.toLocaleString()}</div>
                      <div className="text-xs text-gray-400 mt-1">{monthShoots.length} shoots</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {monthOrder.slice().reverse().map(monthKey => {
                const monthInvoices = groupedInvoices[monthKey];
                if (!monthInvoices || monthInvoices.length === 0) return null;
                
                const isExpanded = expandedMonths.has(monthKey);
                const monthTotal = getMonthTotal(monthInvoices);
                const paidCount = getMonthPaidCount(monthInvoices);
              
                return (
                  <div key={monthKey} className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <button onClick={() => toggleMonth(monthKey)} className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">{formatMonthKey(monthKey)}</div>
                          <div className="text-sm text-gray-500">{monthInvoices.length} shoots • {paidCount} paid</div>
                        </div>
                      </div>
                      <div className="text-right pr-2">
                        <div className="text-lg font-bold" style={{ color: '#27AE60' }}>₹{monthTotal.toLocaleString()}</div>
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="border-t border-gray-100">
                        <div className="divide-y divide-gray-100">
                          {monthInvoices.map((invoice) => {
                            const isInvoiceExpanded = expandedInvoices.has(invoice.id);
                            const hasEquipment = invoice.equipment && invoice.equipment.length > 0;
                            
                            return (
                              <div key={invoice.id}>
                                <div 
                                  className={`px-5 py-3 flex items-center justify-between transition-colors ${hasEquipment ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                                  onClick={() => hasEquipment && toggleInvoice(invoice.id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${invoice.paid ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                      {hasEquipment ? (
                                        isInvoiceExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                                      ) : (
                                        <FileText className="w-4 h-4" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900 text-sm">{invoice.name}</div>
                                      <div className="text-xs text-gray-500">{invoice.date}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <div className="font-semibold text-sm" style={{ color: '#27AE60' }}>₹{invoice.amount.toLocaleString()}</div>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${invoice.paid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {invoice.paid ? 'Paid' : 'Pending'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                      {invoice.invoiceFile && (
                                        <button onClick={() => openPdfViewer(invoice)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50" title="View">
                                          <FileText className="w-4 h-4" />
                                        </button>
                                      )}
                                      <button onClick={() => onUploadInvoice(invoice.id)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100" title={invoice.invoiceFile ? 'Replace PDF' : 'Upload PDF'}>
                                        <Upload className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Equipment Details */}
                                {isInvoiceExpanded && hasEquipment && (
                                  <div className="bg-gray-50 px-5 py-3 ml-11 mr-5 mb-3 rounded-lg">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Equipment Details</div>
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="text-left text-gray-500 text-xs">
                                          <th className="pb-2 font-medium">Item</th>
                                          <th className="pb-2 font-medium text-center">Qty</th>
                                          <th className="pb-2 font-medium text-right">Rate</th>
                                          <th className="pb-2 font-medium text-right">Total</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {invoice.equipment.map((item: any, idx: number) => (
                                          <tr key={idx} className="border-t border-gray-200">
                                            <td className="py-2 text-gray-900">{item.name}</td>
                                            <td className="py-2 text-center text-gray-600">{item.quantity || 1}</td>
                                            <td className="py-2 text-right text-gray-600">₹{(item.rate || item.price || 0).toLocaleString()}</td>
                                            <td className="py-2 text-right font-medium text-gray-900">₹{((item.quantity || 1) * (item.rate || item.price || 0)).toLocaleString()}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      <tfoot>
                                        <tr className="border-t-2 border-gray-300">
                                          <td colSpan={3} className="py-2 font-semibold text-gray-900">Total</td>
                                          <td className="py-2 text-right font-bold" style={{ color: '#27AE60' }}>₹{invoice.amount.toLocaleString()}</td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                )}
                              </div>
                            );
                          })}
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
          )}
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPdfModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15)', width: '500px' }}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Invoice Details</h2>
                <p className="text-sm text-gray-500">{selectedInvoice.name}</p>
              </div>
              <button onClick={() => { setShowPdfModal(false); setSelectedInvoice(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl" style={{ backgroundColor: '#F0FDF4' }}>
                  <div className="text-sm mb-1" style={{ color: '#27AE60' }}>Amount Paid</div>
                  <div className="text-2xl font-bold" style={{ color: '#27AE60' }}>₹{parseAmount(selectedInvoice).toLocaleString()}</div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50">
                  <div className="text-sm text-gray-500 mb-1">Date</div>
                  <div className="text-lg font-semibold text-gray-900">{selectedInvoice.date}</div>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-3">Invoice Document</div>
                <div className="border-2 rounded-xl p-4" style={{ borderColor: '#27AE60', backgroundColor: '#F0FDF4' }}>
                    <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#27AE60' }}>
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                      <div className="font-medium text-gray-900">{selectedInvoice.invoiceFile?.name || 'invoice.pdf'}</div>
                      <div className="text-sm" style={{ color: '#27AE60' }}>PDF Document</div>
                    </div>
                  </div>
                </div>
              </div>

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

            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex gap-3">
                {selectedInvoice.invoiceFile?.data ? (
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                      link.href = selectedInvoice.invoiceFile!.data!;
                      link.download = selectedInvoice.invoiceFile!.name || 'invoice.pdf';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex-1 py-3 rounded-lg text-white transition-colors font-medium flex items-center justify-center gap-2 hover:opacity-90"
                    style={{ backgroundColor: '#27AE60' }}
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                ) : (
                  <button
                    onClick={() => onUploadInvoice(selectedInvoice.id)}
                    className="flex-1 py-3 rounded-lg border-2 transition-colors font-medium flex items-center justify-center gap-2 hover:bg-orange-50"
                    style={{ borderColor: '#F2994A', color: '#F2994A' }}
                  >
                    <Upload className="w-4 h-4" />
                    Upload PDF
                  </button>
                )}
                <button
                  onClick={() => { setShowPdfModal(false); setSelectedInvoice(null); }}
                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-600 transition-colors font-medium hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
