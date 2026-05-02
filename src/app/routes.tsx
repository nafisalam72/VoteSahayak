import { lazy } from "react";
import { createBrowserRouter } from "react-router";
import Layout from "./layout";

const Login = lazy(() => import("./pages/Login"));
const Journey = lazy(() => import("./pages/Journey"));
const Locator = lazy(() => import("./pages/Locator"));
const Timeline = lazy(() => import("./pages/Timeline"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Chat = lazy(() => import("./pages/Chat"));
const Candidates = lazy(() => import("./pages/Candidates"));
const Education = lazy(() => import("./pages/Education"));
const Support = lazy(() => import("./pages/Support"));

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
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
