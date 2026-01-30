import { useWebring } from "../../data/useWebring";
import styles from "./Members.module.css";

export default function Members({ sectionRef }: { sectionRef: React.RefObject<HTMLElement | null> }) {
  const { data } = useWebring();

  return (
    <section ref={sectionRef as any} id="members" className={styles.section}>
      <h2>Members</h2>
      <div className={styles.grid}>
        {data?.sites.map((s) => (
          <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className={styles.card}>
            <h3>{s.name}</h3>
            {s.owner && <p>{s.owner}</p>}
          </a>
        ))}
      </div>
    </section>
  );
}