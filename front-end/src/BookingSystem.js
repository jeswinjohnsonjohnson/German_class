import { useState, useEffect, useMemo } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import {
  TextField,
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
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery
} from "@mui/material";

import {
  Description,
  Download,
  VideoCall,
  CalendarToday,
  AccessTime,
  Star
} from "@mui/icons-material";

function BookingSystem({ currentUser, onLogout }) {
 const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const API_URL = "https://germanclass-production.up.railway.app/bookings";
  const userEmail =
    currentUser && typeof currentUser === "object"
      ? currentUser.email
      : currentUser;

  const username = currentUser?.username || userEmail?.split("@")[0];

  const [selectedDate, setSelectedDate] = useState(null);
  const [level, setLevel] = useState("");
  const [time, setTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarColor, setSnackbarColor] = useState("#4caf50");

  const [documents, setDocuments] = useState([]);
  const [openDocs, setOpenDocs] = useState(false);
const [meetAnchor, setMeetAnchor] = useState(null);
  const [page, setPage] = useState(1);
  const bookingsPerPage = 3;

  const timeSlots = [
    "08:00",
    "10:00",
    "12:00",
    "14:00",
    "16:00",
    "18:00",
    "20:00",
    "22:00"
  ];
const meetLinks = {
  A1: "https://meet.google.com/akj-wzxd-ejn",
  A2: "https://meet.google.com/akj-wzxd-ejn",
  B1: "https://meet.google.com/hcz-dwbe-dgn",
  B2: "https://meet.google.com/hcz-dwbe-dgn"
};
  useEffect(() => {
    fetch("https://germanclass-production.up.railway.app/documents")
      .then(res => res.json())
      .then(data => setDocuments(data))
      .catch(err => console.error(err));
  }, []);

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

  useEffect(() => {
  const interval = setInterval(() => {
    fetchBookings();
  }, 3000); // refresh every 3 seconds

  return () => clearInterval(interval);
}, []);

  const fetchBookings = async () => {

    try {

      const res = await fetch(API_URL);
      const data = await res.json();

      const cleaned = data.map((b) => ({
        _id: b._id,
        username: b.username || b.email?.split("@")[0],
        email: b.email,
        level: b.level,
        date: b.date,
        time: b.time
      }));

      setBookedSlots(cleaned);

      setCalendarEvents(
  cleaned.map((b) => ({
    id: b._id, // ⭐ IMPORTANT
    title: b.level,
    start: `${b.date}T${b.time}:00`,
    display: "block",
    color:
      new Date(`${b.date}T${b.time}`) <= new Date()
        ? "#b0b0b0"
        : b.email === userEmail
        ? "#4caf50"
        : "#ff4d4d"
  }))
);

    } catch (err) {
      console.error(err);
    }

  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {

    const userBookings = bookedSlots.filter(
      (b) => b.email === userEmail
    );

    const totalPages = Math.ceil(userBookings.length / bookingsPerPage);

    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }

  }, [bookedSlots]);

