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
  Stack,
  IconButton,
  TablePagination
  } from "@mui/material";
import { Tooltip } from "@mui/material";
  import EditIcon from "@mui/icons-material/Edit";
  import DeleteIcon from "@mui/icons-material/Delete";
  import UploadIcon from "@mui/icons-material/Upload";

  const LEVELS = ["A1","A2","B1","B2","C1","C2"];

  export default function AdminDashboard({ currentUser, onLogout }) {

  const BOOKING_API = `${process.env.REACT_APP_API_URL}/bookings`;
  const USER_API = `${process.env.REACT_APP_API_URL}/users`;

  const [bookings,setBookings] = useState([]);
  const [users,setUsers] = useState([]);

  const [loadingBookings,setLoadingBookings] = useState(true);
  const [loadingUsers,setLoadingUsers] = useState(true);

  const [search,setSearch] = useState("");
  const [levelFilter,setLevelFilter] = useState("ALL");

  const [page,setPage] = useState(0);
  const [rowsPerPage,setRowsPerPage] = useState(10);

  const [bookingSnackbar,setBookingSnackbar] = useState({open:false,message:"",severity:"success"});
  const [userSnackbar,setUserSnackbar] = useState({open:false,message:"",severity:"success"});

  const [deleteBookingDialog,setDeleteBookingDialog] = useState(false);
  const [selectedBookingId,setSelectedBookingId] = useState(null);

  const [userFormOpen,setUserFormOpen] = useState(false);
  const [userIsEditing,setUserIsEditing] = useState(false);

  const [uploadDialog,setUploadDialog] = useState(false);
  const [selectedUser,setSelectedUser] = useState(null);
  const [selectedFile,setSelectedFile] = useState(null);

  const [userFormData,setUserFormData] = useState({
  username:"",
  email:"",
  password:"",
  level:"A1"
  });

  useEffect(()=>{
  if(!currentUser || currentUser.email !== "flockawyn@gmail.com"){
  alert("Access denied");
  window.location.href="/";
  }
  },[currentUser]);

  // FETCH BOOKINGS

  const fetchBookings = async ()=>{
  try{
  setLoadingBookings(true);
  const res = await fetch(BOOKING_API);
  const data = await res.json();
  setBookings(data.sort((a,b)=>new Date(a.date)-new Date(b.date)));
  }catch{
  setBookingSnackbar({open:true,message:"Error fetching bookings",severity:"error"});
  }finally{
  setLoadingBookings(false);
  }
  };

  // FETCH USERS

  const fetchUsers = async ()=>{
  try{
  setLoadingUsers(true);
  const res = await fetch(USER_API);
  const data = await res.json();

  const filtered = data.filter(u => u.email !== "flockawyn@gmail.com");

  setUsers(filtered);

  }catch{
  setUserSnackbar({open:true,message:"Error fetching users",severity:"error"});
  }finally{
  setLoadingUsers(false);
  }
  };

  useEffect(()=>{
  fetchBookings();
  fetchUsers();
  },[]);


  // TODAY DATE
const todayDate = new Date();
todayDate.setHours(0,0,0,0);

// TOMORROW DATE
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
tomorrowDate.setHours(0,0,0,0);

// BOOKINGS TODAY
const todayBookings = bookings.filter(b => {
  const d = new Date(b.date);
  d.setHours(0,0,0,0);
  return d.getTime() === todayDate.getTime();
});

// BOOKINGS TOMORROW
const tomorrowBookings = bookings.filter(b => {
  const d = new Date(b.date);
  d.setHours(0,0,0,0);
  return d.getTime() === tomorrowDate.getTime();
});

// TOTAL BOOKINGS
const totalBookings = bookings.length;

// LEVELS TODAY
const todayLevels = [...new Set(todayBookings.map(b => b.level))];
const formatDateTime = (date, time) => {
  const d = new Date(date);
  return `${d.toLocaleDateString()} - ${time}`;
};

  // DELETE BOOKING

  const handleDeleteBooking = async ()=>{

  try{

  const res = await fetch(`${BOOKING_API}/${selectedBookingId}`,{
  method:"DELETE"
  });

  if(!res.ok) throw new Error();

  setBookings(prev => prev.filter(b => b._id !== selectedBookingId));

  setBookingSnackbar({
  open:true,
  message:"Booking deleted",
  severity:"success"
  });

  }catch{

  setBookingSnackbar({
  open:true,
  message:"Error deleting booking",
  severity:"error"
  });

  }

  setDeleteBookingDialog(false);

  };

  // SEARCH FILTER

  const filteredUsers = users.filter(u=>{

  const matchesSearch =
  (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
  (u.email || "").toLowerCase().includes(search.toLowerCase());

  const matchesLevel =
  levelFilter==="ALL" || u.level===levelFilter;

  return matchesSearch && matchesLevel;

  });

  // USER FORM

  const openUserForm = (user=null)=>{

  if(user){

  setUserIsEditing(true);

  setUserFormData({
  _id:user._id,
  username:user.username,
  email:user.email,
  password:user.password,
  level:user.level
  });

  }else{

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

  // SAVE USER

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

  const savedUser = await res.json();

  if(userIsEditing){

  setUsers(prev =>
  prev.map(u => u._id===savedUser._id ? savedUser : u)
  );

  }else{

  setUsers(prev => [...prev,savedUser]);

  }

  setUserSnackbar({
  open:true,
  message:userIsEditing?"User updated":"User created",
  severity:"success"
  });

  setUserFormOpen(false);

  }catch{

  setUserSnackbar({
  open:true,
  message:"Error saving user",
  severity:"error"
  });

  }

  };


  // DELETE USER

  const handleDeleteUser = async(id)=>{

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

  }catch{

  setUserSnackbar({
  open:true,
  message:"Error deleting user",
  severity:"error"
  });

  }

  };

  // DELETE DOCUMENT

const handleDeleteDocument = async (userId, docId) => {

  if(!window.confirm("Delete this document?")) return;

  try {

    const res = await fetch(`${USER_API}/${userId}/documents/${docId}`, {
      method: "DELETE"
    });

    if(!res.ok) throw new Error();

    setUserSnackbar({
      open: true,
      message: "Document deleted",
      severity: "success"
    });

    fetchUsers();

  } catch {

    setUserSnackbar({
      open: true,
      message: "Error deleting document",
      severity: "error"
    });

  }

};

  // UPLOAD DOC

  const openUploadDialog = (user)=>{
  setSelectedUser(user);
  setUploadDialog(true);
  };

  const handleUploadDocument = async ()=>{

  if(!selectedFile) return;

  const formData = new FormData();

  formData.append("file",selectedFile);
  formData.append("userId",selectedUser._id);

  try{

  const res = await fetch(`${USER_API}/upload-doc`,{
  method:"POST",
  body:formData
  });

  if(!res.ok) throw new Error();

  setUploadDialog(false);
  setSelectedFile(null);

  setUserSnackbar({
  open:true,
  message:"Document uploaded",
  severity:"success"
  });

  fetchUsers();

  }catch{

  setUserSnackbar({
  open:true,
  message:"Upload failed",
  severity:"error"
  });

  }

  };
  

  return (

  <Box
  sx={{
  minHeight: "100vh",
  width: "100%",

background: "linear-gradient(135deg, #cfd8e6 0%, #eef2f7 100%)",

  display: "flex",
  justifyContent: "center"
  }}
  >
  <Box
sx={{
maxWidth: 1200,
width: "100%",
mt: 4
}}
>

<Paper
sx={{
p:4,
borderRadius:4,
background:"rgba(255,255,255,0.85)",
backdropFilter:"blur(6px)",
boxShadow:"0 12px 40px rgba(0,0,0,0.15)"
}}
>
  {/* HEADER */}

  <Stack direction="row" justifyContent="space-between" mb={4}>

  <img src="/logo.png" alt="logo" style={{height:120}}/>

<Button
variant="outlined"
color="error"
size="small"
onClick={onLogout}
sx={{
minWidth: "80px",
height: "50px",
fontSize: "12px",
px: 1.5,
py: 0.3,
borderRadius: 1
}}
>
Logout
</Button>

  </Stack>

  {/* STATS */}

  <Stack direction="row" spacing={3} mb={4} flexWrap="wrap">

<Paper sx={{
p:3,
width:180,
background:"#e3f2fd",
borderLeft:"6px solid #2196f3"
}}>
<Typography variant="subtitle1">Users</Typography>
<Typography variant="h4">{users.length}</Typography>
</Paper>

<Paper sx={{
p:3,
width:180,
background:"#f3e5f5",
borderLeft:"6px solid #9c27b0"
}}>
<Typography variant="subtitle1">Total Bookings</Typography>
<Typography variant="h4">{totalBookings}</Typography>
</Paper>

<Tooltip
  arrow
  placement="bottom"
  componentsProps={{
    tooltip: {
      sx: {
        backgroundColor: "#fff",
        color: "#000",
        fontSize: "14px",
        padding: "12px 16px",
        borderRadius: "10px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
        maxWidth: 300
      }
    },
    arrow: {
      sx: {
        color: "#fff"
      }
    }
  }}
  title={
   <Box sx={{ minWidth: 220 }}>
  {todayBookings.length ? (
    todayBookings.map((b, i) => (
      <Box
        key={i}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          borderBottom: "1px solid #eee",
          py: 0.5
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {b.username}
        </Typography>

        <Typography variant="body2" sx={{ color: "#555" }}>
          {b.level}
        </Typography>

        <Typography variant="body2" sx={{ color: "#888" }}>
          {b.time}
        </Typography>
      </Box>
    ))
  ) : (
    <Typography variant="body2">No bookings today</Typography>
  )}
</Box>
  }
>
  <Paper
    sx={{
      p:3,
      width:180,
      background:"#e8f5e9",
      borderLeft:"6px solid #4caf50",
      cursor:"pointer"
    }}
  >
    <Typography variant="subtitle1">Today</Typography>
    <Typography variant="h4">{todayBookings.length}</Typography>
  </Paper>
</Tooltip>

<Tooltip
  arrow
  placement="bottom"
  componentsProps={{
    tooltip: {
      sx: {
        backgroundColor: "#fff",
        color: "#000",
        fontSize: "14px",
        padding: "12px 16px",
        borderRadius: "10px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
        maxWidth: 300
      }
    },
    arrow: {
      sx: {
        color: "#fff"
      }
    }
  }}
  title={
    <Box sx={{ minWidth: 220 }}>
      {tomorrowBookings.length ? (
        tomorrowBookings.map((b, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "1px solid #eee",
              py: 0.5
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {b.username}
            </Typography>

            <Typography variant="body2" sx={{ color: "#555" }}>
              {b.level}
            </Typography>

            <Typography variant="body2" sx={{ color: "#888" }}>
              {b.time}
            </Typography>
          </Box>
        ))
      ) : (
        <Typography variant="body2">No bookings tomorrow</Typography>
      )}
    </Box>
  }
>
  <Paper
    sx={{
      p:3,
      width:180,
      background:"#fff3e0",
      borderLeft:"6px solid #ff9800",
      cursor:"pointer"
    }}
  >
    <Typography variant="subtitle1">Tomorrow</Typography>
    <Typography variant="h4">{tomorrowBookings.length}</Typography>
  </Paper>
</Tooltip>

<Paper sx={{
p:3,
width:220,
background:"#e0f2f1",
borderLeft:"6px solid #009688"
}}>
<Typography variant="subtitle1">Classes Today</Typography>
<Typography variant="h6">
{todayLevels.length ? todayLevels.join(", ") : "No classes today"}
</Typography>
</Paper>

</Stack>
  {/* BOOKINGS */}

  <Typography variant="h4" mb={2}>Bookings</Typography>

  {loadingBookings ?

  <CircularProgress/>

  :

  <TableContainer component={Paper}>

  <Table>

  <TableHead>
  <TableRow>
  <TableCell>Username</TableCell>
  <TableCell>Email</TableCell>
  <TableCell>Password</TableCell>
  <TableCell>Level</TableCell>
  <TableCell>Documents</TableCell>
  <TableCell>Action</TableCell>
  </TableRow>
  </TableHead>

  <TableBody>

  {bookings.map(b=>(

  <TableRow key={b._id}>

  <TableCell>{b.username}</TableCell>
  <TableCell>{b.email}</TableCell>
  <TableCell>{b.level}</TableCell>
  <TableCell>{new Date(b.date).toLocaleDateString()}</TableCell>
  <TableCell>{b.time}</TableCell>

  <TableCell>

  <IconButton color="error"
  onClick={()=>{
  setSelectedBookingId(b._id);
  setDeleteBookingDialog(true);
  }}>
  <DeleteIcon/>
  </IconButton>

  </TableCell>

  </TableRow>

  ))}

  </TableBody>

  </Table>

  </TableContainer>

  }

  {/* USERS */}

  <Box mt={6}>

  <Typography variant="h4" mb={2}>Users</Typography>

  <Button variant="contained" sx={{mb:2}} onClick={()=>openUserForm()}>
  Add User
  </Button>

  <Stack direction="row" spacing={2} mb={2}>

  <TextField
  label="Search"
  value={search}
  onChange={(e)=>setSearch(e.target.value)}
  />

  <TextField
  select
  label="Level"
  value={levelFilter}
  onChange={(e)=>setLevelFilter(e.target.value)}
  sx={{width:150}}
  >

  <MenuItem value="ALL">All</MenuItem>

  {LEVELS.map(l=>(
  <MenuItem key={l} value={l}>{l}</MenuItem>
  ))}

  </TextField>

  </Stack>

  {loadingUsers ?

  <CircularProgress/>

  :

  <TableContainer component={Paper}>

  <Table>

  <TableHead>
  <TableRow>
  <TableCell>Username</TableCell>
  <TableCell>Email</TableCell>
  <TableCell>Password</TableCell>
  <TableCell>Level</TableCell>
  <TableCell>Action</TableCell>
  </TableRow>
  </TableHead>

  <TableBody>

  {filteredUsers
  .slice(page*rowsPerPage,page*rowsPerPage+rowsPerPage)
  .map(u=>(

  <TableRow key={u._id}>

  <TableCell>{u.username}</TableCell>
  <TableCell>{u.email}</TableCell>
  <TableCell>********</TableCell>
  <TableCell>{u.level}</TableCell>
  <TableCell>

  {u.documents?.length > 0 ? (

  u.documents.map((doc)=>(
  <div key={doc._id}>

  <a
  href={doc.fileUrl}
  target="_blank"
  rel="noreferrer"
  >
  {doc.name}
  </a>

  <IconButton
  color="error"
  size="small"
  onClick={()=>handleDeleteDocument(u._id,doc._id)}
  >
  <DeleteIcon fontSize="small"/>
  </IconButton>

  </div>
  ))

  ) : (
  "No documents"
  )}

  </TableCell>
  <TableCell>

  <IconButton onClick={()=>openUserForm(u)}>
  <EditIcon/>
  </IconButton>

  <IconButton color="error" onClick={()=>handleDeleteUser(u._id)}>
  <DeleteIcon/>
  </IconButton>

  <IconButton onClick={()=>openUploadDialog(u)}>
  <UploadIcon/>
  </IconButton>

  </TableCell>

  </TableRow>

  ))}

  </TableBody>

  </Table>

  <TablePagination
  rowsPerPageOptions={[5,10,25]}
  component="div"
  count={filteredUsers.length}
  rowsPerPage={rowsPerPage}
  page={page}
  onPageChange={(e,newPage)=>setPage(newPage)}
  onRowsPerPageChange={(e)=>{
  setRowsPerPage(parseInt(e.target.value,10));
  setPage(0);
  }}
  />

  </TableContainer>

  }

  </Box>

  {/* DELETE BOOKING DIALOG */}

  <Dialog open={deleteBookingDialog} onClose={()=>setDeleteBookingDialog(false)}>

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

  <Button color="error" variant="contained" onClick={handleDeleteBooking}>
  Delete
  </Button>

  </DialogActions>

  </Dialog>

  {/* USER FORM */}

  <Dialog open={userFormOpen} onClose={()=>setUserFormOpen(false)}>

  <DialogTitle>
  {userIsEditing?"Edit User":"Add User"}
  </DialogTitle>

  <DialogContent>

  <TextField fullWidth label="Username" margin="dense"
  value={userFormData.username}
  onChange={(e)=>setUserFormData({...userFormData,username:e.target.value})}
  />

  <TextField fullWidth label="Email" margin="dense"
  value={userFormData.email}
  onChange={(e)=>setUserFormData({...userFormData,email:e.target.value})}
  />

  <TextField fullWidth label="Password" margin="dense"
  value={userFormData.password}
  onChange={(e)=>setUserFormData({...userFormData,password:e.target.value})}
  />

  <TextField select fullWidth label="Level" margin="dense"
  value={userFormData.level}
  onChange={(e)=>setUserFormData({...userFormData,level:e.target.value})}
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

  <Button variant="contained" onClick={handleUserSubmit}>
  Save
  </Button>

  </DialogActions>

  </Dialog>

  {/* UPLOAD DOC */}

  <Dialog open={uploadDialog} onClose={()=>setUploadDialog(false)}>

  <DialogTitle>Upload Document</DialogTitle>

  <DialogContent>

  <input
  type="file"
  accept="application/pdf"
  onChange={(e)=>setSelectedFile(e.target.files[0])}
  />

  </DialogContent>

  <DialogActions>

  <Button onClick={()=>setUploadDialog(false)}>
  Cancel
  </Button>

  <Button variant="contained" onClick={handleUploadDocument}>
  Upload
  </Button>

  </DialogActions>

  </Dialog>

  {/* SNACKBARS */}

  <Snackbar open={bookingSnackbar.open} autoHideDuration={4000}
  onClose={()=>setBookingSnackbar({...bookingSnackbar,open:false})}>
  <Alert severity={bookingSnackbar.severity}>
  {bookingSnackbar.message}
  </Alert>
  </Snackbar>

  <Snackbar open={userSnackbar.open} autoHideDuration={4000}
  onClose={()=>setUserSnackbar({...userSnackbar,open:false})}>
  <Alert severity={userSnackbar.severity}>
  {userSnackbar.message}
  </Alert>
  </Snackbar>
</Paper>
  </Box>
  </Box>
  );

  }