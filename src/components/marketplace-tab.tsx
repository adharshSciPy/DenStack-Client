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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import axios from "axios";
import { useAppSelector } from "../redux/hook";
import inventoryBaseUrl from "../inventoryBaseUrl";
import { useNavigate } from "react-router-dom";
import { addToCart } from "../redux/slice/cartSlice";
import { useDispatch } from "react-redux";

interface Product {
  _id: string;
  productId: string;
  name: string;
  description: string;
  price: number;
  image: string[];
  brand: string | { brandName?: string }; // API sometimes sends id, sometimes full object
  category: { _id: string };
  stock: number;
  isLowStock: boolean;
  status: string;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ProductImageGalleryProps {
  product: Product;
  inventoryBaseUrl: string;
  className?: string;
}

// ✅ ---- IMAGE GALLERY COMPONENT ---- //

function ProductImageGallery({
  product,
  inventoryBaseUrl,
  className,
}: ProductImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = product.image;

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
          src={`${inventoryBaseUrl}${images[currentImageIndex]}`}
          alt={`${product.name} image ${currentImageIndex + 1}`}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform rounded-lg"
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
                         bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2
                         bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5"
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
                className={`w-2 h-2 transition-all rounded-lg ${
                  idx === currentImageIndex ? "bg-white w-4" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* BADGES */}
        {product.isLowStock ? (
          <Badge className="absolute top-2 right-2 bg-red-600">
            Out of Stock
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

// ✅ ---- PRODUCT DETAIL MODAL ---- //

interface ProductDetailModalProps {
  product: Product;
  inventoryBaseUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

function ProductDetailModal({
  product,
  inventoryBaseUrl,
  isOpen,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const images = product.image;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 0 && value <= product.stock) {
      setQuantity(value);
    } else if (e.target.value === "") {
      setQuantity(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        overflowY: "auto",
        marginBottom: "0",
      }}
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg w-full"
        style={{
          maxWidth: "56rem",
          maxHeight: "90vh",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          position: "relative",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="bg-muted/60 hover:bg-muted rounded-full p-2 transition-colors"
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            zIndex: 10,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid md:grid-cols-1 gap-6 p-6">
          {/* LEFT: IMAGE CAROUSEL */}
          <div className="product-popup-carousel">
            <div className="relative overflow-hidden rounded-lg bg-muted/30 carousel-wrapper">
              {/* CAROUSEL TRACK */}
              <div
                className="flex transition-transform duration-500"
                style={{
                  transform: `translateX(-${currentImageIndex * 100}%)`,
                  height: "100%",
                }}
              >
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="w-full flex-shrink-0"
                    style={{ width: "100%", aspectRatio: "1 / 1" }}
                  >
                    <img
                      src={`${inventoryBaseUrl}${img}`}
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
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "12px",
                      transform: "translateY(-50%)",
                      padding: "8px",
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      color: "white",
                      borderRadius: "9999px",
                      cursor: "pointer",
                      border: "none",
                    }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={nextImage}
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: "12px",
                      transform: "translateY(-50%)",
                      padding: "8px",
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      color: "white",
                      borderRadius: "9999px",
                      cursor: "pointer",
                      border: "none",
                    }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* IMAGE COUNTER */}
              <div
                style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "12px",
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  fontSize: "0.875rem",
                }}
              >
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>
          </div>

          {/* RIGHT: PRODUCT DETAILS */}
          <div className="space-y-6">
            {/* HEADER */}
            <div>
              <h2 className="text-3xl font-bold mb-2">{product.name}</h2>
              <p className="text-muted-foreground">
                {typeof product.brand === "string"
                  ? "Brand ID"
                  : product.brand?.brandName || "N/A"}
              </p>
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
              <span className="text-sm text-muted-foreground">(0 reviews)</span>
            </div>

            {/* PRICE & STOCK */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-3xl font-bold text-primary">
                  ${product.price}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Price per unit
                </p>
              </div>

              <div className="text-right">
                <Badge
                  variant={product.isLowStock ? "destructive" : "outline"}
                  className="text-base px-3 py-1"
                >
                  {product.isLowStock
                    ? "Out of Stock"
                    : `${product.stock} in stock`}
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
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Product ID</span>
                <span className="font-medium">{product.productId}</span>
              </div>

              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline">{product.status}</Badge>
              </div>

              {product.expiryDate && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Expiry Date</span>
                  <span className="font-medium">
                    {new Date(product.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* QUANTITY INPUT */}
            <div className="flex justify-between py-2 border-b items-center">
              <span className="text-muted-foreground">Quantity</span>
              <input
                type="number"
                min="0"
                max={product.stock}
                className="w-24 px-3 py-1 border rounded-md text-center"
                placeholder="Quantity"
                value={quantity}
                onChange={handleQuantityChange}
              />
            </div>

            {/* TOTAL PRICE */}
            <div className="flex justify-between py-2 bg-muted/20 px-4 rounded-lg">
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
                disabled={product.isLowStock || quantity <= 0}
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

// ✅ ---- ORDER HISTORY (STATIC) ---- //

const orderHistory = [
  {
    id: "ORD-001",
    date: "2025-09-10",
    items: 3,
    total: 459.97,
    status: "Delivered",
  },
  {
    id: "ORD-002",
    date: "2025-09-08",
    items: 1,
    total: 2499.99,
    status: "In Transit",
  },
  {
    id: "ORD-003",
    date: "2025-09-05",
    items: 5,
    total: 234.95,
    status: "Delivered",
  },
];

// ✅ ---- MARKETPLACE TAB MAIN ---- //

export function MarketplaceTab() {
  const { token } = useAppSelector((state) => state.auth);
  const cartItems = useAppSelector((state) => state.cart.items);
  console.log(cartItems);

  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All Products");
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const dispatch = useDispatch();

  const handleAddToCart = (product: Product, quantity: number) => {
    dispatch(
      addToCart({
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity,
        stock:product.stock
      })
    );
  };

  // ✅ Fetch product categories
  const getCategories = async () => {
    try {
      const response = await axios.get(
        `${inventoryBaseUrl}/api/v1/category/maincategories`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const categoryNames = response.data.data.map(
        (cat: any) => cat.categoryName
      );
      console.log("res",response);
      
      setCategories(["All Products", ...categoryNames]);
    } catch (error) {
      console.error(error);
    }
  };

  // ✅ Fetch product list
  const getProducts = async () => {
    try {
      const response = await axios.get(
        `${inventoryBaseUrl}/api/v1/product/productsDetails`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProducts(response.data.data);
      console.log(response);
      
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getCategories();
    getProducts();
  }, []);

  const goToCart = () => {
    navigate("/cart");
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
        />
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Marketplace</h2>
          <p className="text-muted-foreground">
            Browse and order dental supplies
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

      {/* TABS */}
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        {/* ✅ ---- BROWSE PRODUCTS TAB ---- */}
        <TabsContent value="browse" className="space-y-6 mt-6">
          {/* SEARCH + FILTER */}
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

              {/* CATEGORY FILTER */}
              <div className="flex flex-wrap gap-2 mt-4">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={
                      selectedCategory === category ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ✅ ---- PRODUCT GRID ---- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card
                key={product._id}
                className="hover:shadow-lg bg-muted/60 transition-shadow group rounded-lg"
              >
                <ProductImageGallery
                  product={product}
                  inventoryBaseUrl={inventoryBaseUrl}
                  className="rounded-t-lg"
                />

                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* PRODUCT NAME + BRAND */}
                    <div>
                      <h3 className="font-medium line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {typeof product.brand === "string"
                          ? "Brand ID"
                          : product.brand.brandName || "N/A"}
                      </p>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>

                    {/* STAR RATING */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">4.5</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        (0 reviews)
                      </span>
                    </div>

                    {/* PRICE + STOCK */}
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-primary">
                        ${product.price}
                      </p>
                      <Badge variant="outline">Stock: {product.stock}</Badge>
                    </div>

                    {/* BUTTONS */}
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

        {/* ✅ ---- ORDERS TAB ---- */}
        <TabsContent value="orders" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderHistory.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 bg-muted/30 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <Package className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium">Order {order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.date} • {order.items} items • ${order.total}
                        </p>
                      </div>
                    </div>

                    <Badge
                      className={
                        order.status === "Delivered"
                          ? "bg-green-600"
                          : "bg-secondary"
                      }
                    >
                      {order.status === "In Transit" && (
                        <Truck className="w-3 h-3 mr-1" />
                      )}
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ✅ ---- FAVORITES TAB ---- */}
        <TabsContent value="favorites" className="space-y-6 mt-6">
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
              <p className="text-muted-foreground mb-4">
                Browse products and mark items as favorites
              </p>
              <Button
                className="bg-primary"
                onClick={() =>
                  document
                    .querySelector('[value="browse"]')
                    ?.dispatchEvent(new MouseEvent("click"))
                }
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