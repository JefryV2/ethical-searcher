
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
}
