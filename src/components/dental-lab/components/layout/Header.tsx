// src/modules/dental-lab/components/layout/Header.jsx
import React from 'react';
import { Building2, Plus, Sparkles } from 'lucide-react';

interface HeaderProps {
  onCreateOrder: () => void;
}

const Header = ({ onCreateOrder }: HeaderProps) => {
  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Dental Lab Management
              </h1>
              <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                <Sparkles className="w-4 h-4" />
                Clinic Dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onCreateOrder}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            New Order
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;