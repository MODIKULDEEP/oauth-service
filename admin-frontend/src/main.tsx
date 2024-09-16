import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/login-page";
import ClientPage from "./pages/client-page";
import Register from "./pages/register-page";
import CreateApp from "./pages/create-app-page";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Register />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/client",
    element: <ClientPage />,
  },
  {
    path: "/create-app",
    element: <CreateApp />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
