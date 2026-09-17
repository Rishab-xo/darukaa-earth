import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Auth({ setToken }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        // OAuth2 requires form data
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        const res = await axios.post(`${API_URL}/auth/login`, formData);
        localStorage.setItem("token", res.data.access_token);
        setToken(res.data.access_token);
      } else {
        await axios.post(`${API_URL}/auth/register`, { email, password });
        setIsLogin(true);
        alert("Registration successful! Please log in.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-96 flex flex-col gap-4"
      >
        <h2 className="text-2xl font-bold text-emerald-800 text-center">
          Darukaa.Earth
        </h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded focus:outline-emerald-600"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded focus:outline-emerald-600"
          required
        />
        <button
          type="submit"
          className="bg-emerald-600 text-white p-2 rounded font-bold hover:bg-emerald-700"
        >
          {isLogin ? "Login" : "Register"}
        </button>
        <p
          className="text-sm text-center cursor-pointer text-emerald-600 hover:underline"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Need an account? Register" : "Have an account? Login"}
        </p>
      </form>
    </div>
  );
}
