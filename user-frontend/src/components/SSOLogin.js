// src/components/SSOLogin.js
import React from "react";

const CLIENT_ID = "client_7ebu7zp25";
const REDIRECT_URI = "http://localhost:3000/callback";
const SSO_AUTHORIZE_URL = `http://localhost:8010/auth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;

const SSOLogin = () => {
  const handleLogin = () => {
    window.location.href = SSO_AUTHORIZE_URL;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">SSO Login</h1>
      <button 
        onClick={handleLogin}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Login with SSO
      </button>
    </div>
  );
};

export default SSOLogin;
