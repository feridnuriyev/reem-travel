import { useLang } from "../../lib/i18n";
import { IMAGES } from "../../lib/constants";
import { CheckCircle2 } from "lucide-react";

export default function WhyUs() {
  const { t } = useLang();
  return (
    <section id="why" data-testid="why-section" className="py-24 lg:py-32 bg-cream-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        <div className="lg:col-span-5 order-2 lg:order-1">
          <div className="aspect-[4/5] overflow-hidden">
            <img
              src={IMAGES.guide}
              alt="Travel guide"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <div className="lg:col-span-7 order-1 lg:order-2">
          <p className="text-clay-500 uppercase tracking-[0.28em] text-xs mb-4">{t.why.label}</p>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-ink-900 leading-[1.05] font-light tracking-tight mb-12">
            {t.why.title}
          </h2>

          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8">
            {t.why.points.map((p, i) => (
              <div key={i} data-testid={`why-point-${i}`} className="flex items-start gap-4">
                <CheckCircle2 size={22} className="text-clay-500 flex-shrink-0 mt-1" strokeWidth={1.4} />
                <div>
                  <h3 className="font-serif text-2xl text-ink-900 mb-1.5">{p.t}</h3>
                  <p className="text-ink-500 text-sm leading-relaxed">{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
