
import React, { useState, useMemo } from 'react';
import { Training, Participant, Instructor, Expense, PaymentStatus } from '../types';
import { generateAIResponse } from '../services/geminiService';
import { BrainCircuit, TrendingUp, Loader2, DollarSign, Printer, Plus, Trash2, Mail, Download } from 'lucide-react';

interface FinancialReportProps {
  trainings: Training[];
  participants: Participant[];
  instructors: Instructor[];
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

const FinancialReport: React.FC<FinancialReportProps> = ({ trainings, participants, instructors, expenses, setExpenses }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'instructor' | 'revenue'>('general');
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>('');
  
  const [useVAT, setUseVAT] = useState(true);
  const [useIncomeTax, setUseIncomeTax] = useState(true);
  const [paKasaRatio, setPaKasaRatio] = useState(60); 
  
  const [instManualExpenses, setInstManualExpenses] = useState<{id: string, label: string, amount: number}[]>([]);
  const [newInstExpLabel, setNewInstExpLabel] = useState('');
  const [newInstExpAmount, setNewInstExpAmount] = useState('');

  const [customExpenses, setCustomExpenses] = useState<{id: string, label: string, amount: number}[]>([]);
  const [newExpenseLabel, setNewExpenseLabel] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // -- Computations --
  
  const selectedTraining = useMemo(() => trainings.find(t => t.id === selectedTrainingId), [selectedTrainingId, trainings]);
  
  const trainingParticipants = useMemo(() => {
    if (!selectedTrainingId) return [];
    return participants.filter(p => p.assignments.some(a => a.trainingId === selectedTrainingId));
  }, [selectedTrainingId, participants]);

  const trainingGross = useMemo(() => {
      if(!selectedTraining) return 0;
      return trainingParticipants.length * selectedTraining.price;
  }, [trainingParticipants, selectedTraining]);

  const vatAmount = useVAT ? trainingGross * 0.20 : 0;
  const incomeTaxAmount = useIncomeTax ? (trainingGross - vatAmount) * 0.25 : 0;
  
  const totalInstManualExp = instManualExpenses.reduce((s, e) => s + e.amount, 0);
  const baseForCommission = Math.max(0, trainingGross - vatAmount - incomeTaxAmount - totalInstManualExp);

  const currentInstructor = useMemo(() => instructors.find(i => selectedTraining?.instructorIds?.includes(i.id)), [selectedTraining, instructors]);
  const instructorPay = baseForCommission * ((currentInstructor?.defaultCommissionRate || 40) / 100);

  const handleDownloadPDF = () => {
      if(!selectedTraining || !currentInstructor) return;
      
      // Better filename for PDF
      const originalTitle = document.title;
      const fileName = `${currentInstructor.name.replace(/\s+/g, '_')}_Hakedis_${selectedTraining.title.replace(/\s+/g, '_')}`;
      
      document.title = fileName;
      window.print();
      
      // Restore original title
      setTimeout(() => {
          document.title = originalTitle;
      }, 500);
  };

  const handleSendMailToInstructor = () => {
      if(!currentInstructor || !selectedTraining) return;
      
      const subject = encodeURIComponent(`${selectedTraining.title} - Hakediş Raporu`);
      const body = encodeURIComponent(`Sayın ${currentInstructor.name},

${selectedTraining.title} eğitiminize ait hakediş detayları hesaplanmıştır:

- Toplam Satış Hacmi (Brüt): ₺${trainingGross.toLocaleString()}
- Katılımcı Sayısı: ${trainingParticipants.length}
- Vergi ve Diğer Kesintiler: ₺${(vatAmount + incomeTaxAmount + totalInstManualExp).toLocaleString()}
- Net Hakediş Matrahı: ₺${baseForCommission.toLocaleString()}
- Anlaşma Oranı: %${currentInstructor.defaultCommissionRate}

ÖDENECEK NET TUTAR: ₺${instructorPay.toLocaleString()}

Detaylı döküm ekte yer almaktadır (veya sistem üzerinden indirilebilir).

İyi çalışmalar dileriz.
PA Akademi Finans Departmanı`);

      window.open(`mailto:${currentInstructor.email}?subject=${subject}&body=${body}`, '_blank');
  };

  const renderGeneralAnalysis = () => {
    let totalGross = participants.reduce((sum, p) => {
        return sum + p.assignments.reduce((as, a) => {
            const t = trainings.find(tr => tr.id === a.trainingId);
            return as + (t?.price || 0);
        }, 0);
    }, 0);
    let totalExp = expenses.reduce((s, e) => s + e.amount, 0);

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-sm border dark:border-slate-700">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Toplam Satış Hacmi</label>
                    <p className="text-4xl font-black text-pa-600">₺{totalGross.toLocaleString()}</p>
                    <p className="text-[9px] text-slate-400 mt-2 italic">* Tahakkuk esasına göre brüt tutar</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-sm border dark:border-slate-700">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Sabit Giderler</label>
                    <p className="text-4xl font-black text-red-500">₺{totalExp.toLocaleString()}</p>
                </div>
                <div className="bg-pa-900 text-white p-10 rounded-[3rem] shadow-2xl">
                    <label className="text-[10px] font-black text-pa-300 uppercase tracking-widest block mb-4">Tahmini Projeksiyon</label>
                    <p className="text-4xl font-black">₺{(totalGross * 0.4).toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900/50 p-12 rounded-[4rem] border-2 dark:border-slate-700 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-pa-500 rounded-[2rem] shadow-lg shadow-pa-500/20"><BrainCircuit className="w-10 h-10 text-white"/></div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase">AI Finans Stratejisi</h3>
                            <p className="text-slate-500 font-bold text-sm">Yapay zeka ile karlılık analizi.</p>
                        </div>
                    </div>
                    <button 
                        onClick={async () => {
                            setIsAnalyzing(true);
                            const result = await generateAIResponse(
                                "Bu finansal verileri karlılık, maliyet ve büyüme açısından analiz et.", 
                                JSON.stringify({totalGross, totalExp}), 
                                true
                            );
                            setAiAnalysis(result);
                            setIsAnalyzing(false);
                        }} 
                        disabled={isAnalyzing} 
                        className="bg-pa-500 hover:bg-pa-600 text-white px-12 py-5 rounded-[2.5rem] font-black flex items-center gap-3 shadow-2xl active:scale-95 disabled:opacity-50"
                    >
                        {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin"/> : <TrendingUp className="w-6 h-6"/>}
                        Stratejik Analiz
                    </button>
                </div>
                {aiAnalysis && (
                    <div className="bg-slate-50 dark:bg-slate-950 p-10 rounded-[3rem] border-2 dark:border-slate-800 text-sm leading-relaxed font-medium whitespace-pre-wrap dark:text-slate-300">
                        {aiAnalysis}
                    </div>
                )}
            </div>
        </div>
    );
  };

  const renderInstructorCalc = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border dark:border-slate-700 flex flex-col md:flex-row items-center gap-8 shadow-sm no-print">
            <div className="flex-1 w-full space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Hesaplanacak Eğitim</label>
                <select 
                    className="w-full p-5 border-2 rounded-[1.5rem] dark:bg-slate-900 font-black text-sm outline-none focus:border-pa-500 transition-all"
                    value={selectedTrainingId}
                    onChange={e => setSelectedTrainingId(e.target.value)}
                >
                    <option value="">Eğitim Seçin...</option>
                    {trainings.filter(t=>t.price).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
            </div>
            <div className="flex gap-4">
                <button onClick={() => setUseVAT(!useVAT)} className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase border-2 transition-all ${useVAT ? 'bg-pa-500 text-white border-pa-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>%20 KDV Düş</button>
                <button onClick={() => setUseIncomeTax(!useIncomeTax)} className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase border-2 transition-all ${useIncomeTax ? 'bg-pa-500 text-white border-pa-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>%25 Stopaj Düş</button>
            </div>
            <div className="flex gap-2">
                <button onClick={handleSendMailToInstructor} disabled={!selectedTrainingId} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-5 rounded-[2rem] font-black flex items-center gap-2 shadow-2xl active:scale-95 transition-all uppercase text-xs tracking-widest">
                    <Mail className="w-5 h-5"/> Mail Gönder
                </button>
                <button onClick={handleDownloadPDF} disabled={!selectedTrainingId} className="bg-slate-900 hover:bg-black text-white px-8 py-5 rounded-[2rem] font-black flex items-center gap-2 shadow-2xl active:scale-95 transition-all uppercase text-xs tracking-widest">
                    <Download className="w-5 h-5"/> Belgeyi İndir (PDF)
                </button>
            </div>
        </div>

        {selectedTrainingId && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                <div className="lg:col-span-1 space-y-8 no-print">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border dark:border-slate-700 shadow-sm space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><DollarSign className="w-4 h-4 text-pa-500"/> Ek Gider Ekle</h3>
                        <div className="space-y-3">
                            {instManualExpenses.map(exp => (
                                <div key={exp.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-800 group">
                                    <span className="text-xs font-bold uppercase tracking-wider">{exp.label}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="font-black text-red-500">₺{exp.amount.toLocaleString()}</span>
                                        <button onClick={() => setInstManualExpenses(instManualExpenses.filter(e=>e.id!==exp.id))} className="text-red-300 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3">
                            <input className="w-full p-4 border-2 rounded-2xl dark:bg-slate-900 text-sm font-bold" placeholder="Gider Başlığı" value={newInstExpLabel} onChange={e=>setNewInstExpLabel(e.target.value)}/>
                            <div className="flex gap-2">
                                <input className="flex-1 p-4 border-2 rounded-2xl dark:bg-slate-900 text-sm font-bold" type="number" placeholder="Tutar" value={newInstExpAmount} onChange={e=>setNewInstExpAmount(e.target.value)}/>
                                <button 
                                    onClick={() => {
                                        if(!newInstExpLabel || !newInstExpAmount) return;
                                        setInstManualExpenses([...instManualExpenses, {id: Math.random().toString(), label: newInstExpLabel, amount: Number(newInstExpAmount)}]);
                                        setNewInstExpLabel(''); setNewInstExpAmount('');
                                    }}
                                    className="bg-pa-500 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-all"
                                >
                                    <Plus className="w-6 h-6"/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <div id="printable-report" className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] border dark:border-slate-800 shadow-2xl space-y-12">
                        <div className="flex justify-between items-start border-b pb-10 dark:border-slate-800">
                            <div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">Eğitmen Hakediş Formu</h3>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{selectedTraining?.title}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-pa-600">{currentInstructor?.name}</p>
                                <p className="text-xs font-black text-slate-400 uppercase">{currentInstructor?.title}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 border-l-4 border-pa-500 pl-4">Katılımcı Kayıt ve Satış Detayları</h4>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400">
                                    <tr>
                                        <th className="p-4 rounded-l-2xl">Katılımcı</th>
                                        <th className="p-4">Kayıt Tarihi</th>
                                        <th className="p-4 text-right rounded-r-2xl">Eğitim Ücreti (₺)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {trainingParticipants.map(p => {
                                        const a = p.assignments.find(x => x.trainingId === selectedTrainingId);
                                        return (
                                            <tr key={p.id}>
                                                <td className="p-4 font-bold text-sm">{p.name}</td>
                                                <td className="p-4 text-xs text-slate-500">{new Date(a?.registrationDate || '').toLocaleDateString('tr-TR')}</td>
                                                <td className="p-4 text-right font-black text-sm">₺{(selectedTraining?.price || 0).toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-pa-50/30 dark:bg-pa-900/10">
                                        <td colSpan={2} className="p-5 font-black uppercase text-[10px] text-pa-600">Toplam Brüt Tahakkuk</td>
                                        <td className="p-5 text-right font-black text-xl text-pa-600">₺{trainingGross.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10">
                            <div className="space-y-4">
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 border-l-4 border-pa-500 pl-4">Kesintiler ve Ek Giderler</h4>
                                <div className="space-y-3">
                                    {useVAT && (
                                        <div className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">%20 KDV</span>
                                            <span className="font-black text-red-500">- ₺{vatAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {useIncomeTax && (
                                        <div className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">%25 Stopaj / Vergi</span>
                                            <span className="font-black text-red-500">- ₺{incomeTaxAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {instManualExpenses.map(exp => (
                                        <div key={exp.id} className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{exp.label}</span>
                                            <span className="font-black text-red-500">- ₺{exp.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center p-5 bg-pa-50 dark:bg-pa-900/20 rounded-2xl border-2 border-pa-100">
                                        <span className="text-xs font-black text-pa-600 uppercase tracking-widest">Matrah (Hakediş Bazı)</span>
                                        <span className="font-black text-pa-600 text-lg">₺{baseForCommission.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-pa-900 text-white p-10 rounded-[3rem] shadow-2xl flex flex-col justify-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10"><DollarSign className="w-20 h-20"/></div>
                                <p className="text-[10px] font-black text-pa-300 uppercase tracking-widest mb-2">Net Ödeme Tutarı</p>
                                <p className="text-5xl font-black">₺{instructorPay.toLocaleString()}</p>
                                <p className="mt-6 text-[11px] font-black uppercase text-pa-400 tracking-tighter">Komisyon Oranı: %{currentInstructor?.defaultCommissionRate || 40}</p>
                            </div>
                        </div>

                        <div className="pt-20 flex justify-between items-end border-t dark:border-slate-800 no-print">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase text-slate-400">Düzenleyen</p>
                                <p className="font-black">PA Akademi Yönetimi</p>
                            </div>
                            <div className="text-right space-y-2">
                                <p className="text-[10px] font-black uppercase text-slate-400">Tarih</p>
                                <p className="font-black">{new Date().toLocaleDateString('tr-TR')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  const renderRevenueCalc = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border dark:border-slate-700 flex flex-col md:flex-row items-center gap-8 shadow-sm">
            <div className="flex-1 w-full space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Eğitim Seçimi</label>
                <select 
                    className="w-full p-5 border-2 rounded-[1.5rem] dark:bg-slate-900 font-black text-sm outline-none focus:border-pa-500 transition-all"
                    value={selectedTrainingId}
                    onChange={e => setSelectedTrainingId(e.target.value)}
                >
                    <option value="">Eğitim Seçin...</option>
                    {trainings.filter(t=>t.price).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
            </div>
            <div className="w-full md:w-64 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Kasa Paylaşım Oranı (%)</label>
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-2 rounded-[1.5rem] border-2 border-slate-100">
                    <input type="number" className="w-full bg-transparent p-3 font-black text-center" value={paKasaRatio} onChange={e => setPaKasaRatio(Number(e.target.value))}/>
                    <span className="text-xs font-black text-slate-400 mr-4">PA KASA</span>
                </div>
            </div>
        </div>

        {selectedTrainingId && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border dark:border-slate-700 shadow-sm space-y-8">
                        <h3 className="text-xl font-black uppercase tracking-tighter">Gider Kalemleri</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl group">
                                <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">Eğitmen Ödemesi</span>
                                <span className="font-black text-red-500">₺{instructorPay.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl group">
                                <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">Vergi ve KDV (Toplam)</span>
                                <span className="font-black text-red-500">₺{(vatAmount + incomeTaxAmount).toLocaleString()}</span>
                            </div>
                            {customExpenses.map(exp => (
                                <div key={exp.id} className="flex justify-between items-center p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl group">
                                    <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">{exp.label}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="font-black text-red-500">₺{exp.amount.toLocaleString()}</span>
                                        <button onClick={() => setCustomExpenses(customExpenses.filter(e=>e.id!==exp.id))} className="text-red-300 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-6 border-t dark:border-slate-700 flex gap-4">
                            <input className="flex-1 p-4 border-2 rounded-2xl dark:bg-slate-900 text-sm font-bold" placeholder="Gider Başlığı (Örn: Reklam)" value={newExpenseLabel} onChange={e=>setNewExpenseLabel(e.target.value)}/>
                            <input className="w-40 p-4 border-2 rounded-2xl dark:bg-slate-900 text-sm font-bold" type="number" placeholder="Tutar" value={newExpenseAmount} onChange={e=>setNewExpenseAmount(e.target.value)}/>
                            <button 
                                onClick={() => {
                                    if(!newExpenseLabel || !newExpenseAmount) return;
                                    setCustomExpenses([...customExpenses, {id: Math.random().toString(), label: newExpenseLabel, amount: Number(newExpenseAmount)}]);
                                    setNewExpenseLabel(''); setNewExpenseAmount('');
                                }}
                                className="bg-pa-500 text-white p-4 rounded-2xl shadow-lg shadow-pa-500/20 active:scale-95 transition-all"
                            >
                                <Plus className="w-6 h-6"/>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border-4 border-pa-500 shadow-2xl space-y-10">
                        <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Net Şirket Kârı</p>
                             <p className="text-5xl font-black text-pa-600">₺{(trainingGross - vatAmount - incomeTaxAmount - instructorPay - customExpenses.reduce((s,e)=>s+e.amount, 0)).toLocaleString()}</p>
                        </div>
                        <hr className="dark:border-slate-700"/>
                        <div className="space-y-8">
                             <div className="p-6 bg-pa-50 dark:bg-pa-900/20 rounded-3xl border-2 border-pa-100 dark:border-pa-900/30">
                                <label className="text-[9px] font-black text-pa-400 uppercase tracking-widest block mb-1">PA KASA (%{paKasaRatio})</label>
                                <p className="text-3xl font-black text-pa-700">₺{((trainingGross - vatAmount - incomeTaxAmount - instructorPay - customExpenses.reduce((s,e)=>s+e.amount, 0)) * (paKasaRatio/100)).toLocaleString()}</p>
                             </div>
                             <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900/30">
                                <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">PA EKİP (%{100 - paKasaRatio})</label>
                                <p className="text-3xl font-black text-indigo-700">₺{((trainingGross - vatAmount - incomeTaxAmount - instructorPay - customExpenses.reduce((s,e)=>s+e.amount, 0)) * ((100-paKasaRatio)/100)).toLocaleString()}</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
         <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-pa-500"/> Finansal Yönetim
            </h2>
            <p className="text-sm text-slate-500 font-bold mt-1">Hakediş takibi ve net kâr analizleri</p>
         </div>
         <div className="flex bg-white dark:bg-slate-800 rounded-3xl p-1 shadow-sm border dark:border-slate-700">
              <button onClick={() => setActiveTab('general')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'general' ? 'bg-pa-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Genel Analiz</button>
              <button onClick={() => setActiveTab('instructor')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'instructor' ? 'bg-pa-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Eğitmen Ödeme</button>
              <button onClick={() => setActiveTab('revenue')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'revenue' ? 'bg-pa-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Gelir Paylaşımı</button>
         </div>
      </div>

      <div className="no-print">
        {activeTab === 'general' && renderGeneralAnalysis()}
        {activeTab === 'instructor' && renderInstructorCalc()}
        {activeTab === 'revenue' && renderRevenueCalc()}
      </div>
    </div>
  );
};

export default FinancialReport;
