import { useState, useEffect } from "react";
import {
  Box, Typography, CircularProgress, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Alert, Snackbar, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions, TextField,
  MenuItem, Stack
} from "@mui/material";

const LEVELS = ["A1","A2","B1","B2","C1","C2"];

export default function AdminDashboard({ currentUser, onLogout }) {

  if (!currentUser || currentUser.email !== "jeswinjohnson54@gmail.com") {
    alert("Access denied!");
    window.location.href = "/";
  }

  // ---------------- BOOKINGS -----------------
  const BOOKING_API = "https://germanclass-production.up.railway.app/bookings";
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingSnackbar, setBookingSnackbar] = useState({ open:false, message:"", severity:"success" });
  const [deleteBookingDialog, setDeleteBookingDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch(BOOKING_API);
      const data = await res.json();
      setBookings(data.sort((a,b)=>new Date(a.date) - new Date(b.date)));
    } catch(err){
      console.error(err);
      setBookingSnackbar({ open:true, message:"Error fetching bookings", severity:"error" });
    } finally { setLoadingBookings(false); }
  };

  useEffect(()=>{ fetchBookings(); }, []);

  const handleDeleteBooking = async () => {
    setDeleteBookingDialog(false);
    try{
      const res = await fetch(`${BOOKING_API}/${selectedBookingId}`, { method:"DELETE" });
      if(!res.ok) throw new Error("Failed");
      setBookingSnackbar({ open:true, message:"Booking deleted", severity:"success" });
      fetchBookings();
    } catch(err){
      console.error(err);
      setBookingSnackbar({ open:true, message:"Error deleting booking", severity:"error" });
    }
  };

  // ---------------- USERS -----------------
  const USER_API = "https://germanclass-production.up.railway.app/users";
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSnackbar, setUserSnackbar] = useState({ open:false, message:"", severity:"success" });

  const [userFormOpen, setUserFormOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({ email:"", password:"", level:"A1" });
  const [userIsEditing, setUserIsEditing] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try{
      const res = await fetch(USER_API);
      const data = await res.json();
      setUsers(data);
    } catch(err){
      console.error(err);
      setUserSnackbar({ open:true, message:"Error fetching users", severity:"error" });
    } finally { setLoadingUsers(false); }
  };

  useEffect(()=>{ fetchUsers(); }, []);

  const openUserForm = (u=null) => {
    if(u){
      setUserIsEditing(true);
      setUserFormData({ _id:u._id, email:u.email, level:u.level });
    } else {
      setUserIsEditing(false);
      setUserFormData({ email:"", password:"", level:"A1" });
    }
    setUserFormOpen(true);
  };

  const handleUserSubmit = async () => {
    try{
      const url = userIsEditing ? `${USER_API}/${userFormData._id}` : USER_API;
      const method = userIsEditing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers:{ "Content-Type":"application/json" }, body:JSON.stringify(userFormData) });
      if(!res.ok) throw new Error("Failed");
      setUserFormOpen(false);
      setUserSnackbar({ open:true, message:userIsEditing?"User updated":"User added", severity:"success" });
      fetchUsers();
    } catch(err){
      console.error(err);
      setUserSnackbar({ open:true, message:"Error saving user", severity:"error" });
    }
  };

  const handleDeleteUser = async (id) => {
    if(!window.confirm("Are you sure to delete this user?")) return;
    try{
      const res = await fetch(`${USER_API}/${id}`, { method:"DELETE" });
      if(!res.ok) throw new Error("Failed");
      setUserSnackbar({ open:true, message:"User deleted", severity:"success" });
      fetchUsers();
    } catch(err){
      console.error(err);
      setUserSnackbar({ open:true, message:"Error deleting user", severity:"error" });
    }
  };

  return (
    <Box sx={{ maxWidth:1200, mx:"auto", mt:4, px:2 }}>

      {/* Header: Logo + Logout */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
     <img
  src="/logo.png"
  alt="Company Logo"
  style={{ maxHeight: 100, width: "auto", objectFit: "contain" }}
/>
        </Box>
        <Box>
          <Button variant="outlined" color="error" onClick={onLogout}>Logout</Button>
        </Box>
      </Stack>

      {/* ---------------- BOOKINGS ---------------- */}
      <Typography variant="h4" mb={2}>Bookings</Typography>
      {loadingBookings ? <CircularProgress /> : bookings.length===0 ? <Alert severity="info">No bookings found</Alert> :
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map(b=>(
                <TableRow key={b._id}>
                  <TableCell>{b.email}</TableCell>
                  <TableCell>{b.level}</TableCell>
                  <TableCell>{new Date(b.date).toLocaleDateString()}</TableCell>
                  <TableCell>{b.time}</TableCell>
                  <TableCell>
                    <Button size="small" color="error" onClick={()=>{ setSelectedBookingId(b._id); setDeleteBookingDialog(true); }}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      }

      {/* Delete Booking Dialog */}
      <Dialog open={deleteBookingDialog} onClose={()=>setDeleteBookingDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure to delete this booking?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDeleteBookingDialog(false)}>Cancel</Button>
          <Button color="error" onClick={handleDeleteBooking}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={bookingSnackbar.open} autoHideDuration={4000} onClose={()=>setBookingSnackbar({...bookingSnackbar, open:false})}>
        <Alert severity={bookingSnackbar.severity}>{bookingSnackbar.message}</Alert>
      </Snackbar>

      {/* ---------------- USERS ---------------- */}
      <Box mt={6}>
        <Typography variant="h4" mb={2}>Users</Typography>
        <Button variant="contained" sx={{ mb:2 }} onClick={()=>openUserForm()}>Add User</Button>
        {loadingUsers ? <CircularProgress /> : users.length===0 ? <Alert severity="info">No users found</Alert> :
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(u=>(
                  <TableRow key={u._id}>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.level}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={()=>openUserForm(u)}>Edit</Button>
                      <Button size="small" color="error" onClick={()=>handleDeleteUser(u._id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        }

        {/* User Form Dialog */}
        <Dialog open={userFormOpen} onClose={()=>setUserFormOpen(false)}>
          <DialogTitle>{userIsEditing?"Edit User":"Add User"}</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="Email" margin="dense" value={userFormData.email} onChange={e=>setUserFormData({...userFormData,email:e.target.value})} />
            {!userIsEditing && <TextField fullWidth type="password" label="Password" margin="dense" value={userFormData.password} onChange={e=>setUserFormData({...userFormData,password:e.target.value})} />}
            <TextField select fullWidth label="Level" margin="dense" value={userFormData.level} onChange={e=>setUserFormData({...userFormData,level:e.target.value})}>
              {LEVELS.map(l=><MenuItem key={l} value={l}>{l}</MenuItem>)}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=>setUserFormOpen(false)}>Cancel</Button>
            <Button onClick={handleUserSubmit}>{userIsEditing?"Update":"Add"}</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={userSnackbar.open} autoHideDuration={4000} onClose={()=>setUserSnackbar({...userSnackbar, open:false})}>
          <Alert severity={userSnackbar.severity}>{userSnackbar.message}</Alert>
        </Snackbar>
      </Box>

    </Box>
  );
}