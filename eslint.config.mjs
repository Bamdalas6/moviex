import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [".next/**", ".open-next/**", ".wrangler/**", "node_modules/**", "drizzle/**", "next-env.d.ts", "storage/**", "data/**"],
  },
];

export default config;
