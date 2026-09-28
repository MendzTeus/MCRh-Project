// Split out of the former single-file admin (src/pages/Admin.tsx).


// Airbnb review collector: self-contained tool served from /public, embedded
// here so its full parsing/CSV logic stays intact. Pre-populated with every
// project apartment (keyed by the Supabase Unit slug).
export function CollectorTab() {
  return (
    <iframe src="/admin-review-collector.html" title="Coletor de avaliações Airbnb"
      className="w-full block" style={{ height: 'calc(100vh - 4rem)', border: 0, background: '#fcf9f4' }} />
  );
}

