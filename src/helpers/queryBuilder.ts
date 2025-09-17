export type QuerySpec = {
    subject?: string;
    from?: string;
    olderThanDays?: number;
    excludeStarred?: boolean;
    excludeImportant?: boolean;
}

// Trim, collapse whitespace, remove wrapping quotes if input is just quotes
function clean(s?: string): string {
    if (!s) return "";
    const t = s.replace(/\s+/g, " ").trim();
    // if the whole thing is quoted, keep it; else return t
    return t;
}

// Turn "foo bar" into subject:(foo bar); preserve explicit ORs user typed
function subjectToken(subjectRaw?: string): string | null {
    const s = clean(subjectRaw);
    if (!s) return null;
    // If user already typed subject:(...), respect it
    if (/^subject:\s*\(/i.test(s)) return s;
    // If they typed quotes/ORs, keep them inside the parentheses
    return `subject:(${s})`;
}

/** Gmail doesn’t support *@domain.com. Accept:
 *  - alice@x.com     -> from:alice@x.com
 *  - domain.com      -> from:domain.com (matches the whole domain)
 *  - "alice OR bob"  -> from:(alice OR bob)
 */
function fromToken(fromRaw?: string): string | null {
    const f = clean(fromRaw);
    if (!f) return null;
  
    // If user already typed from:..., keep it
    if (/^from:/i.test(f)) return f;
  
    // If they passed something that looks like a list/OR/group, keep grouping
    if (/[()]/.test(f) || /\bOR\b/i.test(f)) {
      return `from:(${f})`;
    }
  
    // If they used *@domain.com, normalize to domain.com
    const starDomain = f.match(/^\*\@(.+)$/);
    if (starDomain) {
      return `from:${starDomain[1]}`; // from:domain.com
    }
  
    // Plain email or domain
    return `from:${f}`;
  }
  
  /** Turn days into older_than:Nd; clamp to >=0 */
  function olderThanToken(days?: number): string | null {
    if (days === undefined || days === null) return null;
    const n = Math.max(0, Math.floor(days));
    return n > 0 ? `older_than:${n}d` : null;
  }
  
  export function buildGmailQuery(spec: QuerySpec): string {
    const parts: Array<string> = [];
  
    const subj = subjectToken(spec.subject);
    if (subj) parts.push(subj);
  
    const frm = fromToken(spec.from);
    if (frm) parts.push(frm);
  
    const ot = olderThanToken(spec.olderThanDays);
    if (ot) parts.push(ot);
  
    if (spec.excludeStarred) parts.push(`-is:starred`);
    if (spec.excludeImportant) parts.push(`-label:important`);
  
    // Join and normalize spaces
    const query = parts.join(" ").replace(/\s+/g, " ").trim();
  
    // Debug log so you can paste into the smoke test:
    console.log("[builder] spec:", spec);
    console.log("[builder] query:", query);
  
    return query;
  }