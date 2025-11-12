import { useState } from "react";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Package,
  Truck,
  CheckCircle,
  Clock,
  ArrowLeft,
  CreditCard,
  MapPin,
} from "lucide-react";
import inventoryBaseUrl from "../inventoryBaseUrl";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Input } from "../components/ui/input";
import {removeFromCart} from "../redux/slice/cartSlice"
// Mock Redux selector - replace with your actual implementation
import { useAppSelector } from "../redux/hook";
import { useDispatch } from "react-redux";
// import { removeFromCart, updateQuantity, clearCart } from "../redux/slice/cartSlice";

// Mock data for demonstration


const mockOrderHistory = [
  {
    id: "ORD-2024-001",
    date: "2025-11-08",
    items: 4,
    total: 567.89,
    status: "Delivered",
    deliveredDate: "2025-11-10",
    products: [
      { name: "Dental Mirror", quantity: 2, price: 15.99 },
      { name: "Anesthetic Cartridges", quantity: 10, price: 45.50 },
    ],
  },
  {
    id: "ORD-2024-002",
    date: "2025-11-05",
    items: 2,
    total: 234.99,
    status: "In Transit",
    estimatedDelivery: "2025-11-14",
    products: [
      { name: "Ultrasonic Scaler Tips", quantity: 5, price: 28.99 },
      { name: "Dental Burs Set", quantity: 1, price: 89.99 },
    ],
  },
  {
    id: "ORD-2024-003",
    date: "2025-11-01",
    items: 3,
    total: 445.50,
    status: "Processing",
    products: [
      { name: "LED Curing Light", quantity: 1, price: 299.99 },
      { name: "Composite Kit", quantity: 2, price: 72.75 },
    ],
  },
  {
    id: "ORD-2024-004",
    date: "2025-10-28",
    items: 6,
    total: 678.25,
    status: "Delivered",
    deliveredDate: "2025-10-30",
    products: [
      { name: "Disposable Masks", quantity: 100, price: 0.25 },
      { name: "Hand Sanitizer", quantity: 5, price: 12.50 },
    ],
  },
];

interface cart{
  image: string[],
  name: string,
  price: number,
  quantity: number,
  _id: string,
  stock: number
}
export default function CartOrderPage() {
  // Replace with actual Redux hooks
  const cartItem = useAppSelector((state) => state.cart.items);
  console.log("gjh",cartItem);
  
  const dispatch = useDispatch();
  
  const [cartItems, setCartItems] = useState<cart[]>(cartItem);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Cart operations
  const updateQuantity = (id: string, newQuantity: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item._id === id ? { ...item, quantity: Math.max(1, Math.min(newQuantity, item.stock)) } : item
      )
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item._id !== id));
    dispatch(removeFromCart(id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% tax
  const shipping = cartItems.length > 0 ? 15.00 : 0;
  const total = subtotal + tax + shipping;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "In Transit":
        return <Truck className="w-5 h-5 text-blue-600" />;
      case "Processing":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-600";
      case "In Transit":
        return "bg-blue-600";
      case "Processing":
        return "bg-yellow-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            <p className="text-muted-foreground mt-1">
              Manage your cart and view order history
            </p>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="cart" className="w-full ">
          <TabsList className="grid grid-cols-2 w-full max-w-md bg-muted/60">
            <TabsTrigger value="cart" className="relative">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart
              {cartItems.length > 0 && (
                <Badge className="ml-2 bg-primary">{cartItems.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Package className="w-4 h-4 mr-2" />
              Order History
            </TabsTrigger>
          </TabsList>

          {/* CART TAB */}
          <TabsContent value="cart" className="space-y-6 mt-6 ">
            {cartItems.length === 0 ? (
              <Card className="bg-muted/60">
                <CardContent className="p-12 text-center ">
                  <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
                  <p className="text-muted-foreground mb-6">
                    Add some products to get started
                  </p>
                  <Button onClick={() => window.history.back()}>
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-1 gap-6">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                  <Card className="bg-muted/60">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Cart Items ({cartItems.length})</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearCart}
                        className="text-destructive hover:text-destructive"
                      >
                        Clear Cart
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4 " style={{overflow:"hidden"}}>
                      {cartItems.map((item) => (
                        <div
                          key={item._id}
                          className="flex gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          {/* Product Image */}
                          <div className="w-24 h-24 flex-shrink-0 bg-muted rounded-lg overflow-hidden" style={{height:"100px",width:"100px"}}>
                            <img
                              src={`${inventoryBaseUrl}${item.image[0]}`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              style={{height:"100%",width:"100%"}}
                            />
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium mb-1 truncate">
                              {item.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              In stock: {item.stock}
                            </p>
                            <p className="text-lg font-bold text-primary">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex flex-col items-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFromCart(item._id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center gap-2 bg-background rounded-lg border">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-12 text-center font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                disabled={item.quantity >= item.stock}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-sm font-medium">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-6 bg-muted/60">
                    <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Price Breakdown */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-medium">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tax (8%)</span>
                          <span className="font-medium">${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shipping</span>
                          <span className="font-medium">${shipping.toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="font-semibold text-lg">Total</span>
                            <span className="font-bold text-2xl text-primary">
                              ${total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Promo Code */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Promo Code</label>
                        <div className="flex gap-2">
                          <Input placeholder="Enter code" className="bg-muted/60" />
                          <Button variant="outline">Apply</Button>
                        </div>
                      </div>

                      {/* Checkout Button */}
                      <Button className="w-full" size="lg">
                        <CreditCard className="w-5 h-5 mr-2" />
                        Proceed to Checkout
                      </Button>

                      {/* Shipping Info */}
                      <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Truck className="w-4 h-4" />
                          <span>Free shipping on orders over $500</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>Delivery in 3-5 business days</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ORDER HISTORY TAB */}
          <TabsContent value="orders" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <p className="text-sm text-muted-foreground">
                  View and track your past orders
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockOrderHistory.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <p className="font-semibold">{order.id}</p>
                          <p className="text-sm text-muted-foreground">
                            Placed on {new Date(order.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Items:</span>
                        <span className="ml-2 font-medium">{order.items}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <span className="ml-2 font-medium">${order.total.toFixed(2)}</span>
                      </div>
                      <div>
                        {order.deliveredDate && (
                          <>
                            <span className="text-muted-foreground">Delivered:</span>
                            <span className="ml-2 font-medium">
                              {new Date(order.deliveredDate).toLocaleDateString()}
                            </span>
                          </>
                        )}
                        {order.estimatedDelivery && (
                          <>
                            <span className="text-muted-foreground">Est. Delivery:</span>
                            <span className="ml-2 font-medium">
                              {new Date(order.estimatedDelivery).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Order Products */}
                    <div className="border-t pt-3 mt-3 space-y-2">
                      {order.products.map((product, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {product.name} × {product.quantity}
                          </span>
                          <span className="font-medium">
                            ${(product.price * product.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                      {order.status === "Delivered" && (
                        <Button variant="outline" size="sm" className="flex-1">
                          Reorder
                        </Button>
                      )}
                      {order.status === "In Transit" && (
                        <Button variant="outline" size="sm" className="flex-1">
                          <Truck className="w-4 h-4 mr-1" />
                          Track Order
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}