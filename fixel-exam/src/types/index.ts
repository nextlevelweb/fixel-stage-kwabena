// src/types/index.ts

export type Project = {
  id: number;
  created_by: string;
  name: string;
  url: string;
  public_key: string;
  created_at: string;
};


export type Feedback = {
  id: number;
  project_id: number;

  x_percent: number;
  y_percent: number;

  comment: string;

  status:
    | "open"
    | "bezig"
    | "afgerond";

  created_at: string;
};


export type Reply = {
  id: number;
  feedback_id: number;

  created_by: string | null;

  author_type:
    | "medewerker"
    | "reviewer";

  author_name: string | null;

  message: string;

  created_at: string;
};


export type Activity = {
  id: number;
  project_id: number;

  created_by: string | null;

  actor_type:
    | "medewerker"
    | "reviewer";

  event_type: string;
  description: string;

  created_at: string;
};
