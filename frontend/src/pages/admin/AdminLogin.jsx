import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { adminLogin, adminTwoFASetup, adminTwoFAVerify, setAdminToken } from "../../lib/api";
import { useLang } from "../../lib/i18n";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import { Loader2, Lock, ShieldCheck, ArrowLeft, Languages } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useLang();
  const A = t.admin;

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreds = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { temp_token, requires_2fa_setup } = await adminLogin(email, password);
      setTempToken(temp_token);
      if (requires_2fa_setup) {
        const setup = await adminTwoFASetup(temp_token);
        setSetupData(setup);
        setStep(3);
      } else {
        setStep(2);
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || A.login_failed);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { access_token } = await adminTwoFAVerify(tempToken, code.trim());
      setAdminToken(access_token);
      toast.success(A.welcome_toast);
      navigate("/admin");
    } catch (err) {
      toast.error(err?.response?.data?.detail || A.invalid_code);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100 px-4 py-12">
      <div className="w-full max-w-md bg-cream-50 border border-ink-900/10 shadow-xl">
        <div className="p-8 lg:p-10 border-b border-ink-900/10">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-ink-500 text-xs uppercase tracking-[0.22em] hover:text-clay-500" data-testid="back-home">
              <ArrowLeft size={14} /> Reem Travel
            </Link>
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.22em] border border-ink-900/15 rounded-full">
              <Languages size={11} className="ml-2 text-ink-500" />
              {["en", "tr", "ar"].map((l) => (
                <button
                  key={l}
                  data-testid={`login-lang-${l}`}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 ${lang === l ? "bg-clay-500 text-cream-50 rounded-full" : "text-ink-700"}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <span className="w-9 h-9 rounded-full bg-clay-500 text-cream-50 flex items-center justify-center">
              {step === 1 ? <Lock size={16} /> : <ShieldCheck size={16} />}
            </span>
            <h1 className="font-serif text-3xl text-ink-900">
              {step === 1 ? A.login_title : step === 2 ? A.twofa_title : A.twofa_setup_title}
            </h1>
          </div>
          <p className="text-ink-500 text-sm">
            {step === 1 && A.login_subtitle}
            {step === 2 && A.twofa_subtitle}
            {step === 3 && A.twofa_setup_subtitle}
          </p>
        </div>

        <div className="p-8 lg:p-10">
          {step === 1 && (
            <form onSubmit={handleCreds} className="space-y-5" data-testid="admin-login-form">
              <Field label={A.email}>
                <Input data-testid="admin-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="editorial-input" autoFocus />
              </Field>
              <Field label={A.password}>
                <Input data-testid="admin-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="editorial-input" />
              </Field>
              <button data-testid="admin-login-submit" disabled={loading} type="submit" className="btn-primary w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 text-xs tracking-[0.22em] uppercase disabled:opacity-60">
                {loading && <Loader2 size={14} className="animate-spin" />}
                {A.continue}
              </button>
            </form>
          )}

          {(step === 2 || step === 3) && (
            <form onSubmit={handleVerify} className="space-y-5" data-testid="admin-2fa-form">
              {step === 3 && setupData && (
                <div className="space-y-3 mb-4">
                  <div className="border border-ink-900/10 p-4 bg-cream-100 flex items-center justify-center">
                    <img src={setupData.qr_data_uri} alt="2FA QR code" className="w-48 h-48" data-testid="totp-qr" />
                  </div>
                  <div className="text-xs text-ink-500 text-center">
                    {A.secret_manual}
                    <code className="block mt-2 px-3 py-2 bg-cream-100 border border-ink-900/10 font-mono text-ink-900 break-all" data-testid="totp-secret">
                      {setupData.secret}
                    </code>
                  </div>
                </div>
              )}
              <Field label={A.code}>
                <Input
                  data-testid="admin-2fa-code"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="editorial-input font-mono tracking-[0.5em] text-xl text-center"
                  placeholder="000000"
                  autoFocus
                />
              </Field>
              <button data-testid="admin-2fa-submit" disabled={loading || code.length < 6} type="submit" className="btn-primary w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 text-xs tracking-[0.22em] uppercase disabled:opacity-60">
                {loading && <Loader2 size={14} className="animate-spin" />}
                {A.verify}
              </button>
            </form>
          )}
        </div>
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
