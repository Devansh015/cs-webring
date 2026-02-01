import { useEffect } from "react";
import Scene from "./components/Scene/Scene";
import Footer from "./components/Footer/Footer";

const JOIN_FORM_URL = "https://forms.gle/your-placeholder-form";

export default function App() {
  useEffect(() => {
    // Always start at the top on reload
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);
  return (
    <>
      <Scene />
      <Footer joinUrl={JOIN_FORM_URL} />
    </>
  );
}