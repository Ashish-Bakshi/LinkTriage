import { Resource } from '@/types';

export const INITIAL_MOCK_RESOURCES: Resource[] = [
  {
    id: 'mock-1',
    title: 'How to Build a $1M B2B Outbound Funnel: The 5 Non-Negotiable Steps',
    url: 'https://www.linkedin.com/posts/saas-growth-tactics_coldoutbound-b2bmarketing-leadgen',
    source_platform: 'LinkedIn',
    category: 'Client Acquisition',
    priority: 'High',
    status: 'Inbox',
    description: 'Deep dive into outbound messaging sequences, ICP identification, and conversion benchmarks for enterprise sales.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
  },
  {
    id: 'mock-2',
    title: 'Thread: The Complete Tax Optimization Playbook for High-Earning Founders & Tech Consultants',
    url: 'https://x.com/cabori_cpa/status/17892182091',
    source_platform: 'X',
    category: 'Finance/Tax',
    priority: 'High',
    status: 'In Progress',
    description: 'Breakdown of S-Corp election, Augusta rule, defined benefit plans, and Augusta strategies before Q4 filing.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: 'mock-3',
    title: 'System Design Interview: Distributed Rate Limiter & Token Bucket Algorithm in Go & Redis',
    url: 'https://www.youtube.com/watch?v=distributed-rate-limiter-redis',
    source_platform: 'YouTube',
    category: 'Tech Skills',
    priority: 'Medium',
    status: 'Inbox',
    description: 'Comprehensive code walkthrough covering leaky bucket, token bucket, and Redis cluster atomic execution scripts.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  },
  {
    id: 'mock-4',
    title: 'Reel: 3 Cold Email Hook Formulas that Booked 47 Enterprise Demos in Q3',
    url: 'https://www.instagram.com/reel/C8kP2q91Z/',
    source_platform: 'Instagram',
    category: 'Client Acquisition',
    priority: 'High',
    status: 'In Progress',
    description: 'Framework breakdown of relevance-first copywriting and video snippets that cut through executive inboxes.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
  },
  {
    id: 'mock-5',
    title: 'The Architecture of Modern Frontends: Next.js App Router Performance Guide',
    url: 'https://vercel.com/blog/nextjs-performance-playbook',
    source_platform: 'Web',
    category: 'Tech Skills',
    priority: 'Low',
    status: 'Completed',
    description: 'Partial prerendering (PPR), streaming SSR, cache lifetime policies, and bundle size reduction methods.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
  },
  {
    id: 'mock-6',
    title: 'SaaS Cohort Analysis: Pinpointing the 40% Churn Leak in Mid-Market Tiers',
    url: 'https://x.com/growth_pm/status/1792183901',
    source_platform: 'X',
    category: 'Client Acquisition',
    priority: 'Medium',
    status: 'Completed',
    description: 'How a simple onboarding milestone tweak recovered $320k in annual recurring revenue across churned cohorts.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
  },
  {
    id: 'mock-7',
    title: 'Section 179 & R&D Tax Credits for Tech Startups: 2026 Comprehensive Breakdown',
    url: 'https://www.taxstrategist.io/articles/rd-credits-software-development',
    source_platform: 'Web',
    category: 'Finance/Tax',
    priority: 'Medium',
    status: 'Inbox',
    description: 'Qualifying software development expenses under Section 174 and capitalizing software costs effectively.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString(),
  }
];

export const DEFAULT_CATEGORIES = [
  'Client Acquisition',
  'Finance/Tax',
  'Tech Skills',
  'Leadership',
  'Productivity',
  'Marketing'
];
