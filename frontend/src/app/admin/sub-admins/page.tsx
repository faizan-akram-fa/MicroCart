'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Mail,
  Lock,
  User,
  CheckSquare,
  Square,
  Loader,
  AlertCircle,
  X,
  Edit2
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

const AVAILABLE_PERMISSIONS = [
  { id: 'MANAGE_USERS', name: 'User Management', desc: 'Access and manage user accounts, status, and password resets' },
  { id: 'MANAGE_ORDERS', name: 'Order Monitor', desc: 'Track and monitor system orders' },
  { id: 'MANAGE_SELLERS', name: 'Seller Approvals', desc: 'Review and approve/reject seller applications' },
  { id: 'VIEW_SALES', name: 'Sales Stats', desc: 'Access to sales analytics, charts, and metrics' },
  { id: 'VIEW_TRANSACTIONS', name: 'Transactions', desc: 'View transaction logs and financial records' },
  { id: 'VIEW_INVENTORY', name: 'Inventory', desc: 'Monitor product inventory and stock levels' },
  { id: 'VIEW_LOGS', name: 'System Logs', desc: 'Access system audit logs and activity logs' },
  { id: 'SEND_COMMUNICATIONS', name: 'Communications', desc: 'Send email campaigns and promotional communications' },
  { id: 'MANAGE_PROMOTIONS', name: 'Promotions', desc: 'Manage discount codes and promotional campaigns' },
  { id: 'MANAGE_REVIEWS', name: 'Reviews', desc: 'Moderate product ratings and customer reviews' },
  { id: 'MANAGE_SUPPORT', name: 'Support Center', desc: 'Manage customer and vendor support tickets' },
];

export default function SubAdminManagement() {
  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user: currentUser } = useAuthStore();
  const router = useRouter();
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+92 ',
    password: '',
    permissions: [] as string[],
  });

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      toast.error('Access Denied: Admins only');
      router.push('/admin/dashboard');
    }
  }, [currentUser, router]);

  useEffect(() => {
    fetchSubAdmins();
  }, []);

  const fetchSubAdmins = async () => {
    try {
      const res = await adminAPI.getAllUsers();
      // Filter for sub-admins only
      setSubAdmins(res.data.filter((u: any) => u.role === 'sub_admin'));
    } catch (error) {
      toast.error('Failed to load sub-admins');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(id => id !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith('+92 ')) value = '+92 ';
    const numberPart = value.substring(4).replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: '+92 ' + numberPart });
  };

  const handleEdit = (admin: any) => {
    setEditingAdmin(admin);
    setFormData({
      firstName: admin.firstName || '',
      lastName: admin.lastName || '',
      email: admin.email || '',
      phone: admin.phone || '+92 ',
      password: '', // Keep empty for security
      permissions: admin.permissions || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete sub-admin ${name}?`)) {
      try {
        await adminAPI.deleteSubAdmin(id);
        toast.success('Sub-Admin deleted successfully');
        fetchSubAdmins();
      } catch (error) {
        toast.error('Failed to delete sub-admin');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAdmin(null);
    setFormData({ firstName: '', lastName: '', email: '', phone: '+92 ', password: '', permissions: [] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.permissions.length === 0) {
      toast.error('Please select at least one permission');
      return;
    }

    if (formData.phone.length < 14) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      if (editingAdmin) {
        // Only include password if it's been changed
        const updateData = { ...formData };
        if (!updateData.password) delete (updateData as any).password;

        await adminAPI.updateSubAdmin(editingAdmin.id, updateData);
        toast.success('Sub-Admin updated successfully');
      } else {
        await adminAPI.createSubAdmin(formData);
        toast.success('Sub-Admin created successfully');
      }
      closeModal();
      fetchSubAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${editingAdmin ? 'update' : 'create'} sub-admin`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sub-Admins</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage administrative access and custom permissions.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all font-bold transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Sub-Admin
        </button>
      </div>

      {/* Sub-Admins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading && subAdmins.length === 0 ? (
          <div className="col-span-full py-20 flex justify-center">
            <Loader className="w-10 h-10 text-primary-600 animate-spin" />
          </div>
        ) : subAdmins.length > 0 ? subAdmins.map((admin) => (
          <div key={admin.id} className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button
                onClick={() => handleEdit(admin)}
                className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                title="Edit Sub-Admin"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(admin.id, `${admin.firstName} ${admin.lastName}`)}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                title="Delete Sub-Admin"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary-100 dark:border-primary-900 shadow-md">
                <img src={admin.profileImage} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{admin.firstName} {admin.lastName}</h3>
                <p className="text-sm text-gray-500">{admin.email}</p>
                <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-1">{admin.phone}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Permissions</p>
              <div className="flex flex-wrap gap-2">
                {admin.permissions && admin.permissions.length > 0 ? admin.permissions.map((perm: string) => (
                  <span key={perm} className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-[10px] font-bold rounded-lg uppercase tracking-tighter border border-primary-100 dark:border-primary-800">
                    {perm.replace('_', ' ')}
                  </span>
                )) : <span className="text-xs italic text-gray-400">No permissions assigned</span>}
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 text-center">
            <ShieldCheck className="w-12 h-12 text-gray-100 dark:text-gray-800 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No sub-admins found.</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{editingAdmin ? 'Edit Sub-Admin' : 'New Sub-Admin'}</h2>
                <p className="text-sm text-gray-500 mt-1">{editingAdmin ? 'Update administrative account and access rights.' : 'Setup administrative account and access rights.'}</p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all shadow-sm"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-8 space-y-8 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 px-1">First Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text" required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none text-sm shadow-inner"
                        placeholder="first name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 px-1">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text" required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none text-sm shadow-inner"
                        placeholder="last name"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 px-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email" required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none text-sm shadow-inner"
                        placeholder="admin@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 px-1">Phone Number</label>
                    <div className="relative">
                      <input
                        type="tel" required
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none text-sm shadow-inner"
                        placeholder="+92 310 5143036"
                        maxLength={14}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 px-1">Account Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="password" required={!editingAdmin}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none text-sm shadow-inner"
                        placeholder={editingAdmin ? "•••••••• (Leave blank to keep current)" : "••••••••"}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2 px-1">
                    <ShieldCheck className="w-5 h-5 text-primary-600" />
                    <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Access Permissions</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {AVAILABLE_PERMISSIONS.map((perm) => (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => togglePermission(perm.id)}
                        className={`flex items-start text-left p-4 rounded-2xl border transition-all duration-200 ${formData.permissions.includes(perm.id)
                            ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800 ring-2 ring-primary-500/10'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-60'
                          }`}
                      >
                        <div className="mt-0.5 mr-3">
                          {formData.permissions.includes(perm.id) ? (
                            <CheckSquare className="w-5 h-5 text-primary-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{perm.name}</p>
                          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">{perm.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/10">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary-600 text-white rounded-2xl shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all font-bold text-lg flex items-center justify-center disabled:opacity-50"
                >
                  {loading ? <Loader className="w-6 h-6 animate-spin" /> : editingAdmin ? 'Update Sub-Admin Account' : 'Create Sub-Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
