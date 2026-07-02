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
  day_number: 1 | 2 | 3;
  title: string;
  content_body: string | null;
  deliverable_instructions: string | null;
  deliverable_type: 'text' | 'file' | 'video' | 'pending_confirmation';
  requires_admin_approval: boolean;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
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
}

/**
 * WorkshopDeliverableSubmission: History of all deliverable submissions
 */
export interface WorkshopDeliverableSubmission {
  id: string;
  workshop_day_id: string;
  profile_id: string;
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
  submission_text?: string;
  file?: File;
  external_video_url?: string;
}

/**
 * SubmissionWithMetadata: Submission enriched with user and day metadata
 * Used in admin review interface
 */
export interface SubmissionWithMetadata extends WorkshopDeliverableSubmission {
  day_title: string;
  day_number: 1 | 2 | 3;
  participant_name: string;
  participant_email: string;
  deliverable_status: 'not_submitted' | 'submitted' | 'approved' | 'rejected';
  review_note?: string | null;
}

/**
 * ProgressWithDayInfo: Progress record with associated day information
 * Used in admin review dashboard
 */
export interface ProgressWithDayInfo extends WorkshopProgress {
  day_title: string;
  day_number: 1 | 2 | 3;
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
  day_number: 1 | 2 | 3;
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
