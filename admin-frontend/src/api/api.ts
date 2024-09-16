import axios, { AxiosResponse } from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:8010",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

interface UserData {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  password: string;
}

interface AppData {
  client_name: string;
  redirect_uris: string[];
  post_logout_redirect_uris: string[];
  response_types: string[];
}

export const loginUser = async (data: UserData): Promise<any> => {
  try {
    const response: AxiosResponse<any> = await apiClient.post(
      "/auth/userLogin",
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error login user", error);
    throw error;
  }
};

export const registerUser = async (data: RegisterData): Promise<any> => {
  try {
    const response: AxiosResponse<any> = await apiClient.post(
      "/auth/register",
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error register user", error);
    throw error;
  }
};

export const protectedData = async (): Promise<any> => {
  try {
    const response: AxiosResponse<any> = await apiClient.get("/api/resource");
    return response.data;
  } catch (error) {
    console.error("Error fetching protected data", error);
    throw error;
  }
};

export const userData = async (): Promise<any> => {
  try {
    const response: AxiosResponse<any> = await apiClient.get("/api/userdata");
    return response.data;
  } catch (error) {
    console.error("Error fetching user data", error);
    throw error;
  }
};

export const logout = async (): Promise<any> => {
  try {
    const response: AxiosResponse<any> = await apiClient.post(
      "/auth/userLogout"
    );
    return response.data;
  } catch (error) {
    console.error("Error in logout", error);
    throw error;
  }
};

export const registerNewApp = async (count: number): Promise<any> => {
  const data: AppData = {
    client_name: "MyApp" + count,
    redirect_uris: [
      "http://localhost:3000/callback",
      "https://oauth.pstmn.io/v1/callback",
    ],
    post_logout_redirect_uris: ["http://localhost:3000/logout-success"],
    response_types: ["code", "id_token"],
  };
  try {
    const response: AxiosResponse<any> = await apiClient.post(
      "/api/client/register",
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error in register app", error);
    throw error;
  }
};
