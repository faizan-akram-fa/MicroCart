'use client';

import { useState, useEffect, useRef } from 'react';
import { supportAPI, adminAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { 
  MessageSquare, HelpCircle, Send, Plus, Search, Edit2, Trash2, 
  User, CheckCircle2, X, Clock, Tag, ChevronDown, Check, 
  AlertTriangle, ShieldCheck, Shield, Store, Paperclip, Loader2, FileText, ChevronRight
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminSupportCenter() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'tickets' | 'faqs' | 'vendors'>('tickets');

  // Tickets State
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [recipientFilter, setRecipientFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Vendors State
  const [vendors, setVendors] = useState<any[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [creatingVendorChat, setCreatingVendorChat] = useState(false);

  // Attachments State
  const [chatAttachedUrls, setChatAttachedUrls] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Agents State (for assignment)
  const [agents, setAgents] = useState<any[]>([]);

  // FAQs State
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [faqModalMode, setFaqModalMode] = useState<'create' | 'edit'>('create');
  const [selectedFaq, setSelectedFaq] = useState<any | null>(null);
  
  // FAQ Form State
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('General');
  const [faqIsActive, setFaqIsActive] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTickets();
    fetchAgents();
    fetchFAQs();
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoadingVendors(true);
      const res = await adminAPI.getAllUsers();
      const sellerUsers = res.data.filter((u: any) => u.role === 'seller');
      setVendors(sellerUsers);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
      toast.error('Failed to load vendors');
    } finally {
      setLoadingVendors(false);
    }
  };

  const hasAutoSelectedVendorRef = useRef(false);

  const handleSelectVendor = async (vendor: any) => {
    setSelectedVendor(vendor);
    
    // Check if a direct chat ticket already exists between Admin and this Vendor
    const existingTicket = tickets.find(
      (t) => (t.sellerId === vendor.id || t.customerId === vendor.id)
    );

    if (existingTicket) {
      if (selectedTicket?.id !== existingTicket.id) {
        handleSelectTicket(existingTicket);
      }
    } else {
      // Create a new direct chat ticket
      setCreatingVendorChat(true);
      try {
        const res = await supportAPI.createTicket({
          subject: `Admin-Vendor Direct Chat`,
          description: `Direct contact chat channel between primary Admin and Vendor ${vendor.firstName} ${vendor.lastName} (${vendor.email}).`,
          recipient: 'vendor',
          category: 'general',
          priority: 'medium',
          sellerId: vendor.id,
        });
        
        toast.success(`Started new chat with ${vendor.firstName}`);
        
        const ticketsRes = await supportAPI.getTickets();
        const updatedTickets = ticketsRes.data || [];
        setTickets(updatedTickets);

        const newTicket = updatedTickets.find((t: any) => t.id === res.data.id) || res.data;
        handleSelectTicket(newTicket);
      } catch (err) {
        toast.error('Failed to start chat with vendor');
      } finally {
        setCreatingVendorChat(false);
      }
    }
  };

  // Automatically select/open vendor chat once when vendorId query param is present
  useEffect(() => {
    if (typeof window !== 'undefined' && vendors.length > 0 && !hasAutoSelectedVendorRef.current) {
      const params = new URLSearchParams(window.location.search);
      const vendorId = params.get('vendorId') || params.get('sellerId');
      if (vendorId) {
        const targetVendor = vendors.find((v: any) => v.id === vendorId);
        if (targetVendor) {
          hasAutoSelectedVendorRef.current = true;
          setActiveTab('vendors');
          handleSelectVendor(targetVendor);
        }
      }
    }
  }, [vendors, tickets]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await supportAPI.getTickets();
      setTickets(res.data || []);
    } catch (err) {
      toast.error('Failed to load support tickets');
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await adminAPI.getAllUsers();
      const adminUsers = res.data.filter((u: any) => u.role === 'admin' || u.role === 'sub_admin');
      setAgents(adminUsers);
    } catch (err) {
      console.error('Failed to fetch agents for assignment:', err);
    }
  };

  const fetchFAQs = async () => {
    try {
      setLoadingFaqs(true);
      const res = await supportAPI.getAdminFAQs();
      setFaqs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch FAQs:', err);
    } finally {
      setLoadingFaqs(false);
    }
  };

  const handleSelectTicket = async (ticket: any, skipLoader = false) => {
    if (!ticket) return;
    if (selectedTicket?.id === ticket.id && messages.length > 0) return;

    setSelectedTicket(ticket);
    if (!skipLoader) {
      setLoadingMessages(true);
    }
    setChatAttachedUrls([]);
    try {
      const res = await supportAPI.getTicketMessages(ticket.id);
      setMessages(res.data || []);
    } catch (err) {
      toast.error('Failed to load message history');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File exceeds limit of 5MB');
      return;
    }

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await supportAPI.uploadAttachment(formData);
      setChatAttachedUrls(prev => [...prev, res.data.url]);
      toast.success('File uploaded successfully!');
    } catch (err) {
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const removeAttachment = (index: number) => {
    setChatAttachedUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && chatAttachedUrls.length === 0) return;
    if (!selectedTicket) return;

    const msgText = newMessage;
    const urls = chatAttachedUrls;
    setNewMessage('');
    setChatAttachedUrls([]);

    try {
      const res = await supportAPI.sendTicketMessage(selectedTicket.id, {
        message: msgText || (urls.length > 0 ? 'Shared attachments' : ''),
        attachments: urls,
      });
      setMessages(prev => [...prev, res.data]);

      // If ticket is open, auto change to in_progress upon agent reply
      if (selectedTicket.status === 'open') {
        handleUpdateStatus(selectedTicket.id, 'in_progress');
      }
    } catch (err) {
      toast.error('Failed to send message');
      setNewMessage(msgText);
      setChatAttachedUrls(urls);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      await supportAPI.updateTicketStatus(ticketId, status);
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
      
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket((prev: any) => prev ? { ...prev, status } : null);
      }

      // Refresh list
      const ticketsRes = await supportAPI.getTickets();
      setTickets(ticketsRes.data || []);
    } catch (err) {
      toast.error('Failed to update ticket status');
    }
  };

  const handleAssignAgent = async (ticketId: string, agentId: string) => {
    try {
      await supportAPI.assignTicket(ticketId, agentId);
      toast.success('Agent assigned successfully');

      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket((prev: any) => prev ? { ...prev, assignedAgentId: agentId } : null);
      }

      // Refresh list
      const ticketsRes = await supportAPI.getTickets();
      setTickets(ticketsRes.data || []);
    } catch (err) {
      toast.error('Failed to assign agent');
    }
  };

  // FAQ CRUD handlers
  const handleOpenFaqModal = (mode: 'create' | 'edit', faq?: any) => {
    setFaqModalMode(mode);
    if (mode === 'edit' && faq) {
      setSelectedFaq(faq);
      setFaqQuestion(faq.question);
      setFaqAnswer(faq.answer);
      setFaqCategory(faq.category);
      setFaqIsActive(faq.isActive);
    } else {
      setSelectedFaq(null);
      setFaqQuestion('');
      setFaqAnswer('');
      setFaqCategory('General');
      setFaqIsActive(true);
    }
    setIsFaqModalOpen(true);
  };

  const handleSaveFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      toast.error('Please enter question and answer');
      return;
    }

    const payload = {
      question: faqQuestion,
      answer: faqAnswer,
      category: faqCategory,
      isActive: faqIsActive,
    };

    try {
      if (faqModalMode === 'create') {
        await supportAPI.createFAQ(payload);
        toast.success('FAQ created successfully');
      } else if (faqModalMode === 'edit' && selectedFaq) {
        await supportAPI.updateFAQ(selectedFaq.id, payload);
        toast.success('FAQ updated successfully');
      }
      setIsFaqModalOpen(false);
      fetchFAQs();
    } catch (err) {
      toast.error('Failed to save FAQ');
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await supportAPI.deleteFAQ(id);
      toast.success('FAQ deleted successfully');
      fetchFAQs();
    } catch (err) {
      toast.error('Failed to delete FAQ');
    }
  };

  // Filter & Search Tickets
  const filteredTickets = tickets.filter(t => {
    // Exclude Admin-Vendor Direct Chat tickets from the general support tickets list
    if (t.subject === 'Admin-Vendor Direct Chat') return false;

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesRecipient = recipientFilter === 'all' || t.recipient === recipientFilter;
    
    const term = searchQuery.toLowerCase();
    const matchesSearch = !term || 
      (t.subject && t.subject.toLowerCase().includes(term)) ||
      (t.description && t.description.toLowerCase().includes(term)) ||
      (t.customerName && t.customerName.toLowerCase().includes(term)) ||
      (t.customerEmail && t.customerEmail.toLowerCase().includes(term)) ||
      (t.id && t.id.toLowerCase().includes(term));

    return matchesStatus && matchesCategory && matchesRecipient && matchesSearch;
  });

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      `${vendor.firstName || ''} ${vendor.lastName || ''}`.toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
      (vendor.email && vendor.email.toLowerCase().includes(vendorSearchQuery.toLowerCase()));
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-emerald-105 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400';
      case 'pending': return 'bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-400';
      case 'in_progress': return 'bg-amber-100 text-amber-800 dark:bg-amber-955/20 dark:text-amber-400';
      case 'resolved': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400';
      case 'closed': return 'bg-gray-150 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 font-bold';
      case 'medium': return 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450';
      case 'low': return 'bg-gray-50 text-gray-500 dark:bg-gray-800/40 dark:text-gray-400';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  return (
    <div className="space-y-8 pb-12 transition-colors duration-200">
      <Toaster />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-primary-600" />
            </div>
            <span className="text-sm font-bold text-primary-600 uppercase tracking-widest">Admin Control</span>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Support Center</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Manage user ticketing workflows and curate portal FAQs.</p>
        </div>

        {activeTab === 'faqs' && (
          <button
            onClick={() => handleOpenFaqModal('create')}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Create New FAQ
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => {
            setActiveTab('tickets');
            setSelectedVendor(null);
          }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold transition-all cursor-pointer ${
            activeTab === 'tickets'
              ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-405 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          Active Tickets ({tickets.filter(t => t.status !== 'closed' && t.subject !== 'Admin-Vendor Direct Chat').length})
          {tickets.some(t => t.adminUnread && t.subject !== 'Admin-Vendor Direct Chat') && (
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('vendors');
            setSelectedTicket(null);
          }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold transition-all cursor-pointer ${
            activeTab === 'vendors'
              ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-405 dark:hover:text-white'
          }`}
        >
          <Store className="w-5 h-5" />
          Vendors Chat
          {tickets.some(t => t.adminUnread && t.subject === 'Admin-Vendor Direct Chat') && (
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('faqs');
            setSelectedVendor(null);
            setSelectedTicket(null);
          }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold transition-all cursor-pointer ${
            activeTab === 'faqs'
              ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-405 dark:hover:text-white'
          }`}
        >
          <HelpCircle className="w-5 h-5" />
          Manage FAQs ({faqs.length})
        </button>
      </div>

      {/* Contents */}
      {activeTab !== 'faqs' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="xl:col-span-5 space-y-4">
            {activeTab === 'tickets' ? (
              <>
                {/* Filters */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 p-4 rounded-2xl shadow-sm space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-55 dark:bg-gray-800 border border-gray-150 dark:border-gray-750 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Recipient</label>
                      <select
                        value={recipientFilter}
                        onChange={(e) => setRecipientFilter(e.target.value)}
                        className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-750 rounded-lg text-xs"
                      >
                        <option value="all">All Targets</option>
                        <option value="admin">Admin Support</option>
                        <option value="vendor">Vendor Support</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-750 rounded-lg text-xs"
                      >
                        <option value="all">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Category</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-750 rounded-lg text-xs"
                      >
                        <option value="all">All Categories</option>
                        <option value="general">General Query</option>
                        <option value="order">Order</option>
                        <option value="product">Product</option>
                        <option value="payment">Payment</option>
                        <option value="refund">Refund</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* List */}
                {loadingTickets ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl shadow-sm">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  </div>
                ) : filteredTickets.length > 0 ? (
                  <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                    {filteredTickets.map((ticket) => {
                      const isUnread = ticket.adminUnread;
                      return (
                        <button
                          key={ticket.id}
                          onClick={() => {
                            setSelectedVendor(null);
                            handleSelectTicket(ticket);
                          }}
                          className={`w-full text-left p-4 rounded-2xl border transition-all relative ${
                            selectedTicket?.id === ticket.id
                              ? 'bg-primary-50 dark:bg-gray-800 border-primary-500 dark:border-primary-400 ring-1 ring-primary-500 dark:ring-primary-400'
                              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                          } ${isUnread ? 'ring-2 ring-rose-500 border-rose-500' : 'shadow-sm'}`}
                        >
                          {isUnread && (
                            <span className="absolute top-4 right-4 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                          )}

                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest ${getStatusColor(ticket.status)}`}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(ticket.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-800 dark:text-gray-200 line-clamp-1 mb-1 pr-4">
                            {ticket.subject}
                          </h3>
                          <p className="text-xs text-gray-505 mt-1 line-clamp-1">
                            Buyer: <strong className="text-gray-700 dark:text-gray-300">{ticket.customerName}</strong>
                          </p>
                          
                          <div className="flex flex-wrap gap-2 items-center justify-between mt-3 border-t border-gray-50 dark:border-gray-850 pt-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                ticket.recipient === 'vendor'
                                  ? 'bg-orange-50 text-orange-655 dark:bg-orange-950/20 dark:text-orange-400'
                                  : 'bg-indigo-50 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400'
                              }`}>
                                {ticket.recipient === 'vendor' ? 'Vendor' : 'Admin'}
                              </span>
                              <span className="font-semibold uppercase text-[9px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-450">
                                {ticket.category === 'general' ? 'general query' : ticket.category}
                              </span>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded font-semibold text-[9px] uppercase ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 shadow-sm">
                    <MessageSquare className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="font-bold text-gray-700 dark:text-gray-300">No Support Tickets Found</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Vendors Filters and List */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-855 p-4 rounded-2xl shadow-sm space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search vendors by name or email..."
                      value={vendorSearchQuery}
                      onChange={(e) => setVendorSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-750 rounded-xl text-xs focus:outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {loadingVendors ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-805 rounded-2xl shadow-sm">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  </div>
                ) : filteredVendors.length > 0 ? (
                  <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                    {filteredVendors.map((vendor) => {
                      const activeChatTicket = tickets.find(
                        (t) => t.customerId === user?.id && t.sellerId === vendor.id && t.subject === 'Admin-Vendor Direct Chat'
                      );
                      const hasActiveChat = !!activeChatTicket;
                      const isUnread = activeChatTicket?.adminUnread;
                      const isSelected = selectedVendor?.id === vendor.id;

                      return (
                        <button
                          key={vendor.id}
                          onClick={() => handleSelectVendor(vendor)}
                          disabled={creatingVendorChat && isSelected}
                          className={`w-full text-left p-4 rounded-2xl border transition-all relative flex items-center justify-between gap-4 ${
                            isSelected
                              ? 'bg-primary-50/40 dark:bg-primary-950/10 border-primary-500 ring-1 ring-primary-500'
                              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-855 hover:bg-gray-55 dark:hover:bg-gray-800/30 shadow-sm'
                          }`}
                        >
                          {isUnread && (
                            <span className="absolute top-4 right-4 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                          )}

                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-10 h-10 rounded-full border border-gray-250 dark:border-gray-700 overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400">
                              {vendor.profileImage ? (
                                <img src={vendor.profileImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                `${vendor.firstName?.[0] || ''}${vendor.lastName?.[0] || ''}`.toUpperCase() || 'V'
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                                {vendor.firstName} {vendor.lastName}
                              </p>
                              <p className="text-xs text-gray-505 truncate">{vendor.email}</p>
                            </div>
                          </div>

                          <div className="flex-shrink-0 flex items-center gap-2">
                            {hasActiveChat ? (
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                                Active Chat
                              </span>
                            ) : (
                              <span className="text-[9px] bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                                No Chat
                              </span>
                            )}
                            {creatingVendorChat && isSelected ? (
                              <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-405" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 shadow-sm">
                    <Store className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="font-bold text-gray-700 dark:text-gray-300">No Vendors Found</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column: Chat Box */}
          <div className="xl:col-span-7">
            {selectedTicket ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl shadow-sm flex flex-col h-[680px] overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-extrabold text-lg line-clamp-1">{selectedTicket.subject}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest ${getStatusColor(selectedTicket.status)}`}>
                          {selectedTicket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-550 dark:text-gray-400 space-y-1">
                        <p>User: <strong>{selectedTicket.customerName} ({selectedTicket.customerEmail})</strong></p>
                        <div className="flex flex-wrap gap-x-4">
                          <span className="flex items-center gap-1">
                            {selectedTicket.recipient === 'vendor' ? <Store className="w-3.5 h-3.5 text-orange-500" /> : <Shield className="w-3.5 h-3.5 text-indigo-500" />}
                            Recipient: <strong className="capitalize">{selectedTicket.recipient === 'vendor' ? 'Store Vendor' : 'Admin Support'}</strong>
                          </span>
                          <span>Priority: <strong className="capitalize">{selectedTicket.priority}</strong></span>
                          <span>Category: <strong className="capitalize">{selectedTicket.category === 'general' ? 'general query' : selectedTicket.category}</strong></span>
                          {selectedTicket.orderId && <span>Order ID: <strong>#{selectedTicket.orderId.substring(0,8)}</strong></span>}
                          {selectedTicket.sellerId && <span>Routed Seller: <strong>#{selectedTicket.sellerId.substring(0,8)}</strong></span>}
                        </div>
                      </div>
                    </div>

                    {/* Agent Assignment Selection */}
                    <div className="w-full md:w-auto">
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Assign Agent</label>
                      <select
                        value={selectedTicket.assignedAgentId || ''}
                        onChange={(e) => handleAssignAgent(selectedTicket.id, e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs w-full focus:outline-none"
                      >
                        <option value="">-- Unassigned --</option>
                        {agents.map((ag) => (
                          <option key={ag.id} value={ag.id}>
                            {ag.firstName} {ag.lastName} ({ag.role === 'admin' ? 'Admin' : 'Staff'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Status update buttons */}
                  <div className="mt-4 pt-4 border-t border-gray-200/60 dark:border-gray-800 flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500 self-center mr-2">Set Status:</span>
                    {['open', 'pending', 'in_progress', 'resolved', 'closed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(selectedTicket.id, status)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
                          selectedTicket.status === status
                            ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message display thread */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/25 dark:bg-gray-900/10 custom-scrollbar">
                  {/* Customer query */}
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-650 dark:text-indigo-400 flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-bold text-xs">{selectedTicket.customerName}</span>
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">Buyer Query</span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-line text-gray-800 dark:text-gray-200">{selectedTicket.description}</p>
                      
                      {/* Original ticket attachments */}
                      {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50 space-y-2">
                          <p className="text-[9px] font-bold text-gray-405 uppercase tracking-widest">Client Attachments:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedTicket.attachments.map((url: string, idx: number) => {
                              const isImg = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                              return isImg ? (
                                <a key={idx} href={url} target="_blank" rel="noreferrer" className="block relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white">
                                  <img src={url} alt="attached" className="w-16 h-16 object-cover" />
                                </a>
                              ) : (
                                <a key={idx} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 p-1.5 bg-white border border-gray-200 rounded-lg text-xs text-indigo-600 hover:underline">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Doc {idx + 1}</span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <span className="block text-[10px] text-gray-400 mt-2 text-right">
                        {new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {loadingMessages ? (
                    <div className="text-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                            isMe 
                              ? 'bg-indigo-600 text-white' 
                              : msg.senderRole === 'buyer'
                              ? 'bg-indigo-100 text-indigo-850 dark:bg-indigo-950/20 dark:text-indigo-400'
                              : 'bg-amber-100 text-amber-850 dark:bg-amber-950/20 dark:text-amber-400'
                          }`}>
                            {isMe ? 'Me' : msg.senderRole === 'buyer' ? 'B' : 'S'}
                          </div>
                          <div className={`rounded-2xl p-4 shadow-sm ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-850 rounded-tl-none'
                          }`}>
                            <div className="flex items-center gap-2 mb-1 justify-between">
                              <span className="font-bold text-xs">
                                {isMe ? `${msg.senderName} (You)` : msg.senderName}
                              </span>
                              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                isMe 
                                  ? 'bg-indigo-700 text-indigo-100' 
                                  : msg.senderRole === 'buyer'
                                  ? 'bg-indigo-100 text-indigo-850'
                                  : 'bg-amber-100 text-amber-850'
                              }`}>
                                {msg.senderRole}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-line">{msg.message}</p>
                            
                            {/* Message attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-white/10 dark:border-gray-700/50 space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  {msg.attachments.map((url: string, idx: number) => {
                                    const isImg = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                                    return isImg ? (
                                      <a key={idx} href={url} target="_blank" rel="noreferrer" className="block relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white">
                                        <img src={url} alt="Attach" className="w-16 h-16 object-cover" />
                                      </a>
                                    ) : (
                                      <a key={idx} href={url} target="_blank" rel="noreferrer" className={`flex items-center gap-1.5 p-1.5 rounded-lg text-xs font-bold border ${isMe ? 'bg-indigo-700 border-indigo-500 text-white hover:underline' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-750 text-indigo-600 hover:underline'}`}>
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>Doc {idx + 1}</span>
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <span className={`block text-[9px] mt-2 text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Form */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900">
                  {selectedTicket.status !== 'closed' ? (
                    <>
                      {/* File previews */}
                      {chatAttachedUrls.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {chatAttachedUrls.map((url, idx) => (
                            <div key={idx} className="relative flex items-center gap-2 p-2 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pr-8 text-xs font-semibold">
                              {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                <img src={url} alt="preview" className="w-8 h-8 object-cover rounded-lg" />
                              ) : (
                                <FileText className="w-4 h-4 text-gray-400" />
                              )}
                              <span className="truncate max-w-[100px]">Doc {idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => removeAttachment(idx)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-rose-500"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                        <label className="cursor-pointer p-2.5 bg-gray-55 hover:bg-gray-150 dark:bg-gray-850 dark:hover:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-750 text-gray-550 transition-all">
                          <input
                            type="file"
                            className="hidden"
                            disabled={uploadingFile}
                            onChange={handleFileUpload}
                          />
                          {uploadingFile ? (
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                          ) : (
                            <Paperclip className="w-5 h-5" />
                          )}
                        </label>
                        <input
                          type="text"
                          placeholder="Type response to ticket conversation..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim() && chatAttachedUrls.length === 0}
                          className="bg-indigo-650 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-dashed border-gray-200 dark:border-gray-750 rounded-2xl text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                      🔒 This ticket has been closed. Chat has ended and messaging is disabled.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-20 text-center shadow-sm h-full flex flex-col justify-center items-center">
                <MessageSquare className="w-16 h-16 text-indigo-505 mb-4 opacity-40 animate-pulse" />
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Select a Ticket</h3>
                <p className="text-gray-550 mt-2 max-w-sm text-sm leading-relaxed">
                  Select a support query from the left panel to review buyer details, assign support agents, and message the ticket creator.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* FAQs Tab */
        <div>
          {loadingFaqs ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : faqs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400 px-2.5 py-1 rounded-lg">
                        {faq.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        faq.isActive 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' 
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400'
                      }`}>
                        {faq.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-lg text-gray-800 dark:text-gray-200 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-sm text-gray-650 dark:text-gray-350 leading-relaxed whitespace-pre-line line-clamp-3 mb-4">
                      {faq.answer}
                    </p>
                  </div>
                  <div className="flex gap-2 justify-end border-t border-gray-100 dark:border-gray-855 pt-4 mt-2">
                    <button
                      onClick={() => handleOpenFaqModal('edit', faq)}
                      className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-650 dark:text-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteFAQ(faq.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-105 text-rose-650 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-805 rounded-2xl p-16 shadow-sm">
              <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">No FAQ entries created</h3>
              <p className="text-gray-550 text-sm mt-2">Get started by creating your first Frequently Asked Question.</p>
            </div>
          )}
        </div>
      )}

      {/* FAQ CREATE / EDIT MODAL */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-150 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-150 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary-550" />
                {faqModalMode === 'create' ? 'Create New FAQ' : 'Edit FAQ Detail'}
              </h2>
              <button
                onClick={() => setIsFaqModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFAQ} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Question *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter FAQ Question"
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="Category (e.g. Shipping, Refund)"
                    value={faqCategory}
                    onChange={(e) => setFaqCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none text-sm"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={faqIsActive}
                      onChange={(e) => setFaqIsActive(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500 h-4.5 w-4.5"
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Publish as Active</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Answer *
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Write a clear and comprehensive answer to the question..."
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all text-sm"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-gray-150 dark:border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFaqModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-250 dark:border-gray-750 text-gray-650 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 font-semibold text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-750 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
