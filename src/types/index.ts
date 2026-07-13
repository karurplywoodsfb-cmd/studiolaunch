// ─── Core Domain Types ────────────────────────────────────────────────────────

export type FinishTier = 'premium' | 'luxury' | 'ultra'
export type PlanType   = 'starter' | 'studio' | 'agency'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
export type ProjectCategory = 'villa' | 'apartment' | 'commercial' | 'other'

// ─── Tenant (Studio) ──────────────────────────────────────────────────────────

export type SiteTheme = 'noir' | 'ivory'

export interface StudioBranding {
  business_name: string
  tagline: string
  logo_letter: string
  primary_color: string      // hex
  accent_color: string       // hex
  theme?: SiteTheme          // which tenant-site template to render, defaults to 'noir'
}

export interface StudioContact {
  phone_number: string
  phone_display: string
  email: string
  instagram_handle: string
  houzz_handle?: string
  whatsapp_number?: string   // digits only w/ country code, e.g. "919876543210" — falls back to phone_number
}

export interface StudioLocation {
  street_address: string
  local_city: string
  state: string
  pin_code: string
  geo_latitude: string
  geo_longitude: string
  service_radius_km: number
}

export interface StudioStats {
  project_count: number
  years_active: number
  sqft_total: string     // e.g. "12" for 12 lakh
  city_radius: number
}

export interface StudioContent {
  hero_headline_line1: string
  hero_headline_line2: string
  hero_headline_line3: string
  hero_subtext: string
  hero_image_url: string
}

