import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Alert, AlertDescription } from "../../ui/alert";
import InventoryReportGenerator from "../inventoryReport/inventoryReport";
import clinicInventoryBaseUrl from "../../../clinicInventoryBaseUrl";
import { useAppSelector } from "../../../redux/hook";

// Updated interface to match the actual API response
interface InventoryItem {
  _id: string;
  assignedTo: string | null;
  clinicId: string;
  createdAt: string;
  inventoryType: string;
  isLowStock: boolean;
  lowStockThreshold?: number;
  productId: string;
  productName: string;
  productType: string;
  quantity: number;
  updatedAt: string;
  __v?: number;
}

// Interface for the old format that InventoryReportGenerator expects
interface LegacyInventory {
  _id: string;
  assignedTo: null;
  clinicId: string;
  createdAt: string;
  inventoryType: string;
  isLowStock: boolean;
  isLocalProduct?: boolean;
  product: {
    brand: {
      _id: string;
      name: string;
    } | string;
    createdAt: string;
    description: string;
    expiryDate: string;
    image: string[];
    isLowStock: boolean;
    mainCategory: {
      _id: string;
      categoryName: string;
    };
    name: string;
    price: number;
    productId: string;
    status: string;
    stock: number;
    category: string;
    subCategory: {
      _id: string;
      categoryName: string;
    };
    updatedAt: string;
    _id: string;
  };
  productId: string;
  quantity: number;
  updatedAt: string;
}

interface InventoryResponse {
  data: InventoryItem[];
  message?: string;
}

