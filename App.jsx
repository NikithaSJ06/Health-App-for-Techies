import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import Dashboard from './components/dashboard'
import PostureAnalysis from './components/PostureAnalysis'
import MentalHealth from './components/MentalHealth'
import Reminders from './components/Reminders'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="posture" element={<PostureAnalysis />} />
          <Route path="mental-health" element={<MentalHealth />} />
        </Route>
      </Routes>
    </Router>
    
  )
}

export default App