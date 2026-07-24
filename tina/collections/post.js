/**
 * @type {import('tinacms').Collection}
 */
export default {
  label: "Blog Posts",
  name: "post",
  path: "content/post",
  format: "mdx",
  fields: [
    {
      type: "string",
      label: "Title",
      name: "title",
      required: true,
    },
    {
      type: "string",
      label: "Excerpt",
      name: "excerpt",
      description: "A brief summary of the post",
      ui: {
        component: "textarea",
      },
    },
    {
      type: "datetime",
      label: "Date",
      name: "date",
      required: true,
    },
    {
      type: "string",
      label: "Author",
      name: "author",
      defaultValue: "Adam",
    },
    {
      type: "image",
      label: "Featured Image",
      name: "featuredImage",
    },
    {
      type: "boolean",
      label: "Featured on homepage",
      name: "featured",
      description: "Show this in the homepage highlight strip (hero + recent work)",
    },
    {
      type: "string",
      label: "Track",
      name: "track",
      options: ["offense", "defense", "tooling"],
    },
    {
      type: "string",
      label: "Homepage proof line",
      name: "proof",
      description: "Short stat/hook shown only on the homepage highlight card, e.g. '5 vulns found and fixed'",
    },
    {
      type: "string",
      label: "Homepage card title",
      name: "cardTitle",
      description: "Optional short title for the homepage highlight card. Falls back to the title above if left blank.",
    },
    {
      type: "rich-text",
      label: "Blog Post Body",
      name: "body",
      isBody: true,
    },
  ],
  ui: {
    router: ({ document }) => {
      return `/blog/${document._sys.filename}`;
    },
  },
}; 