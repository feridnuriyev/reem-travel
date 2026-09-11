import { useEffect, useState } from "react";
import { useLang } from "../../lib/i18n";
import { createBooking } from "../../lib/api";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";

export default function BookingModal({ hotel, room, onClose }) {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    whatsapp_same: true,
    whatsapp_phone: "",
    email: "",
    check_in: "",
    check_out: "",
    guests: room?.capacity || 2,
    notes: "",
  });

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        guests: Number(form.guests) || 1,
        email: form.email || undefined,
        whatsapp_phone: form.whatsapp_same ? form.phone : (form.whatsapp_phone || form.phone),
        hotel_id: hotel.id,
        hotel_name: hotel.name,
        room_id: room?.id,
        room_name: room?.name,
      };
      await createBooking(payload);
      toast.success(t.booking.success);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(t.booking.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="booking-modal"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink-900/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-cream-50 w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-ink-900/10 shadow-2xl">
        <button
          data-testid="booking-close"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center bg-ink-900 text-cream-50 hover:bg-clay-500 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="p-8 lg:p-10 border-b border-ink-900/10">
          <p className="text-clay-500 uppercase tracking-[0.22em] text-[10px] mb-3">{t.booking.title}</p>
          <h3 className="font-serif text-3xl text-ink-900 leading-tight">{hotel.name}</h3>
          {room && (
            <p className="text-ink-500 mt-1">
              {room.name} · <span className="font-serif italic text-clay-600">€{Math.round(room.price_per_night)}</span> / {t.hotels.per_night}
            </p>
          )}
          <p className="text-ink-500 text-sm mt-3 leading-relaxed">{t.booking.subtitle}</p>
        </div>

        <form onSubmit={onSubmit} className="p-8 lg:p-10 space-y-5" data-testid="booking-form">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label={t.booking.first_name}>
              <Input data-testid="b-first" required value={form.first_name} onChange={(e) => update("first_name", e.target.value)} className="editorial-input" />
            </Field>
            <Field label={t.booking.last_name}>
              <Input data-testid="b-last" required value={form.last_name} onChange={(e) => update("last_name", e.target.value)} className="editorial-input" />
            </Field>
            <Field label={t.booking.phone}>
              <Input data-testid="b-phone" required type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="editorial-input" placeholder="+90 ..." />
            </Field>
            <Field label={t.booking.email}>
              <Input data-testid="b-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="editorial-input" />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              data-testid="b-wa-same"
              type="checkbox"
              checked={form.whatsapp_same}
              onChange={(e) => update("whatsapp_same", e.target.checked)}
              className="w-4 h-4 accent-clay-500"
            />
            {t.booking.whatsapp_same}
          </label>

          {!form.whatsapp_same && (
            <Field label={t.booking.whatsapp_phone}>
              <Input data-testid="b-wa-phone" type="tel" value={form.whatsapp_phone} onChange={(e) => update("whatsapp_phone", e.target.value)} className="editorial-input" placeholder="+90 ..." />
            </Field>
          )}

          <div className="grid sm:grid-cols-3 gap-5">
            <Field label={t.booking.check_in}>
              <Input data-testid="b-checkin" type="date" required value={form.check_in} onChange={(e) => update("check_in", e.target.value)} className="editorial-input" />
            </Field>
            <Field label={t.booking.check_out}>
              <Input data-testid="b-checkout" type="date" required value={form.check_out} onChange={(e) => update("check_out", e.target.value)} className="editorial-input" />
            </Field>
            <Field label={t.booking.guests}>
              <Input data-testid="b-guests" type="number" min={1} max={20} value={form.guests} onChange={(e) => update("guests", e.target.value)} className="editorial-input" />
            </Field>
          </div>

          <Field label={t.booking.notes}>
            <Textarea data-testid="b-notes" rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} className="editorial-input resize-none" />
          </Field>

          <div className="flex items-center gap-3 pt-4">
            <button type="submit" disabled={loading} data-testid="booking-submit" className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 text-xs tracking-[0.22em] uppercase disabled:opacity-60">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {loading ? t.booking.sending : t.booking.submit}
            </button>
            <button type="button" onClick={onClose} className="px-7 py-3.5 text-xs tracking-[0.22em] uppercase text-ink-700 hover:text-ink-900" data-testid="booking-cancel">
              {t.booking.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.28em] text-ink-500 mb-2">{label}</span>
      {children}
    </label>
  );
}
