import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  trend: string;
  trendUp: boolean;
  icon: typeof LucideIcon;
  description: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trend,
  trendUp,
  icon: Icon,
  description,
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-slate-800 mb-1">{value}</div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`font-semibold ${trendUp ? 'text-emerald-600' : 'text-slate-500'}`}>
            {trend}
          </span>
          <span className="text-slate-400">{description}</span>
        </div>
      </div>
    </div>
  );
};