
import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Database, Table, Check, Loader2, AlertCircle, Plus, Trash2, ListChecks, PlayCircle, Info, Tag, Layers } from 'lucide-react';

interface SettingsProps {
    checklist: {id: string, label: string}[];
    setChecklist: React.Dispatch<React.SetStateAction<{id: string, label: string}[]>>;
    actionOptions: string[];
    setActionOptions: React.Dispatch<React.SetStateAction<string[]>>;
    contactStatusOptions: string[];
    setContactStatusOptions: React.Dispatch<React.SetStateAction<string[]>>;
    regStatusOptions: string[];
    setRegStatusOptions: React.Dispatch<React.SetStateAction<string[]>>;
}

const Settings: React.FC<SettingsProps> = ({ 
    checklist, setChecklist, 
    actionOptions, setActionOptions, 
    contactStatusOptions, setContactStatusOptions,
    regStatusOptions, setRegStatusOptions
}) => {
    const [activeTab, setActiveTab] = useState<'lists' | 'integrations'>('lists');
    const [isSaving, setIsSaving] = useState(false);
    
    // Management states
    const [newItem, setNewItem] = useState('');

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            alert("Tüm yapılandırmalar kaydedildi.");
        }, 600);
    };

    const ListSection = ({ title, items, setItems, icon: Icon, placeholder }: any) => {
        const [localNew, setLocalNew] = useState('');
        return (
            <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border dark:border-slate-800 space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <Icon className="w-5 h-5 text-pa-500"/> {title}
                    </h3>
                </div>
                <div className="space-y-2">
                    {items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700 group">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{typeof item === 'string' ? item : item.label}</span>
                            <button onClick={() => setItems(items.filter((_: any, i: number) => i !== idx))} className="p-1.5 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input 
                        className="flex-1 p-3 border-2 dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-bold outline-none focus:border-pa-500"
                        placeholder={placeholder}
                        value={localNew}
                        onChange={e => setLocalNew(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (setItems([...items, title === 'Operasyonel Checklist' ? {id: Math.random().toString(), label: localNew} : localNew]), setLocalNew(''))}
                    />
                    <button onClick={() => (setItems([...items, title === 'Operasyonel Checklist' ? {id: Math.random().toString(), label: localNew} : localNew]), setLocalNew(''))} className="bg-pa-500 text-white p-3 rounded-xl"><Plus className="w-5 h-5"/></button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <SettingsIcon className="w-8 h-8 text-pa-500"/> Dinamik Yapılandırma
                    </h2>
                    <p className="text-sm text-slate-500 font-bold">Operasyonel süreçleri ve seçim listelerini buradan yönetin</p>
                </div>
                <button onClick={handleSave} className="bg-pa-500 text-white px-8 py-4 rounded-[2rem] font-black flex items-center gap-2 shadow-xl shadow-pa-500/20 active:scale-95 transition-all">
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>} Kaydet
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border dark:border-slate-700 overflow-hidden">
                <div className="flex border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <button onClick={() => setActiveTab('lists')} className={`px-10 py-6 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'lists' ? 'border-pa-500 text-pa-600' : 'border-transparent text-slate-400'}`}>Süreç Listeleri</button>
                    <button onClick={() => setActiveTab('integrations')} className={`px-10 py-6 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'integrations' ? 'border-pa-500 text-pa-600' : 'border-transparent text-slate-400'}`}>Entegrasyonlar</button>
                </div>

                <div className="p-10">
                    {activeTab === 'lists' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <ListSection title="Operasyonel Checklist" items={checklist} setItems={setChecklist} icon={ListChecks} placeholder="Yeni madde..." />
                            <ListSection title="Sıradaki Aksiyon Seçenekleri" items={actionOptions} setItems={setActionOptions} icon={PlayCircle} placeholder="Yeni aksiyon..." />
                            <ListSection title="İletişim Durum Seçenekleri" items={contactStatusOptions} setItems={setContactStatusOptions} icon={Info} placeholder="Yeni durum..." />
                            <ListSection title="Kayıt Statü Seçenekleri" items={regStatusOptions} setItems={setRegStatusOptions} icon={Tag} placeholder="Yeni statü..." />
                        </div>
                    )}
                    
                    {activeTab === 'integrations' && (
                        <div className="py-20 text-center space-y-4">
                             <Database className="w-16 h-16 text-slate-200 mx-auto"/>
                             <p className="text-slate-400 font-black italic">Google Sheets ve Webhook entegrasyonları yakında burada olacak.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
