import { useState, useEffect } from "react";
import { TextField, Button, Typography, Box, Paper } from "@mui/material";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const motivations = [
    "🇩🇪 Jeder Tag ist eine neue Chance Deutsch zu lernen.",
    "💪 Kleine Schritte führen zu großen Erfolgen.",
    "📚 Übung macht den Meister.",
    "🚀 Deutsch lernen öffnet Türen zu neuen Möglichkeiten.",
    "🌍 Eine neue Sprache ist ein neues Leben."
  ];

  const [motivationIndex, setMotivationIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMotivationIndex((prev) => (prev + 1) % motivations.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      const res = await fetch(
      `${process.env.REACT_APP_API_URL}/users/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            password: password
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

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
        background: "linear-gradient(135deg, #1f1f1f 0%, #7a0f0f 50%, #d4af37 100%)"
      }}
    >
      {/* Login Card */}
      <Paper
        elevation={6}
        sx={{
          p: 4,
          width: 340,
          textAlign: "center",
          pt: 10,
          position: "relative",
          borderRadius: 4,
          backdropFilter: "blur(10px)",
          background: "rgba(255,255,255,0.9)"
        }}
      >
        <Typography variant="h5" mb={2} fontWeight="bold">
          Login
        </Typography>

        <form onSubmit={handleLogin}>
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
          />

          <TextField
            label="Password"
            fullWidth
            type="password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
          >
            Login
          </Button>

          {/* Motivational German Quote */}
<Box
  sx={{
    mt: 3,
    p: 1.5,
    bgcolor: "#f0f7ff",
    borderRadius: 2,
    fontStyle: "italic",
    height: "70px",          // fixed height prevents movement
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center"
  }}
>
  <Typography variant="body2">
    {motivations[motivationIndex]}
  </Typography>
</Box>
        </form>
      </Paper>

      {/* Floating Logo */}
      <img
        src="/logo.png"
        alt="logo"
        style={{
          position: "absolute",
          top: "calc(50% - 260px)",
          width: 150
        }}
      />
    </Box>
  );
}

export default Login;