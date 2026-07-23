'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { supportAPI, ordersAPI, productsAPI } from '@/lib/api';
import Header from '@/components/Header';
import { 
  MessageSquare, HelpCircle, Send, Plus, Search, 
  AlertCircle, CheckCircle2, X, Clock, User, Tag, 
  ChevronDown, ChevronUp, MessageCircle, FileText, 
  ChevronRight, Headphones, Paperclip, Shield, Store, Loader2
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function SupportPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'faqs' | 'tickets'>('faqs');

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // FAQs State
  const [faqs, setFaqs] = useState<any[]>([]);
  const [faqCategories, setFaqCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [loadingFaqs, setLoadingFaqs] = useState(true);

  // Tickets State
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  // Create Ticket Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContextLocked, setIsContextLocked] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketRecipient, setNewTicketRecipient] = useState<'admin' | 'vendor'>('admin');
  const [newTicketCategory, setNewTicketCategory] = useState('general');
  const [newTicketPriority, setNewTicketPriority] = useState('medium');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [newTicketOrderId, setNewTicketOrderId] = useState('');
  const [newTicketProductId, setNewTicketProductId] = useState('');
  const [newTicketSellerId, setNewTicketSellerId] = useState('');
  
  // Attachments State
  const [attachedUrls, setAttachedUrls] = useState<string[]>([]);
  const [chatAttachedUrls, setChatAttachedUrls] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // User context orders & products
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [creatingTicket, setCreatingTicket] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mounted && isAuthenticated && user) {
      if (user.role === 'admin' || user.role === 'sub_admin') {
        router.replace('/admin/support');
        return;
      }
      if (user.role === 'seller') {
        router.replace('/seller/support');
        return;
      }
    }
  }, [mounted, isAuthenticated, user, router]);

  useEffect(() => {
    fetchFAQs();
    if (isAuthenticated && user?.role === 'buyer') {
      fetchTickets();
      fetchOrdersAndProducts();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (mounted && isAuthenticated && user?.role === 'buyer') {
      const search = window.location.search;
      if (search) {
        const params = new URLSearchParams(search);
        const openTicket = params.get('openTicket');
        const orderId = params.get('orderId');
        const productId = params.get('productId');
        if (openTicket === 'true') {
          setIsModalOpen(true);
          if (orderId) {
            setNewTicketOrderId(orderId);
            setNewTicketRecipient('vendor'); // Route directly to seller for order related queries
            setIsContextLocked(true);
            
            // Query order detail to resolve sellerId
            ordersAPI.getById(orderId)
              .then((res: any) => {
                if (res.data && res.data.items && res.data.items.length > 0) {
                  const firstItem = res.data.items[0];
                  if (firstItem && firstItem.sellerId) {
                    setNewTicketSellerId(firstItem.sellerId);
                  }
                }
              })
              .catch((err: any) => console.warn('Prefilled order fetch failed:', err));
          }
          if (productId) {
            setNewTicketProductId(productId);
            setNewTicketRecipient('vendor'); // Route directly to seller for product related queries
            setIsContextLocked(true);
            
            // Query product details from product-service to guarantee name and sellerId availability
            productsAPI.getById(productId)
              .then((res: any) => {
                if (res.data) {
                  setProducts(prev => {
                    if (prev.some(p => p.id === res.data.id)) return prev;
                    return [...prev, res.data];
                  });
                  if (res.data.sellerId) {
                    setNewTicketSellerId(res.data.sellerId);
                  }
                }
              })
              .catch((err: any) => console.warn('Prefilled product fetch failed:', err));
          }
        }
      }
    }
  }, [mounted, isAuthenticated, user]);

  const hasAutoSelectedBuyerTicketRef = useRef(false);

  useEffect(() => {
    if (mounted && isAuthenticated && user?.role === 'buyer' && tickets.length > 0 && !hasAutoSelectedBuyerTicketRef.current) {
      const search = window.location.search;
      if (search) {
        const params = new URLSearchParams(search);
        const productId = params.get('productId');
        const sellerId = params.get('sellerId');
        if (productId || sellerId) {
          const existingTicket = tickets.find((t: any) => 
            (productId && t.productId === productId) || 
            (sellerId && t.sellerId === sellerId)
          );
          if (existingTicket) {
            hasAutoSelectedBuyerTicketRef.current = true;
            handleSelectTicket(existingTicket);
            setIsModalOpen(false);
          }
        }
      }
    }
  }, [mounted, isAuthenticated, user, tickets]);

  const fetchFAQs = async () => {
    try {
      setLoadingFaqs(true);
      const res = await supportAPI.getFAQs();
      setFaqs(res.data || []);
      
      const categories: string[] = ['All'];
      res.data.forEach((faq: any) => {
        if (faq.category && !categories.includes(faq.category)) {
          categories.push(faq.category);
        }
      });
      setFaqCategories(categories);
    } catch (err) {
      console.error('Failed to fetch FAQs:', err);
    } finally {
      setLoadingFaqs(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await supportAPI.getTickets();
      setTickets(res.data || []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchOrdersAndProducts = async () => {
    try {
      const ordersRes = await ordersAPI.getAll();
      setOrders(ordersRes.data || []);

      const productsRes = await productsAPI.getAll();
      setProducts(productsRes.data?.products || productsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch orders/products context:', err);
    }
  };

  const handleSelectTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    setLoadingMessages(true);
    setChatAttachedUrls([]);
    try {
      const res = await supportAPI.getTicketMessages(ticket.id);
      setMessages(res.data || []);
      
      // Refresh tickets list to clear local unread count if applicable
      fetchTickets();
    } catch (err) {
      toast.error('Failed to load chat messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isChat: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the limit of 5MB');
      return;
    }

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await supportAPI.uploadAttachment(formData);
      const uploadedUrl = res.data.url;
      if (isChat) {
        setChatAttachedUrls(prev => [...prev, uploadedUrl]);
      } else {
        setAttachedUrls(prev => [...prev, uploadedUrl]);
      }
      toast.success('File uploaded successfully!');
    } catch (err) {
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const removeAttachment = (index: number, isChat: boolean) => {
    if (isChat) {
      setChatAttachedUrls(prev => prev.filter((_, i) => i !== index));
    } else {
      setAttachedUrls(prev => prev.filter((_, i) => i !== index));
    }
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
      
      // Refresh tickets list silently to update timestamps/statuses
      const ticketsRes = await supportAPI.getTickets();
      setTickets(ticketsRes.data || []);
    } catch (err) {
      toast.error('Failed to send message');
      setNewMessage(msgText);
      setChatAttachedUrls(urls);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketDescription.trim()) {
      toast.error('Please fill in subject and description');
      return;
    }

    if (newTicketRecipient === 'vendor' && !newTicketOrderId && !newTicketProductId) {
      toast.error('Vendor support requires linking a product or order to route the request.');
      return;
    }

    setCreatingTicket(true);
    try {
      const res = await supportAPI.createTicket({
        subject: newTicketSubject,
        recipient: newTicketRecipient,
        category: newTicketCategory,
        priority: newTicketPriority,
        description: newTicketDescription,
        orderId: newTicketOrderId || undefined,
        productId: newTicketProductId || undefined,
        sellerId: newTicketSellerId || undefined,
        attachments: attachedUrls,
      });

      toast.success('Support ticket created successfully!');
      setIsModalOpen(false);
      setIsContextLocked(false);
      
      // Reset Form
      setNewTicketSubject('');
      setNewTicketDescription('');
      setNewTicketOrderId('');
      setNewTicketProductId('');
      setNewTicketSellerId('');
      setNewTicketRecipient('admin');
      setAttachedUrls([]);
      
      // Refresh tickets list
      fetchTickets();
      
      // Select newly created ticket
      handleSelectTicket(res.data);
      setActiveTab('tickets');
    } catch (err) {
      toast.error('Failed to submit support ticket');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      await supportAPI.updateTicketStatus(ticketId, 'closed');
      toast.success('Ticket closed successfully');
      
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket((prev: any) => prev ? { ...prev, status: 'closed' } : null);
      }
      
      fetchTickets();
    } catch (err) {
      toast.error('Failed to close ticket');
    }
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'pending': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'in_progress': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'resolved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-650 dark:text-red-400 font-semibold';
      case 'medium': return 'text-amber-650 dark:text-amber-400';
      case 'low': return 'text-gray-500 dark:text-gray-400';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Toaster />

      {/* Hero Header Section */}
      <section className="bg-gradient-to-r from-primary-900 via-indigo-950 to-purple-900 text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold mb-4 backdrop-blur-md">
            <Headphones className="w-3.5 h-3.5" />
            24/7 Help Desk Support
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            How can we help you today?
          </h1>
          <p className="text-gray-300 max-w-lg mx-auto text-sm md:text-base mb-8">
            Browse our Frequently Asked Questions database or submit a custom ticket to Vendors or Admins.
          </p>

          {/* Search bar inside hero */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5.5 h-5.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for answers (e.g. refund, track order, cancel)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== 'faqs') setActiveTab('faqs');
              }}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-0 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/40 transition-all shadow-xl"
            />
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10 max-w-6xl">
        {/* Tab Controls & Add Ticket Button */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-b border-gray-200 dark:border-gray-800 pb-2 mb-8 gap-4">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('faqs')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'faqs'
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <HelpCircle className="w-4.5 h-4.5" />
              FAQs Knowledge Base
            </button>
            {mounted && isAuthenticated && user?.role === 'buyer' && (
              <button
                onClick={() => setActiveTab('tickets')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all relative ${
                  activeTab === 'tickets'
                    ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <MessageSquare className="w-4.5 h-4.5" />
                My Support Tickets
                {tickets.some(t => t.buyerUnread) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                )}
              </button>
            )}
          </div>
          {mounted && isAuthenticated && user?.role === 'buyer' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-tr from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
            >
              <Plus className="w-4.5 h-4.5" />
              Create Support Ticket
            </button>
          )}
        </div>

        {/* Tab Contents */}
        {activeTab === 'faqs' ? (
          <div>
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-thin">
              {faqCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4.5 py-2 rounded-full text-xs font-extrabold whitespace-nowrap transition-all border ${
                    selectedCategory === category
                      ? 'bg-primary-600 border-primary-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-650 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* FAQs Accordion */}
            {loadingFaqs ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-sm text-gray-500">Retrieving FAQs...</p>
              </div>
            ) : filteredFaqs.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredFaqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-850 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-fit"
                    >
                      <button
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        className="w-full flex items-center justify-between p-5 text-left font-bold text-base hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all gap-4"
                      >
                        <span className="flex items-center gap-3">
                          <span className="p-1.5 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-lg">
                            <HelpCircle className="w-4 h-4" />
                          </span>
                          {faq.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4.5 h-4.5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4.5 h-4.5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 pt-0.5 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-850 leading-relaxed whitespace-pre-line">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-16 shadow-sm">
                <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">No FAQ Found</h3>
                <p className="text-gray-505 text-sm mt-2">Try adjusting your search queries or select a different category.</p>
              </div>
            )}
          </div>
        ) : (
          /* Tickets Tab */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Tickets Sidebar List */}
            <div className="lg:col-span-4 space-y-4">
              <h2 className="text-lg font-black flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary-500 animate-pulse" />
                Active Cases ({tickets.filter(t => t.status !== 'closed').length})
              </h2>

              {loadingTickets ? (
                <div className="text-center py-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-xs text-gray-500">Loading cases...</p>
                </div>
              ) : tickets.length > 0 ? (
                <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                  {tickets.map((ticket) => {
                    const isUnread = ticket.buyerUnread;
                    return (
                      <button
                        key={ticket.id}
                        onClick={() => handleSelectTicket(ticket)}
                        className={`w-full text-left p-4.5 rounded-2xl border transition-all relative ${
                          selectedTicket?.id === ticket.id
                            ? 'bg-primary-50 dark:bg-gray-800 border-primary-500 dark:border-primary-400 ring-1 ring-primary-500 dark:ring-primary-400'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
                        } ${isUnread ? 'ring-2 ring-rose-500/50 border-rose-500' : 'shadow-sm'}`}
                      >
                        {isUnread && (
                          <span className="absolute top-4 right-4 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                          </span>
                        )}

                        <div className="flex justify-between items-start gap-4 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(ticket.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-sm text-gray-800 dark:text-gray-200 line-clamp-1 mb-1 pr-4">
                          {ticket.subject}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-normal">
                          {ticket.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-850">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            ticket.recipient === 'vendor'
                              ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400 border border-orange-200/50 dark:border-orange-900/50'
                              : 'bg-indigo-50 text-indigo-655 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/50'
                          }`}>
                            {ticket.recipient === 'vendor' ? 'Vendor Support' : 'Admin Support'}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Tag className="w-3 h-3" />
                            <span className="capitalize">{ticket.category === 'general' ? 'general query' : ticket.category}</span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 shadow-sm">
                  <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">No Active Tickets</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">If you have questions or complaints, create a support ticket.</p>
                </div>
              )}
            </div>

            {/* Chat Conversation Pane */}
            <div className="lg:col-span-8">
              {selectedTicket ? (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl shadow-sm flex flex-col h-[600px] overflow-hidden">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-black text-base line-clamp-1">{selectedTicket.subject}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest ${getStatusColor(selectedTicket.status)}`}>
                          {selectedTicket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1">
                          {selectedTicket.recipient === 'vendor' ? <Store className="w-3.5 h-3.5 text-orange-500" /> : <Shield className="w-3.5 h-3.5 text-indigo-500" />}
                          <strong>{selectedTicket.recipient === 'vendor' ? 'Vendor Support' : 'Admin Support'}</strong>
                        </span>
                        <span>Category: <strong className="capitalize text-gray-650 dark:text-gray-300">{selectedTicket.category === 'general' ? 'general query' : selectedTicket.category}</strong></span>
                        <span>Priority: <strong className={getPriorityColor(selectedTicket.priority)}>{selectedTicket.priority}</strong></span>
                        {selectedTicket.orderId && <span>Order: <strong>#{selectedTicket.orderId.substring(0, 8)}</strong></span>}
                        {selectedTicket.productId && (
                          <span className="flex items-center gap-1">
                            📦 Product: <Link href={`/products/${selectedTicket.productId}`} className="font-extrabold text-primary-600 dark:text-primary-400 hover:underline">{products.find(p => p.id === selectedTicket.productId)?.name || selectedTicket.productId.substring(0, 8)}</Link>
                          </span>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Message Threads */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/20 dark:bg-gray-900/5 custom-scrollbar">
                    {/* Ticket Original Description */}
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-650 dark:text-primary-400 flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-bold text-xs">{selectedTicket.customerName}</span>
                          <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">Original Query</span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-line text-gray-800 dark:text-gray-200">{selectedTicket.description}</p>
                        
                        {/* Attachments for original query */}
                        {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50 space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attachments:</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedTicket.attachments.map((url: string, idx: number) => {
                                const isImg = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                                return isImg ? (
                                  <a key={idx} href={url} target="_blank" rel="noreferrer" className="block relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                                    <img src={url} alt="Attach" className="w-16 h-16 object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[8px] font-black">View</div>
                                  </a>
                                ) : (
                                  <a key={idx} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-750 rounded-lg text-xs font-bold text-indigo-600 hover:underline">
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Doc {idx + 1}</span>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        <span className="block text-[9px] text-gray-400 mt-2 text-right">
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
                        const isMe = msg.senderRole === 'buyer';
                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                              isMe 
                                ? 'bg-primary-600 text-white' 
                                : msg.senderRole === 'seller'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
                            }`}>
                              {isMe ? 'Me' : msg.senderRole === 'seller' ? 'V' : 'A'}
                            </div>
                            <div className={`rounded-2xl p-4 shadow-sm ${
                              isMe
                                ? 'bg-primary-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-850 rounded-tl-none'
                            }`}>
                              <div className="flex items-center gap-4 mb-1 justify-between">
                                <span className="font-bold text-xs">
                                  {isMe ? 'You' : msg.senderName}
                                </span>
                                <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${
                                  isMe 
                                    ? 'bg-primary-700 text-primary-100' 
                                    : msg.senderRole === 'seller'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
                                }`}>
                                  {msg.senderRole === 'seller' ? 'vendor' : msg.senderRole}
                                </span>
                              </div>
                              <p className={`text-sm leading-relaxed whitespace-pre-line ${isMe ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>{msg.message}</p>
                              
                              {/* Message Attachments */}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-white/10 dark:border-gray-700/50 space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    {msg.attachments.map((url: string, idx: number) => {
                                      const isImg = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                                      return isImg ? (
                                        <a key={idx} href={url} target="_blank" rel="noreferrer" className="block relative group rounded-lg overflow-hidden border border-white/10 dark:border-gray-700 bg-white dark:bg-gray-900">
                                          <img src={url} alt="Attach" className="w-16 h-16 object-cover" />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[8px] font-black">View</div>
                                        </a>
                                      ) : (
                                        <a key={idx} href={url} target="_blank" rel="noreferrer" className={`flex items-center gap-1.5 p-2 rounded-lg text-xs font-bold border ${isMe ? 'bg-primary-700 border-primary-500 text-white hover:underline' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-750 text-indigo-600 hover:underline'}`}>
                                          <FileText className="w-3.5 h-3.5" />
                                          <span>Doc {idx + 1}</span>
                                        </a>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              <span className={`block text-[9px] mt-2 text-right ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  {/* Chat Input */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900">
                    {selectedTicket.status !== 'closed' ? (
                      <>
                        {/* Chat file attachment indicators */}
                        {chatAttachedUrls.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            {chatAttachedUrls.map((url, idx) => (
                              <div key={idx} className="relative flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pr-8 text-xs font-semibold">
                                {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                  <img src={url} alt="preview" className="w-8 h-8 object-cover rounded-lg" />
                                ) : (
                                  <FileText className="w-4 h-4 text-gray-400" />
                                )}
                                <span className="truncate max-w-[100px]">Doc {idx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(idx, true)}
                                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-rose-500"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                          {/* File upload trigger */}
                          <label className="cursor-pointer p-2.5 bg-gray-55 hover:bg-gray-150 dark:bg-gray-850 dark:hover:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-750 text-gray-500 transition-all">
                            <input
                              type="file"
                              className="hidden"
                              disabled={uploadingFile}
                              onChange={(e) => handleFileUpload(e, true)}
                            />
                            {uploadingFile ? (
                              <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                            ) : (
                              <Paperclip className="w-5 h-5" />
                            )}
                          </label>
                          <input
                            type="text"
                            placeholder="Type your message here..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-gray-55 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                          />
                          <button
                            type="submit"
                            disabled={!newMessage.trim() && chatAttachedUrls.length === 0}
                            className="bg-primary-600 hover:bg-primary-750 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-md"
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
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-16 text-center shadow-sm h-full flex flex-col justify-center items-center">
                  <MessageSquare className="w-16 h-16 text-primary-500 mb-4 opacity-40 animate-pulse" />
                  <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Select a Ticket</h3>
                  <p className="text-gray-500 mt-2 max-w-sm text-sm leading-relaxed">
                    Select a support case from the list on the left to view response threads or message support agents.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* CREATE TICKET MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-150 dark:border-gray-800 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-150 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <h2 className="text-lg font-black flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                Submit Support Ticket
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* Recipient Choice */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                  Send Ticket To *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isContextLocked}
                    onClick={() => {
                      setNewTicketRecipient('admin');
                      // If context was locked (from product page), unlock it when user manually picks Admin
                      if (isContextLocked) {
                        setIsContextLocked(false);
                      }
                      setNewTicketOrderId('');
                      setNewTicketProductId('');
                      setNewTicketSellerId('');
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
                      isContextLocked
                        ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
                        : newTicketRecipient === 'admin'
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Admin Support
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTicketRecipient('vendor')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
                      newTicketRecipient === 'vendor'
                        ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-500 text-orange-655 dark:text-orange-400 ring-1 ring-orange-500'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    Store Vendor
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 leading-normal">
                  {isContextLocked
                    ? 'This ticket is linked to a specific product. It must be sent directly to the Store Vendor.'
                    : newTicketRecipient === 'admin'
                    ? 'For account settings, payments, vouchers, platform complaints, or general questions.'
                    : 'For product quality, delivery issues, seller chats, product faults, or replacements.'
                  }
                </p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Summarize your issue (e.g. Refund delay status, faulty item screen)"
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all text-sm"
                  >
                    <option value="general">General Query</option>
                    <option value="order">Order Tracking / Delay</option>
                    <option value="product">Product Details / Faulty</option>
                    <option value="payment">Payment Issue</option>
                    <option value="refund">Refund / Returns</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all text-sm"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              {/* Unified Linked Context Select */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1.5">
                  Link Purchase or Product {newTicketRecipient === 'vendor' ? '*' : '(Optional)'} {isContextLocked && '🔒 (Locked)'}
                </label>
                <select
                  disabled={isContextLocked}
                  value={newTicketOrderId ? `order:${newTicketOrderId}${newTicketProductId ? `:${newTicketProductId}` : ''}` : newTicketProductId ? `product:${newTicketProductId}` : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setNewTicketOrderId('');
                      setNewTicketProductId('');
                      setNewTicketSellerId('');
                      setNewTicketCategory('general');
                      return;
                    }
                    const parts = val.split(':');
                    if (parts[0] === 'order') {
                      const oId = parts[1];
                      const pId = parts[2] || '';
                      setNewTicketOrderId(oId);
                      setNewTicketProductId(pId);
                      
                      const ord = orders.find(o => o.id === oId);
                      if (ord) {
                        const item = (ord.items || []).find((i: any) => i.productId === pId);
                        if (item && item.sellerId) {
                          setNewTicketSellerId(item.sellerId);
                        }
                      }
                    } else if (parts[0] === 'product') {
                      const pId = parts[1];
                      setNewTicketOrderId('');
                      setNewTicketProductId(pId);
                      
                      const prod = products.find(p => p.id === pId);
                      if (prod && prod.sellerId) {
                        setNewTicketSellerId(prod.sellerId);
                      } else {
                        setNewTicketSellerId('');
                      }
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="">-- None Selected --</option>
                  
                  {/* Prefilled Product Option - if any (so it shows up properly if selected via contact button) */}
                  {newTicketProductId && (
                    <option value={`product:${newTicketProductId}`}>
                      Inquiring: {products.find(p => p.id === newTicketProductId)?.name || 'This Product'}
                    </option>
                  )}

                  {orders.filter(o => o.status !== 'pending_payment' && o.status !== 'cancelled').length > 0 && (
                    <optgroup label="Your Purchased Items (From Orders)">
                      {orders
                        .filter(o => o.status !== 'pending_payment' && o.status !== 'cancelled')
                        .flatMap((o) => 
                          (o.items || []).map((item: any) => {
                            return (
                              <option key={`${o.id}-${item.productId}`} value={`order:${o.id}:${item.productId}`}>
                                Order #{o.id.substring(0, 8)} - {item.productName || 'Item'} ({item.quantity}x)
                              </option>
                            );
                          })
                        )}
                    </optgroup>
                  )}
                </select>
                <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                  {isContextLocked 
                    ? 'This field is locked to the specific product or order context you selected.' 
                    : newTicketRecipient === 'vendor' 
                    ? 'Vendor inquiries must link to a purchased item or catalog product to route appropriately.'
                    : 'Linking context helps admin trace related orders or catalog items quickly.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1.5">
                  Description *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide all details about your support request. Describe the issue in detail..."
                  value={newTicketDescription}
                  onChange={(e) => setNewTicketDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all text-sm"
                ></textarea>
              </div>

              {/* Attachments Upload */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                  Attach Images / Documents
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  <label className="cursor-pointer flex flex-col items-center justify-center w-16 h-16 bg-gray-50 hover:bg-gray-150 dark:bg-gray-850 dark:hover:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-all">
                    <input
                      type="file"
                      className="hidden"
                      disabled={uploadingFile}
                      onChange={(e) => handleFileUpload(e, false)}
                    />
                    {uploadingFile ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </label>

                  {/* Previews */}
                  {attachedUrls.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-gray-105">
                      {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                        <img src={url} alt="attached" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Doc</div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx, false)}
                        className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow hover:bg-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-150 dark:border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsContextLocked(false);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-gray-250 dark:border-gray-750 text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 font-semibold text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket || uploadingFile}
                  className="bg-primary-600 hover:bg-primary-750 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {creatingTicket ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
