import { useLang } from "../../lib/i18n";
import { IMAGES } from "../../lib/constants";
import { ArrowRight, Sun } from "lucide-react";

export default function Hero() {
  const { t } = useLang();
  const go = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="top" data-testid="hero-section" className="relative min-h-[100svh] flex items-end overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={IMAGES.hero}
          alt="Turkish Mediterranean coast — turquoise sea and yachts"
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
          fetchpriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/20 to-ink-900/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900/40 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 pb-16 lg:pb-24 pt-32">
        <div className="max-w-3xl fade-up">
          <div className="inline-flex items-center gap-2 text-cream-50/90 uppercase tracking-[0.28em] text-xs mb-8">
            <Sun size={14} />
            <span data-testid="hero-eyebrow">{t.hero.eyebrow}</span>
          </div>

          <h1 data-testid="hero-title" className="text-cream-50 font-serif font-light text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[1.02] tracking-tight">
            {t.hero.title_a}
            <br />
            <span className="italic font-normal text-clay-400">{t.hero.title_b}</span>{" "}
            {t.hero.title_c}
          </h1>

          <p data-testid="hero-subtitle" className="mt-8 max-w-xl text-cream-50/90 text-lg leading-relaxed font-light">
            {t.hero.subtitle}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button data-testid="hero-primary-cta" onClick={() => go("hotels")} className="btn-primary inline-flex items-center gap-2 px-7 py-4 text-sm tracking-wider uppercase">
              {t.hero.cta_primary}
              <ArrowRight size={16} />
            </button>
            <button data-testid="hero-secondary-cta" onClick={() => go("contact")} className="inline-flex items-center gap-2 px-7 py-4 text-sm tracking-wider uppercase text-cream-50 border border-cream-50/40 hover:bg-cream-50 hover:text-ink-900 transition-colors">
              {t.hero.cta_secondary}
            </button>
          </div>

          <dl className="mt-16 grid grid-cols-3 gap-6 max-w-xl">
            {[
              { v: "12+", k: t.hero.stat_years },
              { v: "24+", k: t.hero.stat_hotels },
              { v: "30+", k: t.hero.stat_countries },
            ].map((s, i) => (
              <div key={i} className="border-l border-cream-50/30 pl-4">
                <dt className="font-serif text-cream-50 text-4xl font-light">{s.v}</dt>
                <dd className="text-cream-50/70 text-xs uppercase tracking-[0.18em] mt-1">{s.k}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
