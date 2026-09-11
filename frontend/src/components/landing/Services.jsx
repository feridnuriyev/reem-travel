import { useLang } from "../../lib/i18n";
import { Hotel, Car, MapPin, Home, Users, Plane } from "lucide-react";

const ICONS = { hotels: Hotel, transfer: Car, tours: MapPin, apartments: Home, guides: Users, flights: Plane };

export default function Services() {
  const { t } = useLang();
  const go = () => {
    const el = document.getElementById("contact");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="services" data-testid="services-section" className="py-24 lg:py-32 bg-cream-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-5">
            <p className="text-clay-500 uppercase tracking-[0.28em] text-xs mb-4">{t.services.label}</p>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-ink-900 leading-[1.05] font-light tracking-tight">
              {t.services.title}
            </h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 flex items-end">
            <p className="text-ink-500 text-lg font-light leading-relaxed">{t.services.subtitle}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-ink-900/10 border border-ink-900/10">
          {t.services.items.map((item, i) => {
            const Icon = ICONS[item.key] || MapPin;
            return (
              <button
                key={item.key}
                data-testid={`service-${item.key}`}
                onClick={go}
                className="group text-left bg-cream-50 p-8 lg:p-10 transition-colors duration-500 hover:bg-cream-100 relative"
              >
                <div className="flex items-start justify-between mb-12">
                  <Icon className="text-clay-500" size={28} strokeWidth={1.4} />
                  <span className="font-serif italic text-ink-300 text-2xl">0{i + 1}</span>
                </div>
                <h3 className="font-serif text-2xl lg:text-3xl text-ink-900 mb-3 font-medium leading-tight">{item.title}</h3>
                <p className="text-ink-500 text-sm leading-relaxed">{item.desc}</p>
                <span className="mt-6 inline-block text-clay-500 text-xs uppercase tracking-[0.22em] border-b border-clay-500 pb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
