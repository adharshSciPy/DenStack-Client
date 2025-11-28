import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Package,
  AlertTriangle,
  Plus,
  TrendingDown,
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
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Alert, AlertDescription } from "../components/ui/alert";

import clinicInventoryBaseUrl from "../clinicInventoryBaseUrl";
import { useAppSelector } from "../redux/hook";

interface Inventory {
  _id: string;
  assignedTo: null;
  clinicId: string;
  createdAt: string;
  inventoryType: string;
  product: {
    brand: {
      _id: string;
      name: string;
    };
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
  data: Inventory[];
  count: number;
  hasMore: boolean;
  nextCursor?: string;
  message?: string;
}

export function InventoryTracker() {
  const clinicId = useAppSelector((state) => state.auth.clinicId);
  
  const [inventoryItems, setInventoryItems] = useState<Inventory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cursor-based pagination state
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [currentCursorIndex, setCurrentCursorIndex] = useState(0);
  const [pageSize] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  // Stats
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockCount: 0,
    totalValue: 0,
    categories: 0,
  });

  const getInventoryItems = async (search: string = "",) => {
    setIsLoading(true);
    setError(null);

    try {
      const params: any = {
        limit: pageSize,
      };

      // ✅ Add cursor only if not the first page
      if (cursors[currentCursorIndex]) {
        params.cursor = cursors[currentCursorIndex];
      }

      // ✅ Add search
      if (search.trim()) {
        params.search = search.trim();
      }

      console.log("API params:", params);

      const response = await axios.get(
        `${clinicInventoryBaseUrl}/api/v1/clinicInventory/products/${clinicId}`,
        { params }
      );

      if (response.status === 200) {
        const data: InventoryResponse = response.data;
        
        setInventoryItems(data.data || []);
        setTotalCount(data.count || 0);
        setHasNextPage(data.hasMore || false);

        // ✅ Store next cursor only once
        if (data.hasMore && data.nextCursor) {
          setCursors((prev) => {
            const trimmed = prev.slice(0, currentCursorIndex + 1);
            if (trimmed[trimmed.length - 1] !== data.nextCursor) {
              trimmed.push(data.nextCursor!);
            }
            return trimmed;
          });
        }

        // Calculate stats
        const lowStock = (data.data || []).filter((item) => item?.product?.isLowStock).length;
        const value = (data.data || []).reduce(
          (sum, item) => sum + (item?.product?.price || 0) * (item?.quantity || 0),
          0
        );
        const cats = [
          ...new Set(
            (data.data || [])
              .filter((item) => item?.product?.mainCategory?.categoryName)
              .map((item) => item.product.mainCategory.categoryName)
          ),
        ].length;

        setStats({
          totalItems: data.count || 0,
          lowStockCount: lowStock,
          totalValue: value,
          categories: cats,
        });
      }
      console.log(response);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError("Failed to load inventory items. Please try again.");
      setInventoryItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
 useEffect(() => {
  if (!clinicId) return;

  // When search term changes → reset pagination & debounce
  const debounceTimer = setTimeout(() => {
    if (searchTerm !== "") {
      setCursors([null]);
      setCurrentCursorIndex(0);
    }

    getInventoryItems(searchTerm);
  }, 500);

  return () => clearTimeout(debounceTimer);
  
}, [clinicId, searchTerm, currentCursorIndex]);


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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

  const handleEditClick = (item: Inventory) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedItem(null);
  };

  // Calculate display info
  const startItem = currentCursorIndex * pageSize + 1;
  const endItem = startItem + (inventoryItems?.length || 0) - 1;
  // Calculate total pages based on whether there's more data
  const totalPages = hasNextPage ? currentCursorIndex + 2 : currentCursorIndex + 1;
  const currentPage = currentCursorIndex + 1;

  if (error && !inventoryItems.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => getInventoryItems(searchTerm)}
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
          <h2 className="text-2xl">Inventory Management</h2>
          <p className="text-muted-foreground">Track supplies and equipment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Generate Report</Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockCount > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{stats.lowStockCount} items</strong> are running low on stock and
            need immediate attention.
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
                <p className="text-3xl text-primary">{stats.totalItems}</p>
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
                <p className="text-3xl text-destructive">{stats.lowStockCount}</p>
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
                  ${stats.totalValue.toFixed(2)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-secondary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-3xl text-primary">{stats.categories}</p>
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
                  if (!item || !item.product) return null;

                  const isLowStock = item.product?.isLowStock || false;

                  return (
                    <div
                      key={item._id || Math.random()}
                      className={`p-4 rounded-lg border transition-colors hover:bg-[#D1FAE5]/30 ${
                        isLowStock
                          ? "border-orange-200 bg-orange-50/30"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">
                              {item.product?.name || "Unknown Product"}
                            </h3>
                            {item.product?.mainCategory?.categoryName && (
                              <Badge variant="outline" className="text-xs">
                                {item.product.mainCategory.categoryName}
                              </Badge>
                            )}
                            {item.product?.subCategory?.categoryName && (
                              <Badge variant="outline" className="text-xs">
                                {item.product.subCategory.categoryName}
                              </Badge>
                            )}
                            {isLowStock && (
                              <Badge variant="destructive" className="text-xs">
                                Low Stock
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Current Stock:
                              </span>
                              <p
                                className={`font-medium ${
                                  isLowStock
                                    ? "text-orange-600"
                                    : "text-foreground"
                                }`}
                              >
                                {item.quantity || 0} units
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Brand:
                              </span>
                              <p className="font-medium text-foreground">
                                {item.product?.brand?.name || "N/A"}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Status:
                              </span>
                              <p className="font-medium text-foreground">
                                {item.product?.status || "N/A"}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Unit Price:
                              </span>
                              <p className="font-medium text-foreground">
                                ${item.product?.price || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(item)}
                        >
                          Edit
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
                      <span className="font-medium text-gray-900">{startItem}</span>{" "}
                      - <span className="font-medium text-gray-900">{endItem}</span>{" "}
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
                          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
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
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit Inventory Item</h2>
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#4b5563";
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
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
                  defaultValue={selectedItem.product?.name || ""}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-medium">
                  Quantity
                </label>
                <p>{selectedItem.quantity || 0}</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium">
                  Unit Price ($)
                </label>
                <p>{selectedItem.product?.price || 0}</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">
                  Assign
                </label>
                <Input
                  id="status"
                  defaultValue={selectedItem.product?.status || ""}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleCloseDialog}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}