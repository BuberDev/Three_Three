import FeaturesSection from '../components/FeaturesSection'
import Footer from '../components/Footer'
import HeroSection from '../components/HeroSection'
import IntelligenceSection from '../components/IntelligenceSection'
import MobileDownloadSection from '../components/MobileDownloadSection'
import Navigation from '../components/Navigation'

export default function HomePage() {
    return (
        <main className="relative">
            <Navigation />
            <HeroSection />
            <FeaturesSection />
            <IntelligenceSection />
            <MobileDownloadSection />
            <Footer />
        </main>
    )
}