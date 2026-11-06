
export interface Controversy {
  title: string;
  description: string;
  date?: string;
  source_url?: string;
}

export interface Disclosure {
  title: string;
  description: string;
  link?: string;
}

export interface Sponsorship {
  company: string;
  details: string;
  period?: string;
}

export interface CharitableWork {
  organization: string;
  contribution: string;
  year?: string;
}

export interface SourceRef {
  provider: 'wikidata' | 'wikipedia' | 'website' | 'platform';
  title: string;
  url: string;
  /** Short evidence excerpt the app extracted from this source, if any. */
  excerpt?: string;
  /** When this source was last fetched (ISO) — shown as "checked … ago". */
  fetchedAt?: string;
}

export interface EntityData {
  id: string;
  name: string;
  type: 'company' | 'creator';
  description: string;
  ethicalScore: number;
  categories: string[];
  certifications?: string[];
  controversies?: Controversy[];
  website?: string;
  ethical_analysis?: string;
  disclosures?: Disclosure[];
  sponsorships?: Sponsorship[];
  charitable_work?: CharitableWork[];
  /** Scraped evidence provenance: who supplied the record and from where. */
  sources?: SourceRef[];
  /** Lead image (Wikipedia thumbnail) when available. */
  thumbnailUrl?: string;
  /** Public platform handlesresolved from Wikidata. */
  platformLinks?: { label: string; url: string }[];
}
