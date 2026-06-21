import React, { useState } from "react";

import { useLocation } from "wouter";
import { 
  useGetMe, 
  getGetMeQueryKey, 
  useLogout,
  useGetMyShop,
  getGetMyShopQueryKey,
  useUpdateMyShop,
  useGetShopStats,
  getGetShopStatsQueryKey,
  useListMyProducts,
  getListMyProductsQueryKey,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useListMyOrders,
  getListMyOrdersQueryKey,
  useUpdateOrder,
  useDeleteOrder
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/image-upload";

function getImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  const gdMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdMatch) return `https://lh3.googleusercontent.com/d/${gdMatch[1]}`;
  return url;
}

export function ShopDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isUserLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false }
  });

  React.useEffect(() => {
    if (!isUserLoading && (!user || user.role !== "shopOwner")) {
      setLocation("/login");
    }
  }, [user, isUserLoading, setLocation]);

  const logout = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/login");
      }
    }
  });

  const { data: shop, error: shopError } = useGetMyShop({
    query: { queryKey: getGetMyShopQueryKey(), enabled: !!user && user.role === "shopOwner", staleTime: 0, gcTime: 0 }
  });

  const { data: stats } = useGetShopStats({
    query: { queryKey: getGetShopStatsQueryKey(), enabled: !!user && user.role === "shopOwner" }
  });

  const isExpired = (shopError as any)?.expired === true
    || (shopError as any)?.response?.data?.expired === true
    || (shopError as any)?.status === 403
    || (shopError as any)?.response?.status === 403;

  if (isUserLoading || !user || user.role !== "shopOwner") return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="w-8 h-8">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-stone-900 mb-2">Subscription Expired</h1>
          <p className="text-stone-600 mb-6">Aapki subscription expire ho gayi hy. Payment karay Active ho jaeay gi.</p>
          <button onClick={() => { window.location.href = "/login"; }} className="text-sm text-stone-500 underline hover:text-stone-700">Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">{shop?.shopName || "My Shop"}</h1>
            <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">{shop?.plan} Plan</Badge>
          </div>
          <div className="flex items-center gap-3">
            {shop && (
              <Button variant="secondary" size="sm" asChild>
                <a href={`/store/${shop.slug}`} target="_blank" rel="noopener noreferrer">View Store</a>
              </Button>
            )}
            <Button variant="outline" className="text-foreground border-transparent hover:bg-white/10 hover:text-white" onClick={() => logout.mutate()} size="sm">Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalProducts}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-secondary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Orders Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.ordersToday}</div>
                {stats.pendingOrders !== undefined && stats.pendingOrders > 0 && (
                  <p className="text-sm text-secondary font-medium mt-1">{stats.pendingOrders} pending</p>
                )}
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-chart-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (Month)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">Rs {stats.revenueThisMonth.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className={stats.lowStockCount > 0 ? "border-l-4 border-l-destructive" : "border-l-4 border-l-muted"}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.lowStockCount}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="space-y-4 mt-6">
            <ProductsTab getImageUrl={getImageUrl} shop={shop} stats={stats} />
          </TabsContent>
          
          <TabsContent value="orders" className="space-y-4 mt-6">
            <OrdersTab />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-6">
            {shop ? <SettingsTab key={shop.id} shop={shop} /> : <div className="py-8 text-center text-muted-foreground">Loading settings...</div>}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ProductsTab({ getImageUrl, shop, stats }: { getImageUrl: (url: string | null | undefined) => string; shop?: any; stats?: any }) {
  const { data: products } = useListMyProducts({ query: { queryKey: getListMyProductsQueryKey() } });
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const planLimit: number | null = stats?.productLimit ?? null;
  const productCount = stats?.totalProducts ?? (products?.length ?? 0);
  const limitReached = planLimit !== null && productCount >= planLimit;

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Product deleted" });
          queryClient.invalidateQueries({ queryKey: getListMyProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetShopStatsQueryKey() });
        }
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Inventory</h2>
          {planLimit !== null && (
            <p className={`text-sm mt-0.5 ${limitReached ? "text-destructive font-medium" : "text-muted-foreground"}`}>
              {productCount} / {planLimit} products used{limitReached ? " — Limit reached!" : ""}
            </p>
          )}
        </div>
        <ProductDialog mode="create" shop={shop} limitReached={limitReached} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {products?.map((product) => (
          <Card key={product.id} className="overflow-hidden flex flex-col">
            <div className="aspect-square bg-muted relative overflow-hidden">
              {product.imageUrl ? (
                <img src={getImageUrl(product.imageUrl)} alt={product.name} className="absolute inset-0 w-full h-full object-contain p-1" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">No image</div>
              )}
              {product.stock <= 5 && (
                <Badge variant="destructive" className="absolute top-2 right-2">Low Stock</Badge>
              )}
            </div>
            <CardContent className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold line-clamp-1" title={product.name}>{product.name}</h3>
              </div>
              <p className="text-secondary font-bold mb-4">Rs {product.price.toLocaleString()}</p>
              
              <div className="mt-auto flex justify-between items-center text-sm text-muted-foreground">
                <span>Stock: {product.stock}</span>
                <span>{product.category || "Uncategorized"}</span>
              </div>
              
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <ProductDialog mode="edit" product={product} shop={shop} />
                <Button variant="ghost" className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(product.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!products || products.length === 0) && (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg text-muted-foreground">
            No products yet. Add your first product to get started.
          </div>
        )}
      </div>
    </div>
  );
}

