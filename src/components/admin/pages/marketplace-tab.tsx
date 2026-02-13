import { useEffect, useState } from "react";
import {
  Search,
  ShoppingCart,
  Star,
  Filter,
  Package,
  Truck,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Store,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import axios from "axios";
import { useAppSelector } from "../../../redux/hook";
import inventoryBaseUrl from "../../../inventoryBaseUrl";
import { useNavigate } from "react-router-dom";
import { addToCart } from "../../../redux/slice/cartSlice";
import { useDispatch } from "react-redux";

interface Product {
  _id: string;
  productId: string;
  name: string;
  description: string;
  price: number;
  image: string[];
  brand: string | { brandName?: string };
  category: { _id: string };
  stock: number;
  isLowStock: boolean;
  status: string;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
  addedById: string;
  __v: number;
}

interface EcommerceOrder {
  _id: string;
  orderId: string;
  clinicId: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  totalAmount: number;
  status: string;
  orderDate: string;
  deliveryDate?: string;
}

interface EcommerceProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  brand: string;
  category: string;
  stock: number;
  rating: number;
  reviewsCount: number;
  vendorName: string;
}

interface AuthState {
  token: string | null;
  user?: {
    _id: string;
    // Add other user properties as needed
  };
}

interface CartItem {
  _id: string;
  name: string;
  price: number;
  image: string[];
  quantity: number;
  stock: number;
  vendorId?: string;
  isEcommerce?: boolean;
}

interface ProductImageGalleryProps {
  product: Product | EcommerceProduct;
  inventoryBaseUrl?: string;
  className?: string;
  isEcommerce?: boolean;
}

// ✅ ---- IMAGE GALLERY COMPONENT ---- //
function ProductImageGallery({
  product,
  inventoryBaseUrl = "",
  className,
  isEcommerce = false,
}: ProductImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = isEcommerce 
    ? (product as EcommerceProduct).images 
    : (product as Product).image;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative overflow-hidden rounded-t-lg">
      <div className="relative h-48 bg-muted/20">
        {/* MAIN PRODUCT IMAGE */}
        <img
          src={isEcommerce 
            ? images[currentImageIndex] 
            : `${inventoryBaseUrl}${images[currentImageIndex]}`
          }
          alt={`${product.name} image ${currentImageIndex + 1}`}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop";
          }}
        />

        {/* SLIDE ARROWS */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2
                         bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2
                         bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* INDICATORS */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-2 h-2 transition-all rounded-full ${
                  idx === currentImageIndex ? "bg-white w-4" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* BADGES */}
        {!isEcommerce && (product as Product).isLowStock && (
          <Badge className="absolute top-2 right-2 bg-red-600 hover:bg-red-700">
            Out of Stock
          </Badge>
        )}
        {isEcommerce && (
          <Badge className="absolute top-2 right-2 bg-green-600 hover:bg-green-700">
            <Store className="w-3 h-3 mr-1" />
            Ecommerce
          </Badge>
        )}
      </div>
    </div>
  );
}

// ✅ ---- PRODUCT DETAIL MODAL ---- //
interface ProductDetailModalProps {
  product: Product | EcommerceProduct;
  inventoryBaseUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product | EcommerceProduct, quantity: number) => void;
  isEcommerce?: boolean;
}

