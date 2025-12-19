import React, { useEffect, useState } from 'react';
import { Training, Participant, PaymentStatus, Task } from '../types';
import { AlertTriangle, Clock, CreditCard, CheckCircle, BrainCircuit, RefreshCw } from 'lucide-react';
import { analyzeRisksAndWarnings } from '../services/geminiService';

interface AlertsProps {
  trainings: Training[];
  participants: Participant[];
}

interface AIWarning {
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
}

const Alerts: React.FC<AlertsProps> = ({ trainings, participants }) => {
  const [aiWarnings, setAiWarnings] = useState<AIWarning[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  // 1. Geciken Ödemeler (Logic: Kayıt olalı 7 günü geçmiş ama hala Ödenmemiş)
  // Fix: Use assignments to check registration date and payment status
  const overduePayments = participants.flatMap(p => 
    (p.assignments || []).filter(a => {
        const daysSinceReg = (new Date().getTime() - new Date(a.registrationDate).getTime()) / (1000 * 3600 * 24);
        return a.paymentStatus === PaymentStatus.PENDING && daysSinceReg > 7;
    }).map(a => ({ participant: p, assignment: a }))
  );

  // 2. Geciken Operasyonel Görevler (Logic: Tarihi geçmiş veya yaklaşan eğitimlerin tamamlanmamış görevleri)
  const overdueTasks: { training: string, task: Task, date: string }[] = [];
  trainings.forEach(t => {
      // Fix: Use startDate instead of date
      const isPastOrClose = new Date(t.startDate).getTime() < new Date().getTime() + (1000 * 3600 * 24 * 3); // Past or within 3 days
      if (isPastOrClose) {
          t.tasks.filter(task => !task.isCompleted).forEach(task => {
              overdueTasks.push({ training: t.title, task, date: t.startDate });
          });
      }
  });

  const fetchAIWarnings = async () => {
      setLoadingAi(true);
      const context = JSON.stringify({
          activeTrainingsCount: trainings.length,
          totalParticipants: participants.length,
          overduePaymentCount: overduePayments.length,
          trainings: trainings.map(t => ({ 
              title: t.title, 
              quota: t.quota, 
              // Fix: Access assignments to count registrations and use startDate
              registered: participants.filter(p => p.assignments?.some(a => a.trainingId === t.id)).length,
              date: t.startDate 
          }))
      });
      
      const warnings = await analyzeRisksAndWarnings(context);
      setAiWarnings(warnings);
      setLoadingAi(false);
  };

  useEffect(() => {
      fetchAIWarnings();
  }, [trainings.length, participants.length]);

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Uyarı Merkezi</h2>
            <button onClick={fetchAIWarnings} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full">
                <RefreshCw className={`w-5 h-5 ${loadingAi ? 'animate-spin' : ''}`} />
            </button>
        </div>

        {/* AI Warnings Section */}
        <div className="bg-gradient-to-r from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-indigo-800">
                <BrainCircuit className="w-6 h-6" />
                <h3 className="font-bold text-lg">Yapay Zeka Tespitleri</h3>
            </div>
            {loadingAi ? (
                <p className="text-sm text-indigo-400 animate-pulse">Analiz ediliyor...</p>
            ) : aiWarnings.length > 0 ? (
                <div className="space-y-3">
                    {aiWarnings.map((w, idx) => (
                        <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${
                            w.severity === 'HIGH' ? 'bg-red-50 border-red-200 text-red-800' :
                            w.severity === 'MEDIUM' ? 'bg-orange-50 border-orange-200 text-orange-800' :
                            'bg-blue-50 border-blue-200 text-blue-800'
                        }`}>
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/50 border border-black/5 mr-2">{w.severity}</span>
                                <span className="text-sm font-medium">{w.message}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm">Yapay zeka şu an kritik bir risk tespit etmedi.</span>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Alerts */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4 text-slate-700">
                    <CreditCard className="w-5 h-5 text-red-500" />
                    <h3 className="font-bold text-lg">Geciken Ödemeler</h3>
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">{overduePayments.length}</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {overduePayments.map((item, idx) => {
                        // Fix: Access correct properties from restructured overduePayments item
                        const training = trainings.find(t => t.id === item.assignment.trainingId);
                        return (
                            <div key={`${item.participant.id}-${idx}`} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded border border-slate-50">
                                <div>
                                    <p className="font-medium text-slate-800 text-sm">{item.participant.name}</p>
                                    <p className="text-xs text-slate-400">{training?.title}</p>
                                </div>
                                <div className="text-right">
                                    {/* Fix: Access registrationDate from assignment */}
                                    <span className="text-xs font-mono text-slate-500">{new Date(item.assignment.registrationDate).toLocaleDateString()}</span>
                                    <p className="text-xs text-red-500 font-bold">Bekliyor</p>
                                </div>
                            </div>
                        )
                    })}
                    {overduePayments.length === 0 && <p className="text-sm text-slate-400 italic">Geciken ödeme yok.</p>}
                </div>
            </div>

            {/* Task Alerts */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4 text-slate-700">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <h3 className="font-bold text-lg">Acil Operasyonel İşler</h3>
                    <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">{overdueTasks.length}</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {overdueTasks.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded border border-slate-50">
                             <div>
                                <p className="font-medium text-slate-800 text-sm">{item.task.title}</p>
                                <p className="text-xs text-slate-400">{item.training}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-mono text-slate-500">{new Date(item.date).toLocaleDateString()}</span>
                                <p className="text-xs text-orange-500 font-bold">Tamamlanmadı</p>
                            </div>
                        </div>
                    ))}
                    {overdueTasks.length === 0 && <p className="text-sm text-slate-400 italic">Geciken görev yok.</p>}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Alerts;