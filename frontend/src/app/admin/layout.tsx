'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  FileText,
  Package,
  Home,
  ChevronRight,
  User,
  Settings as SettingsIcon,
  Bell,
  Clock,
  UserPlus,
  UserX,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  Send,
  Truck,
  Tag,
  MessageSquare,
  CreditCard,
  Sun,
  Moon,
  Activity,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '@/components/ThemeProvider';

const sidebarItems = [
  { name: 'Overview', href: '/admin/dashboard', icon: Home },
  { name: 'Order Monitor', href: '/admin/orders', icon: Truck, requiredPermission: 'MANAGE_ORDERS' },
  { name: 'User Management', href: '/admin/users', icon: Users, requiredPermission: 'MANAGE_USERS' },
  { name: 'Seller Approvals', href: '/admin/approvals', icon: Users, requiredPermission: 'MANAGE_SELLERS' },
  { name: 'Sales Stats', href: '/admin/sales', icon: BarChart3, requiredPermission: 'VIEW_SALES' },
  { name: 'Transactions', href: '/admin/transactions', icon: CreditCard, requiredPermission: 'VIEW_TRANSACTIONS' },
  { name: 'Inventory', href: '/admin/inventory', icon: Package, requiredPermission: 'VIEW_INVENTORY' },
  { name: 'Sub-Admins', href: '/admin/sub-admins', icon: ShieldCheck, adminOnly: true },
  { name: 'System Logs', href: '/admin/logs', icon: FileText, requiredPermission: 'VIEW_LOGS' },
  { name: 'Live Monitoring ↗', href: 'http://localhost:3010/d/microcart-monitoring', icon: Activity, isExternal: true, requiredPermission: 'VIEW_LOGS' },
  { name: 'Communications', href: '/admin/communications', icon: Send, requiredPermission: 'SEND_COMMUNICATIONS' },
  { name: 'Promotions', href: '/admin/promotions', icon: Tag, requiredPermission: 'MANAGE_PROMOTIONS' },
  { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare, requiredPermission: 'MANAGE_REVIEWS' },
  { name: 'Support Center', href: '/admin/support', icon: MessageSquare, requiredPermission: 'MANAGE_SUPPORT' },
  { name: 'System Settings', href: '/admin/settings', icon: SettingsIcon },
  { name: 'Back to Store', href: '/', icon: ShoppingBag },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [pendingSellersCount, setPendingSellersCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const fetchNotifications = async () => {
    try {
      const res = await adminAPI.getActivityLogs();
      const logs = res.data.slice(0, 10);
      
      // If we have more logs than before, mark as unread
      if (logs.length > 0 && notifications.length > 0 && logs[0].id !== notifications[0].id) {
        setHasUnread(true);
      }
      
      setNotifications(logs);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchPendingSellers = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'sub_admin')) return;
    if (user.role === 'sub_admin' && !user.permissions?.includes('MANAGE_SELLERS')) return;
    
    try {
      const res = await adminAPI.getPendingSellers();
      if (res.data && res.data.length > 0) {
        setPendingSellersCount(res.data.length);
        
        // Only show toast on initial load when moving from 0
        if (pendingSellersCount === 0) {
          toast.custom((t) => (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 flex items-start gap-4 animate-fade-in-up">
              <div className="bg-rose-50 dark:bg-rose-900/30 p-3 rounded-full flex-shrink-0">
                <Users className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">New Pending Sellers</h3>
                <p className="text-sm text-gray-500 mt-1">There are {res.data.length} new seller registration(s) waiting for your review.</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { toast.dismiss(t.id); router.push('/admin/approvals'); }} className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-sm">Review Now</button>
                  <button onClick={() => toast.dismiss(t.id)} className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold text-xs py-2 px-4 rounded-lg shadow-sm">Dismiss</button>
                </div>
              </div>
            </div>
          ), { id: 'pending-sellers-toast', duration: 8000, position: 'bottom-right' });
        }
      } else {
        setPendingSellersCount(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchNotifications();

    fetchPendingSellers();

    // Polling for new notifications every 60 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchPendingSellers();
    }, 60000);
    
    // Close dropdowns on click outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.profile-dropdown-container')) setIsProfileOpen(false);
      if (!target.closest('.notifications-dropdown-container')) setIsNotificationsOpen(false);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('refreshPendingSellers', fetchPendingSellers);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('refreshPendingSellers', fetchPendingSellers);
      clearInterval(interval);
    };
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE_SUB_ADMIN': return <UserPlus className="w-4 h-4 text-emerald-500" />;
      case 'UPDATE_SUB_ADMIN': return <SettingsIcon className="w-4 h-4 text-blue-500" />;
      case 'DELETE_SUB_ADMIN': return <Trash2 className="w-4 h-4 text-rose-500" />;
      case 'BLOCK_USER': return <UserX className="w-4 h-4 text-rose-600" />;
      case 'ACTIVATE_USER': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default: return <ShieldAlert className="w-4 h-4 text-amber-500" />;
    }
  };

  useEffect(() => {
    if (!mounted || !user) return;

    // Basic security check: Redirect if not admin or sub_admin
    if (user.role !== 'admin' && user.role !== 'sub_admin') {
      toast.error('Unauthorized access');
      router.push('/');
      return;
    }

    // Permission check for sub-admins
    if (user.role === 'sub_admin') {
      const currentItem = sidebarItems.find(item => item.href === pathname);
      
      if (currentItem) {
        if (currentItem.adminOnly) {
          toast.error('Only primary Admin can access this page');
          router.push('/admin/dashboard');
          return;
        }

        if (currentItem.requiredPermission && !user.permissions?.includes(currentItem.requiredPermission)) {
          toast.error(`You don't have permission to access ${currentItem.name}`);
          router.push('/admin/dashboard');
          return;
        }
      }
    }
  }, [user, router, mounted, pathname]);

  const handleLogout = () => {
    logout();
    router.push('/login');
    toast.success('Logged out from Admin Panel');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors duration-300">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out z-50 fixed inset-y-0`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          {isSidebarOpen ? (
            <Link href="/admin/dashboard" className="flex items-center animate-fade-in">
              <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-750 flex items-center justify-center">
                <img src="/logo.png" alt="Microcart" className="h-9 w-auto object-contain" />
              </div>
            </Link>
          ) : (
            <div className="mx-auto">
              <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-750 flex items-center justify-center">
                <img src="/logo.png" alt="Microcart" className="h-7 w-auto object-contain" />
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-1 overflow-y-auto">
          {sidebarItems
            .filter((item) => {
              if (user?.role === 'admin') return true;
              if (user?.role === 'sub_admin') {
                if (item.adminOnly) return false;
                if (!item.requiredPermission) return true;
                return user.permissions?.includes(item.requiredPermission);
              }
              return false;
            })
            .map((item) => {
              const isActive = pathname === item.href;
              if ((item as any).isExternal) {
                const targetHref = item.name.includes('Live Monitoring')
                  ? (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && window.location.hostname !== '127.0.0.1'
                      ? `${window.location.protocol}//${window.location.hostname}/grafana/d/microcart-monitoring`
                      : 'http://localhost:3010/d/microcart-monitoring')
                  : item.href;
                return (
                  <a
                    key={item.href}
                    href={targetHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 rounded-xl transition-all duration-200 group text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-bold"
                  >
                    <item.icon className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                    {isSidebarOpen && (
                      <div className="flex items-center flex-1 justify-between">
                        <span className="animate-fade-in">{item.name}</span>
                      </div>
                    )}
                  </a>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center p-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                  {isSidebarOpen && (
                    <div className="flex items-center flex-1 justify-between">
                      <span className="font-medium animate-fade-in">{item.name}</span>
                      {item.name === 'Seller Approvals' && pendingSellersCount > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                          {pendingSellersCount}
                        </span>
                      )}
                    </div>
                  )}
                  {isSidebarOpen && isActive && item.name !== 'Seller Approvals' && (
                    <ChevronRight className="ml-auto w-4 h-4 opacity-50" />
                  )}
                </Link>
              );
            })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="h-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 sticky top-0 z-40">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-4 sm:space-x-6">
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm flex items-center justify-center active:scale-95"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400 animate-spin-once" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600 animate-spin-once" />
              )}
            </button>

            <div className="relative notifications-dropdown-container">
              <button 
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setHasUnread(false);
                }}
                className={`p-2 rounded-lg transition-all duration-300 relative ${
                  isNotificationsOpen ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
                }`}
              >
                <Bell className="w-5 h-5" />
                {hasUnread && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-950 animate-pulse"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-slide-up backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 z-50">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-white">System Notifications</h3>
                    <button 
                      onClick={() => setNotifications([])}
                      className="text-[10px] font-bold text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map((log, i) => (
                        <div 
                          key={log.id || i}
                          className="p-4 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                        >
                          <div className="flex space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                              {getActionIcon(log.action)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 leading-relaxed">
                                {log.details}
                              </p>
                              <div className="flex items-center mt-1 space-x-2">
                                <span className="text-[10px] font-black text-primary-500 uppercase tracking-tighter">
                                  {log.action.replace('_', ' ')}
                                </span>
                                <span className="text-[10px] text-gray-400 flex items-center">
                                  <Clock className="w-2.5 h-2.5 mr-1" />
                                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center">
                        <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Bell className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">No new notifications</p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 text-center border-t border-gray-100 dark:border-gray-800">
                    <Link 
                      href="/admin/logs" 
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-xs font-bold text-gray-500 hover:text-primary-600 transition-colors"
                    >
                      View All System Logs
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="relative profile-dropdown-container">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 group outline-none"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-primary-500/30 group-hover:border-primary-500 p-0.5 overflow-hidden shadow-lg transition-all duration-300 transform group-active:scale-95">
                  <img 
                    src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.firstName}`} 
                    alt="Avatar" 
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-slide-up backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 z-50">
                  <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  
                  <div className="p-2">
                    <Link 
                      href="/profile" 
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center space-x-3 p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">Edit Profile</span>
                    </Link>
                    
                    <Link 
                      href="/admin/settings" 
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center space-x-3 p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">System Settings</span>
                    </Link>

                    <button
                      onClick={toggleTheme}
                      className="w-full flex items-center justify-between p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                        <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                        {theme}
                      </span>
                    </button>
                  </div>

                  <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 p-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-bold">Logout Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 animate-fade-in-up">
          {children}
        </div>
      </main>
    </div>
  );
}
