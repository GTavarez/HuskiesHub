import "./App.css";
import Header from "../Header/Header.jsx";
import Calendar from "../Calendar/Calendar.jsx";
import Main from "../Main/Main.jsx";
import Profile from "../Profile/Profile.jsx";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import React from "react";

function App() {
  const [user, setUser] = React.useState(null);
  const [activeModal, setActiveModal] = React.useState("");
  return (
    <BrowserRouter>
      <div className="page">
        <Header />
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
export default App;
