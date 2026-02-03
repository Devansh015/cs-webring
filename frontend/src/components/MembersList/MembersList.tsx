import { useMemo, useState, useRef, useEffect } from "react";
import Fuse from "fuse.js";
import styles from "./MembersList.module.css";

export type Site = {
  id: string;
  name: string;
  url: string;
  description?: string;
  owner?: string;
  added?: string;
};

function domainFromUrl(url: string) {
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

export default function MembersList({ sites }: { sites: Site[] }) {
  const [q, setQ] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);

  // Configure Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    const sitesWithDomain = sites.map((s) => ({
      ...s,
      domain: domainFromUrl(s.url),
    }));
    return new Fuse(sitesWithDomain, {
      includeScore: false,
      threshold: 0.3,
      keys: ["name", "owner", "domain", "added", "description"],
    });
  }, [sites]);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    
    let filtered;
    if (!query) {
      filtered = sites.map((s) => ({ ...s, domain: domainFromUrl(s.url) }));
    } else {
      // Use Fuse.js fuzzy search
      const results = fuse.search(query);
      filtered = results.map((result) => result.item);
    }

    return filtered.sort((a, b) => a.domain.localeCompare(b.domain));
  }, [q, sites, fuse]);

  // Sticky search bar with table clipping on scroll (like the example)
  useEffect(() => {
    const handleScroll = () => {
      const table = tableRef.current;
      const search = searchRef.current;
      if (!table || !search) return;

      const tableTop = table.getBoundingClientRect().top;
      const searchBottom = search.getBoundingClientRect().bottom;
      const searchHeight = search.clientHeight;

      table.style.clipPath = "none";
      let difference = 0;

      if (tableTop < 0) {
        difference = tableTop * -1 + searchHeight + 25;
      } else if (tableTop <= searchBottom) {
        difference = Math.abs(tableTop - searchBottom) + 25;
      } else if (tableTop > searchBottom && Math.abs(tableTop - searchBottom) < 25) {
        difference = 25 - Math.abs(tableTop - searchBottom);
      }

      if (tableTop <= 50) {
        table.style.clipPath = `inset(${difference}px 0 0 0)`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className={styles.wrap} aria-label="Members">
      <div ref={searchRef} className={styles.searchRow}>
        <span 
          className={`${styles.icon} ${isSearchFocused ? styles.iconFocused : ""}`} 
          aria-hidden="true"
        >
          ⌕
        </span>
        <input
          className={styles.search}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholder="search by site/name/year"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className={styles.rule} />

      <div ref={tableRef} className={styles.grid}>
        {rows.length > 0 ? (
          rows.map((s) => (
            <a key={s.id} className={styles.item} href={s.url} target="_blank" rel="noreferrer" title={s.url}>
              {s.domain}
            </a>
          ))
        ) : (
          <p className={styles.noResults}>No sites found</p>
        )}
      </div>
    </section>
  );
}