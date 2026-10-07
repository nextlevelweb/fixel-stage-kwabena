import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Shell from "../components/Shell";
import { supabase } from "../supabase";
import { logActivity } from "../activity";
import { checkName, checkUrl, makePublicKey } from "../validation";

// This component is the dashboard (FE-02, FE-06): the list of all projects,
// the counters per status, a search box and the window for a new project.
export default function Dashboard() {
  const [projects, setProjects] =
    useState<any[]>([]);

  const [feedback, setFeedback] =
    useState<any[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // New project window
  const [showNew, setShowNew] =
    useState(false);

  const [name, setName] =
    useState("");

  const [url, setUrl] =
    useState("");

  const [nameError, setNameError] =
    useState("");

  const [urlError, setUrlError] =
    useState("");

  const [saveError, setSaveError] =
    useState("");

  useEffect(function () {
    loadData();
  }, []);

  // This function gets the data from Supabase: all projects and the status of all feedback.
  // The counters and the "7 open" texts are counted from that feedback list.
  // When something goes wrong we show an error text with a retry button.
  async function loadData() {
    setLoading(true);
    setError("");

    const projectResult =
      await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

    const feedbackResult =
      await supabase
        .from("feedback_items")
        .select("id, project_id, status");

    if (projectResult.error || feedbackResult.error) {
      setError("Projecten laden mislukt — opnieuw proberen");
      setLoading(false);
      return;
    }

    setProjects(projectResult.data);
    setFeedback(feedbackResult.data);
    setLoading(false);
  }

  // This function counts feedback with one status (open, bezig or afgerond).
  // Give a project id to count for one project, or null to count for all projects.
  function countStatus(status: string, projectId: any) {
    let total = 0;

    for (const item of feedback) {
      if (item.status != status) {
        continue;
      }

      if (projectId != null && item.project_id != projectId) {
        continue;
      }

      total = total + 1;
    }

    return total;
  }

  // This function counts all feedback of one project, whatever the status is.
  function countAll(projectId: any) {
    let total = 0;

    for (const item of feedback) {
      if (item.project_id == projectId) {
        total = total + 1;
      }
    }

    return total;
  }

  // This function gives the small text on a project card: "7 open", or "leeg"
  // when the project has no feedback at all.
  function cardText(projectId: any) {
    if (countAll(projectId) == 0) {
      return "leeg";
    }

    return countStatus("open", projectId) + " open";
  }

  // This function opens the window for a new project.
  // It empties the fields and the error texts first.
  function openNew() {
    setName("");
    setUrl("");
    setNameError("");
    setUrlError("");
    setSaveError("");
    setShowNew(true);
  }

  // This function saves a new project (FE-02, FE-03).
  // 1. Check the name and the website address. A mistake keeps the window open.
  // 2. Save the project in Supabase with a random review key.
  // 3. Write a line in the project history and load the list again.
  async function addProject(
    e: React.FormEvent
  ) {
    e.preventDefault();
    setSaveError("");

    // The window stays open and the values stay when something is wrong
    const newNameError = checkName(name);
    const newUrlError = checkUrl(url);

    setNameError(newNameError);
    setUrlError(newUrlError);

    if (newNameError != "" || newUrlError != "") {
      return;
    }

    const result =
      await supabase
        .from("projects")
        .insert({
          name: name.trim(),
          url: url.trim(),
          public_key: makePublicKey()
        })
        .select()
        .single();

    if (result.error) {
      setSaveError("Project kon niet worden toegevoegd, probeer opnieuw");
      return;
    }

    await logActivity(
      result.data.id,
      "project",
      "Project \"" + result.data.name + "\" aangemaakt"
    );

    setShowNew(false);

    loadData();
  }

  // Projects that match the search text
  const shownProjects =
    projects.filter(function (project) {
      return project.name
        .toLowerCase()
        .includes(search.toLowerCase());
    });

  // Here is the frame of the page: top bar, left menu and the grey content area
  return (
    <Shell>
      {/* Here is the container with the title on the left and the "+ Nieuw project" button on the right */}
      <div className="page-head">
        <div>
          <h1>Projecten</h1>
          <p className="muted">
            Beheer je feedback projecten
          </p>
        </div>

        <button
          type="button"
          className="primary"
          onClick={openNew}
        >
          + Nieuw project
        </button>
      </div>

      {/* Here are the three boxes with the counters: open (red), bezig (blue) and afgerond (green) */}
      {/* Counters */}

      <div className="counters">
        <div className="counter counter-open">
          <strong>{countStatus("open", null)}</strong>
          <span>Open feedbackpunten</span>
        </div>

        <div className="counter counter-bezig">
          <strong>{countStatus("bezig", null)}</strong>
          <span>Bezig feedbackpunten</span>
        </div>

        <div className="counter counter-afgerond">
          <strong>{countStatus("afgerond", null)}</strong>
          <span>Afgerond feedbackpunten</span>
        </div>
      </div>

      <label className="sr-only" htmlFor="project-search">
        Zoeken
      </label>

      <input
        id="project-search"
        className="search"
        placeholder="Zoek projecten..."
        value={search}
        onChange={function (e) {
          setSearch(e.target.value);
        }}
      />

      {loading && (
        <p>Laden...</p>
      )}

      {error != "" && (
        <div>
          <p className="error" role="alert">
            {error}
          </p>

          <button type="button" onClick={loadData}>
            Opnieuw proberen
          </button>
        </div>
      )}

      {/* Here is the container with one card for every project. A card is a link to the project page */}
      {/* Project cards */}

      <div className="project-grid">
        {shownProjects.map(function (project) {
          return (
            <Link
              className="project-card"
              key={project.id}
              to={"/projects/" + project.id}
            >
              <div className="picture"></div>

              <div className="project-card-row">
                <strong>{project.name}</strong>
                <span>{cardText(project.id)}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {loading == false && error == "" && shownProjects.length == 0 && (
        <p className="empty">
          Nog geen projecten gevonden — maak je eerste project aan
        </p>
      )}

      {/* Here is the window for a new project. It only exists when showNew is true */}
      {/* New project window */}

      {showNew && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-title"
          >
            <h2 id="new-title">Nieuw project</h2>

            <form onSubmit={addProject} noValidate>
              <label htmlFor="project-name">
                Projectnaam
              </label>

              <input
                id="project-name"
                value={name}
                maxLength={80}
                onChange={function (e) {
                  setName(e.target.value);
                }}
              />

              {nameError != "" && (
                <p className="error" role="alert">
                  {nameError}
                </p>
              )}

              <label htmlFor="project-url">
                Website URL
              </label>

              <input
                id="project-url"
                value={url}
                placeholder="https://website.nl"
                onChange={function (e) {
                  setUrl(e.target.value);
                }}
              />

              {urlError != "" && (
                <p className="error" role="alert">
                  {urlError}
                </p>
              )}

              {saveError != "" && (
                <p className="error" role="alert">
                  {saveError}
                </p>
              )}

              <div className="modal-buttons">
                <button
                  type="button"
                  onClick={function () {
                    setShowNew(false);
                  }}
                >
                  Annuleren
                </button>

                <button type="submit" className="primary">
                  Project toevoegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Shell>
  );
}
