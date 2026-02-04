import styles from "./NavBar.module.css";

export default function NavBar({ joinUrl }: { joinUrl: string }) {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <a className={styles.brand} href="#">
          WLU Web Ring
        </a>
        <div className={styles.links}>
          <a href="#members">Members</a>
          <a className={styles.join} href={joinUrl} target="_blank" rel="noreferrer">
            Join
          </a>
        </div>
      </nav>
    </header>
  );
}