import Header from "../components/landing/Header";
import Hero from "../components/landing/Hero";
import Services from "../components/landing/Services";
import FeaturedTours from "../components/landing/FeaturedTours";
import HotelsSection from "../components/landing/HotelsSection";
import VipFleet from "../components/landing/VipFleet";
import Destinations from "../components/landing/Destinations";
import WhyUs from "../components/landing/WhyUs";
import Reviews from "../components/landing/Reviews";
import ContactForm from "../components/landing/ContactForm";
import MapSection from "../components/landing/MapSection";
import Footer from "../components/landing/Footer";
import WhatsAppFloat from "../components/landing/WhatsAppFloat";

export default function LandingPage() {
  return (
    <div className="App min-h-screen bg-cream-50">
      <Header />
      <main>
        <Hero />
        <Services />
        <HotelsSection />
        <FeaturedTours />
        <VipFleet />
        <Destinations />
        <WhyUs />
        <Reviews />
        <ContactForm />
        <MapSection />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
