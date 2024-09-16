// src/components/Dashboard.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/protected");
        setData(response.data);
      } catch (error) {
        setError("Failed to fetch data");
        console.error("Error fetching protected data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-4xl font-bold mb-6">Dashboard</h1>
      {error && <p className="text-red-500 mb-4">Error: {error}</p>}
      {data ? (
        <div className="bg-white p-4 rounded shadow-md w-full max-w-4xl overflow-auto">
          <p className="text-lg mb-4">{data.message}</p>
          <div className="bg-gray-200 p-4 rounded">
            <h2 className="text-2xl font-bold mb-2">Token Data</h2>
            {data.tokenData.map((token) => (
              <div key={token._id} className="mb-4">
                <p><strong>Client Name:</strong> {token.client_name}</p>
                <p><strong>Client ID:</strong> {token.clientId}</p>
                <p><strong>Client Secret:</strong> {token.clientSecret}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Loading...</p>
      )}
    </div>
  );
};

export default Dashboard;
