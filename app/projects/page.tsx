import Link from "next/link";
import { client } from "../../tina/__generated__/client";

export default async function ProjectsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let projects: any[] = [];

  try {
    const res = await client.queries.projectConnection();
    projects =
      res.data.projectConnection.edges
        ?.map((edge) => edge?.node)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((p): p is any => p != null) ?? [];
  } catch (_err) {
    // tina layer unavailable during build: render an empty list, not a crash
    projects = [];
  }

  return (
    <div className="page">
      <div className="wrap">
        <header className="page-head">
          <p className="page-cmd">
            <span className="ps1">adam@securi-tee:~$</span> ls projects/
          </p>
          <h1>projects</h1>
          <p className="page-lead">
            tools, labs, and audits. some new, some reworked. source is on github
            where it makes sense.
          </p>
        </header>

        {projects.length > 0 ? (
          <div className="feed">
            {projects.map((project) => (
              <Link
                key={project.id}
                className="writeup"
                href={`/projects/${project._sys.filename}`}
              >
                <span className="date">{project.category ?? "project"}</span>
                <span>
                  <h3>{project.title}</h3>
                  {project.description && <p>{project.description}</p>}
                </span>
                <span className="go" aria-hidden="true">&rarr;</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="feed-state" data-on="true">
            <span className="ps1">$</span> ls projects/<br />
            nothing here yet. builds are in the lab queue.
          </div>
        )}
      </div>
    </div>
  );
}
