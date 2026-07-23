'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Users, 
  User, 
  Layout, 
  Type, 
  Loader, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  History,
  Check,
  AlertTriangle,
  Mail,
  Play,
  RotateCcw,
  Bold,
  Italic,
  Heading2,
  Link2,
  Trash2,
  TrendingUp,
  Inbox,
  Percent,
  Eye,
  X
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface Template {
  id: string;
  name: string;
  description: string;
  subject: string;
  icon: any;
  content: string;
}

interface CampaignHistoryItem {
  id: string;
  timestamp: string;
  target: string;
  subject: string;
  message: string;
  status: 'delivered' | 'failed';
}

const TEMPLATES: Template[] = [
  {
    id: 'welcome',
    name: 'Welcome Promo',
    description: 'Welcome new users with a stylish greeting and 15% discount code.',
    subject: '✨ Welcome to MicroCart! Here is your exclusive 15% off coupon',
    icon: Sparkles,
    content: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="background: #e0f2fe; color: #0284c7; font-size: 11px; font-weight: 850; padding: 6px 16px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.15em;">Special Gift</span>
    <h1 style="color: #0c4a6e; margin-top: 16px; margin-bottom: 8px; font-size: 32px; font-weight: 900; tracking-tight: -0.025em;">Welcome to MicroCart!</h1>
    <p style="color: #64748b; font-size: 16px; margin: 0;">We are absolutely thrilled to have you join our store network.</p>
  </div>
  
  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
  
  <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">Hello there,</p>
  <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">Thank you for registering! To kickstart your shopping experience, we are giving you an exclusive welcome discount voucher valid storewide on all product categories.</p>
  
  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px dashed #0ea5e9; border-radius: 16px; padding: 24px; text-align: center; margin: 32px 0;">
    <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #0369a1; font-weight: 800; display: block; margin-bottom: 8px;">Voucher Code</span>
    <span style="font-size: 32px; font-weight: 900; color: #0284c7; letter-spacing: 0.05em;">WELCOME15</span>
    <p style="color: #0369a1; font-size: 13px; margin: 8px 0 0 0; font-weight: 500;">Apply during checkout to save <b>15% off</b> your first order.</p>
  </div>
  
  <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">Simply copy and apply this code during checkout. Hurry up, this introductory discount is valid for the next 7 days only!</p>
  
  <div style="text-align: center; margin-bottom: 24px;">
    <a href="http://localhost:3000" style="background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 10px 20px -5px rgba(14, 165, 233, 0.3);">Shop Trending Items</a>
  </div>
  
  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
  
  <div style="text-align: center; font-size: 12px; color: #94a3b8;">
    <p style="margin: 0 0 8px 0;">You received this email because you registered on MicroCart.</p>
    <a href="#" style="color: #0ea5e9; text-decoration: none; font-weight: 600;">Unsubscribe from communications</a>
  </div>
</div>`
  },
  {
    id: 'launch',
    name: 'Tech Launch',
    description: 'Beautiful card-oriented layout to announce new gadget collections.',
    subject: '🚀 Introducing our Brand New Tech Collection - Shop Now!',
    icon: Play,
    content: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff;">
  <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; padding: 40px 32px; border-radius: 18px; text-align: center; margin-bottom: 32px;">
    <span style="background: rgba(255,255,255,0.2); color: #ffffff; font-size: 11px; font-weight: 800; padding: 6px 16px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.15em;">Fresh Drop</span>
    <h1 style="margin-top: 16px; margin-bottom: 8px; font-size: 32px; font-weight: 900;">New Arrivals Are Live!</h1>
    <p style="margin: 0; opacity: 0.9; font-size: 16px;">The Premium Tech Collection has officially landed.</p>
  </div>
  
  <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">Hi Tech Enthusiast,</p>
  <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">We have updated our marketplace catalog with premium electronics, cutting-edge accessories, and gadgets that blend perfectly with a modern lifestyle.</p>
  
  <div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin: 24px 0;">
    <h4 style="color: #1e293b; margin: 0 0 12px 0; font-size: 16px; font-weight: 700;">What makes this collection unique?</h4>
    <ul style="color: #475569; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
      <li>Ergonomic smart workspace accessories</li>
      <li>Fast wireless charging hubs & travel power items</li>
      <li>Limited collection launch with introductory pricing</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 32px 0;">
    <a href="http://localhost:3000/products" style="background: #4f46e5; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.3);">Explore New Tech</a>
  </div>
  
  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
  
  <div style="text-align: center; font-size: 12px; color: #94a3b8;">
    <p style="margin: 0 0 8px 0;">Free standard shipping applies to all orders over $50.</p>
    <a href="#" style="color: #4f46e5; text-decoration: none; font-weight: 600;">Unsubscribe from marketing list</a>
  </div>
</div>`
  },
  {
    id: 'sale',
    name: 'Flash Sale',
    description: 'Urgent promotional copy with an active discount discount code CTA.',
    subject: '⚡ FLASH SALE: 24 Hours Only - Save 25% Storewide!',
    icon: Percent,
    content: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="background: #fee2e2; color: #ef4444; font-size: 11px; font-weight: 800; padding: 6px 16px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.15em;">Time Sensitive</span>
    <h1 style="color: #991b1b; margin-top: 16px; margin-bottom: 8px; font-size: 34px; font-weight: 900; tracking-tight: -0.03em;">25% OFF STOREWIDE</h1>
    <p style="color: #7f1d1d; font-size: 16px; margin: 0; font-weight: 600;">Flash sale concludes in exactly 24 hours.</p>
  </div>
  
  <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">Dear Member,</p>
  <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">Our highly anticipated seasonal clearance is officially live. For the next day only, enjoy <b>25% off</b> across all verified seller storefronts.</p>
  
  <div style="background: #fff5f5; border: 2px dashed #f87171; border-radius: 16px; padding: 24px; text-align: center; margin: 32px 0;">
    <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #991b1b; font-weight: 800; display: block; margin-bottom: 8px;">Clearance Coupon Code</span>
    <span style="font-size: 36px; font-weight: 900; color: #ef4444; letter-spacing: 0.1em;">FLASH25</span>
    <p style="color: #b91c1c; font-size: 13px; margin: 8px 0 0 0; font-weight: 600;">Type coupon at payment step.</p>
  </div>
  
  <div style="text-align: center; margin-bottom: 24px;">
    <a href="http://localhost:3000" style="background: #ef4444; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 10px 20px -5px rgba(239, 68, 68, 0.3);">Access The Sale Now</a>
  </div>
  
  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
  
  <div style="text-align: center; font-size: 12px; color: #94a3b8;">
    <p style="margin: 0 0 8px 0;">To opt out of promotional broadcasts, click below.</p>
    <a href="#" style="color: #ef4444; text-decoration: none; font-weight: 600;">Unsubscribe instantly</a>
  </div>
</div>`
  },
  {
    id: 'maintenance',
    name: 'Infrastructure Notice',
    description: 'Formal announcement layout styled with a warning card.',
    subject: '🔧 Scheduled System Maintenance Notice - MicroCart',
    icon: AlertCircle,
    content: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff;">
  <div style="border-left: 4px solid #d97706; padding: 16px; background-color: #fffbeb; border-radius: 8px; margin-bottom: 28px;">
    <h3 style="color: #b45309; margin: 0; font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">🔧 Planned Infrastructure Upgrade</h3>
  </div>
  
  <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">Dear User,</p>
  <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">To improve payment gateway integrations and optimize stock syncing speeds, we will be performing database system optimization updates.</p>
  
  <div style="background: #fafafa; border-radius: 12px; padding: 20px; border: 1px solid #f1f5f9; margin-bottom: 28px;">
    <h4 style="color: #1e293b; margin: 0 0 12px 0; font-size: 14px; font-weight: 700; text-transform: uppercase;">Maintenance Window Settings:</h4>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; color: #64748b; font-weight: bold; width: 130px;">Scheduled Date:</td>
        <td style="padding: 10px 0; color: #334155;">Sunday, July 19th</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Expected Hours:</td>
        <td style="padding: 10px 0; color: #334155;">02:00 AM - 04:00 AM EST</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Potential Offline:</td>
        <td style="padding: 10px 0; color: #334155;">Checking out and seller shop settings will be offline.</td>
      </tr>
    </table>
  </div>
  
  <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">No actions are required on your part. All store listings and accounts will remain safe and secure during this window.</p>
  <p style="color: #64748b; font-size: 14px; line-height: 1.6;">If you have immediate questions, feel free to open a support ticket from your control panel.</p>
  
  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
  
  <div style="text-align: center; font-size: 12px; color: #94a3b8;">
    <p style="margin: 0;">MicroCart Administrator Team</p>
  </div>
</div>`
  }
];

