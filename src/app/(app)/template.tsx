/**
 * Templates re-mount on every navigation, so each page fades in.
 * Opacity only: a transform here would break `position: fixed` bars inside pages.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
