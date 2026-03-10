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
  TextField,
  MenuItem,
  Stack
} from "@mui/material";

const LEVELS = ["A1","A2","B1","B2","C1","C2"];

export default function AdminDashboard({ currentUser, onLogout }) {

  const BOOKING_API = "https://germanclass-production.up.railway.app/bookings";
  const USER_API = "https://germanclass-production.up.railway.app/users";

  const [bookings,setBookings] = useState([]);
  const [loadingBookings,setLoadingBookings] = useState(true);

  const [users,setUsers] = useState([]);
  const [loadingUsers,setLoadingUsers] = useState(true);

  const [bookingSnackbar,setBookingSnackbar] = useState({open:false,message:"",severity:"success"});
  const [userSnackbar,setUserSnackbar] = useState({open:false,message:"",severity:"success"});

  const [deleteBookingDialog,setDeleteBookingDialog] = useState(false);
  const [selectedBookingId,setSelectedBookingId] = useState(null);

  const [userFormOpen,setUserFormOpen] = useState(false);
  const [userIsEditing,setUserIsEditing] = useState(false);

  const [userFormData,setUserFormData] = useState({
    username:"",
    email:"",
    password:"",
    level:"A1"
  });

  useEffect(()=>{
    if(!currentUser || currentUser.email !== "jeswinjohnson54@gmail.com"){
      alert("Access denied");
      window.location.href="/";
    }
  },[currentUser]);

  // ---------------- FETCH BOOKINGS ----------------

  const fetchBookings = async ()=>{
    try{
      setLoadingBookings(true);
      const res = await fetch(BOOKING_API);
      const data = await res.json();
      setBookings(data.sort((a,b)=>new Date(a.date)-new Date(b.date)));
    }
    catch(err){
      setBookingSnackbar({open:true,message:"Error fetching bookings",severity:"error"});
    }
    finally{
      setLoadingBookings(false);
    }
  };

  // ---------------- FETCH USERS ----------------

  const fetchUsers = async ()=>{
    try{
      setLoadingUsers(true);
      const res = await fetch(USER_API);
      const data = await res.json();
      setUsers(data);
    }
    catch(err){
      setUserSnackbar({open:true,message:"Error fetching users",severity:"error"});
    }
    finally{
      setLoadingUsers(false);
    }
  };

  useEffect(()=>{
    fetchBookings();
    fetchUsers();
  },[]);

  // ---------------- DELETE BOOKING ----------------

  const handleDeleteBooking = async ()=>{
    try{

      const res = await fetch(`${BOOKING_API}/${selectedBookingId}`,{
        method:"DELETE"
      });

      if(!res.ok) throw new Error();

      setBookingSnackbar({
        open:true,
        message:"Booking deleted",
        severity:"success"
      });

      fetchBookings();
    }
    catch{
      setBookingSnackbar({
        open:true,
        message:"Error deleting booking",
        severity:"error"
      });
    }

    setDeleteBookingDialog(false);
  };

  // ---------------- USER FORM OPEN ----------------

  const openUserForm = (user=null)=>{

    if(user){

      setUserIsEditing(true);

      setUserFormData({
        _id:user._id,
        username:user.username,
        email:user.email,
        level:user.level
      });

    } else {

      setUserIsEditing(false);

      setUserFormData({
        username:"",
        email:"",
        password:"",
        level:"A1"
      });

    }

    setUserFormOpen(true);
  };

  // ---------------- SAVE USER ----------------

  const handleUserSubmit = async ()=>{

    try{

      const url = userIsEditing
      ? `${USER_API}/${userFormData._id}`
      : USER_API;

      const method = userIsEditing ? "PUT" : "POST";

      const res = await fetch(url,{
        method,
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify(userFormData)
      });

      if(!res.ok) throw new Error();

      setUserSnackbar({
        open:true,
        message:userIsEditing?"User updated":"User added",
        severity:"success"
      });

      setUserFormOpen(false);
      fetchUsers();
    }
    catch{
      setUserSnackbar({
        open:true,
        message:"Error saving user",
        severity:"error"
      });
    }

  };

  // ---------------- DELETE USER ----------------

  const handleDeleteUser = async (id)=>{

    if(!window.confirm("Delete this user?")) return;

    try{

      const res = await fetch(`${USER_API}/${id}`,{
        method:"DELETE"
      });

      if(!res.ok) throw new Error();

      setUserSnackbar({
        open:true,
        message:"User deleted",
        severity:"success"
      });

      fetchUsers();
    }
    catch{

      setUserSnackbar({
        open:true,
        message:"Error deleting user",
        severity:"error"
      });

    }

  };

  return (

  <Box sx={{maxWidth:1200,mx:"auto",mt:4,p:2}}>

  {/* HEADER */}

  <Stack direction="row" justifyContent="space-between" mb={4}>

  <img
  src="/logo.png"
  alt="logo"
  style={{height:80}}
  />

  <Button
  variant="outlined"
  color="error"
  onClick={onLogout}
  >
  Logout
  </Button>

  </Stack>

  {/* BOOKINGS */}

  <Typography variant="h4" mb={2}>Bookings</Typography>

  {loadingBookings ?

  <CircularProgress/>

  :

  bookings.length===0 ?

  <Alert severity="info">No bookings found</Alert>

  :

  <TableContainer component={Paper}>

  <Table>

 <TableRow>
  <TableCell>Username</TableCell>
  <TableCell>Email</TableCell>
  <TableCell>Level</TableCell>
  <TableCell>Date</TableCell>
  <TableCell>Time</TableCell>
  <TableCell>Actions</TableCell>
  </TableRow>


  <TableBody>

  {bookings.map(b=>(
  <TableRow key={b._id}>

  <TableCell>{b.username}</TableCell>
  <TableCell>{b.email}</TableCell>
  <TableCell>{b.level}</TableCell>
  <TableCell>{new Date(b.date).toLocaleDateString()}</TableCell>
  <TableCell>{b.time}</TableCell>

  <TableCell>

  <Button
  color="error"
  size="small"
  onClick={()=>{

  setSelectedBookingId(b._id);
  setDeleteBookingDialog(true);

  }}
  >
  Delete
  </Button>

  </TableCell>

  </TableRow>
  ))}

  </TableBody>

  </Table>

  </TableContainer>

  }

  {/* DELETE BOOKING DIALOG */}

  <Dialog
  open={deleteBookingDialog}
  onClose={()=>setDeleteBookingDialog(false)}
  >

  <DialogTitle>Delete Booking</DialogTitle>

  <DialogContent>
  <DialogContentText>
  Are you sure you want to delete this booking?
  </DialogContentText>
  </DialogContent>

  <DialogActions>

  <Button onClick={()=>setDeleteBookingDialog(false)}>
  Cancel
  </Button>

  <Button
  color="error"
  onClick={handleDeleteBooking}
  >
  Delete
  </Button>

  </DialogActions>

  </Dialog>

  {/* USERS */}

  <Box mt={6}>

  <Typography variant="h4" mb={2}>Users</Typography>

  <Button
  variant="contained"
  sx={{mb:2}}
  onClick={()=>openUserForm()}
  >
  Add User
  </Button>

  {loadingUsers ?

  <CircularProgress/>

  :

  <TableContainer component={Paper}>

  <Table>

  <TableHead>

  <TableRow>
  <TableCell>Usename</TableCell>
  <TableCell>Email</TableCell>
  <TableCell>Level</TableCell>
  <TableCell>Action</TableCell>
  </TableRow>

  </TableHead>

  <TableBody>

  {users.map(u=>(
  <TableRow key={u._id}>

<TableCell>{u.username}</TableCell>
<TableCell>{u.email}</TableCell>
<TableCell>{u.level}</TableCell>
  <TableCell>

  <Button
  size="small"
  onClick={()=>openUserForm(u)}
  >
  Edit
  </Button>

  <Button
  size="small"
  color="error"
  onClick={()=>handleDeleteUser(u._id)}
  >
  Delete
  </Button>

  </TableCell>

  </TableRow>
  ))}

  </TableBody>

  </Table>

  </TableContainer>

  }

  </Box>

  {/* USER FORM DIALOG */}

  <Dialog
  open={userFormOpen}
  onClose={()=>setUserFormOpen(false)}
  >

  <DialogTitle>
  {userIsEditing ? "Edit User" : "Add User"}
  </DialogTitle>

  <DialogContent>

  <TextField
  fullWidth
  label="Username"
  margin="dense"
  value={userFormData.username}
  onChange={e=>setUserFormData({...userFormData,username:e.target.value})}
  />

  <TextField
  fullWidth
  label="Email"
  margin="dense"
  value={userFormData.email}
  onChange={e=>setUserFormData({...userFormData,email:e.target.value})}
  />

  {!userIsEditing &&

  <TextField
  fullWidth
  label="Password"
  type="password"
  margin="dense"
  value={userFormData.password}
  onChange={e=>setUserFormData({...userFormData,password:e.target.value})}
  />

  }

  <TextField
  select
  fullWidth
  label="Level"
  margin="dense"
  value={userFormData.level}
  onChange={e=>setUserFormData({...userFormData,level:e.target.value})}
  >

  {LEVELS.map(l=>(
  <MenuItem key={l} value={l}>{l}</MenuItem>
  ))}

  </TextField>

  </DialogContent>

  <DialogActions>

  <Button onClick={()=>setUserFormOpen(false)}>
  Cancel
  </Button>

  <Button
  variant="contained"
  onClick={handleUserSubmit}
  >
  {userIsEditing ? "Update" : "Create"}
  </Button>

  </DialogActions>

  </Dialog>

  {/* SNACKBARS */}

  <Snackbar
  open={bookingSnackbar.open}
  autoHideDuration={4000}
  onClose={()=>setBookingSnackbar({...bookingSnackbar,open:false})}
  >
  <Alert severity={bookingSnackbar.severity}>
  {bookingSnackbar.message}
  </Alert>
  </Snackbar>

  <Snackbar
  open={userSnackbar.open}
  autoHideDuration={4000}
  onClose={()=>setUserSnackbar({...userSnackbar,open:false})}
  >
  <Alert severity={userSnackbar.severity}>
  {userSnackbar.message}
  </Alert>
  </Snackbar>

  </Box>

  );
}