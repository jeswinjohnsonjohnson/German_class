import { useState } from "react";
import { TextField, Button, Typography, Box, Paper } from "@mui/material";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Handles login on button click or Enter key press
  const handleLogin = async (e) => {
    if (e) e.preventDefault(); // Prevent page reload
    if (!email || !password) return alert("Please enter email and password");

    try {
      const res = await fetch("https://germanclass-production.up.railway.app/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
//
      const data = await res.json();
      if (!res.ok) return alert(data.message || "Login failed");

      onLogin(data);
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed. Check console.");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        position: "relative",
      }}
    >
      {/* Login Box */}
      <Paper sx={{ p: 4, width: 300, textAlign: "center", pt: 10, position: "relative" }}>
        <Typography variant="h5" mb={2}>Login</Typography>

        {/* Form handles Enter key automatically */}
        <form onSubmit={handleLogin}>
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
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
            Login
          </Button>
        </form>
      </Paper>

      {/* Floating Logo */}
      <img
        src="/logo.png"
        alt="logo"
        style={{
          position: "absolute",
          top: "calc(50% - 200px)", // adjust vertical position
          width: 120,
          height: "auto",
        }}
      />
    </Box>
  );
}

export default Login;