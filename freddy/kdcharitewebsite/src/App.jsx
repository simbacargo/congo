import { MotionConfig, AnimatePresence } from 'framer-motion';
import { Routes, Route, useLocation } from 'react-router-dom';

import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import { ScrollManager } from './components/Page.jsx';

import Home from './pages/Home.jsx';
import HowItWorksPage from './pages/HowItWorksPage.jsx';
import Programs from './pages/Programs.jsx';
import Impact from './pages/Impact.jsx';
import Stories from './pages/Stories.jsx';
import About from './pages/About.jsx';
import FAQPage from './pages/FAQPage.jsx';
import Donate from './pages/Donate.jsx';
import NotFound from './pages/NotFound.jsx';

// Routes are keyed by pathname so AnimatePresence can cross-fade between pages.
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/impact" element={<Impact />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    // MotionConfig honours the user's OS-level reduced-motion preference for
    // every Framer Motion animation in the tree.
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#0a0f0d]">
        <ScrollManager />
        <Navbar />
        <AnimatedRoutes />
        <Footer />
      </div>
    </MotionConfig>
  );
}
