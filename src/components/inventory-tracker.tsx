import { Package, AlertTriangle, Plus, TrendingDown, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";

const inventoryItems = [
  {
    id: 1,
    name: "Surgical Gloves (Box of 100)",
    category: "PPE",
    current: 15,
    minimum: 25,
    maximum: 100,
    unit: "boxes",
    lastOrdered: "2025-09-10",
    supplier: "MedSupply Co.",
    cost: 24.99
  },
  {
    id: 2,
    name: "Disposable Syringes 5ml",
    category: "Medical Devices",
    current: 8,
    minimum: 20,
    maximum: 200,
    unit: "packs",
    lastOrdered: "2025-09-12",
    supplier: "HealthPro Ltd.",
    cost: 15.50
  },
  {
    id: 3,
    name: "Antiseptic Solution 500ml",
    category: "Pharmaceuticals",
    current: 12,
    minimum: 10,
    maximum: 50,
    unit: "bottles",
    lastOrdered: "2025-09-08",
    supplier: "PharmaCore",
    cost: 8.75
  },
  {
    id: 4,
    name: "Bandages - Assorted Sizes",
    category: "Wound Care",
    current: 45,
    minimum: 30,
    maximum: 100,
    unit: "packs",
    lastOrdered: "2025-09-05",
    supplier: "CareSupplies Inc.",
    cost: 12.30
  },
  {
    id: 5,
    name: "Face Masks (N95)",
    category: "PPE",
    current: 5,
    minimum: 50,
    maximum: 300,
    unit: "boxes",
    lastOrdered: "2025-09-11",
    supplier: "SafeGuard Medical",
    cost: 45.00
  }
];

const lowStockItems = inventoryItems.filter(item => item.current <= item.minimum);

export function InventoryTracker() {
  const totalItems = inventoryItems.length;
  const lowStockCount = lowStockItems.length;
  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.current * item.cost), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Inventory Management</h2>
          <p className="text-muted-foreground">Track supplies and equipment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            Generate Report
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{lowStockCount} items</strong> are running low on stock and need immediate attention.
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
                <p className="text-3xl text-primary">{totalItems}</p>
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
                <p className="text-3xl text-destructive">{lowStockCount}</p>
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
                <p className="text-3xl text-secondary">${totalValue.toFixed(2)}</p>
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
                <p className="text-3xl text-primary">4</p>
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
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventoryItems.map((item) => {
              const stockPercentage = (item.current / item.maximum) * 100;
              const isLowStock = item.current <= item.minimum;
              
              return (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-lg border transition-colors hover:bg-[#D1FAE5]/30 ${
                    isLowStock ? 'border-orange-200 bg-orange-50/30' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{item.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                        {isLowStock && (
                          <Badge variant="destructive" className="text-xs">
                            Low Stock
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="text-xs text-muted-foreground">Current Stock:</span>
                          <p className={`font-medium ${isLowStock ? 'text-orange-600' : 'text-foreground'}`}>
                            {item.current} {item.unit}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Minimum:</span>
                          <p className="font-medium text-foreground">{item.minimum} {item.unit}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Supplier:</span>
                          <p className="font-medium text-foreground">{item.supplier}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Unit Cost:</span>
                          <p className="font-medium text-foreground">${item.cost}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button 
                        variant={isLowStock ? "default" : "outline"} 
                        size="sm"
                        className={isLowStock ? "bg-primary hover:bg-primary/90" : ""}
                      >
                        Reorder
                      </Button>
                    </div>
                  </div>

                  {/* Stock Level Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Stock Level</span>
                      <span>{stockPercentage.toFixed(0)}% of maximum</span>
                    </div>
                    <Progress 
                      value={stockPercentage} 
                      className={`h-2 ${isLowStock ? '[&>div]:bg-orange-500' : '[&>div]:bg-primary'}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}