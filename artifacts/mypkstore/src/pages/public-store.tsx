import React, { useState, useEffect } from "react";
import { useParams } from "wouter";
import { PaymentMethodIcon, PAYMENT_METHOD_INFO } from "@/components/payment-icons";
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
  
  const { data: store, isLoading: isStoreLoading, error: storeError } = useGetPublicStore(slug, {
    query: { queryKey: getGetPublicStoreQueryKey(slug), enabled: !!slug }
  });

  const { data: products, isLoading: isProductsLoading } = useListPublicProducts(slug, {
    query: { queryKey: getListPublicProductsQueryKey(slug), enabled: !!slug }
  });

  const [policyModal, setPolicyModal] = useState<{ title: string; content: string } | null>(null);

  if (isStoreLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading store...</div>;
  const storeExpired = (storeError as any)?.error === "Store subscription expired"
    || (storeError as any)?.response?.data?.error === "Store subscription expired"
    || /subscription expired/i.test((storeError as any)?.message || "");
  if (storeExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="w-8 h-8">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Store Temporarily Unavailable</h1>
          <p className="text-gray-600">Yeh store abhi available nahi hai. Jald wapas aayega.</p>
        </div>
      </div>
    );
  }
  if (!store) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-xl font-medium text-gray-500">Store not found</div>;

  const brandColor = store.brandColor || "#10b981";

  return (
    <div className="min-h-screen bg-stone-50 font-sans">

      {/* Header bar */}
      <header className="w-full bg-gray-950 border-b border-gray-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {store.logoUrl ? (
              <img
                src={getImageUrl(store.logoUrl)}
                alt={store.shopName}
                className="w-10 h-10 rounded-xl object-contain bg-white flex-shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: brandColor }}
              >
                {store.shopName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-white text-base leading-tight truncate">{store.shopName}</div>
              {store.tagline && (
                <div className="text-gray-400 text-xs truncate">{store.tagline}</div>
              )}
            </div>
          </div>
          {store.whatsapp && (
            <a
              href={`https://wa.me/${store.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1ebe5d] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="hidden sm:inline">Chat on WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </a>
          )}
        </div>
      </header>

      {/* Banner — clean image only */}
      {store.bannerUrl && (
        <div
          className="w-full overflow-hidden"
          style={{ maxHeight: "clamp(180px, 45vw, 480px)" }}
        >
          <img
            src={getImageUrl(store.bannerUrl)}
            alt=""
            className="w-full h-full object-contain md:object-cover"
            style={{ maxHeight: "clamp(180px, 45vw, 480px)" }}
          />
        </div>
      )}

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
      
      {/* Policy Modal */}
      <Dialog open={!!policyModal} onOpenChange={() => setPolicyModal(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{policyModal?.title}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {policyModal?.content}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Methods — above footer */}
      {(() => {
        let pmArr: Array<Record<string, string>> = [];
        try { const p = JSON.parse(store.paymentMethods || ""); if (Array.isArray(p)) pmArr = p; } catch {}
        if (!pmArr.length && store.paymentMethods) pmArr = store.paymentMethods.split(",").filter(Boolean).map(m => ({ method: m.trim() }));
        pmArr = pmArr.filter(pm => pm.method && PAYMENT_METHOD_INFO[pm.method]);
        if (pmArr.length === 0) return null;
        return (
          <div className="max-w-6xl mx-auto px-4 py-10 border-t border-stone-200">
            <h2 className="text-xl font-bold text-stone-800 mb-5">Payment Methods</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pmArr.map((pm) => {
                const info = PAYMENT_METHOD_INFO[pm.method] || { label: pm.method, bg: "#374151" };
                return (
                  <div key={pm.method} className="border border-stone-200 rounded-xl p-4 bg-white flex gap-4 items-start shadow-sm">
                    <div className="shrink-0">
                      {pm.iconUrl ? (
                        <img src={pm.iconUrl} alt={pm.method} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <PaymentMethodIcon method={pm.method} size={48} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold mb-1 text-sm" style={{ color: info.bg }}>{info.label}</div>
                      {pm.method === "cod" ? (
                        <p className="text-xs text-stone-500">Delivery ke waqt payment — koi advance nahi</p>
                      ) : (
                        <div className="space-y-0.5">
                          {pm.accountNumber && <div className="text-stone-800 text-sm font-semibold">{pm.accountNumber}</div>}
                          {pm.accountName && <div className="text-stone-500 text-xs">{pm.accountName}</div>}
                          {pm.bankName && <div className="text-stone-700 text-xs font-medium">Bank: {pm.bankName}</div>}
                          {pm.accountTitle && <div className="text-stone-500 text-xs">{pm.accountTitle}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <footer className="bg-stone-900 text-stone-300">
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
                {store.footerEmail && (
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-stone-500">
                      <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z"/>
                      <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z"/>
                    </svg>
                    <a href={`mailto:${store.footerEmail}`} className="hover:text-stone-200 transition-colors">{store.footerEmail}</a>
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

            <div className="flex flex-col gap-4">
              {(store.facebookUrl || store.instagramUrl || store.twitterUrl || store.youtubeUrl) && (
                <div>
                  <h3 className="text-white font-bold text-lg mb-3">Follow Us</h3>
                  <div className="flex gap-3">
                    {store.facebookUrl && (
                      <a href={store.facebookUrl} target="_blank" rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-stone-800 hover:bg-[#1877F2] flex items-center justify-center transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-stone-300">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                    )}
                    {store.instagramUrl && (
                      <a href={store.instagramUrl} target="_blank" rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-stone-800 hover:bg-gradient-to-br hover:from-[#833ab4] hover:via-[#fd1d1d] hover:to-[#fcb045] flex items-center justify-center transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-stone-300">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                    )}
                    {store.twitterUrl && (
                      <a href={store.twitterUrl} target="_blank" rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-stone-800 hover:bg-black flex items-center justify-center transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-stone-300">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                    )}
                    {store.youtubeUrl && (
                      <a href={store.youtubeUrl} target="_blank" rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-stone-800 hover:bg-[#FF0000] flex items-center justify-center transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-stone-300">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
              {(store.privacyPolicy || store.shippingPolicy || store.returnPolicy) && (
                <div>
                  <h3 className="text-white font-bold text-lg mb-3">Policies</h3>
                  <ul className="space-y-1 text-sm">
                    {store.privacyPolicy && (
                      <li>
                        <button onClick={() => setPolicyModal({ title: "Privacy Policy", content: store.privacyPolicy! })}
                          className="text-stone-400 hover:text-stone-200 transition-colors text-left">
                          Privacy Policy
                        </button>
                      </li>
                    )}
                    {store.shippingPolicy && (
                      <li>
                        <button onClick={() => setPolicyModal({ title: "Shipping Policy", content: store.shippingPolicy! })}
                          className="text-stone-400 hover:text-stone-200 transition-colors text-left">
                          Shipping Policy
                        </button>
                      </li>
                    )}
                    {store.returnPolicy && (
                      <li>
                        <button onClick={() => setPolicyModal({ title: "Return Policy", content: store.returnPolicy! })}
                          className="text-stone-400 hover:text-stone-200 transition-colors text-left">
                          Return Policy
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              )}
              <div className="mt-auto">
                <p className="text-xs text-stone-600">Powered by <span className="font-bold text-stone-400">MyPkStore</span></p>
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
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  // Auto-collapse description after 6 seconds so card shape stays intact
  useEffect(() => {
    if (!descExpanded) return;
    const t = setTimeout(() => setDescExpanded(false), 6000);
    return () => clearTimeout(t);
  }, [descExpanded]);
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    address: "",
    note: ""
  });
  const { toast } = useToast();

  // Parse variants
  const variants: Array<{name: string; price?: number; stock?: number}> = React.useMemo(() => {
    try {
      const p = JSON.parse(product.variants || "[]");
      if (Array.isArray(p)) return p;
    } catch {}
    return [];
  }, [product.variants]);

  const hasVariants = variants.length > 0;
  const currentVariant = hasVariants && selectedVariantIdx !== null ? variants[selectedVariantIdx] : null;
  const displayPrice = currentVariant?.price != null ? currentVariant.price : product.price;
  const displayStock = currentVariant?.stock != null ? currentVariant.stock : product.stock;
  const isOutOfStock = displayStock <= 0;
  const needsVariantSelection = hasVariants && selectedVariantIdx === null;
  
  const submitOrder = useSubmitOrder({
    mutation: {
      onSuccess: () => {
        let text = `Hi! I want to order:\n\n*${product.name}*`;
        if (currentVariant) text += `\nVariant: ${currentVariant.name}`;
        text += `\nPrice: Rs ${displayPrice.toLocaleString()}\n\n`;
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
    const productName = currentVariant ? `${product.name} (${currentVariant.name})` : product.name;
    submitOrder.mutate({
      slug: store.slug,
      data: {
        ...formData,
        productName,
        total: displayPrice
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
            className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 p-1" 
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-stone-400 font-medium">No image</div>
        )}
        {!hasVariants && product.stock <= 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <Badge variant="destructive" className="text-sm px-3 py-1 shadow-sm">Out of Stock</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-5 flex flex-col flex-1">
        {product.category && (
          <div className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">{product.category}</div>
        )}
        <h3 className="font-bold text-lg text-stone-900 leading-tight mb-2">{product.name}</h3>
        {product.description && (
          <div className="mb-3">
            <p
              className="text-sm text-stone-600 overflow-hidden"
              style={descExpanded ? {} : { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}
            >
              {product.description}
            </p>
            {product.description.length > 100 && (
              <button
                type="button"
                onClick={() => setDescExpanded(v => !v)}
                className="text-xs font-semibold mt-1 hover:underline"
                style={{ color: brandColor }}
              >
                {descExpanded ? "Read less" : "Read more"}
              </button>
            )}
          </div>
        )}

        {hasVariants && (
          <div className="mt-1 mb-3">
            <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">Select Option</p>
            <div className="flex flex-wrap gap-1.5">
              {variants.map((v, i) => {
                const outOfStock = (v.stock ?? product.stock) <= 0;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => !outOfStock && setSelectedVariantIdx(i)}
                    disabled={outOfStock}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedVariantIdx === i
                        ? "text-white shadow-sm border-transparent"
                        : outOfStock
                        ? "border-stone-200 text-stone-400 bg-stone-50 line-through cursor-not-allowed"
                        : "border-stone-300 text-stone-700 bg-white hover:border-stone-500"
                    }`}
                    style={selectedVariantIdx === i ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                  >
                    {v.name}{outOfStock ? " (Out)" : ""}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-3">
          <p className="text-xl font-extrabold text-stone-900">Rs {displayPrice.toLocaleString()}</p>
          {!hasVariants && product.stock > 0 && product.stock <= 5 && (
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-sm">Only {product.stock} left</span>
          )}
          {currentVariant && currentVariant.stock != null && currentVariant.stock > 0 && currentVariant.stock <= 5 && (
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-sm">Only {currentVariant.stock} left</span>
          )}
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full mt-5 font-bold text-white shadow-sm transition-transform active:scale-[0.98]"
              style={{ backgroundColor: needsVariantSelection || isOutOfStock ? undefined : brandColor }}
              disabled={(!hasVariants && product.stock <= 0) || isOutOfStock || needsVariantSelection}
            >
              {needsVariantSelection ? "Select an option above" : isOutOfStock ? "Out of Stock" : "Order via WhatsApp"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Order {product.name}{currentVariant ? ` — ${currentVariant.name}` : ""}</DialogTitle>
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
