import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Admin from './pages/Admin';
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import CollectionDetail from './pages/CollectionDetail';
import DesignServices from './pages/DesignServices';
import ManagementServices from './pages/ManagementServices';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

export default function App() {
  const location = useLocation();

  // The admin panel is a standalone app — no public navbar/footer.
  if (location.pathname.startsWith('/admin')) {
    return (
      <Routes>
        <Route path="/admin" element={<Admin />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Navbar />
      <main className="flex-grow pt-[80px]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/propriedades" element={<Properties />} />
          <Route path="/collection/:id" element={<CollectionDetail />} />
          <Route path="/properties/:id" element={<CollectionDetail />} />
          <Route path="/propriedades/:id" element={<CollectionDetail />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/properties/:propertySlug/:id" element={<PropertyDetail />} />
          <Route path="/propriedades/:propertySlug/:id" element={<PropertyDetail />} />
          <Route path="/design-services" element={<DesignServices />} />
          <Route path="/servicos/design" element={<DesignServices />} />
          <Route path="/management-services" element={<ManagementServices />} />
          <Route path="/servicos/gestao" element={<ManagementServices />} />
          <Route path="/about" element={<About />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
