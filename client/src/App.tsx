import { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { isLoggedIn } from "./auth";
import useDarkMode from "./lib/useDarkMode";
import FeedPage from "./pages/FeedPage";
import FeedsPage from "./pages/FeedsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

function App() {
  const colorScheme = useDarkMode();

  const loggedIn = isLoggedIn();

  useEffect(() => {
    if (!loggedIn) {
      window.location.href = "/#/login";
    } else {
      window.location.href = "/#/feed";
    }
  }, [loggedIn]);

  return (
    <div
      className={`App ${loggedIn ? "logged-in" : ""} ${
        colorScheme === "dark" ? "dark-theme" : ""
      }`}
    >
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/feeds" element={<FeedsPage />} />
        </Routes>
      </HashRouter>
    </div>
  );
}

export default App;
