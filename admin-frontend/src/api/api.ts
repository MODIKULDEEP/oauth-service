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
  mode: 'test' | 'production';
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

export const registerNewApp = async (data: AppData): Promise<any> => {
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

export const getAppDetails = async (appId: string): Promise<any> => {
  try {
    const response: AxiosResponse<any> = await apiClient.get(`/api/client/${appId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching app details", error);
    throw error;
  }
};

export const updateApp = async (appId: string, data: AppData): Promise<any> => {
  try {
    const response: AxiosResponse<any> = await apiClient.put(`/api/client/${appId}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating app", error);
    throw error;
  }
};
