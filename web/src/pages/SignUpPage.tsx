import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup, saveUser, UserRole } from "../services/auth";

export default function SignUpPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("nurse");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showEULA, setShowEULA] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreeToTerms) {
      setError("You must agree to the Privacy Policy and Terms of Use to create an account.");
      return;
    }

    setLoading(true);

    try {
      const user = await signup({
        name,
        email,
        password,
        role,
      });
      saveUser(user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: 700, margin: "0 auto" }}>
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
          style={{
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #D1D5DB",
            fontSize: "14px",
          }}
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email Address"
          required
          style={{
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #D1D5DB",
            fontSize: "14px",
          }}
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password (min 6 chars)"
          required
          minLength={6}
          style={{
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #D1D5DB",
            fontSize: "14px",
          }}
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value as UserRole)}
          style={{
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #D1D5DB",
            fontSize: "14px",
            backgroundColor: "white",
          }}
        >
          <option value="nurse">Nurse</option>
          <option value="doctor">Doctor</option>
          <option value="chw">Community Health Worker</option>
          <option value="admin">Admin</option>
          <option value="supervisor">Supervisor</option>
          <option value="coordinator">Coordinator</option>
        </select>

        {/* EULA / Privacy Policy Section */}
        <div
          style={{
            marginTop: 8,
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            padding: 16,
            backgroundColor: "#FAFBFC",
          }}
        >
          <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: 14 }}>
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={e => setAgreeToTerms(e.target.checked)}
              style={{ marginTop: 2 }}
              required
            />
            <span>
              I have read and agree to the{" "}
              <button
                type="button"
                onClick={() => setShowPrivacy(!showPrivacy)}
                style={{
                  background: "none",
                  color: "#2563EB",
                  border: "none",
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 14,
                }}
              >
                Privacy Policy
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => setShowEULA(!showEULA)}
                style={{
                  background: "none",
                  color: "#2563EB",
                  border: "none",
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 14,
                }}
              >
                Terms of Use (EULA)
              </button>
              .
            </span>
          </label>

          <p style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
            By creating an account, you agree to our data collection, storage, and usage practices.
          </p>

          {/* Privacy Policy Content */}
          {showPrivacy && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: "white",
                borderRadius: 6,
                maxHeight: 300,
                overflowY: "auto",
                fontSize: 13,
                lineHeight: 1.6,
                border: "1px solid #E5E7EB",
              }}
            >
              <h4 style={{ marginBottom: 8, marginTop: 0 }}>Privacy Policy</h4>
              <p style={{ marginTop: 0 }}><strong>Last updated:</strong> July 2026</p>

              <h5 style={{ marginTop: 12, marginBottom: 4, fontSize: 14 }}>1. Data We Collect</h5>
              <p style={{ marginTop: 0, marginBottom: 8 }}>
                We collect only what is necessary: Patient Information (name, age, contact details),
                Clinical Data (blood pressure, fundal height, weight, glucose, hemoglobin),
                Risk Assessment Data (AI-generated scores), and Usage Data.
              </p>

              <h5 style={{ marginTop: 12, marginBottom: 4, fontSize: 14 }}>2. How We Use Your Data</h5>
              <p style={{ marginTop: 0, marginBottom: 8 }}>
                To generate congenital anomaly risk predictions, display triage recommendations,
                track patient history, generate anonymised statistics, and improve the AI model.
              </p>

              <h5 style={{ marginTop: 12, marginBottom: 4, fontSize: 14 }}>3. AI-Assisted Processing</h5>
              <p style={{ marginTop: 0, marginBottom: 8 }}>
                <strong>Important:</strong> The AI predicts risk only. It does not diagnose.
                Conservative scoring thresholds bias toward safe over-referral.
              </p>

              <h5 style={{ marginTop: 12, marginBottom: 4, fontSize: 14 }}>4. Data Storage & Security</h5>
              <p style={{ marginTop: 0, marginBottom: 8 }}>
                Passwords are hashed using bcrypt. All sessions use JWT tokens.
                Data is encrypted at rest (AES-256) and in transit (TLS 1.3).
                Data is stored in certified regional cloud infrastructure (AWS Africa region).
              </p>

              <h5 style={{ marginTop: 12, marginBottom: 4, fontSize: 14 }}>5. Your Rights</h5>
              <p style={{ marginTop: 0, marginBottom: 8 }}>
                You have the right to access, correct, delete, object to automated processing,
                and withdraw consent at any time without penalty.
              </p>

              <h5 style={{ marginTop: 12, marginBottom: 4, fontSize: 14 }}>6. Contact</h5>
              <p style={{ marginTop: 0, marginBottom: 8 }}>
                Platform Administrator: Through the Health Center<br />
                Research Ethics Committee: researchethics@alueducation.com
              </p>
            </div>
          )}

          {/* EULA / Terms of Use Content */}
          {showEULA && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: "white",
                borderRadius: 6,
                maxHeight: 300,
                overflowY: "auto",
                fontSize: 13,
                lineHeight: 1.6,
                border: "1px solid #E5E7EB",
              }}
            >
              <h4 style={{ marginBottom: 8, marginTop: 0 }}>Terms of Use (EULA)</h4>
              <p style={{ marginTop: 0 }}><strong>Last updated:</strong> July 2026</p>

              <h5 style={{ marginTop: 12, marginBottom: 4, fontSize: 14 }}>1. Acceptance of Terms</h5>
              <p style={{ marginTop: 0, marginBottom: 8 }}>
                By creating an account, you agree to be bound by these Terms of Use.
              </p>

              <h5 style={{ marginTop: 12, marginBottom: 4, fontSize: 14 }}>2. Description of Service</h5>
              <p style={{ marginTop: 0, marginBottom: 8 }}>
                <strong>Important:</strong> The Platform is a decision support tool,
                not a diagnostic system. Clinical judgement remains the responsibility
                of healthcare professionals.
              </p>

              <h5 style={{ marginTop: 12, marginBottom: 4, fontSize: 14 }}>3. User Obligations</h5>
              <p style={{ marginTop: 0, marginBottom: 8 }}>
                Use the Platform only for legitimate clinical purposes. Provide accurate
                information. Follow clinical protocols. Maintain patient confidentiality.
              </p>

              <h5 style={{ marginTop: 12, marginBottom: 4, fontSize: 14 }}>4. Prohibited Actions</h5>
              <p style={{ marginTop: 0, marginBottom: 8 }}>
                Do not access other users' accounts, submit false data, reverse-engineer
                the Platform, or share login credentials.
              </p>

              <h5 style={{ marginTop: 12, marginBottom: 4, fontSize: 14 }}>5. Account Suspension</h5>
              <p style={{ marginTop: 0, marginBottom: 8 }}>
                Accounts found in violation may be suspended or removed by an administrator.
              </p>

              <h5 style={{ marginTop: 12, marginBottom: 4, fontSize: 14 }}>6. Limitation of Liability</h5>
              <p style={{ marginTop: 0, marginBottom: 8 }}>
                The Platform is provided "as is." I-HealthConnect is not liable for any
                damages arising from use of the Platform.
              </p>

              <h5 style={{ marginTop: 12, marginBottom: 4, fontSize: 14 }}>7. Data Retention</h5>
              <p style={{ marginTop: 0, marginBottom: 8 }}>
                Patient data will be retained for six months after project completion.
                Users may request deletion at any time.
              </p>

              <h5 style={{ marginTop: 12, marginBottom: 4, fontSize: 14 }}>8. Governing Law</h5>
              <p style={{ marginTop: 0, marginBottom: 8 }}>
                These terms are governed by the laws of the Republic of Rwanda.
              </p>

              <h5 style={{ marginTop: 12, marginBottom: 4, fontSize: 14 }}>9. Contact</h5>
              <p style={{ marginTop: 0, marginBottom: 8 }}>
                Platform Administrator: Through the Health Center<br />
                Research Ethics Committee: researchethics@alueducation.com
              </p>
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              color: "#DC2626",
              fontSize: 14,
              backgroundColor: "#FEE2E2",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #FECACA",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px",
            background: loading ? "#93C5FD" : "#2563EB",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: 600,
            opacity: loading ? 0.7 : 1,
            transition: "background 0.2s",
          }}
        >
          {loading ? "Signing up…" : "Sign Up"}
        </button>

        <p style={{ textAlign: "center", marginTop: 8, fontSize: 14 }}>
          Already have an account?{" "}
          <a
            href="/login"
            style={{ color: "#2563EB", textDecoration: "underline" }}
            onClick={(e) => {
              e.preventDefault();
              navigate("/login");
            }}
          >
            Sign In
          </a>
        </p>
      </form>
    </div>
  );
}
