import { useState, useEffect } from "react";
import Login from "./Login";
import BookingSystem from "./BookingSystem";
import AdminPage from "./AdminPage";

const ADMIN_EMAIL = "jeswinjohnson54@gmail.com";

function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error(err));
  }, []);

  if (!currentUser) {
    return (
      <Login
        users={users}
        onLogin={(user) => setCurrentUser(user)}
      />
    );
  }

  // Check if the logged-in user is admin
  const userEmail = typeof currentUser === "object" ? currentUser.email : currentUser;
  if (userEmail === ADMIN_EMAIL) {
    return <AdminPage currentUser={currentUser} />;
  }

  return <BookingSystem currentUser={currentUser} />;
}

export default App;