const availableTimes = useMemo(() => {

  if (!selectedDate || !level) return [];

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  if (selectedDate < todayStr) return [];

  return timeSlots.filter((t) => {

    // check if slot already booked by another level
    const bookedByOtherLevel = bookedSlots.some(
      (b) =>
        b.date === selectedDate &&
        b.time === t &&
        b.level !== level
    );

    if (bookedByOtherLevel) return false;

    // remove past time today
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

}, [selectedDate, level, bookedSlots]);

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
        b.email === userEmail &&
        b.date >= startStr &&
        b.date <= endStr
    ).length;

    if (weeklyCount >= 3) {

      setSnackbarMessage("You cannot book more than 3 slots per week.");
      setSnackbarColor("#d4c85f");
      setSnackbarOpen(true);
      return;

    }

    setSelectedDate(info.dateStr);
    setLevel("");
    setTime("");
    setOpenDialog(true);

  };

  const sendBooking = async () => {

    if (!level || !time) return;

    const booking = {
      email: userEmail,
      level,
      date: selectedDate,
      time
    };

    setBookedSlots((prev) => [
      ...prev,
      { ...booking, _id: Math.random().toString() }
    ]);

   const tempId = Math.random().toString();

setCalendarEvents((prev) => [
  ...prev,
  {
    id: tempId,
    title: level,
    start: `${selectedDate}T${time}:00`,
    display: "block",
    color: "#4caf50"
  }
]);

    setSnackbarColor("#4caf50");
    setSnackbarMessage(`Booking saved for ${selectedDate} at ${time} (${level})`);
    setSnackbarOpen(true);

    setOpenDialog(false);

    try {

      await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(booking)
      });

      fetchBookings();

    } catch (err) {
      console.error(err);
    }

  };

  const cancelBooking = async (id) => {

    const bookingToDelete = bookedSlots.find((b) => b._id === id);

    const updatedBookings = bookedSlots.filter((b) => b._id !== id);

    setBookedSlots(updatedBookings);

    const userUpdatedBookings = updatedBookings.filter(
      (b) => b.email === userEmail
    );

    const newTotalPages = Math.ceil(userUpdatedBookings.length / bookingsPerPage);

    if (page > newTotalPages && newTotalPages > 0) {
      setPage(newTotalPages);
    }

    setCalendarEvents((prev) =>
  prev.filter((e) => e.id !== id)
);

    setSnackbarMessage("Booking deleted successfully");
    setSnackbarColor("#d32f2f");
    setSnackbarOpen(true);

    try {

      await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
      });

    } catch (err) {

      console.error(err);
      fetchBookings();

    }

  };

  const userBookings = bookedSlots.filter(
    (b) => b.email === userEmail
  );

  const totalPages = Math.ceil(userBookings.length / bookingsPerPage);

  const paginatedBookings = userBookings.slice(
    (page - 1) * bookingsPerPage,
    page * bookingsPerPage
  );
 const handleEventClick = (info) => {
  const event = info.event;

  const date = event.startStr.split("T")[0];
  const { startStr, endStr } = getWeekStartEndStr(date);

  const weeklyCount = bookedSlots.filter(
    (b) =>
      b.email === userEmail &&
      b.date >= startStr &&
      b.date <= endStr
  ).length;

  if (weeklyCount >= 3) {
    setSnackbarMessage("You cannot book more than 3 slots per week.");
    setSnackbarColor("#d4c85f");
    setSnackbarOpen(true);
    return;
  }

  const time = event.startStr.split("T")[1].slice(0,5);

  setSelectedDate(date);
  setTime(time);
  setLevel(event.title);
  setOpenDialog(true);
};

return (

<Box
  sx={{
    minHeight: "100vh",
    background: "#5c0000", // full dark red
    py: 4,
    boxShadow: "inset 0 0 120px rgba(0,0,0,0.6)" // dark shadow effect
  }}
>
  <Box
    sx={{
      maxWidth: 1200,
      mx: "auto",
      px: { xs: 1.5, sm: 2, md: 3 },
      py: { xs: 2, md: 3 },
      borderRadius: 3,
      backdropFilter: "blur(8px)",
      background: "rgba(255,255,255,0.95)",
      boxShadow: "0 20px 50px rgba(0,0,0,0.4)"
    }}
  >
      {/* HEADER */}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={{ xs: 2, sm: 0 }}
        mb={3}
      >

        <Stack direction="row" alignItems="center" spacing={2}>

          <Box
            component="img"
            src="/logo.png"
            alt="logo"
            sx={{
              height: { xs: 60, sm: 80, md: 110 }
            }}
          />

          <Typography variant="h6" color="primary" fontWeight="bold">
            Welcome, {username} 👋
          </Typography>

        </Stack>

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          justifyContent={{ xs: "flex-start", sm: "flex-end" }}
        >
<Button
  variant="outlined"
  startIcon={<VideoCall />}
  onClick={(e) => setMeetAnchor(e.currentTarget)}
>
  Meet
</Button>
          <Button
            variant="outlined"
            startIcon={<Description />}
            onClick={() => setOpenDocs(true)}
          >
          MATERIALS
          </Button>

          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={onLogout}
          >
            Logout
          </Button>

        </Stack>

      </Stack>

      {/* MAIN LAYOUT */}

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
          alignItems: "stretch"
        }}
      >

        {/* CALENDAR */}

        <Paper
          sx={{
            flex: 2,
            p: { xs: 1, sm: 2 },
            overflowX: "auto"
          }}
        >

  <FullCalendar
  plugins={[dayGridPlugin, interactionPlugin]}
  initialView="dayGridMonth"
  dateClick={handleDateClick}
  eventClick={handleEventClick}
  events={calendarEvents}
  height="auto"

  dayMaxEvents={2}   // 👈 important fix

  headerToolbar={
    isMobile
      ? {
          left: "prev,next",
          center: "title",
          right: "today"
        }
      : {
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek"
        }
  }

  validRange={{
    start: new Date().toISOString().split("T")[0]
  }}
