import Link from "next/link";
import { client } from "../../tina/__generated__/client";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function BlogPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let posts: Array<{ date: string; [key: string]: any }> = [];

  try {
    const res = await client.queries.postConnection();
    posts = (res.data.postConnection.edges ?? [])
      .map((edge) => edge?.node)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((p): p is any => p != null && !!p.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (_err) {
    // tina layer unavailable during build: render an empty list, not a crash
    posts = [];
  }

  return (
    <div className="page">
      <div className="wrap">
        <header className="page-head">
          <p className="page-cmd">
            <span className="ps1">adam@securi-tee:~$</span> ls blog/
          </p>
          <h1>blog</h1>
          <p className="page-lead">
            what breaks, what ships, what helps, and what i&apos;m still figuring out.
            no polish, just what actually happened.
          </p>
        </header>

        {posts.length > 0 ? (
          <div className="feed">
            {posts.map((post) => (
              <Link
                key={post.id}
                className="writeup"
                href={`/blog/${post._sys.filename}`}
              >
                <span className="date">{fmtDate(post.date)}</span>
                <span>
                  <h3>{post.title}</h3>
                  {post.excerpt && <p>{post.excerpt}</p>}
                </span>
                <span className="go" aria-hidden="true">&rarr;</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="feed-state" data-on="true">
            <span className="ps1">$</span> ls blog/<br />
            nothing here yet. the archive is warming up.
          </div>
        )}
      </div>
    </div>
  );
}
