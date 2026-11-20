import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every page is rendered per request (it depends on the signed-in user and live
// ratings), so the default configuration without an incremental cache is enough.
const openNextConfig = {
  ...defineCloudflareConfig(),
  // Call Next directly: the project's `build` script switches to OpenNext on Cloudflare
  // (scripts/build.mjs), so letting OpenNext run `npm run build` would loop.
  buildCommand: "npx next build",
};

export default openNextConfig;