/>

        </Paper>

        {/* BOOKINGS PANEL */}

       <Paper
  sx={{
    width: { xs: "100%", md: 320 },
    p: 3,
    bgcolor: "#f9f9f9",
    display: "flex",
    flexDirection: "column",
    height: { xs: "auto", md: 710 }
  }}
>

          <Typography variant="h6" mb={2} color="primary" fontWeight="bold">
            Your Bookings
          </Typography>

          {userBookings.length > 0 ? (

            <>
              <Box sx={{ flexGrow: 1, overflowY: "auto" }}>

                <Stack spacing={2}>

                  {paginatedBookings.map((b) => (

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

</Box>

{/* PAGINATION AT BOTTOM OF RIGHT PANEL */}

{totalPages > 1 && (
  <Stack direction="row" spacing={1} justifyContent="center" mt={2}>

    <Button
      size="small"
      disabled={page === 1}
      onClick={() => setPage(page - 1)}
    >
      Prev
    </Button>

    {[page, page + 1]
      .filter((p) => p <= totalPages)
      .map((p) => (
        <Button
          key={p}
          size="small"
          variant={page === p ? "contained" : "outlined"}
          onClick={() => setPage(p)}
        >
          {p}
        </Button>
      ))}

    <Button
      size="small"
      disabled={page === totalPages}
      onClick={() => setPage(page + 1)}
    >
      Next
    </Button>

  </Stack>
)}

            </>

          ) : (
            <Typography>No bookings yet</Typography>
          )}

        </Paper>

      </Box>
      

      {/* BOOKING DIALOG */}

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="xs"
      >

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
              <MenuItem key={l} value={l}>{l}</MenuItem>
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
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>

        </DialogContent>

        <DialogActions>

          <Button onClick={() => setOpenDialog(false)}>Close</Button>

          <Button onClick={sendBooking} disabled={!level || !time}>
            Book
          </Button>

        </DialogActions>

      </Dialog>

      {/* DOCUMENTS DIALOG */}

      <Dialog
        open={openDocs}
        onClose={() => setOpenDocs(false)}
        maxWidth="sm"
        fullWidth
      >

        <DialogTitle>Documents</DialogTitle>

        <DialogContent>

          {documents.length > 0 ? (

            <Stack spacing={2} mt={1}>

              {documents.map((doc) => (

                <Paper
                  key={doc._id}
                  sx={{
                    p: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >

                  <Typography>{doc.name}</Typography>

                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Download />}
                    href={doc.fileUrl}
                    target="_blank"
                  >
                    Download
                  </Button>

                </Paper>

              ))}

            </Stack>

          ) : (

            <Typography mt={2}>
              No documents available
            </Typography>

          )}

        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDocs(false)}>
            Close
          </Button>
        </DialogActions>

      </Dialog>
{/* GOOGLE MEET MENU */}

<Menu
  anchorEl={meetAnchor}
  open={Boolean(meetAnchor)}
  onClose={() => setMeetAnchor(null)}
>

  {Object.entries(meetLinks).map(([level, link]) => (

    <MenuItem
      key={level}
      onClick={() => {
        window.open(link, "_blank");
        setMeetAnchor(null);
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        py: 1.2
      }}
    >

      <VideoCall color="primary" />

      <Box>
        <Typography fontWeight="bold">
          {level} Class
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
        >
          Join Google Meet
        </Typography>
      </Box>

    </MenuItem>

  ))}

</Menu>
      {/* SNACKBAR */}

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

</Box>
  );

}


export default BookingSystem;