export function PlaceholderShell() {
  return (
    <main className="shell">
      <section className="hero-card">
        <p className="eyebrow">Karate App</p>
        <h1>Vite shell is ready.</h1>
        <p className="lede">
          The Next.js tooling has been replaced with a lean React entry point
          so the migration can continue from a stable base.
        </p>
        <dl className="stats">
          <div>
            <dt>Bundler</dt>
            <dd>Vite</dd>
          </div>
          <div>
            <dt>Routing</dt>
            <dd>React Router</dd>
          </div>
          <div>
            <dt>Runtime</dt>
            <dd>React 19</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
