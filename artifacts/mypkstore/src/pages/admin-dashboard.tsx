import React, { useState } from "react";
import { useLocation } from "wouter";
import { 
  useGetMe, 
  getGetMeQueryKey, 
  useLogout, 
  useGetAdminStats, 
  getGetAdminStatsQueryKey,
  useListAdminShops,
  getListAdminShopsQueryKey,
  useCreateShop,
  useUpdateShop,
  useDeleteShop,
  useGenerateToken,
  useListPlans,
  getListPlansQueryKey,
  useUpdatePlan
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

export function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading: isUserLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false }
  });

  React.useEffect(() => {
    if (!isUserLoading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [user, isUserLoading, setLocation]);

  const logout = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/");
      }
    }
  });

  const { data: stats } = useGetAdminStats({
    query: { queryKey: getGetAdminStatsQueryKey(), enabled: !!user && user.role === "admin" }
  });

  const { data: shops } = useListAdminShops({
    query: { queryKey: getListAdminShopsQueryKey(), enabled: !!user && user.role === "admin" }
  });

  const { data: plans } = useListPlans({
    query: { queryKey: getListPlansQueryKey(), enabled: !!user && user.role === "admin" }
  });

  const updateShop = useUpdateShop({
    mutation: {
      onSuccess: () => {
        toast({ title: "Shop updated" });
        queryClient.invalidateQueries({ queryKey: getListAdminShopsQueryKey() });
      }
    }
  });

  const deleteShop = useDeleteShop({
    mutation: {
      onSuccess: () => {
        toast({ title: "Shop deleted" });
        queryClient.invalidateQueries({ queryKey: getListAdminShopsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      }
    }
  });

  if (isUserLoading || !user || user.role !== "admin") return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">MyPkStore Admin</h1>
          <Button variant="secondary" onClick={() => logout.mutate()} size="sm">Logout</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Shops</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalShops}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.activeShops} active</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Orders Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.ordersToday}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rs {stats.totalRevenue.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Plan Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1 mt-1">
                  <div className="flex justify-between"><span>Basic:</span> <span className="font-medium">{stats.basicCount || 0}</span></div>
                  <div className="flex justify-between"><span>Pro:</span> <span className="font-medium">{stats.proCount || 0}</span></div>
                  <div className="flex justify-between"><span>Business:</span> <span className="font-medium">{stats.businessCount || 0}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="shops" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="shops">Shops</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
          </TabsList>
          
          <TabsContent value="shops" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Manage Shops</h2>
              <CreateShopDialog plans={plans || []} />
            </div>
            
            <div className="border rounded-md bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shop Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shops?.map((shop) => (
                    <TableRow key={shop.id}>
                      <TableCell className="font-medium">{shop.shopName}</TableCell>
                      <TableCell>{shop.ownerName}</TableCell>
                      <TableCell>{shop.whatsapp}</TableCell>
                      <TableCell>
                        <Select 
                          value={shop.plan} 
                          onValueChange={(val) => updateShop.mutate({ id: shop.id, data: { plan: val } })}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {plans?.map(p => (
                              <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={shop.status === "active" ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => updateShop.mutate({ 
                            id: shop.id, 
                            data: { status: shop.status === "active" ? "inactive" : "active" } 
                          })}
                        >
                          {shop.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <EditShopDialog shop={shop} plans={plans || []} />
                        <GenerateTokenDialog shop={shop} />
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            if(confirm("Are you sure you want to delete this shop?")) {
                              deleteShop.mutate({ id: shop.id });
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!shops || shops.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No shops found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="plans" className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Subscription Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans?.map((plan) => (
                <PlanEditCard key={plan.id} plan={plan} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function CreateShopDialog({ plans }: { plans: any[] }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    whatsapp: "",
    slug: "",
    plan: "Basic"
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createShop = useCreateShop({
    mutation: {
      onSuccess: () => {
        toast({ title: "Shop created successfully" });
        queryClient.invalidateQueries({ queryKey: getListAdminShopsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        setOpen(false);
        setFormData({ shopName: "", ownerName: "", whatsapp: "", slug: "", plan: "Basic" });
      },
      onError: (err: any) => {
        toast({ title: "Failed to create shop", description: err.message, variant: "destructive" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createShop.mutate({ data: formData });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Shop</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Shop</DialogTitle>
          <DialogDescription>Add a new merchant to the platform.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Shop Name</Label>
            <Input 
              value={formData.shopName} 
              onChange={e => setFormData({ ...formData, shopName: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Slug (URL)</Label>
            <Input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Owner Name</Label>
            <Input value={formData.ownerName} onChange={e => setFormData({ ...formData, ownerName: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp Number</Label>
            <Input value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} placeholder="923001234567" required />
          </div>
          <div className="space-y-2">
            <Label>Plan</Label>
            <Select value={formData.plan} onValueChange={val => setFormData({ ...formData, plan: val })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {plans.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createShop.isPending}>
              {createShop.isPending ? "Creating..." : "Create Shop"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditShopDialog({ shop, plans }: { shop: any; plans: any[] }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    shopName: shop.shopName,
    ownerName: shop.ownerName,
    whatsapp: shop.whatsapp,
    plan: shop.plan,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateShop = useUpdateShop({
    mutation: {
      onSuccess: () => {
        toast({ title: "Shop updated successfully" });
        queryClient.invalidateQueries({ queryKey: getListAdminShopsQueryKey() });
        setOpen(false);
      },
      onError: (err: any) => {
        toast({ title: "Update failed", description: err.message, variant: "destructive" });
      }
    }
  });

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setFormData({
        shopName: shop.shopName,
        ownerName: shop.ownerName,
        whatsapp: shop.whatsapp,
        plan: shop.plan,
      });
    }
    setOpen(isOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateShop.mutate({ id: shop.id, data: formData });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Edit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Shop</DialogTitle>
          <DialogDescription>Update details for {shop.shopName}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Shop Name</Label>
            <Input
              value={formData.shopName}
              onChange={e => setFormData({ ...formData, shopName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Owner Name</Label>
            <Input
              value={formData.ownerName}
              onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp Number</Label>
            <Input
              value={formData.whatsapp}
              onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="923001234567"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Plan</Label>
            <Select value={formData.plan} onValueChange={val => setFormData({ ...formData, plan: val })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {plans.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={updateShop.isPending}>
              {updateShop.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GenerateTokenDialog({ shop }: { shop: any }) {
  const [open, setOpen] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  
  const generate = useGenerateToken({
    mutation: {
      onSuccess: (data) => setTokenData(data)
    }
  });

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setTokenData(null);
      generate.mutate({ id: shop.id });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Magic Link</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Magic Login Link</DialogTitle>
          <DialogDescription>Share this with {shop.ownerName} to grant them access.</DialogDescription>
        </DialogHeader>
        {generate.isPending ? (
          <div className="py-8 text-center">Generating token...</div>
        ) : tokenData ? (
          <div className="space-y-6 py-4">
            <div className="flex justify-center bg-white p-4 rounded-lg">
              <QRCodeSVG value={tokenData.magicLink} size={200} />
            </div>
            <div className="space-y-2">
              <Label>Link URL</Label>
              <div className="flex gap-2">
                <Input readOnly value={tokenData.magicLink} />
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(tokenData.magicLink);
                  }}
                  variant="secondary"
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PlanEditCard({ plan }: { plan: any }) {
  const [price, setPrice] = useState(plan.price.toString());
  const [features, setFeatures] = useState(plan.features);
  const [limit, setLimit] = useState(plan.productLimit === null ? "" : plan.productLimit.toString());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updatePlan = useUpdatePlan({
    mutation: {
      onSuccess: () => {
        toast({ title: "Plan updated" });
        queryClient.invalidateQueries({ queryKey: getListPlansQueryKey() });
      }
    }
  });

  const handleSave = () => {
    updatePlan.mutate({
      id: plan.id,
      data: {
        price: parseInt(price),
        features,
        productLimit: limit === "" ? null : parseInt(limit)
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Price (PKR/month)</Label>
          <Input type="number" value={price} onChange={e => setPrice(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Product Limit (empty for unlimited)</Label>
          <Input type="number" value={limit} onChange={e => setLimit(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Features (comma separated)</Label>
          <Input value={features} onChange={e => setFeatures(e.target.value)} />
        </div>
        <Button onClick={handleSave} className="w-full" disabled={updatePlan.isPending}>
          {updatePlan.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
