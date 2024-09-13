// src/components/SSOLogin.js
import React from "react";

const CLIENT_ID = "client_euufn7mv2";
const REDIRECT_URI = "http://localhost:3000/callback";
const SSO_AUTHORIZE_URL = `http://localhost:8010/auth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;

const SSOLogin = () => {
  const handleLogin = () => {
    window.location.href = SSO_AUTHORIZE_URL;
  };

  return (
    <div>
      <h1>SSO Login</h1>
      <button onClick={handleLogin}>Login with SSO</button>
    </div>
  );
};

export default SSOLogin;
