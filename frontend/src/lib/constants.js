export const WHATSAPP_NUMBER = "905413521812";
export const WHATSAPP_DISPLAY = "+90 541 352 18 12";
export const PHONE_DISPLAY = "+90 533 318 94 56";
export const PHONE_NUMBER = "+905333189456";
export const COMPANY_EMAIL = "reservation@reemtravel.com.tr";
export const GOOGLE_MAPS_LINK = "https://maps.app.goo.gl/xdrJKhPDTWYN8Cqw9";
// Generic embed using company name search (no API key required)
export const GOOGLE_MAPS_EMBED =
  "https://www.google.com/maps?q=Reem+Travel+Tourism+Istanbul&output=embed";

export const LOGO_VERTICAL = "/brand/logo-vertical.jpg";
export const LOGO_HORIZONTAL = "/brand/logo-horizontal.jpg";

// Optimized Unsplash params helper
export const img = (url, w = 1200, q = 75) => {
  if (!url) return url;
  if (url.includes("unsplash.com")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}auto=format&fit=crop&w=${w}&q=${q}`;
  }
  return url;
};

export const IMAGES = {
  // Summer holiday hero — Antalya / Bodrum / Marmaris turquoise coast
  hero: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=2000&q=80",
  heroAlt: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1800&q=80",
  cappadocia:
    "https://images.unsplash.com/photo-1631152186151-a0f9dde3a1e3?auto=format&fit=crop&w=1400&q=75",
  // Coastal destinations
  antalya: "https://images.unsplash.com/photo-1589561253898-768105ca91a8?auto=format&fit=crop&w=1400&q=75",
  bodrum: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1400&q=75",
  marmaris: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1400&q=75",
  fethiye: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1400&q=75",
  kusadasi: "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=1400&q=75",
  cesme: "https://images.unsplash.com/photo-1568849676085-51415703900f?auto=format&fit=crop&w=1400&q=75",
  // Services
  hotelRoom: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=75",
  vipTransfer: "https://images.pexels.com/photos/17455625/pexels-photo-17455625.jpeg?auto=compress&cs=tinysrgb&w=1200",
  apartment: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=75",
  guide: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=75",
  yacht: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1400&q=75",
  beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=75",
};
