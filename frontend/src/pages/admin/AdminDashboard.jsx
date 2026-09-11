import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  adminStats,
  adminListBookings,
  adminListInquiries,
  adminListReviews,
  adminApproveReview,
  adminDeleteReview,
  adminUpdateBooking,
  listHotels,
  adminDeleteHotel,
  adminCreateHotel,
  adminAddRoom,
  adminDeleteRoom,
  setAdminToken,
} from "../../lib/api";
import { LOGO_MARK } from "../../lib/constants";
import { useLang } from "../../lib/i18n";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import { LogOut, Building2, MessageSquare, CalendarCheck, Star, Trash2, Check, Plus, Loader2, Languages } from "lucide-react";

export default function AdminDashboard() {
  const nav = useNavigate();
  const { t, lang, setLang } = useLang();
  const A = t.admin;
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);

  const TABS = [
    { id: "overview", label: A.tabs.overview },
    { id: "hotels", label: A.tabs.hotels },
    { id: "bookings", label: A.tabs.bookings },
    { id: "reviews", label: A.tabs.reviews },
    { id: "inquiries", label: A.tabs.inquiries },
  ];

  useEffect(() => {
    adminStats().then(setStats).catch(() => {});
  }, [tab]);

  const logout = () => {
    setAdminToken(null);
    nav("/admin/login");
  };

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col lg:flex-row">
      <aside className="lg:w-64 bg-ink-900 text-cream-50 p-6 lg:min-h-screen flex flex-col" data-testid="admin-sidebar">
        <Link to="/" className="flex items-center gap-3 mb-8 group" data-testid="admin-home">
          <div className="w-10 h-10 rounded-full bg-ink-900 ring-1 ring-cream-50/30 overflow-hidden">
            <img src={LOGO_MARK} alt="Reem Group" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="font-serif text-xl">{A.home}</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-cream-50/60">{A.role}</div>
          </div>
        </Link>

        {/* Admin language switcher */}
        <div className="mb-6 flex items-center gap-2 text-cream-50/60 text-[10px] uppercase tracking-[0.22em]">
          <Languages size={12} />
          <div className="flex border border-cream-50/15 rounded-full overflow-hidden">
            {["en", "tr", "ar"].map((l) => (
              <button
                key={l}
                data-testid={`admin-lang-${l}`}
                onClick={() => setLang(l)}
                className={`px-3 py-1 ${lang === l ? "bg-clay-500 text-cream-50" : "text-cream-50/70 hover:text-cream-50"}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
          {TABS.map((tt) => (
            <button
              key={tt.id}
              data-testid={`admin-tab-${tt.id}`}
              onClick={() => setTab(tt.id)}
              className={`text-left px-4 py-2.5 text-sm tracking-wide whitespace-nowrap transition-colors ${
                tab === tt.id ? "bg-clay-500 text-cream-50" : "text-cream-50/70 hover:bg-cream-50/5"
              }`}
            >
              {tt.label}
            </button>
          ))}
        </nav>

        <button data-testid="admin-logout" onClick={logout} className="mt-auto flex items-center gap-2 text-cream-50/70 hover:text-cream-50 text-sm py-3 px-4 border-t border-cream-50/10 mt-6">
          <LogOut size={14} /> {A.logout}
        </button>
      </aside>

      <main className="flex-1 p-6 lg:p-12">
        {tab === "overview" && <Overview stats={stats} A={A} />}
        {tab === "hotels" && <HotelsTab A={A} />}
        {tab === "bookings" && <BookingsTab A={A} />}
        {tab === "reviews" && <ReviewsTab A={A} />}
        {tab === "inquiries" && <InquiriesTab A={A} />}
      </main>
    </div>
  );
}

// ---------- Overview ----------
function Overview({ stats, A }) {
  const cards = [
    { k: "hotels", label: A.stats.hotels, icon: Building2 },
    { k: "bookings", label: A.stats.bookings, icon: CalendarCheck },
    { k: "bookings_pending", label: A.stats.bookings_pending, icon: Loader2 },
    { k: "reviews_pending", label: A.stats.reviews_pending, icon: Star },
    { k: "inquiries", label: A.stats.inquiries, icon: MessageSquare },
    { k: "reviews_total", label: A.stats.reviews_total, icon: Star },
  ];
  return (
    <div data-testid="admin-overview">
      <h1 className="font-serif text-4xl text-ink-900 mb-8">{A.welcome}</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map(({ k, label, icon: Icon }) => (
          <div key={k} className="bg-cream-50 border border-ink-900/10 p-6">
            <div className="flex items-start justify-between mb-4">
              <span className="text-ink-500 text-xs uppercase tracking-[0.22em]">{label}</span>
              <Icon size={18} className="text-clay-500" />
            </div>
            <div className="font-serif text-5xl text-ink-900" data-testid={`stat-${k}`}>{stats ? (stats[k] ?? 0) : "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Hotels ----------
function HotelsTab({ A }) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedHotel, setExpandedHotel] = useState(null);

  const load = () => {
    setLoading(true);
    listHotels().then(setHotels).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onDelete = async (id) => {
    if (!window.confirm(A.delete_hotel_confirm)) return;
    try {
      await adminDeleteHotel(id);
      toast.success("OK");
      load();
    } catch {
      toast.error("Error");
    }
  };

  return (
    <div data-testid="admin-hotels">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-serif text-4xl text-ink-900">{A.tabs.hotels}</h1>
        <button data-testid="admin-create-hotel-toggle" onClick={() => setShowCreate((v) => !v)} className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs tracking-[0.22em] uppercase">
          <Plus size={14} /> {A.new_hotel}
        </button>
      </div>

      {showCreate && <NewHotelForm A={A} onCreated={() => { setShowCreate(false); load(); }} />}

      {loading ? (
        <div className="text-ink-500">{A.loading}</div>
      ) : (
        <div className="space-y-4">
          {hotels.map((h) => (
            <div key={h.id} className="bg-cream-50 border border-ink-900/10" data-testid={`admin-hotel-${h.id}`}>
              <div className="p-5 flex items-center gap-5">
                <img src={h.cover_image} alt={h.name} className="w-20 h-20 object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-xl text-ink-900 leading-tight">{h.name}</h3>
                  <p className="text-ink-500 text-xs uppercase tracking-[0.18em] mt-1">{h.region || h.city} · €{Math.round(h.starting_price || 0)}+ · {h.rooms?.length || 0} {A.rooms.toLowerCase()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setExpandedHotel(expandedHotel === h.id ? null : h.id)} className="px-3 py-2 text-xs uppercase tracking-[0.22em] border border-ink-900/15 hover:border-ink-900">
                    {expandedHotel === h.id ? A.close : A.rooms}
                  </button>
                  <button data-testid={`admin-hotel-delete-${h.id}`} onClick={() => onDelete(h.id)} className="px-3 py-2 text-xs uppercase tracking-[0.22em] border border-red-300 text-red-600 hover:bg-red-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {expandedHotel === h.id && <RoomsManager A={A} hotel={h} onChange={load} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewHotelForm({ A, onCreated }) {
  const [form, setForm] = useState({
    name: "", city: "", region: "", stars: 5, description: "",
    cover_image: "", starting_price: 200, featured: false, amenities: "",
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminCreateHotel({
        ...form,
        stars: Number(form.stars),
        starting_price: Number(form.starting_price),
        amenities: form.amenities.split(",").map((s) => s.trim()).filter(Boolean),
        gallery: [],
        rooms: [],
      });
      toast.success("OK");
      onCreated();
    } catch {
      toast.error("Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-cream-50 border border-ink-900/10 p-6 mb-6 space-y-4" data-testid="admin-new-hotel-form">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input data-testid="nh-name" required placeholder={A.hotel_name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="editorial-input" />
        <Input data-testid="nh-city" required placeholder={A.city} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="editorial-input" />
        <Input data-testid="nh-region" placeholder={A.region} value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="editorial-input" />
        <Input data-testid="nh-stars" type="number" min={1} max={5} placeholder={A.stars} value={form.stars} onChange={(e) => setForm({ ...form, stars: e.target.value })} className="editorial-input" />
        <Input data-testid="nh-cover" required placeholder={A.cover_image} value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} className="editorial-input" />
        <Input data-testid="nh-price" type="number" min={0} placeholder={A.starting_price} value={form.starting_price} onChange={(e) => setForm({ ...form, starting_price: e.target.value })} className="editorial-input" />
      </div>
      <Textarea data-testid="nh-desc" placeholder={A.description} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="editorial-input resize-none" />
      <Input data-testid="nh-amenities" placeholder={A.amenities} value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} className="editorial-input" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-clay-500" />
        {A.featured}
      </label>
      <button disabled={busy} type="submit" data-testid="nh-submit" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs tracking-[0.22em] uppercase disabled:opacity-60">
        {busy && <Loader2 size={14} className="animate-spin" />} {A.create_hotel}
      </button>
    </form>
  );
}

function RoomsManager({ A, hotel, onChange }) {
  const [adding, setAdding] = useState(false);
  const [room, setRoom] = useState({ name: "", description: "", capacity: 2, price_per_night: 200, amenities: "", image: "" });
  const [busy, setBusy] = useState(false);

  const addRoom = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminAddRoom(hotel.id, {
        name: room.name,
        description: room.description,
        capacity: Number(room.capacity),
        price_per_night: Number(room.price_per_night),
        currency: "EUR",
        amenities: room.amenities.split(",").map((s) => s.trim()).filter(Boolean),
        images: room.image ? [room.image] : [],
      });
      toast.success("OK");
      setAdding(false);
      setRoom({ name: "", description: "", capacity: 2, price_per_night: 200, amenities: "", image: "" });
      onChange();
    } catch {
      toast.error("Error");
    } finally {
      setBusy(false);
    }
  };

  const delRoom = async (rid) => {
    if (!window.confirm(A.delete_room_confirm)) return;
    await adminDeleteRoom(hotel.id, rid);
    toast.success("OK");
    onChange();
  };

  return (
    <div className="border-t border-ink-900/10 bg-cream-100 p-5 space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-serif text-lg text-ink-900">{A.rooms}</h4>
        <button onClick={() => setAdding((v) => !v)} className="text-xs uppercase tracking-[0.22em] text-clay-500 hover:text-clay-600">
          {adding ? A.cancel : A.add_room}
        </button>
      </div>
      {adding && (
        <form onSubmit={addRoom} className="grid sm:grid-cols-2 gap-3 bg-cream-50 p-4 border border-ink-900/10" data-testid="add-room-form">
          <Input required placeholder={A.room_name} value={room.name} onChange={(e) => setRoom({ ...room, name: e.target.value })} className="editorial-input" data-testid="ar-name" />
          <Input type="number" min={1} max={20} placeholder={A.capacity} value={room.capacity} onChange={(e) => setRoom({ ...room, capacity: e.target.value })} className="editorial-input" data-testid="ar-capacity" />
          <Input required type="number" min={0} placeholder={A.price_per_night} value={room.price_per_night} onChange={(e) => setRoom({ ...room, price_per_night: e.target.value })} className="editorial-input" data-testid="ar-price" />
          <Input placeholder={A.image_url} value={room.image} onChange={(e) => setRoom({ ...room, image: e.target.value })} className="editorial-input" data-testid="ar-image" />
          <Textarea placeholder={A.description} rows={2} value={room.description} onChange={(e) => setRoom({ ...room, description: e.target.value })} className="editorial-input resize-none sm:col-span-2" />
          <Input placeholder={A.amenities} value={room.amenities} onChange={(e) => setRoom({ ...room, amenities: e.target.value })} className="editorial-input sm:col-span-2" />
          <button type="submit" disabled={busy} className="btn-primary px-5 py-2 text-xs tracking-[0.22em] uppercase sm:col-span-2 disabled:opacity-60" data-testid="ar-submit">
            {busy ? A.saving : A.add}
          </button>
        </form>
      )}
      {hotel.rooms?.map((r) => (
        <div key={r.id} className="flex items-center gap-4 bg-cream-50 p-3 border border-ink-900/10" data-testid={`admin-room-${r.id}`}>
          {r.images?.[0] && <img src={r.images[0]} alt={r.name} className="w-14 h-14 object-cover" />}
          <div className="flex-1">
            <div className="font-serif text-base text-ink-900">{r.name}</div>
            <div className="text-ink-500 text-xs">€{Math.round(r.price_per_night)} · {r.capacity}</div>
          </div>
          <button onClick={() => delRoom(r.id)} className="text-red-600 hover:bg-red-50 p-2" data-testid={`admin-room-delete-${r.id}`}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------- Bookings ----------
function BookingsTab({ A }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); adminListBookings().then(setItems).finally(() => setLoading(false)); };
  useEffect(load, []);

  const setStatus = async (id, status) => {
    await adminUpdateBooking(id, { status });
    toast.success("OK");
    load();
  };

  const statusLabel = (s) =>
    s === "confirmed" ? A.booking_status_confirmed : s === "cancelled" ? A.booking_status_cancelled : A.booking_status_pending;

  return (
    <div data-testid="admin-bookings">
      <h1 className="font-serif text-4xl text-ink-900 mb-8">{A.tabs.bookings}</h1>
      {loading ? <div className="text-ink-500">{A.loading}</div> : items.length === 0 ? <p className="text-ink-500 italic">{A.no_bookings}</p> : (
        <div className="space-y-3">
          {items.map((b) => (
            <div key={b.id} className="bg-cream-50 border border-ink-900/10 p-5" data-testid={`admin-booking-${b.id}`}>
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <h3 className="font-serif text-xl text-ink-900">{b.first_name} {b.last_name}</h3>
                  <p className="text-ink-500 text-sm">{b.hotel_name} {b.room_name ? `· ${b.room_name}` : ""}</p>
                  <p className="text-ink-500 text-xs uppercase tracking-[0.18em] mt-2">{b.check_in} → {b.check_out} · {b.guests}</p>
                  <p className="text-ink-700 text-sm mt-2">
                    <a href={`tel:${b.phone}`} className="hover:text-clay-500">{b.phone}</a> ·{" "}
                    <a href={`https://wa.me/${(b.whatsapp_phone || b.phone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="hover:text-clay-500">WhatsApp</a>
                    {b.email && <> · <a href={`mailto:${b.email}`} className="hover:text-clay-500">{b.email}</a></>}
                  </p>
                  {b.notes && <p className="text-ink-500 text-sm mt-2 italic">"{b.notes}"</p>}
                </div>
                <div className="flex flex-col gap-2 min-w-[180px]">
                  <span className={`text-xs uppercase tracking-[0.22em] px-3 py-1 self-end ${b.status === "confirmed" ? "bg-green-100 text-green-700" : b.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {statusLabel(b.status)}
                  </span>
                  <div className="flex gap-2 justify-end">
                    {b.status !== "confirmed" && <button onClick={() => setStatus(b.id, "confirmed")} className="text-xs uppercase tracking-[0.18em] px-3 py-1.5 border border-green-300 text-green-700 hover:bg-green-50" data-testid={`confirm-${b.id}`}>{A.confirm}</button>}
                    {b.status !== "cancelled" && <button onClick={() => setStatus(b.id, "cancelled")} className="text-xs uppercase tracking-[0.18em] px-3 py-1.5 border border-red-300 text-red-700 hover:bg-red-50" data-testid={`cancel-${b.id}`}>{A.cancel}</button>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Reviews ----------
function ReviewsTab({ A }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); adminListReviews(false).then(setItems).finally(() => setLoading(false)); };
  useEffect(load, []);

  const approve = async (id) => { await adminApproveReview(id); toast.success("OK"); load(); };
  const del = async (id) => { if (!window.confirm(A.delete_review_confirm)) return; await adminDeleteReview(id); toast.success("OK"); load(); };

  return (
    <div data-testid="admin-reviews">
      <h1 className="font-serif text-4xl text-ink-900 mb-8">{A.tabs.reviews}</h1>
      {loading ? <div className="text-ink-500">{A.loading}</div> : items.length === 0 ? <p className="text-ink-500 italic">{A.no_reviews}</p> : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className={`bg-cream-50 border p-5 ${r.approved ? "border-ink-900/10" : "border-amber-300"}`} data-testid={`admin-review-${r.id}`}>
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-serif text-lg text-ink-900">{r.name}</h3>
                    {r.country && <span className="text-ink-500 text-xs uppercase tracking-[0.18em]">{r.country}</span>}
                    <div className="flex gap-0.5 text-clay-500">
                      {Array.from({ length: r.rating || 5 }).map((_, k) => <Star key={k} size={12} fill="currentColor" strokeWidth={0} />)}
                    </div>
                    <span className={`text-[10px] uppercase tracking-[0.22em] px-2 py-0.5 ${r.approved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {r.approved ? A.approved : A.pending}
                    </span>
                  </div>
                  <p className="text-ink-700 leading-relaxed">"{r.text}"</p>
                </div>
                <div className="flex gap-2">
                  {!r.approved && <button onClick={() => approve(r.id)} className="text-xs uppercase tracking-[0.18em] px-3 py-1.5 border border-green-300 text-green-700 hover:bg-green-50 inline-flex items-center gap-1" data-testid={`approve-${r.id}`}><Check size={12} /> {A.approve}</button>}
                  <button onClick={() => del(r.id)} className="text-xs uppercase tracking-[0.18em] px-3 py-1.5 border border-red-300 text-red-700 hover:bg-red-50" data-testid={`delete-review-${r.id}`}><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Inquiries ----------
function InquiriesTab({ A }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { adminListInquiries().then(setItems).finally(() => setLoading(false)); }, []);

  return (
    <div data-testid="admin-inquiries">
      <h1 className="font-serif text-4xl text-ink-900 mb-2">{A.tabs.inquiries}</h1>
      <p className="text-ink-500 text-sm mb-8">{A.contact_requests_subtitle}</p>
      {loading ? <div className="text-ink-500">{A.loading}</div> : items.length === 0 ? <p className="text-ink-500 italic">{A.no_inquiries}</p> : (
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.id} className="bg-cream-50 border border-ink-900/10 p-5" data-testid={`admin-inquiry-${i.id}`}>
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <h3 className="font-serif text-lg text-ink-900">{i.name}</h3>
                <span className="text-ink-500 text-xs uppercase tracking-[0.18em]">{new Date(i.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-ink-500 text-sm mt-1">
                <a href={`mailto:${i.email}`} className="hover:text-clay-500">{i.email}</a>
                {i.phone && <> · {i.phone}</>}
                {i.service && <> · {i.service}</>}
              </p>
              {i.travel_dates && <p className="text-ink-500 text-xs mt-1">{i.travel_dates} · {i.travelers}</p>}
              <p className="text-ink-700 mt-3 leading-relaxed">{i.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
