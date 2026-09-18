import { useState } from "react";
import axios from "axios";
import { AuthUI } from "@/components/ui/auth-ui";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Auth({ setToken }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSignIn = async (email, password) => {
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      // OAuth2 requires form data
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await axios.post(`${API_URL}/auth/login`, formData);
      localStorage.setItem("token", res.data.access_token);
      setToken(res.data.access_token);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Sign in failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (_name, email, password) => {
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/register`, { email, password });
      setSuccessMessage("Registration successful! Please sign in.");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthUI
      onSignIn={handleSignIn}
      onSignUp={handleSignUp}
      error={error}
      loading={loading}
      successMessage={successMessage}
    />
  );
}
