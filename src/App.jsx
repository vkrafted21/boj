import React, { useState, useEffect } from "react";
import './App.css';
import { auth, provider, db } from "./firebase";
import { signInWithPopup, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import RecruiterDashboard from "./components/RecruiterDashboard";
import JobSeekerDashboard from "./components/JobSeekerDashboard";
import RoleSelection from "./components/RoleSelection";
import { Button } from "react-bootstrap";

export default function App() {
  const [users, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);

  // Auto logout on browser/tab close
  useEffect(() => {
    const handleUnload = () => auth.signOut();
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setRole(userSnap.data().role);
          setIsNewUser(false);
        } else {
          setIsNewUser(true); // New user must select role
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setRole(null);
        setIsNewUser(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    await setPersistence(auth, browserSessionPersistence);
    const result = await signInWithPopup(auth, provider);
    const loggedUser = result.user;
    setUser(loggedUser);

    const userRef = doc(db, "users", loggedUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      setIsNewUser(true);
    } else {
      setRole(userSnap.data().role);
    }
  };

  const handleLogout = () => signOut(auth);

  return (
    <div className="app-container">
      {!users ? (
        <div className="panel">
          <h1>GigGrid</h1>
          <h2>Find your next gig</h2>
          <Button className="btn-light" onClick={handleGoogleLogin}>
            Login with Google
          </Button>
        </div>
      ) : isNewUser ? (
        <div className="panel2">
          <RoleSelection users={users} setRole={setRole} setIsNewUser={setIsNewUser} />
        </div>
      ) : (
        <div className="dashboard-container">
          <div className="dashboard">
            <div className="d-flex justify-content-end mt-3">
              <Button className="btn-danger" onClick={handleLogout}>Logout</Button>
            </div>
            <h1 className="text-center my-3 text-light">
  {role === "recruiter" ? "Add a Job" : "Find Jobs"}
</h1>
{role === "recruiter" ? (
  <RecruiterDashboard users={users} />
) : (
  <JobSeekerDashboard users={users} />
)}

          </div>
        </div>
      )}
    </div>
  );
}
