'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { productsAPI } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const categories = [
    'All',
    'Electronics',
    'Clothing',
    'Books',
    'Home & Garden',
    'Sports',
    'Toys',
  ];

  useEffect(() => {
    fetchProducts();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await productsAPI.getAll({ search, limit: 5 });
        setSuggestions(response.data.products || response.data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Failed to fetch suggestions');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchProducts = async (params = {}) => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll({ limit: 100, ...params });
      setProducts(response.data.products || response.data);
    } catch (error: any) {
      toast.error('Failed to load products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params: any = {};
    if (search) params.search = search;
    if (category && category !== 'All') params.category = category;
    if (minPrice) params.minPrice = parseFloat(minPrice);
    if (maxPrice) params.maxPrice = parseFloat(maxPrice);
    fetchProducts(params);
  };

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    fetchProducts();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search and Filters */}
      {/* Hero Search Section */}
      <div className="relative mb-12 rounded-3xl overflow-hidden shadow-2xl animate-fade-in">
        {/* Animated Background Gradient - Premium Dark Theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 animate-gradient-xy"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 dark:opacity-20"></div>

        <div className="relative z-10 p-8 md:p-12 text-gray-900 dark:text-white">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-center animate-slide-up">
            Find Your Next <span className="text-primary-600 dark:text-yellow-300">Favorite Item</span>
          </h2>
          <p className="text-center text-gray-600 dark:text-primary-100 mb-8 max-w-2xl mx-auto text-lg animate-slide-up-delay">
            Search through our extensive collection of premium products at unbeatable prices.
          </p>

          <div className="bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/40 dark:border-white/20 animate-scale-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-4">
              {/* Search */}
              <div className="lg:col-span-5 relative" ref={searchRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="What are you looking for?"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => { if(search.trim()) setShowSuggestions(true); }}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/20 bg-white/80 dark:bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-yellow-400 transition-all shadow-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        setShowSuggestions(false);
                        handleSearch();
                      }
                    }}
                  />
                </div>
                
                {/* Suggestions Dropdown */}
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-fade-in-up transition-all duration-200 backdrop-blur-xl bg-white/95 dark:bg-gray-800/95">
                    {isSearching ? (
                      <div className="p-4 flex items-center justify-center text-gray-500">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500 mr-3"></div>
                        Searching...
                      </div>
                    ) : suggestions.length > 0 ? (
                      <ul className="max-h-80 overflow-y-auto custom-scrollbar">
                        {suggestions.map((item) => (
                          <li 
                            key={item.id}
                            onClick={() => {
                              setShowSuggestions(false);
                              router.push(`/products/${item.id}`);
                            }}
                            className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer flex items-center gap-4 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                          >
                            <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                              {item.images && item.images.length > 0 ? (
                                <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-gray-400 text-[10px] font-medium">No Image</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.category}</p>
                            </div>
                            <span className="text-sm font-bold text-primary-600 dark:text-yellow-400 whitespace-nowrap">
                              Rs {item.price?.toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        <p className="text-sm font-medium">No result found for "{search}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="lg:col-span-3">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/20 bg-white/80 dark:bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-yellow-400 transition-all shadow-sm cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Price */}
              <div className="lg:col-span-2">
                <input
                  type="number"
                  placeholder="Min Rs"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/20 bg-white/80 dark:bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-yellow-400 transition-all shadow-sm"
                />
              </div>

              {/* Max Price */}
              <div className="lg:col-span-2">
                <input
                  type="number"
                  placeholder="Max Rs"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/20 bg-white/80 dark:bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-yellow-400 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={handleSearch}
                className="px-8 py-3 bg-primary-600 hover:bg-primary-700 dark:bg-yellow-400 dark:hover:bg-yellow-300 text-white dark:text-gray-900 font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                Search Now
              </button>
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white font-semibold rounded-xl border border-gray-200 dark:border-white/30 backdrop-blur-sm transition-all duration-200"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-6">
          {search || category ? 'Search Results' : 'All Products'}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="bg-gray-300 h-48 rounded mb-4"></div>
                <div className="bg-gray-300 h-4 rounded mb-2"></div>
                <div className="bg-gray-300 h-4 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
            <button onClick={handleReset} className="btn btn-primary mt-4">
              View All Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
