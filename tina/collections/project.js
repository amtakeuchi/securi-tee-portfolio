/**
 * @type {import('tinacms').Collection}
 */
export default {
  label: "Projects",
  name: "project",
  path: "content/projects",
  format: "md",
  fields: [
    {
      type: "string",
      name: "title",
      label: "Project Title",
      isTitle: true,
      required: true,
    },
    {
      type: "string",
      name: "category",
      label: "Category",
    },
    {
      type: "image",
      name: "thumbnail",
      label: "Thumbnail Image",
    },
    {
      type: "string",
      name: "description",
      label: "Description",
      ui: {
        component: "textarea",
      },
    },
    {
      type: "string",
      name: "liveLink",
      label: "Live Site Link",
    },
    {
      type: "string",
      name: "repoLink",
      label: "Repository Link",
    },
    {
      type: "datetime",
      name: "date",
      label: "Date",
    },
    {
      type: "boolean",
      name: "featured",
      label: "Featured on homepage",
      description: "Show this in the homepage highlight strip (hero + recent work)",
    },
    {
      type: "string",
      name: "track",
      label: "Track",
      options: ["offense", "defense", "etc"],
    },
    {
      type: "string",
      name: "proof",
      label: "Homepage proof line",
      description: "Short stat/hook shown only on the homepage highlight card, e.g. '5 vulns found and fixed'",
    },
    {
      type: "string",
      name: "cardTitle",
      label: "Homepage card title",
      description: "Optional short title for the homepage highlight card. Falls back to the title above if left blank.",
    },
    {
      type: "rich-text",
      name: "body",
      label: "Body",
      isBody: true,
    },
  ],
  ui: {
    router: ({ document }) => {
      return `/projects/${document._sys.filename}`;
    },
  },
}; 