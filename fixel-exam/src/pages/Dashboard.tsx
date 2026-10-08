
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Shell from "../components/Shell";
import { supabase } from "../supabase";
import { logActivity } from "../activity";
import { checkName, checkUrl, makePublicKey } from "../validation";
import "../styles/Dashboard.css";

export default function Dashboard() {

  // Variables
  const [projects, setProjects] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New project variables
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [nameError, setNameError] = useState("");
  const [urlError, setUrlError] = useState("");
  const [saveError, setSaveError] = useState("");

  // Run when the page opens
  useEffect(function () {
    loadData();
  }, []);

  // Get projects and feedback from Supabase
  async function loadData() {
    setLoading(true);
    setError("");

    const p = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    const f = await supabase
      .from("feedback_items")
      .select("id, project_id, status");

    if (p.error) {
      setError("Projecten laden mislukt");
      setLoading(false);
      return;
    }

    if (f.error) {
      setError("Feedback laden mislukt");
      setLoading(false);
      return;
    }

    setProjects(p.data); // Save projects
    setFeedback(f.data); // Save feedback
    setLoading(false);
  }

  // Count feedback with a certain status
  function countStatus(status: string, projectId: any) {
    let total = 0;

    for (const item of feedback) {

      if (item.status == status) {

        if (projectId == null) {
          total = total + 1;
        } else {
          if (item.project_id == projectId) {
            total = total + 1;
          }
        }

      }
    }

    return total;
  }

  // Count all feedback for one project
  function countAll(projectId: any) {
    let total = 0;

    for (const item of feedback) {
      if (item.project_id == projectId) {
        total = total + 1;
      }
    }

    return total;
  }

  // Show feedback text on project cards
  function cardText(projectId: any) {
    if (countAll(projectId) == 0) {
      return "leeg";
    }

    return countStatus("open", projectId) + " open";
  }

  // Open the new project window
  function openNew() {
    setName("");
    setUrl("");
    setNameError("");
    setUrlError("");
    setSaveError("");
    setShowNew(true);
  }

  // Add a new project to Supabase
  async function addProject(e: React.FormEvent) {
    e.preventDefault(); // Stop the page from refreshing
    setSaveError(""); // Clear old error

    // Check the project name
    const nameCheck = checkName(name);
    setNameError(nameCheck);

    // Check the website URL
    const urlCheck = checkUrl(url);
    setUrlError(urlCheck);

    // Stop if the name is wrong
    if (nameCheck != "") {
      return;
    }

    // Stop if the URL is wrong
    if (urlCheck != "") {
      return;
    }

    // Save the project
    const result = await supabase
      .from("projects")
      .insert({
        name: name.trim(),
        url: url.trim(),
        public_key: makePublicKey()
      })
      .select()
      .single();

    // Show error if saving fails
    if (result.error) {
      setSaveError("Project toevoegen mislukt");
      return;
    }

    // Save activity history
    await logActivity(
      result.data.id,
      "project",
      "Project " + result.data.name + " aangemaakt"
    );

    setShowNew(false); // Close window
    loadData(); // Refresh projects
  }

  // Search for projects
  const shownProjects = projects.filter(function (project) {
    return project.name.toLowerCase()
      .includes(search.toLowerCase());
  });

  return (
    <Shell>

      {/* Page title */}
      <div className="page-head">
        <div>
          <h1>Projecten</h1>
          <p className="muted">Beheer je feedback projecten</p>
        </div>

        <button
          type="button"
          className="primary"
          onClick={openNew}
        >
          + Nieuw project
        </button>
      </div>

      {/* Feedback counters */}
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

      {/* Search input */}
      <label className="sr-only" htmlFor="search">
        Zoeken
      </label>

      <input
        id="search"
        className="search"
        placeholder="Zoek projecten..."
        value={search}
        onChange={function (e) {
          setSearch(e.target.value);
        }}
      />

      {/* Loading message */}
      {loading ? <p>Laden...</p> : null}

      {/* Loading error */}
      {error != "" ? (
        <div>
          <p className="error">{error}</p>
          <button onClick={loadData}>
            Opnieuw proberen
          </button>
        </div>
      ) : null}

      {/* Project cards */}
      <div className="project-grid">

        {shownProjects.map(function (project) {
          return (
            <Link
              key={project.id}
              className="project-card"
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

      {/* Empty projects message */}
      {loading == false ? (
        error == "" ? (
          shownProjects.length == 0 ? (
            <p className="empty">Geen projecten gevonden</p>
          ) : null
        ) : null
      ) : null}

      {/* New project window */}
      {showNew ? (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-title"
          >
            <h2 id="new-title">Nieuw project</h2>

            <form onSubmit={addProject} noValidate>

              {/* Project name */}
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

              {nameError != "" ? (
                <p className="error">{nameError}</p>
              ) : null}

              {/* Website URL */}
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

              {urlError != "" ? (
                <p className="error">{urlError}</p>
              ) : null}

              {/* Save error */}
              {saveError != "" ? (
                <p className="error">{saveError}</p>
              ) : null}

              {/* Buttons */}
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
      ) : null}

    </Shell>
  );
}