export default function AdminCommunications() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  
  // Real platform users list
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [campaignHistory, setCampaignHistory] = useState<CampaignHistoryItem[]>([]);
  
  // For overlay modal viewing past campaigns in high fidelity
  const [historyPreviewItem, setHistoryPreviewItem] = useState<CampaignHistoryItem | null>(null);

  const [formData, setFormData] = useState({
    target: 'all',
    subject: '',
    message: '',
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to update draft state & cache in localStorage
  const updateFormData = (newData: typeof formData) => {
    setFormData(newData);
    try {
      localStorage.setItem('campaign_draft', JSON.stringify(newData));
    } catch (e) {
      console.error(e);
    }
  };

  // Load real users, campaign history, and saved drafts on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingUsers(true);
      try {
        const res = await adminAPI.getAllUsers();
        if (res.data && Array.isArray(res.data)) {
          setUsers(res.data);
        }
      } catch (e) {
        console.error('Failed to fetch platform users:', e);
      } finally {
        setLoadingUsers(false);
      }

      try {
        const savedDraft = localStorage.getItem('campaign_draft');
        if (savedDraft) {
          setFormData(JSON.parse(savedDraft));
        }
      } catch (e) {
        console.error('Failed to load draft from localStorage', e);
      }

      try {
        const savedHistory = localStorage.getItem('campaign_dispatch_history');
        if (savedHistory) {
          setCampaignHistory(JSON.parse(savedHistory));
        }
      } catch (e) {
        console.error('Failed to load campaign history from localStorage', e);
      }
    };
    fetchInitialData();

    // Close suggestions dropdown on click outside
    const handleOutsideClick = () => setShowSuggestions(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const saveToHistory = (item: Omit<CampaignHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: CampaignHistoryItem = {
      ...item,
      id: `camp_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    const updated = [newItem, ...campaignHistory];
    setCampaignHistory(updated);
    try {
      localStorage.setItem('campaign_dispatch_history', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all campaign history records?')) {
      setCampaignHistory([]);
      localStorage.removeItem('campaign_dispatch_history');
      toast.success('Campaign history cleared');
    }
  };

  // Insertion Helper for Editor Toolbar
  const insertTag = (startTag: string, endTag: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = startTag + selectedText + endTag;

    updateFormData({
      ...formData,
      message: text.substring(0, start) + replacement + text.substring(end),
    });

    // Focus and select range
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + startTag.length,
        start + startTag.length + selectedText.length
      );
    }, 0);
  };

  const loadTemplate = (tmpl: Template) => {
    updateFormData({
      ...formData,
      subject: tmpl.subject,
      message: tmpl.content
    });
    toast.success(`Loaded "${tmpl.name}" Template`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) {
      toast.error('Subject and message are required');
      return;
    }

    setLoading(true);
    try {
      await adminAPI.sendCommunications(formData);
      toast.success('Campaign dispatched successfully!');
      
      saveToHistory({
        target: formData.target,
        subject: formData.subject,
        message: formData.message,
        status: 'delivered'
      });

      // Clear draft cache since it is successfully sent
      try {
        localStorage.removeItem('campaign_draft');
      } catch (e) {}

      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send campaign');
      saveToHistory({
        target: formData.target,
        subject: formData.subject,
        message: formData.message,
        status: 'failed'
      });
    } finally {
      setLoading(false);
    }
  };

  // Deliverability and Quality Check Engine
  const spamWords = ['free', 'cash', 'money', 'viagra', 'guaranteed', 'no credit', 'earn cash', 'make money', 'buy now', 'urgent'];
  const detectedSpam = spamWords.filter(word => formData.message.toLowerCase().includes(word));
  
  const hasEmoji = /[\uD800-\uDFFF\u2600-\u27BF]/.test(formData.subject);
  const subjectLen = formData.subject.length;
  const isSubjectValidRange = subjectLen >= 10 && subjectLen <= 50;
  const hasUnsubscribe = formData.message.toLowerCase().includes('unsubscribe') || formData.message.toLowerCase().includes('opt out');

  // Compute deliverability score
  let deliverabilityScore = 100;
  if (formData.subject) {
    if (subjectLen < 10) deliverabilityScore -= 15;
    if (subjectLen > 50) deliverabilityScore -= 10;
    if (!hasEmoji) deliverabilityScore -= 10;
  } else {
    deliverabilityScore = 0;
  }
  if (formData.message) {
    if (detectedSpam.length > 0) deliverabilityScore -= Math.min(detectedSpam.length * 15, 30);
    if (!hasUnsubscribe) deliverabilityScore -= 20;
  } else {
    deliverabilityScore = 0;
  }

  // Dynamic Metrics & Audience Counts Calculations
  const buyersList = users.filter(u => u.role === 'buyer');
  const sellersList = users.filter(u => u.role === 'seller');
  
  const totalReachCount = users.length || 1248;
  const totalBuyersCount = buyersList.length || 842;
  const totalSellersCount = sellersList.length || 406;

  // Active Target Count
  const getActiveTargetCount = () => {
    if (formData.target === 'all') return totalReachCount;
    if (formData.target === 'buyers') return totalBuyersCount;
    if (formData.target === 'sellers') return totalSellersCount;
    // custom address
    return formData.target.trim() !== '' ? 1 : 0;
  };

  const activeTargetCount = getActiveTargetCount();

  // Dynamic Open Rate
  const getDynamicOpenRate = () => {
    if (!formData.subject && !formData.message) return 48.2;
    let base = 42.5;
    if (hasEmoji) base += 8.2;
    if (isSubjectValidRange) base += 5.1;
    if (subjectLen > 50) base -= 4.5;
    if (detectedSpam.length > 0) base -= (detectedSpam.length * 6.5);
    return Math.max(5.0, Math.min(98.5, parseFloat(base.toFixed(1))));
  };

  // Dynamic CTR Rate
  const getDynamicCTR = () => {
    if (!formData.subject && !formData.message) return 18.5;
    let base = 10.4;
    const hasCTA = formData.message.toLowerCase().includes('background: linear-gradient') || formData.message.toLowerCase().includes('display: inline-block');
    const hasLink = formData.message.toLowerCase().includes('<a href=');
    if (hasCTA) base += 8.2;
    else if (hasLink) base += 3.1;
    if (getDynamicOpenRate() < 25) base -= 3.5;
    return Math.max(1.0, Math.min(35.0, parseFloat(base.toFixed(1))));
  };

  // Dynamic Deliverability Rate
  const getDynamicDeliverability = () => {
    if (!formData.subject && !formData.message) return 99.8;
    let base = 99.8;
    if (detectedSpam.length > 0) base -= (detectedSpam.length * 7.5);
    if (!hasUnsubscribe) base -= 10.0;
    return Math.max(30.0, Math.min(99.9, parseFloat(base.toFixed(1))));
  };

  // Dynamic Target Avatars List
  const getTargetUsersList = () => {
    if (formData.target === 'all') return users;
    if (formData.target === 'buyers') return buyersList;
    if (formData.target === 'sellers') return sellersList;
    
    // Custom single email target match
    const matchedUser = users.find(u => u.email.toLowerCase() === formData.target.trim().toLowerCase());
    if (matchedUser) return [matchedUser];
    return [];
  };

  const currentTargetUsers = getTargetUsersList();
  const avatarLimit = 4;
  const displayAvatars = currentTargetUsers.slice(0, avatarLimit);
  const excessCount = currentTargetUsers.length > avatarLimit ? currentTargetUsers.length - avatarLimit : 0;

  // Custom Direct target address suggestions list
  const getSuggestions = () => {
    if (['all', 'buyers', 'sellers'].includes(formData.target)) return [];
    if (formData.target.trim() === '') return [];
    return users.filter(u => 
      u.email.toLowerCase().includes(formData.target.toLowerCase()) && 
      u.email.toLowerCase() !== formData.target.toLowerCase()
    ).slice(0, 5);
  };
  const suggestions = getSuggestions();

  // Dynamic percentages for demographics bar
  const totalCount = users.length || 1;
  const buyersPercentage = parseFloat(((buyersList.length / totalCount) * 100).toFixed(1)) || 67.5;
  const sellersPercentage = parseFloat(((sellersList.length / totalCount) * 100).toFixed(1)) || 32.5;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-gray-900 via-sky-950 to-gray-900 dark:from-slate-950 dark:via-sky-950/40 dark:to-slate-950 rounded-3xl p-8 shadow-xl relative overflow-hidden border border-sky-900/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-sky-500/10 border border-sky-400/20 text-sky-400 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
              Campaign Operations
            </span>
            <span className="bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div> Live Gateway
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
            Email Marketing <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-300">Campaign Hub</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Design and send premium promotional campaigns, news updates, or system notifications to platform shoppers and sellers.
          </p>
        </div>
      </div>

      {/* Dynamic Analytics Snapshot Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Reach', value: activeTargetCount.toLocaleString(), desc: 'Current target recipients', trend: 'Segment', icon: Users, color: 'text-sky-500 bg-sky-500/5' },
          { label: 'Projected Open Rate', value: `${getDynamicOpenRate()}%`, desc: 'Subject lines analytics estimate', trend: getDynamicOpenRate() > 40 ? 'Optimal' : 'Low', icon: Mail, color: 'text-indigo-500 bg-indigo-500/5' },
          { label: 'Projected CTR', value: `${getDynamicCTR()}%`, desc: 'CTA clicks estimate', trend: getDynamicCTR() > 15 ? '+4.2%' : 'Steady', icon: TrendingUp, color: 'text-violet-500 bg-violet-500/5' },
          { label: 'Deliverability Rate', value: `${getDynamicDeliverability()}%`, desc: 'Gateway deliverability score', trend: getDynamicDeliverability() > 95 ? 'Excellent' : 'Spam Warning', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/5' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex items-center justify-between group hover:border-sky-500/20 hover:shadow-md transition-all duration-300">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">{stat.label}</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white transition-all">{stat.value}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{stat.desc}</span>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <div className={`p-3 rounded-xl ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                stat.trend === 'Low' || stat.trend === 'Spam Warning' 
                  ? 'text-rose-500 bg-rose-500/5' 
                  : 'text-emerald-500 bg-emerald-500/5'
              }`}>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Editor & Preview Hub */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tab Navigation Controls (Campaign Composer & Dispatch History) */}
          <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 shadow-inner">
            {[
              { id: 'editor', label: 'Campaign Composer', icon: Layout },
              { id: 'history', label: 'Dispatch History', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200/20 dark:border-slate-800'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'history' && campaignHistory.length > 0 && (
                  <span className="bg-sky-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                    {campaignHistory.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TAB 1: CAMPAIGN COMPOSER */}
          {activeTab === 'editor' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <form onSubmit={handleSubmit} className="divide-y divide-slate-100 dark:divide-slate-800">
                
                {/* Editor Content Area */}
                <div className="p-8 space-y-6">
                  
                  {/* Target Audience selection */}
                  <div className="space-y-3">
                    <label className="flex items-center text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                      <Users className="w-4 h-4 mr-2 text-sky-500" /> Target Recipients
                    </label>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'all', name: 'All Users', desc: `${totalReachCount.toLocaleString()} Users` },
                        { id: 'buyers', name: 'Buyers Only', desc: `${totalBuyersCount.toLocaleString()} buyers` },
                        { id: 'sellers', name: 'Sellers Only', desc: `${totalSellersCount.toLocaleString()} sellers` },
                        { id: 'custom', name: 'Direct Email', desc: 'Custom Target' }
                      ].map((t) => {
                        const isSelected = formData.target === t.id || (t.id === 'custom' && !['all', 'buyers', 'sellers'].includes(formData.target));
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => updateFormData({ ...formData, target: t.id === 'custom' ? '' : t.id })}
                            className={`p-4 rounded-2xl text-left border flex flex-col justify-between transition-all duration-200 ${
                              isSelected
                                ? 'bg-sky-50 dark:bg-sky-950/20 border-sky-500 ring-2 ring-sky-500/10'
                                : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className={`text-xs font-black uppercase tracking-tight ${isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`}>
                              {t.name}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">{t.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                    
                    {!['all', 'buyers', 'sellers'].includes(formData.target) && (
                      <div className="relative animate-scale-in pt-1">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          placeholder="e.g. customer@example.com"
                          value={formData.target}
                          onClick={(e) => { e.stopPropagation(); setShowSuggestions(true); }}
                          onChange={(e) => {
                            updateFormData({ ...formData, target: e.target.value });
                            setShowSuggestions(true);
                          }}
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none text-sm font-semibold transition-all text-slate-800 dark:text-white"
                        />
                        
                        {/* Auto-suggest dropdown menu */}
                        {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-slide-up-small">
                            <div className="p-2.5 text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                              Matching Registered Users
                            </div>
                            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                              {suggestions.map((u) => (
                                <li 
                                  key={u.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateFormData({ ...formData, target: u.email });
                                    setShowSuggestions(false);
                                  }}
                                  className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer group"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200/50">
                                      <img 
                                        src={u.profileImage || `https://ui-avatars.com/api/?name=${u.firstName}+${u.lastName}&background=random`} 
                                        alt="" 
                                        className="w-full h-full object-cover" 
                                      />
                                    </div>
                                    <div className="text-left">
                                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block leading-none">{u.firstName} {u.lastName}</span>
                                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{u.email}</span>
                                    </div>
                                  </div>
                                  <span className="text-[9px] font-bold text-sky-500 uppercase tracking-tighter bg-sky-50 dark:bg-sky-950/20 px-1.5 py-0.5 rounded">
                                    {u.role}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Subject Line */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                        <Type className="w-4 h-4 mr-2 text-sky-500" /> Subject Line
                      </label>
                      <span className={`text-[10px] font-bold ${isSubjectValidRange ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {subjectLen} / 50 characters
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 🎁 Big Summer Clearance starts today!"
                      value={formData.subject}
                      onChange={(e) => updateFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 rounded-2xl focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none text-md font-bold placeholder:font-normal transition-all text-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Email Content HTML composer */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="flex items-center text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                        <Layout className="w-4 h-4 mr-2 text-sky-500" /> HTML Content Editor
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Clear the composer content?')) {
                            updateFormData({ ...formData, subject: '', message: '' });
                            toast.success('Composer fields cleared');
                          }
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Clear Editor
                      </button>
                    </div>

                    {/* Quick Formatting Editor Toolbar */}
                    <div className="flex flex-wrap gap-1 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => insertTag('<b>', '</b>')}
                        title="Insert Bold Text"
                        className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<i>', '</i>')}
                        title="Insert Italic Text"
                        className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<h2>', '</h2>')}
                        title="Insert H2 Heading"
                        className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        <Heading2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<a href="https://example.com" style="color: #0284c7; text-decoration: underline;">', '</a>')}
                        title="Insert Link tag"
                        className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<br>')}
                        title="Insert Line Break"
                        className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black"
                      >
                        BREAK
                      </button>
                      <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 align-middle self-center"></div>
                      <button
                        type="button"
                        onClick={() => insertTag(
                          '<div style="text-align: center; margin: 24px 0;"><a href="https://example.com" style="background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">',
                          '</a></div>'
                        )}
                        title="Insert CTA Button"
                        className="px-2.5 py-1 text-[10px] font-bold text-sky-600 bg-sky-500/10 hover:bg-sky-500/20 dark:text-sky-400 dark:bg-sky-950/30 rounded-lg transition-colors flex items-center gap-1 self-center"
                      >
                        + Insert CTA Button
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag(
                          '<div style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 30px;"><p>You received this because you are a user. Click below to opt-out.</p><a href="#" style="color: #0ea5e9; text-decoration: none;">Unsubscribe instantly</a></div>'
                        )}
                        title="Insert Unsubscribe Footer"
                        className="px-2.5 py-1 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-400 dark:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 self-center ml-auto"
                      >
                        + Add Unsubscribe Footer
                      </button>
                    </div>

                    {/* Textarea container */}
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        required
                        rows={14}
                        placeholder="Write your email body in HTML style... E.g. <div style='padding: 20px;'><h3>Special Announcement</h3><p>Hello...</p></div>"
                        value={formData.message}
                        onChange={(e) => updateFormData({ ...formData, message: e.target.value })}
                        className="w-full px-6 py-6 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 rounded-2xl focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none text-sm leading-relaxed font-mono text-slate-800 dark:text-slate-100 custom-scrollbar min-h-[320px]"
                      />
                      <div className="absolute bottom-4 right-4 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white/70 dark:bg-slate-900/70 px-2 py-1 rounded backdrop-blur-sm">
                        {formData.message.length} Characters
                      </div>
                    </div>
                  </div>

                  {/* HTML Template Library Section */}
                  <div className="space-y-3 pt-2">
                    <span className="flex items-center text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                      <Sparkles className="w-4 h-4 mr-2 text-sky-500" /> Premium Design Library (Load Presets)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {TEMPLATES.map((tmpl) => {
                        const Icon = tmpl.icon;
                        return (
                          <div
                            key={tmpl.id}
                            onClick={() => loadTemplate(tmpl)}
                            className="p-4 bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800/80 cursor-pointer flex gap-4 transition-all duration-200 hover:scale-[1.01] hover:border-sky-500/20 group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center flex-shrink-0 text-sky-500 group-hover:scale-110 transition-transform border border-slate-100 dark:border-slate-800">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                {tmpl.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">
                                {tmpl.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Footer Send Action */}
                <div className="p-6 bg-slate-50/30 dark:bg-slate-800/20 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || sent || !formData.subject || !formData.message || activeTargetCount === 0}
                    className={`w-full sm:w-auto py-4 px-10 rounded-2xl font-black text-white shadow-xl flex items-center justify-center space-x-3 transition-all transform active:scale-95 ${
                      sent 
                        ? 'bg-emerald-500 shadow-emerald-500/20' 
                        : 'bg-sky-600 hover:bg-sky-700 shadow-sky-500/25 hover:-translate-y-0.5'
                    } disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed`}
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Sending Broadcast...</span>
                      </>
                    ) : sent ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 animate-bounce" />
                        <span>Dispatched Successfully!</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Dispatch Campaign</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* TAB 2: DISPATCH HISTORY */}
          {activeTab === 'history' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl p-8 space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-md text-slate-800 dark:text-white">Broadcast Campaign Log</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Audit past dispatches stored in local memory.</p>
                </div>
                {campaignHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-xs font-bold text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Logs</span>
                  </button>
                )}
              </div>

              {campaignHistory.length === 0 ? (
                <div className="p-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
                  <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <History className="w-6 h-6 stroke-1.5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-700 dark:text-slate-300">No campaigns recorded yet</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                      Whenever you click "Dispatch Campaign" successfully, a detailed transaction log will persist in this browser.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaignHistory.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-5 border border-slate-100 dark:border-slate-800/80 rounded-2xl bg-slate-50/30 dark:bg-slate-800/20 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/50 pb-3">
                        <div className="space-y-1">
                          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                            {item.subject}
                          </h4>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <span className="font-bold text-sky-500 uppercase">Target: {item.target}</span> • 
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {item.status === 'delivered' ? (
                            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" /> Delivered
                            </span>
                          ) : (
                            <span className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" /> Failed
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Message Snippet</span>
                        <div className="text-xs font-mono bg-slate-100 dark:bg-slate-900 p-4 rounded-xl max-h-[140px] overflow-y-auto text-slate-600 dark:text-slate-400 leading-relaxed border border-slate-200/50 dark:border-slate-800/80">
                          {item.message}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                        <button
                          type="button"
                          onClick={() => setHistoryPreviewItem(item)}
                          className="px-3.5 py-1.5 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-500/5 hover:bg-emerald-500/10 dark:text-emerald-400 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Quick Render Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateFormData({
                              target: item.target,
                              subject: item.subject,
                              message: item.message
                            });
                            setActiveTab('editor');
                            toast.success('Campaign loaded back into Composer');
                          }}
                          className="px-3.5 py-1.5 text-[10px] font-bold text-sky-600 hover:text-sky-700 bg-sky-500/5 hover:bg-sky-500/10 dark:text-sky-400 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Load into Composer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Sidebar Info, Compliance Check, Deliverability Engine */}
        <div className="space-y-6">
          
          {/* Deliverability Quality Check Circle */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-md text-slate-800 dark:text-slate-100 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Deliverability Assistant
              </span>
              <span className="text-[10px] font-black text-sky-600 bg-sky-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                Real-Time
              </span>
            </div>

            {/* Score circle layout */}
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
                
                {/* SVG Radial Score */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="stroke-slate-100 dark:stroke-slate-800"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className={`transition-all duration-500 ${
                      deliverabilityScore >= 80 ? 'stroke-emerald-500' :
                      deliverabilityScore >= 50 ? 'stroke-amber-500' : 'stroke-rose-500'
                    }`}
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - deliverabilityScore / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-lg font-black block tracking-tighter text-slate-800 dark:text-white">
                    {deliverabilityScore}%
                  </span>
                  <span className="text-[8px] font-bold uppercase text-slate-400 tracking-wider">
                    Score
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                  {deliverabilityScore >= 85 ? 'Excellent Delivery Grade' :
                   deliverabilityScore >= 60 ? 'Moderate Spam Warning' : 'Poor Campaign Health'}
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                  Avoid simple HTML triggers, ensure subject lines fit mobile displays, and avoid blacklist keywords.
                </p>
              </div>
            </div>

            {/* Deliverability Checklist */}
            <div className="space-y-3 pt-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                Deliverability Checklist
              </span>
              
              <ul className="space-y-2.5 text-[11px]">
                
                {/* Subject Length Check */}
                <li className="flex items-start gap-2.5">
                  {isSubjectValidRange ? (
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-extrabold block text-slate-700 dark:text-slate-300">Subject line length ({subjectLen} chars)</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">Subject is best between 10-50 characters to avoid truncation.</span>
                  </div>
                </li>

                {/* Subject Emoji Check */}
                <li className="flex items-start gap-2.5">
                  {hasEmoji ? (
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-extrabold block text-slate-700 dark:text-slate-300">Emoji in subject line</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">Emojis increase email open rates by an average of 26%.</span>
                  </div>
                </li>

                {/* Spam Word Check */}
                <li className="flex items-start gap-2.5">
                  {detectedSpam.length === 0 ? (
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-extrabold block text-slate-700 dark:text-slate-300">Spam Trigger keywords check</span>
                    {detectedSpam.length === 0 ? (
                      <span className="text-[9px] text-slate-400 dark:text-slate-500">No common spam triggers detected. Good job.</span>
                    ) : (
                      <span className="text-[9px] text-rose-500 font-medium">
                        Remove triggers: <span className="font-bold underline">{detectedSpam.join(', ')}</span> (may flag spam filters).
                      </span>
                    )}
                  </div>
                </li>

                {/* Unsubscribe Opt Out Footer */}
                <li className="flex items-start gap-2.5">
                  {hasUnsubscribe ? (
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-extrabold block text-slate-700 dark:text-slate-300">Opt-out / Unsubscribe presence</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">CAN-SPAM act compliance requires a clickable opt-out option.</span>
                  </div>
                </li>

              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Campaign History Popup Modal */}
      {historyPreviewItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-scale-in">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
              <div className="space-y-1">
                <h3 className="text-md font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-sky-500" />
                  Sent Campaign Preview
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  Dispatched on {new Date(historyPreviewItem.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryPreviewItem(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Inbox Viewer layout */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950/60">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-md overflow-hidden max-h-[60vh] overflow-y-auto">
                
                {/* Inbox metadata info */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2">
                  <div className="flex gap-2">
                    <span className="text-slate-400 dark:text-slate-500 font-bold w-14 flex-shrink-0">Subject:</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{historyPreviewItem.subject}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-400 dark:text-slate-500 font-bold w-14 flex-shrink-0">From:</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      MicroCart Administrator Hub &lt;noreply@microcart.com&gt;
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-400 dark:text-slate-500 font-bold w-14 flex-shrink-0">To:</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400 uppercase tracking-tighter">
                      {historyPreviewItem.target === 'all' ? 'ALL USERS' : 
                       historyPreviewItem.target === 'buyers' ? 'BUYERS' : 
                       historyPreviewItem.target === 'sellers' ? 'SELLERS' : 
                       historyPreviewItem.target}
                    </span>
                  </div>
                </div>

                {/* Rendered HTML */}
                <div className="p-6 bg-white text-slate-800">
                  <div 
                    dangerouslySetInnerHTML={{ __html: historyPreviewItem.message }} 
                    className="prose prose-sm max-w-none"
                  />
                </div>

              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  updateFormData({
                    target: historyPreviewItem.target,
                    subject: historyPreviewItem.subject,
                    message: historyPreviewItem.message
                  });
                  setHistoryPreviewItem(null);
                  setActiveTab('editor');
                  toast.success('Campaign loaded back into Composer');
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-sky-600 hover:bg-sky-700 transition-all flex items-center gap-1.5 shadow-md shadow-sky-500/10"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Load into Composer</span>
              </button>
              <button
                type="button"
                onClick={() => setHistoryPreviewItem(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
