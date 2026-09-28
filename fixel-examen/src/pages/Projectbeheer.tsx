import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "../supabase";
import { isValidUrl, isValidText } from "../validation";

type Project = {
  id: number;
  name: string;
  url: string;
  public_key: string;
  created_at: string;
};

type FeedbackStatus = "open" | "bezig" | "afgerond";

type FeedbackItem = {
  id: number;
  project_id: number;
  x_percent: number;
  y_percent: number;
  comment: string;
  status: FeedbackStatus;
  created_at: string;
};

// One reply under a feedback point — from an employee OR from a reviewer.
type Reply = {
  id: number;
  feedback_id: number;
  author_type: string;
  author_name: string | null;
  message: string;
  created_at: string;
};

// One row from the activity history (FE-10) — created by database triggers
// (chapter 14.6), so this file never adds anything to activity_log itself;
// it only fetches the rows to display them.
type ActivityEntry = {
  id: number;
  actor_type: string;
  event_type: string;
  description: string;
  created_at: string;
};

export default function Projectbeheer() {
  // :projectId comes from the route "/projecten/:projectId" (App.tsx, chapter 9).
  // That is always a string, so we convert it to a number.
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const id = Number(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Which tab is active (Feedback or Activity), and which status is filtered on.
  const [tab, setTab] = useState<"feedback" | "activiteit">("feedback");
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "alle">("alle");

  // The feedback for this project, the replies per feedback point (only loaded once
  // you click an item open), and which feedback point is currently open.
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [repliesByFeedback, setRepliesByFeedback] = useState<Record<number, Reply[]>>({});
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [error, setError] = useState("");

  // Flags for which small forms/windows are open
  // (set URL, edit project, show reviewlink, confirm delete).
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [showRenameForm, setShowRenameForm] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // When this screen opens (or when you navigate to a DIFFERENT project,
  // since then "id" changes) fetch everything again.
  useEffect(() => {
    loadProject();
    loadFeedback();
    loadActivity();
  }, [id]);

  // Fetches exactly this one project. .maybeSingle() returns a single object
  // (or null) instead of a list — handy since we expect only one row here.
  async function loadProject() {
    const { data, error: loadError } = await supabase
      .from("projects")
      .select("id, name, url, public_key, created_at")
      .eq("id", id)
      .maybeSingle();

    if (loadError || !data) {
      setNotFound(true);
      return;
    }

    setProject(data);
    setUrlDraft(data.url);
    setNameDraft(data.name);
  }

  // Fetches the feedback for this project (FE-06). RLS checks via the
  // project whether this really belongs to the logged-in employee.
  async function loadFeedback() {
    const { data, error: loadError } = await supabase
      .from("feedback_items")
      .select("id, project_id, x_percent, y_percent, comment, status, created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: false });

    if (loadError) {
      setError("Feedback laden mislukt — opnieuw proberen.");
      return;
    }
    setFeedback(data ?? []);
  }

  // Fetches the activity history (FE-10) — read-only, this page never
  // writes to it itself (the database triggers do that).
  async function loadActivity() {
    const { data, error: loadError } = await supabase
      .from("activity_log")
      .select("id, actor_type, event_type, description, created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!loadError) {
      setActivity(data ?? []);
    }
  }

  // Fetches the replies for ONE feedback point. Only called when you click
  // that point open (not upfront for all points at once — that saves queries).
  async function loadReplies(feedbackId: number) {
    const { data, error: loadError } = await supabase
      .from("feedback_replies")
      .select("id, feedback_id, author_type, author_name, message, created_at")
      .eq("feedback_id", feedbackId)
      .order("created_at", { ascending: true });

    if (!loadError) {
      setRepliesByFeedback((prev) => ({ ...prev, [feedbackId]: data ?? [] }));
    }
  }

  // Clicking a feedback item: clicking the same item again collapses it
  // shut. The first time an item opens, the replies are only then loaded.
  function selectFeedback(feedbackId: number) {
    setSelectedFeedbackId((current) => (current === feedbackId ? null : feedbackId));
    if (!repliesByFeedback[feedbackId]) {
      loadReplies(feedbackId);
    }
  }

  // FE-07: change the status of one feedback point via the dropdown.
  async function changeStatus(feedbackId: number, status: FeedbackStatus) {
    const { error: updateError } = await supabase
      .from("feedback_items")
      .update({ status }) // note: .update() first, then .eq() — that's how Supabase works
      .eq("id", feedbackId);

    if (updateError) {
      setError("Status wijzigen mislukt.");
      return;
    }
    // Fetch both again: the status itself, and the history (which the trigger
    // added automatically, chapter 14.6).
    await loadFeedback();
    await loadActivity();
  }

  // FE-08: the employee posts a reply under a feedback point.
  async function submitReply(feedbackId: number) {
    if (!isValidText(replyDraft)) {
      setError("Schrijf een reactie van maximaal 500 tekens.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error: insertError } = await supabase.from("feedback_replies").insert({
      feedback_id: feedbackId,
      created_by: userData.user.id,
      author_type: "medewerker", // fixed to "medewerker": this function may never post as a reviewer
      message: replyDraft.trim(),
    });

    if (insertError) {
      setError("Reactie niet verstuurd, probeer opnieuw.");
      return;
    }

    setReplyDraft("");
    await loadReplies(feedbackId);
    await loadActivity();
  }

  // FE-03: save the project's URL, behind the "URL instellen" button.
  async function saveUrl(event: FormEvent) {
    event.preventDefault();
    if (!isValidUrl(urlDraft)) {
      setError("Voer een geldige URL in (bv. https://...).");
      return;
    }
    const { error: updateError } = await supabase
      .from("projects")
      .update({ url: urlDraft.trim() })
      .eq("id", id);

    if (updateError) {
      setError("URL opslaan mislukt.");
      return;
    }
    setError("");
    setShowUrlForm(false);
    await loadProject();
  }

  // FE-02: change the project name, behind the "Project bewerken" button.
  async function saveName(event: FormEvent) {
    event.preventDefault();
    if (!nameDraft.trim()) {
      setError("Geef het project een naam.");
      return;
    }
    const { error: updateError } = await supabase
      .from("projects")
      .update({ name: nameDraft.trim() })
      .eq("id", id);

    if (updateError) {
      setError("Project bewerken mislukt.");
      return;
    }
    setError("");
    setShowRenameForm(false);
    await loadProject();
  }

  // FE-02: delete the entire project — only called AFTER the
  // user clicks "Project verwijderen" in the confirmation modal (further down).
  // Thanks to "on delete cascade" in the database (chapter 14.2), the
  // feedback, replies and activity history for this project disappear along with it automatically.
  async function confirmDelete() {
    const { error: deleteError } = await supabase.from("projects").delete().eq("id", id);
    if (deleteError) {
      setError("Project verwijderen mislukt.");
      return;
    }
    navigate("/dashboard");
  }

  // FE-04: builds the reviewlink based on the public_key that the database has
  // already generated. window.location.href.split("#")[0] grabs everything before the #,
  // so the "real" website URL, regardless of which page you're currently on.
  function getReviewLink(publicKey: string) {
    const base = window.location.href.split("#")[0];
    return `${base}#/review/${publicKey}`;
  }

  async function copyReviewLink() {
    if (!project) return;
    await navigator.clipboard.writeText(getReviewLink(project.public_key));
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000); // reset button text after 2 sec
  }

  // Project not found (doesn't exist, or isn't yours thanks to RLS) ->
  // show a small dedicated page instead of a broken screen.
  if (notFound) {
    return (
      <div className="page">
        <p className="error">Dit project bestaat niet (meer) of is niet van jou.</p>
        <Link className="back-link" to="/dashboard">← Terug naar dashboard</Link>
      </div>
    );
  }

  if (!project) {
    return <p className="center-message">Laden...</p>;
  }

  // FE-09: filtering is purely local — all feedback has already been fetched,
  // here we only show a subset based on the chosen chip.
  const visibleFeedback =
    statusFilter === "alle" ? feedback : feedback.filter((f) => f.status === statusFilter);

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <Link className="back-link" to="/dashboard">← Terug</Link>
          <strong>{project.name}</strong>
        </div>
        <div className="topbar-actions">
          <button className="btn-outline" onClick={() => setShowUrlForm((v) => !v)}>
            URL instellen
          </button>
          <button className="btn-outline" onClick={() => setShowLink((v) => !v)}>
            Delen: reviewlink
          </button>
          <button className="btn-outline" onClick={() => setShowRenameForm((v) => !v)}>
            Project bewerken
          </button>
          <button className="btn-danger" onClick={() => setShowDeleteModal(true)}>
            Project verwijderen
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      {showUrlForm && (
        <form onSubmit={saveUrl} className="card">
          <label htmlFor="url">Website-URL</label>
          <input id="url" value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} />
          <button type="submit">Opslaan</button>
        </form>
      )}

      {showRenameForm && (
        <form onSubmit={saveName} className="card">
          <label htmlFor="name">Projectnaam</label>
          <input id="name" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} />
          <button type="submit">Opslaan</button>
        </form>
      )}

      {showLink && (
        <div className="card">
          <p>
            Reviewlink: <code>{getReviewLink(project.public_key)}</code>{" "}
            <button onClick={copyReviewLink}>{copiedLink ? "Gekopieerd!" : "Kopieer"}</button>
          </p>
        </div>
      )}

      <div className="pb-layout">
        <aside className="pb-sidebar">
          <div className="tabs">
            <button
              className={tab === "feedback" ? "tab active" : "tab"}
              onClick={() => setTab("feedback")}
            >
              Feedback (FE-06)
            </button>
            <button
              className={tab === "activiteit" ? "tab active" : "tab"}
              onClick={() => setTab("activiteit")}
            >
              Activiteit (FE-10)
            </button>
          </div>

          {tab === "feedback" && (
            <>
              <div className="chip-row">
                {(["alle", "open", "bezig", "afgerond"] as const).map((value) => (
                  <button
                    key={value}
                    className={statusFilter === value ? "chip active" : "chip"}
                    onClick={() => setStatusFilter(value)}
                  >
                    {value === "alle" ? "Alle" : value}
                  </button>
                ))}
              </div>

              {visibleFeedback.length === 0 && (
                <p className="empty-state">
                  {feedback.length === 0
                    ? "Nog geen feedback op dit project."
                    : "Geen feedback met deze status."}
                </p>
              )}

              {visibleFeedback.map((item, index) => (
                <div
                  key={item.id}
                  className={item.id === selectedFeedbackId ? "feedback-item selected" : "feedback-item"}
                  onClick={() => selectFeedback(item.id)}
                >
                  <div className="feedback-item-top">
                    <span>#{feedback.length - index}</span>
                    <span className={`status-pill ${item.status}`}>{item.status}</span>
                  </div>
                  <p className="feedback-comment">{item.comment}</p>
                  <p className="feedback-meta">
                    {(repliesByFeedback[item.id] ?? []).length} reacties · positie{" "}
                    {item.x_percent.toFixed(0)}%, {item.y_percent.toFixed(0)}%
                  </p>

                  {item.id === selectedFeedbackId && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <select
                        value={item.status}
                        onChange={(e) => changeStatus(item.id, e.target.value as FeedbackStatus)}
                      >
                        <option value="open">Open</option>
                        <option value="bezig">Bezig</option>
                        <option value="afgerond">Afgerond</option>
                      </select>

                      {(repliesByFeedback[item.id] ?? []).map((reply) => (
                        <p key={reply.id} className="reply">
                          <strong>
                            {reply.author_type === "medewerker" ? "Jij" : reply.author_name || "Reviewer"}:
                          </strong>{" "}
                          {reply.message}
                        </p>
                      ))}

                      <textarea
                        placeholder="Schrijf een reactie..."
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                      />
                      <button onClick={() => submitReply(item.id)}>Reactie versturen</button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {tab === "activiteit" && (
            <ul className="activity-list">
              {activity.length === 0 && <li>Nog geen activiteit voor dit project.</li>}
              {activity.map((entry) => (
                <li key={entry.id}>
                  <span>
                    {entry.description}
                    <span className="activity-time">
                      {new Date(entry.created_at).toLocaleString("nl-NL")}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="pb-main">
          <p className="iframe-hint">
            Voorbeeld van de website — klik op een pin om het feedbackpunt te zien (FE-06).
          </p>
          <div className="iframe-wrap">
            {/* The actual customer website, simply shown in an iframe. */}
            <iframe src={project.url} title={project.name} className="review-frame" />
            {/* One colored dot per feedback point, positioned with the same
                x_percent/y_percent that the reviewer passed along (FE-05).
                Read-only here: clicking opens the point, doesn't place anything new. */}
            {feedback.map((item) => (
              <button
                key={item.id}
                className={`pin ${item.status}`}
                style={{ left: `${item.x_percent}%`, top: `${item.y_percent}%` }}
                onClick={() => selectFeedback(item.id)}
                title={item.comment}
              />
            ))}
          </div>
        </main>
      </div>

      {/* Confirmation window, only visible after clicking "Project verwijderen". */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Project verwijderen?</h2>
            <p>
              Weet je zeker dat je dit project wilt verwijderen? Alle feedback en reacties worden ook
              verwijderd.
            </p>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setShowDeleteModal(false)}>
                Annuleren
              </button>
              <button className="btn-danger solid" onClick={confirmDelete}>
                Project verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}