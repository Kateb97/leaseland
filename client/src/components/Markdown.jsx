// Renders the assistant's markdown-ish output as calm, readable HTML.
// Strips emojis the model may emit and groups content into sections with
// severity coding derived from section headings (red / amber / green).

const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{1F1E6}-\u{1F1FF}]/gu;

function clean(line) {
  return line.replace(EMOJI_RE, '').replace(/\s{2,}/g, ' ').trim();
}

function severityFor(heading) {
  const h = heading.toUpperCase();
  if (/RED FLAG|ILLEGAL|UNENFORCEABLE|VIOLATION|MAJOR ISSUE/.test(h)) return 'red';
  if (/CAUTION|WATCH|UNCLEAR|NEGOTIA|YELLOW|WARNING|UNUSUAL/.test(h)) return 'amber';
  if (/GOOD|FAIR|STANDARD|OK\b|FINE|LOOKS REASONABLE|ACCEPTABLE/.test(h)) return 'green';
  return 'none';
}

const SEV_LABEL = { red: 'Issue', amber: 'Caution', green: 'Looks fine' };

// Minimal inline markdown: **bold** only.
function inline(text, keyBase) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={`${keyBase}-${i}`}>{part.slice(2, -2)}</strong>
      : part
  );
}

function renderLine(line, i) {
  const t = clean(line);
  if (line.startsWith('### ')) return <h4 key={i} className="analysis-h3">{inline(clean(line.slice(4)), i)}</h4>;
  if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="analysis-li">{inline(clean(line.slice(2)), i)}</li>;
  if (/^\d+\.\s/.test(line)) return <li key={i} className="analysis-li">{inline(t, i)}</li>;
  if (line.startsWith('> ')) return <blockquote key={i} className="analysis-quote">{inline(clean(line.slice(2)), i)}</blockquote>;
  if (line.startsWith('---')) return <hr key={i} className="analysis-hr" />;
  if (t === '') return null;
  return <p key={i} className="analysis-p">{inline(t, i)}</p>;
}

export default function Markdown({ content }) {
  if (!content) return null;
  const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  const lines = text.split('\n');

  // Group lines into sections at h1/h2 boundaries so each section can carry
  // a severity border. Content before the first heading is its own section.
  const sections = [{ heading: null, level: 0, lines: [] }];
  for (const line of lines) {
    if (line.startsWith('# ') || line.startsWith('## ')) {
      sections.push({
        heading: clean(line.replace(/^#+\s*/, '')),
        level: line.startsWith('## ') ? 2 : 1,
        lines: [],
      });
    } else {
      sections[sections.length - 1].lines.push(line);
    }
  }

  return (
    <div className="analysis-content">
      {sections.map((sec, si) => {
        if (!sec.heading && sec.lines.every(l => clean(l) === '')) return null;
        const sev = sec.heading ? severityFor(sec.heading) : 'none';
        return (
          <section key={si} className={`analysis-section sev-${sev}`}>
            {sec.heading && (
              <h3 className="analysis-h2">
                {sec.heading}
                {sev !== 'none' && <span className={`sev-tag sev-${sev}`}>{SEV_LABEL[sev]}</span>}
              </h3>
            )}
            {sec.lines.map((l, i) => renderLine(l, `${si}-${i}`))}
          </section>
        );
      })}
    </div>
  );
}
