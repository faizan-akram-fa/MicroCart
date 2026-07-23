'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShoppingBag,
  Store,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Mail,
  Calendar,
  Loader,
  RefreshCcw,
  Ban,
  ShieldCheck,
  Copy,
  ExternalLink,
  User as UserIcon,
  Eye,
  X,
  Trash2
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [resetUser, setResetUser] = useState<any | null>(null);
  const [customPassword, setCustomPassword] = useState('');
  const [viewUser, setViewUser] = useState<any | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAllUsers();
      setUsers(res.data);
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = !user.isActive;
    try {
      await adminAPI.updateUserStatus(user.id, newStatus);
      toast.success(`User ${user.email} ${newStatus ? 'activated' : 'blocked'} successfully`);
      // Update local state (if restored, clear isDeleted tag)
      setUsers(users.map(u => u.id === user.id ? { ...u, isActive: newStatus, isDeleted: newStatus ? false : u.isDeleted } : u));
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userToDelete: any) => {
    if (currentUser?.role !== 'admin') {
      toast.error('Only Primary Super Admin has permission to delete user accounts');
      return;
    }

    if (userToDelete.role === 'admin') {
      toast.error('Primary Super Admin account cannot be deleted');
      return;
    }

    if (!confirm(`Are you sure you want to delete user ${userToDelete.email}? Their status will be set to inactive with "Deleted by Admin" tag.`)) {
      return;
    }

    const loadingToast = toast.loading('Deleting user account...');
    try {
      await adminAPI.deleteUser(userToDelete.id);
      toast.success(`User ${userToDelete.email} marked as deleted`, { id: loadingToast });
      setUsers(users.map(u => u.id === userToDelete.id ? { ...u, isActive: false, isDeleted: true, deletedBy: currentUser?.email || 'Admin' } : u));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user', { id: loadingToast });
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;

    const loadingToast = toast.loading('Resetting password...');
    try {
      const res = await adminAPI.resetUserPassword(resetUser.id, customPassword);
      toast.success(res.data.message || 'Password reset successfully. Email sent.', { id: loadingToast });
      setResetUser(null);
      setCustomPassword('');
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || 'Failed to reset password';
      toast.error(message, { id: loadingToast });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('User ID copied to clipboard');
    setOpenMenuId(null);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesCategory = true;
    if (filterRole === 'all') {
      matchesCategory = true;
    } else if (filterRole === 'active') {
      matchesCategory = user.isActive !== false && !user.isDeleted;
    } else if (filterRole === 'blocked') {
      matchesCategory = user.isActive === false && !user.isDeleted;
    } else if (filterRole === 'deleted') {
      matchesCategory = user.isDeleted === true;
    } else {
      matchesCategory = user.role === filterRole;
    }

    return matchesSearch && matchesCategory;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <ShieldCheck className="w-4 h-4 text-rose-500" />;
      case 'sub_admin': return <Shield className="w-4 h-4 text-indigo-500" />;
      case 'seller': return <Store className="w-4 h-4 text-purple-500" />;
      default: return <ShoppingBag className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Oversee, search, and manage all accounts in the system.</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center justify-center px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium text-gray-700 dark:text-gray-300 shadow-sm"
        >
          <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {/* Overview Metrics Cards (Compact Dark Glassmorphism - 5 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Users */}
        <div 
          onClick={() => setFilterRole('all')}
          className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-4 shadow-lg transition-all cursor-pointer group ${
            filterRole === 'all' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-indigo-500/20 hover:border-indigo-500/40'
          }`}
        >
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-indigo-500/8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/25 rounded-xl">
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Total
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Total Users</p>
          <p className="text-2xl font-extrabold text-indigo-400 tracking-tight leading-none mb-1">{users.length}</p>
          <p className="text-[10px] text-slate-500 truncate">Click to show all</p>
        </div>

        {/* Total Active Users */}
        <div 
          onClick={() => setFilterRole('active')}
          className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-4 shadow-lg transition-all cursor-pointer group ${
            filterRole === 'active' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-emerald-500/20 hover:border-emerald-500/40'
          }`}
        >
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-emerald-500/8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Active
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Active Users</p>
          <p className="text-2xl font-extrabold text-emerald-400 tracking-tight leading-none mb-1">
            {users.filter(u => u.isActive !== false && !u.isDeleted).length}
          </p>
          <p className="text-[10px] text-emerald-400/80 font-medium truncate">Click to filter active</p>
        </div>

        {/* Total Blocked Users */}
        <div 
          onClick={() => setFilterRole('blocked')}
          className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 p-4 shadow-lg transition-all cursor-pointer group ${
            filterRole === 'blocked' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-rose-500/20 hover:border-rose-500/40'
          }`}
        >
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-rose-500/8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-rose-500/10 border border-rose-500/25 rounded-xl">
              <Ban className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Blocked
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Blocked / Inactive</p>
          <p className="text-2xl font-extrabold text-rose-400 tracking-tight leading-none mb-1">
            {users.filter(u => u.isActive === false && !u.isDeleted).length}
          </p>
          <p className="text-[10px] text-rose-400/80 font-medium truncate">Click to filter blocked</p>
        </div>

        {/* Sub-Admins Count Card */}
        <div 
          onClick={() => setFilterRole('sub_admin')}
          className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 p-4 shadow-lg transition-all cursor-pointer group ${
            filterRole === 'sub_admin' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-amber-500/20 hover:border-amber-500/40'
          }`}
        >
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-amber-500/8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/25 rounded-xl">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Staff
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Sub-Admins</p>
          <p className="text-2xl font-extrabold text-amber-400 tracking-tight leading-none mb-1">
            {users.filter(u => u.role === 'sub_admin').length}
          </p>
          <p className="text-[10px] text-amber-400/80 font-medium truncate">Click to filter sub-admins</p>
        </div>

        {/* Sellers & Buyers Distribution */}
        <div 
          onClick={() => setFilterRole('seller')}
          className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/40 p-4 shadow-lg transition-all cursor-pointer group ${
            filterRole === 'seller' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-purple-500/20 hover:border-purple-500/40'
          }`}
        >
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-purple-500/8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-purple-500/10 border border-purple-500/25 rounded-xl">
              <Store className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Market
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Sellers / Buyers</p>
          <p className="text-2xl font-extrabold text-purple-400 tracking-tight leading-none mb-1">
            {users.filter(u => u.role === 'seller').length} / {users.filter(u => u.role === 'buyer').length}
          </p>
          <p className="text-[10px] text-purple-400/80 font-medium truncate">Click to filter sellers</p>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white transition-all shadow-inner"
          />
        </div>
        <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-2xl shadow-inner min-w-[240px]">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-transparent border-none outline-none text-gray-900 dark:text-white w-full font-medium cursor-pointer"
          >
            <option value="all" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold">All Accounts ({users.length})</option>
            
            <optgroup label="Account Roles" className="bg-white dark:bg-gray-900 text-gray-500 font-bold">
              <option value="admin" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Primary Admin</option>
              <option value="sub_admin" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Sub Admin ({users.filter(u => u.role === 'sub_admin').length})</option>
              <option value="seller" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Seller ({users.filter(u => u.role === 'seller').length})</option>
              <option value="buyer" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Buyer ({users.filter(u => u.role === 'buyer').length})</option>
            </optgroup>

            <optgroup label="Account Status" className="bg-white dark:bg-gray-900 text-gray-500 font-bold">
              <option value="active" className="bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 font-bold">Active Users ({users.filter(u => u.isActive !== false && !u.isDeleted).length})</option>
              <option value="blocked" className="bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400 font-bold">Blocked / Inactive Users ({users.filter(u => u.isActive === false && !u.isDeleted).length})</option>
              <option value="deleted" className="bg-white dark:bg-gray-900 text-gray-500 font-bold">Deleted Users ({users.filter(u => u.isDeleted).length})</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden min-h-[450px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">User</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Role</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Joined</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredUsers.map((user, i) => (
                <tr key={user.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-800 group-hover:border-primary-500 transition-colors">
                        <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Mail className="w-3 h-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3 py-1.5 rounded-xl w-fit">
                      {getRoleIcon(user.role)}
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tighter">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {user.isDeleted ? (
                      <div>
                        <div className="flex items-center text-rose-500 font-bold">
                          <XCircle className="w-4 h-4 mr-1.5" />
                          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/30">
                            Inactive
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold text-rose-500/80 dark:text-rose-400/80 mt-1">
                          Deleted by Admin
                        </p>
                      </div>
                    ) : (
                      <div className={`flex items-center transition-all duration-300 ${user.isActive ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {user.isActive ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <Ban className="w-5 h-5 mr-2" />}
                        <span className="text-sm font-bold uppercase tracking-widest text-[10px]">
                          {user.isActive ? 'Active' : 'Blocked'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right relative">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={user.role === 'admin'}
                        className={`p-2 rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${user.isActive
                            ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                          }`}
                        title={user.isActive ? 'Block User' : 'Restore / Activate User'}
                      >
                        {user.isActive ? <Ban className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                      </button>

                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === user.id ? null : user.id);
                          }}
                          className={`p-2 rounded-xl transition-all ${openMenuId === user.id ? 'bg-gray-100 dark:bg-gray-800 text-primary-600' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {openMenuId === user.id && (
                          <div className={`absolute right-0 w-48 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 z-[100] py-2 animate-slide-up-small ${filteredUsers.length > 2 && filteredUsers.length - i <= 2 ? 'bottom-full mb-2' : 'top-full mt-2'
                            }`}>
                            <button
                              onClick={() => copyToClipboard(user.id)}
                              className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center"
                            >
                              <Copy className="w-4 h-4 mr-3 text-gray-400" />
                              Copy User ID
                            </button>
                            <a
                              href={`mailto:${user.email}`}
                              className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center"
                            >
                              <Mail className="w-4 h-4 mr-3 text-gray-400" />
                              Send Email
                            </a>
                            <button
                              onClick={() => {
                                setResetUser(user);
                                setCustomPassword('');
                                setOpenMenuId(null);
                              }}
                              disabled={user.role === 'admin'}
                              className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center disabled:opacity-30"
                            >
                              <RefreshCcw className="w-4 h-4 mr-3 text-gray-400" />
                              Reset Password
                            </button>
                            <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                            <button
                              onClick={() => {
                                setViewUser(user);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center"
                            >
                              <Eye className="w-4 h-4 mr-3 text-gray-400" />
                              View Full Details
                            </button>

                            {/* Delete User (Super Admin Only) */}
                            {currentUser?.role === 'admin' && user.role !== 'admin' && (
                              <>
                                <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                                <button
                                  onClick={() => {
                                    handleDeleteUser(user);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2.5 text-left text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center"
                                >
                                  <Trash2 className="w-4 h-4 mr-3 text-rose-500" />
                                  Delete Account
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-6">
                <Users className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">No users found</p>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-xs mt-2">No accounts match your current search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>

      {resetUser && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/80 max-w-md w-full shadow-2xl animate-scale-up">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Reset Password</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">
              Reset password for <strong className="text-slate-700 dark:text-slate-200">{resetUser.firstName} {resetUser.lastName}</strong> ({resetUser.email}).
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                  Custom Password (Optional)
                </label>
                <input
                  type="text"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="Leave blank to auto-generate"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white font-medium transition-all"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                  If left blank, a secure random temporary password will be auto-generated and emailed to the user.
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetUser(null)}
                  className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary-500/20 active:scale-[0.98]"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewUser && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/80 max-w-2xl w-full shadow-2xl overflow-hidden animate-scale-up">

            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary-500 shadow-md">
                  <img src={viewUser.profileImage} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {viewUser.firstName} {viewUser.lastName}
                  </h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="px-2.5 py-0.5 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-primary-100 dark:border-primary-900">
                      {viewUser.role.replace('_', ' ')}
                    </span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-md ${viewUser.isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900'
                      }`}>
                      {viewUser.isActive ? 'Active' : 'Blocked'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewUser(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">

              {/* Grid: Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Personal Information */}
                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Personal Info</h3>
                  <div className="space-y-3.5">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewUser.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewUser.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Joined</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{new Date(viewUser.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Address Details</h3>
                  <div className="space-y-3.5">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Street Address</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewUser.address || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">City</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewUser.city || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zip Code</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewUser.zipCode || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">State</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewUser.state || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewUser.country || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Seller Information */}
              {viewUser.role === 'seller' && (
                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Seller Store Profile</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Store Name</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewUser.storeName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Store Type</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewUser.storeType || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Store Address</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewUser.storeAddress || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CNIC Number</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewUser.cnicNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seller Status</p>
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider mt-1 ${viewUser.sellerStatus === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          viewUser.sellerStatus === 'rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                            'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                        {viewUser.sellerStatus || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Admin Permissions */}
              {viewUser.role === 'sub_admin' && (
                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Assigned Access Rights</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewUser.permissions && viewUser.permissions.length > 0 ? (
                      viewUser.permissions.map((p: string) => (
                        <span key={p} className="px-3 py-1.5 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 text-[10px] font-bold rounded-lg uppercase tracking-tight border border-primary-100 dark:border-primary-900">
                          {p.replace('_', ' ')}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs italic text-slate-400">No custom permissions assigned</span>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-800/10 flex justify-end">
              <button
                onClick={() => setViewUser(null)}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl transition-all active:scale-[0.98]"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
