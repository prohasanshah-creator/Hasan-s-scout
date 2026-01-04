export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | "NULL";
  phone: string | "NULL";
  jobTitle: string;
  companyName: string;
  location: string;
  linkedin: string;
  website: string;
  emailConfidence: 'Verified' | 'High' | 'Low' | 'Estimated';
  source?: string;
}

export interface SearchCriteria {
  targetRoles: string;
  keywords: string;
  industries: string;
  location: string;
  includeContactInfo: boolean;
  resultsAmount: number;
}

export interface ScoutStatus {
  isSearching: boolean;
  isLooping: boolean;
  totalFound: number;
  lastSearchTime: string | null;
  logs: string[];
}