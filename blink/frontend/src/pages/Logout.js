import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const doLogout = async () => {
      setError("");
      setLoading(true);
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || "";
        const logoutUrl = `${API_BASE}/api/auth/logout`;
        // Send logout request in background so UI isn't blocked.
        if (navigator && navigator.sendBeacon) {
          try {
            navigator.sendBeacon(logoutUrl);
          } catch (e) {
            // fallback to fetch below
            fetch(logoutUrl, { method: "POST", credentials: "include" }).catch(
              () => {},
            );
          }
        } else {
          // fire-and-forget fetch
          fetch(logoutUrl, { method: "POST", credentials: "include" }).catch(
            () => {},
          );
        }
      } catch (err) {
        // ignore network errors — don't block logout UX
      }
      try {
        localStorage.removeItem("adminToken");
      } catch (e) {
        /* ignore */
      }
      setLoading(false);
      // redirect immediately
      navigate("/login", { replace: true });
    };
    doLogout();
  }, [navigate]);

  if (loading) return <div className="p-6 text-center">Logging out...</div>;
  return (
    <div className="p-6">
      {error ? <p className="text-red-600">{error}</p> : <p>Logged out</p>}
    </div>
  );
};

export default Logout;
