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
  useGeneratePermanentToken,
  useListPlans,
  getListPlansQueryKey,
  useUpdatePlan,
  useGetAdminSettings,
  getGetAdminSettingsQueryKey,
  useUpdateAdminSettings,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/image-upload";
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
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="shops">Shops</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
                    <TableHead>Plan</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Landing</TableHead>
                    <TableHead>Hero</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shops?.map((shop) => (
                    <TableRow key={shop.id}>
                      <TableCell className="font-medium">{shop.shopName}</TableCell>
                      <TableCell>{shop.ownerName}</TableCell>
                      <TableCell>
                        <Select 
                          value={shop.plan} 
                          onValueChange={(val) => updateShop.mutate({ id: shop.id, data: { plan: val } })}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {plans?.map(p => (
                              <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {shop.subscriptionStartDate ? new Date(shop.subscriptionStartDate).toLocaleDateString("en-PK") : <span className="text-xs text-gray-400">—</span>}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {shop.subscriptionExpiryDate ? (
                          <span className={new Date(shop.subscriptionExpiryDate) < new Date() ? "text-red-500 font-medium" : "text-green-600 font-medium"}>
                            {new Date(shop.subscriptionExpiryDate).toLocaleDateString("en-PK")}
                          </span>
                        ) : <span className="text-xs text-gray-400">—</span>}
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
                      <TableCell>
                        <Badge
                          variant={shop.showOnLanding ? "default" : "secondary"}
                          className="cursor-pointer"
                          title="Landing page par show/hide"
                          onClick={() => updateShop.mutate({
                            id: shop.id,
                            data: { showOnLanding: !shop.showOnLanding }
                          })}
                        >
                          {shop.showOnLanding ? "Landing: ON" : "Landing: OFF"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={shop.heroFeatured ? "default" : "secondary"}
                          className="cursor-pointer"
                          title="Hero (top banner) par show karein - sirf ek store"
                          onClick={() => updateShop.mutate({
                            id: shop.id,
                            data: { heroFeatured: !shop.heroFeatured }
                          })}
                        >
                          {shop.heroFeatured ? "Hero: ON" : "Hero: OFF"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <EditShopDialog shop={shop} plans={plans || []} />
                        <GenerateTokenDialog shop={shop} />
                        <PermanentLinkButton shop={shop} />
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            if(confirm("Are you sure you want to delete this shop?")) {
                              deleteShop.mutate({ id: shop.id });
                            }
                          }}
                        >
                          Del
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!shops || shops.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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
            <p className="text-sm text-muted-foreground mb-6">Yahan plan prices aur features update karein — changes landing page par automatically dikhenge.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans?.map((plan) => (
                <PlanEditCard key={plan.id} plan={plan} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <PlatformSettingsCard />
            <ChangePasswordCard />
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
    subscriptionStartDate: shop.subscriptionStartDate ? shop.subscriptionStartDate.slice(0, 10) : "",
    subscriptionExpiryDate: shop.subscriptionExpiryDate ? shop.subscriptionExpiryDate.slice(0, 10) : "",
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
        subscriptionStartDate: shop.subscriptionStartDate ? shop.subscriptionStartDate.slice(0, 10) : "",
        subscriptionExpiryDate: shop.subscriptionExpiryDate ? shop.subscriptionExpiryDate.slice(0, 10) : "",
      });
    }
    setOpen(isOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateShop.mutate({
      id: shop.id,
      data: {
        shopName: formData.shopName,
        ownerName: formData.ownerName,
        whatsapp: formData.whatsapp,
        plan: formData.plan,
        subscriptionStartDate: formData.subscriptionStartDate || null,
        subscriptionExpiryDate: formData.subscriptionExpiryDate || null,
      }
    });
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.subscriptionStartDate}
                onChange={e => setFormData({ ...formData, subscriptionStartDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={formData.subscriptionExpiryDate}
                onChange={e => setFormData({ ...formData, subscriptionExpiryDate: e.target.value })}
              />
            </div>
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

function PermanentLinkButton({ shop }: { shop: any }) {
  const { toast } = useToast();
  const generate = useGeneratePermanentToken({
    mutation: {
      onSuccess: (data) => {
        navigator.clipboard.writeText(data.permanentLink).then(() => {
          toast({ title: "Permanent link copied!", description: "Link has been copied to clipboard." });
        });
      },
      onError: (err: any) => {
        toast({ title: "Failed", description: err.message, variant: "destructive" });
      }
    }
  });

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={generate.isPending}
      onClick={() => generate.mutate({ id: shop.id })}
    >
      {generate.isPending ? "..." : "Perm Link"}
    </Button>
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

function PlatformSettingsCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useGetAdminSettings({
    query: { queryKey: getGetAdminSettingsQueryKey() }
  });

  const [whatsapp, setWhatsapp] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [contactAddress, setContactAddress] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [privacyPolicy, setPrivacyPolicy] = React.useState("");
  const [shippingPolicy, setShippingPolicy] = React.useState("");
  const [returnPolicy, setReturnPolicy] = React.useState("");
  const [facebookUrl, setFacebookUrl] = React.useState("");
  const [instagramUrl, setInstagramUrl] = React.useState("");
  const [twitterUrl, setTwitterUrl] = React.useState("");
  const [youtubeUrl, setYoutubeUrl] = React.useState("");
  const [platformPaymentMethods, setPlatformPaymentMethods] = React.useState("");

  React.useEffect(() => {
    if (settings) {
      setWhatsapp(settings.whatsappNumber ?? "");
      setContactEmail(settings.contactEmail ?? "");
      setContactAddress(settings.contactAddress ?? "");
      setContactPhone(settings.contactPhone ?? "");
      setPrivacyPolicy(settings.privacyPolicy ?? "");
      setShippingPolicy(settings.shippingPolicy ?? "");
      setReturnPolicy(settings.returnPolicy ?? "");
      setFacebookUrl(settings.facebookUrl ?? "");
      setInstagramUrl(settings.instagramUrl ?? "");
      setTwitterUrl(settings.twitterUrl ?? "");
      setYoutubeUrl(settings.youtubeUrl ?? "");
      setPlatformPaymentMethods(settings.paymentMethods ?? "");
    }
  }, [settings]);

  const updateSettings = useUpdateAdminSettings({
    mutation: {
      onSuccess: () => {
        toast({ title: "Settings saved!" });
        queryClient.invalidateQueries({ queryKey: getGetAdminSettingsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Failed to save", description: err.message, variant: "destructive" });
      }
    }
  });

  const handleSave = () => {
    updateSettings.mutate({ data: { whatsappNumber: whatsapp, contactEmail, contactAddress, contactPhone, privacyPolicy, shippingPolicy, returnPolicy, facebookUrl, instagramUrl, twitterUrl, youtubeUrl, paymentMethods: platformPaymentMethods } });
  };

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading settings...</div>;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Platform Settings</h2>
        <p className="text-sm text-muted-foreground">Landing page ka contact aur social media yahan se set karein.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>WhatsApp Number</Label>
            <Input
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="923001234567"
            />
            <p className="text-xs text-muted-foreground">Country code ke saath, bina + ke. Misaal: 923001234567</p>
          </div>
          <div className="space-y-2">
            <Label>Contact Email (optional)</Label>
            <Input
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              placeholder="info@mypkstore.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Contact Address (optional)</Label>
            <Input
              value={contactAddress}
              onChange={e => setContactAddress(e.target.value)}
              placeholder="e.g. Office 3, XYZ Plaza, Lahore, Pakistan"
            />
          </div>
          <div className="space-y-2">
            <Label>Contact Phone (optional)</Label>
            <Input
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
              placeholder="e.g. +92 300 1234567"
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Policies</CardTitle>
          <p className="text-sm text-muted-foreground">Landing page ke footer mein policy links dikhenge. Khaali rakhne se link nahi dikhe ga.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Privacy Policy</Label>
            <Textarea
              value={privacyPolicy}
              onChange={e => setPrivacyPolicy(e.target.value)}
              placeholder="Privacy policy ka text yahan likhein..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Shipping Policy</Label>
            <Textarea
              value={shippingPolicy}
              onChange={e => setShippingPolicy(e.target.value)}
              placeholder="Shipping policy ka text yahan likhein..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Return Policy</Label>
            <Textarea
              value={returnPolicy}
              onChange={e => setReturnPolicy(e.target.value)}
              placeholder="Return policy ka text yahan likhein..."
              rows={4}
            />
          </div>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? "Saving..." : "Save Policies"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social Media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Facebook Page URL</Label>
            <Input
              value={facebookUrl}
              onChange={e => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/mypkstore"
            />
          </div>
          <div className="space-y-2">
            <Label>Instagram Profile URL</Label>
            <Input
              value={instagramUrl}
              onChange={e => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/mypkstore"
            />
          </div>
          <div className="space-y-2">
            <Label>Twitter / X Profile URL</Label>
            <Input
              value={twitterUrl}
              onChange={e => setTwitterUrl(e.target.value)}
              placeholder="https://twitter.com/mypkstore"
            />
          </div>
          <div className="space-y-2">
            <Label>YouTube Channel URL</Label>
            <Input
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/@mypkstore"
            />
          </div>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Methods</CardTitle>
          <p className="text-sm text-muted-foreground">Landing page pe jo payment methods show karni hain unhe enable karein aur subscription payment ki account details fill karein.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {(([
            { key: "jazzcash",      label: "JazzCash",          color: "bg-red-100 text-red-700 border-red-200",     fields: [{ name: "accountNumber", label: "Account Number / Phone", placeholder: "e.g. 03001234567" }, { name: "accountName", label: "Account Name", placeholder: "e.g. Muhammad Ali" }] },
            { key: "easypaisa",     label: "EasyPaisa",         color: "bg-green-100 text-green-700 border-green-200", fields: [{ name: "accountNumber", label: "Account Number / Phone", placeholder: "e.g. 03001234567" }, { name: "accountName", label: "Account Name", placeholder: "e.g. Muhammad Ali" }] },
            { key: "cod",           label: "Cash on Delivery",  color: "bg-amber-100 text-amber-700 border-amber-200", fields: [] },
            { key: "bank_transfer", label: "Bank Transfer",     color: "bg-blue-100 text-blue-700 border-blue-200",   fields: [{ name: "bankName", label: "Bank Name", placeholder: "e.g. HBL / MCB / Meezan" }, { name: "accountNumber", label: "Account Number", placeholder: "e.g. 0123456789012" }, { name: "accountTitle", label: "Account Title", placeholder: "e.g. Muhammad Ali Khan" }] },
            { key: "nayapay",       label: "NayaPay",           color: "bg-purple-100 text-purple-700 border-purple-200", fields: [{ name: "accountNumber", label: "Account Number / Phone", placeholder: "e.g. 03001234567" }, { name: "accountName", label: "Account Name", placeholder: "e.g. Muhammad Ali" }] },
            { key: "sadapay",       label: "SadaPay",           color: "bg-sky-100 text-sky-700 border-sky-200",      fields: [{ name: "accountNumber", label: "Account Number / Phone", placeholder: "e.g. 03001234567" }, { name: "accountName", label: "Account Name", placeholder: "e.g. Muhammad Ali" }] },
          ] as Array<{ key: string; label: string; color: string; fields: Array<{ name: string; label: string; placeholder: string }> }>)).map(({ key, label, color, fields }) => {
            let pmArr: Array<Record<string, string>> = [];
            try { const p = JSON.parse(platformPaymentMethods); if (Array.isArray(p)) pmArr = p; } catch {}
            if (!pmArr.length && platformPaymentMethods) pmArr = platformPaymentMethods.split(",").filter(Boolean).map(m => ({ method: m.trim() }));
            const entry = pmArr.find(e => e.method === key) || null;
            const selected = !!entry;
            const toggle = () => {
              let cur: Array<Record<string, string>> = [];
              try { const p = JSON.parse(platformPaymentMethods); if (Array.isArray(p)) cur = p; } catch {}
              if (!cur.length && platformPaymentMethods) cur = platformPaymentMethods.split(",").filter(Boolean).map(m => ({ method: m.trim() }));
              const updated = selected ? cur.filter(e => e.method !== key) : [...cur, { method: key }];
              setPlatformPaymentMethods(JSON.stringify(updated));
            };
            const updateField = (field: string, value: string) => {
              let cur: Array<Record<string, string>> = [];
              try { const p = JSON.parse(platformPaymentMethods); if (Array.isArray(p)) cur = p; } catch {}
              if (!cur.length && platformPaymentMethods) cur = platformPaymentMethods.split(",").filter(Boolean).map(m => ({ method: m.trim() }));
              const idx = cur.findIndex(e => e.method === key);
              if (idx >= 0) cur[idx] = { ...cur[idx], [field]: value };
              setPlatformPaymentMethods(JSON.stringify(cur));
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
                    <p className="text-xs text-muted-foreground">Delivery ke waqt payment li jaaye gi.</p>
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
          <Button onClick={handleSave} disabled={updateSettings.isPending} className="mt-2">
            {updateSettings.isPending ? "Saving..." : "Save Payment Methods"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ChangePasswordCard() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "New password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">Change Admin Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              placeholder="Enter current password"
            />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              placeholder="Min 6 characters"
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="Repeat new password"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Change Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PlanEditCard({ plan }: { plan: any }) {
  const [price, setPrice] = useState(plan.price.toString());
  const [comparePrice, setComparePrice] = useState(plan.comparePrice === null || plan.comparePrice === undefined ? "" : plan.comparePrice.toString());
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
        comparePrice: comparePrice === "" ? null : parseInt(comparePrice),
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
          <Label>Price (PKR/month) — Actual Price</Label>
          <Input type="number" value={price} onChange={e => setPrice(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Compare Price (PKR) — Original / Crossed Price (optional)</Label>
          <Input type="number" value={comparePrice} onChange={e => setComparePrice(e.target.value)} placeholder="e.g. 1999 (leave empty to hide)" />
          <p className="text-xs text-muted-foreground">Landing page pe line ke saath dikhega, jaise Rs.1,999 strikethrough</p>
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
