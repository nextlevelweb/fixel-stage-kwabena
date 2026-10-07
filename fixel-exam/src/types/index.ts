// src/types/index.ts

// A project inside Fixel
export type Project = {
  id: string;
  created_by: string;
  name: string;
  url: string;
  public_key: string;
  created_at: string;
};


// One feedback point placed on the website
export type Feedback = {
  id: string;
  project_id: string;

  // Position of the pin
  x_percent: number;
  y_percent: number;

  comment: string;

  // Fixel only uses these 3 statuses
  status: "open" | "bezig" | "afgerond";

  created_at: string;
};


// A reply underneath a feedback point
export type Reply = {
  id: string;
  feedback_id: string;

  // Empty when a customer replies without an account
  created_by: string | null;

  author_type: "medewerker" | "reviewer";
  author_name: string | null;

  message: string;
  created_at: string;
};


// One item in the project history
export type Activity = {
  id: string;
  project_id: string;

  created_by: string | null;

  actor_type: "medewerker" | "reviewer";

  type_gebeurtenis: string;
  omschrijving: string;

  created_at: string;
};