import { useLang } from "../../lib/i18n";
import { WHATSAPP_NUMBER, WHATSAPP_DISPLAY, PHONE_DISPLAY, COMPANY_EMAIL } from "../../lib/constants";
import { Instagram, Facebook, MessageCircle, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const { t, lang } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer data-testid="site-footer" className="bg-ink-900 text-cream-50/80 pt-24 pb-10 grain-overlay">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 mb-16">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-10 h-10 rounded-full bg-clay-500 text-cream-50 flex items-center justify-center font-serif text-xl">R</span>
              <span className="font-serif text-3xl text-cream-50">Reem<span className="italic font-light"> Travel</span></span>
            </div>
            <p className="text-cream-50/60 max-w-md leading-relaxed">{t.footer.tagline}</p>

            <div className="flex items-center gap-3 mt-8">
              <a href="https://www.instagram.com/reemgrouptravel/" target="_blank" rel="noreferrer" data-testid="footer-instagram" aria-label="Instagram" className="w-10 h-10 border border-cream-50/20 rounded-full flex items-center justify-center hover:bg-clay-500 hover:border-clay-500 transition-colors">
                <Instagram size={16} />
              </a>
              <a href="https://www.facebook.com/reemtravel" target="_blank" rel="noreferrer" data-testid="footer-facebook" aria-label="Facebook" className="w-10 h-10 border border-cream-50/20 rounded-full flex items-center justify-center hover:bg-clay-500 hover:border-clay-500 transition-colors">
                <Facebook size={16} />
              </a>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" data-testid="footer-whatsapp" aria-label="WhatsApp" className="w-10 h-10 border border-cream-50/20 rounded-full flex items-center justify-center hover:bg-whatsapp hover:border-whatsapp transition-colors">
                <MessageCircle size={16} />
              </a>
            </div>
          </div>

          <div className="lg:col-span-3">
            <p className="uppercase tracking-[0.22em] text-xs text-cream-50/50 mb-5">{t.footer.quick}</p>
            <ul className="space-y-3">
              {["services", "tours", "hotels", "destinations", "why", "contact"].map((id) => (
                <li key={id}>
                  <a href={`#${id}`} className="hover:text-clay-400 transition-colors capitalize">{t.nav[id === "why" ? "about" : id]}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <p className="uppercase tracking-[0.22em] text-xs text-cream-50/50 mb-5">{t.footer.contact_title}</p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 text-clay-400" />
                <span>{lang === "tr" ? "İstanbul, Türkiye" : "Istanbul, Türkiye"}</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={16} className="mt-0.5 text-clay-400" />
                <a href={`tel:${PHONE_DISPLAY}`}>{PHONE_DISPLAY}</a>
              </li>
              <li className="flex items-start gap-3">
                <MessageCircle size={16} className="mt-0.5 text-clay-400" />
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">{WHATSAPP_DISPLAY}</a>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={16} className="mt-0.5 text-clay-400" />
                <a href={`mailto:${COMPANY_EMAIL}`}>{COMPANY_EMAIL}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-cream-50/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cream-50/50">
          <p>© {year} Reem Travel. {t.footer.rights}</p>
          <p className="font-serif italic">Made with care in İstanbul</p>
        </div>
      </div>
    </footer>
  );
}
