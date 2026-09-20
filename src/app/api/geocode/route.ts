import type { NextRequest } from 'next/server';

import { GeocodingError, getGeocodingProvider } from '@/lib/geocoding';
import type { ApiError, ApiErrorBody } from '@/types/api';
import type { GeocodeResponse } from '@/types/location';

const MAX_QUERY_LENGTH = 200;

function errorResponse(error: ApiError, status: number): Response {
  return Response.json({ error } satisfies ApiErrorBody, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

const ERROR_PRESENTATION: Record<string, { title: string; status: number }> = {
  GEOCODER_NOT_CONFIGURED: { title: 'Search not configured', status: 501 },
  GEOCODER_UNAVAILABLE: { title: 'Search unavailable', status: 503 },
  GEOCODER_REJECTED: { title: 'Search credentials rejected', status: 502 },
};

/**
 * Server-side proxy so the Mapbox token stays out of the browser bundle entirely. This
 * route converts text to coordinates and nothing else — weather always comes from NWS.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (query.length === 0) {
    return errorResponse(
      {
        code: 'EMPTY_QUERY',
        title: 'Empty search',
        message: 'Enter a city, ZIP code, or address to search.',
      },
      400,
    );
  }

  const provider = getGeocodingProvider();

  // The typeahead sets this; a submitted query wants settled results, not prefix guesses.
  const autocomplete = request.nextUrl.searchParams.get('autocomplete') === '1';

  try {
    const results = await provider.forward(query.slice(0, MAX_QUERY_LENGTH), {
      limit: autocomplete ? 6 : 5,
      autocomplete,
    });
    return Response.json({ results, attribution: provider.attribution } satisfies GeocodeResponse, {
      // Place names are stable; caching identical searches spares the geocoding quota.
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (caught) {
    if (caught instanceof GeocodingError) {
      const presentation = ERROR_PRESENTATION[caught.code] ?? {
        title: 'Search failed',
        status: 503,
      };
      return errorResponse(
        {
          code: caught.code,
          title: presentation.title,
          message:
            caught.code === 'GEOCODER_NOT_CONFIGURED'
              ? 'Location search needs a Mapbox access token. Set MAPBOX_ACCESS_TOKEN in .env.local and restart the server. Use My Location and the quick locations still work without it.'
              : caught.message,
        },
        presentation.status,
      );
    }
    console.error('[api/geocode] unexpected failure', caught);
    return errorResponse(
      {
        code: 'UNEXPECTED',
        title: 'Something went wrong',
        message: 'The location search could not be completed.',
      },
      500,
    );
  }
}
