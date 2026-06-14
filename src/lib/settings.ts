import { prisma } from "./db";

export const DEFAULT_SETTINGS: Record<string, string> = {
  siteName: "Garud Sewa",
  tagline: "Travel Eastern Nepal — Jhapa to Taplejung",
  taglineNe: "पूर्वी नेपाल यात्रा — झापादेखि ताप्लेजुङ",
  primaryColor: "#1e3a8a",
  accentColor: "#7c3aed",
  contactEmail: "support@gadursewa.com",
  contactPhone: "+977 9800000000",
  trustBadge1: "Serving Eastern Nepal",
  trustBadge2: "Trusted local operators",
  trustRating: "4.7",
  heroTitle: "Book Hiace, hotels & jeeps across the Mechi corridor",
  heroSubtitle: "From Birtamod & Charali through Ilam and Phidim up to Phungling (Taplejung).",
  heroImage: "https://images.unsplash.com/photo-1486911278844-a81c5267e227?w=1800&q=75&auto=format&fit=crop",
  aboutText:
    "Garud Sewa connects travellers across eastern Nepal with trusted bus operators, hotels and jeep rentals along the Mechi Highway between Jhapa and Taplejung.",
  helpText: "Need help? Call us or message us — our team responds during business hours (NPT).",
  termsText: "All bookings follow operator and hotel policies. Fares are in Nepali Rupees (NPR).",
  footerNote: "© Garud Sewa. Serving the Jhapa–Taplejung corridor.",
  facebook: "",
  instagram: "",
  serviceFee: "0",
  // Payment (FonePay QR shown at checkout)
  paymentQr: "",
  paymentMerchant: "kinaun shopping pvt.ltd",
  paymentTerminal: "2222030013285742",
  paymentBranch: "ANAMNAGAR BRANCH",
};

export async function getSettings(): Promise<Record<string, string>> {
  const map: Record<string, string> = { ...DEFAULT_SETTINGS };
  try {
    const rows = await prisma.setting.findMany();
    for (const r of rows) map[r.key] = r.value;
  } catch {
    // DB unreachable (e.g. during build before env is set) — use defaults
  }
  return map;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}
