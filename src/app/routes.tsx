import { createBrowserRouter } from "react-router";
import Layout from "./layout";
import Journey from "./pages/Journey";
import Locator from "./pages/Locator";
import Timeline from "./pages/Timeline";
import Quiz from "./pages/Quiz";
import Chat from "./pages/Chat";
import Candidates from "./pages/Candidates";
import Education from "./pages/Education";
import Support from "./pages/Support";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Journey },
      { path: "locator", Component: Locator },
      { path: "timeline", Component: Timeline },
      { path: "quiz", Component: Quiz },
      { path: "chat", Component: Chat },
      { path: "candidates", Component: Candidates },
      { path: "education", Component: Education },
      { path: "support", Component: Support },
    ],
  },
]);
