import { useMemo } from 'react';
import { Badge, Card, EmptyState, SectionHeading } from '../ui';
import { roomLabel } from './roomCategories';

type Photo = { id: string; url: string; alt: string | null; displayOrder: number; roomCategory: string | null; hidden?: boolean };

/** How the public Photo Tour will group this apartment's photos (read-only). */
export function PhotoTourPreview({ photos }: { photos: Photo[] }) {
  // Same grouping as src/components/PhotoTour.tsx: by photo order, uncategorised → "Property".
  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, Photo[]>();
    for (const p of [...photos].filter((x) => !x.hidden).sort((a, b) => a.displayOrder - b.displayOrder)) {
      const key = p.roomCategory || '';
      if (!map.has(key)) { map.set(key, []); order.push(key); }
      map.get(key)!.push(p);
    }
    return order.map((key) => ({ key, items: map.get(key)! }));
  }, [photos]);

  return (
    <div className="admin-root space-y-6">
      <SectionHeading title="Prévia do Photo Tour"
        description="É assim que o Photo Tour do site agrupa as fotos visíveis. Para mudar, use a aba Fotos." />
      {groups.length === 0 && <EmptyState title="Nenhuma foto visível ainda" />}
      {groups.map((g) => (
        <div key={g.key || 'none'}><Card>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-base font-semibold">{g.key || 'Property'}</h3>
            <span className="text-sm text-ad-muted">{roomLabel(g.key)}</span>
            {!g.key && <Badge tone="warn">sem cômodo</Badge>}
            <span className="ml-auto text-xs text-ad-faint">{g.items.length} foto(s)</span>
          </div>
          <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
            {g.items.map((p) => (
              <img key={p.id} src={p.url} alt={p.alt || ''} loading="lazy" referrerPolicy="no-referrer"
                className="aspect-[4/3] w-full rounded-lg object-cover bg-ad-sunken" />
            ))}
          </div>
        </Card></div>
      ))}
    </div>
  );
}
