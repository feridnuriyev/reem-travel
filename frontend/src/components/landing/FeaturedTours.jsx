import { useLang } from "../../lib/i18n";
import { IMAGES } from "../../lib/constants";
import { ArrowUpRight, Clock } from "lucide-react";

const IMG_MAP = [IMAGES.heroSecondary, IMAGES.sapanca, IMAGES.cappadocia];

export default function FeaturedTours() {
  const { t } = useLang();
  const go = () => {
    const el = document.getElementById("contact");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="tours" data-testid="tours-section" className="py-24 lg:py-32 bg-cream-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between mb-16 flex-wrap gap-6">
          <div className="max-w-2xl">
            <p className="text-clay-500 uppercase tracking-[0.28em] text-xs mb-4">{t.tours.label}</p>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-ink-900 leading-[1.05] font-light tracking-tight">
              {t.tours.title}
            </h2>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {t.tours.items.map((tour, i) => (
            <article
              key={i}
              data-testid={`tour-card-${i}`}
              className="group bg-cream-50 hover-lift border border-ink-900/8 overflow-hidden flex flex-col"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={IMG_MAP[i % IMG_MAP.length]}
                  alt={tour.title}
                  className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute top-4 left-4 bg-cream-50/95 backdrop-blur px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-ink-700">
                  <Clock size={11} className="inline mr-1.5 -mt-0.5" />
                  {tour.duration}
                </div>
              </div>
              <div className="p-7 flex flex-col gap-4 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-serif text-2xl text-ink-900 leading-tight">{tour.title}</h3>
                  <span className="font-serif italic text-clay-600 text-lg whitespace-nowrap">{tour.price}</span>
                </div>
                <p className="text-ink-500 text-sm leading-relaxed flex-1">{tour.desc}</p>
                <button
                  data-testid={`tour-cta-${i}`}
                  onClick={go}
                  className="inline-flex items-center gap-2 text-ink-900 text-xs uppercase tracking-[0.22em] border-b border-ink-900 pb-1 self-start hover:gap-3 transition-all"
                >
                  {t.tours.cta} <ArrowUpRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
