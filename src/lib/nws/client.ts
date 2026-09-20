import 'server-only';

import { NWS_REVALIDATE } from '@/lib/nws/cache';
import type { NwsProblemDetail } from '@/lib/nws/types';

export const NWS_BASE_URL = process.env.NWS_BASE_URL ?? 'https://api.weather.gov';

/**
 * NWS asks every client to identify itself. A real deployment should set NWS_USER_AGENT to
 * something that includes a contact address, e.g.
 *   Weather/1.0 (weather.alexball.dev, contact@alexball.dev)
 * so the service can reach the operator about a problem. This fallback keeps local
 * development working without configuration.
 */
const FALLBACK_USER_AGENT = 'Weather/1.0 (weather.alexball.dev)';

function userAgent(): string {
  const configured = process.env.NWS_USER_AGENT?.trim();
  return configured && configured.length > 0 ? configured : FALLBACK_USER_AGENT;
}

export type NwsFailureKind = 'not-found' | 'rate-limited' | 'upstream' | 'network' | 'malformed';

/** Typed failure carrying enough context for the route handler to choose a user-facing state. */
export class NwsError extends Error {
  readonly kind: NwsFailureKind;
  readonly status: number | null;
  readonly problem: NwsProblemDetail | null;
  readonly url: string;

  constructor(
    kind: NwsFailureKind,
    message: string,
    options: { status?: number | null; problem?: NwsProblemDetail | null; url: string },
  ) {
    super(message);
    this.name = 'NwsError';
    this.kind = kind;
    this.status = options.status ?? null;
    this.problem = options.problem ?? null;
    this.url = options.url;
  }

  /** True when NWS explicitly says it has no data for the requested point. */
  get isInvalidPoint(): boolean {
    return this.status === 404 && (this.problem?.type ?? '').includes('InvalidPoint');
  }

  get correlationId(): string | undefined {
    return this.problem?.correlationId;
  }
}

/** How long we wait on a single NWS resource before giving up on it. */
const REQUEST_TIMEOUT_MS = 10_000;

async function readProblemDetail(response: Response): Promise<NwsProblemDetail | null> {
  try {
    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null) {
      return body as NwsProblemDetail;
    }
  } catch {
    // A non-JSON error body (an HTML maintenance page, say) is not worth surfacing.
  }
  return null;
}

/**
 * The one place NWS requests are made. Headers, timeouts, caching and error shaping all
 * live here so nothing downstream has to think about them.
 */
export async function nwsFetch<T>(
  url: string,
  options: { revalidate: number; accept?: string },
): Promise<T> {
  const absolute = url.startsWith('http') ? url : `${NWS_BASE_URL}${url}`;

  let response: Response;
  try {
    response = await fetch(absolute, {
      headers: {
        'User-Agent': userAgent(),
        Accept: options.accept ?? 'application/geo+json',
      },
      next: { revalidate: options.revalidate },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (cause) {
    const timedOut = cause instanceof Error && cause.name === 'TimeoutError';
    throw new NwsError(
      'network',
      timedOut ? 'NWS request timed out' : 'Could not reach NWS',
      { url: absolute },
    );
  }

  if (!response.ok) {
    const problem = await readProblemDetail(response);
    const kind: NwsFailureKind =
      response.status === 404 ? 'not-found' : response.status === 429 ? 'rate-limited' : 'upstream';
    throw new NwsError(kind, problem?.detail ?? `NWS responded ${response.status}`, {
      status: response.status,
      problem,
      url: absolute,
    });
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new NwsError('malformed', 'NWS returned a response we could not parse', {
      status: response.status,
      url: absolute,
    });
  }
}

export { NWS_REVALIDATE };
