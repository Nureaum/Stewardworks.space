// ============================================================
// Workshop Types - Database Table Interfaces
// ============================================================

/**
 * Cohort: Represents a scheduled instance of the 3-day workshop
 */
export interface Cohort {
  id: string;
  name: string;
  description: string | null;
  start_date: string; // ISO 8601 timestamp
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  capacity: number | null;
  status: 'draft' | 'open' | 'closed' | 'completed';
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}

/**
 * WorkshopDay: Individual day content (1, 2, or 3) within a cohort
 */
export interface WorkshopDay {
  id: string;
  cohort_id: string;
  day_number: number;
  title: string;
  content_body: string | null;
  deliverable_instructions: string | null;
  deliverable_type: 'text' | 'file' | 'video' | 'pending_confirmation';
  requires_admin_approval: boolean;
  // Gamified scene fields (Phase 1)
  intro: string | null;
  blurb: string | null;
  scene_config: SceneConfig | null;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}

/**
 * SceneConfig: Theme configuration for the side-scroll scene per day
 */
export interface SceneConfig {
  label?: string;       // e.g. "ACT I · THE SANCTUARY"
  key?: string;         // e.g. "sanctuary"
  sky?: [string, string, string]; // gradient stops [top, mid, bottom]
  far?: string;         // far parallax layer color
  mid?: string;         // midground layer color
  ground?: string;      // ground color
  groundEdge?: string;  // ground top-edge border
  accent?: string;      // scene accent color
  glow?: string;        // accent glow color for artifacts
  pedestal?: [string, string]; // pedestal colors [light, dark]
}

/**
 * WorkshopDayMedia: Media attachments for workshop days (PDFs, videos, images, links)
 */
export interface WorkshopDayMedia {
  id: string;
  workshop_day_id: string;
  media_type: 'pdf' | 'video_link' | 'external_link' | 'image';
  url: string;
  storage_path: string | null;
  label: string | null;
  sort_order: number;
  created_at: string;
}

/**
 * WorkshopRegistration: Enrollment record linking participants to cohorts
 */
export interface WorkshopRegistration {
  id: string;
  cohort_id: string;
  profile_id: string;
  registered_at: string;
  status: 'registered' | 'waitlisted' | 'cancelled';
}

/**
 * WorkshopProgress: Per-user, per-day progress tracking
 */
export interface WorkshopProgress {
  id: string;
  workshop_day_id: string;
  profile_id: string;
  unlocked_at: string | null;
  deliverable_submitted_at: string | null;
  deliverable_status: 'not_submitted' | 'submitted' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  completed_media_ids: string[];
  // Gamified Chia Guardian field (Phase 1)
  chia_manual_pct: number;
}

/**
 * WorkshopDeliverableSubmission: History of all deliverable submissions
 */
export interface WorkshopDeliverableSubmission {
  id: string;
  workshop_day_id: string;
  profile_id: string;
  title: string | null;
  description: string | null;
  submission_text: string | null;
  file_storage_path: string | null;
  external_video_url: string | null;
  submitted_at: string;
}

// ============================================================
// Derived/Computed Types for UI Layer
// ============================================================

/**
 * DayWithProgress: Workshop day enriched with progress state and unlock status
 * Used in participant dashboard to show which days are accessible
 */
export interface DayWithProgress extends WorkshopDay {
  unlocked: boolean;
  progress: WorkshopProgress | null;
  unlock_message: string | null;
  media: WorkshopDayMedia[];
}

/**
 * CohortWithRegistrationCount: Cohort enriched with registration statistics
 * Used in public cohort listing and admin views
 */
export interface CohortWithRegistrationCount extends Cohort {
  registered_count: number;
  waitlisted_count?: number;
}

/**
 * CohortWithUserRegistration: Cohort with user's registration status
 * Used in public cohort listing to show if user is already registered
 */
export interface CohortWithUserRegistration extends CohortWithRegistrationCount {
  user_registration?: {
    status: 'registered' | 'waitlisted' | 'cancelled';
  } | null;
}

