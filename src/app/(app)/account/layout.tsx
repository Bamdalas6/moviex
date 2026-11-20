import { Suspense } from "react";
import { AccountNav } from "@/components/account/account-nav";
import { PageShell } from "@/components/layout/page";
import { requireUser } from "@/server/auth/session";

/** Signed-in area. Every page under /account requires a session. */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account/reviews");
  return (
    <PageShell wide>
      <div className="grid items-start gap-6 md:grid-cols-[240px_minmax(0,1fr)] md:gap-14">
        <Suspense>
          <AccountNav user={{ name: user.name, username: user.username, avatarColor: user.avatarColor, role: user.role }} />
        </Suspense>
        <div className="min-w-0">{children}</div>
      </div>
    </PageShell>
  );
}
