import { useState } from "react";
import { TextField, Button, Typography, Box, Paper } from "@mui/material";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) return alert("Please enter email and password");

    try {
      const res = await fetch("http://localhost:5000/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }) // send as string
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message || "Login failed");

      onLogin(data); // {username, email}
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed. Check console.");
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Paper sx={{ p: 4, width: 300 }}>
        <Typography variant="h5" mb={2} align="center">Login</Typography>
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          fullWidth
          type="password"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleLogin}>Login</Button>
      </Paper>
    </Box>
  );
}

export default Login;