import BallFieldWebGL from "../BallFieldWebGL/BallFieldWebGL";
import styles from "./Hero.module.css";

export default function Hero({
  scatter,
  showUI,
}: {
  scatter: boolean;
  showUI: boolean;
}) {
  return (
    <section className={styles.hero}>
      <BallFieldWebGL scatterAmount={scatter ? 1 : 0} />
      {showUI && (
        <div className={styles.overlay}>
          <div className={styles.logo}>GH</div>
          <h1 className={styles.title}>WLU WEB RING</h1>
          <p className={styles.subtitle}>Laurier CS and DS student portfolios</p>
          <a className={styles.arrow} href="#members">
            ↓
          </a>
        </div>
      )}
    </section>
  );
}