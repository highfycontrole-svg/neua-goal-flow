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
  const separator = link.base_url.includes('?') ? '&' : '?';
  return `${link.base_url}${separator}${params.toString()}`;
}
