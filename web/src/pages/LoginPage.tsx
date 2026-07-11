// src/pages/LoginPage.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, saveUser, UserRole } from "../services/auth";

const ROLES: Array<{ id: UserRole; icon: string; label: string; sub: string }> = [
  { id: "doctor", icon: "", label: "Medical Doctor", sub: "Clinical care and referrals" },
  { id: "supervisor", icon: "", label: "Ministry of Health", sub: "Policy & national analytics" },
  { id: "chw", icon: "", label: "Community Health Worker", sub: "Field screening and outreach" },
  { id: "nurse", icon: "", label: "Nurse", sub: "Maternal and neonatal care" },
  { id: "admin", icon: "", label: "Hospital Admin", sub: "Facility management" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("doctor");
  const [email, setEmail] = useState("demo@ihealthconnect.com");
  const [password, setPassword] = useState("DemoPass123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      console.log('🔄 Attempting login...');
      const user = await login(email, password);
      console.log('✅ Login successful:', user);
      
      // Save user with selected role
      const userWithRole = { ...user, role };
      saveUser(userWithRole);
      
      console.log('🔄 Redirecting to dashboard...');
      // Force navigation
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.message ?? "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "16px 20px",
    border: "2px solid #E2E8F0", borderRadius: 12,
    fontSize: 16, color: "#0F172A", background: "#FFFFFF",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", display: "flex", flexDirection: "column" }}>
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "32px 96px",
        background: "#E1F5EE",
        color: "#0F172A",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 28, fontWeight: 700 }}>I‑HealthConnect</span>
        </div>
        <nav style={{ display: "flex", gap: 40, fontSize: 20 }}>
          <a href="#care" style={{ color: "#0F172A", textDecoration: "none" }}>Care & services ▼</a>
          <a href="#news" style={{ color: "#0F172A", textDecoration: "none" }}>News & blog ▼</a>
        </nav>
        <button
          onClick={() => navigate("/signup")}
          style={{
            background: "#93C5FD",
            color: "#0F172A",
            fontWeight: 700,
            border: "none",
            borderRadius: 10,
            padding: "12px 28px",
            cursor: "pointer",
            fontSize: 18,
          }}
        >
          Sign up
        </button>
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px" }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", marginBottom: 16, textAlign: "center" }}>
          Early detection. Every pregnancy. Everywhere.
        </h1>
        <p style={{ fontSize: 18, color: "#475569", marginBottom: 56, textAlign: "center" }}>
          AI‑powered congenital anomaly screening for Rwanda's frontline health network.
        </p>

        <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 1300, background: "#FFFFFF", padding: "60px 48px", borderRadius: 24, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 48, color: "#0F172A", textAlign: "center" }}>Sign in</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 32, marginBottom: 56 }}>
            {ROLES.map((r, index) => {
              const alignment = index % 3;
              let justifyValue = "flex-start";
              if (alignment === 1) justifyValue = "center";
              if (alignment === 2) justifyValue = "flex-end";

              return (
                <div key={r.id} style={{ display: "flex", justifyContent: justifyValue, width: "100%" }}>
                  <div
                    onClick={() => setRole(r.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 32,
                      width: "100%",
                      maxWidth: "750px",
                      border: `3px solid ${role === r.id ? "#1D9E75" : "#E2E8F0"}`,
                      borderRadius: 16,
                      padding: "36px 40px",
                      cursor: "pointer",
                      background: role === r.id ? "#E1F5EE" : "#FFFFFF",
                      boxShadow: role === r.id ? "0 10px 20px rgba(29, 158, 117, 0.12)" : "0 4px 6px rgba(0,0,0,0.01)",
                      transition: "all 0.25s ease-in-out"
                    }}>
                    <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: role === r.id ? "#085041" : "#0F172A" }}>{r.label}</div>
                      <div style={{ fontSize: 16, color: role === r.id ? "#0F6E56" : "#64748B", marginTop: 6, lineHeight: 1.4 }}>{r.sub}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ maxWidth: 650, margin: "0 auto" }}>
            <input
              style={{ ...inp, marginBottom: 20 }}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@moh.rw.gov"
              required
            />

            <input
              style={{ ...inp, marginBottom: 32 }}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && (
              <div style={{ background: "#FCEBEB", color: "#791F1F", fontSize: 14,
                padding: "14px 18px", borderRadius: 12, marginBottom: 20 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "18px",
                background: "#1D9E75",
                border: "none",
                borderRadius: 12,
                color: "#E1F5EE",
                fontSize: 18,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </div>
        </form>
      </main>

      <footer style={{
        background: "#E1F5EE",
        color: "#0F172A",
        padding: "72px 96px",
        display: "flex",
        justifyContent: "space-around",
        flexWrap: "wrap",
        gap: 40
      }}>
        <div style={{ fontSize: 16 }}><strong>E‑mail:</strong> ishimwechris765@gmail.com</div>
        <div style={{ fontSize: 16 }}><strong>LinkedIn:</strong> Christian Ishimwe</div>
        <div style={{ fontSize: 16 }}><strong>Tel:</strong> +250 787 563 648</div>
        <div style={{ fontSize: 16 }}><strong>GitHub:</strong> ChristianIshimwe7</div>
      </footer>
    </div>
  );
}
