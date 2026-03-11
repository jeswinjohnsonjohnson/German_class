import { useState, useEffect } from "react";
import Login from "./Login";
import BookingSystem from "./BookingSystem";
import AdminPage from "./AdminPage";

const ADMIN_EMAIL = "flockawyn@gmail.com";

function App() {
  const storedUser = localStorage.getItem("user"); // get persisted user
  const [currentUser, setCurrentUser] = useState(storedUser ? JSON.parse(storedUser) : null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/users`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err));
  }, []);

  const handleLogin = (user) => {
    localStorage.setItem("user", JSON.stringify(user)); // save to localStorage
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("user"); // remove user on logout
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login users={users} onLogin={handleLogin} />;
  }

  const userEmail = typeof currentUser === "object" ? currentUser.email : currentUser;
  if (userEmail === ADMIN_EMAIL) {
    return <AdminPage currentUser={currentUser} onLogout={handleLogout} />;
  }

  return <BookingSystem currentUser={currentUser} onLogout={handleLogout} />;
}
///
//
export default App;