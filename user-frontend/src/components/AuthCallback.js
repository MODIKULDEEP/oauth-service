// src/components/AuthCallback.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const authenticate = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const authorizationCode = urlParams.get("code");

      if (authorizationCode) {
        try {
          await fetch("http://localhost:5000/api/auth/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: authorizationCode }),
          });
          navigate("/dashboard");
        } catch (error) {
          console.error("Error handling authentication callback:", error);
        }
      }
    };

    authenticate();
  }, []);

  return <div>Processing...</div>;
};

export default AuthCallback;
