export interface ProfileSettings {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface IntegrationSummary {
  id: "ai" | "email" | "storage";
  provider: string;
  status: "active" | "inactive";
}
