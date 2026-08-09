import type { AnalyticsProvider } from "../provider.js";
import type { ProviderType } from "../types.js";
import { GitHubProvider } from "./github.js";
import { GitLabProvider } from "./gitlab.js";

const providerRegistry: Record<ProviderType, () => AnalyticsProvider> = {
  github: () => new GitHubProvider(),
  gitlab: () => new GitLabProvider(),
};

export function getProvider(providerId: string | undefined): AnalyticsProvider {
  const normalized = (providerId ?? "github").trim().toLowerCase() as ProviderType;
  const factory = providerRegistry[normalized];
  if (!factory) {
    throw new Error(
      `Unsupported provider '${providerId}'. Supported providers are: ${Object.keys(providerRegistry).join(", ")}`
    );
  }
  return factory();
}

export { GitHubProvider, GitLabProvider };
