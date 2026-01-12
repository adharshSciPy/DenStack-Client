// src/modules/dental-lab/components/common/StatCard.jsx
import React from 'react';
import { ArrowUpRight, LucideIcon } from 'lucide-react';
interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
  gradient: string;
  subtext?: string;
  trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, color, gradient, subtext, trend }) => (
  <div className={`relative overflow-hidden rounded-2xl ${gradient} p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/20`}>
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 px-2.5 py-1 bg-white/90 rounded-full text-xs font-semibold text-green-600">
            <ArrowUpRight className="w-3 h-3" />
            {trend}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
      </div>
    </div>
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
  </div>
);

export default StatCard;