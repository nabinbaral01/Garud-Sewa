// Lightweight i18n for the public site (English / Nepali).

export type Lang = "en" | "ne";

type Entry = { en: string; ne: string };

const DICT: Record<string, Entry> = {
  buses: { en: "Hiace", ne: "हाइस" },
  hotels: { en: "Hotels", ne: "होटल" },
  carJeep: { en: "Book Hiace", ne: "हाइस बुक" },
  login: { en: "Login", ne: "लग इन" },

  from: { en: "From", ne: "कहाँबाट" },
  to: { en: "To", ne: "कहाँसम्म" },
  date: { en: "Date", ne: "मिति" },
  leavingFrom: { en: "Leaving from", ne: "प्रस्थान स्थान" },
  goingTo: { en: "Going to", ne: "गन्तव्य" },
  cityDest: { en: "City / destination", ne: "सहर / गन्तव्य" },
  whereGoing: { en: "Where are you going?", ne: "कहाँ जाँदै हुनुहुन्छ?" },
  checkIn: { en: "Check-in", ne: "चेक-इन" },
  checkOut: { en: "Check-out", ne: "चेक-आउट" },
  guests: { en: "Guests", ne: "पाहुना" },
  rooms: { en: "Rooms", ne: "कोठा" },
  pickupPoint: { en: "Pickup point", ne: "पिकअप स्थान" },
  pickupLocation: { en: "Pickup location", ne: "पिकअप स्थान" },
  pickupDate: { en: "Pickup date", ne: "पिकअप मिति" },
  returnDate: { en: "Return date", ne: "फिर्ता मिति" },
  returnAnother: { en: "Return in another city", ne: "अर्को सहरमा फिर्ता" },
  dropOff: { en: "Drop-off (one-way)", ne: "ड्रप-अफ (एकतर्फी)" },
  findBuses: { en: "Find Hiace", ne: "हाइस खोज्नुहोस्" },
  findHotels: { en: "Find hotels", ne: "होटल खोज्नुहोस्" },
  findVehicle: { en: "Find a Hiace", ne: "हाइस खोज्नुहोस्" },

  exploreServices: { en: "Explore Garud Sewa", ne: "गरुड सेवा अन्वेषण गर्नुहोस्" },
  promotions: { en: "Ongoing promotions", ne: "चलिरहेका अफरहरू" },
  popularRoutes: { en: "Popular routes", ne: "लोकप्रिय रुटहरू" },
  busesJeeps: { en: "Hiace service", ne: "हाइस सेवा" },
  soon: { en: "Soon", ne: "चाँडै" },
  flights: { en: "Flights", ne: "हवाई" },
  tours: { en: "Tours", ne: "पर्यटन" },
  trekking: { en: "Trekking", ne: "ट्रेकिङ" },

  footerRoutes: { en: "Routes", ne: "रुटहरू" },
  footerHelp: { en: "Help", ne: "सहयोग" },
  footerContact: { en: "Contact", ne: "सम्पर्क" },
  helpCenter: { en: "Help center", ne: "सहयोग केन्द्र" },
  aboutUs: { en: "About us", ne: "हाम्रो बारेमा" },
  terms: { en: "Terms", ne: "सर्तहरू" },
  averageRating: { en: "average rating", ne: "औसत रेटिङ" },
};

export function t(lang: Lang, key: string): string {
  const e = DICT[key];
  return e ? e[lang] : key;
}
