export type HelpdeskCategory = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

export type HelpdeskTag = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

export type HelpdeskQuestionStatus = 'open' | 'answered' | 'closed';

export type HelpdeskQuestion = {
  id: string;
  title: string;
  description: string;
  category_id: string | null;
  author_id: string;
  status: HelpdeskQuestionStatus;
  view_count: number;
  created_at: string;
  updated_at: string;
  // Joins
  category?: HelpdeskCategory;
  tags?: HelpdeskTag[];
  author?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
  answer_count?: number;
};

export type HelpdeskAnswer = {
  id: string;
  question_id: string;
  author_id: string;
  content: string;
  is_promoted_to_faq: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  author?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
};

export type HelpdeskNotification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};
