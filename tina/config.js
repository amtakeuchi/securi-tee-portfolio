import { defineConfig } from "tinacms";
import page from "./collections/page";
import post from "./collections/post";
import project from "./collections/project";

export const config = defineConfig({
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || "local",
  branch:
    process.env.NEXT_PUBLIC_TINA_BRANCH || // custom branch env override
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || // Vercel branch env
    "main", // fallback
  token: process.env.TINA_TOKEN || "local",
  media: {
    tina: {
      publicFolder: "public",
      mediaRoot: "uploads",
    },
  },
  build: {
    publicFolder: "public", // The public asset folder for your framework
    outputFolder: "admin", // within the public folder
  },
  schema: {
    collections: [page, post, project],
  },
  // Use local mode for admin to avoid CORS issues
  localApi: process.env.NODE_ENV === 'development',
});

if (process.env.NODE_ENV === 'production' && !process.env.TINA_TOKEN) {
  console.warn('[tina] No TINA_TOKEN found — admin panel will not authenticate in production.');
}

export default config;
