import React, { useState } from "react";
import { useRouter } from "next/router";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false); // Added for eye toggle
  const router = useRouter();

  const allowedUsers = [
    { email: 'hradmin@company.com', password: 'HrAdmin!2025' },
    { email: 'manager@company.com', password: 'Manager#2025' },
    { email: 'trainer@company.com', password: 'Trainer$2025' },
    { email: 'employee@company.com', password: 'Employee%2025' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    // Only allow login for the specified users
    const found = allowedUsers.find(
      (u) => u.email === email && u.password === password
    );
    if (!found) {
      setSubmitting(false);
      setError("Login failed. Kindly check your credentials.");
      setTimeout(() => setError(null), 2000);
      return;
    }
    setTimeout(() => {
      localStorage.setItem('access_token', 'dummy-token');
      localStorage.setItem('user_email', found.email);
      localStorage.setItem('user_role', found.password === 'HrAdmin!2025' ? 'hradmin' :
        found.password === 'Manager#2025' ? 'manager' :
        found.password === 'Trainer$2025' ? 'trainer' :
        found.password === 'Employee%2025' ? 'employee' : 'user');
      setSubmitting(false);
  router.push("/dashboard");
    }, 800);
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#F5F5F5", position: "relative", overflow: "hidden" }}>
      {/* Centered login card */}
      <div
        style={{
          width: 540,
          padding: "48px 48px",
          borderRadius: 20,
          background: "#fff",
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          boxShadow: "0 4px 32px rgba(20, 20, 43, 0.08)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 8 }}>
          <img src="/logo.png" alt="Logo" style={{ width: 100, height: 36, objectFit: "contain" }} />
        </div>
        {/* Title */}
        <div style={{
          color: "#101828",
          fontSize: 28,
          fontFamily: "Poppins, Montserrat, sans-serif",
          fontWeight: 600,
          lineHeight: "28px",
          textAlign: "center",
        }}>
          Login to your account
        </div>
        {/* Form */}
        <form
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            alignItems: "center", // Center children horizontally
          }}
          onSubmit={handleLogin}
        >
          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", alignItems: "center" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: 400 }}>
              <label
                htmlFor="email"
                style={{
                  color: "#344054",
                  fontSize: 16,
                  fontFamily: "Poppins, Montserrat, sans-serif",
                  fontWeight: 400,
                  textTransform: "capitalize",
                  lineHeight: "16px",
                }}
              >
                Company Email
              </label>
            </div>
            <input
              id="email"
              type="email"
              placeholder="person@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: "100%",
                maxWidth: 400,
                height: 48,
                borderRadius: 8,
                outline: "3px #D1E9FF solid",
                border: "none",
                padding: "12px 16px",
                fontSize: 14,
                fontFamily: "Poppins, Montserrat, sans-serif",
                color: "#344054",
                background: "#F9FAFB",
                transition: "outline 0.2s",
                boxSizing: "border-box",
                display: "block",
                margin: "0 auto",
              }}
              autoComplete="username"
              required
            />
          </div>
          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", alignItems: "center" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: 400 }}>
              <label
                htmlFor="password"
                style={{
                  color: "#344054",
                  fontSize: 16,
                  fontFamily: "Poppins, Montserrat, sans-serif",
                  fontWeight: 400,
                  textTransform: "capitalize",
                  lineHeight: "16px",
                }}
              >
                Password
              </label>
              <span
                style={{
                  color: "#1570EF",
                  fontSize: 16,
                  fontFamily: "Poppins, Montserrat, sans-serif",
                  fontWeight: 400,
                  textTransform: "capitalize",
                  lineHeight: "16px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onClick={() => alert("Please contact your administrator to reset your password.")}
              >
                Forgot？
              </span>
            </div>
            <div style={{ position: "relative", width: "100%", maxWidth: 400 }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"} // Toggle type
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  height: 48,
                  borderRadius: 8,
                  outline: "1px #D0D5DD solid",
                  border: "none",
                  padding: "12px 16px",
                  fontSize: 14,
                  fontFamily: "Poppins, Montserrat, sans-serif",
                  color: "#344054",
                  background: "#F9FAFB",
                  transition: "outline 0.2s",
                  boxSizing: "border-box",
                  display: "block",
                  margin: "0 auto",
                }}
                autoComplete="current-password"
                required
              />
              {/* Eye icon toggle */}
              <span
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#98A2B3",
                  fontSize: 18,
                  userSelect: "none",
                }}
                title={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(prev => !prev)}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
          </div>
          {/* Error message */}
          {error && (
            <div style={{ color: "#D92D20", fontSize: 14, fontFamily: "Poppins, Montserrat, sans-serif", marginTop: -8 }}>
              {error}
            </div>
          )}
          {/* Login button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              maxWidth: 400, // Match input maxWidth
              height: 52,
              background: "#1570EF",
              borderRadius: 8,
              border: "none",
              color: "#FCFCFD",
              fontSize: 16,
              fontFamily: "Poppins, Montserrat, sans-serif",
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              marginTop: 8,
              transition: "background 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {submitting ? "Logging in..." : "Login now"}
          </button>
        </form>
        {/* Bottom links */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          <span style={{
            color: "#98A2B3",
            fontSize: 16,
            fontFamily: "Poppins, Montserrat, sans-serif",
            fontWeight: 400,
            textTransform: "capitalize",
            lineHeight: "16px",
          }}>
            Don't have an account ?
          </span>
          <span style={{
            color: "#1570EF",
            fontSize: 16,
            fontFamily: "Poppins, Montserrat, sans-serif",
            fontWeight: 400,
            textTransform: "capitalize",
            lineHeight: "16px",
            cursor: "pointer",
          }}>
            Contact Administrator
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;