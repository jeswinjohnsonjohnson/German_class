import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

function AdminWeeklyReport({ currentUser }) {
  const API_URL = "http://localhost:5000/bookings";
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  // Get current week's start and end dates
  const getWeekRange = () => {
    const today = new Date();
    const day = today.getDay(); // 0 (Sun) - 6 (Sat)
    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
  };

  // Fetch bookings for this week
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch bookings");
      const data = await res.json();

      const { monday, sunday } = getWeekRange();
      const weeklyBookings = data
        .map((b) => ({
          id: b._id,
          username: b.username || b.email || "Unknown",
          email: b.email || "No email",
          level: b.level,
          date: new Date(b.date),
          time: b.time,
        }))
        .filter((b) => b.date >= monday && b.date <= sunday)
        .sort((a, b) => a.date - b.date);

      setBookings(weeklyBookings);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Error fetching bookings", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser || currentUser.email !== "jeswinjohnson54@gmail.com") {
      alert("Access denied! You are not an admin.");
      window.location.href = "/";
    } else {
      fetchBookings();
    }
  }, [currentUser]);

  // Delete Booking
  const handleDeleteClick = (id) => {
    setSelectedBookingId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteDialogOpen(false);
    setBookings((prev) => prev.filter((b) => b.id !== selectedBookingId));

    try {
      const res = await fetch(`${API_URL}/${selectedBookingId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed on server");
      setSnackbar({ open: true, message: "Booking deleted successfully", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Error deleting booking", severity: "error" });
      fetchBookings(); // refresh data in case delete failed
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedBookingId(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 6, px: 2 }}>
      <Typography variant="h4" mb={2} color="primary" fontWeight="bold">
        Weekly Bookings Report
      </Typography>
      <Typography variant="subtitle1" mb={3} color="text.secondary">
        Bookings from this week
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
          <CircularProgress />
        </Box>
      ) : bookings.length === 0 ? (
        <Alert severity="info">No bookings found for this week.</Alert>
      ) : (
        <>
          <Typography variant="h6" mb={2}>
            Total Bookings This Week: {bookings.length}
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.username}</TableCell>
                    <TableCell>{b.email}</TableCell>
                    <TableCell>{b.level}</TableCell>
                    <TableCell>{b.date.toLocaleDateString()}</TableCell>
                    <TableCell>{b.time}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDeleteClick(b.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this booking? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AdminWeeklyReport;