import { Navigate, Route, Routes } from 'react-router-dom'
import SiteFooter from './components/SiteFooter.jsx'
import SiteHeader from './components/SiteHeader.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import CourseDetails from './pages/CourseDetails.jsx'
import Home from './pages/Home.jsx'
import Planner from './pages/Planner.jsx'
import Receipt from './pages/Receipt.jsx'

function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/course/:id" element={<CourseDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/checkout/:semesterId" element={<Checkout />} />
        <Route path="/receipt/:semesterId" element={<Receipt />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SiteFooter />
    </>
  )
}

export default App
