import Hero from "./components/Hero";
import {
  Values,
  About,
  Classes,
  PersonalTraining,
  Testimonials,
  GetStarted,
  Membership,
  FinalCta,
  Footer,
} from "./components/Sections";
import SiteInteractions from "./components/SiteInteractions";

export default function Home() {
  return (
    <main>
      <Hero />
      <Values />
      <About />
      <Classes />
      <PersonalTraining />
      <Testimonials />
      <GetStarted />
      <Membership />
      <FinalCta />
      <Footer />
      <SiteInteractions />
    </main>
  );
}