function ProductDialog({ mode, product, shop, limitReached }: { mode: "create" | "edit", product?: any, shop?: any, limitReached?: boolean }) {
  const isPro = shop?.plan === "Pro" || shop?.plan === "Business";
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(
    product ? 
    { name: product.name, price: product.price.toString(), stock: product.stock.toString(), category: product.category || "", description: product.description || "", imageUrl: product.imageUrl || "" } :
    { name: "", price: "", stock: "10", category: "", description: "", imageUrl: "" }
  );
  const [variantRows, setVariantRows] = useState<Array<{name: string; price: string; stock: string}>>(() => {
    try {
      const p = JSON.parse(product?.variants || "[]");
      if (Array.isArray(p)) return p.map((v: any) => ({ name: v.name || "", price: v.price != null ? String(v.price) : "", stock: v.stock != null ? String(v.stock) : "0" }));
    } catch {}
    return [];
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();
  const isPending = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validVariants = isPro ? variantRows.filter(v => v.name.trim()) : [];
    const variantsJson = validVariants.length > 0
      ? JSON.stringify(validVariants.map(v => ({
          name: v.name.trim(),
          ...(v.price !== "" ? { price: parseInt(v.price) } : {}),
          stock: v.stock !== "" ? parseInt(v.stock) : 0,
        })))
      : "[]";
    const data = {
      name: formData.name,
      price: parseInt(formData.price),
      stock: parseInt(formData.stock),
      category: formData.category,
      description: formData.description,
      imageUrl: formData.imageUrl,
      variants: variantsJson,
    };

    if (mode === "create") {
      createMut.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "Product added" });
          queryClient.invalidateQueries({ queryKey: getListMyProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetShopStatsQueryKey() });
          setOpen(false);
          setFormData({ name: "", price: "", stock: "10", category: "", description: "", imageUrl: "" });
          setVariantRows([]);
        }
      });
    } else if (product) {
      updateMut.mutate({ id: product.id, data }, {
        onSuccess: () => {
          toast({ title: "Product updated" });
          queryClient.invalidateQueries({ queryKey: getListMyProductsQueryKey() });
          setOpen(false);
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button disabled={limitReached} title={limitReached ? "Product limit reached. Contact admin to upgrade plan." : undefined}>
            Add Product
          </Button>
        ) : (
          <Button variant="secondary" className="flex-1">Edit</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add New Product" : "Edit Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Product Name</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price (PKR)</Label>
              <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Stock Quantity</Label>
              <Input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category (Optional)</Label>
            <Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Product ki short description (3 lines)..." rows={3} />
          </div>
          <ImageUpload
            label="Product Image (Optional)"
            value={formData.imageUrl}
            onChange={url => setFormData({...formData, imageUrl: url})}
            placeholder="https://..."
          />
          {isPro ? (
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Variants (Optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setVariantRows(r => [...r, { name: "", price: "", stock: "0" }])}>+ Add Variant</Button>
              </div>
              <p className="text-xs text-muted-foreground">e.g. Size: Small, Color: Red — har variant ka apna price aur stock hoga.</p>
              {variantRows.map((row, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <Input value={row.name} onChange={e => setVariantRows(r => r.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="e.g. Small / Red" className="h-8 text-sm" />
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-xs text-muted-foreground">Price (PKR)</Label>
                    <Input type="number" value={row.price} onChange={e => setVariantRows(r => r.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} placeholder="Base" className="h-8 text-sm" />
                  </div>
                  <div className="w-20 space-y-1">
                    <Label className="text-xs text-muted-foreground">Stock</Label>
                    <Input type="number" value={row.stock} onChange={e => setVariantRows(r => r.map((x, j) => j === i ? { ...x, stock: e.target.value } : x))} className="h-8 text-sm" />
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-8 px-2 mb-0" onClick={() => setVariantRows(r => r.filter((_, j) => j !== i))}>✕</Button>
                </div>
              ))}
              {variantRows.length === 0 && <p className="text-xs text-muted-foreground italic">Koi variant nahi — product sirf ek hi option mein milega.</p>}
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-amber-600 text-sm">⚡</span>
              <p className="text-xs text-amber-700">Variants feature <strong>Pro</strong> aur <strong>Business</strong> plan mein available hai. Admin se plan upgrade karwayein.</p>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Product"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OrdersTab() {
  const { data: orders } = useListMyOrders({ query: { queryKey: getListMyOrdersQueryKey() } });
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleStatusChange = (id: number, status: string) => {
    updateOrder.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: "Order status updated" });
        queryClient.invalidateQueries({ queryKey: getListMyOrdersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetShopStatsQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this order?")) return;
    deleteOrder.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Order deleted" });
        queryClient.invalidateQueries({ queryKey: getListMyOrdersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetShopStatsQueryKey() });
      },
      onError: () => toast({ title: "Failed to delete order", variant: "destructive" })
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return '';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Recent Orders</h2>
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Update</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="font-medium">{order.customerName}</div>
                  <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                </TableCell>
                <TableCell>{order.productName}</TableCell>
                <TableCell className="font-medium">Rs {order.total.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select value={order.status} onValueChange={(val) => handleStatusChange(order.id, val)}>
                    <SelectTrigger className="w-[130px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(order.id)}
                    disabled={deleteOrder.isPending}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!orders || orders.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No orders yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SettingsTab({ shop }: { shop: any }) {
  const isPro = shop?.plan === "Pro" || shop?.plan === "Business";
  const [formData, setFormData] = useState({
    shopName: shop?.shopName || "",
    tagline: shop?.tagline || "",
    whatsapp: shop?.whatsapp || "",
    logoUrl: shop?.logoUrl || "",
    bannerUrl: shop?.bannerUrl || "",
    brandColor: shop?.brandColor || "#22c55e",
    footerText: shop?.footerText || "",
    footerAddress: shop?.footerAddress || "",
    footerPhone: shop?.footerPhone || "",
    footerEmail: shop?.footerEmail || "",
    privacyPolicy: shop?.privacyPolicy || "",
    shippingPolicy: shop?.shippingPolicy || "",
    returnPolicy: shop?.returnPolicy || "",
    facebookUrl: shop?.facebookUrl || "",
    instagramUrl: shop?.instagramUrl || "",
    twitterUrl: shop?.twitterUrl || "",
    youtubeUrl: shop?.youtubeUrl || "",
    paymentMethods: shop?.paymentMethods || "",
  });

  const updateShop = useUpdateMyShop();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  React.useEffect(() => {
    if (shop) {
      const planIsPro = shop.plan === "Pro" || shop.plan === "Business";
      const parsePm = (raw: string): Array<Record<string, string>> => {
        if (!raw) return [];
        try {
          const p = JSON.parse(raw);
          if (Array.isArray(p)) return p;
          return [];
        } catch {
          return raw.split(",").filter(Boolean).map((m: string) => ({ method: m.trim() })).filter((m: {method: string}) => m.method);
        }
      };
      let pmArr = parsePm(shop.paymentMethods || "");
      if (!planIsPro && pmArr.length > 1) pmArr = pmArr.slice(0, 1);

      setFormData({
        shopName: shop.shopName || "",
        tagline: shop.tagline || "",
        whatsapp: shop.whatsapp || "",
        logoUrl: shop.logoUrl || "",
        bannerUrl: shop.bannerUrl || "",
        brandColor: shop.brandColor || "#22c55e",
        footerText: shop.footerText || "",
        footerAddress: shop.footerAddress || "",
        footerPhone: shop.footerPhone || "",
        footerEmail: shop.footerEmail || "",
        privacyPolicy: planIsPro ? (shop.privacyPolicy || "") : "",
        shippingPolicy: planIsPro ? (shop.shippingPolicy || "") : "",
        returnPolicy: planIsPro ? (shop.returnPolicy || "") : "",
        facebookUrl: planIsPro ? (shop.facebookUrl || "") : "",
        instagramUrl: planIsPro ? (shop.instagramUrl || "") : "",
        twitterUrl: planIsPro ? (shop.twitterUrl || "") : "",
        youtubeUrl: planIsPro ? (shop.youtubeUrl || "") : "",
        paymentMethods: JSON.stringify(pmArr),
      });
    }
  }, [shop]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let submitData = { ...formData };
    if (!isPro) {
      submitData.privacyPolicy = "";
      submitData.shippingPolicy = "";
      submitData.returnPolicy = "";
      submitData.facebookUrl = "";
      submitData.instagramUrl = "";
      submitData.twitterUrl = "";
      submitData.youtubeUrl = "";
      let pmArr: Array<Record<string, string>> = [];
      try { const p = JSON.parse(submitData.paymentMethods); if (Array.isArray(p)) pmArr = p; } catch {}
      if (pmArr.length > 1) pmArr = pmArr.slice(0, 1);
      submitData.paymentMethods = JSON.stringify(pmArr);
    }
    updateShop.mutate({ data: submitData }, {
      onSuccess: () => {
        toast({ title: "Settings saved" });
        queryClient.invalidateQueries({ queryKey: getGetMyShopQueryKey() });
      }
    });
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Shop Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Shop Name</Label>
                <Input value={formData.shopName} onChange={e => setFormData({...formData, shopName: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Tagline / Description</Label>
                <Input value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Number</Label>
                <Input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} required />
                <p className="text-xs text-muted-foreground">Used for receiving orders. Include country code (e.g. 923001234567).</p>
              </div>
            </div>
            
            <div className="pt-4 border-t space-y-4">
              <h3 className="font-medium">Branding</h3>
              <ImageUpload
                label="Logo"
                value={formData.logoUrl}
                onChange={url => setFormData({...formData, logoUrl: url})}
              />
              <ImageUpload
                label="Banner Image"
                value={formData.bannerUrl}
                onChange={url => setFormData({...formData, bannerUrl: url})}
              />
              <div className="space-y-2">
                <Label>Brand Color (Hex)</Label>
                <div className="flex gap-2">
                  <Input type="color" value={formData.brandColor} onChange={e => setFormData({...formData, brandColor: e.target.value})} className="w-16 h-10 p-1" />
                  <Input value={formData.brandColor} onChange={e => setFormData({...formData, brandColor: e.target.value})} className="flex-1" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <h3 className="font-medium">Footer</h3>
              <div className="space-y-2">
                <Label>About / Description</Label>
                <Input value={formData.footerText} onChange={e => setFormData({...formData, footerText: e.target.value})} placeholder="Short description of your shop..." />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={formData.footerAddress} onChange={e => setFormData({...formData, footerAddress: e.target.value})} placeholder="e.g. Shop 12, Anarkali Bazaar, Lahore" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={formData.footerPhone} onChange={e => setFormData({...formData, footerPhone: e.target.value})} placeholder="e.g. 0300-1234567" />
              </div>
              <div className="space-y-2">
                <Label>Email Address (optional)</Label>
                <Input value={formData.footerEmail} onChange={e => setFormData({...formData, footerEmail: e.target.value})} placeholder="e.g. info@yourshop.com" />
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Policies</h3>
                {!isPro && <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">Pro / Business</span>}
              </div>
              {isPro ? (
                <>
                  <p className="text-xs text-muted-foreground">In ka text store ke footer mein link ke tor pe dikhega. Khaali rakhne se link nahi aaye ga.</p>
                  <div className="space-y-2">
                    <Label>Privacy Policy</Label>
                    <Textarea value={formData.privacyPolicy} onChange={e => setFormData({...formData, privacyPolicy: e.target.value})} placeholder="Privacy policy ka text yahan likhein..." rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Shipping Policy</Label>
                    <Textarea value={formData.shippingPolicy} onChange={e => setFormData({...formData, shippingPolicy: e.target.value})} placeholder="Shipping policy ka text yahan likhein..." rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Return Policy</Label>
                    <Textarea value={formData.returnPolicy} onChange={e => setFormData({...formData, returnPolicy: e.target.value})} placeholder="Return / Refund policy ka text yahan likhein..." rows={4} />
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Pro / Business Plan Required</p>
                    <p className="text-xs text-amber-700 mt-0.5">Privacy, Shipping, aur Return policies sirf Pro aur Business plan mein available hain. Admin se plan upgrade karwayein.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Social Media</h3>
                {!isPro && <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">Pro / Business</span>}
              </div>
              {isPro ? (
                <>
                  <div className="space-y-2">
                    <Label>Facebook Page URL</Label>
                    <Input value={formData.facebookUrl} onChange={e => setFormData({...formData, facebookUrl: e.target.value})} placeholder="e.g. https://facebook.com/yourshop" />
                  </div>
                  <div className="space-y-2">
                    <Label>Instagram Profile URL</Label>
                    <Input value={formData.instagramUrl} onChange={e => setFormData({...formData, instagramUrl: e.target.value})} placeholder="e.g. https://instagram.com/yourshop" />
                  </div>
                  <div className="space-y-2">
                    <Label>Twitter / X Profile URL</Label>
                    <Input value={formData.twitterUrl} onChange={e => setFormData({...formData, twitterUrl: e.target.value})} placeholder="e.g. https://twitter.com/yourshop" />
                  </div>
                  <div className="space-y-2">
                    <Label>YouTube Channel URL</Label>
                    <Input value={formData.youtubeUrl} onChange={e => setFormData({...formData, youtubeUrl: e.target.value})} placeholder="e.g. https://youtube.com/@yourshop" />
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Pro / Business Plan Required</p>
                    <p className="text-xs text-amber-700 mt-0.5">Facebook, Instagram, Twitter, aur YouTube links sirf Pro aur Business plan mein available hain.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Payment Methods</h3>
                {!isPro && <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">Pro / Business</span>}
              </div>
              {isPro ? (
                <>
                  <p className="text-xs text-muted-foreground">Jo payment methods accept karte hain unhe enable karein aur account details fill karein — customers ko store pe dikhenge.</p>
                  <div className="space-y-3">
                    {(([
                      { key: "jazzcash",      label: "JazzCash",          color: "bg-red-100 text-red-700 border-red-200",     fields: [{ name: "accountNumber", label: "Account Number / Phone", placeholder: "e.g. 03001234567" }, { name: "accountName", label: "Account Name", placeholder: "e.g. Muhammad Ali" }] },
                      { key: "easypaisa",     label: "EasyPaisa",         color: "bg-green-100 text-green-700 border-green-200", fields: [{ name: "accountNumber", label: "Account Number / Phone", placeholder: "e.g. 03001234567" }, { name: "accountName", label: "Account Name", placeholder: "e.g. Muhammad Ali" }] },
                      { key: "cod",           label: "Cash on Delivery",  color: "bg-amber-100 text-amber-700 border-amber-200", fields: [] },
                      { key: "bank_transfer", label: "Bank Transfer",     color: "bg-blue-100 text-blue-700 border-blue-200",   fields: [{ name: "bankName", label: "Bank Name", placeholder: "e.g. HBL / MCB / Meezan" }, { name: "accountNumber", label: "Account Number", placeholder: "e.g. 0123456789012" }, { name: "accountTitle", label: "Account Title", placeholder: "e.g. Muhammad Ali Khan" }] },
                      { key: "nayapay",       label: "NayaPay",           color: "bg-purple-100 text-purple-700 border-purple-200", fields: [{ name: "accountNumber", label: "Account Number / Phone", placeholder: "e.g. 03001234567" }, { name: "accountName", label: "Account Name", placeholder: "e.g. Muhammad Ali" }] },
                      { key: "sadapay",       label: "SadaPay",           color: "bg-sky-100 text-sky-700 border-sky-200",      fields: [{ name: "accountNumber", label: "Account Number / Phone", placeholder: "e.g. 03001234567" }, { name: "accountName", label: "Account Name", placeholder: "e.g. Muhammad Ali" }] },
                    ] as Array<{ key: string; label: string; color: string; fields: Array<{ name: string; label: string; placeholder: string }> }>)).map(({ key, label, color, fields }) => {
                      const parsePmLocal = (raw: string): Array<Record<string, string>> => {
                        try { const p = JSON.parse(raw); if (Array.isArray(p)) return p; } catch {
                          return raw.split(",").filter(Boolean).map((m: string) => ({ method: m.trim() })).filter((m: {method:string}) => m.method);
                        }
                        return [];
                      };
                      const pmArr = parsePmLocal(formData.paymentMethods);
                      const entry = pmArr.find(e => e.method === key) || null;
                      const selected = !!entry;
                      const toggle = () => {
                        const cur = parsePmLocal(formData.paymentMethods);
                        const updated = selected ? cur.filter(e => e.method !== key) : [...cur, { method: key }];
                        setFormData({ ...formData, paymentMethods: JSON.stringify(updated) });
                      };
                      const updateField = (field: string, value: string) => {
                        const cur = parsePmLocal(formData.paymentMethods);
                        const idx = cur.findIndex(e => e.method === key);
                        if (idx >= 0) cur[idx] = { ...cur[idx], [field]: value };
                        setFormData({ ...formData, paymentMethods: JSON.stringify(cur) });
                      };
                      const borderClass = color.split(" ")[2];
                      return (
                        <div key={key} className={`border rounded-lg overflow-hidden transition-all ${selected ? borderClass : "border-border"}`}>
                          <label className={`flex items-center gap-3 p-3 cursor-pointer select-none transition-colors ${selected ? color : "bg-muted/40 hover:bg-muted/60"}`}>
                            <input type="checkbox" checked={selected} onChange={toggle} className="w-4 h-4 rounded" />
                            <span className="text-sm font-bold">{label}</span>
                          </label>
                          {selected && fields.length > 0 && (
                            <div className="p-3 bg-background space-y-2 border-t border-border">
                              {fields.map(f => (
                                <div key={f.name} className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">{f.label}</Label>
                                  <Input value={entry?.[f.name] || ""} onChange={e => updateField(f.name, e.target.value)} placeholder={f.placeholder} className="h-8 text-sm" />
                                </div>
                              ))}
                              <div className="pt-1 border-t border-border/60">
                                <ImageUpload
                                  label="Custom Icon (optional)"
                                  value={entry?.["iconUrl"] || ""}
                                  onChange={url => updateField("iconUrl", url)}
                                  placeholder="Ya icon ka URL paste karein"
                                />
                              </div>
                            </div>
                          )}
                          {selected && fields.length === 0 && (
                            <div className="p-3 bg-background border-t border-border space-y-2">
                              <p className="text-xs text-muted-foreground">Delivery ke waqt payment li jaaye gi — koi advance nahi.</p>
                              <ImageUpload
                                label="Custom Icon (optional)"
                                value={entry?.["iconUrl"] || ""}
                                onChange={url => updateField("iconUrl", url)}
                                placeholder="Ya icon ka URL paste karein"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Pro / Business Plan Required</p>
                    <p className="text-xs text-amber-700 mt-0.5">JazzCash, EasyPaisa, Bank Transfer aur baqi payment methods sirf Pro aur Business plan mein available hain. Admin se plan upgrade karwayein.</p>
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" disabled={updateShop.isPending}>
              {updateShop.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
