import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { protectedData, userData, registerNewApp, logout } from "../api/api.js";

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
    <>
      <h3>Register Your App</h3>
      <button onClick={createApp}>Create App</button>
      <button onClick={logoutUser}>Logout</button>
      <div className="center">
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>App Name</th>
              <th>Client Id</th>
              <th>Client Secret</th>
            </tr>
          </thead>
          <tbody>
            {registerdApps?.length !== 0 ? (
              registerdApps?.map((app, index) => (
                <tr key={app._id}>
                  <td>{index + 1}</td>
                  <td>{app.client_name}</td>
                  <td>{app.clientId}</td>
                  <td>{app.clientSecret}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>No Data Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
