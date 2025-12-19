import React from 'react';
import { Instructor } from '../types';
import { Mail, Briefcase, Percent } from 'lucide-react';

interface InstructorListProps {
    instructors: Instructor[];
}

const InstructorList: React.FC<InstructorListProps> = ({ instructors }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Eğitmenler</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instructors.map(inst => (
                    <div key={inst.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl">
                                {inst.name.charAt(0)}
                            </div>
                            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full font-medium">
                                %{inst.defaultCommissionRate} Komisyon
                            </span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1">{inst.name}</h3>
                        <p className="text-sm text-slate-500 mb-4">{inst.specialty}</p>
                        
                        <div className="space-y-2 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Mail className="w-4 h-4 text-slate-400" />
                                {inst.email}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default InstructorList;