/**
 * SubmissionData: Form data for deliverable submission
 * Used by DeliverableSubmissionForm component
 */
export interface SubmissionData {
  title?: string;
  description?: string;
  submission_text?: string;
  file?: File;
  external_video_url?: string;
  principle_id?: string;
  showcase_requested?: boolean;
}

/**
 * SubmissionWithMetadata: Submission enriched with user and day metadata
 * Used in admin review interface
 */
export interface SubmissionWithMetadata extends WorkshopDeliverableSubmission {
  day_title: string;
  day_number: number;
  participant_name: string;
  participant_email: string;
  deliverable_status: 'not_submitted' | 'submitted' | 'approved' | 'rejected';
  review_note?: string | null;
  principle_id?: string | null;
  progress_id?: string;
}

/**
 * ProgressWithDayInfo: Progress record with associated day information
 * Used in admin review dashboard
 */
export interface ProgressWithDayInfo extends WorkshopProgress {
  day_title: string;
  day_number: number;
  cohort_id: string;
  cohort_name: string;
}

// ============================================================
// Server Action Parameter and Return Types
// ============================================================

/**
 * RegisterForCohortResult: Return value from registerForCohort action
 */
export interface RegisterForCohortResult {
  status: 'registered' | 'waitlisted';
  cohortName: string;
  startDate: string;
}

/**
 * SubmitDeliverableParams: Parameters for submitDeliverable action
 */
export interface SubmitDeliverableParams {
  dayId: string;
  submissionData: SubmissionData;
}

/**
 * SubmitDeliverableResult: Return value from submitDeliverable action
 */
export interface SubmitDeliverableResult {
  success: boolean;
  submissionId: string;
  message: string;
}

/**
 * ReviewDeliverableParams: Parameters for reviewDeliverable action (admin)
 */
export interface ReviewDeliverableParams {
  progressId: string;
  status: 'approved' | 'rejected';
  reviewNote?: string;
}

/**
 * ReviewDeliverableResult: Return value from reviewDeliverable action
 */
export interface ReviewDeliverableResult {
  success: boolean;
  message: string;
  nextDayUnlocked?: boolean;
  bankedPrinciple?: WorkshopProgressPrinciple;
}

/**
 * CreateCohortParams: Parameters for createCohort action (admin)
 */
export interface CreateCohortParams {
  name: string;
  description: string | null;
  start_date: string;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  capacity: number | null;
  status: 'draft' | 'open' | 'closed' | 'completed';
}

/**
 * UpdateCohortParams: Parameters for updateCohort action (admin)
 */
export interface UpdateCohortParams extends CreateCohortParams {
  id: string;
}

/**
 * CreateWorkshopDayParams: Parameters for createWorkshopDay action (admin)
 */
export interface CreateWorkshopDayParams {
  cohort_id: string;
  day_number: number;
  title: string;
  content_body: string | null;
  deliverable_instructions: string | null;
  deliverable_type: 'text' | 'file' | 'video' | 'pending_confirmation';
  requires_admin_approval: boolean;
}

/**
 * UpdateWorkshopDayParams: Parameters for updateWorkshopDay action (admin)
 */
export interface UpdateWorkshopDayParams extends CreateWorkshopDayParams {
  id: string;
}

/**
 * CreateMediaParams: Parameters for createWorkshopDayMedia action (admin)
 */
export interface CreateMediaParams {
  workshop_day_id: string;
  media_type: 'pdf' | 'video_link' | 'external_link' | 'image';
  url: string;
  storage_path: string | null;
  label: string | null;
  sort_order: number;
}

/**
 * UpdateMediaParams: Parameters for updateWorkshopDayMedia action (admin)
 */
export interface UpdateMediaParams extends CreateMediaParams {
  id: string;
}

/**
 * UpdateRegistrationStatusParams: Parameters for admin to move waitlisted to registered
 */
