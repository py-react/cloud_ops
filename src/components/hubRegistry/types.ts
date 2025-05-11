interface Publisher {
  id: string;
  name: string;
}

interface Repository {
  name: string;
  namespace: string;
  description: string;
  type: string;
  pull_count: string;
  is_automated: boolean;
  is_official: boolean;
  is_trusted: boolean;
  last_pushed_at: string;
  last_pulled_at: string;
  archived: boolean;
}

interface OperatingSystem {
  name: string;
  label: string;
}

interface Architecture {
  name: string;
  label: string;
}

interface RatePlan {
  id: string;
  repositories: Repository[];
  operating_systems: OperatingSystem[];
  architectures: Architecture[];
}

interface LogoUrl {
  large: string;
  small: string;
}

export interface DockerImage {
  id: string;
  name: string;
  slug: string;
  type: string;
  publisher: Publisher;
  created_at: string;
  updated_at: string;
  short_description: string;
  source: string;
  star_count: number;
  rate_plans: RatePlan[];
  logo_url: LogoUrl;
  extension_reviewed: boolean;
  categories: string[];
  archived: boolean;
}

export interface DockerHubResponse {
  total: number;
  results: DockerImage[];
}