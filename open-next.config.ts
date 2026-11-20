import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every page is rendered per request (it depends on the signed-in user and live
// ratings), so the default configuration without an incremental cache is enough.
export default defineCloudflareConfig();
