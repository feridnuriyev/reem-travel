import { useLang } from "../../lib/i18n";
import { IMAGES } from "../../lib/constants";
import { Users, Shield, Sparkles } from "lucide-react";

const ICONS = [Users, Sparkles, Shield];

export default function VipFleet() {
  const { t } = useLang();
  const go = () => {
    const el = document.getElementById("contact");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="fleet" data-testid="fleet-section" className="py-24 lg:py-32 bg-ink-900 text-cream-50 grain-overlay">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-12 items-end mb-16">
          <div className="lg:col-span-7">
            <p className="text-clay-400 uppercase tracking-[0.28em] text-xs mb-4">{t.fleet.label}</p>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] font-light tracking-tight">
              {t.fleet.title}
            </h2>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <p className="text-cream-50/70 leading-relaxed font-light">{t.fleet.subtitle}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 aspect-[5/4] overflow-hidden order-2 lg:order-1">
            <img
              src={IMAGES.vipTransfer}
              alt="Mercedes Vito VIP"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
            {t.fleet.items.map((c, i) => {
              const Icon = ICONS[i];
              return (
                <div
                  key={i}
                  data-testid={`fleet-item-${i}`}
                  className="border-t border-cream-50/15 pt-6 group cursor-pointer"
                  onClick={go}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-2xl mb-1">{c.name}</h3>
                      <p className="text-cream-50/60 text-sm">{c.note}</p>
                    </div>
                    <Icon size={20} className="text-clay-400 mt-1 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-clay-400 text-xs uppercase tracking-[0.22em] mt-2">{c.capacity}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
