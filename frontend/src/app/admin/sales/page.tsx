'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  Banknote, 
  ShoppingBag, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Loader,
  RefreshCcw,
  BarChart,
  PieChart
} from 'lucide-react';
import { adminAPI, ordersAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SalesMonitoring() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenuePeriod, setRevenuePeriod] = useState<string>('monthly');
  const [selectedChartPoint, setSelectedChartPoint] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, productsRes] = await Promise.all([
        adminAPI.getSalesStats().catch(err => { console.error(err); return { data: null }; }),
        ordersAPI.getAllAdmin().catch(err => { console.error(err); return { data: [] }; }),
        adminAPI.getInventory().catch(err => { console.error(err); return { data: [] }; }),
      ]);
      
      const ordersData = ordersRes?.data || [];
      const productsData = productsRes?.data || [];

      // Resolve category for order items dynamically using inventory data
      const mappedOrders = ordersData.map((order: any) => {
        if (order.items && Array.isArray(order.items)) {
          const items = order.items.map((item: any) => {
            const prod = productsData.find((p: any) => p.id === item.productId || p._id === item.productId);
            return {
              ...item,
              category: prod?.category || item.category || 'General'
            };
          });
          return {
            ...order,
            items
          };
        }
        return order;
      });

      setOrders(mappedOrders);

      if (statsRes?.data) {
        setStats(statsRes.data);
      } else {
        // Same revenue logic as dashboard: online orders must be confirmed/processing/shipped/delivered
        const isOrderRevenue = (o: any) => {
          const isOnline = ['card', 'easypaisa', 'jazzcash'].includes(o.paymentMethod);
          if (isOnline) {
            return ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status);
          }
          return o.status === 'delivered';
        };

        const totalRevenue = mappedOrders
          .filter(isOrderRevenue)
          .reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0);
        // Exclude cancelled/refunded so: completedOrders + pendingOrders = totalOrders always
        const activeOrders = mappedOrders.filter((o: any) =>
          o.status !== 'cancelled' && o.status !== 'refunded'
        );
        const totalOrders = activeOrders.length;
        const completedOrders = activeOrders.filter((o: any) => 
          o.status === 'delivered' || 
          (['card', 'easypaisa', 'jazzcash'].includes(o.paymentMethod) && 
            ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status))
        ).length;
        
        const pendingOrders = activeOrders.filter((o: any) => {
          if (['card', 'easypaisa', 'jazzcash'].includes(o.paymentMethod)) {
            return o.status === 'pending';
          }
          return ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status);
        }).length;

        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        setStats({
          totalRevenue,
          totalOrders,
          pendingOrders,
          completedOrders,
          averageOrderValue,
        });
      }
    } catch (error) {
      toast.error('Failed to load sales statistics');
    } finally {
      setLoading(false);
    }
  };

  // Generalized chart data grouping helper with order references preserved
  const getChartDataForView = (ordersList: any[], view: string) => {
    const isOrderRevenue = (o: any) => {
      const isOnline = ['card', 'easypaisa', 'jazzcash'].includes(o.paymentMethod);
      if (isOnline) {
        return o.status !== 'cancelled' && o.status !== 'refunded';
      }
      return o.status === 'delivered';
    };

    const deliveredOrders = ordersList.filter(isOrderRevenue);

    if (view === 'daily') {
      // Last 15 Days
      const list = Array.from({ length: 15 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (14 - i));
        return d;
      });

      const chartPoints = list.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        const dayOrders = deliveredOrders.filter((o: any) => o.createdAt && o.createdAt.startsWith(dateStr));
        const amount = dayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0);
        return {
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullLabel: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
          amount,
          orders: dayOrders
        };
      });

      const maxAmount = Math.max(...chartPoints.map(p => p.amount), 1);
      return chartPoints.map(p => ({ ...p, percentage: (p.amount / maxAmount) * 100 }));

    } else if (view === 'weekly') {
      // Last 8 Weeks
      const chartPoints = Array.from({ length: 8 }).map((_, idx) => {
        const d = new Date();
        d.setDate(d.getDate() - (7 - idx) * 7);
        
        const start = new Date(d);
        start.setDate(start.getDate() - start.getDay()); // Sunday
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(start);
        end.setDate(end.getDate() + 6); // Saturday
        end.setHours(23, 59, 59, 999);

        const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const weekOrders = deliveredOrders.filter((o: any) => {
          if (!o.createdAt) return false;
          const oDate = new Date(o.createdAt);
          return oDate >= start && oDate <= end;
        });

        const amount = weekOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0);

        return {
          label: `W${idx + 1}`,
          fullLabel: `${startStr} - ${endStr}`,
          amount,
          orders: weekOrders
        };
      });

      const maxAmount = Math.max(...chartPoints.map(p => p.amount), 1);
      return chartPoints.map(p => ({ ...p, percentage: (p.amount / maxAmount) * 100 }));

    } else {
      // Monthly, 6 Months, 1 Year
      let monthsCount = 12;
      if (view === '6months') {
        monthsCount = 6;
      } else if (view === '1year') {
        monthsCount = 12;
      } else if (view === 'monthly') {
        monthsCount = 12;
      }

      const list = Array.from({ length: monthsCount }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (monthsCount - 1 - i));
        return d;
      });

      const chartPoints = list.map(date => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const monthStr = `${year}-${month}`;
        
        const monthOrders = deliveredOrders.filter((o: any) => o.createdAt && o.createdAt.startsWith(monthStr));
        const amount = monthOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0);
        return {
          label: date.toLocaleDateString('en-US', { month: 'short' }),
          fullLabel: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          amount,
          orders: monthOrders
        };
      });

      const maxAmount = Math.max(...chartPoints.map(p => p.amount), 1);
      return chartPoints.map(p => ({ ...p, percentage: (p.amount / maxAmount) * 100 }));
    }
  };

  // Get subset of orders belonging to the selected period range
  const getOrdersInPeriod = (ordersList: any[], period: string) => {
    const now = new Date();
    let cutoff = new Date();

    if (period === 'daily') {
      cutoff.setDate(now.getDate() - 15);
    } else if (period === 'weekly') {
      cutoff.setDate(now.getDate() - 56); // 8 weeks
    } else if (period === '6months') {
      cutoff.setMonth(now.getMonth() - 6);
    } else {
      // monthly & 1year
      cutoff.setMonth(now.getMonth() - 12);
    }

    return ordersList.filter((o: any) => {
      if (!o.createdAt) return false;
      return new Date(o.createdAt) >= cutoff;
    });
  };

  // Get subset of orders belonging to the previous period of equal duration
  const getOrdersInPreviousPeriod = (ordersList: any[], period: string) => {
    const now = new Date();
    let startCutoff = new Date();
    let endCutoff = new Date();

    if (period === 'daily') {
      startCutoff.setDate(now.getDate() - 30);
      endCutoff.setDate(now.getDate() - 15);
    } else if (period === 'weekly') {
      startCutoff.setDate(now.getDate() - 112);
      endCutoff.setDate(now.getDate() - 56);
    } else if (period === '6months') {
      startCutoff.setMonth(now.getMonth() - 12);
      endCutoff.setMonth(now.getMonth() - 6);
    } else {
      startCutoff.setMonth(now.getMonth() - 24);
      endCutoff.setMonth(now.getMonth() - 12);
    }

    return ordersList.filter((o: any) => {
      if (!o.createdAt) return false;
      const orderDate = new Date(o.createdAt);
      return orderDate >= startCutoff && orderDate < endCutoff;
    });
  };

  const calculateTrend = (currentValue: number, previousValue: number) => {
    if (previousValue === 0) {
      return currentValue > 0 ? { trend: '+100%', isUp: true } : { trend: '0%', isUp: true };
    }
    const pct = ((currentValue - previousValue) / previousValue) * 100;
    const isUp = pct >= 0;
    const formatted = `${isUp ? '+' : ''}${pct.toFixed(1)}%`;
    return { trend: formatted, isUp };
  };

  const getCategoryData = (ordersList: any[]) => {
    // Same revenue logic as dashboard
    const isRevOrder = (o: any) => {
      const isOnline = ['card', 'easypaisa', 'jazzcash'].includes(o.paymentMethod);
      if (isOnline) return ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status);
      return o.status === 'delivered';
    };

    const revenueOrders = ordersList.filter(isRevOrder);
    const categoryTotals: Record<string, { totalAmount: number; unitsSold: number }> = {};
    let grandTotal = 0;

    revenueOrders.forEach((o: any) => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item: any) => {
          const category = item.category || 'General';
          const qty = Number(item.quantity || 1);
          const price = Number(item.price || 0);
          const total = price * qty;
          
          if (!categoryTotals[category]) {
            categoryTotals[category] = { totalAmount: 0, unitsSold: 0 };
          }
          categoryTotals[category].totalAmount += total;
          categoryTotals[category].unitsSold += qty;
          grandTotal += total;
        });
      }
    });

    if (grandTotal === 0) grandTotal = 1;

    // Hardcoded hex colors — safe for Tailwind purge, always rendered correctly
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#84cc16'];

    const results = Object.entries(categoryTotals).map(([name, data], idx) => {
      const rawPercent = (data.totalAmount / grandTotal) * 100;
      const percent = Number.isInteger(rawPercent) ? rawPercent.toString() : rawPercent.toFixed(1);
      return { 
        name, 
        amount: data.totalAmount, 
        unitsSold: data.unitsSold,
        percent, 
        rawPercent,
        color: colors[idx % colors.length] 
      };
    });

    return results.sort((a, b) => b.amount - a.amount).slice(0, 7);
  };

  // Perform dynamic calculations for selected period
  const ordersInPeriod = getOrdersInPeriod(orders, revenuePeriod);
  
  // Same revenue logic as dashboard: online orders must be confirmed/processing/shipped/delivered
  const isOrderRevenue = (o: any) => {
    const isOnline = ['card', 'easypaisa', 'jazzcash'].includes(o.paymentMethod);
    if (isOnline) {
      return ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status);
    }
    return o.status === 'delivered';
  };

  const periodRevenue = ordersInPeriod
    .filter(isOrderRevenue)
    .reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0);

  // Always compare last complete calendar month vs the month before it
  // This ensures there is always real data to compare against regardless of selected window
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfMonthBefore = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  const lastMonthOrders = orders.filter((o: any) => {
    if (!o.createdAt) return false;
    const d = new Date(o.createdAt);
    return d >= startOfLastMonth && d < startOfThisMonth;
  });
  const monthBeforeOrders = orders.filter((o: any) => {
    if (!o.createdAt) return false;
    const d = new Date(o.createdAt);
    return d >= startOfMonthBefore && d < startOfLastMonth;
  });

  const lastMonthRevenue = lastMonthOrders.filter(isOrderRevenue)
    .reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0);
  const monthBeforeRevenue = monthBeforeOrders.filter(isOrderRevenue)
    .reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0);
  const revenueTrend = calculateTrend(lastMonthRevenue, monthBeforeRevenue);

  // For the trend badge on Total Revenue card: compare current period vs previous period
  // But always show last month revenue as the "previous" reference so it makes visual sense
  const previousPeriodRevenue = lastMonthRevenue;

  // AOV comparison: last month vs month before
  const lastMonthActiveOrders = lastMonthOrders.filter((o: any) =>
    o.status !== 'cancelled' && o.status !== 'refunded'
  );
  const monthBeforeActiveOrders = monthBeforeOrders.filter((o: any) =>
    o.status !== 'cancelled' && o.status !== 'refunded'
  );
  const lastMonthAOV = lastMonthActiveOrders.length > 0
    ? lastMonthOrders.filter(isOrderRevenue).reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0) / lastMonthActiveOrders.length
    : 0;
  const monthBeforeAOV = monthBeforeActiveOrders.length > 0
    ? monthBeforeOrders.filter(isOrderRevenue).reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0) / monthBeforeActiveOrders.length
    : 0;
  const previousPeriodAOV = lastMonthAOV;

  // Exclude cancelled/refunded: completedOrders + pendingOrders must always = totalOrders
  const activeOrdersInPeriod = ordersInPeriod.filter((o: any) =>
    o.status !== 'cancelled' && o.status !== 'refunded'
  );
  const periodOrdersCount = activeOrdersInPeriod.length;

  const periodCompleted = activeOrdersInPeriod.filter((o: any) => 
    o.status === 'delivered' || 
    (['card', 'easypaisa', 'jazzcash'].includes(o.paymentMethod) && 
      ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status))
  ).length;

  const periodPending = activeOrdersInPeriod.filter((o: any) => {
    if (['card', 'easypaisa', 'jazzcash'].includes(o.paymentMethod)) {
      return o.status === 'pending';
    }
    return ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status);
  }).length;
  const periodAOV = periodOrdersCount > 0 ? periodRevenue / periodOrdersCount : 0;
  // Now compute AOV trend with the previous month's AOV as baseline
  const aovTrend = calculateTrend(periodAOV, previousPeriodAOV);

  const chartData = getChartDataForView(orders, revenuePeriod);
  const categoryData = getCategoryData(ordersInPeriod);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sales & Revenue</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Detailed analytics and revenue tracking across all stores.</p>
        </div>
        <button 
          onClick={fetchStats}
          disabled={loading}
          className={`flex items-center justify-center px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all font-medium text-gray-700 dark:text-gray-300 shadow-sm ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95'
          }`}
        >
          <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh Stats'}
        </button>
      </div>

      {/* Revenue Insight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

        {/* Total Revenue */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-5 shadow-lg hover:border-emerald-500/40 hover:shadow-emerald-500/10 transition-all duration-300 group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
              <Banknote className="w-4 h-4 text-emerald-400" />
            </div>
            <div className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              revenueTrend.isUp
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
            }`}>
              {revenueTrend.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {revenueTrend.trend}
            </div>
          </div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-2xl font-extrabold text-emerald-400 tracking-tight leading-none">Rs. {periodRevenue.toLocaleString()}</p>
        </div>

        {/* Total Orders */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-5 shadow-lg hover:border-indigo-500/40 hover:shadow-indigo-500/10 transition-all duration-300 group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/25 rounded-xl">
              <ShoppingBag className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
              {revenuePeriod === 'daily' ? '15 Days' : revenuePeriod === 'weekly' ? '8 Weeks' : revenuePeriod === '6months' ? '6 Months' : revenuePeriod === '1year' ? '1 Year' : '12 Months'}
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Total Orders</p>
          <p className="text-2xl font-extrabold text-indigo-400 tracking-tight leading-none mb-4">{periodOrdersCount}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Delivered</p>
              <p className="text-base font-black text-emerald-400 mt-0.5">{periodCompleted}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Pending</p>
              <p className="text-base font-black text-amber-400 mt-0.5">{periodPending}</p>
            </div>
          </div>
        </div>

        {/* Avg. Order Value */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 p-5 shadow-lg hover:border-amber-500/40 hover:shadow-amber-500/10 transition-all duration-300 group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-amber-500/10 border border-amber-500/25 rounded-xl">
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Avg. Order Value</p>
          <p className="text-2xl font-extrabold text-amber-400 tracking-tight leading-none">Rs. {periodAOV.toFixed(2)}</p>
        </div>

      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
           <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <BarChart className="w-5 h-5 mr-3 text-primary-500" />
                Revenue Growth
              </h3>
              <select 
                value={revenuePeriod}
                onChange={(e) => {
                  setRevenuePeriod(e.target.value);
                  setSelectedChartPoint(null);
                }}
                className="bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold border-none outline-none cursor-pointer text-gray-700 dark:text-gray-300"
              >
                 <option value="daily">Daily (Last 15 Days)</option>
                 <option value="weekly">Weekly (Last 8 Weeks)</option>
                 <option value="monthly">Monthly (Last 12 Months)</option>
                 <option value="6months">6 Months</option>
                 <option value="1year">1 Year</option>
              </select>
           </div>
           <div className="h-64 flex items-end justify-between space-x-2 px-2 pb-6">
              {chartData.map((data, i) => (
                <div key={i} className="flex-1 group relative h-full flex flex-col justify-end">
                  <div 
                    onClick={() => setSelectedChartPoint(data)}
                    className={`w-full rounded-full transition-all duration-500 ease-out cursor-pointer hover:scale-110 relative ${
                      selectedChartPoint?.label === data.label 
                        ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.6)] border-2 border-white dark:border-gray-900 scale-105' 
                        : 'bg-indigo-500/10 dark:bg-indigo-500/5 group-hover:bg-gradient-to-t group-hover:from-indigo-600 group-hover:to-indigo-400 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]'
                    }`}
                    style={{ height: `${Math.max(data.percentage, 5)}%` }}
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent to-white/10 rounded-full"></div>
                    
                    {/* Tooltip */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold py-1.5 px-3 rounded-lg shadow-xl z-20 pointer-events-none whitespace-nowrap">
                       Rs. {data.amount.toLocaleString()}
                       <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-white rotate-45"></div>
                    </div>
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-60 group-hover:opacity-100 group-hover:text-primary-600 transition-all whitespace-nowrap text-[9px] font-bold text-gray-400">
                    {data.label}
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Categories / Distribution */}
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
           <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <PieChart className="w-5 h-5 mr-3 text-indigo-500" />
                Sales by Category
              </h3>
           </div>
           <div className="space-y-4">
              {categoryData.length > 0 ? (
                categoryData.map((cat, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-gray-400 font-medium">Rs. {cat.amount.toLocaleString()} ({cat.unitsSold} sold)</span>
                        <span className="font-bold text-gray-600 dark:text-gray-300 min-w-[42px] text-right">{cat.percent}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${cat.rawPercent}%`, backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}60` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-medium">
                  No sales category data for this period
                </div>
              )}
           </div>

        </div>
      </div>

      {/* Selected Period Orders Detailed List */}
      {selectedChartPoint && (
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Orders in {selectedChartPoint.fullLabel || selectedChartPoint.label}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Total Revenue: <span className="font-bold text-emerald-600">Rs. {selectedChartPoint.amount.toLocaleString()}</span> • {selectedChartPoint.orders.length} orders
              </p>
            </div>
            <button
              onClick={() => setSelectedChartPoint(null)}
              className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-650 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
            >
              Clear Selection
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Order ID</th>
                  <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</th>
                  <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Address</th>
                  <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Payment Method</th>
                  <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Amount</th>
                  <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedChartPoint.orders.length > 0 ? (
                  selectedChartPoint.orders.map((order: any) => (
                    <tr key={order.id} className="border-b border-gray-50 dark:border-gray-850 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="py-4 px-2 font-mono text-xs font-bold text-primary-600">
                        #{order.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="py-4 px-2 text-xs text-gray-650 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-4 px-2 text-xs text-gray-650 dark:text-gray-400 truncate max-w-[200px]">
                        {order.shippingAddress}, {order.city}
                      </td>
                      <td className="py-4 px-2 text-xs text-gray-650 dark:text-gray-400 capitalize">
                        {order.paymentMethod.replace(/_/g, ' ')}
                      </td>
                      <td className="py-4 px-2 text-xs font-bold text-gray-900 dark:text-white">
                        Rs. {Number(order.totalAmount).toLocaleString()}
                      </td>
                      <td className="py-4 px-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          order.status === 'delivered' 
                            ? 'bg-emerald-500/10 text-emerald-600' 
                            : order.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-600'
                            : order.status === 'cancelled'
                            ? 'bg-rose-500/10 text-rose-600'
                            : 'bg-blue-500/10 text-blue-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <button
                          onClick={() => router.push(`/orders/${order.id}`)}
                          className="px-3 py-1 bg-gray-50 hover:bg-primary-50 dark:bg-gray-800 dark:hover:bg-primary-950/20 text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 rounded-lg text-xs font-bold transition-all border border-gray-200 dark:border-gray-750 active:scale-95"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                      No orders found in this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
