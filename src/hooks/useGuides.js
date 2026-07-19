import { useMemo } from 'react';
import { marked } from 'marked';

const guideModules = import.meta.glob('/content/guides/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
});

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const frontmatterLines = match[1].split('\n');
  const data = {};
  for (const line of frontmatterLines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    if (/^\d+$/.test(value)) value = Number(value);
    data[key] = value;
  }

  return { data, content: match[2] };
}

function parseTopics(markdownBody) {
  const topics = [];
  const sections = markdownBody.split(/^## /m).filter(Boolean);

  for (const section of sections) {
    const newlineIndex = section.indexOf('\n');
    if (newlineIndex === -1) continue;

    const heading = section.slice(0, newlineIndex).trim();
    const body = section.slice(newlineIndex + 1).trim();

    if (!heading) continue;

    topics.push({
      heading,
      markdown: body,
      html: marked.parse(body)
    });
  }

  return topics;
}

export default function useGuides(lang = 'he') {
  const guides = useMemo(() => {
    const bySlug = {};

    for (const [filepath, raw] of Object.entries(guideModules)) {
      const filename = filepath.split('/').pop().replace('.md', '');
      if (filename === 'README') continue;

      const enMatch = filename.match(/^(.*)\.en$/);
      const slug = enMatch ? enMatch[1] : filename;
      const fileLang = enMatch ? 'en' : 'he';

      const parsed = parseFrontmatter(raw);
      if (!parsed.data.title) continue;

      bySlug[slug] = bySlug[slug] || {};
      bySlug[slug][fileLang] = parsed;
    }

    const parsedGuides = [];
    for (const [slug, byLang] of Object.entries(bySlug)) {
      const { data, content } = byLang[lang] || byLang.he || byLang.en;
      const topics = parseTopics(content);

      parsedGuides.push({
        slug,
        title: data.title,
        icon: data.icon || 'compass',
        order: data.order ?? 999,
        description: topics.length > 0 ? topics[0].heading : '',
        topics
      });
    }

    parsedGuides.sort((a, b) => a.order - b.order);
    return parsedGuides;
  }, [lang]);

  return { guides, loading: false };
}
