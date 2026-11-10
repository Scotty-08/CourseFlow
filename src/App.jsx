import { Navigate, Route, Routes } from 'react-router-dom'
import SiteHeader from './components/SiteHeader.jsx'
import CourseDetails from './pages/CourseDetails.jsx'
import Enrollment from './pages/Enrollment.jsx'
import Home from './pages/Home.jsx'
import Payment from './pages/Payment.jsx'

function App() {
  return (
    <div className="min-h-screen bg-[var(--color-espresso)] text-[var(--color-text)]">
      <SiteHeader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/course-details" element={<CourseDetails />} />
        <Route path="/enrollment" element={<Enrollment />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
