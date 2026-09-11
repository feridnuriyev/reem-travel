import { useEffect, useState } from "react";
import { useLang } from "../../lib/i18n";
import { LOGO_HORIZONTAL, WHATSAPP_NUMBER } from "../../lib/constants";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const NAV = [
  { id: "services", k: "services" },
  { id: "hotels", k: "hotels" },
  { id: "tours", k: "tours" },
  { id: "destinations", k: "destinations" },
  { id: "reviews", k: "reviews" },
  { id: "contact", k: "contact" },
];

export default function Header() {
  const { lang, setLang, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onLight = scrolled;

  return (
    <header
      data-testid="site-header"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        onLight ? "bg-cream-50/85 backdrop-blur-xl border-b border-ink-900/10 shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 lg:px-10 h-20 flex items-center justify-between gap-6">
        <Link to="/" data-testid="logo-link" className="flex items-center gap-3 group flex-shrink-0">
          <div className={`rounded-full overflow-hidden flex-shrink-0 transition-all ${onLight ? "bg-ink-900" : "bg-ink-900/80 ring-1 ring-cream-50/30"}`} style={{ width: 52, height: 52 }}>
            <img
              src={LOGO_HORIZONTAL}
              alt="Reem Group Travel & Tourism"
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover scale-[1.6] origin-left"
              style={{ objectPosition: "8% 50%" }}
            />
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className={`font-serif text-xl tracking-tight ${onLight ? "text-ink-900" : "text-cream-50"}`}>
              Reem<span className="italic font-light"> Group</span>
            </span>
            <span className={`text-[10px] uppercase tracking-[0.28em] ${onLight ? "text-ink-500" : "text-cream-50/70"}`}>
              Travel · Tourism
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {NAV.map((n) => (
            <button
              key={n.id}
              data-testid={`nav-${n.id}`}
              onClick={() => go(n.id)}
              className={`text-sm tracking-wide transition-colors ${
                onLight ? "text-ink-700 hover:text-clay-500" : "text-cream-50/90 hover:text-cream-50"
              }`}
            >
              {t.nav[n.k]}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className={`hidden sm:flex items-center text-xs tracking-[0.18em] uppercase rounded-full border ${onLight ? "border-ink-900/20" : "border-cream-50/40"}`}>
            <button
              data-testid="lang-en"
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 transition-colors ${
                lang === "en" ? "bg-clay-500 text-cream-50 rounded-full" : onLight ? "text-ink-700" : "text-cream-50/90"
              }`}
            >
              EN
            </button>
            <button
              data-testid="lang-tr"
              onClick={() => setLang("tr")}
              className={`px-3 py-1.5 transition-colors ${
                lang === "tr" ? "bg-clay-500 text-cream-50 rounded-full" : onLight ? "text-ink-700" : "text-cream-50/90"
              }`}
            >
              TR
            </button>
            <button
              data-testid="lang-ar"
              onClick={() => setLang("ar")}
              className={`px-3 py-1.5 transition-colors ${
                lang === "ar" ? "bg-clay-500 text-cream-50 rounded-full" : onLight ? "text-ink-700" : "text-cream-50/90"
              }`}
            >
              AR
            </button>
          </div>

          <button data-testid="header-cta" onClick={() => go("contact")} className="hidden md:inline-flex btn-primary px-5 py-2.5 text-sm tracking-wide">
            {t.nav.plan}
          </button>

          <button data-testid="mobile-menu-toggle" onClick={() => setOpen((v) => !v)} className={`lg:hidden p-2 ${onLight ? "text-ink-900" : "text-cream-50"}`} aria-label="Toggle menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div data-testid="mobile-menu" className="lg:hidden bg-cream-50 border-t border-ink-900/10 px-6 py-6 space-y-4">
          {NAV.map((n) => (
            <button key={n.id} data-testid={`mobile-nav-${n.id}`} onClick={() => go(n.id)} className="block text-left w-full text-ink-900 font-serif text-2xl">
              {t.nav[n.k]}
            </button>
          ))}
          <div className="flex gap-3 pt-4">
            <button data-testid="mobile-lang-en" onClick={() => setLang("en")} className={`px-4 py-2 text-xs tracking-[0.18em] ${lang === "en" ? "bg-clay-500 text-cream-50" : "border border-ink-900/20 text-ink-900"}`}>EN</button>
            <button data-testid="mobile-lang-tr" onClick={() => setLang("tr")} className={`px-4 py-2 text-xs tracking-[0.18em] ${lang === "tr" ? "bg-clay-500 text-cream-50" : "border border-ink-900/20 text-ink-900"}`}>TR</button>
            <button data-testid="mobile-lang-ar" onClick={() => setLang("ar")} className={`px-4 py-2 text-xs tracking-[0.18em] ${lang === "ar" ? "bg-clay-500 text-cream-50" : "border border-ink-900/20 text-ink-900"}`}>AR</button>
          </div>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="block btn-primary px-5 py-3 text-center" data-testid="mobile-whatsapp-cta">
            WhatsApp
          </a>
        </div>
      )}
    </header>
  );
}
