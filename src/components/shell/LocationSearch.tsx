'use client';

import { Loader2, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useLocation } from '@/context/LocationContext';
import { isApiErrorBody } from '@/types/api';
import type { GeocodeResponse, GeocodeResult } from '@/types/location';

type SearchState =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'results'; results: GeocodeResult[]; attribution: string }
  | { kind: 'empty' }
  | { kind: 'error'; message: string };

/**
 * Submit-based place search. The query goes to our own /api/geocode route, so the Mapbox
 * token never reaches the browser, and a missing token produces a clear message instead of
 * a broken control.
 */
export function LocationSearch() {
  const { selectLocation } = useLocation();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>({ kind: 'idle' });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => setState({ kind: 'idle' }), []);

  // Dismiss the results panel on an outside click or Escape.
  useEffect(() => {
    if (state.kind === 'idle') return;

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) close();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close();
        inputRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [state.kind, close]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length === 0) return;

    setState({ kind: 'searching' });

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`);
      const body: unknown = await response.json();

      if (!response.ok) {
        setState({
          kind: 'error',
          message: isApiErrorBody(body)
            ? body.error.message
            : 'Location search failed. Try again in a moment.',
        });
        return;
      }

      const { results, attribution } = body as GeocodeResponse;
      setState(results.length === 0 ? { kind: 'empty' } : { kind: 'results', results, attribution });
    } catch {
      setState({ kind: 'error', message: 'Location search could not be reached.' });
    }
  }

  function choose(result: GeocodeResult) {
    selectLocation({ label: result.label, coordinates: result.coordinates });
    setQuery('');
    close();
  }

  return (
    <div className="search" ref={containerRef}>
      <form className="search__field" onSubmit={handleSubmit} role="search">
        <Search className="search__icon" size={15} aria-hidden="true" />
        <input
          ref={inputRef}
          className="search__input"
          type="search"
          name="location"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a city, ZIP, or address"
          aria-label="Search for a location"
          autoComplete="off"
        />
        <button type="submit" className="visually-hidden">
          Search
        </button>
      </form>

      {state.kind !== 'idle' ? (
        <div className="search__results" role="region" aria-label="Location search results">
          {state.kind === 'searching' ? (
            <p className="search__status">
              <Loader2 size={13} aria-hidden="true" /> Searching&hellip;
            </p>
          ) : null}

          {state.kind === 'empty' ? (
            <p className="search__status">
              No matching places in NWS coverage. Try adding a state, for example
              &ldquo;Phoenix, AZ&rdquo;.
            </p>
          ) : null}

          {state.kind === 'error' ? (
            <p className="search__status" role="alert">
              {state.message}
            </p>
          ) : null}

          {state.kind === 'results' ? (
            <>
              <ul>
                {state.results.map((result) => (
                  <li key={result.id}>
                    <button type="button" className="search__result" onClick={() => choose(result)}>
                      <span className="search__result-name">{result.name}</span>
                      <span className="search__result-detail">{result.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="search__attribution">Geocoding {state.attribution}</p>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
