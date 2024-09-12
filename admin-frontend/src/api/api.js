import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:8010",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const loginUser = async (data) => {
  try {
    const response = await apiClient.post("/auth/userLogin", data);
    console.log(response.data);

    return response.data;
  } catch (error) {
    console.error("Error login user", error);
    throw error;
  }
};

export const registerUser = async (data) => {
  try {
    const response = await apiClient.post("/auth/register", data);
    console.log(response.data);

    return response.data;
  } catch (error) {
    console.error("Error register user", error);
    throw error;
  }
};

export const protectedData = async () => {
  try {
    const response = await apiClient.get("/api/resource");
    console.log(response);

    return response.data;
  } catch (error) {
    console.error("Error register user", error);
    throw error;
  }
};
