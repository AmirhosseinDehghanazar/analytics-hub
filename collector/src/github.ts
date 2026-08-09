/**
 * Re-exports GitHubProvider and related classes for backward compatibility.
 */
export { GitHubProvider, RateLimitError, AuthError } from "./providers/github.js";
export type { GithubClientOptions, StargazerRaw } from "./providers/github.js";
