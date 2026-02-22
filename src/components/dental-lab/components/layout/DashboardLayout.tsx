// src/modules/dental-lab/components/layout/DashboardLayout.tsx
import React, { ReactNode } from "react";
import Header from "./Header";
import Navigation from "./Navigation";

interface DashboardLayoutProps {
  onCreateOrder: () => void;
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  onCreateOrder,
  children,
}) => {
  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(to bottom right, #f9fafb, rgba(191,219,254,0.3), rgba(129,140,248,0.3))",
      }}
    >
      <Header onCreateOrder={onCreateOrder} />

      <div className="flex flex-1" style={{ paddingTop: "80px" }}>
        {/* Sidebar */}
        <div
          style={{
            position: "fixed",
            top: "80px",
            left: 0,
            bottom: 0,
            width: "25%",
          }}
        >
          <Navigation />
        </div>

        {/* Main Content */}
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{
            marginLeft: "20%",
            position: "relative",
          }}
        >
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
