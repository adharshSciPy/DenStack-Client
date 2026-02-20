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
import clinicInventoryBaseUrl from "../../../clinicInventoryBaseUrl";
import { useAppSelector } from "../../../redux/hook";

// Interface for lab inventory items
interface LabInventoryItem {
  _id: string;
  clinicId: string;
  productId: string;
  quantity: number;
  productName: string;
  inventoryType: string;
  isLowStock: boolean;
  lowStockThreshold: number;
  assignedTo: string | null;
  productType: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

interface LabInventoryResponse {
  message: string;
  data: LabInventoryItem[];
}

interface Vendor {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export function InventoryPage() {
  const labId = useAppSelector((state) => state.auth.user.id);  
  console.log("Lab ID from Redux:", labId);
  const token = useAppSelector((state) => state.auth.token);
  const [inventoryItems, setInventoryItems] = useState<LabInventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LabInventoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Stats
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockCount: 0,
    totalValue: 0,
    categories: 0,
  });

  // Fetch lab inventory
  const getLabInventory = async () => {
    if ( !labId) {
      setError("Missing clinic ID or lab ID");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Using the lab-specific endpoint
      const response = await axios.get(
        `${clinicInventoryBaseUrl}/api/v1/clinicProduct/lab/products/${labId}`,
      );

      console.log("Lab Inventory API Response:", response);

      if (response?.status === 200 && response?.data?.data) {
        const inventoryData: LabInventoryItem[] = response.data.data;
        console.log("Lab Inventory data:", inventoryData);
        
        // Apply search filter if search term exists
        const filteredItems = searchTerm
          ? inventoryData.filter((item) => 
              item.productName?.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : inventoryData;

        setInventoryItems(filteredItems);
        
        // Calculate stats
        const totalItems = filteredItems.reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        );
        
        const lowStockCount = filteredItems.filter(
          (item) => item.isLowStock
        ).length;
        
        // For categories, use inventoryType as a proxy for categories
        const categories = new Set(
          filteredItems.map(
            (item) => item.inventoryType || "General"
          )
        ).size;

        setStats({
          totalItems,
          lowStockCount,
          totalValue: 0, // Price not available
          categories,
        });

        setTotalCount(filteredItems.length);
      }
    } catch (error) {
      console.error("Error fetching lab inventory:", error);
      setError("Failed to load lab inventory items. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if ( labId) {
      getLabInventory();
    }
  }, [ labId]);

  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (labId) {
        getLabInventory();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, labId]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e?.target?.value || "");
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(totalCount / pageSize)) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleAddClick = () => {
    setIsAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setSelectedItem(null);
  };

  // Calculate display info
  const startItem = ((currentPage - 1) * pageSize) + 1;
  const endItem = Math.min(startItem + (inventoryItems?.length || 0) - 1, totalCount);
  const totalPages = Math.ceil(totalCount / pageSize);

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
            onClick={() => getLabInventory()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lab Inventory Management</h2>
          <p className="text-muted-foreground">Track lab supplies and equipment</p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={handleAddClick}
          >
            <Plus className="w-4 h-4 mr-2" />
            Request Items
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
                <p className="text-3xl font-bold text-primary">{stats?.totalItems || 0}</p>
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
                <p className="text-3xl font-bold text-destructive">
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
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-3xl font-bold text-primary">{stats?.categories || 0}</p>
              </div>
              <Package className="w-8 h-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Stock Level</p>
                <p className="text-3xl font-bold text-secondary">
                  {inventoryItems.length > 0 
                    ? Math.round(stats.totalItems / inventoryItems.length) 
                    : 0} units
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Lab Inventory Items</CardTitle>
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
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin w-8 h-8 mx-auto text-blue-600" />
              <p className="text-muted-foreground mt-2">Loading lab inventory...</p>
            </div>
          ) : !inventoryItems || inventoryItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No items found</p>
              <p className="text-sm">Your lab inventory is currently empty</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {inventoryItems.map((item) => {
                  const isLowStock = item?.isLowStock || false;

                  return (
                    <div
                      key={item?._id}
                      className="p-6 rounded-xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                      style={{
                        border: isLowStock
                          ? "2px solid #fed7aa"
                          : "1px solid #e5e7eb",
                        backgroundColor: isLowStock ? "#fff7ed" : "#ffffff",
                      }}
                    >
                      {/* Header Section */}
                      <div className="mb-5">
                        <div className="flex items-center gap-3 flex-wrap mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {item?.productName || "Unknown Product"}
                          </h3>

                          {item?.inventoryType && (
                            <Badge
                              variant="outline"
                              className="text-xs px-3 py-1 rounded-md bg-green-50 text-green-700 border-green-200"
                            >
                              {item.inventoryType}
                            </Badge>
                          )}

                          {item?.productType && (
                            <Badge
                              variant="outline"
                              className="text-xs px-3 py-1 rounded-md bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {item.productType}
                            </Badge>
                          )}

                          {isLowStock && (
                            <Badge
                              variant="destructive"
                              className="text-xs px-3 py-1 rounded-md bg-red-50 text-red-700 border-red-200 font-semibold"
                            >
                              ⚠ Low Stock
                            </Badge>
                          )}
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <div>
                            <span className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                              Current Stock
                            </span>
                            <p className="text-base font-bold flex items-baseline gap-1">
                              <span className={isLowStock ? "text-orange-600" : "text-gray-900"}>
                                {item?.quantity || 0}
                              </span>
                              <span className="text-xs font-normal text-gray-500">
                                units
                              </span>
                            </p>
                          </div>

                          <div>
                            <span className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                              Threshold
                            </span>
                            <p className="text-sm font-semibold text-gray-900">
                              {item?.lowStockThreshold || 20} units
                            </p>
                          </div>

                          <div>
                            <span className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                              Status
                            </span>
                            <p className="text-sm font-semibold">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                item?.quantity > 0 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {item?.quantity > 0 ? "In Stock" : "Out of Stock"}
                              </span>
                            </p>
                          </div>

                          <div>
                            <span className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                              Last Updated
                            </span>
                            <p className="text-sm font-medium text-gray-600">
                              {item?.updatedAt 
                                ? new Date(item.updatedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
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
                      disabled={currentPage === 1 || isLoading}
                      className="inline-flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          disabled={isLoading}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium ${
                            i + 1 === currentPage
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
                      disabled={currentPage === totalPages || isLoading}
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

      {/* Request Items Dialog */}
      {isAddDialogOpen && (
        <div
          onClick={handleCloseDialog}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Request Items</h2>
              <button
                onClick={handleCloseDialog}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                To request items for your lab, please contact the clinic administrator.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Contact Information</h3>
                <p className="text-blue-800 text-sm">
                  Email: admin@clinic.com<br />
                  Phone: +1 (555) 123-4567
                </p>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    // You can implement email or notification functionality here
                    alert("Request sent to clinic administrator");
                    handleCloseDialog();
                  }}
                >
                  Send Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}