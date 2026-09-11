import { useLang } from "../../lib/i18n";
import { WHATSAPP_NUMBER } from "../../lib/constants";
import { MessageCircle } from "lucide-react";

export default function WhatsAppFloat() {
  const { t } = useLang();
  return (
    <a
      data-testid="whatsapp-float"
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noreferrer"
      aria-label={t.floating.whatsapp}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-whatsapp text-cream-50 pl-4 pr-5 py-3 rounded-full shadow-lg shadow-whatsapp/40 hover:bg-[#20BD5A] transition-all hover:scale-105"
    >
      <span className="relative flex w-3 h-3">
        <span className="absolute inset-0 rounded-full bg-cream-50 animate-ping opacity-60" />
        <span className="relative rounded-full bg-cream-50 w-3 h-3" />
      </span>
      <MessageCircle size={20} />
      <span className="hidden sm:inline text-sm font-medium tracking-wide">{t.floating.whatsapp}</span>
    </a>
  );
}