function ProductDetailModal({
  product,
  inventoryBaseUrl = "",
  isOpen,
  onClose,
  onAddToCart,
  isEcommerce = false,
}: ProductDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const images = isEcommerce 
    ? (product as EcommerceProduct).images 
    : (product as Product).image;

  const stock = isEcommerce 
    ? (product as EcommerceProduct).stock 
    : (product as Product).stock;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= stock) {
      setQuantity(value);
    } else if (e.target.value === "") {
      setQuantity(1);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] shadow-2xl relative overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-muted/60 hover:bg-muted rounded-full p-2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* LEFT: IMAGE CAROUSEL */}
          <div>
            <div className="relative overflow-hidden rounded-lg bg-muted/30">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
              >
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="w-full shrink-0"
                    style={{ aspectRatio: "1 / 1" }}
                  >
                    <img
                      src={isEcommerce ? img : `${inventoryBaseUrl}${img}`}
                      alt={`Product image ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=600&fit=crop";
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* NAVIGATION ARROWS */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute top-1/2 left-3 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute top-1/2 right-3 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* IMAGE COUNTER */}
              <div className="absolute bottom-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>
          </div>

          {/* RIGHT: PRODUCT DETAILS */}
          <div className="space-y-6">
            {/* HEADER */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-3xl font-bold">{product.name}</h2>
                {isEcommerce && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <Store className="w-3 h-3 mr-1" />
                    Ecommerce
                  </Badge>
                )}
              </div>
              {isEcommerce && (
                <p className="text-muted-foreground">
                  Sold by: {(product as EcommerceProduct).vendorName}
                </p>
              )}
            </div>

            {/* RATING */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({isEcommerce ? (product as EcommerceProduct).reviewsCount : 0} reviews)
              </span>
            </div>

            {/* PRICE & STOCK */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold text-primary">
                    ${product.price}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Price per unit
                  </p>
                </div>
                <Badge variant="outline" className="text-base px-3 py-1">
                  {stock} in stock
                </Badge>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* PRODUCT INFO */}
            <div className="space-y-2">
              {isEcommerce && (
                <>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium">
                      {(product as EcommerceProduct).category}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Brand</span>
                    <span className="font-medium">
                      {(product as EcommerceProduct).brand}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* QUANTITY INPUT */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <span className="text-muted-foreground">Quantity</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center border rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={stock}
                  className="w-16 text-center border rounded py-1"
                  value={quantity}
                  onChange={handleQuantityChange}
                />
                <button
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  className="w-8 h-8 flex items-center justify-center border rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={quantity >= stock}
                >
                  +
                </button>
              </div>
            </div>

            {/* TOTAL PRICE */}
            <div className="flex justify-between p-4 bg-primary/5 rounded-lg">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-lg text-primary">
                ${(product.price * quantity).toFixed(2)}
              </span>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 pt-4">
              <Button
                size="lg"
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={quantity <= 0}
                onClick={() => {
                  onAddToCart(product, quantity);
                  onClose();
                }}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ ---- MARKETPLACE TAB MAIN ---- //
export function MarketplaceTab() {
  const auth = useAppSelector((state: any) => state.auth as AuthState);
  const token = auth?.token || null;
  const user = auth?.user;
  const cartItems = useAppSelector((state: any) => state.cart.items as CartItem[]);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  console.log("MarketplaceTab Rendered - Token:", token);

  // State variables
  const [selectedCategory, setSelectedCategory] = useState("All Products");
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | EcommerceProduct | null>(null);
  const [ecommerceProducts, setEcommerceProducts] = useState<EcommerceProduct[]>([]);
  const [ecommerceOrders, setEcommerceOrders] = useState<EcommerceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasEcommerceOrders, setHasEcommerceOrders] = useState(false);
  const [activeView, setActiveView] = useState<'inventory' | 'ecommerce'>('inventory');

  // Check if clinic has ecommerce orders
  const checkEcommerceOrders = async () => {
    if (!token || !user?._id) {
      setHasEcommerceOrders(false);
      return;
    }

    try {
      setIsLoading(true);
      // Call your API to check if clinic has ecommerce orders
      const response = await axios.get(
        `${inventoryBaseUrl}/api/v1/ecommerce/orders/clinic/${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.data && response.data.data.length > 0) {
        setHasEcommerceOrders(true);
        setEcommerceOrders(response.data.data);
        // Fetch ecommerce products if orders exist
        await fetchEcommerceProducts();
      } else {
        setHasEcommerceOrders(false);
      }
    } catch (error) {
      console.error("Error checking ecommerce orders:", error);
      setHasEcommerceOrders(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch ecommerce products
  const fetchEcommerceProducts = async () => {
    try {
      const response = await axios.get(
        `${inventoryBaseUrl}/api/v1/ecommerce/products`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEcommerceProducts(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching ecommerce products:", error);
      setEcommerceProducts([]);
    }
  };

  // Navigate to external ecommerce with token
  const navigateToEcommerce = () => {
    if (!token) {
      console.error("No token available");
      return;
    }
    
    // Encode token for safe URL passing
    const encodedToken = encodeURIComponent(token);
    const clinicId = user?._id || '';
    
    // Replace with your actual ecommerce URL
    const ecommerceUrl = `http://localhost:4000/login?accessToken=${encodedToken}&clinicId=${clinicId}`;
    
    // Open in new tab
    window.open(ecommerceUrl, '_blank');
  };

  // Fetch product categories
  const getCategories = async () => {
    try {
      const response = await axios.get(
        `${inventoryBaseUrl}/api/v1/category/maincategories`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const categoryNames = response.data?.data?.map(
        (cat: any) => cat.categoryName
      ) || [];
      setCategories(["All Products", ...categoryNames]);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories(["All Products"]);
    }
  };

  // Fetch inventory products
  const getProducts = async () => {
    try {
      const response = await axios.get(
        `${inventoryBaseUrl}/api/v1/product/productsDetails`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  // Initialize
  useEffect(() => {
    if (token) {
      checkEcommerceOrders();
      getCategories();
      getProducts();
    }
  }, [token, user]);

  const handleAddToCart = (product: Product | EcommerceProduct, quantity: number) => {
    const isEcommerceProd = 'images' in product;
    
    const cartItem = {
      _id: product._id,
      name: product.name,
      price: product.price,
      image: isEcommerceProd ? product.images : product.image,
      quantity: quantity,
      stock: product.stock,
      vendorId: 'addedById' in product ? product.addedById : '',
      isEcommerce: isEcommerceProd,
    };

    dispatch(addToCart(cartItem));
  };

  const goToCart = () => {
    navigate("/cart");
  };

  // Render ecommerce orders section
  const renderEcommerceOrders = () => {
    if (!hasEcommerceOrders || ecommerceProducts.length === 0) {
      return (
        <Card className="bg-linear-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-8 text-center">
            <Store className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Access Ecommerce Marketplace</h3>
            <p className="text-muted-foreground mb-6">
              Browse and order from our extensive ecommerce marketplace with your clinic account
            </p>
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={navigateToEcommerce}
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Visit Ecommerce Marketplace
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Ecommerce Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Store className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold">Ecommerce Products</h2>
            </div>
            <p className="text-muted-foreground">
              Products from our marketplace partners
            </p>
          </div>
          <Button 
            variant="outline" 
            className="border-green-600 text-green-600 hover:bg-green-50"
            onClick={navigateToEcommerce}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Browse More
          </Button>
        </div>

        {/* View Toggle */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${
              activeView === 'inventory'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground'
            }`}
            onClick={() => setActiveView('inventory')}
          >
            Inventory Products
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeView === 'ecommerce'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-muted-foreground'
            }`}
            onClick={() => setActiveView('ecommerce')}
          >
            Ecommerce Products
          </button>
        </div>

        {/* Ecommerce Products Grid */}
        {activeView === 'ecommerce' && (
          <>
            {/* Recent Orders */}
            {ecommerceOrders.length > 0 && (
              <Card className="border-green-200">
                <CardHeader className="bg-green-50 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Ecommerce Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {ecommerceOrders.slice(0, 3).map((order) => (
                      <div
                        key={order._id}
                        className="p-4 bg-green-50/50 rounded-lg border border-green-100"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Order #{order.orderId}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.orderDate).toLocaleDateString()} • 
                              {order.items.length} items • ${order.totalAmount}
                            </p>
                          </div>
                          <Badge className={
                            order.status === 'Delivered' 
                              ? 'bg-green-600' 
                              : order.status === 'Processing'
                              ? 'bg-yellow-600'
                              : 'bg-blue-600'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ecommerce Products */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ecommerceProducts.map((product) => (
                <Card
                  key={product._id}
                  className="hover:shadow-lg transition-shadow group border-green-200 hover:border-green-300"
                >
                  <ProductImageGallery
                    product={product}
                    isEcommerce={true}
                    className="rounded-t-lg"
                  />
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium line-clamp-2">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {product.brand}
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            <Store className="w-3 h-3 mr-1" />
                            {product.vendorName}
                          </Badge>
                        </div>
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
                          ({product.reviewsCount} reviews)
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-green-600">
                          ${product.price}
                        </p>
                        <Badge variant="outline" className="bg-blue-50">
                          Stock: {product.stock}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedProduct(product)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => setSelectedProduct(product)}
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
          </>
        )}

        {/* Inventory Products Grid */}
        {activeView === 'inventory' && (
          <div className="space-y-6">
            <Card className="bg-muted/60">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search products..." className="pl-10" />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card
                  key={product._id}
                  className="hover:shadow-lg bg-muted/60 transition-shadow group rounded-lg hover:shadow-xl"
                >
                  <ProductImageGallery
                    product={product}
                    inventoryBaseUrl={inventoryBaseUrl}
                    className="rounded-t-lg"
                  />
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {typeof product.brand === "string"
                            ? "Brand ID"
                            : product.brand?.brandName || "N/A"}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">4.5</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          (0 reviews)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-primary">
                          ${product.price}
                        </p>
                        <Badge variant="outline">
                          Stock: {product.stock}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedProduct(product)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-primary hover:bg-primary/90"
                          disabled={product.isLowStock}
                          onClick={() => setSelectedProduct(product)}
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
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          inventoryBaseUrl={inventoryBaseUrl}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          isEcommerce={'images' in selectedProduct}
        />
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Marketplace</h2>
          <p className="text-muted-foreground">
            {hasEcommerceOrders 
              ? "Browse inventory and ecommerce products" 
              : "Browse and order dental supplies"}
          </p>
        </div>
        <Button variant="outline" className="relative" onClick={goToCart}>
          <ShoppingCart className="w-4 h-4 mr-2" />
          Cart
          {cartItems.length > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-destructive">
              {cartItems.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : hasEcommerceOrders ? (
        renderEcommerceOrders()
      ) : (
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="ecommerce">
              <Store className="w-4 h-4 mr-2" />
              Ecommerce
            </TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-6 mt-6">
            <Card className="bg-muted/60">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search products..." className="pl-10" />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card
                  key={product._id}
                  className="hover:shadow-lg bg-muted/60 transition-shadow group rounded-lg hover:shadow-xl"
                >
                  <ProductImageGallery
                    product={product}
                    inventoryBaseUrl={inventoryBaseUrl}
                    className="rounded-t-lg"
                  />
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {typeof product.brand === "string"
                            ? "Brand ID"
                            : product.brand?.brandName || "N/A"}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">4.5</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          (0 reviews)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-primary">
                          ${product.price}
                        </p>
                        <Badge variant="outline">
                          Stock: {product.stock}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedProduct(product)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-primary hover:bg-primary/90"
                          disabled={product.isLowStock}
                          onClick={() => setSelectedProduct(product)}
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

          {/* Ecommerce Tab */}
          <TabsContent value="ecommerce" className="space-y-6 mt-6">
            <Card className="bg-linear-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-8 text-center">
                <Store className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Access Ecommerce Marketplace</h3>
                <p className="text-muted-foreground mb-6">
                  Browse and order from our extensive ecommerce marketplace with your clinic account
                </p>
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={navigateToEcommerce}
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Visit Ecommerce Marketplace
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}