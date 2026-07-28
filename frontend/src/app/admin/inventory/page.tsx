'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Loader,
  RefreshCcw,
  Layers,
  Archive,
  ArrowUpRight,
  LayoutGrid,
  Table as TableIcon,
  Tag
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { formatPrice } from '@/lib/currency';
import toast, { Toaster } from 'react-hot-toast';

function ProductImageWithFallback({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800/80 text-gray-400 p-4 select-none">
        <Package className="w-10 h-10 mb-1.5 opacity-50 text-gray-400 dark:text-gray-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">No Image Preview</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
      onError={() => setHasError(true)}
    />
  );
}

export default function InventoryOversight() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStock, setFilterStock] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const { currency, exchangeRates } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    fetchInventory();

    // Auto-refresh inventory every 5 seconds for real-time seller sync
    const interval = setInterval(() => {
      fetchInventory(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchInventory = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await adminAPI.getInventory();
      setProducts(res.data || []);
    } catch (error) {
      if (!isBackground) toast.error('Failed to load inventory data');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    let clean = url.replace(/^https?:\/\/(localhost|product-service|user-service)(:\d+)?/, '');
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) return clean;
    clean = clean.replace(/^\/?app\/uploads\//, 'uploads/').replace(/\/app\/uploads\//, '/uploads/');
    const cleanPath = clean.startsWith('/') ? clean : `/${clean}`;
    return cleanPath.startsWith('/api') ? cleanPath : `/api${cleanPath}`;
  };

  // Extract unique categories
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const filteredProducts = products.filter(product => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      product.name.toLowerCase().includes(query) ||
      (product.category && product.category.toLowerCase().includes(query)) ||
      (product.sellerId && product.sellerId.toLowerCase().includes(query)) ||
      (product.id && product.id.toLowerCase().includes(query));

    const isLowStock = product.stock > 0 && product.stock <= 5;
    const isOutOfStock = product.stock === 0;
    const isHealthyStock = product.stock > 5;

    const matchesStock = 
      filterStock === 'all' ? true :
      filterStock === 'healthy' ? isHealthyStock :
      filterStock === 'low' ? isLowStock :
      filterStock === 'out' ? isOutOfStock : true;

    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;

    return matchesSearch && matchesStock && matchesCategory;
  });

  const healthyStockCount = products.filter(p => p.stock > 5).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalInventoryValue = products.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.stock || 0)), 0);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16 w-full max-w-full overflow-hidden">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Inventory Oversight</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Platform-wide inventory auditing, stock health metrics, and catalog valuation.</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* View Mode Switcher */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-gray-900 text-primary-600 dark:text-primary-400 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-gray-900 text-primary-600 dark:text-primary-400 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden md:inline">Table</span>
            </button>
          </div>

          <button 
            onClick={() => fetchInventory(false)}
            disabled={loading}
            className={`flex items-center justify-center px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95'
            }`}
          >
            <RefreshCcw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Metrics Cards (Compact Dark Glassmorphism) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Catalog Products */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-5 shadow-lg hover:border-indigo-500/40 transition-all group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/25 rounded-xl">
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Catalog SKUs
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Total Products</p>
          <p className="text-2xl font-extrabold text-indigo-400 tracking-tight leading-none mb-2">{products.length}</p>
          <p className="text-[11px] text-slate-500 truncate">Value: <span className="text-indigo-300 font-semibold">{formatPrice(totalInventoryValue, currency, exchangeRates)}</span></p>
        </div>

        {/* Healthy Stock */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-5 shadow-lg hover:border-emerald-500/40 transition-all group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Healthy
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">In Stock (&gt;5 Units)</p>
          <p className="text-2xl font-extrabold text-emerald-400 tracking-tight leading-none mb-2">{healthyStockCount}</p>
          <p className="text-[11px] text-slate-500">Ready to fulfill &amp; ship</p>
        </div>

        {/* Low Stock Warning */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 p-5 shadow-lg hover:border-amber-500/40 transition-all group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-amber-500/10 border border-amber-500/25 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Low Stock
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Low Stock (1-5 Units)</p>
          <p className="text-2xl font-extrabold text-amber-400 tracking-tight leading-none mb-2">{lowStockCount}</p>
          <p className="text-[11px] text-slate-500">Seller reorder alert</p>
        </div>

        {/* Out of Stock Alert */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 p-5 shadow-lg hover:border-rose-500/40 transition-all group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-rose-500/10 border border-rose-500/25 rounded-xl">
              <Archive className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Depleted
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Out of Stock (0 Units)</p>
          <p className="text-2xl font-extrabold text-rose-400 tracking-tight leading-none mb-2">{outOfStockCount}</p>
          <p className="text-[11px] text-slate-500">Seller restock required</p>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="card p-3.5 sm:p-4 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full md:max-w-xs lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by Product Name, SKU, Seller ID, Category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs transition-all"
            />
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap gap-2 items-center justify-between md:justify-end">
            
            {/* Category Dropdown */}
            {categories.length > 0 && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">All Categories ({categories.length})</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{cat}</option>
                ))}
              </select>
            )}

            {/* Stock Pills */}
            <div className="flex bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl border border-gray-200 dark:border-gray-700/60 text-xs">
              <button 
                onClick={() => setFilterStock('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterStock === 'all' 
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setFilterStock('healthy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterStock === 'healthy' 
                    ? 'bg-emerald-500 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Healthy
              </button>
              <button 
                onClick={() => setFilterStock('low')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterStock === 'low' 
                    ? 'bg-amber-500 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Low
              </button>
              <button 
                onClick={() => setFilterStock('out')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterStock === 'out' 
                    ? 'bg-rose-500 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Depleted
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Area (Grid View vs Table View) */}
      {viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-12">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock === 0;
            const isLowStock = product.stock > 0 && product.stock <= 5;
            const itemImg = product.images?.[0] || product.image || '';

            return (
              <div 
                key={product.id} 
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 group overflow-hidden flex flex-col justify-between"
              >
                {/* Product Image Header */}
                <div className="relative h-44 bg-gray-50 dark:bg-gray-800/60 overflow-hidden flex items-center justify-center">
                  <ProductImageWithFallback
                    src={getImageUrl(itemImg)}
                    alt={product.name}
                  />

                  {/* Stock Status Tag Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md ${
                      isOutOfStock
                        ? 'bg-rose-500/90 text-white border-rose-400/30 shadow-lg'
                        : isLowStock
                        ? 'bg-amber-500/90 text-white border-amber-400/30 shadow-lg'
                        : 'bg-emerald-500/90 text-white border-emerald-400/30'
                    }`}>
                      {isOutOfStock ? <Archive className="w-3 h-3" /> : isLowStock ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      {product.stock} Left
                    </span>
                  </div>

                  {/* Category Pill */}
                  {product.category && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-gray-900/80 text-white backdrop-blur-sm border border-white/10">
                        <Tag className="w-2.5 h-2.5 text-primary-400" /> {product.category}
                      </span>
                    </div>
                  )}

                  {/* Overlay for Out of Stock */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="bg-rose-600 text-white px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-xl">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs font-extrabold text-primary-600 dark:text-primary-400 mt-1">
                      {formatPrice(product.price, currency, exchangeRates)}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 font-mono">
                      <span>ID: {product.id.slice(0, 10)}...</span>
                      {product.sellerId && <span>Seller: {product.sellerId.slice(-6)}</span>}
                    </div>
                  </div>

                  {/* Stock Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-gray-500">
                      <span>Stock Capacity</span>
                      <span className={isOutOfStock ? 'text-rose-500' : isLowStock ? 'text-amber-500' : 'text-emerald-500'}>
                        {product.stock} Units
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} 
                        style={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Card Actions (Read-Only Oversight) */}
                  <div className="pt-1 border-t border-gray-100 dark:border-gray-800/80">
                    <button 
                      onClick={() => router.push(`/products/${product.id}`)}
                      className="w-full flex items-center justify-center py-2 px-3 rounded-xl bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/30 transition-all text-xs font-bold gap-1.5 active:scale-95"
                    >
                      View Product Details <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
              <Package className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" />
              <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">No Inventory Products Found</h3>
              <p className="text-gray-400 text-xs mt-1">Try resetting your search term or stock filter criteria.</p>
            </div>
          )}
        </div>
      ) : (
        /* TABLE VIEW (Fit 100% Window Width) */
        <div className="card bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden min-h-[350px]">
          {filteredProducts.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                    <th className="py-3 px-3 sm:px-4">Product Item</th>
                    <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">SKU / ID</th>
                    <th className="py-3 px-3 sm:px-4 hidden md:table-cell">Seller</th>
                    <th className="py-3 px-3 sm:px-4">Price</th>
                    <th className="py-3 px-3 sm:px-4">Stock</th>
                    <th className="py-3 px-3 sm:px-4 hidden lg:table-cell">Stock Health</th>
                    <th className="py-3 px-3 sm:px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-xs">
                  {filteredProducts.map((product) => {
                    const isOutOfStock = product.stock === 0;
                    const isLowStock = product.stock > 0 && product.stock <= 5;
                    const itemImg = product.images?.[0] || product.image || '';

                    return (
                      <tr 
                        key={product.id}
                        className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        {/* Product Title & Thumbnail */}
                        <td className="py-3 px-3 sm:px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-shrink-0 flex items-center justify-center">
                              {itemImg ? (
                                <img 
                                  src={getImageUrl(itemImg)} 
                                  alt="" 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                />
                              ) : (
                                <Package className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-[180px]">{product.name}</p>
                              {product.category && (
                                <span className="text-[10px] text-gray-400 font-medium">{product.category}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-3 px-3 sm:px-4 font-mono text-gray-500 hidden sm:table-cell truncate max-w-[90px]">
                          {product.id.slice(0, 10)}...
                        </td>

                        {/* Seller */}
                        <td className="py-3 px-3 sm:px-4 font-mono text-gray-500 hidden md:table-cell truncate max-w-[100px]">
                          {product.sellerId ? product.sellerId.slice(-6) : 'N/A'}
                        </td>

                        {/* Price */}
                        <td className="py-3 px-3 sm:px-4 font-extrabold text-gray-900 dark:text-white whitespace-nowrap">
                          {formatPrice(product.price, currency, exchangeRates)}
                        </td>

                        {/* Stock Badge */}
                        <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isOutOfStock
                              ? 'bg-rose-100/70 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-500/20'
                              : isLowStock
                              ? 'bg-amber-100/70 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-500/20'
                              : 'bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-500/20'
                          }`}>
                            {product.stock} Units
                          </span>
                        </td>

                        {/* Health Bar */}
                        <td className="py-3 px-3 sm:px-4 hidden lg:table-cell min-w-[120px]">
                          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} 
                              style={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }}
                            />
                          </div>
                        </td>

                        {/* Action Buttons (Read-Only Oversight) */}
                        <td className="py-3 px-3 sm:px-4 text-right">
                          <button
                            onClick={() => router.push(`/products/${product.id}`)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-all inline-flex items-center gap-1 active:scale-95"
                            title="View Product Details"
                          >
                            View Details <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Package className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">No Inventory Products Found</h3>
              <p className="text-gray-400 text-xs mt-1">Try resetting your search or filter options.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
