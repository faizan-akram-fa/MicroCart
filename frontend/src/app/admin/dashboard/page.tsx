'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Users,
  ShoppingBag,
  TrendingUp,
  Banknote,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Package,
  Loader,
  Download,
  Calendar,
  Shield,
  AlertCircle,
  Star
} from 'lucide-react';
import { adminAPI, ordersAPI, reviewsAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { generateSalesReportPDF, generateInventoryReportPDF, exportToExcel } from '@/utils/reportGenerator';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { currency, exchangeRates } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const router = useRouter();

  // Reports Control panel states
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [reportType, setReportType] = useState<'sales' | 'inventory'>('sales');
  const [reportFormat, setReportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [reportMode, setReportMode] = useState<'global' | 'vendor'>('global');
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [reportFilters, setReportFilters] = useState({
    startDate: '',
    endDate: '',
    category: 'all',
    status: 'all',
  });
  const [sellers, setSellers] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [trends, setTrends] = useState<any>({
    revenue: { trend: '0%', isUp: true },
    orders: { trend: '0%', isUp: true },
    aov: { trend: '0%', isUp: true }
  });

  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const formatMoney = (amount: number | string) => {
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    const rate = exchangeRates[currency] || 1;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(val * rate);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, logsRes, usersRes, inventoryRes, ordersRes, reviewsRes] = await Promise.all([
        adminAPI.getSalesStats().catch(err => { console.error(err); return { data: null }; }),
        adminAPI.getActivityLogs().catch(err => { console.error(err); return { data: [] }; }),
        adminAPI.getAllUsers().catch(err => { console.error(err); return { data: [] }; }),
        adminAPI.getInventory().catch(err => { console.error(err); return { data: [] }; }),
        ordersAPI.getAllAdmin().catch(err => { console.error(err); return { data: [] }; }),
        reviewsAPI.getAllAdmin().catch(err => { console.error(err); return { data: [] }; }),
      ]);

      const ordersData = ordersRes?.data || [];
      setOrders(ordersData);

      const allUsers = usersRes?.data || [];
      setUsers(allUsers);

      const reviewsData = reviewsRes?.data || [];
      setReviews(reviewsData);

      // Exclude cancelled/refunded so: completedOrders + pendingOrders = totalOrders always
      const activeOrdersData = ordersData.filter((o: any) =>
        o.status !== 'cancelled' && o.status !== 'refunded'
      );
      const totalOrdersCount = activeOrdersData.length;

      const completedOrdersCount = activeOrdersData.filter((o: any) =>
        o.status === 'delivered' ||
        (['card', 'easypaisa', 'jazzcash'].includes(o.paymentMethod) &&
          ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status))
      ).length;

      const pendingOrdersCount = activeOrdersData.filter((o: any) => {
        if (['card', 'easypaisa', 'jazzcash'].includes(o.paymentMethod)) {
          return o.status === 'pending';
        }
        return ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status);
      }).length;

      const revenueOrders = ordersData.filter((o: any) => {
        const isOnline = ['card', 'easypaisa', 'jazzcash'].includes(o.paymentMethod);
        if (isOnline) {
          return ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status);
        }
        return o.status === 'delivered';
      });
      const totalRevenueVal = revenueOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
      const averageOrderValueVal = totalOrdersCount > 0 ? totalRevenueVal / totalOrdersCount : 0;

      const dynamicStats = {
        totalRevenue: totalRevenueVal,
        totalOrders: totalOrdersCount,
        averageOrderValue: averageOrderValueVal,
        completedOrders: completedOrdersCount,
        pendingOrders: pendingOrdersCount
      };

      setStats(dynamicStats);

      // Map activities dynamically from multiple streams to create a rich real-time feed
      const auditActivities = (logsRes?.data || []).map((log: any) => ({
        id: `log_${log.id || Math.random()}`,
        timestamp: new Date(log.timestamp),
        action: log.action,
        details: log.details,
        type: 'audit'
      }));

      const orderActivities = (ordersData || []).map((o: any) => {
        const buyerUser = allUsers.find((u: any) => u.id === o.userId);
        const buyerName = buyerUser ? `${buyerUser.firstName} ${buyerUser.lastName}` : (o.buyer?.firstName ? `${o.buyer.firstName} ${o.buyer.lastName}` : 'Guest');
        const buyerEmail = buyerUser ? buyerUser.email : (o.buyer?.email || '');
        const emailStr = buyerEmail ? ` (${buyerEmail})` : '';
        return {
          id: `order_${o.id}`,
          timestamp: new Date(o.createdAt),
          action: 'NEW_ORDER',
          details: `Order placed by ${buyerName}${emailStr} totaling ${formatMoney(o.totalAmount)} (${o.items?.length || 0} items)`,
          type: 'order'
        };
      });

      const userActivities = (allUsers || []).map((u: any) => ({
        id: `user_${u.id}`,
        timestamp: new Date(u.createdAt),
        action: 'USER_REGISTERED',
        details: `New ${u.role === 'seller' ? 'Seller' : 'Buyer'} account registered: ${u.firstName} ${u.lastName} (${u.email})`,
        type: 'user'
      }));

      const reviewActivities = (reviewsRes?.data || []).map((r: any) => {
        const reviewerName = r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Anonymous';
        return {
          id: `review_${r.id}`,
          timestamp: new Date(r.createdAt),
          action: 'NEW_REVIEW',
          details: `${reviewerName} submitted a ${r.rating}★ rating on product "${r.productName || 'Catalog Product'}"`,
          type: 'review'
        };
      });

      const combinedActivities = [
        ...auditActivities,
        ...orderActivities,
        ...userActivities,
        ...reviewActivities
      ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setRecentLogs(combinedActivities.slice(0, 10));

      // Filter sellers
      const sellerUsers = allUsers.filter((u: any) => u.role === 'seller');
      setSellers(sellerUsers);

      // Extract unique categories
      const productsData = inventoryRes?.data || [];
      setProducts(productsData);
      const cats = Array.from(new Set(productsData.map((p: any) => p.category).filter(Boolean))) as string[];
      setCategories(cats);

      // Compute weekly trends dynamically
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

      const isOrderRevenue = (o: any) => {
        const isOnline = ['card', 'easypaisa', 'jazzcash'].includes(o.paymentMethod);
        if (isOnline) {
          return o.status !== 'cancelled' && o.status !== 'refunded';
        }
        return o.status === 'delivered';
      };

      // 1. Revenue trend
      const currentRevenue = ordersData
        .filter((o: any) => {
          const date = new Date(o.createdAt);
          return date >= oneMonthAgo && date <= now && isOrderRevenue(o);
        })
        .reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0);

      const previousRevenue = ordersData
        .filter((o: any) => {
          const date = new Date(o.createdAt);
          return date >= twoMonthsAgo && date < oneMonthAgo && isOrderRevenue(o);
        })
        .reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0);

      const revenueTrend = calculateTrend(currentRevenue, previousRevenue);

      // 2. Orders count trend
      const currentOrdersCount = ordersData.filter((o: any) => {
        const date = new Date(o.createdAt);
        return date >= oneMonthAgo && date <= now;
      }).length;

      const previousOrdersCount = ordersData.filter((o: any) => {
        const date = new Date(o.createdAt);
        return date >= twoMonthsAgo && date < oneMonthAgo;
      }).length;

      const ordersTrend = calculateTrend(currentOrdersCount, previousOrdersCount);

      // 3. Avg Order Value trend
      const currentAOV = currentOrdersCount > 0 ? currentRevenue / currentOrdersCount : 0;
      const previousAOV = previousOrdersCount > 0 ? previousRevenue / previousOrdersCount : 0;
      const aovTrend = calculateTrend(currentAOV, previousAOV);

      setTrends({
        revenue: revenueTrend,
        orders: ordersTrend,
        aov: aovTrend
      });

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSales = async (format: 'pdf' | 'excel') => {
    try {
      toast.loading('Generating Sales Report...', { id: 'export' });
      const res = await ordersAPI.getAllAdmin();
      let orders = res.data || [];

      // Resolve buyer names, categories, SKUs, and discounts using users and products lists
      orders = orders.map((o: any) => {
        const buyerUser = users.find((u: any) => u.id === o.userId);
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

      // Apply Tenancy Boundary Filters (Mode 1 vs Mode 2)
      if (reportMode === 'vendor') {
        if (selectedVendors.length === 0) {
          toast.error('Please select at least one vendor', { id: 'export' });
          return;
        }

        orders = orders.map((o: any) => {
          const filteredItems = o.items.filter((item: any) => selectedVendors.includes(item.sellerId));
          if (filteredItems.length === 0) return null;

          const totalAmount = filteredItems.reduce((sum: number, item: any) => sum + (Number(item.price) * (item.quantity || 1)), 0);
          return {
            ...o,
            items: filteredItems,
            totalAmount
          };
        }).filter(Boolean);
      }

      // Apply Date Filters
      if (reportFilters.startDate) {
        orders = orders.filter((o: any) => new Date(o.createdAt) >= new Date(reportFilters.startDate));
      }
      if (reportFilters.endDate) {
        const nextDay = new Date(reportFilters.endDate);
        nextDay.setDate(nextDay.getDate() + 1);
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

      const scopeName = reportMode === 'global'
        ? 'Global Marketplace'
        : sellers.filter(s => selectedVendors.includes(s.id)).map(s => `${s.firstName} ${s.lastName}`).join(', ');

      if (format === 'pdf') {
        await generateSalesReportPDF(
          reportMode === 'global' ? 'Marketplace Sales Report' : 'Consolidated Vendor Sales Report',
          orders,
          {
            startDate: reportFilters.startDate,
            endDate: reportFilters.endDate,
            vendorName: scopeName,
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
            const vendorUser = sellers.find(s => s.id === item.sellerId);

            return {
              'Order ID': o.id,
              'Date': new Date(o.createdAt).toLocaleDateString(),
              'Customer Name': o.buyer?.firstName ? `${o.buyer.firstName} ${o.buyer.lastName}` : 'Guest',
              'Product Name': item.productName || 'N/A',
              'SKU': item.sku || item.productId?.slice(0, 8).toUpperCase() || 'N/A',
              'Category': item.category || 'N/A',
              'Vendor': vendorUser ? `${vendorUser.firstName} ${vendorUser.lastName}` : (item.storeName || item.sellerId || 'N/A'),
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
        exportToExcel(data, reportMode === 'global' ? 'Marketplace_Sales_Report' : 'Vendor_Sales_Report');
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
      const res = await adminAPI.getInventory();
      let products = res.data || [];

      // Apply Tenancy Boundary Filters
      if (reportMode === 'vendor') {
        if (selectedVendors.length === 0) {
          toast.error('Please select at least one vendor', { id: 'export' });
          return;
        }
        products = products.filter((p: any) => selectedVendors.includes(p.sellerId));
      }

      // Apply Category Filter
      if (reportFilters.category !== 'all') {
        products = products.filter((p: any) => p.category === reportFilters.category);
      }

      // Apply Stock Status Filter
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

      const scopeName = reportMode === 'global'
        ? 'Global Marketplace'
        : sellers.filter(s => selectedVendors.includes(s.id)).map(s => `${s.firstName} ${s.lastName}`).join(', ');

      if (format === 'pdf') {
        await generateInventoryReportPDF(
          reportMode === 'global' ? 'Global Inventory Report' : 'Consolidated Vendor Inventory Report',
          products,
          {
            vendorName: scopeName,
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
          const vendorUser = sellers.find(s => s.id === p.sellerId);

          return {
            'Product ID': p.id,
            'Product Name': p.name,
            'SKU': p.sku || p.id.slice(0, 8).toUpperCase() || 'N/A',
            'Barcode': p.barcode || '890' + p.id.replace(/-/g, '').slice(0, 10),
            'Category': p.category || 'N/A',
            'Vendor': vendorUser ? `${vendorUser.firstName} ${vendorUser.lastName}` : (p.storeName || p.sellerId || 'N/A'),
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
        exportToExcel(data, reportMode === 'global' ? 'Marketplace_Inventory_Report' : 'Vendor_Inventory_Report');
      }
      toast.success('Report Downloaded!', { id: 'export' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate report', { id: 'export' });
    }
  };

  const handleVendorCheckboxChange = (vendorId: string) => {
    setSelectedVendors(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleSelectAllVendors = () => {
    if (selectedVendors.length === sellers.length) {
      setSelectedVendors([]);
    } else {
      setSelectedVendors(sellers.map(s => s.id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Revenue',
      value: formatMoney(stats?.totalRevenue || 0),
      icon: Banknote,
      color: 'bg-emerald-500',
      trend: trends.revenue.trend,
      isUp: trends.revenue.isUp,
      href: '/admin/sales'
    },
    {
      name: 'Total Orders',
      value: stats?.totalOrders || '0',
      icon: ShoppingBag,
      color: 'bg-blue-500',
      trend: trends.orders.trend,
      isUp: trends.orders.isUp,
      href: '/admin/orders'
    },
    {
      name: 'Avg Order Value',
      value: formatMoney(stats?.averageOrderValue || 0),
      icon: TrendingUp,
      color: 'bg-indigo-500',
      trend: trends.aov.trend,
      isUp: trends.aov.isUp,
      href: '/admin/sales'
    },
    {
      name: 'Pending Orders',
      value: stats?.pendingOrders || '0',
      icon: Activity,
      color: 'bg-amber-500',
      trend: stats?.pendingOrders > 0 ? 'Urgent' : 'Clear',
      isUp: stats?.pendingOrders === 0,
      href: '/admin/orders?status=pending'
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="relative z-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time performance metrics and system activity.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowReportsModal(true)}
            className="btn bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 shadow-sm px-5 py-2.5 rounded-xl flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-bold transition-all"
          >
            <Download className="w-4 h-4 mr-2 text-primary-500" />
            Reports Control Panel
          </button>

          <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            {(['daily', 'weekly', 'monthly'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeFilter === filter
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div
            key={i}
            onClick={() => router.push(stat.href)}
            className={`group cursor-pointer p-6 rounded-3xl shadow-sm border transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:shadow-xl hover:border-primary-500/30`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.color} bg-opacity-10 dark:bg-opacity-20 transition-colors group-hover:scale-110 duration-300`}>
                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <div className={`flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${stat.isUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'
                }`}>
                {stat.isUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {stat.trend}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Insights / Sales Performance */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Sales Performance</h2>
            <div className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-[10px] font-bold uppercase">
              {timeFilter} View
            </div>
          </div>

          <div className="relative h-64 flex items-center justify-center">
            {stats ? (
              <>
                <svg className="w-52 h-52 transform -rotate-90">
                  <circle
                    cx="104"
                    cy="104"
                    r="90"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="16"
                    className="text-gray-100 dark:text-gray-800"
                  />
                  <circle
                    cx="104"
                    cy="104"
                    r="90"
                    fill="transparent"
                    stroke="url(#greenGradient)"
                    strokeWidth="18"
                    strokeDasharray={`${2 * Math.PI * 90}`}
                    strokeDashoffset={`${2 * Math.PI * 90 * (1 - (stats.completedOrders / (stats.totalOrders || 1)))}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <circle
                    cx="104"
                    cy="104"
                    r="90"
                    fill="transparent"
                    stroke="url(#redGradient)"
                    strokeWidth="18"
                    strokeDasharray={`${2 * Math.PI * 90}`}
                    strokeDashoffset={`${2 * Math.PI * 90 * (1 - (stats.pendingOrders / (stats.totalOrders || 1)))}`}
                    transform={`rotate(${360 * (stats.completedOrders / (stats.totalOrders || 1))}, 104, 104)`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out opacity-80"
                  />
                  <defs>
                    <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#e11d48" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1" key={`label-overall-${timeFilter}`}>
                    Overall Completion
                  </p>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white animate-slide-up" key={`value-overall-${timeFilter}`}>
                    {Math.round((stats.completedOrders / (stats.totalOrders || 1)) * 100)}%
                  </h3>
                  <div className="mt-2 flex items-center space-x-3">
                    <span className="flex items-center text-[10px] font-bold text-emerald-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1 shadow-[0_0_8px_#10b981]"></span>
                      {Math.round((stats.completedOrders / (stats.totalOrders || 1)) * 100)}%
                    </span>
                    <span className="flex items-center text-[10px] font-bold text-rose-500">
                      <span className="w-2 h-2 rounded-full bg-rose-500 mr-1 shadow-[0_0_8px_#f43f5e]"></span>
                      {Math.round((stats.pendingOrders / (stats.totalOrders || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <Loader className="w-8 h-8 text-primary-600 animate-spin" />
            )}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Completed Orders</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{stats?.completedOrders}</p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/50">
              <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tighter">Pending / Incomplete</p>
              <p className="text-lg font-black text-rose-700 dark:text-rose-300">{stats?.pendingOrders}</p>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Click item to view receipt</p>
            </div>
            <button className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors bg-primary-50 dark:bg-primary-950/20 px-3 py-1.5 rounded-xl">View All</button>
          </div>
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
            {recentLogs.length > 0 ? recentLogs.map((log, i) => {
              // Get custom icon and color scheme based on action type
              const getActivityIcon = (activity: any) => {
                switch (activity.action) {
                  case 'NEW_ORDER':
                    return {
                      icon: ShoppingBag,
                      color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/30'
                    };
                  case 'USER_REGISTERED':
                    return {
                      icon: Users,
                      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
                    };
                  case 'NEW_REVIEW':
                    return {
                      icon: Star,
                      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
                    };
                  case 'CREATE_SUB_ADMIN':
                    return {
                      icon: Shield,
                      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30'
                    };
                  case 'BLOCK_USER':
                  case 'DELETE_SUB_ADMIN':
                    return {
                      icon: AlertCircle,
                      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30'
                    };
                  default:
                    return {
                      icon: Clock,
                      color: 'text-slate-600 bg-slate-50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800/30'
                    };
                }
              };

              const { icon: Icon, color } = getActivityIcon(log);
              return (
                <div
                  key={log.id || i}
                  onClick={() => setSelectedActivity(log)}
                  className="flex space-x-4 animate-fade-in-up items-start cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 p-2.5 rounded-2xl transition-all hover:scale-[1.01]"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${color} transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-850 dark:text-gray-200 leading-relaxed text-wrap">
                      {log.details}
                    </p>
                    <div className="flex items-center mt-1 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      <span className="text-primary-600 dark:text-primary-400 mr-2">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span>
                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-200 dark:text-gray-800 mx-auto mb-4" />
                <p className="text-gray-400 text-sm italic">No recent activity found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reports Control Modal */}
      {showReportsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200 p-6 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-primary-500" />
                Admin Reports Control Panel
              </h3>
              <button
                onClick={() => setShowReportsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
              {/* Report Mode */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Scope Setting</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setReportMode('global')}
                    className={`p-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest text-center transition-all ${reportMode === 'global'
                        ? 'border-primary-500 bg-primary-50/20 text-primary-600 dark:text-primary-400'
                        : 'border-gray-250 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                      }`}
                  >
                    Marketplace-wide (Mode 2)
                  </button>
                  <button
                    onClick={() => setReportMode('vendor')}
                    className={`p-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest text-center transition-all ${reportMode === 'vendor'
                        ? 'border-primary-500 bg-primary-50/20 text-primary-600 dark:text-primary-400'
                        : 'border-gray-250 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                      }`}
                  >
                    Vendor Specific (Mode 1)
                  </button>
                </div>
              </div>

              {/* Vendor Selector checklist */}
              {reportMode === 'vendor' && (
                <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-850 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-800">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Vendor / Vendors</span>
                    <button
                      onClick={handleSelectAllVendors}
                      className="text-[10px] font-black uppercase text-primary-600 hover:text-primary-700"
                    >
                      {selectedVendors.length === sellers.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  {sellers.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar pt-1">
                      {sellers.map((s) => (
                        <label key={s.id} className="flex items-center space-x-2.5 cursor-pointer p-1.5 hover:bg-white dark:hover:bg-gray-900 rounded-lg">
                          <input
                            type="checkbox"
                            checked={selectedVendors.includes(s.id)}
                            onChange={() => handleVendorCheckboxChange(s.id)}
                            className="rounded text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-700 bg-transparent w-4 h-4"
                          />
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                            {s.firstName} {s.lastName}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No registered vendors found</p>
                  )}
                </div>
              )}

              {/* Report Category */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Report Category</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setReportType('sales'); setReportFilters(prev => ({ ...prev, status: 'all' })); }}
                    className={`p-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest text-center transition-all ${reportType === 'sales'
                        ? 'border-primary-500 bg-primary-50/20 text-primary-600 dark:text-primary-400'
                        : 'border-gray-250 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                      }`}
                  >
                    Sales Report
                  </button>
                  <button
                    onClick={() => { setReportType('inventory'); setReportFilters(prev => ({ ...prev, status: 'all' })); }}
                    className={`p-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest text-center transition-all ${reportType === 'inventory'
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
                    className={`p-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest text-center transition-all ${reportFormat === 'pdf'
                        ? 'border-primary-500 bg-primary-50/20 text-primary-600 dark:text-primary-400'
                        : 'border-gray-250 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                      }`}
                  >
                    Premium PDF
                  </button>
                  <button
                    onClick={() => setReportFormat('excel')}
                    className={`p-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest text-center transition-all ${reportFormat === 'excel'
                        ? 'border-primary-500 bg-primary-50/20 text-primary-600 dark:text-primary-400'
                        : 'border-gray-250 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                      }`}
                  >
                    Excel / CSV
                  </button>
                </div>
              </div>

              {/* Date Filters */}
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
                  <style dangerouslySetInnerHTML={{
                    __html: `
                    input[type="date"]::-webkit-calendar-picker-indicator {
                      display: none;
                      -webkit-appearance: none;
                    }
                  `}} />
                </div>
              )}

              {/* Categorization and Status Filters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Product Category</label>
                  <select
                    value={reportFilters.category}
                    onChange={(e) => setReportFilters(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-250 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Filter Status</label>
                  {reportType === 'sales' ? (
                    <select
                      value={reportFilters.status}
                      onChange={(e) => setReportFilters(p => ({ ...p, status: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-250 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  ) : (
                    <select
                      value={reportFilters.status}
                      onChange={(e) => setReportFilters(p => ({ ...p, status: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-250 focus:outline-none cursor-pointer"
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
                onClick={async () => {
                  setShowReportsModal(false);
                  if (reportType === 'sales') {
                    await handleExportSales(reportFormat);
                  } else {
                    await handleExportInventory(reportFormat);
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

      {/* Receipt/Activity Detail Modal */}
      {selectedActivity && (() => {
        // Resolve underlying record
        let orderObj: any = null;
        let userObj: any = null;
        let reviewObj: any = null;

        if (selectedActivity.type === 'order') {
          const orderId = selectedActivity.id.replace('order_', '');
          orderObj = orders.find(o => String(o.id) === orderId);
        } else if (selectedActivity.type === 'user') {
          const userId = selectedActivity.id.replace('user_', '');
          userObj = users.find(u => String(u.id) === userId);
        } else if (selectedActivity.type === 'review') {
          const reviewId = selectedActivity.id.replace('review_', '');
          reviewObj = reviews.find(r => String(r.id) === reviewId);
        }

        return (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-250">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-250 relative">

              {/* Receipt Header Pattern */}
              <div className="bg-gradient-to-r from-sky-500/10 to-indigo-500/10 p-6 text-center border-b border-dashed border-slate-205 dark:border-slate-750 relative">
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setSelectedActivity(null)}
                    className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm animate-bounce">
                  {selectedActivity.type === 'order' && <ShoppingBag className="w-6 h-6 text-sky-500" />}
                  {selectedActivity.type === 'user' && <Users className="w-6 h-6 text-emerald-500" />}
                  {selectedActivity.type === 'review' && <Star className="w-6 h-6 text-amber-500" />}
                  {selectedActivity.type === 'audit' && <Shield className="w-6 h-6 text-indigo-500" />}
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Platform Activity Receipt
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">
                  ID: #{selectedActivity.id.slice(0, 18).toUpperCase()}
                </p>
              </div>

              {/* Receipt Body */}
              <div className="p-6 space-y-5 max-h-[50vh] overflow-y-auto custom-scrollbar font-mono text-xs text-slate-700 dark:text-slate-300">

                {/* Standard Meta Rows */}
                <div className="space-y-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">EVENT TYPE:</span>
                    <span className="text-slate-800 dark:text-white font-extrabold uppercase">{selectedActivity.action.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">TIMESTAMP:</span>
                    <span className="text-slate-850 dark:text-white font-medium">{new Date(selectedActivity.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                {/* 1. ORDER DETAILS (RECEIPT) */}
                {selectedActivity.type === 'order' && (
                  <div className="space-y-4">
                    {orderObj ? (
                      <>
                        <div className="space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">ORDER STATUS:</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${orderObj.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' :
                                orderObj.status === 'cancelled' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                              }`}>{orderObj.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">PAY METHOD:</span>
                            <span className="text-slate-800 dark:text-white font-bold uppercase">{orderObj.paymentMethod.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">PAY STATUS:</span>
                            <span className="text-slate-800 dark:text-white font-bold uppercase">{orderObj.paymentStatus || 'PAID'}</span>
                          </div>
                        </div>

                        {/* Order Items List */}
                        <div className="border-t border-b border-dashed border-slate-200 dark:border-slate-700 py-3 space-y-2">
                          <span className="text-slate-400 font-bold block mb-1">PURCHASED ITEMS:</span>
                          {(orderObj.items || []).map((item: any, idx: number) => (
                            <div key={item.id || idx} className="flex justify-between leading-relaxed">
                              <span className="truncate max-w-[240px]">{item.productName} <span className="text-slate-400">x{item.quantity}</span></span>
                              <span>{formatMoney(Number(item.price) * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Order Financials */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-slate-500">
                            <span>SUBTOTAL:</span>
                            <span>{formatMoney(orderObj.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>DISCOUNT:</span>
                            <span>{formatMoney(0)}</span>
                          </div>
                          <div className="flex justify-between text-slate-800 dark:text-white font-black text-sm border-t border-slate-100 dark:border-slate-800 pt-2">
                            <span>TOTAL PAID:</span>
                            <span>{formatMoney(orderObj.totalAmount)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-slate-400 italic">
                        Full order record not cached or deleted.
                      </div>
                    )}
                  </div>
                )}

                {/* 2. USER REGISTRATION DETAILS */}
                {selectedActivity.type === 'user' && (
                  <div className="space-y-3">
                    {userObj ? (
                      <>
                        <div className="space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">FULL NAME:</span>
                            <span className="text-slate-800 dark:text-white font-extrabold">{userObj.firstName} {userObj.lastName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">EMAIL:</span>
                            <span className="text-slate-800 dark:text-white font-medium select-all">{userObj.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">PLATFORM ROLE:</span>
                            <span className="text-sky-500 font-black uppercase">{userObj.role}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">ACCOUNT STATUS:</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${userObj.isActive !== false ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                              }`}>{userObj.isActive !== false ? 'ACTIVE' : 'BLOCKED'}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-slate-400 italic">
                        User profile record details not found.
                      </div>
                    )}
                  </div>
                )}

                {/* 3. REVIEW DETAILS */}
                {selectedActivity.type === 'review' && (
                  <div className="space-y-3">
                    {reviewObj ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">SUBMITTED BY:</span>
                            <span className="text-slate-800 dark:text-white font-bold">
                              {reviewObj.user ? `${reviewObj.user.firstName} ${reviewObj.user.lastName}` : 'Customer'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">PRODUCT:</span>
                            <span className="text-slate-800 dark:text-white font-bold truncate max-w-[220px]">
                              {reviewObj.productName || 'Catalog Product'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-bold">RATING GIVEN:</span>
                            <span className="text-amber-500 font-black text-sm flex gap-0.5">
                              {'★'.repeat(reviewObj.rating)}
                              {'☆'.repeat(5 - reviewObj.rating)}
                            </span>
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mt-2">
                          <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">REVIEW COMMENT:</span>
                          <p className="text-slate-600 dark:text-slate-350 italic whitespace-pre-wrap leading-relaxed">
                            "{reviewObj.comment || 'No comment provided'}"
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-slate-400 italic">
                        Review record details not found.
                      </div>
                    )}
                  </div>
                )}

                {/* 4. AUDIT LOG DETAILS */}
                {selectedActivity.type === 'audit' && (
                  <div className="space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">AUDIT DESCRIPTION:</span>
                      <p className="text-slate-700 dark:text-slate-200 font-bold leading-relaxed text-wrap">
                        {selectedActivity.details}
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* Receipt Footer */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-2xl shadow-md transition-all active:scale-[0.98]"
                >
                  Dismiss Receipt
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
