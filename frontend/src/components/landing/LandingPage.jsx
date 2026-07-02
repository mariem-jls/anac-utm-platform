import Header from './Header'
import Hero from './Hero'
import ProblemSection from './ProblemSection'
import Solution from './Solution'
import Features from './Features'
import Technologies from './Technologies'
import Demo from './Demo'
import Footer from './Footer'

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0b0e17] text-[#e2e8f0] font-body">
      <div className="noise-overlay" />
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <Solution />
        <Features />
        <Technologies />
         <Demo /> 
      </main>
      <Footer />
    </div>
  )
}

export default LandingPage