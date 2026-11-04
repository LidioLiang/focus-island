type DeploymentEnvironment = "development" | "preview" | "production";
type Environment = Readonly<Record<string, string | undefined>>;

function deploymentEnvironment(env: Environment = process.env): DeploymentEnvironment {
  if (env.VERCEL_ENV === "production") return "production";
  if (env.VERCEL_ENV === "preview") return "preview";
  return "development";
}

function stripeKeyMode(secretKey: string) {
  if (secretKey.startsWith("sk_test_")) return "test";
  if (secretKey.startsWith("sk_live_")) return "live";
  return "unknown";
}

export function assertStripeKeyMatchesDeployment(secretKey: string, env: Environment = process.env) {
  const deployment = deploymentEnvironment(env);
  const actualMode = stripeKeyMode(secretKey);
  const expectedMode = deployment === "production" ? "live" : "test";
  if (actualMode !== expectedMode) throw new Error("stripe_environment_mismatch");
}

function secureOrigin(value: string) {
  const url = new URL(value);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
  if (url.protocol !== "https:" && !local) throw new Error("application_url_not_secure");
  return url.origin;
}

export function canonicalApplicationOrigin(requestUrl: string, env: Environment = process.env) {
  const deployment = deploymentEnvironment(env);

  if (deployment === "preview") {
    const previewHost = env.VERCEL_URL?.trim();
    if (!previewHost) throw new Error("application_url_not_configured");
    return secureOrigin(`https://${previewHost}`);
  }

  const configured = env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return secureOrigin(configured);
  if (deployment === "development") return secureOrigin(requestUrl);
  throw new Error("application_url_not_configured");
}
