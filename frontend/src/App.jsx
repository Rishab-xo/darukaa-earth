import { useState } from "react";
import Dashboard from "./components/Dashboard";
import Auth from "./components/Auth";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  if (!token) {
    return <Auth setToken={setToken} />;
  }

  return (
    <div className="App">
      <Dashboard />
    </div>
  );
}

export default App;
