import { Link } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function AuthHeader() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="h-10 w-24 animate-pulse rounded-[var(--radius-md)] bg-bg-subtle" />;
  }
  if (user) {
    return (
      <div className="max-w-[14rem] truncate text-fg">
        <UserButton />
      </div>
    );
  }
  return (
    <Link
      to="/login"
      className="flex h-10 items-center rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 text-xs font-medium text-fg hover:border-border-strong hover:bg-bg-subtle"
    >
      Sign in
    </Link>
  );
}