interface Vendor {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export function InventoryTracker() {
  const clinicId = useAppSelector((state) => state.auth.clinicId);
  const token = useAppSelector((state) => state.auth.token);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cursor-based pagination state
  const [cursors] = useState<(string | null)[]>([null]);
  const [currentCursorIndex, setCurrentCursorIndex] = useState(0);
  const [pageSize] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [assignType, setAssignType] = useState("");
  const [assignId, setAssignId] = useState("");
  const [assignQuantity, setAssignQuantity] = useState("");
  const [labs, setLabs] = useState<Vendor[]>([]);
  const [pharmacies, setPharmacies] = useState<Vendor[]>([]);
  const [editData, setEditData] = useState<InventoryItem | null>(null);
  const [isQuantityDialogOpen, setIsQuantityDialogOpen] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockCount: 0,
    totalValue: 0,
    categories: 0,
  });

  // Transform current inventory items to legacy format for the report generator
  const transformToLegacyFormat = (items: InventoryItem[]): LegacyInventory[] => {
    return items.map(item => ({
      _id: item._id,
      assignedTo: null,
      clinicId: item.clinicId,
      createdAt: item.createdAt,
      inventoryType: item.inventoryType,
      isLowStock: item.isLowStock,
      isLocalProduct: item.productType === 'local',
      product: {
        brand: {
          _id: '',
          name: 'N/A'
        },
        createdAt: item.createdAt,
        description: '',
        expiryDate: new Date().toISOString(),
        image: [],
        isLowStock: item.isLowStock,
        mainCategory: {
          _id: '',
          categoryName: item.inventoryType || 'General'
        },
        name: item.productName,
        price: 0, // Price not available in new format
        productId: item.productId,
        status: item.quantity > 0 ? 'available' : 'out of stock',
        stock: item.quantity,
        category: item.inventoryType || 'General',
        subCategory: {
          _id: '',
          categoryName: item.productType || 'General'
        },
        updatedAt: item.updatedAt,
        _id: item.productId
      },
      productId: item.productId,
      quantity: item.quantity,
      updatedAt: item.updatedAt
    }));
  };

  const getClinicProducts = async () => {
    if (!clinicId) {
      setError("Missing clinic ID");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get(
        `${clinicInventoryBaseUrl}/api/v1/clinicInventory/clinicProduct/${clinicId}`,
        { headers }
      );

      console.log("API Response:", response);

      if (response?.status === 200 && response?.data?.data) {
        const inventoryData: InventoryItem[] = response.data.data;
        console.log("Inventory data:", inventoryData);
        
        // Apply search filter if search term exists
        const filteredItems = searchTerm
          ? inventoryData.filter((item: InventoryItem) => 
              item.productName?.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : inventoryData;

        setInventoryItems(filteredItems);
        
        // Calculate stats
        const totalItems = filteredItems.reduce(
          (sum: number, item: InventoryItem) => sum + (item.quantity || 0),
          0
        );
        
        const lowStockCount = filteredItems.filter(
          (item: InventoryItem) => item.isLowStock
        ).length;
        
        // Since we don't have price in the new structure, we'll set a default
        const totalValue = 0; // Placeholder
        
        // For categories, use inventoryType as a proxy for categories
        const categories = new Set(
          filteredItems.map(
            (item: InventoryItem) => item.inventoryType || "General"
          )
        ).size;

        setStats({
          totalItems,
          lowStockCount,
          totalValue,
          categories,
        });

        setTotalCount(filteredItems.length);
        setHasNextPage(false); // Adjust based on your pagination logic
        
        console.log("Processed inventory items:", filteredItems);
      }
    } catch (error) {
      console.error("Error fetching clinic products:", error);
      setError("Failed to load inventory items. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (clinicId) {
      getClinicProducts();
      getAllVendors();
    }
  }, [clinicId]);

  useEffect(() => {
    // Debounce search
    const debounceTimer = setTimeout(() => {
      if (clinicId) {
        getClinicProducts();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, clinicId]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e?.target?.value || "");
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentCursorIndex((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentCursorIndex > 0) {
      setCurrentCursorIndex((prev) => prev - 1);
    }
  };

  const handleEditClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleAddClick = () => {
    setIsAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedItem(null);
    setIsAddDialogOpen(false);
    setAssignQuantity("");
    setAssignType("");
    setAssignId("");
  };

  // Calculate display info with null checks
  const startItem = (currentCursorIndex * pageSize) + 1;
  const endItem = Math.min(startItem + (inventoryItems?.length || 0) - 1, totalCount);
  const totalPages = Math.ceil(totalCount / pageSize);
  const currentPage = currentCursorIndex + 1;

  if (error && !inventoryItems?.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Data
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => getClinicProducts()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleSaveChanges = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!clinicId) {
      alert("Clinic ID is missing");
      return;
    }

    const formData = new FormData(e.currentTarget);

    const payload = {
      productName: formData.get("productName") || "",
      quantity: Number(formData.get("quantity")) || 0,
      inventoryType: formData.get("inventoryType") || "general",
      productType: formData.get("productType") || "global",
      lowStockThreshold: Number(formData.get("lowStockThreshold")) || 20,
    };

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.post(
        `${clinicInventoryBaseUrl}/api/v1/clinicInventory/create/${clinicId}`,
        payload,
        { headers }
      );
      if (response?.status === 201) {
        console.log("Item added successfully:", response.data);
        handleCloseDialog();
        getClinicProducts(); // Refresh the list
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add item");
    }
  };

const handleAssignInventory = async () => {
  if (!selectedItem) {
    alert("No item selected");
    return;
  }

  if (!assignType || !assignId) {
    alert("Please select Lab or Pharmacy");
    return;
  }

  if (!assignQuantity || Number(assignQuantity) <= 0) {
    alert("Please enter a valid quantity");
    return;
  }

  if (Number(assignQuantity) > (selectedItem?.quantity || 0)) {
    alert("You cannot assign more than available quantity");
    return;
  }

  if (!clinicId) {
    alert("Clinic ID is missing");
    return;
  }

  try {
    const payload = {
      clinicId,
      productId: selectedItem.productId || selectedItem._id,
      productName: selectedItem.productName,
      quantity: Number(assignQuantity),
      toInventoryType: assignType.toLowerCase(), // "lab" | "pharmacy"
      toVendorId: assignId, // 🔥 THIS WAS MISSING
    };

    console.log("sending payload:", payload);

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.post(
      `${clinicInventoryBaseUrl}/api/v1/assign/inventory/assign/clinicproducts`,
      payload,
      { headers }
    );

    if (response.status === 200) {
      alert("Inventory assigned successfully");
      handleCloseDialog();
      getClinicProducts();
      setAssignQuantity("");
      setAssignType("");
      setAssignId("");
    }
  } catch (err: any) {
    console.error(err);
    alert(err?.response?.data?.message || "Failed to assign inventory");
  }
};



  const getAllVendors = async () => {
    if (!clinicId) return;

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get(
        `${clinicInventoryBaseUrl}/api/v1/clinicProduct/clinic/vendor-ids/${clinicId}`,
        { headers }
      );
      console.log("Vendors response:", response);

      if (response?.status === 200 && response?.data) {
        console.log("Vendors fetched:", response.data);
        setLabs(response?.data?.labs || []);
        setPharmacies(response?.data?.pharmacies || []);
      }
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!id) {
      alert("Invalid item ID");
      return;
    }

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.delete(
        `${clinicInventoryBaseUrl}/api/v1/clinicInventory/inventory/delete/${id}`,
        { headers }
      );
      console.log(response);
      if (response?.status === 200) {
        alert("Item deleted successfully");
        getClinicProducts(); // Refresh the list
      }
    } catch (error) {
      console.log(error);
      alert("Failed to delete item");
    }
  };

  const handleUpdateClick = async (item: InventoryItem) => {
    setEditData(item);
    setIsQuantityDialogOpen(true);
  };

  const handleEditChanges = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!clinicId) {
      alert("Clinic ID is missing");
      return;
    }

    if (!editData?._id) {
      alert("Invalid item data");
      return;
    }

    const formData = new FormData(e.currentTarget);

    const payload = {
      quantity: Number(formData.get("quantity")) || 0,
    };

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.patch(
        `${clinicInventoryBaseUrl}/api/v1/clinicInventory/update/${clinicId}/${editData._id}`,
        payload,
        { headers }
      );
      console.log(response);
      if (response?.status === 200) {
        alert("Item updated successfully");
        handleCloseQuantityDialog();
        getClinicProducts(); // Refresh the list
      }
    } catch (error) {
      console.log(error);
      alert("Failed to update item");
    }
  };

  const handleCloseQuantityDialog = () => {
    setIsQuantityDialogOpen(false);
    setEditData(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Inventory Management</h2>
          <p className="text-muted-foreground">Track supplies and equipment</p>
        </div>
        <div className="flex gap-2">
          <InventoryReportGenerator
            inventoryItems={transformToLegacyFormat(inventoryItems)}
            stats={stats}
            clinicId={clinicId || ""}
          />
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={handleAddClick}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats?.lowStockCount > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{stats.lowStockCount} items</strong> are running low on
            stock and need immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-3xl text-primary">{stats?.totalItems || 0}</p>
              </div>
              <Package className="w-8 h-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-3xl text-destructive">
                  {stats?.lowStockCount || 0}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-3xl text-secondary">
                  ₹{(stats?.totalValue || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-3xl text-primary">{stats?.categories || 0}</p>
              </div>
              <Package className="w-8 h-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                className="pl-10"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin w-8 h-8 mx-auto text-blue-600" />
              <p className="text-muted-foreground mt-2">Loading inventory...</p>
            </div>
          ) : !inventoryItems || inventoryItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items found
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {inventoryItems.map((item) => {
                  // Null check for item
                  if (!item) return null;

                  const isLowStock = item?.isLowStock || false;

                  return (
                    <div
                      key={item?._id || Math.random().toString()}
                      style={{
                        padding: "20px",
                        borderRadius: "12px",
                        border: isLowStock
                          ? "2px solid #fed7aa"
                          : "1px solid #e5e7eb",
                        backgroundColor: isLowStock ? "#fff7ed" : "#ffffff",
                        marginBottom: "16px",
                        transition: "all 0.2s ease",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(0, 0, 0, 0.1)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 1px 3px rgba(0, 0, 0, 0.05)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {/* Header Section */}
                      <div style={{ marginBottom: "20px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            flexWrap: "wrap",
                            marginBottom: "16px",
                          }}
                        >
                          <h3
                            style={{
                              fontSize: "18px",
                              fontWeight: "600",
                              color: "#111827",
                              margin: 0,
                            }}
                          >
                            {item?.productName || "Unknown Product"}
                          </h3>

                          {item?.inventoryType && (
                            <Badge
                              variant="outline"
                              style={{
                                fontSize: "11px",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                backgroundColor: "#f0fdf4",
                                color: "#166534",
                                border: "1px solid #bbf7d0",
                              }}
                            >
                              {item.inventoryType}
                            </Badge>
                          )}

                          {item?.productType && (
                            <Badge
                              variant="outline"
                              style={{
                                fontSize: "11px",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                backgroundColor: "#eff6ff",
                                color: "#1e40af",
                                border: "1px solid #bfdbfe",
                              }}
                            >
                              {item.productType}
                            </Badge>
                          )}

                          {isLowStock && (
                            <Badge
                              variant="destructive"
                              style={{
                                fontSize: "11px",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                backgroundColor: "#fef2f2",
                                color: "#dc2626",
                                border: "1px solid #fecaca",
                                fontWeight: "600",
                              }}
                            >
                              ⚠ Low Stock
                            </Badge>
                          )}
                        </div>

                        {/* Info Grid */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(140px, 1fr))",
                            gap: "20px",
                            padding: "16px",
                            backgroundColor: "#f9fafb",
                            borderRadius: "8px",
                            border: "1px solid #f3f4f6",
                          }}
                        >
                          <div>
                            <span
                              style={{
                                display: "block",
                                fontSize: "11px",
                                fontWeight: "500",
                                color: "#6b7280",
                                marginBottom: "6px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Current Stock
                            </span>
                            <p
                              style={{
                                fontSize: "16px",
                                fontWeight: "700",
                                color: isLowStock ? "#ea580c" : "#111827",
                                margin: 0,
                                display: "flex",
                                alignItems: "baseline",
                                gap: "4px",
                              }}
                            >
                              {item?.quantity || 0}
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: "400",
                                  color: "#6b7280",
                                }}
                              >
                                units
                              </span>
                            </p>
                          </div>

                          <div>
                            <span
                              style={{
                                display: "block",
                                fontSize: "11px",
                                fontWeight: "500",
                                color: "#6b7280",
                                marginBottom: "6px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Threshold
                            </span>
                            <p
                              style={{
                                fontSize: "15px",
                                fontWeight: "600",
                                color: "#111827",
                                margin: 0,
                              }}
                            >
                              {item?.lowStockThreshold || 20} units
                            </p>
                          </div>

                          <div>
                            <span
                              style={{
                                display: "block",
                                fontSize: "11px",
                                fontWeight: "500",
                                color: "#6b7280",
                                marginBottom: "6px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Status
                            </span>
                            <p
                              style={{
                                fontSize: "15px",
                                fontWeight: "600",
                                color: "#111827",
                                margin: 0,
                              }}
                            >
                              {item?.quantity > 0 ? "In Stock" : "Out of Stock"}
                            </p>
                          </div>

                          <div>
                            <span
                              style={{
                                display: "block",
                                fontSize: "11px",
                                fontWeight: "500",
                                color: "#6b7280",
                                marginBottom: "6px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Last Updated
                            </span>
                            <p
                              style={{
                                fontSize: "14px",
                                fontWeight: "500",
                                color: "#4b5563",
                                margin: 0,
                              }}
                            >
                              {item?.updatedAt 
                                ? new Date(item.updatedAt).toLocaleDateString() 
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "10px",
                          paddingTop: "12px",
                          borderTop: "1px solid #f3f4f6",
                        }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(item)}
                          style={{
                            padding: "8px 16px",
                            fontSize: "14px",
                            fontWeight: "500",
                            borderRadius: "8px",
                            border: "1px solid #d1d5db",
                            backgroundColor: "#ffffff",
                            color: "#374151",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.currentTarget.style.backgroundColor = "#f9fafb";
                            e.currentTarget.style.borderColor = "#9ca3af";
                          }}
                          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.currentTarget.style.backgroundColor = "#ffffff";
                            e.currentTarget.style.borderColor = "#d1d5db";
                          }}
                        >
                          ✏️ Edit
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateClick(item)}
                          style={{
                            padding: "8px 16px",
                            fontSize: "14px",
                            fontWeight: "500",
                            borderRadius: "8px",
                            border: "1px solid #3b82f6",
                            backgroundColor: "#eff6ff",
                            color: "#1e40af",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.currentTarget.style.backgroundColor = "#dbeafe";
                            e.currentTarget.style.borderColor = "#2563eb";
                          }}
                          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.currentTarget.style.backgroundColor = "#eff6ff";
                            e.currentTarget.style.borderColor = "#3b82f6";
                          }}
                        >
                          🔄 Update
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteItem(item?._id)}
                          style={{
                            padding: "8px 16px",
                            fontSize: "14px",
                            fontWeight: "500",
                            borderRadius: "8px",
                            border: "1px solid #ef4444",
                            backgroundColor: "#fef2f2",
                            color: "#dc2626",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.currentTarget.style.backgroundColor = "#fee2e2";
                            e.currentTarget.style.borderColor = "#dc2626";
                          }}
                          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.currentTarget.style.backgroundColor = "#fef2f2";
                            e.currentTarget.style.borderColor = "#ef4444";
                          }}
                        >
                          🗑️ Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cursor-based Pagination Controls */}
              {inventoryItems && inventoryItems.length > 0 && (
                <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between mt-6">
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-gray-600">
                      Showing{" "}
                      <span className="font-medium text-gray-900">
                        {startItem}
                      </span>{" "}
                      -{" "}
                      <span className="font-medium text-gray-900">
                        {endItem}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium text-gray-900">
                        {totalCount || 0}
                      </span>{" "}
                      items
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentCursorIndex === 0 || isLoading}
                      className="inline-flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentCursorIndex(i)}
                          disabled={isLoading}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium ${
                            i === currentCursorIndex
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          } ${
                            isLoading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleNextPage}
                      disabled={!hasNextPage || isLoading}
                      className="inline-flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      {isAddDialogOpen && (
        <div
          onClick={handleCloseDialog}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              backgroundColor: "white",
              borderRadius: "0.5rem",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.5rem",
              zIndex: 10000,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Inventory Item</h2>
              <button
                onClick={handleCloseDialog}
                style={{
                  color: "#9ca3af",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.25rem",
                  borderRadius: "0.25rem",
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.color = "#4b5563";
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.color = "#9ca3af";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChanges} className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="productName" className="text-sm font-medium">
                  Product Name *
                </label>
                <Input
                  id="productName"
                  name="productName"
                  required
                  style={{
                    border: "1px solid #d1d5db",
                    marginTop: "15px",
                  }}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-medium">
                  Quantity *
                </label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  required
                  min="0"
                  style={{
                    border: "1px solid #d1d5db",
                    marginTop: "15px",
                  }}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="inventoryType" className="text-sm font-medium">
                  Inventory Type *
                </label>
                <select
                  id="inventoryType"
                  name="inventoryType"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    border: "1px solid #d1d5db",
                    marginTop: "15px",
                  }}
                >
                  <option value="general">General</option>
                  <option value="medical">Medical</option>
                  <option value="equipment">Equipment</option>
                  <option value="consumable">Consumable</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="productType" className="text-sm font-medium">
                  Product Type *
                </label>
                <select
                  id="productType"
                  name="productType"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    border: "1px solid #d1d5db",
                    marginTop: "15px",
                  }}
                >
                  <option value="global">Global</option>
                  <option value="local">Local</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="lowStockThreshold" className="text-sm font-medium">
                  Low Stock Threshold
                </label>
                <Input
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  min="1"
                  defaultValue="20"
                  style={{
                    border: "1px solid #d1d5db",
                    marginTop: "15px",
                  }}
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Item</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {isEditDialogOpen && selectedItem && (
        <div
          onClick={handleCloseDialog}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              backgroundColor: "white",
              borderRadius: "0.5rem",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.5rem",
              zIndex: 10000,
              color: "black",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Assign Inventory</h2>
              <button
                onClick={handleCloseDialog}
                style={{
                  color: "#9ca3af",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.25rem",
                  borderRadius: "0.25rem",
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.color = "#4b5563";
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.color = "#9ca3af";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="product-name" className="text-sm font-medium">
                  Product Name
                </label>
                <Input
                  id="product-name"
                  defaultValue={selectedItem?.productName || ""}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-medium">
                  Available Quantity
                </label>
                <p className="text-lg font-semibold">{selectedItem?.quantity || 0} units</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="assign" className="text-sm font-medium">
                  Assign To
                </label>

                <select
                  id="assign"
                  className="w-full border px-3 py-2 rounded-md focus:ring"
                  onChange={(e) => {
                    const value = e?.target?.value || "";
                    const [type, id] = value.split(":");
                    setAssignType(type || "");
                    setAssignId(id || "");
                  }}
                >
                  <option value="">Select</option>

                  {labs && labs.length > 0 && (
                    <optgroup label="Labs">
                      {labs.map((lab) => (
                        <option key={lab?._id || Math.random()} value={`lab:${lab?._id || ""}`}>
                          {lab?.name || "Unknown Lab"}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {pharmacies && pharmacies.length > 0 && (
                    <optgroup label="Pharmacy">
                      {pharmacies.map((pharmacy) => (
                        <option
                          key={pharmacy?._id || Math.random()}
                          value={`pharmacy:${pharmacy?._id || ""}`}
                        >
                          {pharmacy?.name || "Unknown Pharmacy"}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-medium">
                  Quantity To Assign
                </label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  required
                  min="1"
                  max={selectedItem?.quantity || 0}
                  value={assignQuantity}
                  onChange={(e) => setAssignQuantity(e?.target?.value || "")}
                  style={{
                    border: "1px solid black",
                    marginTop: "15px",
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleAssignInventory}>Assign Inventory</Button>
            </div>
          </div>
        </div>
      )}

      {/* Quantity Dialog */}
      {isQuantityDialogOpen && editData && (
        <div
          onClick={handleCloseQuantityDialog}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              backgroundColor: "white",
              borderRadius: "0.5rem",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.5rem",
              zIndex: 10000,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Update Quantity</h2>
              <button
                onClick={handleCloseQuantityDialog}
                style={{
                  color: "#9ca3af",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.25rem",
                  borderRadius: "0.25rem",
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.color = "#4b5563";
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.color = "#9ca3af";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditChanges} className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Product Name
                </label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editData?.productName || ""}
                  disabled
                  style={{
                    border: "1px solid #d1d5db",
                    marginTop: "15px",
                    backgroundColor: "#f3f4f6",
                  }}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="currentQuantity" className="text-sm font-medium">
                  Current Quantity
                </label>
                <p className="text-lg font-semibold">{editData?.quantity || 0} units</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-medium">
                  New Quantity *
                </label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  required
                  min="0"
                  defaultValue={editData?.quantity || 0}
                  style={{
                    border: "1px solid #d1d5db",
                    marginTop: "15px",
                  }}
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseQuantityDialog}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Quantity</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}