export interface UpdateRegistrationStatusParams {
  registrationId: string;
  newStatus: 'registered' | 'waitlisted' | 'cancelled';
}

/**
 * GetDashboardResult: Return value from getWorkshopDashboard action
 */
export interface GetDashboardResult {
  cohort: Cohort;
  days: DayWithProgress[];
  registration: WorkshopRegistration;
}

/**
 * GetAdminReviewsResult: Return value from getDeliverablesToReview action
 */
export interface GetAdminReviewsResult {
  submissions: SubmissionWithMetadata[];
  progressRecords: ProgressWithDayInfo[];
}

// ============================================================
// Component Prop Types
// ============================================================

/**
 * CohortCardProps: Props for CohortCard component
 */
export interface CohortCardProps {
  cohort: CohortWithUserRegistration;
  onRegister?: (cohortId: string) => Promise<RegisterForCohortResult>;
  hasCompletedOnboarding?: boolean;
}

/**
 * WorkshopDayStepperProps: Props for WorkshopDayStepper component
 */
export interface WorkshopDayStepperProps {
  days: DayWithProgress[];
  cohortId: string;
  currentDayNumber?: number;
}

/**
 * DayContentProps: Props for DayContent component
 */
export interface DayContentProps {
  day: DayWithProgress;
  cohortId: string;
}

/**
 * DeliverableSubmissionFormProps: Props for DeliverableSubmissionForm component
 */
export interface DeliverableSubmissionFormProps {
  dayId: string;
  deliverableType: 'text' | 'file' | 'video' | 'pending_confirmation';
  deliverableInstructions: string;
  existingSubmission?: WorkshopDeliverableSubmission;
  onSubmit: (data: SubmissionData) => Promise<void>;
}

/**
 * DeliverableStatusBadgeProps: Props for DeliverableStatusBadge component
 */
export interface DeliverableStatusBadgeProps {
  status: 'not_submitted' | 'submitted' | 'approved' | 'rejected';
  reviewNote?: string | null;
}

/**
 * RegistrationButtonProps: Props for RegistrationButton component
 */
export interface RegistrationButtonProps {
  cohortId: string;
  cohortStatus: 'draft' | 'open' | 'closed' | 'completed';
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  capacity: number | null;
  registeredCount: number;
  userRegistration?: {
    status: 'registered' | 'waitlisted' | 'cancelled';
  } | null;
  onRegister: (cohortId: string) => Promise<RegisterForCohortResult>;
  hasCompletedOnboarding?: boolean;
}

/**
 * DeliverableReviewCardProps: Props for DeliverableReviewCard component (admin)
 */
export interface DeliverableReviewCardProps {
  submission: SubmissionWithMetadata;
  progressId: string;
  onReview: (status: 'approved' | 'rejected', note?: string) => Promise<void>;
}

/**
 * CohortFormProps: Props for CohortForm component (admin)
 */
export interface CohortFormProps {
  initialData?: Cohort;
  onSubmit: (data: CreateCohortParams | UpdateCohortParams) => Promise<void>;
  onCancel: () => void;
}

/**
 * WorkshopDayFormProps: Props for WorkshopDayForm component (admin)
 */
export interface WorkshopDayFormProps {
  cohortId: string;
  initialData?: WorkshopDay;
  onSubmit: (data: CreateWorkshopDayParams | UpdateWorkshopDayParams) => Promise<void>;
  onCancel: () => void;
}

/**
 * MediaUploaderProps: Props for MediaUploader component (admin)
 */
export interface MediaUploaderProps {
  workshopDayId: string;
  existingMedia: WorkshopDayMedia[];
  onMediaAdd: (data: CreateMediaParams) => Promise<void>;
  onMediaUpdate: (data: UpdateMediaParams) => Promise<void>;
  onMediaDelete: (mediaId: string) => Promise<void>;
}

/**
 * RegistrantListProps: Props for RegistrantList component (admin)
 */
