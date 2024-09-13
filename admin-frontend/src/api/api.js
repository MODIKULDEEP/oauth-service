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
    return response.data;
  } catch (error) {
    console.error("Error register user", error);
    throw error;
  }
};
export const userData = async () => {
  try {
    const response = await apiClient.get("/api/userdata");
    console.log(response);

    return response.data;
  } catch (error) {
    console.error("Error register user", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await apiClient.post("/auth/userLogout");
    console.log(response.data);

    return response.data;
  } catch (error) {
    console.error("Error in logout", error);
    throw error;
  }
};
export const registerNewApp = async (count) => {
  const data = {
    client_name: "MyApp" + count,
    redirect_uris: [
      "http://localhost:3000/callback",
      "https://oauth.pstmn.io/v1/callback",
    ],
    post_logout_redirect_uris: ["http://localhost:3000/logout-success"],
    response_types: ["code", "id_token"],
  };
  try {
    const response = await apiClient.post("/api/client/register", data);
    console.log(response.data);

    return response.data;
  } catch (error) {
    console.error("Error in register app", error);
    throw error;
  }
};
