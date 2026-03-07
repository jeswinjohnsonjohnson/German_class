import { useState, useEffect, useMemo } from "react";
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
  Chip
} from "@mui/material";
import { CalendarToday, AccessTime, Star } from "@mui/icons-material";

function BookingSystem({ currentUser, onLogout }) {

  const API_URL = "http://localhost:5000/bookings";

  const userEmail =
    currentUser && typeof currentUser === "object"
      ? currentUser.email
      : currentUser;

  const [selectedDate, setSelectedDate] = useState(null);
  const [level, setLevel] = useState("");
  const [time, setTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarColor, setSnackbarColor] = useState("#4caf50");

  const timeSlots = [
    "07:30",
    "09:30",
    "11:30",
    "13:30",
    "15:30",
    "17:30",
    "19:30"
  ];

  const getWeekStartEndStr = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDay();

    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const toYMD = (d) => d.toISOString().split("T")[0];

    return {
      startStr: toYMD(monday),
      endStr: toYMD(sunday)
    };
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();

      const cleaned = data.map((b) => ({
        _id: b._id,
        username: typeof b.username === "string" ? b.username : b.email,
        email: b.email,
        level: b.level,
        date: b.date,
        time: b.time
      }));

      setBookedSlots(cleaned);

      setCalendarEvents(
        cleaned.map((b) => {
          const eventDate = new Date(`${b.date}T${b.time}`);
          const isPast = eventDate <= new Date();

          return {
            title: b.level,
            start: `${b.date}T${b.time}:00`,
            display: "block",
            color: isPast
              ? "#b0b0b0"
              : b.username === userEmail
              ? "#4caf50"
              : "#ff4d4d"
          };
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const availableTimes = useMemo(() => {
    if (!selectedDate) return [];

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (selectedDate < todayStr) return [];

    return timeSlots.filter((t) => {
      const booked = bookedSlots.some(
        (b) => b.date === selectedDate && b.time === t
      );

      if (booked) return false;

      if (selectedDate === todayStr) {
        const [hours, minutes] = t.split(":").map(Number);

        const slotTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hours,
          minutes
        );

        if (slotTime <= now) return false;
      }

      return true;
    });
  }, [selectedDate, bookedSlots]);

  const handleDateClick = (info) => {
    const now = new Date();
    const selected = new Date(info.dateStr + "T00:00");

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    if (selected < today) return;

    const { startStr, endStr } = getWeekStartEndStr(info.dateStr);

    const weeklyCount = bookedSlots.filter(
      (b) =>
        b.username === userEmail &&
        b.date >= startStr &&
        b.date <= endStr
    ).length;

    if (weeklyCount >= 3) {
      setSnackbarMessage("You cannot book more than 3 slots per week.");
      setSnackbarColor("#d4c85f");
      setSnackbarOpen(true);
      return;
    }

    const futureTimes = timeSlots.filter((t) => {
      const [hours, minutes] = t.split(":").map(Number);

      const slotTime = new Date(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate(),
        hours,
        minutes
      );

      const booked = bookedSlots.some(
        (b) => b.date === info.dateStr && b.time === t
      );

      return slotTime > now && !booked;
    });

    if (futureTimes.length === 0) return;

    setSelectedDate(info.dateStr);
    setLevel("");
    setTime("");
    setOpenDialog(true);
  };

  const sendBooking = async () => {
    if (!level || !time) return;

    const booking = {
      username: userEmail,
      level,
      date: selectedDate,
      time,
      email: userEmail
    };

    setSnackbarColor("#4caf50");

    setSnackbarMessage(
      `Booking saved for ${selectedDate} at ${time} (${level})`
    );

    setSnackbarOpen(true);

    setOpenDialog(false);

    setBookedSlots((prev) => [...prev, booking]);

    setCalendarEvents((prev) => [
      ...prev,
      {
        title: level,
        start: `${selectedDate}T${time}:00`,
        display: "block",
        color: "#4caf50"
      }
    ]);

    fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(booking)
    });
  };

  const cancelBooking = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  const userBookings = bookedSlots.filter(
    (b) => b.username === userEmail
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>

      {/* HEADER WITH LOGO */}

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >

        <Stack direction="row" alignItems="center" spacing={2}>

          <img
            src="/logo.png"
            alt="logo"
            style={{ height: 150, width: "auto" }}
          />

          <Typography variant="h6" color="primary">
            Logged in as: {userEmail || "Guest"}
          </Typography>

        </Stack>

        <Button variant="outlined" color="error" onClick={onLogout}>
          Logout
        </Button>

      </Stack>

      <Box sx={{ display: "flex", gap: 4 }}>

        {/* CALENDAR */}

        <Paper sx={{ flex: 1, p: 2 }}>

          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            dateClick={handleDateClick}
            events={calendarEvents}
            height={600}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,dayGridWeek"
            }}
            validRange={{
              start: new Date().toISOString().split("T")[0]
            }}
          />

        </Paper>

        {/* USER BOOKINGS */}

        <Paper sx={{ width: 320, p: 3, bgcolor: "#f9f9f9" }}>

          <Typography
            variant="h6"
            mb={2}
            color="primary"
            fontWeight="bold"
          >
            Your Bookings
          </Typography>

          {userBookings.length > 0 ? (

            <Stack spacing={2}>

              {userBookings.map((b) => (

                <Paper key={b._id} sx={{ p: 2 }}>

                  <Stack spacing={1}>

                    <Stack direction="row" spacing={1}>
                      <CalendarToday fontSize="small" />
                      <Typography variant="body2">{b.date}</Typography>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      <AccessTime fontSize="small" />
                      <Typography variant="body2">{b.time}</Typography>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      <Star fontSize="small" />
                      <Chip label={b.level} size="small" color="success" />
                    </Stack>

                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => cancelBooking(b._id)}
                    >
                      Cancel
                    </Button>

                  </Stack>

                </Paper>

              ))}

            </Stack>

          ) : (

            <Typography>No bookings yet</Typography>

          )}

        </Paper>

      </Box>

      {/* BOOKING DIALOG */}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>

        <DialogTitle>Book a Slot for {selectedDate}</DialogTitle>

        <DialogContent>

          <TextField
            select
            fullWidth
            label="Level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            margin="normal"
          >
            {["A1", "A2", "B1", "B2"].map((l) => (
              <MenuItem key={l} value={l}>
                {l}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            margin="normal"
          >
            {availableTimes.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>

        </DialogContent>

        <DialogActions>

          <Button onClick={() => setOpenDialog(false)}>
            Close
          </Button>

          <Button
            onClick={sendBooking}
            disabled={!level || !time}
          >
            Book
          </Button>

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
            backgroundColor: snackbarColor
          }
        }}
      />

    </Box>
  );
}

export default BookingSystem;