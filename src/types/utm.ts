export interface UTMCampaign {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface UTMLink {
  id: string;
  campaign_id: string;
  user_id: string;
  label?: string;
  base_url: string;
  utm_campaign: string;
  utm_source: string;
  utm_medium: string;
  utm_term?: string;
  utm_content?: string;
  created_at: string;
}

export function buildUTMUrl(link: {
  base_url: string;
  utm_campaign: string;
  utm_source: string;
  utm_medium: string;
  utm_term?: string;
  utm_content?: string;
}): string {
  const params = new URLSearchParams();
  params.set('utm_campaign', link.utm_campaign);
  params.set('utm_source', link.utm_source);
  params.set('utm_medium', link.utm_medium);
  if (link.utm_term) params.set('utm_term', link.utm_term);
  if (link.utm_content) params.set('utm_content', link.utm_content);
  let baseUrl = link.base_url;
  // Ensure trailing slash before query params if URL has no path
  if (!baseUrl.includes('?')) {
    try {
      const urlObj = new URL(baseUrl);
      if (urlObj.pathname === '' || urlObj.pathname === '/') {
        urlObj.pathname = '/';
      } else if (!urlObj.pathname.endsWith('/')) {
        // Keep as-is for paths like /produto
      }
      baseUrl = urlObj.toString().replace(/\/$/, '/');
      // Ensure ends with / if it's just the domain
      if (!urlObj.pathname || urlObj.pathname === '/') {
        baseUrl = urlObj.origin + '/';
      }
    } catch {
      // If URL parsing fails, add slash before ? if needed
      if (!baseUrl.endsWith('/') && !baseUrl.includes('?')) {
        const hasPath = baseUrl.replace(/^https?:\/\/[^/]+/, '');
        if (!hasPath || hasPath === '') {
          baseUrl = baseUrl + '/';
        }
      }
    }
  }
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${params.toString()}`;
}
