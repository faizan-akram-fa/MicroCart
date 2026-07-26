'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Terminal, 
  Activity, 
  Clock, 
  Database, 
  Cpu, 
  AlertCircle, 
  CheckCircle2, 
  Loader,
  RefreshCcw,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  BarChart2
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SystemLogs() {
  const [activeCategory, setActiveCategory] = useState<'activity' | 'technical'>('activity');
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [technicalLogs, setTechnicalLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeCategory]);

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (activeCategory === 'activity') {
        const res = await adminAPI.getActivityLogs();
        setActivityLogs(res.data || []);
      } else {
        const res = await adminAPI.getTechnicalLogs();
        setTechnicalLogs(res.data || []);
      }
    } catch (error) {
      if (!silent) toast.error(`Failed to load ${activeCategory} logs`);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const filteredLogs = activeCategory === 'activity' 
    ? activityLogs.filter(log => (log.details || '').toLowerCase().includes(searchTerm.toLowerCase()) || (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) || (log.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()))
    : technicalLogs.filter(log => (log.msg || '').toLowerCase().includes(searchTerm.toLowerCase()) || (log.service || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Logs</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Audit trail and technical system health monitoring.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a 
            href={typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && window.location.hostname !== '127.0.0.1'
              ? `${window.location.protocol}//${window.location.hostname}/grafana/d/microcart-monitoring`
              : 'http://localhost:3010/d/microcart-monitoring'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <BarChart2 className="w-4 h-4 mr-2" />
            View Live Monitoring
            <ExternalLink className="w-3.5 h-3.5 ml-2 opacity-80" />
          </a>

          <div className="flex bg-white dark:bg-gray-800 p-1 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
             <button 
              onClick={() => setActiveCategory('activity')}
              className={`flex items-center px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeCategory === 'activity' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
             >
              <Activity className="w-4 h-4 mr-2" />
              ACTIVITY
             </button>
             <button 
              onClick={() => setActiveCategory('technical')}
              className={`flex items-center px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeCategory === 'technical' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
             >
              <Cpu className="w-4 h-4 mr-2" />
              TECHNICAL
             </button>
          </div>
        </div>
      </div>

      {/* Filter and Content */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col min-h-[600px] overflow-hidden">
        {/* Log Toolbar */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/30 dark:bg-gray-800/20">
           <div className="relative w-full md:w-[400px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search logs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm shadow-sm"
              />
           </div>
           <div className="flex items-center space-x-4">
              <button onClick={() => fetchLogs()} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all shadow-sm">
                <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button className="flex items-center px-4 py-2 text-xs font-bold bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl shadow-sm hover:shadow-md transition-all">
                <Filter className="w-4 h-4 mr-2" />
                FILTER
              </button>
           </div>
        </div>

        {/* Log Content */}
        <div className="flex-1 overflow-y-auto p-2">
           {loading && activeCategory === 'activity' ? (
             <div className="flex flex-col items-center justify-center h-full py-20">
                <Loader className="w-10 h-10 text-primary-600 animate-spin mb-4" />
                <p className="text-gray-400 text-sm font-medium">Parsing system events...</p>
             </div>
           ) : (
             <div className="space-y-1">
               {filteredLogs.map((log: any, i: number) => (
                 <div key={log.id || i} className="group flex items-start space-x-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-all animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                    <div className="mt-1 flex-shrink-0">
                       <div className={`p-2 rounded-xl bg-opacity-10 dark:bg-opacity-20 ${
                          activeCategory === 'activity' 
                            ? 'bg-blue-500 text-blue-500' 
                            : (log.type === 'error' ? 'bg-rose-500 text-rose-500' : log.type === 'warn' ? 'bg-amber-500 text-amber-500' : 'bg-emerald-500 text-emerald-500')
                       }`}>
                          {activeCategory === 'activity' ? <Activity className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
                       </div>
                    </div>
                    
                    <div className="flex-1">
                       <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                             <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                activeCategory === 'activity'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                  : (log.type === 'error' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : log.type === 'warn' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400')
                             }`}>
                                {activeCategory === 'activity' ? (log.action || '').replace(/_/g, ' ') : log.service}
                             </span>
                             {activeCategory === 'activity' && log.userEmail && (
                               <span className="text-[11px] font-semibold text-primary-600 dark:text-primary-400">
                                 {log.userEmail}
                               </span>
                             )}
                             <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                             <span className="text-[10px] font-bold text-gray-400 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : log.time}
                             </span>
                          </div>
                          {activeCategory === 'activity' && log.id && (
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-gray-300">ID: {String(log.id).slice(-8)}</span>
                          )}
                       </div>
                       <p className={`text-sm ${activeCategory === 'technical' ? 'font-mono text-xs break-all text-emerald-600 dark:text-emerald-400 bg-gray-50 dark:bg-gray-950/60 p-2.5 rounded-xl border border-gray-200 dark:border-gray-800' : 'font-medium text-gray-700 dark:text-gray-300'} leading-relaxed mt-1`}>
                         {activeCategory === 'activity' ? log.details : log.msg}
                       </p>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-2 text-gray-300 hover:text-primary-500 transition-colors">
                          <ArrowRight className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
               ))}
               
               {filteredLogs.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-40">
                    <Database className="w-12 h-12 text-gray-100 dark:text-gray-800 mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No logs found in this category</p>
                 </div>
               )}
             </div>
           )}
        </div>

        {/* Console-like Footer */}
        <div className="p-4 bg-gray-950 text-emerald-500 font-mono text-[10px] flex flex-wrap items-center justify-between gap-4 border-t border-gray-800">
           <div className="flex items-center space-x-6">
              <span className="flex items-center animate-pulse"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span> STREAMING ACTIVE</span>
              <span className="text-gray-600">PROMETHEUS: :9090</span>
              <span className="text-gray-600">GRAFANA: :3010</span>
              <span className="text-gray-600">LOKI: :3100</span>
           </div>
           <a 
             href="http://localhost:3010/d/microcart-monitoring"
             target="_blank"
             rel="noopener noreferrer"
             className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 transition-colors uppercase tracking-widest bg-amber-950/40 border border-amber-800/40 px-3 py-1 rounded-lg"
           >
             <BarChart2 className="w-3.5 h-3.5" />
             <span>Open Grafana Live Dashboard</span>
             <ExternalLink className="w-3 h-3" />
           </a>
        </div>
      </div>
    </div>
  );
}
