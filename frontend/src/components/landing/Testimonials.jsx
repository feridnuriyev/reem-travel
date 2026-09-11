import { useLang } from "../../lib/i18n";
import { Quote } from "lucide-react";

export default function Testimonials() {
  const { t } = useLang();
  return (
    <section id="testimonials" data-testid="testimonials-section" className="py-24 lg:py-32 bg-cream-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="mb-14 max-w-2xl">
          <p className="text-clay-500 uppercase tracking-[0.28em] text-xs mb-4">{t.testimonials.label}</p>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-ink-900 leading-[1.05] font-light tracking-tight">
            {t.testimonials.title}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {t.testimonials.items.map((r, i) => (
            <figure
              key={i}
              data-testid={`testimonial-${i}`}
              className="bg-cream-50 p-8 lg:p-10 border border-ink-900/8 relative"
            >
              <Quote size={28} className="text-clay-400 mb-6" strokeWidth={1.2} />
              <blockquote className="font-serif text-xl lg:text-2xl text-ink-900 leading-snug font-light">
                "{r.text}"
              </blockquote>
              <figcaption className="mt-8 pt-6 border-t border-ink-900/10">
                <div className="font-medium text-ink-900">{r.name}</div>
                <div className="text-ink-500 text-xs uppercase tracking-[0.22em] mt-1">{r.from}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
