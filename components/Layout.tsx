
import React, { useState } from 'react';
import { LayoutDashboard, GraduationCap, Users, Calculator, BrainCircuit, X, Megaphone, AlertTriangle, Briefcase, LogOut, Sun, Moon, FileText, Bell, ChevronDown, ChevronRight, UserPlus, Settings } from 'lucide-react';
import { User, Notification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, currentUser, onLogout, isDarkMode, toggleDarkMode, notifications, setNotifications }) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['trainings', 'instructors', 'crm']);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const toggleMenu = (id: string) => {
    setExpandedMenus(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
    { 
        id: 'trainings', 
        label: 'Eğitimler', 
        icon: GraduationCap, 
        subItems: [
            { id: 'trainings-active', label: 'Aktif Eğitimler' },
            { id: 'trainings-completed', label: 'Sonlanan Eğitimler' },
            { id: 'trainings-planned', label: 'Planlanan Eğitimler' },
        ] 
    },
    { 
        id: 'instructors', 
        label: 'Eğitmenler', 
        icon: Briefcase, 
        subItems: [
            { id: 'instructors-active', label: 'Anlaşmalı Eğitmenler' },
            { id: 'instructors-candidates', label: 'Görüşmedeki Eğitmenler' },
        ] 
    },
    { 
        id: 'crm', 
        label: 'Müşteri Yönetimi', 
        icon: Users, 
        subItems: [
            { id: 'participants-leads', label: 'Katılımcı Havuzu (Adaylar)' },
            { id: 'participants-future', label: 'Gelecek Eğitime Katılacaklar' },
            { id: 'participants-registered', label: 'Kesin Kayıtlılar' },
        ] 
    },
    { id: 'documents', label: 'Belgelendirme Takibi', icon: FileText },
    { id: 'ads', label: 'Reklam Takibi', icon: Megaphone },
    { id: 'financials', label: 'Finans ve Rapor', icon: Calculator },
    { id: 'alerts', label: 'Uyarılar', icon: AlertTriangle },
    { id: 'ai-assistant', label: 'AI Asistan', icon: BrainCircuit },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-200 overflow-hidden font-sans">
      <aside className="hidden md:flex flex-col w-64 bg-pa-900 dark:bg-slate-950 text-white h-full shadow-xl flex-shrink-0">
        <div className="p-6 flex items-center space-x-2 border-b border-pa-700 dark:border-slate-800">
          <BrainCircuit className="w-8 h-8 text-pa-100" />
          <span className="text-xl font-bold tracking-tight">PA Akademi</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <div key={item.id} className="space-y-1">
                <button
                onClick={() => item.subItems ? toggleMenu(item.id) : setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${
                    activeTab.startsWith(item.id) || (item.subItems?.some(s => s.id === activeTab))
                    ? 'bg-pa-500 text-white shadow-lg' 
                    : 'text-pa-100 hover:bg-pa-800 hover:text-white'
                }`}
                >
                <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-semibold">{item.label}</span>
                </div>
                {item.subItems && (expandedMenus.includes(item.id) ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>)}
                </button>
                
                {item.subItems && expandedMenus.includes(item.id) && (
                    <div className="ml-9 space-y-1">
                        {item.subItems.map(sub => (
                            <button 
                                key={sub.id}
                                onClick={() => setActiveTab(sub.id)}
                                className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-all ${activeTab === sub.id ? 'text-white font-bold bg-pa-700' : 'text-pa-300 hover:text-white hover:bg-pa-800'}`}
                            >
                                {sub.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
          ))}
        </nav>
        
        <div className="p-4 border-t border-pa-700 dark:border-slate-800 bg-pa-950/50">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-pa-700 flex items-center justify-center font-bold">{currentUser.name.charAt(0)}</div>
                    <span className="text-xs font-medium truncate">{currentUser.name}</span>
                </div>
                <button onClick={toggleDarkMode} className="p-1.5 rounded-lg hover:bg-pa-800 text-pa-200">
                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
            </div>
            <button onClick={onLogout} className="w-full text-xs text-pa-300 hover:text-white flex items-center justify-center gap-2">
                <LogOut className="w-3 h-3" /> Güvenli Çıkış
            </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex items-center justify-end px-8">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full relative">
                        <Bell className="w-5 h-5 text-slate-500" />
                        {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800">{unreadCount}</span>}
                    </button>
                    {isNotifOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                            <div className="p-4 border-b dark:border-slate-700 font-bold flex justify-between">
                                <span>Bildirimler</span>
                                <button onClick={() => setNotifications(notifications.map(n => ({...n, isRead: true})))} className="text-[10px] text-pa-500">Hepsini Oku</button>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? notifications.map(n => (
                                    <div key={n.id} className={`p-4 border-b dark:border-slate-700 ${!n.isRead ? 'bg-pa-50/30' : ''}`}>
                                        <p className="text-xs font-bold">{n.title}</p>
                                        <p className="text-[10px] text-slate-500 mt-1">{n.message}</p>
                                    </div>
                                )) : <p className="p-8 text-center text-xs text-slate-400">Bildirim yok.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
