import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, ArrowLeft, Package, Edit3, DollarSign, ChevronDown, Search, Camera, Aperture, Lightbulb, Headphones, Clapperboard, Monitor, Zap, Truck, Users, Check } from 'lucide-react';
import type { Shoot, Equipment } from '../App';
import type { CatalogItem } from './EquipmentCatalogManager';

interface EditShootFormProps {
  shoot: Shoot;
  relatedShoots?: Shoot[];
  catalogItems: CatalogItem[];
  onSave: (shootId: string, updatedEquipment: Equipment[], updatedVendorQuote?: { amount: number; notes: string }) => void;
  onClose: () => void;
}

interface EditableEquipment extends Equipment {
  editedVendorRate?: number;
  isEditing?: boolean;
  isNew?: boolean;
  originalVendorRate?: number;
}

export function EditShootForm({ shoot, relatedShoots = [], catalogItems, onSave, onClose }: EditShootFormProps) {
  const allShoots = [shoot, ...relatedShoots];
  const isMultiShoot = allShoots.length > 1;
  
  const [activeShootIndex, setActiveShootIndex] = useState(0);
  const [shootsData, setShootsData] = useState<{ [shootId: string]: EditableEquipment[] }>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingPrices, setEditingPrices] = useState(false);

  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('camera')) return Camera;
    if (categoryLower.includes('lens')) return Aperture;
    if (categoryLower.includes('light')) return Lightbulb;
    if (categoryLower.includes('sound') || categoryLower.includes('audio')) return Headphones;
    if (categoryLower.includes('grip') || categoryLower.includes('support') || categoryLower.includes('tripod')) return Clapperboard;
    if (categoryLower.includes('monitor')) return Monitor;
    if (categoryLower.includes('power') || categoryLower.includes('battery')) return Zap;
    if (categoryLower.includes('transport')) return Truck;
    if (categoryLower.includes('assistant') || categoryLower.includes('crew') || categoryLower.includes('gaffer')) return Users;
    return Package;
  };

  const getCategoryColor = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('camera')) return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
    if (categoryLower.includes('lens')) return { bg: '#F3E8FF', text: '#7C3AED', border: '#DDD6FE' };
    if (categoryLower.includes('light')) return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
    if (categoryLower.includes('sound') || categoryLower.includes('audio')) return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
    if (categoryLower.includes('grip') || categoryLower.includes('support') || categoryLower.includes('tripod')) return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' };
    if (categoryLower.includes('monitor')) return { bg: '#E0E7FF', text: '#4F46E5', border: '#C7D2FE' };
    if (categoryLower.includes('power') || categoryLower.includes('battery')) return { bg: '#FEF9C3', text: '#CA8A04', border: '#FEF08A' };
    if (categoryLower.includes('transport')) return { bg: '#FFEDD5', text: '#EA580C', border: '#FED7AA' };
    if (categoryLower.includes('assistant') || categoryLower.includes('crew') || categoryLower.includes('gaffer')) return { bg: '#FCE7F3', text: '#DB2777', border: '#FBCFE8' };
    return { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' };
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const matchingCategories = new Set<string>();
      catalogItems.forEach(item => {
        if (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase())) {
          matchingCategories.add(item.category);
        }
      });
      setExpandedCategories(matchingCategories);
    } else if (searchQuery.trim().length === 0) {
      setExpandedCategories(new Set());
    }
  }, [searchQuery, catalogItems]);

  useEffect(() => {
    const initialData: { [shootId: string]: EditableEquipment[] } = {};
    allShoots.forEach(s => {
      initialData[s.id] = s.equipment.map(eq => ({
        ...eq,
        editedVendorRate: eq.vendorRate,
        originalVendorRate: eq.vendorRate,
        isEditing: false,
        isNew: eq.isNew || false,
      }));
    });
    setShootsData(initialData);
  }, [shoot.id, relatedShoots.length]);

  const currentShoot = allShoots[activeShootIndex];
  const currentEquipment = shootsData[currentShoot?.id] || [];

  const getAvailableCatalogItems = () => {
    const addedIds = new Set(currentEquipment.map(eq => eq.id));
    return catalogItems.filter(item => {
      const matchesSearch = searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const notAlreadyAdded = !addedIds.has(item.id);
      return matchesSearch && notAlreadyAdded;
    });
  };

  const availableCatalogItems = getAvailableCatalogItems();

  const groupedEquipment = availableCatalogItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CatalogItem[]>);

  const addEquipment = (item: CatalogItem) => {
    const newEquipment: EditableEquipment = {
      id: item.id,
      name: item.name,
      dailyRate: item.dailyRate,
      quantity: 1,
      category: item.category,
      expectedRate: item.dailyRate,
      vendorRate: item.dailyRate,
      editedVendorRate: item.dailyRate,
      originalVendorRate: undefined,
      isNew: true,
    };
    setShootsData(prev => ({
      ...prev,
      [currentShoot.id]: [...(prev[currentShoot.id] || []), newEquipment],
    }));
  };

  const removeEquipment = (itemId: string) => {
    setShootsData(prev => ({
      ...prev,
      [currentShoot.id]: (prev[currentShoot.id] || []).filter(eq => eq.id !== itemId),
    }));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setShootsData(prev => ({
      ...prev,
      [currentShoot.id]: (prev[currentShoot.id] || []).map(eq =>
        eq.id === itemId ? { ...eq, quantity } : eq
      ),
    }));
  };

  const updateVendorRate = (itemId: string, rate: number) => {
    setShootsData(prev => ({
      ...prev,
      [currentShoot.id]: (prev[currentShoot.id] || []).map(eq =>
        eq.id === itemId ? { ...eq, editedVendorRate: rate } : eq
      ),
    }));
  };

  const calculateShootTotal = (shootId: string) => {
    const equipment = shootsData[shootId] || [];
    const vendorTotal = equipment.reduce((sum, eq) => {
      const rate = eq.vendorRate || eq.dailyRate || 0;
      return sum + rate;
    }, 0);
    const editedTotal = equipment.reduce((sum, eq) => {
      const rate = eq.editedVendorRate || eq.vendorRate || eq.dailyRate || 0;
      return sum + rate;
    }, 0);
    return { vendorTotal, editedTotal };
  };

  const calculateGrandTotal = () => {
    let vendorTotal = 0;
    let editedTotal = 0;
    allShoots.forEach(s => {
      const { vendorTotal: vt, editedTotal: et } = calculateShootTotal(s.id);
      vendorTotal += vt;
      editedTotal += et;
    });
    return { vendorTotal, editedTotal };
  };

  const handleSave = () => {
    allShoots.forEach(s => {
      const equipment = (shootsData[s.id] || []).map(eq => ({
        ...eq,
        vendorRate: eq.editedVendorRate || eq.vendorRate,
        isNew: eq.isNew,
        isEditing: undefined,
        editedVendorRate: undefined,
        originalVendorRate: undefined,
      }));
      const { editedTotal } = calculateShootTotal(s.id);
      const updatedQuote = s.vendorQuote 
        ? { ...s.vendorQuote, amount: editedTotal }
        : { amount: editedTotal, notes: 'Updated by admin' };
      onSave(s.id, equipment as Equipment[], updatedQuote);
    });
    onClose();
  };

  const totalItems = currentEquipment.reduce((sum, eq) => sum + (eq.quantity || 1), 0);
  const { vendorTotal, editedTotal } = calculateShootTotal(currentShoot?.id || '');
  const grandTotals = calculateGrandTotal();
  const newItemsCount = currentEquipment.filter(eq => eq.isNew).length;
  const isItemAdded = (itemId: string) => currentEquipment.some(eq => eq.id === itemId);

  // Group items into Crew & Personnel vs Gear & Equipment
  const isCrewCategory = (cat: string) => {
    const c = cat.toLowerCase();
    return c.includes('assistant') || c.includes('crew') || c.includes('gaffer') ||
      c.includes('personnel') || c.includes('transport') || c.includes('extra');
  };
  const crewItems = currentEquipment.filter(eq => isCrewCategory(eq.category || ''));
  const gearItems = currentEquipment.filter(eq => !isCrewCategory(eq.category || ''));

  const crewTotal = crewItems.reduce((s, eq) => s + (eq.editedVendorRate ?? eq.vendorRate ?? eq.dailyRate ?? 0), 0);
  const gearTotal = gearItems.reduce((s, eq) => s + (eq.editedVendorRate ?? eq.vendorRate ?? eq.dailyRate ?? 0), 0);

  // Catalog modal can be opened for 'crew' or 'gear' group
  const [addModalGroup, setAddModalGroup] = useState<'crew' | 'gear' | null>(null);
  const filteredCatalogItems = getAvailableCatalogItems().filter(item =>
    addModalGroup === null ? true :
    addModalGroup === 'crew' ? isCrewCategory(item.category) :
    !isCrewCategory(item.category)
  );
  const filteredGrouped = filteredCatalogItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof filteredCatalogItems>);

  const openAddModal = (group: 'crew' | 'gear') => {
    setAddModalGroup(group);
    setShowAddModal(true);
    setSearchQuery('');
    setExpandedCategories(new Set());
  };

  const EquipmentRow = ({ item }: { item: EditableEquipment }) => {
    const rate = editingPrices
      ? (item.editedVendorRate ?? item.vendorRate ?? item.dailyRate ?? 0)
      : (item.vendorRate ?? item.dailyRate ?? 0);
    const lineTotal = rate;
    const isNew = item.isNew === true;
    return (
      <tr className={isNew ? 'bg-amber-50' : 'hover:bg-gray-50'}>
        <td className="px-4 py-3">
          <div className="font-medium text-sm text-gray-900">{item.name}</div>
          <div className="text-xs text-gray-400">
            {item.category}
            {isNew && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800">Added by Admin</span>}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
          {editingPrices ? (
            <input
              type="number"
              value={item.editedVendorRate ?? rate}
              onChange={e => updateVendorRate(item.id, Number(e.target.value))}
              className="w-24 px-2 py-1 border border-blue-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          ) : (
            <span>₹{rate.toLocaleString()}</span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)} disabled={(item.quantity || 1) <= 1}
              className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-sm hover:bg-gray-100 disabled:opacity-40">−</button>
            <span className="w-6 text-center text-sm font-medium text-gray-800">{item.quantity || 1}</span>
            <button type="button" onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
              className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-sm hover:bg-gray-100">+</button>
          </div>
        </td>
        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">
          ₹{lineTotal.toLocaleString()}
        </td>
        <td className="px-4 py-3 text-right">
          <button onClick={() => removeEquipment(item.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          {/* Left: back + title */}
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg flex-shrink-0">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              Edit Shoot: <span className="font-bold">{currentShoot?.name}</span>
            </h1>
          </div>
          {/* Right: rate override toggle + Cancel + Save */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Rate Overrides toggle */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs font-semibold text-gray-700">Rate Overrides</div>
                <div className="text-[10px] text-gray-400">Allow custom rates for this shoot</div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPrices(!editingPrices)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${editingPrices ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingPrices ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-1.5 hover:opacity-90" style={{ backgroundColor: '#27AE60' }}>
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
        {/* Mobile rate override */}
        <div className="flex sm:hidden items-center justify-between mt-2 max-w-4xl mx-auto">
          <span className="text-xs text-gray-500">Rate Overrides (custom prices)</span>
          <button type="button" onClick={() => setEditingPrices(!editingPrices)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editingPrices ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingPrices ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        {/* Mobile buttons row that was here previously (now folded into main header) */}
        <div className="flex md:hidden items-center gap-2 mt-3" style={{ display: 'none' }}>
          <button
            onClick={() => setEditingPrices(!editingPrices)}
            className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs font-medium ${
              editingPrices 
                ? 'bg-orange-100 text-orange-700 border border-orange-300' 
                : 'border border-gray-300 text-gray-700'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            {editingPrices ? 'Editing' : 'Edit Prices'}
          </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-2 rounded-lg text-white flex items-center justify-center gap-1.5 text-xs font-medium"
              style={{ backgroundColor: '#27AE60' }}
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* ── Editing banner ── */}
      <div style={{ backgroundColor: '#EFF6FF', borderBottom: '1px solid #BFDBFE' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-3">
          <p className="text-sm font-medium text-blue-700">Editing details for: <strong>{currentShoot?.name}</strong></p>
        </div>
      </div>

      {/* ── Multi-shoot tabs (if applicable) ── */}
      {isMultiShoot && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-2 flex items-center gap-2 overflow-x-auto">
            {allShoots.map((s, index) => {
              const { vendorTotal: vt } = calculateShootTotal(s.id);
              const isActive = activeShootIndex === index;
              return (
                <button key={s.id} onClick={() => setActiveShootIndex(index)}
                  className="px-4 py-2 rounded-lg text-sm flex-shrink-0 transition-all"
                  style={{ backgroundColor: isActive ? '#EFF6FF' : '#F9FAFB', border: isActive ? '2px solid #3B82F6' : '1px solid #E5E7EB', color: isActive ? '#1D4ED8' : '#374151', fontWeight: isActive ? 600 : 400 }}>
                  {s.name || `Shoot ${index + 1}`} — ₹{vt.toLocaleString()}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-6">

        {/* Crew & Personnel */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-500" />
              Crew &amp; Personnel
              <span className="ml-1 text-gray-400 font-normal">({crewItems.length} items)</span>
            </h2>
          </div>
          {crewItems.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-gray-400">No crew members added. Select from catalog.</p>
              <button onClick={() => openAddModal('crew')}
                className="mt-3 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 mx-auto">
                <Plus className="w-4 h-4" />Add Crew Member
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-100" style={{ backgroundColor: '#F9FAFB' }}>
                      <th className="px-4 py-2.5 text-left font-medium">Item</th>
                      <th className="px-4 py-2.5 text-left font-medium">Rate/Unit</th>
                      <th className="px-4 py-2.5 text-left font-medium">Quantity</th>
                      <th className="px-4 py-2.5 text-right font-medium">Line Total</th>
                      <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {crewItems.map(item => <EquipmentRow key={item.id} item={item} />)}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 border-t border-gray-100">
                <button onClick={() => openAddModal('crew')}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  <Plus className="w-4 h-4" />Add Crew Member
                </button>
              </div>
            </>
          )}
        </div>

        {/* Gear & Equipment */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-500" />
              Gear &amp; Equipment
              <span className="ml-1 text-gray-400 font-normal">({gearItems.length} items)</span>
            </h2>
          </div>
          {gearItems.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-gray-400">No gear items added. Select from catalog.</p>
              <button onClick={() => openAddModal('gear')}
                className="mt-3 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 mx-auto">
                <Plus className="w-4 h-4" />Add Gear Item
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-100" style={{ backgroundColor: '#F9FAFB' }}>
                      <th className="px-4 py-2.5 text-left font-medium">Item</th>
                      <th className="px-4 py-2.5 text-left font-medium">Rate/Unit</th>
                      <th className="px-4 py-2.5 text-left font-medium">Quantity</th>
                      <th className="px-4 py-2.5 text-right font-medium">Line Total</th>
                      <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {gearItems.map(item => <EquipmentRow key={item.id} item={item} />)}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 border-t border-gray-100">
                <button onClick={() => openAddModal('gear')}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  <Plus className="w-4 h-4" />Add Gear Item
                </button>
              </div>
            </>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <h2 className="text-sm font-semibold text-gray-900">Order Summary</h2>
          </div>
          <div className="px-6 py-4 space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Crew Subtotal:</span>
              <span className="font-medium">₹{crewTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Gear Subtotal:</span>
              <span className="font-medium">₹{gearTotal.toLocaleString()}</span>
            </div>
            {isMultiShoot && allShoots.map((s, idx) => {
              const { vendorTotal: vt } = calculateShootTotal(s.id);
              return (
                <div key={s.id} className="flex justify-between text-gray-500">
                  <span>{s.name || `Shoot ${idx + 1}`}:</span>
                  <span>₹{vt.toLocaleString()}</span>
                </div>
              );
            })}
            <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center">
              <span className="font-bold text-gray-900">Grand Total</span>
              <span className="text-lg font-bold text-gray-900">
                ₹{(isMultiShoot ? grandTotals.vendorTotal : (editingPrices ? editedTotal : vendorTotal)).toLocaleString()}
                <span className="ml-1 text-xs font-normal text-gray-400">({totalItems} items)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Catalog Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl flex flex-col shadow-2xl" style={{ maxHeight: '90vh' }}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {addModalGroup === 'crew' ? 'Add Crew Member' : addModalGroup === 'gear' ? 'Add Gear Item' : 'Add Equipment'}
                </h3>
                <p className="text-xs text-gray-500">Select from catalog</p>
              </div>
              <button onClick={() => { setShowAddModal(false); setSearchQuery(''); setExpandedCategories(new Set()); }}
                className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search..." autoFocus
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {Object.keys(filteredGrouped).length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">{searchQuery ? 'No results' : 'All items already added'}</p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {Object.entries(filteredGrouped).map(([category, items]) => {
                    const isExpanded = expandedCategories.has(category);
                    const CategoryIcon = getCategoryIcon(category);
                    const colors = getCategoryColor(category);
                    return (
                      <div key={category} className="border rounded-xl overflow-hidden" style={{ borderColor: isExpanded ? colors.border : '#E5E7EB' }}>
                        <button onClick={() => toggleCategory(category)}
                          className="w-full px-4 py-3 flex items-center justify-between"
                          style={{ backgroundColor: isExpanded ? colors.bg : 'white' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: isExpanded ? 'white' : colors.bg }}>
                              <CategoryIcon className="w-4 h-4" style={{ color: colors.text }} />
                            </div>
                            <span className="font-semibold text-gray-900 text-sm">{category}</span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                          <div className="p-3 space-y-2 bg-gray-50 border-t" style={{ borderColor: colors.border }}>
                            {items.map(item => {
                              const alreadyAdded = isItemAdded(item.id);
                              return (
                                <div key={item.id}
                                  className={`flex items-center justify-between p-3 bg-white border rounded-lg ${alreadyAdded ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300'}`}>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 text-sm truncate">{item.name}</div>
                                    <div className="text-xs text-gray-500">₹{item.dailyRate?.toLocaleString()}/day</div>
                                  </div>
                                  {alreadyAdded ? (
                                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium ml-2">
                                      <Check className="w-4 h-4" /> Added
                                    </div>
                                  ) : (
                                    <button onClick={() => addEquipment(item)}
                                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-white ml-2"
                                      style={{ backgroundColor: '#2D60FF' }}>
                                      <Plus className="w-4 h-4 inline mr-0.5" />Add
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0">
              {newItemsCount > 0 && (
                <span className="text-xs font-medium text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg">{newItemsCount} new item(s) added</span>
              )}
              <button onClick={() => { setShowAddModal(false); setSearchQuery(''); setExpandedCategories(new Set()); }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 ml-auto">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
