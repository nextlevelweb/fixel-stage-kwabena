import { supabase } from "./supabase";

// This function writes one line in the project history (the activity_log table).
// It asks Supabase who is logged in, then saves: which project, who did it,
// what kind of action it was and a short text for the history list (TE-06).
// It gives back true when saving worked and false when it did not.
// This is only for employees. A reviewer logs through a database function.
export async function logActivity(
  projectId: any,
  eventType: string,
  description: string
) {
  const userResult =
    await supabase.auth.getUser();

  const user =
    userResult.data.user;

  if (!user) {
    return false;
  }

  const result =
    await supabase
      .from("activity_log")
      .insert({
        project_id: projectId,
        created_by: user.id,
        actor_type: "medewerker",
        event_type: eventType,
        description: description
      });

  if (result.error) {
    return false;
  }

  return true;
}
