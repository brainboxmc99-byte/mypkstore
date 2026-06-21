export const PAYMENT_METHOD_INFO: Record<string, { label: string; bg: string }> = {
  jazzcash:      { label: "JazzCash",          bg: "#C8102E" },
  easypaisa:     { label: "EasyPaisa",         bg: "#1DA462" },
  cod:           { label: "Cash on Delivery",  bg: "#b45309" },
  bank_transfer: { label: "Bank Transfer",     bg: "#1e40af" },
  nayapay:       { label: "NayaPay",           bg: "#6d28d9" },
  sadapay:       { label: "SadaPay",           bg: "#0369a1" },
};

export function PaymentMethodIcon({ method, size = 40 }: { method: string; size?: number }) {
  if (method === "jazzcash") return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="9" fill="#C8102E"/>
      <rect x="1" y="1" width="38" height="38" rx="8" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
      <path d="M10 29V16a4 4 0 014-4h4" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M22 11h4a4 4 0 014 4v8a4 4 0 01-4 4h-4" stroke="rgba(255,255,255,0.6)" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="27" cy="27" r="3" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.5"/>
    </svg>
  );
  if (method === "easypaisa") return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="9" fill="#1DA462"/>
      <rect x="1" y="1" width="38" height="38" rx="8" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
      <rect x="13" y="7" width="14" height="24" rx="3" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.8"/>
      <path d="M17 12h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="20" cy="27" r="1.5" fill="white"/>
      <path d="M16 17h8M16 20h6" stroke="white" strokeWidth="1.3" strokeLinecap="round" opacity="0.8"/>
    </svg>
  );
  if (method === "cod") return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="9" fill="#b45309"/>
      <rect x="1" y="1" width="38" height="38" rx="8" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
      <rect x="6" y="13" width="28" height="18" rx="3" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.8"/>
      <circle cx="20" cy="22" r="4.5" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.6"/>
      <path d="M6 18h28" stroke="white" strokeWidth="1.2" strokeDasharray="2.5 2"/>
      <path d="M6 26h28" stroke="white" strokeWidth="1.2" strokeDasharray="2.5 2"/>
    </svg>
  );
  if (method === "bank_transfer") return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="9" fill="#1e40af"/>
      <rect x="1" y="1" width="38" height="38" rx="8" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
      <path d="M7 17L20 9l13 8H7z" fill="white" opacity="0.9"/>
      <rect x="9" y="19" width="4" height="10" rx="1" fill="white" opacity="0.85"/>
      <rect x="18" y="19" width="4" height="10" rx="1" fill="white" opacity="0.85"/>
      <rect x="27" y="19" width="4" height="10" rx="1" fill="white" opacity="0.85"/>
      <rect x="7" y="29" width="26" height="2.5" rx="1" fill="white" opacity="0.9"/>
    </svg>
  );
  if (method === "nayapay") return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="9" fill="#6d28d9"/>
      <rect x="1" y="1" width="38" height="38" rx="8" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
      <path d="M11 30V10l9 14V10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 24l9-14v20" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (method === "sadapay") return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="9" fill="#0369a1"/>
      <rect x="1" y="1" width="38" height="38" rx="8" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
      <path d="M23 8L13 23h8l-4 9 14-16H23l2-8z" fill="white"/>
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="9" fill="#374151"/>
      <rect x="7" y="12" width="26" height="18" rx="3" stroke="white" strokeWidth="1.8" fill="rgba(255,255,255,0.1)"/>
      <path d="M7 18h26" stroke="white" strokeWidth="1.8"/>
    </svg>
  );
}
