import axios from "axios";

const API = axios.create({
  baseURL: "https://eiupslxog9.execute-api.us-east-1.amazonaws.com/api/",
});

// Add a request interceptor to automatically attach the token from localStorage
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("fittrack-app-token");
    console.log(token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("No token found in localStorage for request to:", config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("401 Unauthorized - Token may be invalid or expired");
      console.error("Error details:", error.response?.data);
      // Optionally clear invalid token
      // localStorage.removeItem("fittrack-app-token");
    }
    return Promise.reject(error);
  }
);

export const UserSignUp = async (data) => API.post("/user/signup", data);
export const UserSignIn = async (data) => API.post("/user/signin", data);

export const getDashboardDetails = async () => API.get("/user/dashboard");

export const getWorkouts = async (date) =>
  API.get("/user/workout", {
    params: date ? { date } : undefined,
  });

export const addWorkout = async (data) => API.post("/user/workout", data);
