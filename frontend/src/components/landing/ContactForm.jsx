import { useState } from "react";
import { useLang } from "../../lib/i18n";
import { submitInquiry } from "../../lib/api";
import { WHATSAPP_NUMBER, COMPANY_EMAIL, PHONE_DISPLAY, WHATSAPP_DISPLAY } from "../../lib/constants";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner";
import { Send, MessageCircle, Mail, Phone, Loader2 } from "lucide-react";

export default function ContactForm() {
  const { t, lang } = useLang();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    travel_dates: "",
    travelers: "",
    message: "",
  });

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitInquiry({ ...form, language: lang });
      toast.success(t.contact.success);
      setForm({ name: "", email: "", phone: "", service: "", travel_dates: "", travelers: "", message: "" });
    } catch (err) {
      console.error(err);
      toast.error(t.contact.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" data-testid="contact-section" className="py-24 lg:py-32 bg-cream-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="text-clay-500 uppercase tracking-[0.28em] text-xs mb-4">{t.contact.label}</p>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-ink-900 leading-[1.05] font-light tracking-tight mb-6">
            {t.contact.title}
          </h2>
          <p className="text-ink-500 leading-relaxed mb-12">{t.contact.subtitle}</p>

          <div className="space-y-6 border-t border-ink-900/10 pt-8">
            <p className="text-clay-500 uppercase tracking-[0.22em] text-xs">{t.contact.or}</p>
            <a
              data-testid="contact-whatsapp"
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 group"
            >
              <span className="w-10 h-10 flex items-center justify-center bg-whatsapp text-cream-50 rounded-full">
                <MessageCircle size={18} />
              </span>
              <div>
                <div className="font-serif text-xl text-ink-900 group-hover:text-clay-500 transition-colors">{t.contact.whatsapp}</div>
                <div className="text-ink-500 text-sm">{WHATSAPP_DISPLAY}</div>
              </div>
            </a>
            <a href={`tel:${PHONE_DISPLAY}`} className="flex items-center gap-4 group" data-testid="contact-phone">
              <span className="w-10 h-10 flex items-center justify-center bg-ink-900 text-cream-50 rounded-full">
                <Phone size={16} />
              </span>
              <div>
                <div className="font-serif text-xl text-ink-900 group-hover:text-clay-500 transition-colors">Phone</div>
                <div className="text-ink-500 text-sm">{PHONE_DISPLAY}</div>
              </div>
            </a>
            <a href={`mailto:${COMPANY_EMAIL}`} className="flex items-center gap-4 group" data-testid="contact-email">
              <span className="w-10 h-10 flex items-center justify-center bg-clay-500 text-cream-50 rounded-full">
                <Mail size={16} />
              </span>
              <div>
                <div className="font-serif text-xl text-ink-900 group-hover:text-clay-500 transition-colors">Email</div>
                <div className="text-ink-500 text-sm">{COMPANY_EMAIL}</div>
              </div>
            </a>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          data-testid="inquiry-form"
          className="lg:col-span-7 bg-cream-100 p-8 lg:p-12 border border-ink-900/8 space-y-6"
        >
          <div className="grid sm:grid-cols-2 gap-6">
            <Field label={t.contact.name}>
              <Input
                data-testid="input-name"
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="editorial-input"
                placeholder=""
              />
            </Field>
            <Field label={t.contact.email}>
              <Input
                data-testid="input-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="editorial-input"
              />
            </Field>
            <Field label={t.contact.phone}>
              <Input
                data-testid="input-phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="editorial-input"
              />
            </Field>
            <Field label={t.contact.service}>
              <Select value={form.service} onValueChange={(v) => update("service", v)}>
                <SelectTrigger data-testid="input-service" className="editorial-input h-auto !rounded-none !shadow-none focus:!ring-0">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {t.contact.service_options.map((opt) => (
                    <SelectItem key={opt} value={opt} data-testid={`service-option-${opt}`}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t.contact.dates}>
              <Input
                data-testid="input-dates"
                value={form.travel_dates}
                onChange={(e) => update("travel_dates", e.target.value)}
                className="editorial-input"
                placeholder=""
              />
            </Field>
            <Field label={t.contact.travelers}>
              <Input
                data-testid="input-travelers"
                value={form.travelers}
                onChange={(e) => update("travelers", e.target.value)}
                className="editorial-input"
              />
            </Field>
          </div>
          <Field label={t.contact.message}>
            <Textarea
              data-testid="input-message"
              required
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              rows={5}
              className="editorial-input resize-none"
            />
          </Field>

          <button
            type="submit"
            disabled={loading}
            data-testid="submit-inquiry"
            className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-xs tracking-[0.22em] uppercase disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
            {loading ? t.contact.sending : t.contact.submit}
          </button>
        </form>
      </div>
    </section>
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
