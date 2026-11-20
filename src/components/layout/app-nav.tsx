"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/server/actions/auth";
import { Icon, type IconName } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type NavUser = { name: string; username: string; avatarColor: string; role: string } | null;

const TABS: { label: string; href: string; icon: IconName; match: (p: string) => boolean }[] = [
  { label: "Home", href: "/", icon: "home", match: (p) => p === "/" },
  { label: "Discover", href: "/discover", icon: "search", match: (p) => p.startsWith("/discover") || p.startsWith("/films") },
  { label: "Upload", href: "/upload", icon: "upload", match: (p) => p.startsWith("/upload") },
  { label: "Reviews", href: "/reviews", icon: "reviews", match: (p) => p.startsWith("/reviews") },
  { label: "Cinemas", href: "/cinemas", icon: "cinema", match: (p) => p.startsWith("/cinemas") },
  { label: "Profile", href: "/profile", icon: "profile", match: (p) => p.startsWith("/profile") || p.startsWith("/u/") },
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 text-cta", className)}>
      <Icon name="ticket" size={30} strokeWidth={2.2} />
      <span className="text-[22px] font-bold tracking-[-0.5px]">marquee</span>
    </Link>
  );
}

/** The account pill (menu icon + avatar) and its dropdown. */
function AccountMenu({ user }: { user: NavUser }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);
  const item = "flex items-center gap-3 px-4 py-2.5 text-[15px] hover:bg-field";

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user ? "Account menu" : "Log in or sign up"}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-3 rounded-full border border-card-line py-1.5 pr-1.5 pl-3.5 transition hover:shadow-card",
          open && "shadow-card",
        )}
      >
        <Icon name="filters" size={16} strokeWidth={2.2} />
        {user ? (
          <Avatar name={user.name} color={user.avatarColor} size={32} />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-sub text-page">
            <Icon name="profile" size={18} />
          </span>
        )}
      </button>

      {open && (
        <div role="menu" className="absolute top-[calc(100%+10px)] right-0 z-50 w-64 overflow-hidden rounded-2xl border border-line bg-card py-2 shadow-lift">
          {user ? (
            <>
              <div className="border-b border-line px-4 pt-1 pb-3">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="truncate text-[13px] text-sub">@{user.username}</p>
              </div>
              <Link role="menuitem" href="/account/reviews" onClick={close} className={cn(item, "mt-1 font-semibold")}>
                <Icon name="reviews" size={18} /> My reviews
              </Link>
              <Link role="menuitem" href={`/u/${user.username}?tab=watchlist`} onClick={close} className={item}>
                <Icon name="heart" size={18} /> Watchlist
              </Link>
              <Link role="menuitem" href={`/u/${user.username}`} onClick={close} className={item}>
                <Icon name="profile" size={18} /> Profile
              </Link>
              <div className="my-1 border-t border-line" />
              <Link role="menuitem" href="/upload" onClick={close} className={item}>
                <Icon name="upload" size={18} /> Share a poster
              </Link>
              {user.role === "admin" && (
                <Link role="menuitem" href="/admin" onClick={close} className={item}>
                  <Icon name="shieldCheck" size={18} /> Moderation
                </Link>
              )}
              <Link role="menuitem" href={`/u/${user.username}#settings`} onClick={close} className={item}>
                <Icon name="filters" size={18} /> Settings
              </Link>
              <div className="my-1 border-t border-line" />
              <form action={logout}>
                <button role="menuitem" type="submit" className={cn(item, "w-full text-accent")}>
                  <Icon name="logout" size={18} /> Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link role="menuitem" href="/login" onClick={close} className={cn(item, "font-semibold")}>
                Log in
              </Link>
              <Link role="menuitem" href="/signup" onClick={close} className={item}>
                Sign up
              </Link>
              <div className="my-1 border-t border-line" />
              <Link role="menuitem" href="/upload" onClick={close} className={item}>
                Share a poster
              </Link>
              <Link role="menuitem" href="/terms" onClick={close} className={item}>
                Help &amp; terms
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Top bar on tablet/desktop; flat bottom tab bar on phones. */
export function AppNav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const desktopTabs = TABS.filter((t) => ["Home", "Discover", "Cinemas", "Reviews"].includes(t.label));
  // Phones keep five tabs; Cinemas is reachable from Home and Discover.
  // Signed out, the last tab is "Log in" so signing in is always one tap away.
  const mobileTabs = TABS.filter((t) => t.label !== "Cinemas").map((t) =>
    t.label === "Profile" && !user ? { ...t, label: "Log in", href: "/login", match: (p: string) => p.startsWith("/login") } : t,
  );

  return (
    <>
      <header className="sticky top-0 z-40 hidden border-b border-line bg-page/95 backdrop-blur-xl md:block">
        <div className="mx-auto grid h-20 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-8">
          <Logo />
          <nav aria-label="Main" className="flex items-center gap-1">
            {desktopTabs.map((tab) => {
              const active = tab.match(pathname);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2.5 text-[15px] transition hover:bg-field",
                    active ? "font-semibold text-ink" : "text-sub hover:text-ink",
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                aria-current={pathname.startsWith("/admin") ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2.5 text-[15px] hover:bg-field",
                  pathname.startsWith("/admin") ? "font-semibold" : "text-sub",
                )}
              >
                Moderation
              </Link>
            )}
          </nav>
          <div className="flex items-center justify-end gap-2">
            <Link href="/upload" className="rounded-full px-4 py-2.5 text-[15px] font-semibold hover:bg-field">
              Share a poster
            </Link>
            <AccountMenu user={user} />
          </div>
        </div>
      </header>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 flex items-start justify-around border-t border-line bg-tab/95 px-2 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden"
      >
        {mobileTabs.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                active ? "text-cta" : "text-sub",
              )}
            >
              <Icon name={tab.icon} size={24} strokeWidth={active ? 2.2 : 1.7} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
