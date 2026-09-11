import { LangProvider } from "./lib/i18n";
import { Toaster } from "./components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProtected from "./pages/admin/AdminProtected";

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminProtected>
                <AdminDashboard />
              </AdminProtected>
            }
          />
        </Routes>
        <Toaster position="bottom-left" richColors />
      </BrowserRouter>
    </LangProvider>
  );
}
