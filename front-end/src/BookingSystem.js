import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  TextField,
  MenuItem,
  Button,
  Typography,
  Paper,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Stack,
  Chip,
  Divider
} from "@mui/material";
import { CalendarToday, AccessTime, Star } from "@mui/icons-material";
function BookingSystem({ currentUser }) {
  const API_URL = "http://localhost:5000/bookings";

  // Normalize currentUser to always be a string (email)
  const userEmail = currentUser && typeof currentUser === "object" ? currentUser.email : currentUser;

  const [selectedDate, setSelectedDate] = useState(null);
  const [level, setLevel] = useState("");
  const [time, setTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
const [snackbarOpen, setSnackbarOpen] = useState(false);
const [snackbarMessage, setSnackbarMessage] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null); // for clicked event details

  const timeSlots = ["07:30", "09:30", "11:30", "13:30", "15:30", "17:30", "19:30"];

  const fetchBookings = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();

      const cleaned = data.map(b => ({
        _id: b._id,
        username: typeof b.username === "string" ? b.username : (b.email || "Unknown"),
        email: typeof b.email === "string" ? b.email : "unknown@test.com",
        level: b.level,
        date: b.date,
        time: b.time,
      }));

      setBookedSlots(cleaned);
   setCalendarEvents(cleaned.map(b => ({
  title: `${b.level}`,
  start: `${b.date}T${b.time}:00`,
  display: "block", // ensures full block instead of tiny dot
  color: b.username === userEmail ? "#4caf50" : "#ff4d4d", // green if it's your booking
})));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleDateClick = (info) => {
    const today = new Date().toISOString().split("T")[0];
    if (info.dateStr < today) return;

    setSelectedDate(info.dateStr);
    setLevel("");
    setTime("");
    setOpenDialog(true);
  };

  const handleEventClick = (info) => {
    const booking = bookedSlots.find(b =>
      `${b.username || "Unknown"} (${b.level} ${b.time})` === info.event.title
    );
    if (booking) setSelectedBooking(booking);
  };

const sendBooking = async () => {
  if (!level || !time) {
    setSnackbarMessage("Please fill all fields");
    setSnackbarOpen(true);
    return;
  }

  setSnackbarMessage(`Booking saved for ${selectedDate} at ${time} (${level}) ✅`);
  setSnackbarOpen(true);
  setOpenDialog(false);  // close dialog immediately

  const booking = { username: userEmail, level, date: selectedDate, time, email: userEmail };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    });

    const data = await res.json();
    if (!res.ok) {
      setSnackbarMessage(data.message || "Error booking");
    }

    fetchBookings();  // refresh calendar
  } catch (err) {
    console.error(err);
    setSnackbarMessage("Error booking. Try again.");
  }
};
  const cancelBooking = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      fetchBookings();
    } catch (err) {
      console.error(err);
      alert("Error cancelling booking");
    }
  };

  const availableTimes = timeSlots.filter(t => !bookedSlots.some(b => b.date === selectedDate && b.time === t));

  const userBookings = bookedSlots.filter(b => b.username === userEmail);

const filteredEvents = calendarEvents; // no filtering

  return (
  <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
    <Typography variant="h6" align="center" color="primary" mb={2}>
      Logged in as: {userEmail || "Guest"}
    </Typography>

    <Box sx={{ display: "flex", gap: 4 }}>
      {/* Left: Calendar */}
      <Paper sx={{ flex: 1, p: 2 }}>
       

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          events={filteredEvents}
          height={600}
          dayMaxEvents={true}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek",
          }}
          validRange={{ start: new Date().toISOString().split("T")[0] }}
        />
      </Paper>

     {/* Right: Your Bookings */}
<Paper sx={{ width: 320, p: 3, bgcolor: "#f9f9f9" }}>
  <Typography variant="h6" mb={2} color="primary" fontWeight="bold">
    Your Bookings
  </Typography>

  {userBookings.length > 0 ? (
    <Stack spacing={2} sx={{ maxHeight: 600, overflowY: "auto" }}>
      {userBookings.map(b => (
        <Paper
          key={b._id}
          elevation={2}
          sx={{ p: 2, borderRadius: 2, bgcolor: "#fff", borderLeft: "4px solid #1976d2" }}
        >
          <Stack spacing={1}>
            {/* Date */}
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarToday fontSize="small" color="action" />
              <Typography variant="body2">{b.date}</Typography>
            </Stack>

            {/* Time */}
            <Stack direction="row" spacing={1} alignItems="center">
              <AccessTime fontSize="small" color="action" />
              <Typography variant="body2">{b.time}</Typography>
            </Stack>

            {/* Level */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Star fontSize="small" color="action" />
              <Chip label={b.level} size="small" color="success" />
            </Stack>

            {/* Email */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="textSecondary" sx={{ flex: 1 }}>
                {b.email || "No email"}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => cancelBooking(b._id)}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Stack>
  ) : (
    <Typography>No bookings yet</Typography>
  )}
</Paper>

    </Box>

    {/* Booking Dialog */}
    <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Book a Slot for {selectedDate}</DialogTitle>
      <DialogContent>
        <TextField
          select
          fullWidth
          label="Select Level"
          value={level}
          onChange={e => { setLevel(e.target.value); setTime(""); }}
          margin="normal"
        >
          {["A1","A2","B1","B2"].map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
        </TextField>
        <TextField
          select
          fullWidth
          label="Select Time"
          value={time}
          onChange={e => setTime(e.target.value)}
          margin="normal"
          disabled={!level}
        >
          {availableTimes.length > 0 ? availableTimes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)
          : <MenuItem disabled>No available times</MenuItem>}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenDialog(false)} color="secondary">Close</Button>
        <Button onClick={sendBooking} color="primary" disabled={!level || !time}>Book</Button>
      </DialogActions>
    </Dialog>

    {/* Event Details Dialog */}
    <Dialog open={!!selectedBooking} onClose={() => setSelectedBooking(null)}>
      <DialogTitle>Booking Details</DialogTitle>
      <DialogContent>
        {selectedBooking && (
          <>
            <Typography>Username: {selectedBooking.username}</Typography>
            <Typography>Email: {selectedBooking.email}</Typography>
            <Typography>Level: {selectedBooking.level}</Typography>
            <Typography>Date: {selectedBooking.date}</Typography>
            <Typography>Time: {selectedBooking.time}</Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setSelectedBooking(null)}>Close</Button>
      </DialogActions>
    </Dialog>

    <Snackbar
  open={snackbarOpen}
  autoHideDuration={3000}
  onClose={() => setSnackbarOpen(false)}
  message={snackbarMessage}
  anchorOrigin={{ vertical: "top", horizontal: "right" }}
  sx={{
    "& .MuiSnackbarContent-root": {
      backgroundColor: "#4caf50", // green for success
      color: "#fff",
      fontWeight: "bold",
    }
  }}
/>

  </Box>
);
  
}


export default BookingSystem;