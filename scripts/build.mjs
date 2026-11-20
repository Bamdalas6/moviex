// `npm run build` entry point.
//
// Cloudflare Workers Builds runs the project's build script and then `wrangler deploy`,
// which hands off to `opennextjs-cloudflare deploy` and expects the OpenNext output to
// exist already. Workers Builds sets WORKERS_CI=1, so there we build the Worker with
// OpenNext; everywhere else (local, regular Node hosting) this is a plain `next build`.
//
// OpenNext itself runs `npx next build` (see open-next.config.ts), so this never recurses.
import { spawnSync } from "node:child_process";

const onCloudflare = ["1", "true"].includes(String(process.env.WORKERS_CI ?? "").toLowerCase());
const [command, args] = onCloudflare ? ["opennextjs-cloudflare", ["build"]] : ["next", ["build"]];

console.log(onCloudflare ? "Cloudflare Workers Builds detected: building the Worker with OpenNext" : "Building Next.js");

const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
process.exit(result.status ?? 1);
