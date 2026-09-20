/** Fixed atmospheric layers behind the app. Inert and non-interactive. */
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__grid" />
      <div className="backdrop__glow backdrop__glow--blue" />
      <div className="backdrop__glow backdrop__glow--gold" />
      <div className="backdrop__vignette" />
      <div className="backdrop__noise" />
    </div>
  );
}
