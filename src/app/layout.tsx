import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { MotionProvider } from "@/components/motion/motion-provider";
import { THEME_COOKIE, type ThemePreference } from "@/lib/constants";
import "./globals.css";

const appFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-app",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Watch Nollywood — films rated by real fans", template: "%s · Watch Nollywood" },
  description: "Discover, rate and review the best of Nollywood.",
  applicationName: "Watch Nollywood",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0F11" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Theme is resolved on the server from a cookie, so there is no flash of the wrong theme.
  const theme = (await cookies()).get(THEME_COOKIE)?.value as ThemePreference | undefined;
  const dataTheme = theme === "light" || theme === "dark" ? theme : undefined;

  return (
    <html lang="en" data-theme={dataTheme} className={appFont.variable}>
      <body>
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-card px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <MotionProvider />
        {children}
      </body>
    </html>
  );
}
