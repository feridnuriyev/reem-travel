import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { adminMe, getAdminToken, setAdminToken } from "../../lib/api";

export default function AdminProtected({ children }) {
  const [state, setState] = useState({ status: "checking", admin: null });

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setState({ status: "anon", admin: null });
      return;
    }
    adminMe()
      .then((admin) => setState({ status: "auth", admin }))
      .catch(() => {
        setAdminToken(null);
        setState({ status: "anon", admin: null });
      });
  }, []);

  if (state.status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-ink-500 text-sm tracking-[0.22em] uppercase">Loading...</div>
      </div>
    );
  }
  if (state.status === "anon") return <Navigate to="/admin/login" replace />;

  return children;
}
