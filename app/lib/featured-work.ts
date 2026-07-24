import { client } from "../../tina/__generated__/client";

export type Track = "offense" | "defense" | "tooling";

export interface Writeup {
  track: Track;
  kind: "blog" | "project";
  date: string;
  href: string;
  title: string;
  desc: string;
  proof: string;
}

const FALLBACK_TRACK: Track = "tooling";

export async function getFeaturedWork(limit = 3): Promise<Writeup[]> {
  let posts: Writeup[] = [];
  let projects: Writeup[] = [];

  try {
    const res = await client.queries.postConnection();
    posts = (res.data.postConnection.edges ?? [])
      .map((edge) => edge?.node)
      .filter((p): p is NonNullable<typeof p> => p != null && !!p.featured)
      .map((p) => ({
        track: (p.track as Track) || FALLBACK_TRACK,
        kind: "blog" as const,
        date: p.date ?? "",
        href: `/blog/${p._sys.filename}`,
        title: p.cardTitle || p.title,
        desc: p.excerpt ?? "",
        proof: p.proof ?? "",
      }));
  } catch (_err) {
    posts = [];
  }

  try {
    const res = await client.queries.projectConnection();
    projects = (res.data.projectConnection.edges ?? [])
      .map((edge) => edge?.node)
      .filter((p): p is NonNullable<typeof p> => p != null && !!p.featured)
      .map((p) => ({
        track: (p.track as Track) || FALLBACK_TRACK,
        kind: "project" as const,
        date: p.date ?? "",
        href: `/projects/${p._sys.filename}`,
        title: p.cardTitle || p.title,
        desc: p.description ?? "",
        proof: p.proof ?? "",
      }));
  } catch (_err) {
    projects = [];
  }

  return [...posts, ...projects]
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    .slice(0, limit);
}