export interface RegistrantListProps {
  cohortId: string;
  registrations: Array<WorkshopRegistration & {
    participant_name: string;
    participant_email: string;
  }>;
  onStatusUpdate: (params: UpdateRegistrationStatusParams) => Promise<void>;
}

/**
 * AILab: Represents an AI Lab section linked to a cohort
 */
export interface AILab {
  id: string;
  cohort_id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * AILabWithCohort: AILab enriched with its associated Cohort name
 */
export interface AILabWithCohort extends AILab {
  cohort_name: string;
  creator?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

export interface CreateAILabParams {
  cohort_id: string;
  title: string;
  content: string;
}

export interface UpdateAILabParams extends CreateAILabParams {
  id: string;
}

// ============================================================
// Gamified Workshop Types — Phase 1 (New Tables)
// ============================================================

/**
 * WorkshopCharacter: User's avatar selection and customization per cohort
 */
export interface WorkshopCharacter {
  id: string;
  cohort_id: string;
  profile_id: string;
  character_key: string;    // e.g. 'nayeli', 'kai', 'sol'
  player_name: string;
  accent_color: string;     // hex color for signal aura
  tint: string;             // skin/field tint key
  headgear: string;
  loadout: string;          // field kit key
  outfit: string;
  hair: string;
  hair_color: string;       // hex
  facial: string;           // facial hair key
  companion: string;
  created_at: string;
  updated_at: string;
}

/**
 * WorkshopPrinciple: Admin-defined steward principles per cohort
 */
export interface WorkshopPrinciple {
  id: string;
  cohort_id: string;
  name: string;
  description: string | null;
  example: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * WorkshopDaySection: A time-block section within a workshop day
 */
export interface WorkshopDaySection {
  id: string;
  workshop_day_id: string;
  section_key: string;      // 'A', 'B', 'C'
  hour: string | null;      // e.g. "9:00 – 10:30 AM"
  title: string;
  duration: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * WorkshopDayEntry: Individual topic entry within a section
 */
export type WorkshopEntryType = 'text' | 'list' | 'dual' | 'featured' | 'deliverable';

export interface WorkshopDayEntry {
  id: string;
  section_id: string;
  entry_type: WorkshopEntryType;
  title: string;
  subtitle: string | null;
  // Type: text
  body: string | null;
  // Type: list
  items: string[];          // string array
    external_video_url?: string | null;
  // Type: dual
  modern_title: string | null;
  modern_body: string | null;
  ancient_title: string | null;
  ancient_body: string | null;
  framework: string | null;
  // Type: featured
  contrib_id: string | null;
  note: string | null;
  // Type: deliverable
  goal: string | null;
  applied: string | null;
  lab: string | null;
  submit_label: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * WorkshopEntryMedia: Media attachment on an entry
 */
export interface WorkshopEntryMedia {
  id: string;
  entry_id: string;
  kind: 'link' | 'photo' | 'video' | 'audio';
  label: string | null;
  url: string | null;
  file_name: string | null;
  storage_path: string | null;
  sort_order: number;
  created_at: string;
}

/**
 * WorkshopEngagement: Student engagement item for Chia Guardian growth
 */
export type EngagementKind = 'bookmark' | 'note' | 'prompt' | 'mini_deliverable' | 'generation' | 'env_suggestion' | 'wf_suggestion' | 'lib_suggestion' | 'job_quest_suggestion';
export type EngagementStatus = 'pending' | 'approved' | 'rejected';

export interface WorkshopEngagement {
  id: string;
  cohort_id: string;
  profile_id: string;
  kind: EngagementKind;
  title: string;
  source: string | null;
  url: string | null;
  content: string | null;
  showcase_item_id: string | null;
  status: EngagementStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
}

/**
 * WorkshopShowcase: Community showcase contribution
 */
export type ShowcaseType = 'video' | 'article' | 'audio' | 'aigen';

export interface WorkshopShowcase {
  id: string;
  cohort_id: string;
  title: string;
  author: string | null;
  type: ShowcaseType;
  url: string | null;
  blurb: string | null;
  meta: string | null;
  theme: string | null;
  is_paid: boolean;
  project_type: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * WorkshopProgressPrinciple: Junction — principle banked on a day
 */
export interface WorkshopProgressPrinciple {
  id: string;
  progress_id: string;
  principle_id: string;
  banked_at: string;
}

/**
 * WorkshopVisitedEntry: Tracks visited artifacts in the scene
 */
export interface WorkshopVisitedEntry {
  id: string;
  cohort_id: string;
  profile_id: string;
  entry_id: string;
  visited_at: string;
}

// ============================================================
// Gamified Workshop — Derived UI Types
// ============================================================

/**
 * SectionWithEntries: Section enriched with its child entries
 */
export interface SectionWithEntries extends WorkshopDaySection {
  entries: WorkshopDayEntry[];
}

/**
 * DayWithSections: Workshop day enriched with sections, entries, and scene config
 */
export interface DayWithSections extends WorkshopDay {
  sections: SectionWithEntries[];
}

/**
 * EntryWithMedia: Entry enriched with its media attachments
 */
export interface EntryWithMedia extends WorkshopDayEntry {
  media: WorkshopEntryMedia[];
}

/**
 * JourneyState: Full client-side state for the gamified journey
 */
export interface JourneyState {
  character: WorkshopCharacter | null;
  days: DayWithSections[];
  progress: Record<number, WorkshopProgress | null>; // keyed by day_number
  principles: WorkshopPrinciple[];
  bankedPrinciples: WorkshopProgressPrinciple[];
  engagements: WorkshopEngagement[];
  visitedEntries: string[];  // entry IDs
  showcase: WorkshopShowcase[];
}

// ============================================================
// Gamified Workshop — Server Action Param Types
// ============================================================

export interface SaveCharacterParams {
  cohort_id: string;
  character_key: string;
  player_name: string;
  accent_color: string;
  tint: string;
  headgear: string;
  loadout: string;
  outfit: string;
  hair: string;
  hair_color: string;
  facial: string;
  companion: string;
}

export interface CreatePrincipleParams {
  cohort_id: string;
  name: string;
  description?: string;
  example?: string;
}

export interface UpdatePrincipleParams {
  id: string;
  name?: string;
  description?: string;
  example?: string;
}

export interface CreateSectionParams {
  workshop_day_id: string;
  section_key: string;
  hour?: string;
  title: string;
  duration?: string;
}

export interface UpdateSectionParams {
  id: string;
  hour?: string;
  title?: string;
  duration?: string;
}

export interface CreateEntryParams {
  section_id: string;
  entry_type: WorkshopEntryType;
  title?: string;
}

export interface UpdateEntryParams {
  id: string;
  entry_type?: WorkshopEntryType;
  title?: string;
  subtitle?: string;
  body?: string;
  items?: string[];
  modern_title?: string;
  modern_body?: string;
  ancient_title?: string;
  ancient_body?: string;
  framework?: string;
  contrib_id?: string;
  note?: string;
  goal?: string;
  applied?: string;
  lab?: string;
  submit_label?: string;
}

export interface CreateEntryMediaParams {
  entry_id: string;
  kind: 'link' | 'photo' | 'video' | 'audio';
  label?: string;
  url?: string;
}

export interface AddEngagementParams {
  cohort_id: string;
  kind: EngagementKind;
  title: string;
  source?: string;
  url?: string;
  content?: string;
  showcase_item_id?: string;
}

export interface CreateShowcaseParams {
  cohort_id: string;
  title: string;
  author?: string;
  type: ShowcaseType;
  url?: string;
  blurb?: string;
  meta?: string;
  theme?: string;
  is_paid?: boolean;
}

export interface UpdateShowcaseParams extends Partial<CreateShowcaseParams> {
  id: string;
}

export interface SubmitDayWithPrinciplesParams {
  cohort_id: string;
  day_number: number;
  link?: string;
  file?: File;
  file_name?: string;
  principle_ids: string[];
}
