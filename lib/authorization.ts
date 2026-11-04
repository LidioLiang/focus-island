import "server-only";

type AuthUser = {
  app_metadata?: Record<string, unknown> | null;
};

export function isDeveloper(user: AuthUser | null | undefined) {
  return user?.app_metadata?.role === "developer";
}
