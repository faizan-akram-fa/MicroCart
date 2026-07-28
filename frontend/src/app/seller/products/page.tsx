'use client';

import { useEffect, useState, useRef } from 'react';
import { productsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { Plus, Edit, Trash2, X, Upload, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Electronics',
  'Laptops',
  'Smartphones',
  'Home Appliances',
  'Parts',
  'Fashion',
  'Beauty',
  'Sports',
  'Books',
  'Toys',
  'Groceries',
  'Other'
];

const formatImageUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('images.unsplash.com') || url.includes('placeholder.com') || url.includes('cloudfront.net')) {
    return url;
  }
  let clean = url.replace(/^https?:\/\/[^\/]+/, '');
  clean = clean.replace(/^\/?app\/uploads\//, 'uploads/').replace(/\/app\/uploads\//, '/uploads/');
  const cleanPath = clean.startsWith('/') ? clean : `/${clean}`;
  return cleanPath.startsWith('/api') ? cleanPath : `/api${cleanPath}`;
};

function SellerProductImage({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false);
  const formattedSrc = formatImageUrl(src);

  if (hasError || !formattedSrc) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 p-4 select-none">
        <Package className="w-10 h-10 mb-1 opacity-50 text-gray-400 dark:text-gray-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">No Image</span>
      </div>
    );
  }

  return (
    <img
      src={formattedSrc}
      alt={alt}
      className="w-full h-full object-cover rounded"
      onError={() => setHasError(true)}
    />
  );
}

