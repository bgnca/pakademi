import React, { useState } from 'react';
import { Training, AdCampaign } from '../types';
import { Megaphone, Plus, TrendingUp, MousePointer, Users, DollarSign, BrainCircuit, Loader2 } from 'lucide-react';
import { analyzeAdPerformance } from '../services/geminiService';

interface AdManagerProps {
    trainings: Training[];
}

const AdManager: React.FC<AdManagerProps> = ({ trainings }) => {
    const [campaigns, setCampaigns] = useState<AdCampaign[]>([
        { id: '1', platform: 'Instagram', trainingId: '101', budget: 5000, spent: 2300, clicks: 450, leads: 12, status: 'Active' },
        { id: '2', platform: 'Google', trainingId: '101', budget: 8000, spent: 7500, clicks: 1200, leads: 8, status: 'Active' },
        { id: '3', platform: 'LinkedIn', trainingId: '102', budget: 3000, spent: 500, clicks: 100, leads: 5, status: 'Active' }
    ]);
    const [analysisResult, setAnalysisResult] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const report = await analyzeAdPerformance(campaigns);
        setAnalysisResult(report);
        setIsAnalyzing(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Reklam ve Pazarlama Takibi</h2>
                <div className="flex gap-2">
                    <button 
                        onClick={handleAnalyze} 
                        disabled={isAnalyzing}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50"
                    >
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin"/> : <BrainCircuit className="w-4 h-4"/>}
                        AI Performans Analizi
                    </button>
                    <button className="bg-pa-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-pa-600">
                        <Plus className="w-4 h-4"/> Kampanya Ekle
                    </button>
                </div>
            </div>

            {analysisResult && (
                <div className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-800 border border-purple-100 dark:border-purple-800 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5"/> Yapay Zeka Önerileri
                        </h3>
                        <button onClick={() => setAnalysisResult('')} className="text-slate-400 hover:text-slate-600 text-sm">Kapat</button>
                    </div>
                    <div className="prose prose-sm prose-purple max-w-none text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: analysisResult }}></div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">Toplam Harcama</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">₺{campaigns.reduce((a,b) => a+b.spent, 0).toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">Toplam Tıklama</p>
                    <p className="text-xl font-bold text-blue-600">{campaigns.reduce((a,b) => a+b.clicks, 0).toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">Lead Maliyeti (CPL)</p>
                    <p className="text-xl font-bold text-green-600">
                        ₺{Math.round(campaigns.reduce((a,b) => a+b.spent, 0) / (campaigns.reduce((a,b) => a+b.leads, 0) || 1))}
                    </p>
                </div>
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">Dönüşüm Oranı</p>
                    <p className="text-xl font-bold text-pa-500">
                        %{((campaigns.reduce((a,b) => a+b.leads, 0) / campaigns.reduce((a,b) => a+b.clicks, 0) || 1) * 100).toFixed(1)}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-3 font-semibold text-slate-500 dark:text-slate-400">Kampanya Platformu</th>
                            <th className="px-6 py-3 font-semibold text-slate-500 dark:text-slate-400">İlgili Eğitim</th>
                            <th className="px-6 py-3 font-semibold text-slate-500 dark:text-slate-400">Bütçe / Harcanan</th>
                            <th className="px-6 py-3 font-semibold text-slate-500 dark:text-slate-400">Performans</th>
                            <th className="px-6 py-3 font-semibold text-slate-500 dark:text-slate-400">Durum</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {campaigns.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4 font-medium flex items-center gap-2 dark:text-white">
                                    <Megaphone className="w-4 h-4 text-slate-400"/> {c.platform}
                                </td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{trainings.find(t=>t.id===c.trainingId)?.title.substring(0,30)}...</td>
                                <td className="px-6 py-4 dark:text-slate-300">
                                    <div className="flex flex-col">
                                        <span>₺{c.spent} / ₺{c.budget}</span>
                                        <div className="w-20 bg-slate-100 dark:bg-slate-600 h-1.5 rounded-full mt-1">
                                            <div className="bg-pa-500 h-full rounded-full" style={{width: `${(c.spent/c.budget)*100}%`}}></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 dark:text-slate-300">
                                    <div className="flex gap-4 text-xs">
                                        <div className="flex items-center gap-1"><MousePointer className="w-3 h-3"/> {c.clicks}</div>
                                        <div className="flex items-center gap-1"><Users className="w-3 h-3"/> {c.leads}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs font-medium">{c.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdManager;