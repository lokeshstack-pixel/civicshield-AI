import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/health")
      .then((response) => {
        console.log("Backend response:", response.data);
        setBackendStatus(response.data.status);
      })
      .catch((error) => {
        console.error("Backend error:", error);
        setBackendStatus("Backend Offline");
      });
  }, []);

  return (
    <div>
      <h1>CIVICSHIELD AI</h1>

      <p>Urban Infrastructure Risk Intelligence Platform</p>

      <h2>Backend Status</h2>

      <p>{backendStatus}</p>
    </div>
  );
}

export default App;