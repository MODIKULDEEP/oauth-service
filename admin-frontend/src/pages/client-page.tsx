import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userData, registerNewApp, logout } from "../api/api";

interface TokenData {
  _id: string;
  client_name: string;
  clientId: string;
  clientSecret: string;
}
export default function ClientPage() {
  const [registerdApps, setRegisterdApps] = useState<TokenData[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    getData();
  }, []);
  useEffect(() => {}, [registerdApps]);

  const getData = async () => {
    try {
      // const response = await protectedData();
      const userTokenData = await userData();

      setRegisterdApps(userTokenData.tokenData);
    } catch (error) {
      navigate("/login");
    }
  };

  const createApp = async () => {
    try {
      await registerNewApp(registerdApps?.length + 1);
      getData();
    } catch (error) {
      console.log(error);
    }
  };
  const logoutUser = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h3 className="text-2xl font-bold mb-4 text-center">Register Your App</h3>
      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={createApp}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Create App
        </button>
        <button
          onClick={logoutUser}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Logout
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2">No.</th>
              <th className="px-4 py-2">App Name</th>
              <th className="px-4 py-2">Client Id</th>
              <th className="px-4 py-2">Client Secret</th>
            </tr>
          </thead>
          <tbody>
            {registerdApps?.length !== 0 ? (
              registerdApps?.map((app, index) => (
                <tr
                  key={app._id}
                  className={index % 2 === 0 ? "bg-gray-100" : ""}
                >
                  <td className="border px-4 py-2">{index + 1}</td>
                  <td className="border px-4 py-2">{app.client_name}</td>
                  <td className="border px-4 py-2">{app.clientId}</td>
                  <td className="border px-4 py-2">{app.clientSecret}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="border px-4 py-2 text-center">
                  No Data Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
