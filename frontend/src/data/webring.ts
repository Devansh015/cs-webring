import members from "../../../data/members.json";

// members.json is a plain array of { name, year, website }
// Normalize to the WebringSite shape expected by the app
export const sites = (members as Array<{ name: string; year?: number; website: string }>).map(
  (m, idx) => ({
    id: `member-${idx}`,
    name: m.name,
    url: m.website,
    year: m.year,
  })
);
