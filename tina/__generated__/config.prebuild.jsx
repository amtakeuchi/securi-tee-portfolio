// tina/config.js
import { defineConfig } from "tinacms";

// tina/collections/page.js
var page_default = {
  label: "Page Content",
  name: "page",
  path: "content/page",
  format: "mdx",
  fields: [
    {
      name: "body",
      label: "Main Content",
      type: "rich-text",
      isBody: true
    }
  ],
  ui: {
    router: ({ document }) => {
      if (document._sys.filename === "home") {
        return `/`;
      }
      return void 0;
    }
  }
};

// tina/collections/post.js
var post_default = {
  label: "Blog Posts",
  name: "post",
  path: "content/post",
  format: "mdx",
  fields: [
    {
      type: "string",
      label: "Title",
      name: "title",
      required: true
    },
    {
      type: "string",
      label: "Excerpt",
      name: "excerpt",
      description: "A brief summary of the post",
      ui: {
        component: "textarea"
      }
    },
    {
      type: "datetime",
      label: "Date",
      name: "date",
      required: true
    },
    {
      type: "string",
      label: "Author",
      name: "author",
      defaultValue: "Adam"
    },
    {
      type: "image",
      label: "Featured Image",
      name: "featuredImage"
    },
    {
      type: "boolean",
      label: "Featured on homepage",
      name: "featured",
      description: "Show this in the homepage highlight strip (hero + recent work)"
    },
    {
      type: "string",
      label: "Track",
      name: "track",
      options: ["offense", "defense", "tooling"]
    },
    {
      type: "string",
      label: "Homepage proof line",
      name: "proof",
      description: "Short stat/hook shown only on the homepage highlight card, e.g. '5 vulns found and fixed'"
    },
    {
      type: "string",
      label: "Homepage card title",
      name: "cardTitle",
      description: "Optional short title for the homepage highlight card. Falls back to the title above if left blank."
    },
    {
      type: "rich-text",
      label: "Blog Post Body",
      name: "body",
      isBody: true
    }
  ],
  ui: {
    router: ({ document }) => {
      return `/blog/${document._sys.filename}`;
    }
  }
};

// tina/collections/project.js
var project_default = {
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
      required: true
    },
    {
      type: "string",
      name: "category",
      label: "Category"
    },
    {
      type: "image",
      name: "thumbnail",
      label: "Thumbnail Image"
    },
    {
      type: "string",
      name: "description",
      label: "Description",
      ui: {
        component: "textarea"
      }
    },
    {
      type: "string",
      name: "liveLink",
      label: "Live Site Link"
    },
    {
      type: "string",
      name: "repoLink",
      label: "Repository Link"
    },
    {
      type: "datetime",
      name: "date",
      label: "Date"
    },
    {
      type: "boolean",
      name: "featured",
      label: "Featured on homepage",
      description: "Show this in the homepage highlight strip (hero + recent work)"
    },
    {
      type: "string",
      name: "track",
      label: "Track",
      options: ["offense", "defense", "tooling"]
    },
    {
      type: "string",
      name: "proof",
      label: "Homepage proof line",
      description: "Short stat/hook shown only on the homepage highlight card, e.g. '5 vulns found and fixed'"
    },
    {
      type: "string",
      name: "cardTitle",
      label: "Homepage card title",
      description: "Optional short title for the homepage highlight card. Falls back to the title above if left blank."
    },
    {
      type: "rich-text",
      name: "body",
      label: "Body",
      isBody: true
    }
  ],
  ui: {
    router: ({ document }) => {
      return `/projects/${document._sys.filename}`;
    }
  }
};

// tina/config.js
var config = defineConfig({
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || "local",
  branch: process.env.NEXT_PUBLIC_TINA_BRANCH || // custom branch env override
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || // Vercel branch env
  "main",
  // fallback
  token: process.env.TINA_TOKEN || process.env.NEXT_PUBLIC_TINA_TOKEN || "local",
  media: {
    // If you wanted cloudinary do this
    // loadCustomStore: async () => {
    //   const pack = await import("next-tinacms-cloudinary");
    //   return pack.TinaCloudCloudinaryMediaStore;
    // },
    // this is the config for the tina cloud media store
    tina: {
      publicFolder: "public",
      mediaRoot: "uploads"
    }
  },
  build: {
    publicFolder: "public",
    // The public asset folder for your framework
    outputFolder: "admin"
    // within the public folder
  },
  schema: {
    collections: [page_default, post_default, project_default]
  },
  // Use local mode for admin to avoid CORS issues
  localApi: true
});
if (false) {
  console.warn("[tina] No TINA_TOKEN found \u2014 admin panel will not authenticate in production.");
}
var config_default = config;
export {
  config,
  config_default as default
};
