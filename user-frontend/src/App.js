// src/App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SSOLogin from "./components/SSOLogin";
import AuthCallback from "./components/AuthCallback";
import Dashboard from "./components/Dashboard";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<SSOLogin />} />
      </Routes>
    </Router>
  );
};

export default App;