export interface Tenant {
  id: string
  user_id: string
  subdomain: string
  custom_domain: string | null
  domain_verified?: boolean
  domain_verification_token?: string | null
  plan: PlanType
  plan_status: 'active' | 'trialing' | 'past_due' | 'canceled'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  branding: StudioBranding
  contact: StudioContact
  location: StudioLocation
  stats: StudioStats
  content: StudioContent
  seo_enriched:          boolean
  meta_description:      string | null
  google_place_id:       string | null
  google_rating:         number | null
  google_review_count:   number | null
  reviews_last_synced:   string | null
  white_label:           boolean
  custom_footer_text:    string | null
  created_at: string
  updated_at: string
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export interface PortfolioProject {
  id: string
  tenant_id: string
  title: string
  category: ProjectCategory
  location: string
  area_sqft: number
  finish_tier: FinishTier
  year: number
  cover_image_url: string
  images: string[]
  tags: string[]
  display_order: number
  published: boolean
  created_at: string
}

// ─── Case Study ───────────────────────────────────────────────────────────────

export interface CaseStudy {
  id: string
  tenant_id: string
  title: string
  subtitle: string
  // Project Arc phases
  brief_heading: string
  brief_body: string
  challenge_heading: string
  challenge_body: string
  solution_heading: string
  solution_body: string
  outcome_heading: string
  outcome_body: string
  // Metadata sidebar
  client_type: string
  location: string
  area_sqft: number
  scope: string
  duration_weeks: number
  finish_tier: FinishTier
  primary_materials: string[]
  year: number
  // Outcome stats
  stat_1_value: string
  stat_1_label: string
  stat_2_value: string
  stat_2_label: string
  stat_3_value: string
  stat_3_label: string
  // Images
  hero_image_url: string
  before_image_url: string
  after_image_url: string
  solution_images: string[]
  published: boolean
  created_at: string
  slug?: string
  seo_title?: string
  seo_description?: string
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export interface FAQItem {
  id: string
  tenant_id: string
  question: string
  answer: string
  display_order: number
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export interface Lead {
  id: string
  tenant_id: string
  name: string
  phone: string
  email: string | null
  property_type: string
  scope: string
  budget_tier: string
  project_location: string | null
  notes: string | null
  status: LeadStatus
  source: string
  created_at: string
}

export interface LeadActivity {
  id: string
  lead_id: string
  tenant_id: string
  type: 'note' | 'status_change'
  content: string
  created_by: string | null
  created_at: string
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export interface OnboardingStep {
  step: number
  title: string
  description: string
  completed: boolean
}

export type OnboardingData = {
  // Step 1 — Branding
  business_name: string
  tagline: string
  logo_letter: string
  // Step 2 — Location
  local_city: string
  state: string
  street_address: string
  pin_code: string
  geo_latitude: string
  geo_longitude: string
  service_radius_km: number
  // Step 3 — Contact
  phone_number: string
  phone_display: string
  email: string
  instagram_handle: string
  // Step 4 — Stats & subdomain
  project_count: number
  years_active: number
  sqft_total: string
  subdomain: string
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = void> {
  data?: T
  error?: string
  message?: string
}

// ─── Google Reviews ───────────────────────────────────────────────────────────

export interface GoogleReview {
  id:            string
  tenant_id:     string
  google_place_id?: string
  author_name:   string
  author_photo?: string
  rating:        number
  text?:         string
  time?:         number
  relative_time?: string
  display_order: number
  is_featured:   boolean
  created_at:    string
}

// ─── Team Members ─────────────────────────────────────────────────────────────

export type TeamRole = 'owner' | 'editor'

export interface TeamMember {
  id:               string
  tenant_id:        string
  user_id?:         string
  email:            string
  role:             TeamRole
  name?:            string
  invite_token?:    string
  invite_accepted:  boolean
  invited_at:       string
  accepted_at?:     string
  created_at:       string
}

// ─── Service Area ─────────────────────────────────────────────────────────────

export interface ServiceArea {
  id:            string
  tenant_id:     string
  city:          string
  state?:        string
  pin_codes:     string[]
  is_primary:    boolean
  display_order: number
}

// ─── Extended Portfolio Project (with SEO fields) ─────────────────────────────

export interface PortfolioProjectSEO extends PortfolioProject {
  slug?:               string
  seo_title?:          string
  seo_description?:    string
  full_description?:   string
  challenge_text?:     string
  solution_text?:      string
  testimonial_quote?:  string
  testimonial_name?:   string
  materials?:          { label: string; value: string }[]   // e.g. {label:"Flooring", value:"Italian marble"}
  geo_latitude?:       string   // per-project GPS, e.g. "10.8155" — improves local search relevance for that specific neighborhood
  geo_longitude?:      string
}

export interface PlanConfig {
  name: string
  price_monthly: number
  price_yearly: number
  stripe_price_id_monthly: string
  stripe_price_id_yearly: string
  features: string[]
  limits: {
    portfolio_items: number
    case_studies: number
    custom_domain: boolean
    seo_enrichment: boolean
    team_members: number
    analytics: boolean
    white_label: boolean
  }
}

export const PLANS: Record<PlanType, PlanConfig> = {
  starter: {
    name: 'Starter',
    price_monthly: 999,
    price_yearly: 8999,
    stripe_price_id_monthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY || '',
    stripe_price_id_yearly:  process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY  || '',
    features: [
      'Studio website on subdomain',
      'Consultation form + lead inbox',
      '5 portfolio items',
      '1 case study',
      'Basic analytics',
    ],
    limits: {
      portfolio_items: 5,
      case_studies: 1,
      custom_domain: false,
      seo_enrichment: false,
      team_members: 1,
      analytics: true,
      white_label: false,
    },
  },
  studio: {
    name: 'Studio',
    price_monthly: 2499,
    price_yearly: 22999,
    stripe_price_id_monthly: process.env.NEXT_PUBLIC_STRIPE_STUDIO_MONTHLY || '',
    stripe_price_id_yearly:  process.env.NEXT_PUBLIC_STRIPE_STUDIO_YEARLY  || '',
    features: [
      'Everything in Starter',
      'Custom domain + SSL',
      'Unlimited portfolio items',
      'Unlimited case studies',
      'AI SEO enrichment',
      'Advanced analytics',
    ],
    limits: {
      portfolio_items: Infinity,
      case_studies: Infinity,
      custom_domain: true,
      seo_enrichment: true,
      team_members: 3,
      analytics: true,
      white_label: false,
    },
  },
  agency: {
    name: 'Agency',
    price_monthly: 5999,
    price_yearly: 54999,
    stripe_price_id_monthly: process.env.NEXT_PUBLIC_STRIPE_AGENCY_MONTHLY || '',
    stripe_price_id_yearly:  process.env.NEXT_PUBLIC_STRIPE_AGENCY_YEARLY  || '',
    features: [
      'Everything in Studio',
      'White-label (remove our branding)',
      'Up to 10 team members',
      'Priority support',
      'Multiple site variants',
    ],
    limits: {
      portfolio_items: Infinity,
      case_studies: Infinity,
      custom_domain: true,
      seo_enrichment: true,
      team_members: 10,
      analytics: true,
      white_label: true,
    },
  },
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminTenantView {
  id:                  string
  subdomain:           string
  custom_domain:       string | null
  plan:                PlanType
  plan_status:         string
  white_label:         boolean
  created_at:          string
  business_name:       string
  local_city:          string
  email:               string
  lead_count:          number
  portfolio_count:     number
  page_views_30d:      number
  stripe_customer_id:  string | null
}

export interface TenantEvent {
  id:         number
  tenant_id:  string
  event_type: string
  metadata:   Record<string, unknown>
  created_at: string
}

// ─── Extended ServiceArea with SEO ───────────────────────────────────────────

export interface ServiceAreaSEO extends ServiceArea {
  seo_h1?:          string
  seo_intro?:       string
  seo_description?: string
  nearby_cities?:   string[]
}
