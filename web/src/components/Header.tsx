import React from "react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 24px",
        background: "#f9fafb",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <h1 style={{ fontSize: "20px", fontWeight: "bold" }}>I‑HealthConnect</h1>
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={() => navigate("/login")}
          style={{
            background: "#2563EB",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          Login
        </button>
        <button
          onClick={() => navigate("/signup")}
          style={{
            background: "#FACC15",
            color: "#000",
            padding: "8px 16px",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          Sign up
        </button>
      </div>
    </header>
  );
}
