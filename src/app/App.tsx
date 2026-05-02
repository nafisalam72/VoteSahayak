import { RouterProvider } from "react-router";
import { router } from "./routes";

export default function App() {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen selection:bg-orange-500 selection:text-white font-sans antialiased">
      <RouterProvider router={router} />
    </div>
  );
}