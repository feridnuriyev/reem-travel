import { useEffect, useState, useMemo } from "react";
import { useLang } from "../../lib/i18n";
import { listHotels } from "../../lib/api";
import { Star, MapPin, ChevronDown, ChevronUp, Users } from "lucide-react";
import BookingModal from "./BookingModal";

export default function HotelsSection() {
  const { t } = useLang();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null); // hotel id
  const [filter, setFilter] = useState("all");
  const [booking, setBooking] = useState(null); // { hotel, room }

  useEffect(() => {
    listHotels().then((d) => setHotels(d)).catch(() => setHotels([])).finally(() => setLoading(false));
  }, []);

  const cities = useMemo(() => {
    const set = new Set(hotels.map((h) => h.region || h.city).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [hotels]);

  const visible = filter === "all" ? hotels : hotels.filter((h) => (h.region || h.city) === filter);

  return (
    <section id="hotels" data-testid="hotels-section" className="relative overflow-hidden py-24 lg:py-32 bg-ink-900">
      <img
        src="/images/hotel-suite.webp"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/90 to-ink-900/70" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 mb-12">
          <div className="lg:col-span-7">
            <p className="text-clay-400 uppercase tracking-[0.28em] text-xs mb-4">{t.hotels.label}</p>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-cream-50 leading-[1.05] font-light tracking-tight">
              {t.hotels.title}
            </h2>
          </div>
          <div className="lg:col-span-5 flex items-end">
            <p className="text-cream-50/80 text-base leading-relaxed font-light">{t.hotels.subtitle}</p>
          </div>
        </div>

        {/* City filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-10 pb-2">
          {cities.map((c) => (
            <button
              key={c}
              data-testid={`hotel-filter-${c}`}
              onClick={() => setFilter(c)}
              className={`px-5 py-2 text-xs uppercase tracking-[0.22em] border whitespace-nowrap transition-colors ${
                filter === c
                  ? "bg-clay-500 text-cream-50 border-clay-500"
                  : "bg-cream-50/5 text-cream-50 border-cream-50/25 hover:bg-cream-50/15 hover:border-cream-50/50"
              }`}
            >
              {c === "all" ? t.hotels.filter_all : c}
            </button>
          ))}
        </div>

        {loading && (
          <div data-testid="hotels-loading" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-cream-200 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {visible.map((h) => {
              const isOpen = expanded === h.id;
              return (
                <article key={h.id} data-testid={`hotel-${h.id}`} className="group bg-cream-50 border border-ink-900/10 flex flex-col hover-lift">
                  <div className="relative aspect-[4/5] overflow-hidden bg-cream-200">
                    <img
                      src={h.cover_image}
                      alt={h.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1500ms]"
                    />
                    <div className="absolute top-4 left-4 bg-cream-50/95 backdrop-blur px-3 py-1.5 flex items-center gap-1 text-clay-500">
                      {Array.from({ length: h.stars }).map((_, k) => (
                        <Star key={k} size={11} fill="currentColor" strokeWidth={0} />
                      ))}
                    </div>
                    {h.starting_price && (
                      <div className="absolute bottom-4 right-4 bg-ink-900/85 backdrop-blur text-cream-50 px-3 py-1.5 text-xs uppercase tracking-[0.18em]">
                        {t.hotels.from} <span className="font-serif text-base normal-case tracking-normal text-clay-400 ml-1">€{Math.round(h.starting_price)}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col gap-3 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-serif text-2xl text-ink-900 leading-tight">{h.name}</h3>
                    </div>
                    <p className="flex items-center gap-1.5 text-ink-500 text-xs uppercase tracking-[0.2em]">
                      <MapPin size={12} /> {h.region || h.city}
                    </p>
                    <p className="text-ink-500 text-sm leading-relaxed line-clamp-3">{h.description}</p>

                    <button
                      data-testid={`view-rooms-${h.id}`}
                      onClick={() => setExpanded(isOpen ? null : h.id)}
                      className="mt-2 inline-flex items-center justify-between border-t border-ink-900/10 pt-4 text-xs uppercase tracking-[0.22em] text-ink-900 hover:text-clay-500"
                    >
                      <span>{t.hotels.view_rooms}</span>
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isOpen && (
                      <div data-testid={`rooms-list-${h.id}`} className="space-y-4 mt-3 border-t border-ink-900/10 pt-4">
                        {h.rooms && h.rooms.length > 0 ? (
                          h.rooms.map((r) => (
                            <div key={r.id} data-testid={`room-${r.id}`} className="flex gap-4 items-start">
                              {r.images && r.images[0] && (
                                <img src={r.images[0]} alt={r.name} loading="lazy" className="w-20 h-20 object-cover flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                  <h4 className="font-serif text-lg text-ink-900 leading-tight truncate">{r.name}</h4>
                                  <span className="font-serif italic text-clay-600 whitespace-nowrap text-base">€{Math.round(r.price_per_night)}</span>
                                </div>
                                <p className="flex items-center gap-1 text-ink-500 text-[11px] uppercase tracking-[0.18em] mt-0.5">
                                  <Users size={11} /> {r.capacity} {t.hotels.capacity} · {t.hotels.per_night}
                                </p>
                                {r.description && <p className="text-ink-500 text-xs mt-1 line-clamp-2">{r.description}</p>}
                                <button
                                  data-testid={`book-${r.id}`}
                                  onClick={() => setBooking({ hotel: h, room: r })}
                                  className="mt-2 btn-primary px-4 py-2 text-[11px] tracking-[0.22em] uppercase"
                                >
                                  {t.hotels.book}
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-ink-500 text-sm italic">{t.hotels.no_rooms}</p>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="border border-cream-50/20 bg-ink-900/45 backdrop-blur-sm p-8 text-cream-50/80">
            {t.hotels.no_rooms}
          </div>
        )}
      </div>

      {booking && (
        <BookingModal hotel={booking.hotel} room={booking.room} onClose={() => setBooking(null)} />
      )}
    </section>
  );
}
