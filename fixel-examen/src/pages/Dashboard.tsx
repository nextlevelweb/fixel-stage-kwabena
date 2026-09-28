import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { isValidUrl } from "../validation";

// This is what one row in the "projects" table looks like (chapter 14.2) as a TypeScript type.
type Project = {
  id: number;
  name: string;
  url: string;
  public_key: string;
  created_at: string;
};

// The three only allowed status values (must match the database enum exactly).
type FeedbackStatus = "open" | "bezig" | "afgerond";

export default function Dashboard() {
  const navigate = useNavigate();

  // The projects of the logged-in employee, plus per project the number of open
  // feedback points and the totals across ALL projects (for the counters at the top).
  const [projects, setProjects] = useState<Project[]>([]);
  const [openCountByProject, setOpenCountByProject] = useState<Record<number, number>>({});
  const [totals, setTotals] = useState({ open: 0, bezig: 0, afgerond: 0 });
  const [loading, setLoading] = useState(true);

  // Search field and the collapsible "new project" form.
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState("");

  // Fetch the projects once when this screen opens.
  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    // Step 1: fetch all projects of the logged-in employee. RLS (chapter 14.4)
    // itself ensures that you never get someone else's projects here.
    const { data: projectRows, error: projectError } = await supabase
      .from("projects")
      .select("id, name, url, public_key, created_at")
      .order("created_at", { ascending: false });

    if (projectError) {
      setError("Projecten laden mislukt — opnieuw proberen.");
      setLoading(false);
      return;
    }

    setProjects(projectRows ?? []);

    const ids = (projectRows ?? []).map((p: Project) => p.id);
    if (ids.length === 0) {
      // No projects? Then the counters are simply 0 everywhere.
      setOpenCountByProject({});
      setTotals({ open: 0, bezig: 0, afgerond: 0 });
      setLoading(false);
      return;
    }

    // Step 2: fetch all feedback for ALL those projects together in ONE extra query
    // (.in(...) = "where project_id is one of these values"), instead of doing a
    // separate query per project.
    const { data: feedbackRows } = await supabase
      .from("feedback_items")
      .select("project_id, status")
      .in("project_id", ids);

    // Step 3: sum up in JavaScript ourselves how much feedback there is per status,
    // both per project (for the project card) and in total (for the counters).
    const perProject: Record<number, number> = {};
    const sums = { open: 0, bezig: 0, afgerond: 0 };
    for (const item of feedbackRows ?? []) {
      if (item.status === "open") {
        perProject[item.project_id] = (perProject[item.project_id] ?? 0) + 1;
      }
      sums[item.status as FeedbackStatus]++;
    }

    setOpenCountByProject(perProject);
    setTotals(sums);
    setLoading(false);
  }

  // Called when you submit the "+ New project" form.
  async function createProject(event: FormEvent) {
    event.preventDefault();
    setError("");

    // First validate ourselves, before we send anything to Supabase.
    if (!newName.trim()) {
      setError("Geef het project een naam.");
      return;
    }
    if (!isValidUrl(newUrl)) {
      setError("Voer een geldige URL in (bv. https://...).");
      return;
    }

    // We need to know who the logged-in user is, to fill in "created_by" —
    // that field is exactly what the RLS policies will filter on later.
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error: insertError } = await supabase.from("projects").insert({
      created_by: userData.user.id,
      name: newName.trim(),
      url: newUrl.trim(),
      // public_key is NOT filled in HERE: the database generates it itself
      // automatically (see gen_random_uuid() in chapter 14.2) — that is FE-04.
    });

    if (insertError) {
      setError("Project opslaan mislukt.");
      return;
    }

    // Clear and close the form again, and refetch the list so the new
    // project + the updated counters are immediately visible.
    setNewName("");
    setNewUrl("");
    setShowForm(false);
    await loadProjects();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  // Search filter: purely in the browser, no extra database call needed.
  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="page">
      <header className="topbar">
        <p className="brand">FIXEL</p>
        <button onClick={handleLogout}>Uitloggen</button>
      </header>

      <div className="row-between">
        <div>
          <h1>Projecten</h1>
          <p className="subtitle">Beheer je feedbackprojecten (FE-02)</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)}>+ Nieuw project</button>
      </div>

      {/* The three counters at the top of screen 02 from the wireframe. */}
      <div className="stat-row">
        <div className="stat-tile">
          <div className="stat-number open">{totals.open}</div>
          <div className="stat-label">Open feedbackpunten</div>
        </div>
        <div className="stat-tile">
          <div className="stat-number bezig">{totals.bezig}</div>
          <div className="stat-label">Bezig feedbackpunten</div>
        </div>
        <div className="stat-tile">
          <div className="stat-number afgerond">{totals.afgerond}</div>
          <div className="stat-label">Afgeronde feedbackpunten</div>
        </div>
      </div>

      {/* Only visible after you've clicked "+ New project". */}
      {showForm && (
        <form onSubmit={createProject} className="card">
          <label htmlFor="name">Naam</label>
          <input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} />

          <label htmlFor="url">Website-URL</label>
          <input
            id="url"
            placeholder="https://voorbeeld.nl"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />

          {error && <p className="error">{error}</p>}
          <button type="submit">Project toevoegen</button>
        </form>
      )}

      <input
        placeholder="Zoek projecten..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p>Laden...</p>}

      {!loading && filtered.length === 0 && (
        <p className="empty-state">
          {projects.length === 0
            ? "Nog geen projecten gevonden — maak je eerste project aan."
            : "Geen projecten gevonden voor deze zoekterm."}
        </p>
      )}

      <div className="project-grid">
        {filtered.map((project) => (
          <button
            key={project.id}
            className="project-card"
            onClick={() => navigate(`/projecten/${project.id}`)}
          >
            <div className="project-thumb" />
            <div className="project-card-body">
              <span className="project-card-name">{project.name}</span>
              <span className="project-card-meta">
                {openCountByProject[project.id] ? `${openCountByProject[project.id]} open` : "leeg"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}