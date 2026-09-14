import { useEffect, useState } from "react";
import { useLang } from "../../lib/i18n";
import { listReviews, createReview } from "../../lib/api";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { Quote, Star, Loader2 } from "lucide-react";

export default function Reviews() {
  const { t } = useLang();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", country: "", rating: 5, text: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    listReviews()
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createReview(form);
      toast.success(t.reviews_pub.success);
      setForm({ name: "", country: "", rating: 5, text: "" });
      setShowForm(false);
    } catch (err) {
      toast.error("Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reviews" data-testid="reviews-section" className="py-24 lg:py-32 bg-cream-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-14">
          <div className="max-w-2xl">
            <p className="text-clay-500 uppercase tracking-[0.28em] text-xs mb-4">{t.reviews_pub.label}</p>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-ink-900 leading-[1.05] font-light tracking-tight">
              {t.reviews_pub.title}
            </h2>
          </div>
          <button data-testid="add-review-toggle" onClick={() => setShowForm((v) => !v)} className="btn-ghost-dark px-6 py-3 text-xs tracking-[0.22em] uppercase">
            {t.reviews_pub.cta}
          </button>
        </div>

        {showForm && (
          <form onSubmit={submit} data-testid="review-form" className="bg-cream-50 p-8 lg:p-10 border border-ink-900/10 mb-12 max-w-3xl">
            <h3 className="font-serif text-2xl text-ink-900 mb-2">{t.reviews_pub.add_title}</h3>
            <p className="text-ink-500 text-sm mb-6">{t.reviews_pub.add_subtitle}</p>
            <div className="grid sm:grid-cols-2 gap-5 mb-5">
              <Field label={t.reviews_pub.name}>
                <Input data-testid="rev-name" required value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} className="editorial-input" />
              </Field>
              <Field label={t.reviews_pub.country}>
                <Input data-testid="rev-country" value={form.country} onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))} className="editorial-input" />
              </Field>
            </div>
            <div className="mb-5">
              <span className="block text-[10px] uppercase tracking-[0.28em] text-ink-500 mb-2">{t.reviews_pub.rating}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" data-testid={`rev-star-${n}`} onClick={() => setForm((s) => ({ ...s, rating: n }))} className="p-1">
                    <Star size={26} fill={n <= form.rating ? "#A97142" : "transparent"} stroke={n <= form.rating ? "#A97142" : "#A8A29E"} strokeWidth={1.5} />
                  </button>
                ))}
              </div>
            </div>
            <Field label={t.reviews_pub.text}>
              <Textarea data-testid="rev-text" rows={4} required value={form.text} onChange={(e) => setForm((s) => ({ ...s, text: e.target.value }))} className="editorial-input resize-none" />
            </Field>
            <button type="submit" disabled={submitting} data-testid="rev-submit" className="mt-6 btn-primary inline-flex items-center gap-2 px-7 py-3.5 text-xs tracking-[0.22em] uppercase disabled:opacity-60">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {t.reviews_pub.submit}
            </button>
          </form>
        )}

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[5/4] bg-cream-100 animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-ink-500 italic" data-testid="reviews-empty">{t.reviews_pub.pending}</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {reviews.map((r) => (
              <figure key={r.id} data-testid={`review-${r.id}`} className="bg-cream-50 p-8 lg:p-10 border border-ink-900/8">
                <div className="flex items-center justify-between mb-5">
                  <Quote size={26} className="text-clay-400" strokeWidth={1.2} />
                  <div className="flex gap-0.5 text-clay-500">
                    {Array.from({ length: r.rating || 5 }).map((_, k) => (
                      <Star key={k} size={12} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                </div>
                <blockquote className="font-serif text-lg lg:text-xl text-ink-900 leading-snug font-light">"{r.text}"</blockquote>
                <figcaption className="mt-6 pt-5 border-t border-ink-900/10">
                  <div className="font-medium text-ink-900">{r.name}</div>
                  {r.country && <div className="text-ink-500 text-xs uppercase tracking-[0.22em] mt-1">{r.country}</div>}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
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
