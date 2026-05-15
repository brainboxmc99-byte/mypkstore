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

  const { data: shop } = useGetMyShop({
    query: { queryKey: getGetMyShopQueryKey(), enabled: !!user && user.role === "shopOwner" }
  });

  const { data: stats } = useGetShopStats({
    query: { queryKey: getGetShopStatsQueryKey(), enabled: !!user && user.role === "shopOwner" }
  });

  if (isUserLoading || !user || user.role !== "shopOwner") return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

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
              <Button variant="secondary" size="sm" onClick={() => window.open(`/store/${shop.slug}`, "_blank")}>
                View Store
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
            <ProductsTab getImageUrl={getImageUrl} />
          </TabsContent>
          
          <TabsContent value="orders" className="space-y-4 mt-6">
            <OrdersTab />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-6">
            <SettingsTab shop={shop} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ProductsTab({ getImageUrl }: { getImageUrl: (url: string | null | undefined) => string }) {
  const { data: products } = useListMyProducts({ query: { queryKey: getListMyProductsQueryKey() } });
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
        <h2 className="text-xl font-semibold">Inventory</h2>
        <ProductDialog mode="create" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {products?.map((product) => (
          <Card key={product.id} className="overflow-hidden flex flex-col">
            <div className="aspect-square bg-muted relative">
              {product.imageUrl ? (
                <img src={getImageUrl(product.imageUrl)} alt={product.name} className="object-cover w-full h-full" />
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
                <ProductDialog mode="edit" product={product} />
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

function ProductDialog({ mode, product }: { mode: "create" | "edit", product?: any }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(
    product ? 
    { name: product.name, price: product.price.toString(), stock: product.stock.toString(), category: product.category || "", imageUrl: product.imageUrl || "" } :
    { name: "", price: "", stock: "10", category: "", imageUrl: "" }
  );
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();
  const isPending = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      price: parseInt(formData.price),
      stock: parseInt(formData.stock),
      category: formData.category,
      imageUrl: formData.imageUrl
    };

    if (mode === "create") {
      createMut.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "Product added" });
          queryClient.invalidateQueries({ queryKey: getListMyProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetShopStatsQueryKey() });
          setOpen(false);
          setFormData({ name: "", price: "", stock: "10", category: "", imageUrl: "" });
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
        {mode === "create" ? <Button>Add Product</Button> : <Button variant="secondary" className="flex-1">Edit</Button>}
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
          <ImageUpload
            label="Product Image (Optional)"
            value={formData.imageUrl}
            onChange={url => setFormData({...formData, imageUrl: url})}
            placeholder="https://..."
          />
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
  });

  const updateShop = useUpdateMyShop();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  React.useEffect(() => {
    if (shop) {
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
      });
    }
  }, [shop]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateShop.mutate({ data: formData }, {
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
