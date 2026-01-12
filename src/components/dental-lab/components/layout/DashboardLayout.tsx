import React, { ReactNode } from "react";
import Header from "./Header";
import Navigation from "./Navigation";

interface DashboardLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onCreateOrder: () => void;
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activeTab,
  setActiveTab,
  onCreateOrder,
  children,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <Header onCreateOrder={onCreateOrder} />
      <div className="flex">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
