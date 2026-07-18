// Parses raw Airbnb review HTML (copied from a listing's reviews section) into
// structured rows. Airbnb's CSS class names are hashed and change often, so this
// relies ONLY on stable structural anchors:
//   - [data-review-id]            → the review block + its stable id (dedup key)
//   - [role="heading"]            → reviewer name
//   - img[data-original-uri]      → reviewer avatar (muscache CDN)
//   - a span reading "Rating, N stars" → the star rating
//   - the longest leaf <span>     → the review body text
// Anything it can't find is left empty for the admin to fill in.

export type ParsedReview = {
  sourceReviewId: string;
  name: string;
  avatarUrl: string;
  rating: number;
  text: string;
  date: string;
};

const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';

// Text with <br> preserved as line breaks. Airbnb wraps the body in a <span>
// whose only element children are <br>, so a plain textContent loses the breaks
// (and children.length !== 0 excludes it from a naive leaf scan).
function spanText(s: Element): string {
  const clone = s.cloneNode(true) as Element;
  clone.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  return (clone.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}

export function parseAirbnbReviews(html: string): ParsedReview[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks = Array.from(doc.querySelectorAll('[data-review-id]'));
  const seen = new Set<string>();
  const out: ParsedReview[] = [];

  for (const block of blocks) {
    const id = block.getAttribute('data-review-id')?.trim() || '';
    if (!id || seen.has(id)) continue;
    seen.add(id);

    const name = block.querySelector('[role="heading"]')?.textContent?.trim() || '';

    const avatarEl = block.querySelector('img[data-original-uri]');
    const avatarUrl =
      avatarEl?.getAttribute('data-original-uri')?.trim() ||
      block.querySelector<HTMLImageElement>('img[src*="muscache.com/im/pictures/user"]')?.src ||
      '';

    let rating = 5;
    const ratingText = Array.from(block.querySelectorAll('span'))
      .map((s) => s.textContent || '')
      .find((t) => /Rating,\s*[\d.]+\s*star/i.test(t));
    const rm = ratingText?.match(/Rating,\s*([\d.]+)\s*star/i);
    if (rm) rating = Number(rm[1]);

    // The review body is a <span> whose only element children (if any) are <br>.
    // Pick the longest such span that isn't the name, the rating label, the
    // "N years on Airbnb" tag, or the translation toggle.
    let text = '';
    const bodySpans = Array.from(block.querySelectorAll('span')).filter((s) =>
      Array.from(s.querySelectorAll('*')).every((el) => el.tagName === 'BR')
    );
    for (const s of bodySpans) {
      const t = spanText(s);
      if (
        t.length > text.length &&
        t !== name &&
        !/Rating,/i.test(t) &&
        !/on Airbnb/i.test(t) &&
        !/^show original$/i.test(t) &&
        !/^translated/i.test(t)
      ) {
        text = t;
      }
    }

    // Airbnb shows the stay date as "Month YYYY" (e.g. "September 2025").
    const dateMatch = (block.textContent || '').match(new RegExp(`(?:${MONTHS})\\s+\\d{4}(?!\\d)`, 'i'));
    const date = dateMatch ? dateMatch[0] : '';

    if (!name && !text) continue;
    out.push({ sourceReviewId: id, name, avatarUrl, rating, text, date });
  }

  return out;
}
