import Scene from "./components/Scene/Scene";
import Footer from "./components/Footer/Footer";

const JOIN_FORM_URL = "https://forms.gle/your-placeholder-form";

export default function App() {
  return (
    <>
      <Scene />
      <Footer joinUrl={JOIN_FORM_URL} />
    </>
  );
}