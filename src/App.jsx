import { useState } from "react";
import { apiPost, apiGet, setAccessToken } from "./services/apiClient";

function App() {
  const [result, setResult] = useState("Not tested yet");

  async function testLogin() {
    try {
      const data = await apiPost("/Auth/login", {
        email: "teststudent@example.com",
        password: "TestPass123!",
      });

      setAccessToken(data.accessToken);
      setResult(`Login successful. Token starts with: ${data.accessToken.slice(0, 20)}...`);
    } catch (err) {
      setResult(`Login failed: ${err.message}`);
    }
  }

  async function testAuthenticatedRequest() {
    try {
      const data = await apiGet("/Dashboard/summary");
      setResult(`Authenticated request succeeded: ${JSON.stringify(data)}`);
    } catch (err) {
      setResult(`Authenticated request failed: ${err.message}`);
    }
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>EduWallet API Client Test</h1>
      <button onClick={testLogin}>1. Test Login</button>
      <button onClick={testAuthenticatedRequest} style={{ marginLeft: "1rem" }}>
        2. Test Authenticated Request
      </button>
      <p style={{ marginTop: "1rem", wordBreak: "break-word" }}>{result}</p>
    </div>
  );
}

export default App;