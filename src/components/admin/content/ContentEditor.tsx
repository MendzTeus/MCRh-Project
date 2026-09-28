import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { CONTENT_SECTIONS } from './contentSchema';
import { ContentField, FieldGroup, type SaveContent } from './ContentFields';
import { MapPinsEditor } from './MapPinsEditor';

const MAP_SECTION = { id: 'map', title: 'Mapa', subtitle: 'Pins dos mapas' };

/**
 * The "Content" admin screen: every editable text of the public site, grouped
 * by the page it appears on. Each field saves on its own (on blur) and only
 * that field's value is updated — the screen never reloads while editing.
 */
export function ContentEditor({ content, onSave }: { content: Record<string, unknown>; onSave: SaveContent }) {
  const [active, setActive] = useState(CONTENT_SECTIONS[0].id);
  const section = CONTENT_SECTIONS.find((s) => s.id === active);
  const tabs = [...CONTENT_SECTIONS, MAP_SECTION];

  return (
    <div className="max-w-4xl">
      <p className="font-body text-sm text-on-surface-variant mb-6">
        Cada campo mostra o texto que está no site agora. Edite e clique fora do campo para salvar —
        a alteração aparece no site ao recarregar a página.
      </p>

      <div role="tablist" aria-label="Páginas do site" className="flex flex-wrap gap-2 mb-8">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={active === t.id} onClick={() => setActive(t.id)}
            className="px-4 py-2 rounded-full font-body text-xs font-semibold border transition-colors"
            style={active === t.id
              ? { background: 'var(--color-admin-navy)', color: 'white', borderColor: 'var(--color-admin-navy)' }
              : { borderColor: 'rgba(16,28,45,0.15)', color: 'rgba(16,28,45,0.7)' }}>
            {t.title}
          </button>
        ))}
      </div>

      {section ? (
        <section>
          <div className="flex items-baseline justify-between gap-4 mb-5">
            <div>
              <h2 className="font-display text-headline-md text-primary">{section.title}</h2>
              <p className="font-body text-xs text-on-surface-variant/70">{section.subtitle}</p>
            </div>
            {section.path && (
              <a href={section.path} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-body text-[11px] uppercase tracking-[0.12em] text-[#826927] hover:underline">
                Ver no site <ExternalLink size={12} />
              </a>
            )}
          </div>
          <div className="grid gap-6">
            {section.groups.map((group) => (
              <div key={group.title}>
                <FieldGroup title={group.title} hint={group.hint}>
                  {group.fields.map((def) => (
                    <div key={def.key}>
                      <ContentField def={def} content={content} onSave={onSave} />
                    </div>
                  ))}
                </FieldGroup>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section>
          <h2 className="font-display text-headline-md text-primary mb-5">{MAP_SECTION.title}</h2>
          <MapPinsEditor saved={content['map.locations']} onSave={onSave} />
        </section>
      )}
    </div>
  );
}
