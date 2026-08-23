import { createClient } from "tinacms/dist/client";
import { queries } from "./types.js";
export const client = createClient({ cacheDir: "/Users/hermes/Documents/securi-tee-tinacms/tina/__generated__/.cache/1787527626325", url: "http://localhost:4001/graphql", token: "local", queries });
export default client;
