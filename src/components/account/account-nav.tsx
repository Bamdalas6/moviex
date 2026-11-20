"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { logout } from "@/server/actions/auth";

type Props = { user: { name: string; username: string; avatarColor: string; role: string } };

/** Account area navigation: a sticky sidebar on desktop, a scrollable tab strip on phones. */
export function AccountNav({ user }: Props) {
  const pathname = usePathname();
  const search = useSearchParams();

  const items: { label: string; href: string; icon: IconName; active: boolean }[] = [
    { label: "My reviews", href: "/account/reviews", icon: "reviews", active: pathname === "/account/reviews" && search.get("kind") !== "ratings" },
    { label: "My ratings", href: "/account/reviews?kind=ratings", icon: "star", active: pathname === "/account/reviews" && search.get("kind") === "ratings" },
    { label: "Watchlist", href: `/u/${user.username}?tab=watchlist`, icon: "heart", active: false },
    { label: "Activity", href: `/u/${user.username}?tab=activity`, icon: "bell", active: false },
    { label: "Public profile", href: `/u/${user.username}`, icon: "profile", active: false },
    { label: "Settings", href: `/u/${user.username}#settings`, icon: "filters", active: false },
    ...(user.role === "admin" ? [{ label: "Moderation", href: "/admin", icon: "shieldCheck" as const, active: false }] : []),
  ];

  return (
    <>
      {/* self-stretch: the aside must span the row so its sticky child has room to stick. */}
      <aside className="hidden self-stretch md:block">
        <div className="sticky top-28 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} color={user.avatarColor} size={52} />
            <div className="min-w-0">
              <p className="truncate text-[16px] font-semibold">{user.name}</p>
              <p className="truncate text-[14px] text-sub">@{user.username}</p>
            </div>
          </div>
          <nav aria-label="Account" className="flex flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition",
                  item.active ? "bg-field font-semibold text-ink" : "text-sub hover:bg-field hover:text-ink",
                )}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </Link>
            ))}
            <form action={logout} className="mt-2 border-t border-line pt-3">
              <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-accent hover:bg-field">
                <Icon name="logout" size={18} />
                Log out
              </button>
            </form>
          </nav>
        </div>
      </aside>

      <nav aria-label="Account" className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 md:hidden">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[14px] font-medium",
              item.active ? "border-ink bg-ink text-page" : "border-card-line",
            )}
          >
            <Icon name={item.icon} size={15} />
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
