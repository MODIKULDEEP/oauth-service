import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { protectedData } from "../api/api.js";
export default function ClientPage() {
  const navigate = useNavigate();
  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    try {
      const response = await protectedData();
      console.log(response);
    } catch (error) {
      navigate("/login");
    }
  };

  return <>This Is Client Page</>;
}
