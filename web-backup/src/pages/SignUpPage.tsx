import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup, saveUser, UserRole } from "../services/auth";

export default function SignUpPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("doctor");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await signup(name, email, password, role);
      saveUser(user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: 600, margin: "0 auto" }}>
      
      <button
        type="button"
        onClick={() => navigate("/")}
        style={{
          background: "none",
          color: "#2563EB",
          border: "2px solid #2563EB",
          borderRadius: 6,
          padding: "8px 16px",
          cursor: "pointer",
          fontWeight: 600,
          marginBottom: 24,
          fontSize: 14,
        }}
      >
        ← Back
      </button>

      <h1 style={{ marginBottom: "20px" }}>Create an Account</h1>
      
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Full Name"
          required
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email Address"
          required
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password (min 8 chars)"
          required
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value as UserRole)}
        >
          <option value="doctor">Doctor</option>
          <option value="nurse">Nurse</option>
          <option value="supervisor">Supervisor</option>
          <option value="coordinator">Coordinator</option>
          <option value="admin">Admin</option>
          <option value="chw">Community Health Worker</option>
        </select>

        {error && <div style={{ color: "red" }}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px",
            background: "#2563EB",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {loading ? "Signing up…" : "Sign Up"}
        </button>
      </form>
    </div>
  );
}