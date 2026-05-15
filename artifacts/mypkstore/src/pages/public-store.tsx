import React, { useState } from "react";
import { useParams } from "wouter";
import { 
  useGetPublicStore, 
  getGetPublicStoreQueryKey,
  useListPublicProducts,
  getListPublicProductsQueryKey,
  useSubmitOrder
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

function getImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  const gdMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdMatch) return `https://lh3.googleusercontent.com/d/${gdMatch[1]}`;
  return url;
}

export function PublicStore() {
  const params = useParams();
  const slug = params.slug || "";
  
  const { data: store, isLoading: isStoreLoading } = useGetPublicStore(slug, {
    query: { queryKey: getGetPublicStoreQueryKey(slug), enabled: !!slug }
  });

  const { data: products, isLoading: isProductsLoading } = useListPublicProducts(slug, {
    query: { queryKey: getListPublicProductsQueryKey(slug), enabled: !!slug }
  });

  if (isStoreLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading store...</div>;
  if (!store) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-xl font-medium text-gray-500">Store not found</div>;

  const brandColor = store.brandColor || "#10b981";

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <div
        className="w-full relative flex flex-col items-center justify-center overflow-hidden shadow-sm"
        style={{
          minHeight: "clamp(200px, 40vw, 420px)",
          ...(store.bannerUrl
            ? { backgroundImage: `url(${getImageUrl(store.bannerUrl)})`, backgroundSize: "cover", backgroundPosition: "center top" }
            : { backgroundColor: brandColor }),
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="relative z-10 text-center px-4 max-w-3xl py-10">
          {store.logoUrl ? (
            <img src={getImageUrl(store.logoUrl)} alt={store.shopName} className="w-24 h-24 rounded-full border-4 border-white shadow-lg mx-auto mb-4 bg-white object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg mx-auto mb-4 bg-white flex items-center justify-center text-3xl font-bold" style={{ color: brandColor }}>
              {store.shopName.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-md">{store.shopName}</h1>
          {store.tagline && (
            <p className="mt-3 text-white/90 text-lg font-medium drop-shadow">{store.tagline}</p>
          )}
          {store.whatsapp && (
            <a
              href={`https://wa.me/${store.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-[#25D366] text-white font-semibold text-sm shadow-lg hover:bg-[#1ebe5d] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat on WhatsApp
            </a>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-end mb-8 border-b pb-4 border-stone-200">
          <h2 className="text-2xl font-bold text-stone-800">Our Products</h2>
          <div className="text-sm font-medium text-stone-500">{products?.length || 0} items</div>
        </div>

        {isProductsLoading ? (
          <div className="text-center py-20 text-stone-500">Loading products...</div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} store={store} brandColor={brandColor} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-stone-200">
            <p className="text-lg text-stone-500 font-medium">This store doesn't have any products yet.</p>
          </div>
        )}
      </div>
      
      <footer className="bg-stone-900 text-stone-300 mt-20">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-3">{store.shopName}</h3>
              {store.footerText && <p className="text-stone-400 text-sm leading-relaxed">{store.footerText}</p>}
            </div>

            <div>
              <h3 className="text-white font-bold text-lg mb-3">Contact</h3>
              <ul className="space-y-2 text-sm text-stone-400">
                {store.whatsapp && (
                  <li>
                    <a
                      href={`https://wa.me/${store.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#25D366] transition-colors flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#25D366]">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      +{store.whatsapp}
                    </a>
                  </li>
                )}
                {store.footerPhone && (
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-stone-500">
                      <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
                    </svg>
                    {store.footerPhone}
                  </li>
                )}
                {store.footerAddress && (
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-stone-500 mt-0.5 shrink-0">
                      <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.077 3.678-5.032 3.678-8.827a8 8 0 10-16 0c0 3.795 1.734 6.75 3.678 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.015.7z" clipRule="evenodd" />
                    </svg>
                    {store.footerAddress}
                  </li>
                )}
              </ul>
            </div>

            <div className="flex flex-col justify-between">
              <div />
              <div className="text-right">
                <p className="text-xs text-stone-600 mt-6">Powered by <span className="font-bold text-stone-400">MyPkStore</span></p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-stone-800 py-4 text-center text-xs text-stone-600">
          &copy; {new Date().getFullYear()} {store.shopName}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ product, store, brandColor }: { product: any, store: any, brandColor: string }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    address: "",
    note: ""
  });
  const { toast } = useToast();
  
  const submitOrder = useSubmitOrder({
    mutation: {
      onSuccess: () => {
        let text = `Hi! I want to order:\n\n*${product.name}*\nPrice: Rs ${product.price}\n\n`;
        text += `*My Details:*\nName: ${formData.customerName}\nPhone: ${formData.customerPhone}\nAddress: ${formData.address}`;
        if (formData.note) text += `\nNote: ${formData.note}`;
        
        const url = `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(text)}`;
        window.open(url, "_blank");
        
        setOpen(false);
        toast({ title: "Order submitted!" });
      },
      onError: (err: any) => {
        toast({ title: "Failed to submit order", description: err.message, variant: "destructive" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitOrder.mutate({
      slug: store.slug,
      data: {
        ...formData,
        productName: product.name,
        total: product.price
      }
    });
  };

  return (
    <Card className="overflow-hidden border-stone-200 hover:border-stone-300 transition-all hover:shadow-md group flex flex-col">
      <div className="aspect-square bg-stone-100 relative overflow-hidden">
        {product.imageUrl ? (
          <img 
            src={getImageUrl(product.imageUrl)} 
            alt={product.name} 
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-stone-400 font-medium">No image</div>
        )}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <Badge variant="destructive" className="text-sm px-3 py-1 shadow-sm">Out of Stock</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-5 flex flex-col flex-1">
        {product.category && (
          <div className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">{product.category}</div>
        )}
        <h3 className="font-bold text-lg text-stone-900 leading-tight mb-2 flex-1">{product.name}</h3>
        <div className="flex items-center justify-between mt-auto pt-4">
          <p className="text-xl font-extrabold text-stone-900">Rs {product.price.toLocaleString()}</p>
          {product.stock > 0 && product.stock <= 5 && (
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-sm">Only {product.stock} left</span>
          )}
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full mt-5 font-bold text-white shadow-sm transition-transform active:scale-[0.98]"
              style={{ backgroundColor: brandColor }}
              disabled={product.stock <= 0}
            >
              Order via WhatsApp
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Order {product.name}</DialogTitle>
              <DialogDescription>
                Fill out your details to place this order. You will be redirected to WhatsApp to confirm with the seller.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Your Name</Label>
                <Input required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input required value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} placeholder="e.g. 03001234567" />
              </div>
              <div className="space-y-2">
                <Label>Delivery Address</Label>
                <Input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Note (Optional)</Label>
                <Input value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} placeholder="Any special instructions?" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitOrder.isPending} style={{ backgroundColor: brandColor }}>
                  {submitOrder.isPending ? "Processing..." : "Continue to WhatsApp"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
