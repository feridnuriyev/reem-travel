import { useLang } from "../../lib/i18n";
import { GOOGLE_MAPS_LINK, GOOGLE_MAPS_EMBED } from "../../lib/constants";
import { MapPin, ExternalLink } from "lucide-react";

export default function MapSection() {
  const { t } = useLang();
  return (
    <section id="map" data-testid="map-section" className="py-24 lg:py-32 bg-cream-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-4">
          <p className="text-clay-500 uppercase tracking-[0.28em] text-xs mb-4">{t.map.label}</p>
          <h2 className="font-serif text-4xl sm:text-5xl text-ink-900 leading-[1.05] font-light tracking-tight mb-6">
            {t.map.title}
          </h2>
          <p className="flex items-start gap-3 text-ink-700 mb-6">
            <MapPin size={18} className="mt-1 text-clay-500 flex-shrink-0" />
            <span>{t.map.address_line}</span>
          </p>
          <a
            href={GOOGLE_MAPS_LINK}
            target="_blank"
            rel="noreferrer"
            data-testid="directions-link"
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-xs tracking-[0.22em] uppercase"
          >
            {t.map.directions}
            <ExternalLink size={14} />
          </a>
        </div>
        <div className="lg:col-span-8">
          <div className="aspect-[16/10] w-full overflow-hidden border border-ink-900/10">
            <iframe
              title="Reem Travel office location"
              src={GOOGLE_MAPS_EMBED}
              className="w-full h-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              data-testid="map-iframe"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
