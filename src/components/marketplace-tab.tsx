import { useState } from "react";
import { Search, ShoppingCart, Star, Filter, Package, Truck, CreditCard, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const categories = [
  "All Products", "Dental Equipment", "Consumables", "PPE", "Pharmaceuticals", "Office Supplies"
];

const marketplaceProducts = [
  {
    id: 1,
    name: "Digital X-Ray Sensor",
    brand: "DentTech Pro",
    price: 2499.99,
    originalPrice: 2899.99,
    rating: 4.8,
    reviews: 124,
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop",
    category: "Dental Equipment",
    discount: 14,
    inStock: true,
    description: "High-resolution digital X-ray sensor with wireless connectivity"
  },
  {
    id: 2,
    name: "Disposable Dental Bibs (500 pack)",
    brand: "ClinCare",
    price: 24.99,
    originalPrice: null,
    rating: 4.6,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=300&h=200&fit=crop",
    category: "Consumables",
    discount: 0,
    inStock: true,
    description: "Premium quality disposable patient bibs, waterproof backing"
  },
  {
    id: 3,
    name: "LED Dental Curing Light",
    brand: "LightCure Systems",
    price: 189.99,
    originalPrice: 229.99,
    rating: 4.7,
    reviews: 67,
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=300&h=200&fit=crop",
    category: "Dental Equipment",
    discount: 17,
    inStock: true,
    description: "Cordless LED light with multiple intensity settings"
  },
  {
    id: 4,
    name: "Nitrile Examination Gloves (Box of 200)",
    brand: "SafeGuard Medical",
    price: 29.99,
    originalPrice: null,
    rating: 4.9,
    reviews: 203,
    image: "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=300&h=200&fit=crop",
    category: "PPE",
    discount: 0,
    inStock: true,
    description: "Powder-free nitrile gloves, textured fingertips"
  },
  {
    id: 5,
    name: "Ultrasonic Cleaner 2.5L",
    brand: "CleanTech Pro",
    price: 299.99,
    originalPrice: 349.99,
    rating: 4.5,
    reviews: 45,
    image: "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=300&h=200&fit=crop",
    category: "Dental Equipment",
    discount: 14,
    inStock: false,
    description: "Digital ultrasonic cleaner with heating function"
  },
  {
    id: 6,
    name: "Dental Impression Material",
    brand: "FlexCast",
    price: 89.99,
    originalPrice: null,
    rating: 4.4,
    reviews: 78,
    image: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=300&h=200&fit=crop",
    category: "Consumables",
    discount: 0,
    inStock: true,
    description: "Fast-setting alginate impression material"
  }
];

const orderHistory = [
  {
    id: "ORD-001",
    date: "2025-09-10",
    items: 3,
    total: 459.97,
    status: "Delivered"
  },
  {
    id: "ORD-002",
    date: "2025-09-08",
    items: 1,
    total: 2499.99,
    status: "In Transit"
  },
  {
    id: "ORD-003",
    date: "2025-09-05",
    items: 5,
    total: 234.95,
    status: "Delivered"
  }
];

export function MarketplaceTab() {
  const [selectedCategory, setSelectedCategory] = useState("All Products");
  const [cartItems, setCartItems] = useState<number[]>([]);

  const addToCart = (productId: number) => {
    setCartItems(prev => [...prev, productId]);
  };

  const filteredProducts = selectedCategory === "All Products" 
    ? marketplaceProducts 
    : marketplaceProducts.filter(product => product.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Marketplace</h2>
          <p className="text-muted-foreground">Browse and order dental supplies</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="relative">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Cart
            {cartItems.length > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-destructive">
                {cartItems.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="browse">Browse Products</TabsTrigger>
          <TabsTrigger value="orders">Order History</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6 mt-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mt-4">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={selectedCategory === category ? "bg-primary hover:bg-primary/90" : ""}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow group">
                <div className="relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                  />
                  {product.discount > 0 && (
                    <Badge className="absolute top-2 left-2 bg-destructive">
                      -{product.discount}%
                    </Badge>
                  )}
                  {!product.inStock && (
                    <Badge variant="secondary" className="absolute top-2 right-2">
                      Out of Stock
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium line-clamp-2">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.brand}</p>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{product.rating}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({product.reviews} reviews)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-primary">${product.price}</p>
                        {product.originalPrice && (
                          <p className="text-sm text-muted-foreground line-through">
                            ${product.originalPrice}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-primary hover:bg-primary/90"
                        disabled={!product.inStock}
                        onClick={() => addToCart(product.id)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderHistory.map((order) => (
                  <div key={order.id} className="p-4 bg-muted/30 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Package className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium">Order {order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.date} • {order.items} items • ${order.total}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={order.status === "Delivered" ? "default" : "secondary"}
                        className={order.status === "Delivered" ? "bg-green-600" : "bg-secondary"}
                      >
                        {order.status === "In Transit" && <Truck className="w-3 h-3 mr-1" />}
                        {order.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-6 mt-6">
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No favorite items yet</h3>
              <p className="text-muted-foreground mb-4">
                Browse products and mark items as favorites for quick access
              </p>
              <Button 
                onClick={() => document.querySelector('[value="browse"]')?.click()}
                className="bg-primary hover:bg-primary/90"
              >
                Browse Products
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}