export type Platform = 'LinkedIn' | 'X' | 'Instagram' | 'YouTube' | 'Web';

export type Priority = 'High' | 'Medium' | 'Low';

export type Status = 'Inbox' | 'In Progress' | 'Completed';

export interface Resource {
  id: string;
  user_id?: string;
  url: string;
  title: string;
  source_platform: Platform;
  category: string;
  priority: Priority;
  status: Status;
  description?: string;
  image_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface ScrapedMetadata {
  url: string;
  title: string;
  description: string;
  platform: Platform;
  image?: string;
  siteName?: string;
}

export type ViewMode = 'kanban' | 'table';

export interface FilterOptions {
  search: string;
  platform: Platform | 'All';
  category: string | 'All';
  priority: Priority | 'All';
}
