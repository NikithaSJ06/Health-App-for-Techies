import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/authContext";
import RootLayout from "./layout/RootLayout";
import Dashboard from "./pages/Dashboard";
import PostureCorrector from "./components/PostureCorrector";
import PredictiveAnalytics from "./pages/PredictiveAnalytics";
import SettingsPage from "./pages/SettingsPage";
import Ergonomics from "./components/Ergonomics";
import IntroPage from "./components/IntroPage";
import LoginPage from "./components/LoginPage";
import './App.css';

function App() {
  return (
    <Router>
        <Routes>
          
          {/* Main App - Protected Routes */}
          <Route path="/app" element={<RootLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="posture" element={<PostureCorrector />} />
            <Route path="analytics" element={<PredictiveAnalytics />} />
            <Route path="ergonomics" element={<Ergonomics />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
    </Router>
  );
}

export default App;