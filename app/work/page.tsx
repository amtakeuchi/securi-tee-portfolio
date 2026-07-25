import Link from "next/link";
import { client } from "../../tina/__generated__/client";

async function count(fn: () => Promise<{ length: number }>) {
  try {
    return await fn();
  } catch (_err) {
    return { length: 0 };
  }
}

export default async function WorkPage() {
  const posts = await count(async () => {
    const res = await client.queries.postConnection();
    return { length: (res.data.postConnection.edges ?? []).length };
  });
  const projects = await count(async () => {
    const res = await client.queries.projectConnection();
    return { length: (res.data.projectConnection.edges ?? []).length };
  });

  return (
    <div className="page">
      <div className="wrap">
        <header className="page-head">
          <p className="page-cmd">
            <span className="ps1">adam@securi-tee:~$</span> ls work/
          </p>
          <h1>work</h1>
          <p className="page-lead">
            everything i&apos;ve written, and everything i&apos;ve built. take your pick.
          </p>
        </header>

        <div className="feed">
          <Link className="writeup" href="/blog">
            <span className="date">
              {posts.length} post{posts.length === 1 ? "" : "s"}
            </span>
            <span>
              <h3>blog</h3>
              <p>
                what breaks, what ships, what helps, and what i&apos;m still figuring out.
              </p>
            </span>
            <span className="go" aria-hidden="true">&rarr;</span>
          </Link>

          <Link className="writeup" href="/projects">
            <span className="date">
              {projects.length} project{projects.length === 1 ? "" : "s"}
            </span>
            <span>
              <h3>projects</h3>
              <p>tools, labs, and audits. some new, some reworked.</p>
            </span>
            <span className="go" aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
