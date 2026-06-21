import React from "react";
import { useListPublicPlans, getListPublicPlansQueryKey } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { PaymentMethodIcon, PAYMENT_METHOD_INFO } from "@/components/payment-icons";

async function fetchPublicSettings(): Promise<{ whatsappNumber: string; contactEmail: string; contactAddress: string; contactPhone: string; privacyPolicy: string; shippingPolicy: string; returnPolicy: string; facebookUrl: string; instagramUrl: string; twitterUrl: string; youtubeUrl: string; paymentMethods: string }> {
  const res = await fetch("/api/settings/public");
  if (!res.ok) return { whatsappNumber: "", contactEmail: "", contactAddress: "", contactPhone: "", privacyPolicy: "", shippingPolicy: "", returnPolicy: "", facebookUrl: "", instagramUrl: "", twitterUrl: "", youtubeUrl: "", paymentMethods: "" };
  return res.json();
}

function getImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  const gdMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdMatch) return `https://lh3.googleusercontent.com/d/${gdMatch[1]}`;
  return url;
}

type FeaturedStore = { id: number; shopName: string; slug: string; bannerUrl?: string | null; logoUrl?: string | null; tagline?: string | null };

export function LandingPage() {
  const { data: plans } = useListPublicPlans({
    query: { queryKey: getListPublicPlansQueryKey() }
  });
  const { data: featuredStores } = useQuery<FeaturedStore[]>({
    queryKey: ["featured-stores"],
    queryFn: async () => {
      const res = await fetch("/api/featured-stores");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60000,
  });
  const { data: heroStore } = useQuery<FeaturedStore | null>({
    queryKey: ["hero-store"],
    queryFn: async () => {
      const res = await fetch("/api/hero-store");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60000,
  });

  const { data: settings } = useQuery({
    queryKey: ["settings-public"],
    queryFn: fetchPublicSettings,
  });

  const [policyModal, setPolicyModal] = React.useState<{ title: string; content: string } | null>(null);

  const whatsappNumber = settings?.whatsappNumber || "923001234567";
  const contactEmail = settings?.contactEmail || "";
  const contactAddress = settings?.contactAddress || "";
  const contactPhone = settings?.contactPhone || "";
  const privacyPolicy = settings?.privacyPolicy || "";
  const shippingPolicy = settings?.shippingPolicy || "";
  const returnPolicy = settings?.returnPolicy || "";
  const facebookUrl = settings?.facebookUrl || "";
  const instagramUrl = settings?.instagramUrl || "";
  const twitterUrl = settings?.twitterUrl || "";
  const youtubeUrl = settings?.youtubeUrl || "";

  function openWhatsApp(planName?: string) {
    const msg = planName
      ? `Assalam o Alaikum! Main MyPkStore ka ${planName} plan lena chahta hoon. Meri shop register karne mein madad karein.`
      : `Assalam o Alaikum! Main MyPkStore pe apni shop banana chahta hoon. Mujhe guide karein.`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  const fallbackPlans = [
    { id: 1, name: "Basic", price: 999, productLimit: 30, features: "WhatsApp Orders, Basic Store" },
    { id: 2, name: "Pro", price: 1999, productLimit: 60, features: "Custom Branding, Priority Support" },
    { id: 3, name: "Business", price: 2999, productLimit: null, features: "Unlimited Products, Analytics, Dedicated Support" },
  ];

  const displayPlans = (plans && plans.length > 0) ? plans : fallbackPlans;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">M</div>
          <span className="text-xl font-bold">MyPk<span className="text-emerald-400">Store</span></span>
        </div>
        {contactEmail ? (
          <a
            href={`mailto:${contactEmail}`}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Send Us Email
          </a>
        ) : (
          <a
            href="#contact"
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Send Us Email
          </a>
        )}
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.12)_0%,_transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(5,150,105,0.08)_0%,_transparent_60%)] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-8 py-16 flex items-center gap-12">
          {/* Left: Text */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold mb-5 tracking-wide">
              🇵🇰 Pakistan Ka Sab Se Aasan Online Store
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              10 Minute Mein<br />
              <span className="text-emerald-400">Apni Shop,</span><br />
              Puri Dunya Mein Online!
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-md">
              Products list karein, orders manage karein aur customers ko WhatsApp pe connect karein — koi technical knowledge zarori nahi.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => openWhatsApp()}
                className="px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-base transition-colors shadow-lg shadow-emerald-500/20"
              >
                Apni Shop Banayein →
              </button>
              <a href="#features" className="px-7 py-3.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-base transition-colors border border-gray-700">
                Mazeed Jaanein
              </a>
            </div>
            <p className="mt-4 text-xs text-gray-600">✓ Free trial &nbsp;•&nbsp; ✓ 10 minute setup &nbsp;•&nbsp; ✓ WhatsApp ready</p>
          </div>

          {/* Right: Featured Hero Store (admin selected) */}
          <div className="flex-1 hidden md:block">
            {heroStore && (
              <div className="text-center mb-3">
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">Top Featured Store</span>
              </div>
            )}
            <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800 ring-1 ring-emerald-500/10">
              {heroStore ? (
                <>
                  <div className="aspect-[16/9] bg-gray-800 overflow-hidden">
                    {heroStore.bannerUrl ? (
                      <img src={getImageUrl(heroStore.bannerUrl)} alt={heroStore.shopName} className="w-full h-full object-cover" />
                    ) : heroStore.logoUrl ? (
                      <img src={getImageUrl(heroStore.logoUrl)} alt={heroStore.shopName} className="w-full h-full object-contain p-8" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-xl">{heroStore.shopName}</div>
                    )}
                  </div>
                  <div className="px-5 py-4 text-center">
                    <h3 className="text-white font-bold text-lg mb-2">{heroStore.shopName}</h3>
                    {heroStore.tagline && <p className="text-gray-400 text-sm mb-3">{heroStore.tagline}</p>}
                    <a
                      href={`/store/${heroStore.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors text-sm"
                    >
                      Visit Store
                    </a>
                  </div>
                </>
              ) : (
                <div className="aspect-[4/3] flex items-center justify-center text-gray-600 font-medium p-8 text-center">
                  Aapka store yahan dikh sakta hai
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div id="features" className="max-w-6xl mx-auto px-8 py-14 border-t border-gray-800/50">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">Kyon MyPkStore?</h2>
          <p className="text-gray-500 text-sm">Sab kuch jo aapki Pakistani shop ko online chahiye</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "🏪", label: "Custom Store", desc: "Apna URL aur branding, apni marzi ka rang" },
            { icon: "📦", label: "Products", desc: "Products, images aur inventory ek jagah" },
            { icon: "💬", label: "WhatsApp Orders", desc: "Seedha WhatsApp pe order — koi checkout nahi" },
            { icon: "📊", label: "Dashboard", desc: "Sales, orders aur stock ek dashboard mein" },
          ].map((f) => (
            <div key={f.label} className="bg-gray-900 border border-gray-800 hover:border-emerald-500/30 rounded-2xl p-5 text-center transition-colors group">
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="font-semibold text-white text-sm mb-1.5 group-hover:text-emerald-400 transition-colors">{f.label}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods Section */}
      {(() => {
        const pmStr = settings?.paymentMethods || "";
        let pmArr: Array<Record<string, string>> = [];
        try { const p = JSON.parse(pmStr); if (Array.isArray(p)) pmArr = p; } catch {}
        if (!pmArr.length && pmStr) pmArr = pmStr.split(",").filter(Boolean).map((m: string) => ({ method: m.trim() }));
        pmArr = pmArr.filter(pm => pm.method && PAYMENT_METHOD_INFO[pm.method]);
        if (pmArr.length === 0) return null;
        const displayMethods = pmArr;
        return (
      <div className="max-w-6xl mx-auto px-8 py-12 border-t border-gray-800/50">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Supported Payment Methods</h2>
          <p className="text-gray-500 text-sm">Apni shop mein in tamam payment methods accept karein</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {displayMethods.map((pm) => {
            const info = PAYMENT_METHOD_INFO[pm.method] || { label: pm.method, bg: "#374151" };
            return (
            <div key={pm.method} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col items-center gap-2.5 text-center hover:border-gray-600 transition-colors">
              {pm.iconUrl ? (
                <img src={pm.iconUrl} alt={pm.method} className="w-11 h-11 rounded-xl object-cover" />
              ) : (
                <PaymentMethodIcon method={pm.method} size={44} />
              )}
              <div className="text-xs font-bold text-gray-300 leading-tight">{info.label}</div>
              {pm.accountNumber && <div className="text-xs text-gray-500 font-medium">{pm.accountNumber}</div>}
              {pm.accountName && <div className="text-xs text-gray-600">{pm.accountName}</div>}
              {pm.bankName && <div className="text-xs text-gray-500">{pm.bankName}</div>}
            </div>
          );
          })}
        </div>
      </div>
        );
      })()}

      {/* Pricing Plans — live from admin panel */}
      <div className="max-w-6xl mx-auto px-8 pb-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Plans & Pricing</h2>
          <p className="text-gray-500 text-sm">Apni zaroorat ke mutabiq plan chunein</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {displayPlans.map((p, i) => {
            const isPopular = i === 1;
            const featureList = p.features ? p.features.split(",").map(f => f.trim()).filter(Boolean) : [];
            return (
              <div key={p.id} className={`rounded-2xl p-6 border flex flex-col ${isPopular ? "bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20" : "bg-gray-900 border-gray-800"}`}>
                {isPopular && <div className="text-xs text-emerald-400 font-bold mb-2 tracking-wide">⭐ MOST POPULAR</div>}
                <div className="font-bold text-lg mb-1">{p.name}</div>
                {(p as any).comparePrice ? (
                  <div className="text-sm text-gray-500 line-through mb-0.5">
                    Rs {(p as any).comparePrice.toLocaleString()}
                  </div>
                ) : null}
                <div className={`text-2xl font-extrabold mb-1 ${isPopular ? "text-emerald-400" : "text-white"}`}>
                  Rs {p.price.toLocaleString()}<span className="text-sm font-normal text-gray-500">/mo</span>
                </div>
                <div className="text-xs text-gray-500 mb-4">
                  {p.productLimit ? `${p.productLimit} products` : "Unlimited products"}
                </div>
                <ul className="space-y-1.5 flex-1">
                  {featureList.map((f) => (
                    <li key={f} className="text-sm text-gray-400 flex items-center gap-2">
                      <span className="text-emerald-500 text-xs">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openWhatsApp(p.name)}
                  className={`mt-5 w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${isPopular ? "bg-emerald-500 hover:bg-emerald-400 text-white" : "border border-gray-700 hover:border-emerald-500 text-gray-400 hover:text-white"}`}
                >
                  Shuru Karein
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Policy Modal */}
      {policyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPolicyModal(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">{policyModal.title}</h3>
              <button onClick={() => setPolicyModal(null)} className="text-gray-500 hover:text-white transition-colors text-xl leading-none">✕</button>
            </div>
            <div className="text-gray-400 text-sm whitespace-pre-wrap leading-relaxed">{policyModal.content}</div>
          </div>
        </div>
      )}

      {/* Featured Stores — admin selected */}
      {featuredStores && featuredStores.length > 0 && (
        <div className="max-w-6xl mx-auto px-8 py-14 border-t border-gray-800/50">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">Featured Stores</h2>
            <p className="text-gray-400 text-sm">In stores ko dekhein jo MyPkStore par live hain</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStores.map((s) => (
              <div key={s.id} className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden hover:border-emerald-600 transition-colors flex flex-col">
                <div className="aspect-[16/9] bg-gray-800 overflow-hidden">
                  {s.bannerUrl ? (
                    <img src={getImageUrl(s.bannerUrl)} alt={s.shopName} className="w-full h-full object-cover" />
                  ) : s.logoUrl ? (
                    <img src={getImageUrl(s.logoUrl)} alt={s.shopName} className="w-full h-full object-contain p-6" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 font-medium">{s.shopName}</div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg text-white mb-1">{s.shopName}</h3>
                  {s.tagline && <p className="text-gray-400 text-sm mb-4 flex-1">{s.tagline}</p>}
                  <a
                    href={`/store/${s.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-block text-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors text-sm"
                  >
                    Visit Store
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Contact / CTA */}
      <div id="contact" className="border-t border-gray-800 bg-gradient-to-r from-emerald-900/20 to-gray-900">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="font-bold text-lg text-white">Aaj Hi Shuru Karein</div>
              <div className="text-gray-500 text-sm mb-3">50+ Pakistani shops already MyPkStore use kar rahi hain</div>
              {(contactAddress || contactPhone || contactEmail) && (
                <ul className="space-y-1 text-sm text-gray-500">
                  {contactAddress && (
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">📍</span>
                      <span>{contactAddress}</span>
                    </li>
                  )}
                  {contactPhone && (
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">📞</span>
                      <a href={`tel:${contactPhone}`} className="hover:text-gray-300 transition-colors">{contactPhone}</a>
                    </li>
                  )}
                  {contactEmail && (
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✉️</span>
                      <a href={`mailto:${contactEmail}`} className="hover:text-gray-300 transition-colors">{contactEmail}</a>
                    </li>
                  )}
                </ul>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => openWhatsApp()}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                📲 WhatsApp
              </button>
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="px-6 py-3 border border-gray-700 hover:border-emerald-500 text-gray-400 hover:text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  ✉️ Send Us Email
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800/50 py-4 px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <span>© 2026 MyPkStore — Pakistan Ka Apna Online Store Platform</span>
            <div className="flex flex-wrap items-center gap-4">
              {privacyPolicy && (
                <button onClick={() => setPolicyModal({ title: "Privacy Policy", content: privacyPolicy })}
                  className="hover:text-gray-300 transition-colors">Privacy Policy</button>
              )}
              {shippingPolicy && (
                <button onClick={() => setPolicyModal({ title: "Shipping Policy", content: shippingPolicy })}
                  className="hover:text-gray-300 transition-colors">Shipping Policy</button>
              )}
              {returnPolicy && (
                <button onClick={() => setPolicyModal({ title: "Return Policy", content: returnPolicy })}
                  className="hover:text-gray-300 transition-colors">Return Policy</button>
              )}
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 transition-colors" aria-label="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                  </svg>
                </a>
              )}
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-400 transition-colors" aria-label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              {twitterUrl && (
                <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 transition-colors" aria-label="Twitter / X">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {youtubeUrl && (
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400 transition-colors" aria-label="YouTube">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}
              <a href="/admin-login" className="hover:text-gray-400 transition-colors">Admin</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
