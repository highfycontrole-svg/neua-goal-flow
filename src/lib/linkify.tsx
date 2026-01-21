import React from 'react';

/**
 * Regex to match URLs (http, https, and www)
 */
const URL_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;

/**
 * Convert URLs in text to clickable links
 */
export function linkifyText(text: string): React.ReactNode[] {
  if (!text) return [];

  const parts = text.split(URL_REGEX);
  const matches = text.match(URL_REGEX) || [];

  const result: React.ReactNode[] = [];
  let matchIndex = 0;

  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) {
      // Check if this part is a URL
      if (URL_REGEX.test(parts[i])) {
        const url = parts[i].startsWith('http') ? parts[i] : `https://${parts[i]}`;
        result.push(
          <a
            key={`link-${i}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {parts[i]}
          </a>
        );
        matchIndex++;
      } else {
        result.push(<span key={`text-${i}`}>{parts[i]}</span>);
      }
    }
  }

  return result;
}

/**
 * Render text with line breaks and clickable links
 */
export function renderTextWithLinksAndBreaks(text: string | null | undefined): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => (
    <React.Fragment key={lineIndex}>
      {linkifyText(line)}
      {lineIndex < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}