export default function SellerProductsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkJson, setBulkJson] = useState('');
  const [localBulkImages, setLocalBulkImages] = useState<File[]>([]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  // Manual CSV Parser
  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    
    const delimiter = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
    const results = [];
    
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(delimiter).map(item => item.trim().replace(/^"|"$/g, ''));
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = currentLine[index];
      });
      results.push(obj);
    }
    return results;
  };

  const downloadTemplate = () => {
    const csvContent = "name,description,price,stock,category,brand,images\n" +
      "iPhone 15 Pro,Latest Apple flagship,350000,10,Smartphones,Apple,https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600\n" +
      "Dell XPS 15,Powerful developer laptop,450000,5,Laptops,Dell,https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "MicroCart_Product_Template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkSubmit = async () => {
    let rawProducts: any[] = [];
    
    try {
      if (bulkJson.trim()) {
        rawProducts = JSON.parse(bulkJson);
      } else if (bulkFile) {
        const text = await bulkFile.text();
        rawProducts = parseCSV(text);
      } else {
        toast.error('Please provide a file or JSON data');
        return;
      }

      if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
        toast.error('Invalid format. Must be an array of products.');
        return;
      }

      setIsBulkUploading(true);
      const loadingToast = toast.loading(`Initializing bulk upload...`);

      // 1. Handle Local Image Matching
      let imageMap: Record<string, string> = {};
      if (localBulkImages.length > 0) {
        toast.loading(`Uploading ${localBulkImages.length} local images...`, { id: loadingToast });
        const formData = new FormData();
        localBulkImages.forEach(file => formData.append('images', file));
        const imgRes = await productsAPI.uploadBulkImages(formData);
        imgRes.data.forEach((item: any) => {
          imageMap[item.originalName] = item.url;
        });
      }

      // 2. Cleanup and Match Images
      const cleanedProducts = rawProducts.map(p => {
        let imageList: string[] = [];
        const rawImages = typeof p.images === 'string' ? p.images.split('|') : (Array.isArray(p.images) ? p.images : []);
        
        imageList = rawImages.map((img: string) => {
          const trimmed = img.trim();
          if (trimmed.startsWith('http')) return trimmed; // It's a URL
          return imageMap[trimmed] || ''; // Try to match from local uploads
        }).filter((url: string) => url !== '');

        return {
          name: p.name || 'Unnamed Product',
          description: p.description || '',
          price: parseFloat(p.price) || 0,
          stock: parseInt(p.stock) || 0,
          category: p.category || 'Other',
          brand: p.brand || '',
          images: imageList,
          storeName: user?.storeName || 'Unknown Store'
        };
      });

      toast.loading(`Saving ${cleanedProducts.length} products...`, { id: loadingToast });
      
      await productsAPI.bulkCreate(cleanedProducts);
      
      toast.success(`Successfully imported ${cleanedProducts.length} products with matched images!`, { id: loadingToast });
      setShowBulkModal(false);
      setBulkJson('');
      setBulkFile(null);
      setLocalBulkImages([]);
      fetchProducts();
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      toast.error('Failed to import products. Check your format or images.');
    } finally {
      setIsBulkUploading(false);
    }
  };

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [stock, setStock] = useState('');
  const [brand, setBrand] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isFreeShipping, setIsFreeShipping] = useState(true);
  const [shippingCost, setShippingCost] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.role !== 'seller') {
      router.push('/');
      return;
    }
    
    if (user?.sellerStatus !== 'approved') {
      router.push('/seller/pending');
      return;
    }

    fetchProducts();

    // Auto-refresh seller products every 5 seconds for instant real-time sync
    const interval = setInterval(() => {
      fetchProducts(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  const fetchProducts = async (isBackground = false) => {
    try {
      const response = await productsAPI.getSellerProducts();
      setProducts(response.data || []);
    } catch (error) {
      if (!isBackground) toast.error('Failed to load products');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);

      // Limit to 5 images total (existing + new)
      const totalImages = existingImages.length + newFiles.length + files.length;
      if (totalImages > 5) {
        toast.error('Maximum 5 images allowed per product');
        return;
      }

      setNewFiles(prev => [...prev, ...files]);
    }
  };

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  // Canvas-based compression utility
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      // Safety timeout: if compression hangs for >3s, return original file
      const timer = setTimeout(() => {
        resolve(file);
      }, 3000);

      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;

        img.onload = () => {
          clearTimeout(timer);
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if too big (max 1024px)
          const MAX_SIZE = 1024;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const newFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              resolve(file); // Fallback to original
            }
          }, 'image/jpeg', 0.7); // 70% quality
        };

        img.onerror = () => {
          clearTimeout(timer);
          resolve(file); // Fallback on error
        };
      };

      reader.onerror = () => {
        clearTimeout(timer);
        resolve(file); // Fallback on error
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    const loadingToast = toast.loading('Starting...');

    try {
      const finalCategory = category === 'Other' ? customCategory : category;

      const priceNum = parseFloat(price);
      const salePriceNum = parseFloat(salePrice);
      const isOnSale = (!isNaN(salePriceNum) && salePriceNum > 0 && salePriceNum < priceNum);

      const finalDescription = description.trim() + `\n\n[Shipping: ${isFreeShipping ? 'Free' : shippingCost}]`;

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', finalDescription);
      formData.append('price', price);
      if (!isNaN(salePriceNum) && salePriceNum > 0) {
        formData.append('salePrice', salePrice);
        formData.append('isOnSale', String(isOnSale));
      } else {
        formData.append('isOnSale', 'false');
      }

      formData.append('stock', stock);
      formData.append('category', finalCategory);
      formData.append('brand', brand);
      if (user?.storeName) {
        formData.append('storeName', user.storeName);
      }

      // Append existing images for updates
      existingImages.forEach(img => formData.append('existingImages', img));

      // Fast Canvas Compression
      if (newFiles.length > 0) {
        toast.loading(`Compressing ${newFiles.length} images...`, { id: loadingToast });
        const compressedFiles = await Promise.all(
          newFiles.map(file => compressImage(file))
        );

        for (const file of compressedFiles) {
          formData.append('images', file);
        }
      }

      toast.loading('Uploading to server...', { id: loadingToast });

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, formData);
        toast.success('Product updated successfully', { id: loadingToast });
      } else {
        await productsAPI.create(formData);
        toast.success('Product created successfully', { id: loadingToast });
      }

      setShowModal(false);
      resetForm();
      await fetchProducts(false);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save product', { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    
    // Parse shipping metadata
    const shippingMatch = product.description.match(/\[Shipping:\s*(Free|(\d+(\.\d+)?))\]/i);
    if (shippingMatch) {
      if (shippingMatch[1].toLowerCase() === 'free') {
        setIsFreeShipping(true);
        setShippingCost('');
      } else {
        setIsFreeShipping(false);
        setShippingCost(shippingMatch[1]);
      }
    } else {
      setIsFreeShipping(true);
      setShippingCost('');
    }
    const cleanedDesc = product.description.replace(/\n\n\[Shipping:\s*(Free|(\d+(\.\d+)?))\]/i, '').trim();
    setDescription(cleanedDesc);

    setPrice(product.price.toString());
    setSalePrice(product.salePrice ? product.salePrice.toString() : '');

    if (CATEGORIES.includes(product.category)) {
      setCategory(product.category);
      setCustomCategory('');
    } else {
      setCategory('Other');
      setCustomCategory(product.category);
    }

    setStock(product.stock.toString());
    setBrand(product.brand || '');
    setExistingImages(product.images || []);
    setNewFiles([]);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productsAPI.delete(id);
      toast.success('Product deleted successfully');
      setProducts(prev => prev.filter(p => p.id !== id));
      await fetchProducts(false);
      router.refresh();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setSalePrice('');
    setCategory(CATEGORIES[0]);
    setCustomCategory('');
    setStock('');
    setBrand('');
    setExistingImages([]);
    setNewFiles([]);
    setIsFreeShipping(true);
    setShippingCost('');
  };

  const handleAddNew = () => {
    resetForm();
    setShowModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Products</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowBulkModal(true)} className="btn btn-outline border-primary-600 text-primary-600">
            <Upload className="w-4 h-4 mr-2 inline" />
            Bulk Import
          </button>
          <button onClick={handleAddNew} className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2 inline" />
            Add Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="card">
              <div className="relative h-48 bg-gray-100 dark:bg-gray-800 rounded mb-4 overflow-hidden">
                <SellerProductImage
                  src={product.images?.[0] || ''}
                  alt={product.name}
                />
                {product.isOnSale && (
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10 animate-pulse">
                    SALE
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  {product.isOnSale && product.salePrice ? (
                    <>
                      <span className="text-sm font-medium text-gray-400 line-through">
                        Rs {Number(product.price).toFixed(2)}
                      </span>
                      <span className="text-xl font-bold text-red-600">
                        Rs {Number(product.salePrice).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-xl font-bold text-primary-600">
                      Rs {Number(product.price).toFixed(2)}
                    </span>
                  )}
                </div>
                <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {product.stock} In Stock
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="btn btn-outline flex-1"
                >
                  <Edit className="w-4 h-4 mr-2 inline" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="btn btn-secondary text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No products yet</p>
          <button onClick={handleAddNew} className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2 inline" />
            Add Your First Product
          </button>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] max-w-2xl w-full p-8 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Bulk Product Import</h2>
                <p className="text-gray-500 text-sm mt-1">Upload hundreds of products in seconds.</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Template Download */}
              <div className="p-6 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-800 flex items-center justify-between">
                 <div>
                   <p className="text-sm font-bold text-primary-900 dark:text-primary-100">Need the correct format?</p>
                   <p className="text-xs text-primary-700 dark:text-primary-300">Download our CSV template to get started.</p>
                 </div>
                 <button onClick={downloadTemplate} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition-colors">
                   Download Template
                 </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* File Upload */}
                <div className="space-y-3">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Option 1: Upload CSV</label>
                  <div 
                    className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-primary-500 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('bulk-file')?.click()}
                  >
                    <Upload className="w-6 h-6 mx-auto text-gray-300 mb-2" />
                    <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400">
                      {bulkFile ? bulkFile.name : 'Select CSV'}
                    </p>
                    <input 
                      id="bulk-file"
                      type="file" 
                      accept=".csv"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setBulkFile(e.target.files[0]);
                          setBulkJson('');
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Local Images */}
                <div className="space-y-3">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Option 2: Local Images</label>
                  <div 
                    className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-primary-500 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('bulk-local-images')?.click()}
                  >
                    <Plus className="w-6 h-6 mx-auto text-gray-300 mb-2" />
                    <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400">
                      {localBulkImages.length > 0 ? `${localBulkImages.length} Images` : 'Match Local Photos'}
                    </p>
                    <input 
                      id="bulk-local-images"
                      type="file" 
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          setLocalBulkImages(Array.from(e.target.files));
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* JSON Paste */}
                <div className="space-y-3">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Option 3: Paste JSON</label>
                  <textarea 
                    placeholder='[{"name": "...", "images": "photo.jpg"}]'
                    value={bulkJson}
                    onChange={(e) => {
                      setBulkJson(e.target.value);
                      setBulkFile(null);
                    }}
                    className="w-full h-[116px] p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-[10px] font-mono outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                 <button 
                   onClick={handleBulkSubmit}
                   disabled={isBulkUploading}
                   className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                 >
                   {isBulkUploading ? 'Processing...' : 'Start Import'}
                 </button>
                 <button 
                   onClick={() => setShowBulkModal(false)}
                   className="px-8 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
                 >
                   Cancel
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input"
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price (Rs) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Sale Price (Rs)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      className="input border-dashed border-red-300 focus:border-red-500"
                      placeholder="Optional"
                    />
                    {Number(salePrice) > 0 && Number(salePrice) >= Number(price) && (
                      <p className="text-xs text-red-500 mt-1">Must be lower than regular price</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Shipping Type *</label>
                    <select
                      value={isFreeShipping ? 'free' : 'paid'}
                      onChange={(e) => {
                        const free = e.target.value === 'free';
                        setIsFreeShipping(free);
                        if (free) setShippingCost('');
                      }}
                      className="input"
                    >
                      <option value="free">Free Delivery</option>
                      <option value="paid">Paid Delivery</option>
                    </select>
                  </div>
                  {!isFreeShipping && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Shipping Cost (Rs) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={shippingCost}
                        onChange={(e) => setShippingCost(e.target.value)}
                        className="input"
                        required={!isFreeShipping}
                        placeholder="e.g. 150"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input"
                      required
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  {category === 'Other' ? (
                    <div>
                      <label className="block text-sm font-medium mb-1">Custom Category Name *</label>
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="input"
                        placeholder="e.g. Handmade Crafts"
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-1">Brand</label>
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="input"
                        placeholder="e.g. Nike, Samsung"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock Quantity *</label>
                    <input
                      type="number"
                      min="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                  {category !== 'Other' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Custom Tag / Note</label>
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="input"
                        placeholder="Optional"
                      />
                    </div>
                  )}
                </div>

                {/* Image Upload Section */}
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <label className="block text-sm font-medium mb-2">Product Images (Max 5)</label>

                  {/* File Input */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600 text-sm">Click to upload images</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG supported</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                  </div>

                  {/* Image Previews */}
                  {(existingImages.length > 0 || newFiles.length > 0) && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mt-4">
                      {existingImages.map((img, idx) => (
                        <div key={`existing-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100 dark:bg-gray-800">
                          <img 
                            src={formatImageUrl(img)} 
                            alt="Product" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(idx)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition-colors z-10"
                            title="Remove picture"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {newFiles.map((file, idx) => (
                        <div key={`new-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                          <span className="absolute bottom-1 left-1 text-[10px] text-white font-medium bg-black bg-opacity-50 px-1 rounded">New</span>
                          <button
                            type="button"
                            onClick={() => removeNewFile(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="btn btn-primary flex-1 flex items-center justify-center"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      editingProduct ? 'Update Product' : 'Create Product'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary flex-1"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
