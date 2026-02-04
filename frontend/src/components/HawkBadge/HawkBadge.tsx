import styles from "./HawkBadge.module.css";
import hawkSrc from "../../assets/golden-hawk.png";

export default function HawkBadge() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <div className={styles.badge}>
        <img
          src={hawkSrc}
          alt=""
          className={styles.img}
          draggable={false}
        />
      </div>
    </div>
  );
}