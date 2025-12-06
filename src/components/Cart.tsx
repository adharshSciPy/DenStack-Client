import { useEffect, useState } from "react";
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
  ShoppingBag,
  DollarSign,
  XCircle,
  X,
  MapPin,
  Calendar,
  User,
} from "lucide-react";
import inventoryBaseUrl from "../inventoryBaseUrl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { removeFromCart } from "../redux/slice/cartSlice";
import { useAppSelector } from "../redux/hook";
import { useDispatch } from "react-redux";
import axios from "axios";
import clinicInventoryBaseUrl from "../clinicInventoryBaseUrl";


// Interfaces
interface cart {
  image: string[];
  name: string;
  price: number;
  quantity: number;
  _id: string;
  stock: number;
  vendorId:string;
}

interface order {
  items: ProductItem[];
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
  userId: string;
  _id: string;
  status: string;
  createdAt?: string;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface ProductItem {
  itemId: itemData;
  quantity: number;
  totalCost: number;
  unitCost: number;
  _id: string;
  name: string;
  product: {
    name: string;
    image: string[];
  };
}

interface itemData {
  name: string;
  price: number;
  _id: string;
  image: string[];
}
const getStatusConfig = (status: string) => {
  const configs = {
    DELIVERED: {
      icon: <CheckCircle className="w-5 h-5" />,
      color: "bg-green-500/10 text-green-700 border-green-200",
      dotColor: "bg-green-500",
      label: "Delivered",
    },
    PROCESSING: {
      icon: <Clock className="w-5 h-5" />,
      color: "bg-blue-500/10 text-blue-700 border-blue-200",
      dotColor: "bg-blue-500",
      label: "Processing",
    },
    CANCELLED: {
      icon: <XCircle className="w-5 h-5" />,
      color: "bg-red-500/10 text-red-700 border-red-200",
      dotColor: "bg-red-500",
      label: "Cancelled",
    },
    SHIPPED: {
      icon: <Truck className="w-5 h-5" />,
      color: "bg-purple-500/10 text-purple-700 border-purple-200",
      dotColor: "bg-purple-500",
      label: "Shipped",
    },
    PENDING: {
      icon: <Clock className="w-5 h-5" />,
      color: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
      dotColor: "bg-yellow-500",
      label: "Pending",
    },
  };
  return configs[status as keyof typeof configs] || configs.PROCESSING;
};
// Order Details Modal Component
const OrderDetailsModal = ({
  order,
  onClose,
}: {
  order: order;
  onClose: () => void;
}) => {
  const statusConfig = getStatusConfig(order.status);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
    >
      <div
        className="bg-white rounded-xl  overflow-hidden shadow-2xl "
        style={{
          height: "80vh",
          overflow: "scroll",
          width: "max-content",
          scrollbarWidth: "none",
        }}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-50 to-white p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Order Details</h2>
            <p className="text-sm text-slate-500 mt-1">
              Order #{order._id.slice(-8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6 space-y-6">
          {/* Order Status Card */}
          <div className={`p-6 rounded-xl border ${statusConfig.color}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {statusConfig.icon}
                <div>
                  <h3 className="font-bold text-lg">{statusConfig.label}</h3>
                  <p className="text-sm opacity-80">
                    Payment: {order.paymentStatus}
                  </p>
                </div>
              </div>
              <div
                className={`w-3 h-3 rounded-full ${statusConfig.dotColor} animate-pulse`}
              ></div>
            </div>

            {/* Order Info Grid */}
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 opacity-60" />
                <div>
                  <p className="text-xs opacity-70">Order Date</p>
                  <p className="font-medium">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 opacity-60" />
                <div>
                  <p className="text-xs opacity-70">Total Amount</p>
                  <p className="font-bold text-lg">
                    ${order.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address (if available) */}
          {order.deliveryAddress && (
            <div className="bg-slate-50 p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-slate-600" />
                <h3 className="font-bold text-slate-900">Delivery Address</h3>
              </div>
              <p className="text-slate-700">
                {order.deliveryAddress.street}
                <br />
                {order.deliveryAddress.city}, {order.deliveryAddress.state}{" "}
                {order.deliveryAddress.zipCode}
              </p>
            </div>
          )}

          {/* Order Items */}
          <div>
            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items ({order.items.length})
            </h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div
                  key={item._id || index}
                  className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Product Image Placeholder */}
                    <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center border-2 border-slate-200 flex-shrink-0">
                      <img
                        src={`${inventoryBaseUrl}${item.product?.image[0]}`}
                        alt={item.product?.name || ""}
                        style={{
                          height: "100px",
                          width: "100px",
                          objectFit: "cover",
                        }}
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-1">
                        {item.product?.name || "Product"}
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-slate-500">Quantity:</span>
                          <span className="ml-2 font-medium text-slate-900">
                            {item.quantity}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Unit Price:</span>
                          <span className="ml-2 font-medium text-slate-900">
                            ${(item.totalCost / item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-1">Item Total</p>
                      <p className="font-bold text-xl text-slate-900">
                        ${item.totalCost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-slate-900 text-white rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="opacity-80">
                  Subtotal ({order.items.length} items)
                </span>
                <span className="font-medium">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-80">Tax & Fees</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-80">Shipping</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="border-t border-white/20 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total Amount</span>
                  <span className="font-bold text-2xl">
                    ${order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-6 border-t border-slate-200 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          {order.status === "DELIVERED" && (
            <Button className="flex-1 bg-slate-900 hover:bg-slate-800">
              Reorder Items
            </Button>
          )}
          {order.status === "PROCESSING" && (
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              <Truck className="w-4 h-4 mr-2" />
              Track Order
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function CartOrderPage() {
  const cartItem = useAppSelector((state) => state.cart.items);
  const dispatch = useDispatch();
  const [cartItems, setCartItems] = useState<cart[]>(cartItem);
  const [orders, setOrders] = useState<order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<order | null>(null);
 const [orderStatuses, setOrderStatuses] = useState<Record<string, string>>({});


  const clinicId = useAppSelector((state) => state.auth.clinicId);
  const clinicToken = useAppSelector((state) => state.auth.token);

  const updateQuantity = (id: string, newQuantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item._id === id
          ? {
              ...item,
              quantity: Math.max(1, Math.min(newQuantity, item.stock)),
            }
          : item
      )
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item._id !== id));
    dispatch(removeFromCart(id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckOut = async () => {
    try {
      if (cartItem.length === 0) {
        alert("Cart item is empty");
        return;
      }
      if (!clinicToken || !clinicId) {
        alert("Please log in to complete purchase");
        return;
      }
      const itemToSend = cartItems.map((item) => ({
        productId: item._id,
        quantity: item.quantity,
        vendorId:item.vendorId
      }));

      const response = await axios.post(
        `${clinicInventoryBaseUrl}/api/v1/clinicPurchase/purchase`,
        {
          clinicId: clinicId,
          items: itemToSend,
        },
        {
          headers: {
            Authorization: `Bearer ${clinicToken}`,
          },
        }
      );

      if (response.status === 201) {
        itemToSend.forEach((item) => {
          dispatch(removeFromCart(item.productId));
        });
        setCartItems([]);
        handleGetOrderHistory();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleGetOrderHistory = async () => {
    try {
      const res = await axios.get(
        `${clinicInventoryBaseUrl}/api/v1/clinicPurchase/orders/${clinicId}`,
        {
          headers: {
            Authorization: `Bearer ${clinicToken}`,
          },
        }
      );
      setOrders(res.data?.data || []);
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    handleGetOrderHistory();
  }, []);

  const handleDeliver=async(orderId:string)=>{
    try {
      const res=await axios.post(`${clinicInventoryBaseUrl}/api/v1/clinicPurchase/clinic/order/mark-delivered`,{
        orderId: orderId,
        clinicId: clinicId
      },)
      if(res.status===200){
        handleGetOrderHistory();
      }
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  }
 const toggleOrderStatus = (orderId: string) => {
  
   handleDeliver(orderId);
    // setOrderStatuses(prev => ({
    //   ...prev,
    //   [orderId]: prev[orderId] === "PENDING" ? "DELIVERED" : "PENDING"
    // }));
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
        <Tabs defaultValue="cart" className="w-full">
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
          <TabsContent value="cart" className="space-y-6 mt-6">
            {cartItems.length === 0 ? (
              <Card className="bg-muted/60">
                <CardContent className="p-12 text-center">
                  <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    Your cart is empty
                  </h3>
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
                    <CardContent className="space-y-4">
                      {cartItems.map((item) => (
                        <div
                          key={item._id}
                          className="flex gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div
                            className="w-24 h-24 flex-shrink-0 bg-muted rounded-lg overflow-hidden"
                            style={{ height: "100px", width: "100px" }}
                          >
                            <img
                              src={`${inventoryBaseUrl}${item.image[0]}`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              style={{ height: "100%", width: "100%" }}
                            />
                          </div>

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
                                onClick={() =>
                                  updateQuantity(item._id, item.quantity - 1)
                                }
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
                                onClick={() =>
                                  updateQuantity(item._id, item.quantity + 1)
                                }
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

                <div className="lg:col-span-1">
                  <Card className="sticky top-6 bg-muted/60">
                    <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Subtotal
                          </span>
                          <span className="font-medium">
                            ${subtotal.toFixed(2)}
                          </span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="font-semibold text-lg">Total</span>
                            <span className="font-bold text-2xl text-primary">
                              ${subtotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleCheckOut}
                      >
                        <CreditCard className="w-5 h-5 mr-2" />
                        Proceed to Checkout
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ORDER HISTORY TAB */}
          <TabsContent value="orders" className="space-y-6 mt-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b rounded-xl">
                <CardTitle className="text-2xl">Order History</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track and manage all your orders in one place
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {orders.map((order) => {
                    const statusConfig = getStatusConfig(order.status);

                    return (
                      <div
                        key={order._id}
                        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-slate-200"
                      >
                        {/* HEADER */}
                        <div className="bg-gradient-to-r from-slate-50 to-white p-6 border-b border-slate-200">
                          <div className="flex items-start justify-between mb-4">
                            {/* LEFT – Order Info */}
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-3 rounded-lg ${statusConfig.color} border`}
                              >
                                {statusConfig.icon}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-bold text-slate-900">
                                    Order #{order._id.slice(-8).toUpperCase()}
                                  </h3>
                                  <div
                                    className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`}
                                  ></div>
                                </div>
                                <p className="text-sm text-slate-500 mt-1">
                                  Payment: {order.paymentStatus}
                                </p>
                              </div>
                            </div>

                            {/* RIGHT – Status Label + Toggle */}
                            <div className="flex items-center gap-4">
                              {/* STATUS LABEL */}
                              <span
                                className={`px-4 py-2 rounded-full border font-semibold text-sm ${statusConfig.color}`}
                              >
                                {statusConfig.label}
                              </span>
                            </div>
                          </div>

                          {/* SUMMARY ICONS */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex items-center gap-2 text-sm">
                              <ShoppingBag className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-600">
                                {order.items.length} Items
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-900 font-semibold">
                                ${order.totalAmount.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-end gap-2 text-sm" style={{justifyContent: "end"}}>
                              {/* TOGGLE SWITCH */}
                              <button
                                onClick={() => toggleOrderStatus(order._id)}
                                style={{
                                  height: "28px", // same as h-7
                                  width: "56px", // same as w-14
                                  borderRadius: "9999px",
                                  position: "relative",
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "2px",
                                  transition: "background-color 0.3s ease",
                                  backgroundColor:
                                    `${order.status}` === "DELIVERED"
                                      ? "#22c55e" // green-500
                                      : "#cbd5e1", // slate-300
                                }}
                              >
                                <div
                                  style={{
                                    height: "20px", // h-5
                                    width: "20px", // w-5
                                    backgroundColor: "white",
                                    borderRadius: "9999px",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                                    position: "absolute",
                                    top: "4px",
                                    left:
                                      `${order.status}` === "DELIVERED"
                                        ? "28px" // translate-x-7
                                        : "4px", // translate-x-0
                                    transition: "all 0.3s ease",
                                  }}
                                />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* ITEMS */}
                        <div className="p-6 space-y-3">
                          {order.items.map((item) => (
                            <div
                              key={item.itemId?._id}
                              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                                  <Package className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {item.product?.name || "Product"}
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    Quantity: {item.quantity}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="font-bold text-slate-900">
                                  ${item.totalCost.toFixed(2)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  ${(item.totalCost / item.quantity).toFixed(2)}{" "}
                                  each
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* FOOTER BUTTONS */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setSelectedOrder(order)}
                          >
                            View Details
                          </Button>

                          {order.orderStatus === "DELIVERED" && (
                            <Button
                              size="sm"
                              className="flex-1 bg-slate-900 hover:bg-slate-800"
                            >
                              Reorder
                            </Button>
                          )}

                          {order.orderStatus === "PROCESSING" && (
                            <Button
                              size="sm"
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Truck className="w-4 h-4 mr-1" />
                              Track Order
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
