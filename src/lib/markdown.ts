/**
 * Lightweight markdown-to-HTML renderer.
 * Supports: headings, paragraphs, bold, italic, links, lists (ul/ol), blockquotes, inline code, hr.
 * No external dependencies.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function processInline(text: string): string {
  let result = escapeHtml(text);

  // Links: [text](url)
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-gold hover:underline" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // Bold+italic: ***text*** or ___text___
  result = result.replace(/\*{3}(.+?)\*{3}/g, '<strong><em>$1</em></strong>');
  result = result.replace(/_{3}(.+?)_{3}/g, '<strong><em>$1</em></strong>');

  // Bold: **text** or __text__
  result = result.replace(/\*{2}(.+?)\*{2}/g, '<strong>$1</strong>');
  result = result.replace(/_{2}(.+?)_{2}/g, '<strong>$1</strong>');

  // Italic: *text* or _text_
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(/_(.+?)_/g, '<em>$1</em>');

  // Inline code: `code`
  result = result.replace(
    /`([^`]+)`/g,
    '<code class="bg-warm-white px-1.5 py-0.5 rounded text-sm font-mono">$1</code>',
  );

  return result;
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  const html: string[] = [];
  let inList: 'ul' | 'ol' | null = null;
  let inBlockquote = false;
  let paragraphBuffer: string[] = [];

  function flushParagraph() {
    if (paragraphBuffer.length > 0) {
      html.push(`<p class="mb-4 leading-relaxed text-text-light">${processInline(paragraphBuffer.join(' '))}</p>`);
      paragraphBuffer = [];
    }
  }

  function closeList() {
    if (inList) {
      html.push(inList === 'ul' ? '</ul>' : '</ol>');
      inList = null;
    }
  }

  function closeBlockquote() {
    if (inBlockquote) {
      html.push('</blockquote>');
      inBlockquote = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line
    if (trimmed === '') {
      flushParagraph();
      closeList();
      closeBlockquote();
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph();
      closeList();
      closeBlockquote();
      html.push('<hr class="my-8 border-gold-pale" />');
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      closeList();
      closeBlockquote();
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const sizes: Record<number, string> = {
        1: 'text-3xl mt-10 mb-4',
        2: 'text-2xl mt-8 mb-3',
        3: 'text-xl mt-6 mb-2',
        4: 'text-lg mt-5 mb-2',
        5: 'text-base mt-4 mb-1',
        6: 'text-sm mt-4 mb-1',
      };
      html.push(
        `<h${level} class="font-serif font-semibold text-text-dark ${sizes[level]}">${processInline(text)}</h${level}>`,
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushParagraph();
      closeList();
      if (!inBlockquote) {
        html.push('<blockquote class="border-l-4 border-gold pl-4 my-4 italic text-text-muted">');
        inBlockquote = true;
      }
      html.push(`<p class="mb-2">${processInline(trimmed.slice(2))}</p>`);
      continue;
    } else if (inBlockquote) {
      closeBlockquote();
    }

    // Unordered list
    const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      if (inList !== 'ul') {
        closeList();
        html.push('<ul class="list-disc list-inside mb-4 space-y-1 text-text-light">');
        inList = 'ul';
      }
      html.push(`<li>${processInline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      if (inList !== 'ol') {
        closeList();
        html.push('<ol class="list-decimal list-inside mb-4 space-y-1 text-text-light">');
        inList = 'ol';
      }
      html.push(`<li>${processInline(olMatch[1])}</li>`);
      continue;
    }

    // Close list if we're not in a list item
    if (inList) {
      closeList();
    }

    // Regular text -> paragraph buffer
    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  closeList();
  closeBlockquote();

  return html.join('\n');
}
