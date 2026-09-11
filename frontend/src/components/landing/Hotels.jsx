import { useLang } from "../../lib/i18n";
import { FEATURED_HOTELS } from "../../lib/constants";
import { Star } from "lucide-react";

export default function Hotels() {
  const { t } = useLang();
  const go = () => {
    const el = document.getElementById("contact");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hotels" data-testid="hotels-section" className="py-24 lg:py-32 bg-cream-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 mb-14">
          <div className="lg:col-span-7">
            <p className="text-clay-500 uppercase tracking-[0.28em] text-xs mb-4">{t.hotels.label}</p>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-ink-900 leading-[1.05] font-light tracking-tight">
              {t.hotels.title}
            </h2>
          </div>
          <div className="lg:col-span-5 flex items-end">
            <p className="text-ink-500 text-base leading-relaxed font-light">{t.hotels.subtitle}</p>
          </div>
        </div>
      </div>

      <div data-testid="hotels-marquee" className="overflow-hidden relative">
        <div className="flex gap-6 marquee-track w-max">
          {[...FEATURED_HOTELS, ...FEATURED_HOTELS].map((h, i) => (
            <article
              key={i}
              data-testid={`hotel-card-${i}`}
              className="w-72 sm:w-80 flex-shrink-0 bg-cream-50 border border-ink-900/10 group"
            >
              <div className="aspect-[4/5] overflow-hidden bg-cream-200">
                <img src={h.img} alt={h.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1200ms]" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-0.5 text-clay-500 mb-2">
                  {Array.from({ length: h.stars }).map((_, k) => (
                    <Star key={k} size={12} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <h3 className="font-serif text-lg text-ink-900 leading-tight mb-1 line-clamp-2">{h.name}</h3>
                <p className="text-ink-500 text-xs uppercase tracking-[0.18em]">{h.city}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="text-center mt-14">
        <button data-testid="hotels-cta" onClick={go} className="btn-ghost-dark px-8 py-3 text-xs tracking-[0.22em] uppercase">
          {t.hotels.cta}
        </button>
      </div>
    </section>
  );
}
