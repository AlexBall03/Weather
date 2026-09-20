'use client';

import { Crosshair, Loader2, Search } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { useLocation } from '@/context/LocationContext';
import { isApiErrorBody } from '@/types/api';
import type { GeocodeResponse, GeocodeResult } from '@/types/location';

type SearchState =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'results'; results: GeocodeResult[]; attribution: string }
  | { kind: 'empty' }
  | { kind: 'error'; message: string };

/** Below this length a query matches half the country and burns geocoding quota. */
const MIN_QUERY_LENGTH = 3;
/** Typing pause before a request goes out. Long enough that a typed word is one request. */
const DEBOUNCE_MS = 260;

/**
 * As-you-type place search. Suggestions appear while typing; Enter picks the highlighted
 * one, or submits the raw text when nothing is highlighted. The query goes to our own
 * /api/geocode route, so the Mapbox token never reaches the browser, and a missing token
 * produces a clear message rather than a broken control.
 */
export function LocationSearch({ withLocateButton = true }: { withLocateButton?: boolean }) {
  const { selectLocation, locateMe, isLocating } = useLocation();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>({ kind: 'idle' });
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Guards against a slow earlier request overwriting a newer one. */
  const requestId = useRef(0);
  const listboxId = useId();

  const close = useCallback(() => {
    setState({ kind: 'idle' });
    setActiveIndex(-1);
  }, []);

  const runSearch = useCallback(async (text: string, autocomplete: boolean, signal: AbortSignal) => {
    const id = requestId.current + 1;
    requestId.current = id;
    setState({ kind: 'searching' });

    try {
      const params = new URLSearchParams({ q: text });
      if (autocomplete) params.set('autocomplete', '1');
      const response = await fetch(`/api/geocode?${params.toString()}`, { signal });
      const body: unknown = await response.json();
      if (requestId.current !== id) return;

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
      setActiveIndex(-1);
    } catch (caught) {
      if (signal.aborted || requestId.current !== id) return;
      console.error('[geocode] request failed', caught);
      setState({ kind: 'error', message: 'Location search could not be reached.' });
    }
  }, []);

  // Debounced typeahead. Every keystroke cancels the pending timer and any request
  // already in flight, so one request goes out per pause in typing.
  useEffect(() => {
    const text = query.trim();
    if (text.length < MIN_QUERY_LENGTH) {
      requestId.current += 1;
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => void runSearch(text, true, controller.signal), DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, runSearch]);

  // Dismiss on an outside click.
  useEffect(() => {
    if (state.kind === 'idle') return;

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) close();
    }

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [state.kind, close]);

  const results = state.kind === 'results' ? state.results : [];

  function choose(result: GeocodeResult) {
    selectLocation({ label: result.label, coordinates: result.coordinates });
    setQuery('');
    close();
    inputRef.current?.blur();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      close();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (results.length === 0) return;
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((index) => {
        const next = index + delta;
        if (next < 0) return results.length - 1;
        if (next >= results.length) return 0;
        return next;
      });
      return;
    }

    if (event.key === 'Enter') {
      // A highlighted suggestion wins; otherwise fall through to the form submit,
      // which runs an exact (non-prefix) search on the typed text.
      if (activeIndex >= 0 && results[activeIndex]) {
        event.preventDefault();
        choose(results[activeIndex]);
      }
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = query.trim();
    if (text.length === 0) return;
    const controller = new AbortController();
    void runSearch(text, false, controller.signal);
  }

  const isOpen = state.kind !== 'idle';

  return (
    <div className="search" ref={containerRef}>
      <form className="search__field" onSubmit={onSubmit} role="search">
        <Search className="search__icon" size={15} aria-hidden="true" />

        <input
          ref={inputRef}
          className="search__input"
          type="text"
          name="location"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search a city, ZIP, or address"
          aria-label="Search for a location"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 && results[activeIndex]
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
        />

        {state.kind === 'searching' ? (
          <Loader2 className="search__spinner" size={14} aria-hidden="true" />
        ) : null}

        {withLocateButton ? (
          <button
            type="button"
            className="search__locate"
            onClick={() => void locateMe()}
            disabled={isLocating}
            title="Use my location"
            aria-label="Use my location"
          >
            <Crosshair size={15} aria-hidden="true" />
          </button>
        ) : null}

        <button type="submit" className="visually-hidden">
          Search
        </button>
      </form>

      {isOpen ? (
        <div className="search__results">
          {state.kind === 'searching' && results.length === 0 ? (
            <p className="search__status">Searching&hellip;</p>
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
              <ul id={listboxId} role="listbox" aria-label="Location suggestions">
                {state.results.map((result, index) => (
                  <li key={result.id} role="presentation">
                    <button
                      type="button"
                      id={`${listboxId}-option-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      className={`search__result${index === activeIndex ? ' search__result--active' : ''}`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => choose(result)}
                    >
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
