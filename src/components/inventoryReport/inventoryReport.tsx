import React, { useState } from "react";
import { 
  FileText, 
  Loader2, 
  CheckCircle
} from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Brand {
  _id: string;
  name: string;
}

interface Category {
  _id: string;
  categoryName: string;
}

interface Product {
  brand: Brand | string;
  createdAt: string;
  description: string;
  expiryDate: string;
  image: string[];
  isLowStock: boolean;
  mainCategory: Category;
  name: string;
  price: number;
  productId: string;
  status: string;
  stock: number;
  category: string;
  subCategory: Category;
  updatedAt: string;
  _id: string;
}

interface Inventory {
  _id: string;
  assignedTo: null;
  clinicId: string;
  createdAt: string;
  inventoryType: string;
  isLowStock: boolean;
  isLocalProduct?: boolean;
  product: Product;
  productId: string;
  quantity: number;
  updatedAt: string;
}

interface Stats {
  totalItems: number;
  lowStockCount: number;
  totalValue: number;
  categories: number;
}

interface InventoryReportGeneratorProps {
  inventoryItems: Inventory[];
  stats: Stats;
  clinicId: string | null;
}

interface CategoryData {
  count: number;
  totalValue: number;
  items: Inventory[];
}

const InventoryReportGenerator: React.FC<InventoryReportGeneratorProps> = ({ 
  inventoryItems, 
  stats, 
  clinicId 
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [reportGenerated, setReportGenerated] = useState<boolean>(false);

  const generatePDFReport = (): void => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let yPosition = 20;

    // Simple Title
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('Inventory Report', 20, yPosition);
    
    yPosition += 10;
    
    // Metadata
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Clinic ID: ${clinicId || 'N/A'}`, 20, yPosition);
    doc.text(`Date: ${today}`, 150, yPosition);
    
    yPosition += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;

    // Summary Stats - Simple table format
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary', 20, yPosition);
    yPosition += 5;

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Total Items', stats.totalItems.toString()],
        ['Low Stock Items', stats.lowStockCount.toString()],
        ['Total Inventory Value', `₹${stats.totalValue.toFixed(2)}`],
        ['Categories', stats.categories.toString()]
      ],
      theme: 'plain',
      headStyles: { 
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.5,
        lineColor: [200, 200, 200]
      },
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        lineWidth: 0.1,
        lineColor: [230, 230, 230]
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 40 }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Low Stock Alert - Simple text
    if (stats.lowStockCount > 0) {
      doc.setFontSize(9);
      doc.setTextColor(150, 0, 0);
      doc.text(`* ${stats.lowStockCount} item(s) require restocking`, 20, yPosition);
      yPosition += 10;
    }

    // Low Stock Items Table
    const lowStockItems = inventoryItems.filter(item => item.isLowStock);
    
    if (lowStockItems.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text('Low Stock Items', 20, yPosition);
      yPosition += 5;

      const lowStockTableData = lowStockItems.map(item => [
        item.product?.name || 'N/A',
        item.product?.mainCategory?.categoryName || 'N/A',
        typeof item.product?.brand === 'string' ? item.product.brand : item.product?.brand?.name || 'N/A',
        `${item.quantity || 0}`,
        `₹${item.product?.price || 0}`,
        `₹${((item.product?.price || 0) * (item.quantity || 0)).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Product', 'Category', 'Brand', 'Stock', 'Price', 'Value']],
        body: lowStockTableData,
        theme: 'plain',
        headStyles: { 
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineWidth: 0.5,
          lineColor: [200, 200, 200]
        },
        styles: { 
          fontSize: 8,
          cellPadding: 2,
          lineWidth: 0.1,
          lineColor: [230, 230, 230]
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Complete Inventory Table
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Complete Inventory', 20, yPosition);
    yPosition += 5;

    const inventoryTableData = inventoryItems.map(item => [
      item.product?.name || 'N/A',
      item.product?.mainCategory?.categoryName || 'N/A',
      item.product?.subCategory?.categoryName || '-',
      typeof item.product?.brand === 'string' ? item.product.brand : item.product?.brand?.name || 'N/A',
      `${item.quantity || 0}`,
      `₹${item.product?.price || 0}`,
      `₹${((item.product?.price || 0) * (item.quantity || 0)).toFixed(2)}`,
      item.product?.status || 'Active'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Product', 'Category', 'Sub Cat.', 'Brand', 'Stock', 'Price', 'Value', 'Status']],
      body: inventoryTableData,
      theme: 'plain',
      headStyles: { 
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.5,
        lineColor: [200, 200, 200]
      },
      styles: { 
        fontSize: 7,
        cellPadding: 2,
        lineWidth: 0.1,
        lineColor: [230, 230, 230]
      },
      columnStyles: {
        4: { halign: 'center' },
        5: { halign: 'right' },
        6: { halign: 'right' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Category Breakdown
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Category Summary', 20, yPosition);
    yPosition += 5;

    const categoryMap: Record<string, CategoryData> = {};
    inventoryItems.forEach(item => {
      const category = item.product?.mainCategory?.categoryName || 'Uncategorized';
      if (!categoryMap[category]) {
        categoryMap[category] = {
          count: 0,
          totalValue: 0,
          items: []
        };
      }
      categoryMap[category].count++;
      categoryMap[category].totalValue += (item.product?.price || 0) * (item.quantity || 0);
      categoryMap[category].items.push(item);
    });

    const categoryTableData = Object.entries(categoryMap).map(([category, data]) => [
      category,
      data.count.toString(),
      `₹${data.totalValue.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Category', 'Items', 'Total Value']],
      body: categoryTableData,
      theme: 'plain',
      headStyles: { 
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.5,
        lineColor: [200, 200, 200]
      },
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        lineWidth: 0.1,
        lineColor: [230, 230, 230]
      },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' }
      }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    doc.save(`inventory-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleGenerateReport = (): void => {
    setIsGenerating(true);

    setTimeout(() => {
      generatePDFReport();
      setIsGenerating(false);
      setReportGenerated(true);

      setTimeout(() => {
        setReportGenerated(false);
      }, 3000);
    }, 1500);
  };

  return (
    <button
      onClick={handleGenerateReport}
      disabled={isGenerating}
      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating PDF...
        </>
      ) : reportGenerated ? (
        <>
          <CheckCircle className="w-4 h-4 text-green-600" />
          PDF Generated!
        </>
      ) : (
        <>
          <FileText className="w-4 h-4" />
          Generate Report
        </>
      )}
    </button>
  );
};

export default InventoryReportGenerator;