
import React from 'react';
import { Training, Participant, TrainingStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Users, GraduationCap, Clock, Phone } from 'lucide-react';

interface DashboardProps {
  trainings: Training[];
  participants: Participant[];
}

const Dashboard: React.FC<DashboardProps> = ({ trainings, participants }) => {
  // Only count trainings that are actual trainings (not folders)
  const realTrainings = trainings.filter(t => t.price > 0);
  const activeTrainings = realTrainings.filter(t => t.status !== TrainingStatus.CANCELLED && t.status !== TrainingStatus.COMPLETED).length;
  
  // Total participants is unique people, but we track assignments
  const totalUniqueParticipants = participants.length;
  
  const followUpCount = participants.reduce((sum, p) => {
      const hasFollowUp = p.assignments.some(a => a.nextAction);
      return sum + (hasFollowUp ? 1 : 0);
  }, 0);

  const totalRevenue = participants
    .reduce((sum, p) => {
      const paid = p.assignments.reduce((s, a) => s + (a.payments || []).reduce((ps, pay) => ps + pay.amount, 0), 0);
      return sum + paid;
    }, 0);

  const revenueData = realTrainings.map(t => ({
    name: t.title.substring(0, 10) + '...',
    revenue: participants
      .reduce((sum, p) => {
          const assignment = p.assignments.find(a => a.trainingId === t.id);
          const paid = assignment ? assignment.payments.reduce((ps, pay) => ps + pay.amount, 0) : 0;
          return sum + paid;
      }, 0)
  })).filter(d => d.revenue > 0);

  const statusData = [
    { name: 'Planlama', value: realTrainings.filter(t => t.status === TrainingStatus.PLANNING).length },
    { name: 'Kayıt Açık', value: realTrainings.filter(t => t.status === TrainingStatus.REGISTRATION_OPEN).length },
    { name: 'Tamamlandı', value: realTrainings.filter(t => t.status === TrainingStatus.COMPLETED).length },
  ];
  const COLORS = ['#008c8c', '#22c55e', '#64748b'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">Genel Bakış</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-4">
          <div className="p-3 bg-pa-100 dark:bg-pa-900 text-pa-600 rounded-full">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aktif Eğitimler</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">{activeTrainings}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 rounded-full">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Benzersiz Katılımcı</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">{totalUniqueParticipants}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-4">
          <div className="p-3 bg-pa-50 dark:bg-pa-900 text-pa-500 rounded-full">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toplam Tahsilat</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">₺{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900 text-amber-600 rounded-full">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksiyon Bekleyen</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">{followUpCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-black mb-6 text-slate-700 dark:text-white uppercase tracking-widest">Ciro Dağılımı</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 10}} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#008c8c" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-black mb-6 text-slate-700 dark:text-white uppercase tracking-widest">Eğitim Statüleri</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
