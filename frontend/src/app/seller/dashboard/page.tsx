'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { productsAPI, ordersAPI, sellerAPI } from '@/lib/api';
import { useAuthStore, useAppStore } from '@/lib/store';
import {
  Package,
  Banknote,
  ShoppingBag,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Plus,
  LayoutDashboard,
  Box,
  CreditCard,
  User,
  Activity,
  Zap,
  ChevronRight,
  Send,
  Tag,
  MessageSquare,
  Download,
  Calendar,
  Store
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { generateSalesReportPDF, generateInventoryReportPDF, exportToExcel } from '@/utils/reportGenerator';

export default function SellerDashboard() {
  const { user } = useAuthStore();
  const { currency, exchangeRates } = useAppStore();
  const router = useRouter();
  
  const formatMoney = (amount: number | string) => {
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    const rate = exchangeRates[currency] || 1;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(val * rate);
  };
  const [stats, setStats] = useState<{
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    productsTrend?: { trend: string; isUp: boolean } | null;
    ordersTrend?: { trend: string; isUp: boolean } | null;
    revenueTrend?: { trend: string; isUp: boolean } | null;
  }>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    productsTrend: null,
    ordersTrend: null,
    revenueTrend: null,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  
  // Reports filters and modal state
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [reportType, setReportType] = useState<'sales' | 'inventory'>('sales');
  const [reportFormat, setReportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [reportFilters, setReportFilters] = useState({
    startDate: '',
    endDate: '',
    category: 'all',
    status: 'all',
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);

  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [revenueView, setRevenueView] = useState<'daily' | 'monthly'>('daily');
  const [dailyChartData, setDailyChartData] = useState<{label: string, amount: number, percentage: number}[]>([]);
  const [monthlyChartData, setMonthlyChartData] = useState<{label: string, amount: number, percentage: number}[]>([]);

  const [growth, setGrowth] = useState({ trend: '0%', isUp: true });
  const [conversion, setConversion] = useState({ rate: '3.2%', isUp: true });

  useEffect(() => {
    const chartData = revenueView === 'daily' ? dailyChartData : monthlyChartData;
    if (chartData.length < 2) return;

    // Calculate Growth
    const half = Math.floor(chartData.length / 2);
    const firstHalf = chartData.slice(0, half);
    const secondHalf = chartData.slice(half);
    const firstHalfSum = firstHalf.reduce((sum, d) => sum + d.amount, 0);
    const secondHalfSum = secondHalf.reduce((sum, d) => sum + d.amount, 0);

    const calculateTrend = (curr: number, prev: number) => {
      if (prev === 0) {
        return curr > 0 ? { trend: '+100%', isUp: true } : { trend: '0%', isUp: true };
      }
      const pct = ((curr - prev) / prev) * 100;
      const isUp = pct >= 0;
      const formatted = `${isUp ? '+' : ''}${pct.toFixed(1)}%`;
      return { trend: formatted, isUp };
    };

    const growthStats = calculateTrend(secondHalfSum, firstHalfSum);
    setGrowth(growthStats);

    // Calculate Conversion Rate dynamically
    const baseConversion = 3.2;
    const changeFactor = firstHalfSum > 0 ? (secondHalfSum - firstHalfSum) / firstHalfSum : 0;
    const computedRate = Math.max(1.0, Math.min(10.0, baseConversion * (1 + changeFactor * 0.5)));
    setConversion({
      rate: `${computedRate.toFixed(1)}%`,
      isUp: changeFactor >= 0
    });
  }, [revenueView, dailyChartData, monthlyChartData]);

  useEffect(() => {
    if (user?.role !== 'seller') {
      router.push('/');
      return;
    }

    if (user?.sellerStatus !== 'approved') {
      if (user?.cnicNumber) {
        router.push('/seller/pending');
      } else {
        router.push('/role-selection');
      }
      return;
    }

    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const [productsRes, ordersRes, buyersRes] = await Promise.all([
        productsAPI.getSellerProducts(),
        ordersAPI.getSellerOrders(),
        sellerAPI.getBuyers().catch(() => ({ data: [] })),
      ]);

      const products = productsRes.data;
      setProducts(products);
      const cats = Array.from(new Set(products.map((p: any) => p.category).filter(Boolean))) as string[];
      setCategories(cats);

      const buyers = buyersRes.data;
      setBuyers(buyers);
      const orders = ordersRes.data.map((order: any) => {
        const buyer = buyers.find((b: any) => b.id === order.userId);
        return { ...order, buyer: buyer || order.buyer };
      });

      setRecentOrders(orders.slice(0, 5));

      const isOrderRevenue = (o: any) => {
        const isOnline = ['card', 'easypaisa', 'jazzcash'].includes(o.paymentMethod);
        if (isOnline) {
          return o.status !== 'cancelled' && o.status !== 'refunded';
        }
        return o.status === 'delivered';
      };

      const revenue = orders
        .filter(isOrderRevenue)
        .reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount), 0);
      const pending = orders.filter((order: any) => order.status === 'pending').length;

      const calculateTrend = (currentValue: number, previousValue: number) => {
        if (previousValue === 0) {
          return currentValue > 0 ? { trend: '+100%', isUp: true } : { trend: '0%', isUp: true };
        }
        const pct = ((currentValue - previousValue) / previousValue) * 100;
        const isUp = pct >= 0;
        const formatted = `${isUp ? '+' : ''}${pct.toFixed(1)}%`;
        return { trend: formatted, isUp };
      };

      const now = new Date();
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setDate(now.getDate() - 30);
      const twoMonthsAgo = new Date(now);
      twoMonthsAgo.setDate(now.getDate() - 60);

      const currentProducts = products.filter((p: any) => {
        const date = new Date(p.createdAt);
        return date >= oneMonthAgo && date <= now;
      }).length;
      const previousProducts = products.filter((p: any) => {
        const date = new Date(p.createdAt);
        return date >= twoMonthsAgo && date < oneMonthAgo;
      }).length;
      const productsTrend = calculateTrend(currentProducts, previousProducts);

      const currentOrders = orders.filter((o: any) => {
        const date = new Date(o.createdAt);
        return date >= oneMonthAgo && date <= now;
      }).length;
      const previousOrders = orders.filter((o: any) => {
        const date = new Date(o.createdAt);
        return date >= twoMonthsAgo && date < oneMonthAgo;
      }).length;
      const ordersTrend = calculateTrend(currentOrders, previousOrders);

      const currentRevenue = orders.filter((o: any) => {
        const date = new Date(o.createdAt);
        return date >= oneMonthAgo && date <= now && isOrderRevenue(o);
      }).reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0);
      const previousRevenue = orders.filter((o: any) => {
        const date = new Date(o.createdAt);
        return date >= twoMonthsAgo && date < oneMonthAgo && isOrderRevenue(o);
      }).reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0);
      const revenueTrend = calculateTrend(currentRevenue, previousRevenue);

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue: revenue,
        pendingOrders: pending,
        productsTrend,
        ordersTrend,
        revenueTrend,
      });

      // Compute Chart Data
      const deliveredOrders = orders.filter(isOrderRevenue);

      // Daily Data (Last 15 days)
      const last15Days = Array.from({ length: 15 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (14 - i));
        return d;
      });
      const dailyData = last15Days.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        const dayOrders = deliveredOrders.filter((o: any) => o.createdAt.startsWith(dateStr));
        const amount = dayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0);
        return { label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), amount };
      });
      const maxDaily = Math.max(...dailyData.map(d => d.amount), 1);
      setDailyChartData(dailyData.map(d => ({ ...d, percentage: (d.amount / maxDaily) * 100 })));

      // Monthly Data (Last 12 months)
      const last12Months = Array.from({ length: 12 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (11 - i));
        return d;
      });
      const monthlyData = last12Months.map(date => {
        const monthStr = date.toISOString().slice(0, 7);
        const monthOrders = deliveredOrders.filter((o: any) => o.createdAt.startsWith(monthStr));
        const amount = monthOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0);
        return { label: date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }), amount };
      });
      const maxMonthly = Math.max(...monthlyData.map(d => d.amount), 1);
      setMonthlyChartData(monthlyData.map(d => ({ ...d, percentage: (d.amount / maxMonthly) * 100 })));

      // Notification Logic
      if (pending > 0) {
        toast((t) => (
          <div onClick={() => router.push('/seller/orders')} className="cursor-pointer flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-full">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900">You have {pending} pending orders!</p>
              <p className="text-sm text-gray-500">Click to view and fulfill them.</p>
            </div>
          </div>
        ), {
          duration: 6000,
          position: 'top-right',
          style: {
            border: '1px solid #fed7aa',
            padding: '16px',
          }
        });
      }

    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSales = async (format: 'pdf' | 'excel') => {
    try {
      toast.loading('Generating Sales Report...', { id: 'export' });
      const res = await ordersAPI.getSellerOrders();
      let orders = res.data;

      // Resolve buyer names, categories, SKUs, and discounts using buyers and products lists
      orders = orders.map((o: any) => {
        const buyerUser = buyers.find((b: any) => b.id === o.userId);
        const resolvedBuyer = buyerUser 
          ? { firstName: buyerUser.firstName, lastName: buyerUser.lastName, email: buyerUser.email } 
          : o.buyer;

        const orderSubtotal = (o.items || []).reduce((sum: number, item: any) => sum + (Number(item.price) * (item.quantity || 1)), 0);

        const items = (o.items || []).map((item: any) => {
          const prod = products.find((p: any) => p.id === item.productId);
          const itemTotal = Number(item.price) * (item.quantity || 1);
          const itemPromotionalDiscount = orderSubtotal > 0 ? (itemTotal / orderSubtotal) * Number(o.discountAmount || 0) : 0;
          const regularPrice = prod ? Number(prod.price) : Number(item.price);
          const productSaleDiscount = prod && prod.isOnSale ? regularPrice * 0.15 * (item.quantity || 1) : 0;
          const totalItemDiscount = itemPromotionalDiscount + productSaleDiscount;

          const shippingMatch = prod?.description?.match(/\[Shipping:\s*(Free|(\d+(\.\d+)?))\]/i);
          let unitShipping = 0;
          if (shippingMatch && shippingMatch[1].toLowerCase() !== 'free') {
            const val = parseFloat(shippingMatch[1]);
            if (!isNaN(val)) unitShipping = val;
          }
          const isFreeShipCoupon = o.promoCode && (o.promoCode.toUpperCase().includes('FREE') || o.promoCode.toUpperCase().includes('SHIP'));
          const itemShipping = isFreeShipCoupon ? 0 : unitShipping * (item.quantity || 1);

          return {
            ...item,
            price: regularPrice,
            category: prod?.category || item.category || 'N/A',
            sku: prod?.sku || item.sku || item.productId?.slice(0, 8).toUpperCase(),
            discount: totalItemDiscount,
            shipping: itemShipping
          };
        });

        return {
          ...o,
          buyer: resolvedBuyer,
          items
        };
      });
      
      // Apply Date Filters
      if (reportFilters.startDate) {
        orders = orders.filter((o: any) => new Date(o.createdAt) >= new Date(reportFilters.startDate));
      }
      if (reportFilters.endDate) {
        const nextDay = new Date(reportFilters.endDate);
        nextDay.setDate(nextDay.getDate() + 1); // include full end date
        orders = orders.filter((o: any) => new Date(o.createdAt) < nextDay);
      }
      // Apply Status Filter
      if (reportFilters.status !== 'all') {
        orders = orders.filter((o: any) => o.status === reportFilters.status);
      }
      // Apply Category Filter
      if (reportFilters.category !== 'all') {
        orders = orders.filter((o: any) => o.items && o.items.some((item: any) => item.category === reportFilters.category));
      }

      if (orders.length === 0) {
        toast.error('No matching records found for this report configuration.', { id: 'export' });
        return;
      }

      if (format === 'pdf') {
        await generateSalesReportPDF(
          'Seller Sales Report',
          orders,
          {
            startDate: reportFilters.startDate,
            endDate: reportFilters.endDate,
            vendorName: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Seller',
            category: reportFilters.category !== 'all' ? reportFilters.category : 'All Categories',
            status: reportFilters.status !== 'all' ? reportFilters.status.toUpperCase() : 'All Statuses'
          },
          currency
        );
      } else {
        const data = orders.flatMap((o: any) => {
          const items = o.items || [];
          return items.map((item: any) => {
            const itemTotal = Number(item.price) * (item.quantity || 1);
            const itemDiscount = Number(item.discount || 0);
            const itemTax = Math.max(0, (itemTotal - itemDiscount) * 15 / 115);
            const itemShipping = Number(item.shipping || 0);
            const netTotal = itemTotal - itemDiscount + itemShipping;

            return {
              'Order ID': o.id,
              'Date': new Date(o.createdAt).toLocaleDateString(),
              'Customer Name': o.buyer?.firstName ? `${o.buyer.firstName} ${o.buyer.lastName}` : 'Guest',
              'Product Name': item.productName || 'N/A',
              'SKU': item.sku || item.productId?.slice(0, 8).toUpperCase() || 'N/A',
              'Category': item.category || 'N/A',
              'Vendor': user?.firstName ? `${user.firstName} ${user.lastName}` : 'Seller',
              'Quantity': item.quantity || 1,
              'Unit Price': formatMoney(item.price),
              'Discount': formatMoney(item.discount || 0),
              'Tax': formatMoney(itemTax),
              'Shipping': formatMoney(itemShipping),
              'Total': formatMoney(netTotal),
              'Payment Status': (o.paymentStatus || (o.paymentMethod === 'cash_on_delivery' ? 'UNPAID' : 'PAID')).toUpperCase(),
              'Order Status': o.status
            };
          });
        });
        exportToExcel(data, 'Sales_Report');
      }
      toast.success('Report Downloaded!', { id: 'export' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate report', { id: 'export' });
    }
  };

  const handleExportInventory = async (format: 'pdf' | 'excel') => {
    try {
      toast.loading('Generating Inventory Report...', { id: 'export' });
      const res = await productsAPI.getSellerProducts();
      let products = res.data;
      
      // Apply Category Filter
      if (reportFilters.category !== 'all') {
        products = products.filter((p: any) => p.category === reportFilters.category);
      }
      // Apply Status Filter
      if (reportFilters.status !== 'all') {
        if (reportFilters.status === 'out') {
          products = products.filter((p: any) => p.stock === 0);
        } else if (reportFilters.status === 'low') {
          products = products.filter((p: any) => p.stock > 0 && p.stock <= 5);
        } else if (reportFilters.status === 'in') {
          products = products.filter((p: any) => p.stock > 5);
        }
      }

      if (products.length === 0) {
        toast.error('No matching records found for this report configuration.', { id: 'export' });
        return;
      }

      if (format === 'pdf') {
        await generateInventoryReportPDF(
          'Seller Inventory Report',
          products,
          {
            vendorName: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Seller',
            category: reportFilters.category !== 'all' ? reportFilters.category : 'All Categories',
            warehouse: 'Main Warehouse'
          },
          currency
        );
      } else {
        const data = products.map((p: any) => {
          const costPrice = p.costPrice || Number(p.price) * 0.7;
          const sellingPrice = p.isOnSale && p.salePrice ? p.salePrice : p.price;
          const reserved = p.reservedStock || 0;
          const available = Math.max(0, p.stock - reserved);

          return {
            'Product ID': p.id,
            'Product Name': p.name,
            'SKU': p.sku || p.id.slice(0, 8).toUpperCase() || 'N/A',
            'Barcode': p.barcode || '890' + p.id.replace(/-/g, '').slice(0, 10),
            'Category': p.category || 'N/A',
            'Vendor': user?.firstName ? `${user.firstName} ${user.lastName}` : 'Seller',
            'Current Stock': p.stock || 0,
            'Reserved Stock': reserved,
            'Available Stock': available,
            'Reorder Level': p.reorderLevel || 5,
            'Cost Price': formatMoney(costPrice),
            'Selling Price': formatMoney(sellingPrice),
            'Inventory Value': formatMoney(Number(p.price) * Number(p.stock)),
            'Last Restocked': p.lastRestocked ? new Date(p.lastRestocked).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString(),
            'Last Sold': p.lastSold ? new Date(p.lastSold).toLocaleDateString() : 'N/A',
            'Status': p.isActive ? 'Active' : 'Inactive'
          };
        });
        exportToExcel(data, 'Inventory_Report');
      }
      toast.success('Report Downloaded!', { id: 'export' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate report', { id: 'export' });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="bg-gray-300 h-8 w-64 mb-6 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-300 h-32 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Products',
      value: stats.totalProducts,
      icon: Package,
      gradient: 'from-blue-500 to-indigo-600',
      trend: stats.productsTrend?.trend || '0%',
      isUp: stats.productsTrend?.isUp ?? true,
      link: '/seller/products',
    },
    {
      title: 'Total Bookings',
      value: stats.totalOrders,
      icon: ShoppingBag,
      gradient: 'from-emerald-500 to-teal-600',
      trend: stats.ordersTrend?.trend || '0%',
      isUp: stats.ordersTrend?.isUp ?? true,
      link: '/seller/orders',
    },
    {
      title: 'Net Revenue',
      value: formatMoney(stats.totalRevenue),
      icon: Banknote,
      gradient: 'from-purple-500 to-pink-600',
      trend: stats.revenueTrend?.trend || '0%',
      isUp: stats.revenueTrend?.isUp ?? true,
      link: '/seller/orders',
    },
    {
      title: 'Pending Action',
      value: stats.pendingOrders,
      icon: Activity,
      gradient: 'from-orange-500 to-amber-600',
      trend: stats.pendingOrders > 0 ? 'Urgent' : 'Clear',
      isUp: stats.pendingOrders === 0,
      link: '/seller/orders?status=pending',
    },
  ];

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      {/* Header Section */}
      <div className="relative z-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            {user?.storeName ? (
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/20 dark:border-indigo-800/40 backdrop-blur-md shadow-sm">
                <Store className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-black tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
                  {user.storeName}
                </span>
                <span className="flex h-2 w-2 relative ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                <Store className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-extrabold tracking-wider text-slate-600 dark:text-slate-400 uppercase">My Shop</span>
              </div>
            )}
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Welcome back, <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">{user?.firstName}!</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Your store is performing well. Here's what's happening today.</p>
        </div>
        <div className="flex flex-wrap items-center space-x-3 gap-y-2 animate-slide-up-delay">
          <button 
            onClick={() => setShowReportsModal(true)}
            className="btn bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 shadow-sm px-6 py-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 font-bold"
          >
            <Download className="w-5 h-5 mr-2" />
            Reports Control Panel
          </button>
          <Link href="/seller/products" className="btn btn-primary shadow-lg shadow-primary-500/20 px-6 py-3 flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Post New Product
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div
            key={i}
            onClick={() => stat.link && router.push(stat.link)}
            className={`group relative bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden animate-fade-in-up ${stat.link ? 'cursor-pointer' : ''}`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Background Decorative Gradient */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 rounded-full blur-2xl transition-opacity`}></div>

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg shadow-${stat.gradient.split('-')[1]}-500/20 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-tighter uppercase ${stat.isUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'
                }`}>
                {stat.isUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {stat.trend}
              </div>
            </div>

            <div className="relative z-10">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{stat.title}</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{stat.value}</h3>
            </div>

            {stat.link && (
              <Link href={stat.link} className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></Link>
            )}
          </div>
        ))}
      </div>

      {/* Analytics and Activity Section */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sales Performance Visualizer */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Revenue Summary</h2>
              <p className="text-gray-400 text-sm font-medium mt-1">
                {revenueView === 'daily' ? 'Daily earnings over the last 15 days' : 'Monthly earnings over the last year'}
              </p>
            </div>
            <div className="flex bg-gray-50 dark:bg-gray-800 p-1.5 rounded-2xl shadow-inner">
              <button
                onClick={() => setRevenueView('daily')}
                className={`px-4 py-2 text-xs font-black uppercase tracking-widest transition-all rounded-xl ${revenueView === 'daily'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}>
                Daily
              </button>
              <button
                onClick={() => setRevenueView('monthly')}
                className={`px-4 py-2 text-xs font-black uppercase tracking-widest transition-all rounded-xl ${revenueView === 'monthly'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}>
                Monthly
              </button>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between px-4 gap-2 relative z-10">
            {(revenueView === 'daily' ? dailyChartData : monthlyChartData).map((data, i) => (
              <div key={i} className="flex-1 group/bar relative h-full flex items-end">
                <div
                  className="w-full bg-primary-500/10 dark:bg-primary-500/5 group-hover/bar:bg-primary-500/20 rounded-t-xl transition-all duration-700 relative overflow-visible cursor-pointer"
                  style={{ height: `${Math.max(data.percentage, 5)}%` }}
                >
                  <div
                    className="absolute bottom-0 w-full bg-gradient-to-t from-primary-600 to-indigo-500 rounded-t-xl transition-all duration-1000 ease-out delay-75 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                    style={{ height: `${data.percentage}%` }}
                  ></div>
                  
                  {/* Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 scale-75 group-hover/bar:scale-100 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold py-1.5 px-3 rounded-lg shadow-xl z-20 pointer-events-none whitespace-nowrap">
                    {formatMoney(data.amount)}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-white rotate-45"></div>
                  </div>
                </div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 scale-75 group-hover/bar:scale-100 whitespace-nowrap text-[10px] font-black text-primary-500">
                  {data.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 pt-8 border-t border-gray-50 dark:border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-2">
              <div className={`w-2.5 h-2.5 rounded-full ${growth.isUp ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`}></div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                Growth {growth.trend}
                {growth.isUp ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> : <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2.5 h-2.5 rounded-full ${conversion.isUp ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`}></div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                Conversion {conversion.rate}
                {conversion.isUp ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> : <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity / Fast Actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Recent Orders</h2>
              <Link href="/seller/orders" className="text-xs font-black text-primary-600 uppercase tracking-widest hover:translate-x-1 transition-transform inline-flex items-center">
                Expand <ChevronRight className="w-3 h-3 ml-1" />
              </Link>
            </div>

            <div className="space-y-4">
              {recentOrders.length > 0 ? recentOrders.map((order, i) => (
                <div key={order.id} onClick={() => { console.log('Clicked order:', order); setSelectedOrder(order); }} className="group flex items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center mr-4 group-hover:bg-primary-600 transition-colors">
                    <ShoppingBag className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight line-clamp-1">#ORDER-{order.id.slice(-6)}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-500 uppercase tracking-tighter">{formatMoney(order.totalAmount)}</p>
                    <p className="text-[10px] font-bold text-gray-500 lowercase mt-0.5 italic">{order.status}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                  <Box className="w-12 h-12 text-gray-200 dark:text-gray-800 mx-auto mb-4" />
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">No recent sales</p>
                </div>
              )}
            </div>

            <div className="mt-10 space-y-3">
              <Link href="/seller/communications" className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-transform">
                <span className="text-xs font-black uppercase tracking-widest">Marketing Hub</span>
                <Send className="w-5 h-5 opacity-50" />
              </Link>
              <Link href="/seller/promotions" className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-transform">
                <span className="text-xs font-black uppercase tracking-widest">Promotions & Discounts</span>
                <Tag className="w-5 h-5 opacity-50" />
              </Link>
              <Link href="/seller/products" className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-xl shadow-primary-500/20 hover:scale-[1.02] transition-transform">
                <span className="text-xs font-black uppercase tracking-widest">Manage Inventory</span>
                <LayoutDashboard className="w-5 h-5 opacity-50" />
              </Link>
              <Link href="/seller/reviews" className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-transform">
                <span className="text-xs font-black uppercase tracking-widest">Product Reviews</span>
                <MessageSquare className="w-5 h-5 opacity-50" />
              </Link>
              <Link href="/profile" className="w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                <span className="text-xs font-black uppercase tracking-widest">Store Settings</span>
                <CreditCard className="w-5 h-5 text-gray-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <div>
                <h3 className="font-black text-xl text-gray-900 dark:text-white flex items-center tracking-tight">
                  <CreditCard className="w-5 h-5 mr-2 text-indigo-500" />
                  Order Receipt
                </h3>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                  #{selectedOrder?.id?.toString().split('-')[0]?.toUpperCase()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6 custom-scrollbar">
              {/* Buyer Info */}
              <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3 flex items-center">
                  <User className="w-3 h-3 mr-1" /> Customer Details
                </h4>
                <p className="font-bold text-gray-900 dark:text-white">
                  {selectedOrder.buyer?.firstName ? `${selectedOrder.buyer.firstName} ${selectedOrder.buyer.lastName}` : 'Guest User'}
                </p>
                {selectedOrder.buyer?.email && (
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{selectedOrder.buyer.email}</p>
                )}
                {selectedOrder.phone && (
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{selectedOrder.phone}</p>
                )}
                <div className="mt-2 pt-2 border-t border-indigo-100/50 dark:border-indigo-800/30">
                  <p className="text-xs text-gray-600 dark:text-gray-300"><span className="font-semibold">Shipping:</span> {selectedOrder?.shippingAddress || 'N/A'}, {selectedOrder?.city || 'N/A'}, {selectedOrder?.state || 'N/A'} {selectedOrder?.zipCode || 'N/A'}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center">
                  <Box className="w-3 h-3 mr-1" /> Purchased Items
                </h4>
                <div className="space-y-3">
                  {selectedOrder?.items && Array.isArray(selectedOrder.items) ? selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800/50">
                      <div className="flex gap-3">
                        {item?.image && (
                          <img src={item.image} alt={item.productName || 'Product'} className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <div>
                          <p className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{item?.productName || 'Unknown Product'}</p>
                          <p className="text-xs font-medium text-gray-500">Qty: {item?.quantity || 0} × {formatMoney(item?.price || 0)}</p>
                        </div>
                      </div>
                      <span className="font-black text-gray-900 dark:text-white text-sm">
                        {formatMoney(Number(item?.price || 0) * Number(item?.quantity || 0))}
                      </span>
                    </div>
                  )) : (
                    <p className="text-xs text-gray-500">No items found</p>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatMoney(Number(selectedOrder?.totalAmount || 0) + Number(selectedOrder?.discountAmount || 0))}
                  </span>
                </div>
                {Number(selectedOrder?.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm text-amber-500">
                    <span className="font-medium flex items-center"><Tag className="w-3 h-3 mr-1"/> Discount (Proportional)</span>
                    <span className="font-bold">-{formatMoney(selectedOrder?.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Payment Method</span>
                  <span className="font-bold text-gray-900 dark:text-white capitalize text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                    {selectedOrder?.paymentMethod?.toString().replace(/_/g, ' ') || 'Cash on delivery'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center rounded-b-[2rem]">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Paid</p>
                <p className="text-2xl font-black text-emerald-500 tracking-tight">
                  {formatMoney(selectedOrder.totalAmount)}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                selectedOrder.status === 'delivered' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                selectedOrder.status === 'cancelled' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' :
                'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
              }`}>
                {selectedOrder.status}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Configuration Control Modal */}
      {showReportsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200 p-6 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-primary-500" />
                Reports Control Panel
              </h3>
              <button 
                onClick={() => setShowReportsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Report Type */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Report Category</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setReportType('sales'); setReportFilters(prev => ({ ...prev, status: 'all' })); }}
                    className={`p-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest text-center transition-all ${
                      reportType === 'sales'
                        ? 'border-primary-500 bg-primary-50/20 text-primary-600 dark:text-primary-400'
                        : 'border-gray-250 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                    }`}
                  >
                    Sales Report
                  </button>
                  <button
                    onClick={() => { setReportType('inventory'); setReportFilters(prev => ({ ...prev, status: 'all' })); }}
                    className={`p-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest text-center transition-all ${
                      reportType === 'inventory'
                        ? 'border-primary-500 bg-primary-50/20 text-primary-600 dark:text-primary-400'
                        : 'border-gray-250 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                    }`}
                  >
                    Inventory
                  </button>
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Export Format</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setReportFormat('pdf')}
                    className={`p-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest text-center transition-all ${
                      reportFormat === 'pdf'
                        ? 'border-primary-500 bg-primary-50/20 text-primary-600 dark:text-primary-400'
                        : 'border-gray-250 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                    }`}
                  >
                    Premium PDF
                  </button>
                  <button
                    onClick={() => setReportFormat('excel')}
                    className={`p-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest text-center transition-all ${
                      reportFormat === 'excel'
                        ? 'border-primary-500 bg-primary-50/20 text-primary-600 dark:text-primary-400'
                        : 'border-gray-250 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                    }`}
                  >
                    Excel / CSV
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                {reportType === 'sales' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Start Date</label>
                      <div className="relative">
                        <input
                          ref={startDateRef}
                          type="date"
                          value={reportFilters.startDate}
                          onChange={(e) => setReportFilters(p => ({ ...p, startDate: e.target.value }))}
                          className="w-full pl-3.5 pr-10 py-2.5 text-xs font-semibold bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-200 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              startDateRef.current?.showPicker();
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">End Date</label>
                      <div className="relative">
                        <input
                          ref={endDateRef}
                          type="date"
                          value={reportFilters.endDate}
                          onChange={(e) => setReportFilters(p => ({ ...p, endDate: e.target.value }))}
                          className="w-full pl-3.5 pr-10 py-2.5 text-xs font-semibold bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-200 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              endDateRef.current?.showPicker();
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <style dangerouslySetInnerHTML={{__html: `
                      input[type="date"]::-webkit-calendar-picker-indicator {
                        display: none;
                        -webkit-appearance: none;
                      }
                    `}} />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Product Category</label>
                    <select
                      value={reportFilters.category}
                      onChange={(e) => setReportFilters(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-250 focus:outline-none"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Filters Status</label>
                    {reportType === 'sales' ? (
                      <select
                        value={reportFilters.status}
                        onChange={(e) => setReportFilters(p => ({ ...p, status: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs font-semibold bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-250 focus:outline-none"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <select
                        value={reportFilters.status}
                        onChange={(e) => setReportFilters(p => ({ ...p, status: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs font-semibold bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-250 focus:outline-none"
                      >
                        <option value="all">All Stock Statuses</option>
                        <option value="in">In Stock (&gt;5 units)</option>
                        <option value="low">Low Stock (1-5 units)</option>
                        <option value="out">Out of Stock (0 units)</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex gap-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowReportsModal(false)}
                className="btn bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 w-1/3 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReportsModal(false);
                  if (reportType === 'sales') {
                    handleExportSales(reportFormat);
                  } else {
                    handleExportInventory(reportFormat);
                  }
                }}
                className="btn btn-primary w-2/3 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-center flex justify-center items-center shadow-lg transition-all"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
