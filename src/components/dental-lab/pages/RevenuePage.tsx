// src/modules/dental-lab/pages/RevenuePage.jsx
import React from 'react';
import { TrendingUp, DollarSign, Package, Activity } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { stats as mockStats } from '../utils/mockData';

const RevenuePage = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200 p-8 shadow-lg">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              Monthly Revenue Analytics
            </h2>
            <p className="text-sm text-gray-500 mt-2">In-house lab revenue tracking</p>
          </div>
          <select className="px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
            <option>January 2026</option>
            <option>December 2025</option>
            <option>November 2025</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={`$${mockStats.monthlyRevenue.toLocaleString()}`}
            color="bg-gradient-to-br from-green-600 to-emerald-600"
            gradient="bg-gradient-to-br from-green-100 to-emerald-100"
            subtext="In-house labs only"
            trend={mockStats.revenueGrowth}
          />
          <StatCard
            icon={Package}
            label="Orders This Month"
            value="23"
            color="bg-gradient-to-br from-blue-600 to-indigo-600"
            gradient="bg-gradient-to-br from-blue-100 to-indigo-100"
          />
          <StatCard
            icon={Activity}
            label="Average per Order"
            value={`$${Math.round(mockStats.monthlyRevenue / 23)}`}
            color="bg-gradient-to-br from-purple-600 to-pink-600"
            gradient="bg-gradient-to-br from-purple-100 to-pink-100"
          />
        </div>
        
        {/* Revenue Chart Placeholder */}
        <div className="mt-8 bg-gradient-to-br from-gray-50 to-white/50 rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex p-4 bg-blue-100 rounded-full mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-600">Revenue chart visualization</p>
              <p className="text-sm text-gray-500">Chart library integration coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenuePage;