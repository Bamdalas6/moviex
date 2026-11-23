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
  { label: "People", href: "/people", icon: "profile", match: (p) => p.startsWith("/people") },
  { label: "YouTube", href: "/channels", icon: "play", match: (p) => p.startsWith("/channels") },
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

  // Signed out, the profile head opens the onboarding (Log in / Create account) rather than a menu.
  if (!user) {
    return (
      <Link
        href="/welcome"
        aria-label="Log in or sign up"
        className="flex items-center gap-3 rounded-full border border-card-line py-1.5 pr-1.5 pl-3.5 transition hover:shadow-card"
      >
        <Icon name="filters" size={16} strokeWidth={2.2} />
        <span className="flex size-8 items-center justify-center rounded-full bg-sub text-page">
          <Icon name="profile" size={18} />
        </span>
      </Link>
    );
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-3 rounded-full border border-card-line py-1.5 pr-1.5 pl-3.5 transition hover:shadow-card",
          open && "shadow-card",
        )}
      >
        <Icon name="filters" size={16} strokeWidth={2.2} />
        <Avatar name={user.name} color={user.avatarColor} size={32} />
      </button>

      {open && (
        <div role="menu" className="absolute top-[calc(100%+10px)] right-0 z-50 w-64 overflow-hidden rounded-2xl border border-line bg-card py-2 shadow-lift">
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
            <button role="menuitem" type="submit" className={cn(item, "w-full font-semibold text-[#e11d48] hover:bg-[#e11d48]/10")}>
              <Icon name="logout" size={18} /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/** Top bar on tablet/desktop; flat bottom tab bar on phones. */
export function AppNav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const desktopTabs = TABS.filter((t) => ["Home", "Discover", "People", "YouTube", "Cinemas", "Reviews"].includes(t.label));
  // Phones keep five tabs; Cinemas, People and YouTube are reachable from Home, Discover and search.
  // Signed out, the last tab is "Log in" and opens the onboarding (Log in / Create account), always one tap away.
  const mobileTabs = TABS.filter((t) => !["Cinemas", "People", "YouTube"].includes(t.label)).map((t) =>
    t.label === "Profile" && !user
      ? { ...t, label: "Log in", href: "/welcome", match: (p: string) => p.startsWith("/login") || p.startsWith("/welcome") }
      : t,
  );

  return (
    <>
      <header data-app-chrome className="sticky top-0 z-40 hidden border-b border-line bg-page/95 backdrop-blur-xl md:block">
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
                    // Tablets don't have room for six tabs; People and YouTube stay one tap away on Home and in search.
                    (tab.label === "People" || tab.label === "YouTube") && "hidden xl:inline-block",
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
            <Link href="/upload" className="hidden rounded-full px-4 py-2.5 text-[15px] font-semibold whitespace-nowrap hover:bg-field lg:inline-block">
              Share a poster
            </Link>
            <AccountMenu user={user} />
          </div>
        </div>
      </header>

      <nav
        aria-label="Main"
        data-app-chrome
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
