import { AppNav } from "@/components/layout/app-nav";
import { getCurrentUser } from "@/server/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <>
      <AppNav
        user={user && { name: user.name, username: user.username, avatarColor: user.avatarColor, role: user.role }}
      />
      {children}
    </>
  );
}
