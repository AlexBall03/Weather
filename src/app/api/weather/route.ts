import type { NextRequest } from 'next/server';

import { AGGREGATE_CACHE_CONTROL } from '@/lib/nws/cache';
import { NwsError } from '@/lib/nws/client';
import { buildWeatherSnapshot } from '@/lib/weather/aggregate';
import type { ApiError, ApiErrorBody } from '@/types/api';

function errorResponse(error: ApiError, status: number): Response {
  return Response.json({ error } satisfies ApiErrorBody, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function parseCoordinate(value: string | null, max: number): number | null {
  if (value === null) return null;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || Math.abs(parsed) > max) return null;
  return parsed;
}

/** Translates an NWS failure into the state the dashboard should actually show. */
function mapNwsError(error: NwsError): { error: ApiError; status: number } {
  if (error.isInvalidPoint) {
    return {
      status: 404,
      error: {
        code: 'OUTSIDE_NWS_COVERAGE',
        title: 'Outside NWS coverage',
        message:
          'NWS forecast data is not available for this location. Coverage is limited to the United States and its territories.',
        correlationId: error.correlationId,
      },
    };
  }

  if (error.kind === 'rate-limited') {
    return {
      status: 429,
      error: {
        code: 'NWS_RATE_LIMITED',
        title: 'Rate limited',
        message: 'The National Weather Service is throttling requests. Try again in a moment.',
        correlationId: error.correlationId,
      },
    };
  }

  return {
    status: 503,
    error: {
      code: 'NWS_UNAVAILABLE',
      title: 'NWS unavailable',
      message:
        'The National Weather Service did not respond. This is usually temporary — no other weather source is substituted.',
      correlationId: error.correlationId,
    },
  };
}

export async function GET(request: NextRequest): Promise<Response> {
  const params = request.nextUrl.searchParams;
  const latitude = parseCoordinate(params.get('lat'), 90);
  const longitude = parseCoordinate(params.get('lon'), 180);

  if (latitude === null || longitude === null) {
    return errorResponse(
      {
        code: 'INVALID_COORDINATES',
        title: 'Invalid coordinates',
        message: 'Provide lat and lon as decimal degrees, for example ?lat=33.4484&lon=-112.074.',
      },
      400,
    );
  }

  try {
    const snapshot = await buildWeatherSnapshot({
      latitude,
      longitude,
      label: params.get('label'),
    });
    return Response.json(snapshot, {
      headers: { 'Cache-Control': AGGREGATE_CACHE_CONTROL },
    });
  } catch (caught) {
    if (caught instanceof NwsError) {
      const { error, status } = mapNwsError(caught);
      return errorResponse(error, status);
    }
    console.error('[api/weather] unexpected failure', caught);
    return errorResponse(
      {
        code: 'UNEXPECTED',
        title: 'Something went wrong',
        message: 'The weather service could not complete this request.',
      },
      500,
    );
  }
}
