import { useLang } from "../../lib/i18n";
import { IMAGES } from "../../lib/constants";

export default function Destinations() {
  const { t } = useLang();
  const imgs = [IMAGES.antalya, IMAGES.bodrum, IMAGES.marmaris, IMAGES.fethiye, IMAGES.kusadasi, IMAGES.cesme];

  return (
    <section id="destinations" data-testid="destinations-section" className="py-24 lg:py-32 bg-cream-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="mb-14 max-w-2xl">
          <p className="text-clay-500 uppercase tracking-[0.28em] text-xs mb-4">{t.destinations.label}</p>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-ink-900 leading-[1.05] font-light tracking-tight">
            {t.destinations.title}
          </h2>
        </div>

        <div className="grid grid-cols-6 grid-rows-[repeat(6,minmax(0,140px))] gap-3 lg:gap-4">
          <DestCard className="col-span-6 sm:col-span-4 row-span-3" idx={0} img={imgs[0]} name={t.destinations.items[0]} />
          <DestCard className="col-span-3 sm:col-span-2 row-span-2" idx={1} img={imgs[1]} name={t.destinations.items[1]} />
          <DestCard className="col-span-3 sm:col-span-2 row-span-2" idx={2} img={imgs[2]} name={t.destinations.items[2]} />
          <DestCard className="col-span-3 sm:col-span-2 row-span-3" idx={3} img={imgs[3]} name={t.destinations.items[3]} />
          <DestCard className="col-span-3 sm:col-span-2 row-span-3" idx={4} img={imgs[4]} name={t.destinations.items[4]} />
          <DestCard className="col-span-6 sm:col-span-2 row-span-3" idx={5} img={imgs[5]} name={t.destinations.items[5]} />
        </div>
      </div>
    </section>
  );
}

function DestCard({ className, idx, img, name }) {
  return (
    <div data-testid={`destination-${idx}`} className={`${className} relative overflow-hidden group cursor-pointer`}>
      <img src={img} alt={name} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/10 to-transparent" />
      <div className="absolute inset-0 p-5 flex flex-col justify-end">
        <p className="text-cream-50/70 text-[10px] uppercase tracking-[0.28em] mb-1">0{idx + 1}</p>
        <h3 className="font-serif text-2xl sm:text-3xl text-cream-50 leading-none">{name}</h3>
      </div>
    </div>
  );
}
