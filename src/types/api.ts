/** Error codes the client switches on to choose an error presentation. */
export type ApiErrorCode =
  | 'INVALID_COORDINATES'
  | 'OUTSIDE_NWS_COVERAGE'
  | 'NWS_UNAVAILABLE'
  | 'NWS_RATE_LIMITED'
  | 'GEOCODER_NOT_CONFIGURED'
  | 'EMPTY_QUERY'
  | 'GEOCODER_UNAVAILABLE'
  | 'GEOCODER_REJECTED'
  | 'UNEXPECTED';

export interface ApiError {
  code: ApiErrorCode;
  /** Short uppercase-ready title, e.g. "Outside NWS coverage". */
  title: string;
  /** Sentence shown to the user. Never contains raw upstream noise. */
  message: string;
  /** NWS correlation id, surfaced in advanced mode so a failure can be reported. */
  correlationId?: string;
}

export interface ApiErrorBody {
  error: ApiError;
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ApiErrorBody).error?.code === 'string'
  );
}
