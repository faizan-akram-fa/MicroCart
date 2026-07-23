'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { supportAPI, productsAPI } from '@/lib/api';
import Header from '@/components/Header';
import { 
  MessageSquare, Send, LayoutDashboard, Clock, User, Tag, 
  ChevronRight, AlertCircle, CheckCircle2, MessageCircle, 
  Paperclip, X, FileText, Loader2, Store
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function SellerSupportPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [tickets, setTickets] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  // Attachments State
  const [chatAttachedUrls, setChatAttachedUrls] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.role !== 'seller') {
      router.push('/');
      return;
    }

    if (user?.sellerStatus !== 'approved') {
      router.push('/seller/pending');
      return;
    }

    fetchTickets();
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    try {
      const res = await productsAPI.getSellerProducts();
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load products list:', err);
    }
  };

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
      toast.error('Failed to load support queries');
    } finally {
      setLoadingTickets(false);
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
      
      // Auto set status to in_progress if open
      if (selectedTicket.status === 'open') {
        await handleUpdateStatus(selectedTicket.id, 'in_progress');
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
      toast.success(`Ticket marked as ${status.replace('_', ' ')}`);
      
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket((prev: any) => prev ? { ...prev, status } : null);
      }
      
      // Refresh tickets list silently
      const ticketsRes = await supportAPI.getTickets();
      setTickets(ticketsRes.data || []);
    } catch (err) {
      toast.error('Failed to update ticket status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400';
      case 'pending': return 'bg-purple-105 text-purple-800 dark:bg-purple-950/20 dark:text-purple-400';
      case 'in_progress': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400';
      case 'resolved': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-650 dark:text-red-400 font-bold';
      case 'medium': return 'text-amber-605 dark:text-amber-400';
      case 'low': return 'text-gray-500 dark:text-gray-400';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-20 transition-colors duration-200">
      <Toaster />

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Store className="w-5 h-5 text-primary-600" />
              </div>
              <span className="text-sm font-bold text-primary-600 uppercase tracking-widest">Vendor Portal</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight animate-slide-up">Customer Queries</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Respond to user queries regarding your products and orders.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/seller/dashboard" className="btn btn-outline border-gray-200 dark:border-gray-800 text-gray-650 dark:text-gray-405 px-6 py-3 flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-semibold rounded-xl">
              <LayoutDashboard className="w-5 h-5 mr-2" />
              Dashboard
            </Link>
          </div>
        </div>

        {/* Support Portal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">
          {/* Queries List Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary-505" />
              Assigned Queries ({tickets.filter(t => t.status !== 'closed').length})
            </h2>

            {loadingTickets ? (
              <div className="text-center py-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-505 text-sm">Loading queries...</p>
              </div>
            ) : tickets.length > 0 ? (
              <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                {tickets.map((ticket) => {
                  const isUnread = ticket.sellerUnread;
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => handleSelectTicket(ticket)}
                      className={`w-full text-left p-4 rounded-xl border transition-all relative ${
                        selectedTicket?.id === ticket.id
                          ? 'bg-primary-50 dark:bg-gray-800 border-primary-500 dark:border-primary-400 ring-1 ring-primary-500 dark:ring-primary-400'
                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      } ${isUnread ? 'ring-2 ring-rose-500 border-rose-500' : 'shadow-sm'}`}
                    >
                      {isUnread && (
                        <span className="absolute top-4 right-4 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                        </span>
                      )}

                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(ticket.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-800 dark:text-gray-200 line-clamp-1 mb-1 pr-6">
                        {ticket.subject}
                      </h3>
                      <p className="text-xs text-gray-505 dark:text-gray-400 line-clamp-1 mb-2">
                        From: {ticket.customerName} ({ticket.customerEmail})
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-3 border-t border-gray-100 dark:border-gray-850 pt-2">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" />
                          <span className="capitalize">{ticket.category === 'general' ? 'general query' : ticket.category}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Priority: <span className="capitalize font-semibold">{ticket.priority}</span></span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 shadow-sm">
                <MessageSquare className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="font-bold text-gray-700 dark:text-gray-300">No Queries Yet</p>
                <p className="text-xs text-gray-500 mt-1">When buyers open support tickets related to your store products or orders, they will appear here.</p>
              </div>
            )}
          </div>

          {/* Conversation Chat Thread */}
          <div className="lg:col-span-8">
            {selectedTicket ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl shadow-sm flex flex-col h-[600px] overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-855 bg-gray-55/50 dark:bg-gray-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-extrabold text-lg line-clamp-1">{selectedTicket.subject}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-550 dark:text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                      <span>User: <strong>{selectedTicket.customerName} ({selectedTicket.customerEmail})</strong></span>
                      <span>Priority: <strong className={getPriorityColor(selectedTicket.priority)}>{selectedTicket.priority}</strong></span>
                      {selectedTicket.orderId && <span>Order: <strong>#{selectedTicket.orderId.substring(0, 8)}</strong></span>}
                      {selectedTicket.productId && (
                        <span>Product: <Link href={`/products/${selectedTicket.productId}`} className="font-bold text-primary-600 dark:text-primary-400 hover:underline">{products.find(p => p.id === selectedTicket.productId)?.name || selectedTicket.productId.substring(0, 8)}</Link></span>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2">
                    {selectedTicket.status !== 'in_progress' && selectedTicket.status !== 'closed' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                        className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 transition-all cursor-pointer"
                      >
                        Accept
                      </button>
                    )}
                    {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                        className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30 transition-all cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {selectedTicket.status !== 'closed' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}
                        className="text-xs font-bold text-red-705 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-905/30 transition-all cursor-pointer"
                      >
                        Close Ticket
                      </button>
                    )}
                  </div>
                </div>

                {/* Message list */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/25 dark:bg-gray-900/10 custom-scrollbar">
                  {/* Original Customer Question */}
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-650 dark:text-indigo-400 flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="bg-gray-105 dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs">{selectedTicket.customerName}</span>
                        <span className="text-[10px] text-gray-400">Buyer Query</span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-line text-gray-800 dark:text-gray-200">{selectedTicket.description}</p>
                      
                      {/* Ticket creation attachments */}
                      {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Buyer Attachments:</p>
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
                      const isMe = msg.senderRole === 'seller';
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                            isMe 
                              ? 'bg-amber-500 text-white' 
                              : msg.senderRole === 'buyer'
                              ? 'bg-indigo-150 text-indigo-850 dark:bg-indigo-950/20 dark:text-indigo-400'
                              : 'bg-primary-150 text-primary-850 dark:bg-primary-950/20 dark:text-primary-400'
                          }`}>
                            {isMe ? 'Me' : msg.senderRole === 'buyer' ? 'B' : 'A'}
                          </div>
                          <div className={`rounded-2xl p-4 shadow-sm ${
                            isMe
                              ? 'bg-amber-500 text-white rounded-tr-none'
                              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-850 rounded-tl-none'
                          }`}>
                            <div className="flex items-center gap-2 mb-1 justify-between">
                               <span className="font-bold text-xs">
                                {isMe ? 'You (Seller)' : msg.senderName}
                              </span>
                              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                isMe 
                                  ? 'bg-amber-600 text-amber-100' 
                                  : msg.senderRole === 'buyer'
                                  ? 'bg-indigo-100 text-indigo-850'
                                  : 'bg-primary-100 text-primary-855'
                              }`}>
                                {msg.senderRole}
                              </span>
                            </div>
                            <p className={`text-sm leading-relaxed whitespace-pre-line ${isMe ? 'text-white' : 'text-gray-805 dark:text-gray-200'}`}>{msg.message}</p>
                            
                            {/* Message Attachments */}
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
                                      <a key={idx} href={url} target="_blank" rel="noreferrer" className={`flex items-center gap-1.5 p-1.5 rounded-lg text-xs font-bold border ${isMe ? 'bg-amber-600 border-amber-500 text-white hover:underline' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-750 text-indigo-600 hover:underline'}`}>
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>Doc {idx + 1}</span>
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <span className={`block text-[9px] mt-2 text-right ${isMe ? 'text-amber-100' : 'text-gray-400'}`}>
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
                {selectedTicket.status !== 'closed' ? (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900">
                    {/* Attachments preview */}
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
                              onClick={() => removeAttachment(idx)}
                              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-250 dark:hover:bg-gray-700 rounded-full text-rose-500"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                      <label className="cursor-pointer p-2.5 bg-gray-50 hover:bg-gray-150 dark:bg-gray-850 dark:hover:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-750 text-gray-550 transition-all">
                        <input
                          type="file"
                          className="hidden"
                          disabled={uploadingFile}
                          onChange={handleFileUpload}
                        />
                        {uploadingFile ? (
                          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                        ) : (
                          <Paperclip className="w-5 h-5" />
                        )}
                      </label>
                      <input
                        type="text"
                        placeholder="Type a response to buyer..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() && chatAttachedUrls.length === 0}
                        className="bg-amber-500 hover:bg-amber-600 text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-dashed border-gray-200 dark:border-gray-750 rounded-2xl text-center text-xs font-semibold text-gray-500 dark:text-gray-400 m-4">
                    🔒 This ticket has been closed. Chat has ended and messaging is disabled.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-16 text-center shadow-sm h-full flex flex-col justify-center items-center">
                <MessageSquare className="w-16 h-16 text-amber-550 mb-4 opacity-40 animate-pulse" />
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Select a Buyer Query</h3>
                <p className="text-gray-550 mt-2 max-w-sm text-sm leading-relaxed">
                  Select a support query from the left panel to review buyer details and initiate conversation chat.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
