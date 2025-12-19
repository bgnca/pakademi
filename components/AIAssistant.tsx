

import React, { useState, useRef, useEffect } from 'react';
import { BrainCircuit, Send, Loader2 } from 'lucide-react';
import { generateAIResponse } from '../services/geminiService';
import { Training, Participant, Expense, Instructor, PaymentStatus, CrmStatus } from '../types';

interface AIAssistantProps {
    trainings?: Training[];
    participants?: Participant[];
    expenses?: Expense[];
    instructors?: Instructor[];
}

// Simple formatter component to handle bold text and lists
const FormattedMessage: React.FC<{ content: string }> = ({ content }) => {
    // Split by newlines first
    const lines = content.split('\n');
    
    return (
        <div className="space-y-1">
            {lines.map((line, idx) => {
                // Check if it's a list item
                const isList = line.trim().startsWith('* ') || line.trim().startsWith('- ');
                const cleanLine = isList ? line.trim().substring(2) : line;

                // Parse bold text (**text**)
                const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
                
                const renderedLine = parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i}>{part.slice(2, -2)}</strong>;
                    }
                    return <span key={i}>{part}</span>;
                });

                if (isList) {
                    return (
                        <div key={idx} className="flex gap-2 ml-2">
                            <span className="text-indigo-400 mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 block"></span>
                            <p>{renderedLine}</p>
                        </div>
                    );
                }
                
                // Handle empty lines as spacers
                if (!line.trim()) return <div key={idx} className="h-2"></div>;

                return <p key={idx}>{renderedLine}</p>;
            })}
        </div>
    );
};

const AIAssistant: React.FC<AIAssistantProps> = ({ trainings = [], participants = [], expenses = [], instructors = [] }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([
      { role: 'ai', content: 'Merhaba! Ben PsyEdu Asistanı. Şirket verilerine tam erişimim var. "Bugün ne yapmalıyım?" diye sorarsan ajandanı kontrol edebilirim.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if(!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);

    // Prepare Context Data using the assignment-based structure
    const totalIncome = participants.reduce((sum, p) => {
        const pPaidTotal = p.assignments.reduce((aSum, a) => 
            aSum + (a.payments || []).reduce((ps, pay) => ps + pay.amount, 0), 0);
        return sum + pPaidTotal;
    }, 0);
    
    const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Get Today's date string YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // Filter Logic for "Daily Agenda" - aggregated across assignments
    const scheduledContacts = participants.filter(p => 
        (p.nextContactDate && p.nextContactDate.startsWith(today)) ||
        p.assignments.some(a => a.registrationDate.startsWith(today))
    ).map(p => ({
        name: p.name,
        phone: p.phone,
        status: p.crmStatus || p.assignments[0]?.currentContactStatus,
        note: p.notes
    }));

    // Collect all incomplete tasks
    const incompleteTasks = trainings.flatMap(t => 
        t.tasks.filter(task => !task.isCompleted).map(task => ({
            training: t.title,
            task: task.title,
            date: t.startDate
        }))
    );

    const contextData = JSON.stringify({
        summary: {
            totalTrainings: trainings.length,
            totalParticipants: participants.length,
            totalRevenue: totalIncome,
            totalExpenses: totalExpenseAmount,
            activeTrainings: trainings.filter(t => new Date(t.startDate) > new Date()).length
        },
        agenda: {
            todayDate: today,
            scheduledCalls: scheduledContacts,
            pendingTasks: incompleteTasks.slice(0, 10), // Limit payload for efficiency
            activeWarnings: participants.filter(p => 
              p.crmStatus === CrmStatus.TO_CALL || 
              p.assignments.some(a => a.paymentStatus === PaymentStatus.PENDING)
            ).length
        },
        trainings: trainings.map(t => ({
            title: t.title,
            date: t.startDate,
            quota: t.quota,
            registered: participants.filter(p => p.assignments.some(a => a.trainingId === t.id)).length,
            status: t.status,
            instructor: instructors.find(i => t.instructorIds?.includes(i.id))?.name
        })),
        pendingPayments: participants.filter(p => p.assignments.some(a => a.paymentStatus === PaymentStatus.PENDING)).length
    });

    // Simple heuristic to decide if "Thinking Mode" is needed
    const complexKeywords = ['strateji', 'analiz', 'karşılaştır', 'plan', 'optimize', 'hesapla', 'neden', 'rapor', 'öneri', 'yapmalı'];
    const useThinking = complexKeywords.some(k => userMsg.toLowerCase().includes(k)) || userMsg.length > 80;

    const response = await generateAIResponse(userMsg, contextData, useThinking);

    setMessages(prev => [...prev, { role: 'ai', content: response }]);
    setIsLoading(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800">AI Asistan</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        m.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-slate-100 text-slate-800 rounded-bl-none'
                    }`}>
                        {m.role === 'ai' ? <FormattedMessage content={m.content} /> : <p className="whitespace-pre-wrap text-sm">{m.content}</p>}
                    </div>
                </div>
            ))}
            {isLoading && (
                 <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                        <span className="text-xs text-slate-500">Düşünüyor...</span>
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 border-t border-slate-100">
            <div className="flex gap-2">
                <input 
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Bir soru sorun..."
                    className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    disabled={isLoading}
                />
                <button 
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg disabled:opacity-50 transition-colors"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
                Karmaşık sorular için otomatik olarak Gemini 3 Pro (Thinking Mode) kullanılır.
            </p>
        </div>
    </div>
  );
};

export default AIAssistant;