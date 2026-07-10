import React, { useState } from 'react';

export default function LoginPage() {
  const [email] = useState("demo@ihealthconnect.com");
  const [password] = useState("");
  const [loading] = useState(false);
  const [error] = useState("");

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "32px 96px", background: "#E1F5EE", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 28, fontWeight: 700 }}>I‑HealthConnect</span>
        </div>
        <nav style={{ display: "flex", gap: 40, fontSize: 20 }}>
          <a href="#care" style={{ color: "#0F172A", textDecoration: "none" }}>Care & services ▼</a>
          <a href="#news" style={{ color: "#0F172A", textDecoration: "none" }}>News & blog ▼</a>
        </nav>
        <button style={{ background: "#93C5FD", color: "#0F172A", fontWeight: 700, border: "none", borderRadius: 10, padding: "12px 28px", cursor: "pointer", fontSize: 18 }}>Sign up</button>
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px" }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", marginBottom: 16 }}>Early detection. Every pregnancy. Everywhere.</h1>
        <p style={{ fontSize: 18, color: "#475569", marginBottom: 56 }}>AI‑powered congenital anomaly screening for Rwanda's frontline health network.</p>

        <div style={{ width: "100%", maxWidth: 1300, background: "#FFFFFF", padding: "60px 48px", borderRadius: 24, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 48, color: "#0F172A", textAlign: "center" }}>Sign in</h2>
          <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
            <div style={{ border: "3px solid #1D9E75", borderRadius: 16, padding: "36px 40px", background: "#E1F5EE", maxWidth: "300px" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#085041" }}>Medical Doctor</div>
              <div style={{ fontSize: 16, color: "#0F6E56" }}>Clinical care and referrals</div>
            </div>
            <div style={{ border: "3px solid #E2E8F0", borderRadius: 16, padding: "36px 40px", background: "#FFFFFF", maxWidth: "300px" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0F172A" }}>Nurse</div>
              <div style={{ fontSize: 16, color: "#64748B" }}>Maternal and neonatal care</div>
            </div>
          </div>
          <div style={{ maxWidth: 650, margin: "20px auto 0" }}>
            <input 
              style={{ width: "100%", padding: "16px 20px", border: "2px solid #E2E8F0", borderRadius: 12, fontSize: 16, outline: "none", boxSizing: "border-box", marginBottom: 20 }}
              type="email" value={email} placeholder="you@email.com" disabled
            />
            <input 
              style={{ width: "100%", padding: "16px 20px", border: "2px solid #E2E8F0", borderRadius: 12, fontSize: 16, outline: "none", boxSizing: "border-box", marginBottom: 32 }}
              type="password" value={password} placeholder="••••••••" disabled
            />
            {error && <div style={{ background: "#FCEBEB", color: "#791F1F", padding: "14px 18px", borderRadius: 12, marginBottom: 20 }}>{error}</div>}
            <button disabled={loading} style={{ width: "100%", padding: "18px", background: "#1D9E75", border: "none", borderRadius: 12, color: "#E1F5EE", fontSize: 18, fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </div>
        </div>
      </main>

      <footer style={{ background: "#E1F5EE", color: "#0F172A", padding: "72px 96px", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 40 }}>
        <div>📧 ishimwechris765@gmail.com</div>
        <div>📱 +250 787 563 648</div>
        <div>🐙 github.com/ChristianIshimwe7</div>
      </footer>
    </div>
  );
}
