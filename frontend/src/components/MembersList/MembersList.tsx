import { useMemo, useState, useRef, useEffect } from "react";
import Fuse from "fuse.js";
import styles from "./MembersList.module.css";

export type Site = {
  id: string;
  name: string;
  url?: string;
  website?: string;
  description?: string;
  owner?: string;
  added?: string;
  year?: number;
};

function domainFromUrl(url: string) {
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

function normalizeUrl(site: Site): string {
  return (site.url || site.website || "").trim();
}

export default function MembersList({ sites }: { sites?: Site[] } = {}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [loadedSites, setLoadedSites] = useState<Site[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load from /members.json if not passed in
  useEffect(() => {
    if (sites && sites.length > 0) {
      setLoadedSites(sites);
      return;
    }

    fetch("/members.json", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load members.json");
        return res.json();
      })
      .then((data) => {
        let normalized: Site[] = [];
        if (Array.isArray(data)) {
          normalized = data.map((item: any, idx: number) => ({
            id: item.id || `member-${idx}`,
            name: item.name || "",
            url: item.url || item.website || "",
            website: item.website || item.url || "",
            year: item.year,
            description: item.description,
            owner: item.owner,
          }));
        } else if (data.members && Array.isArray(data.members)) {
          normalized = data.members.map((item: any, idx: number) => ({
            id: item.id || `member-${idx}`,
            name: item.name || "",
            url: item.url || item.website || "",
            website: item.website || item.url || "",
            year: item.year,
            description: item.description,
            owner: item.owner,
          }));
        }
        setLoadedSites(normalized);
      })
      .catch((err) => {
        console.error("Error loading members:", err);
        setLoadedSites(sites || []);
      });
  }, [sites]);

  const fuse = useMemo(
    () =>
      new Fuse(loadedSites, {
        keys: ["name", "url", "owner", "description"],
        threshold: 0.35,
      }),
    [loadedSites]
  );

  const results = useMemo(() => {
    if (!query.trim()) return loadedSites;
    return fuse.search(query).map((r) => r.item);
  }, [query, fuse, loadedSites]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={styles.wrap}>
      <div className={styles.searchRow}>
        <span className={`${styles.icon} ${focused ? styles.iconFocused : ""}`}>🔍</span>
        <input
          ref={inputRef}
          className={styles.search}
          type="search"
          placeholder="search by site/year"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Search members"
        />
      </div>
      <div className={styles.rule} />
      <div className={styles.grid}>
        {results.map((site) => {
          const url = normalizeUrl(site);
          return (
            <a
              key={site.id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.item}
            >
              {domainFromUrl(url)}
            </a>
          );
        })}
      </div>
    </div>
  );
}
