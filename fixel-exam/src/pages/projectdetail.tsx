import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { supabase } from "../supabase";
import { logActivity } from "../activity";
import { timeAgo } from "../format";
import SiteFrame from "../components/SiteFrame";
import { checkName, checkUrl, checkText, makePublicKey } from "../validation";

// These are the filter buttons for the status (FE-09).
// "value" is what we compare with, "label" is the text on the button.
const FILTERS = [
  { value: "alles", label: "Alle" },
  { value: "open", label: "Open" },
  { value: "bezig", label: "Bezig" },
  { value: "afgerond", label: "Afgerond" }
];

// Text for each status
const STATUS_LABELS: any = {
  open: "Open",
  bezig: "Bezig",
  afgerond: "Afgerond"
};

// This component is the project page for employees (FE-02 to FE-10).
// On the left: tabs with the feedback list and the history.
// On the right: the website with the feedback pins.
// The windows (edit, share, delete) open on top of the page.
export default function ProjectDetail() {
  // Project id from the URL
  const params = useParams();
  const navigate = useNavigate();

  // Data
  const [project, setProject] =
    useState<any>(null);

  const [feedback, setFeedback] =
    useState<any[]>([]);

  const [replies, setReplies] =
    useState<any[]>([]);

  const [activities, setActivities] =
    useState<any[]>([]);

  // Screen state
  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [feedbackError, setFeedbackError] =
    useState("");

  const [activityError, setActivityError] =
    useState("");

  // Left column: which tab and which feedback item is open
  const [tab, setTab] =
    useState("feedback");

  const [selectedId, setSelectedId] =
    useState<any>(null);

  // Request to show another page in the preview
  const [goTo, setGoTo] =
    useState<any>(null);

  // Filter, search and sort
  const [filter, setFilter] =
    useState("alles");

  const [search, setSearch] =
    useState("");

  const [sort, setSort] =
    useState("newest");

  // Reply form
  const [replyText, setReplyText] =
    useState("");

  const [replyError, setReplyError] =
    useState("");

  const [statusError, setStatusError] =
    useState("");

  // Window that is open: "", "url", "edit", "link" or "delete"
  const [dialog, setDialog] =
    useState("");

  // Edit project
  const [editName, setEditName] =
    useState("");

  const [editUrl, setEditUrl] =
    useState("");

  const [nameError, setNameError] =
    useState("");

  const [urlError, setUrlError] =
    useState("");

  const [editError, setEditError] =
    useState("");

  // Delete project
  const [deleteError, setDeleteError] =
    useState("");

  // Review link
  const [linkMessage, setLinkMessage] =
    useState("");

  const [linkError, setLinkError] =
    useState("");

  useEffect(function () {
    getProject();
    getFeedback();
    getActivities();
  }, []);

  // This function gets this one project from Supabase (the id comes from the address).
  // When it is not found, loadError gets a text and the page shows "Project niet gevonden".
  async function getProject() {
    const result =
      await supabase
        .from("projects")
        .select("*")
        .eq("id", params.id)
        .single();

    if (result.error) {
      setLoadError("Project niet gevonden");
      setLoading(false);
      return;
    }

    setProject(result.data);
    setLoading(false);
  }

  // This function gets all feedback of this project, oldest first.
  // The number #1, #2... comes from this order. After that it gets the replies.
  async function getFeedback() {
    const result =
      await supabase
        .from("feedback_items")
        .select("*")
        .eq("project_id", params.id)
        .order("created_at", { ascending: true });

    if (result.error) {
      setFeedbackError("Feedback laden mislukt — opnieuw proberen");
      return;
    }

    setFeedbackError("");
    setFeedback(result.data);
    getReplies(result.data);
  }

  // This function gets the replies, but only of the feedback in this project.
  // We first collect the ids of the feedback, then ask for replies with those ids.
  async function getReplies(items: any[]) {
    let ids: any[] = [];

    for (const item of items) {
      ids.push(item.id);
    }

    if (ids.length == 0) {
      setReplies([]);
      return;
    }

    const result =
      await supabase
        .from("feedback_replies")
        .select("*")
        .in("feedback_id", ids)
        .order("created_at", { ascending: true });

    if (result.data) {
      setReplies(result.data);
    }
  }

  // This function gets the project history from the activity_log table, newest first (FE-10).
  async function getActivities() {
    const result =
      await supabase
        .from("activity_log")
        .select("*")
        .eq("project_id", params.id)
        .order("created_at", { ascending: false });

    if (result.error) {
      setActivityError("Historie laden mislukt — opnieuw proberen");
      return;
    }

    setActivityError("");
    setActivities(result.data);
  }

  // This function gives the number of a feedback item: #1, #2, #3...
  function numberOf(id: any) {
    for (let i = 0; i < feedback.length; i++) {
      if (feedback[i].id == id) {
        return i + 1;
      }
    }

    return 0;
  }

  // This function gives the page of a feedback item. Old feedback without a page counts as "/".
  function pageOf(item: any) {
    if (!item.page_path) {
      return "/";
    }

    return item.page_path;
  }

  // This function asks the website on the right to open another page.
  // Date.now() makes the request new every time, so clicking the same page twice works.
  function showPage(path: string) {
    setGoTo({ path: path, count: Date.now() });
  }

  // This function opens one feedback item in the left column
  // and shows the page of that item in the website.
  function openItem(item: any) {
    setTab("feedback");
    setReplyText("");
    setReplyError("");
    setStatusError("");
    setSelectedId(item.id);
    showPage(pageOf(item));
  }

  // This function makes the list of pages that have feedback, with a count per page.
  // The home page "/" is always in the list.
  function pageList() {
    let list: any[] = [{ path: "/", count: 0 }];

    for (const item of feedback) {
      const path = pageOf(item);
      let found = false;

      for (const entry of list) {
        if (entry.path == path) {
          entry.count = entry.count + 1;
          found = true;
        }
      }

      if (found == false) {
        list.push({ path: path, count: 1 });
      }
    }

    return list;
  }

  // This function gives only the replies that belong to one feedback item.
  function repliesOf(id: any) {
    let list: any[] = [];

    for (const reply of replies) {
      if (reply.feedback_id == id) {
        list.push(reply);
      }
    }

    return list;
  }

  // This function makes the small text under a feedback item: "2 reacties — laatste 1u geleden".
  function replyMeta(id: any) {
    const list = repliesOf(id);

    if (list.length == 0) {
      return "Nog geen reacties";
    }

    let word = " reacties";

    if (list.length == 1) {
      word = " reactie";
    }

    const last = list[list.length - 1];

    return list.length + word + " — laatste " + timeAgo(last.created_at);
  }

  // This function changes the status of a feedback item (FE-07).
  // It saves the new status, writes a line in the history and loads the lists again.
  // When saving fails, an error text shows and nothing changes.
  async function changeStatus(
    item: any,
    newStatus: string
  ) {
    setStatusError("");

    const result =
      await supabase
        .from("feedback_items")
        .update({
          status: newStatus
        })
        .eq("id", item.id);

    if (result.error) {
      setStatusError("Status kon niet worden aangepast");
      return;
    }

    await logActivity(
      project.id,
      "status",
      "Status van #" + numberOf(item.id) +
        " veranderd naar " + STATUS_LABELS[newStatus]
    );

    getFeedback();
    getActivities();
  }

  // This function saves a reply of the employee (FE-08).
  // It checks the text, asks who is logged in and saves the reply as "medewerker".
  // When saving fails the text stays in the box.
  async function addReply(item: any) {
    const problem =
      checkText(replyText, "Schrijf eerst een reactie");

    if (problem != "") {
      setReplyError(problem);
      return;
    }

    const userResult =
      await supabase.auth.getUser();

    const user =
      userResult.data.user;

    if (!user) {
      setReplyError("Je bent niet ingelogd");
      return;
    }

    const result =
      await supabase
        .from("feedback_replies")
        .insert({
          feedback_id: item.id,
          created_by: user.id,
          author_type: "medewerker",
          author_name: null,
          message: replyText.trim()
        });

    // The text stays in the box
    if (result.error) {
      setReplyError("Reactie niet verstuurd, probeer opnieuw");
      return;
    }

    await logActivity(
      project.id,
      "reactie",
      "Reactie geplaatst op #" + numberOf(item.id)
    );

    setReplyText("");
    setReplyError("");

    getReplies(feedback);
    getActivities();
  }

  // This function opens the edit window. "url" only changes the website address,
  // "edit" changes the name and the address.
  function openEdit(kind: string) {
    setEditName(project.name);
    setEditUrl(project.url);
    setNameError("");
    setUrlError("");
    setEditError("");
    setDialog(kind);
  }

  // This function saves the edited project (FE-02, FE-03).
  // A wrong name or address shows an error next to the field and the old values stay.
  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();

    // "URL instellen" only changes the URL
    let newName = project.name;
    let newNameError = "";

    if (dialog == "edit") {
      newName = editName;
      newNameError = checkName(editName);
    }

    const newUrlError = checkUrl(editUrl);

    setNameError(newNameError);
    setUrlError(newUrlError);

    // The old values stay when something is wrong
    if (newNameError != "" || newUrlError != "") {
      return;
    }

    const result =
      await supabase
        .from("projects")
        .update({
          name: newName.trim(),
          url: editUrl.trim()
        })
        .eq("id", project.id);

    if (result.error) {
      setEditError("Project kon niet worden aangepast, probeer opnieuw");
      return;
    }

    await logActivity(
      project.id,
      "project",
      "Project bewerkt"
    );

    setDialog("");

    getProject();
    getActivities();
  }

  // This function deletes the project (FE-02). The database also deletes the feedback,
  // the replies and the history of this project (cascade). Then we go back to the dashboard.
  async function deleteProject() {
    const result =
      await supabase
        .from("projects")
        .delete()
        .eq("id", project.id);

    if (result.error) {
      setDeleteError("Project kon niet worden verwijderd, probeer opnieuw");
      return;
    }

    navigate("/dashboard");
  }

  // This function makes a new review link (FE-04). The old link stops working,
  // so it asks "are you sure?" first.
  async function generateLink() {
    setLinkMessage("");
    setLinkError("");

    const answer =
      confirm("Een nieuwe link maakt de oude link ongeldig. Doorgaan?");

    if (answer == false) {
      return;
    }

    const result =
      await supabase
        .from("projects")
        .update({
          public_key: makePublicKey()
        })
        .eq("id", project.id);

    if (result.error) {
      console.error(result.error);
      setLinkError(
        "Genereren mislukt, probeer opnieuw (" +
        result.error.message + ")"
      );
      return;
    }

    await logActivity(
      project.id,
      "reviewlink",
      "Nieuwe reviewlink gegenereerd"
    );

    setLinkMessage("Nieuwe reviewlink gemaakt");

    getProject();
    getActivities();
  }

  // This function copies the review link to the clipboard of the user.
  async function copyLink() {
    setLinkMessage("");
    setLinkError("");

    const link =
      window.location.origin + "/review/" + project.public_key;

    try {
      await navigator.clipboard.writeText(link);
      setLinkMessage("Link gekopieerd");
    } catch (error) {
      setLinkError("Kopiëren mislukt, kopieer de link zelf");
    }
  }

  // Loading
  if (loading) {
    return (
      <p className="page-message">
        Laden...
      </p>
    );
  }

  // Project not found
  if (project == null) {
    return (
      <div className="page-message">
        <p className="error" role="alert">
          {loadError}
        </p>

        <Link to="/dashboard">
          &lt; Terug
        </Link>
      </div>
    );
  }

  // Sort a copy so the original list is not changed
  let sortedFeedback =
    [...feedback];

  sortedFeedback.sort(function (a, b) {
    const dateA =
      new Date(a.created_at).getTime();

    const dateB =
      new Date(b.created_at).getTime();

    if (sort == "oldest") {
      return dateA - dateB;
    }

    return dateB - dateA;
  });

  // Filter on status and search text
  const shownFeedback =
    sortedFeedback.filter(
      function (item) {
        if (
          filter != "alles" &&
          item.status != filter
        ) {
          return false;
        }

        if (
          !item.comment
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
        ) {
          return false;
        }

        return true;
      }
    );

  // The feedback item that is open in the left column
  let selected: any = null;

  for (const item of feedback) {
    if (item.id == selectedId) {
      selected = item;
    }
  }

  const reviewUrl =
    window.location.origin + "/review/" + project.public_key;

  // Here is the container of the whole page: a top bar and below it the two columns
  return (
    <div className="app detail-page">

      {/* Here is the top bar: back link, project name and the four buttons */}
      {/* Top bar */}

      <header className="projectbar">
        <Link to="/dashboard" className="back">
          &lt; Terug
        </Link>

        <strong className="project-title">
          {project.name}
        </strong>

        <div className="bar-actions">
          <button
            type="button"
            className="mono"
            onClick={function () {
              openEdit("url");
            }}
          >
            URL instellen
          </button>

          <button
            type="button"
            className="mono"
            onClick={function () {
              setLinkMessage("");
              setLinkError("");
              setDialog("link");
            }}
          >
            Delen: reviewlink
          </button>

          <button
            type="button"
            className="mono"
            onClick={function () {
              openEdit("edit");
            }}
          >
            Project bewerken
          </button>

          <button
            type="button"
            className="mono danger"
            onClick={function () {
              setDeleteError("");
              setDialog("delete");
            }}
          >
            Project verwijderen
          </button>
        </div>
      </header>

      {/* Here is the container with the two columns: the left column and the website */}
      <div className="detail-body">

        {/* Here is the left column. It has two tabs: Feedback and Activiteit */}
        {/* Left column */}

        <aside className="side">

          {/* Here are the two tab buttons */}
          <div className="tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab == "feedback"}
              className="tab"
              onClick={function () {
                setTab("feedback");
              }}
            >
              Feedback
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={tab == "activity"}
              className="tab"
              onClick={function () {
                setTab("activity");
              }}
            >
              Activiteit
            </button>
          </div>

          {/* Here is the feedback list: pages, filter buttons, search, sorting and the feedback items */}
          {/* Feedback list */}

          {tab == "feedback" && selected == null && (
            <div>
              {/* Here is the list of pages that have feedback. A click opens that page in the website */}
              <div className="pages">
                <p className="label">Pagina's</p>

                {pageList().map(function (entry) {
                  let name = entry.path;

                  if (entry.path == "/") {
                    name = "/ (home)";
                  }

                  return (
                    <button
                      key={entry.path}
                      type="button"
                      className="page-link"
                      onClick={function () {
                        showPage(entry.path);
                      }}
                    >
                      {name} ({entry.count})
                    </button>
                  );
                })}
              </div>

              <div className="side-head">
                <strong>FEEDBACK</strong>
                <span>{feedback.length}</span>
              </div>

              {/* Here is the container with the filter buttons Alle / Open / Bezig / Afgerond */}
              <div className="chips">
                {FILTERS.map(function (option) {
                  let className = "chip";

                  if (filter == option.value) {
                    className = "chip active";
                  }

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={className}
                      aria-pressed={filter == option.value}
                      onClick={function () {
                        setFilter(option.value);
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="side-tools">
                <label className="sr-only" htmlFor="feedback-search">
                  Zoeken
                </label>

                <input
                  id="feedback-search"
                  placeholder="Zoek feedback..."
                  value={search}
                  onChange={function (e) {
                    setSearch(e.target.value);
                  }}
                />

                <label className="sr-only" htmlFor="feedback-sort">
                  Sorteren
                </label>

                <select
                  id="feedback-sort"
                  value={sort}
                  onChange={function (e) {
                    setSort(e.target.value);
                  }}
                >
                  <option value="newest">
                    Nieuwste eerst
                  </option>

                  <option value="oldest">
                    Oudste eerst
                  </option>
                </select>
              </div>

              {feedbackError != "" && (
                <div className="side-pad">
                  <p className="error" role="alert">
                    {feedbackError}
                  </p>

                  <button type="button" onClick={getFeedback}>
                    Opnieuw proberen
                  </button>
                </div>
              )}

              {feedbackError == "" && feedback.length == 0 && (
                <p className="side-pad">
                  Nog geen feedback op dit project
                </p>
              )}

              {feedback.length > 0 && shownFeedback.length == 0 && (
                <p className="side-pad">
                  Geen feedback met deze status
                </p>
              )}

              {/* Here is one row for every feedback item that is left after filtering and searching */}
              {shownFeedback.map(function (item) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="feedback-row"
                    onClick={function () {
                      openItem(item);
                    }}
                  >
                    <span className="row-top">
                      <span className="num">
                        #{numberOf(item.id)}
                      </span>

                      <span className={"pill pill-" + item.status}>
                        {STATUS_LABELS[item.status]}
                      </span>
                    </span>

                    <span className="row-text">
                      {item.comment}
                    </span>

                    <span className="row-meta">
                      Pagina: {pageOf(item)}
                    </span>

                    <span className="row-meta">
                      {replyMeta(item.id)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Here is one open feedback item: description, status dropdown and the replies */}
          {/* One feedback item: status and replies */}

          {tab == "feedback" && selected != null && (
            <div>
              <div className="side-pad">
                <button
                  type="button"
                  className="mono"
                  onClick={function () {
                    setSelectedId(null);
                  }}
                >
                  &lt; Alle feedback
                </button>
              </div>

              <div className="panel-block">
                <h2>
                  Feedbackpunt #{numberOf(selected.id)}
                </h2>

                <span className={"pill pill-" + selected.status}>
                  {STATUS_LABELS[selected.status]}
                </span>
              </div>

              <div className="panel-block">
                <p className="label">Pagina</p>

                <p>
                  {pageOf(selected)}
                </p>

                <p className="label">Omschrijving</p>

                <p>
                  {selected.comment}
                </p>
              </div>

              <div className="panel-block">
                <label htmlFor="status-select">
                  Status
                </label>

                <select
                  id="status-select"
                  value={selected.status}
                  onChange={function (e) {
                    changeStatus(
                      selected,
                      e.target.value
                    );
                  }}
                >
                  <option value="open">
                    Open
                  </option>

                  <option value="bezig">
                    Bezig
                  </option>

                  <option value="afgerond">
                    Afgerond
                  </option>
                </select>

                {statusError != "" && (
                  <p className="error" role="alert">
                    {statusError}
                  </p>
                )}
              </div>

              <div className="panel-block">
                <p className="label">Reacties</p>

                {repliesOf(selected.id).length == 0 && (
                  <p className="small">
                    Nog geen reacties
                  </p>
                )}

                {repliesOf(selected.id).map(function (reply) {
                  let author = "Reviewer";

                  if (reply.author_type == "medewerker") {
                    author = "Medewerker";
                  }

                  if (reply.author_name) {
                    author = author + " (" + reply.author_name + ")";
                  }

                  return (
                    <div className="reply" key={reply.id}>
                      <strong>{author}</strong>

                      <p>
                        {reply.message}
                      </p>

                      <small>
                        {new Date(
                          reply.created_at
                        ).toLocaleString()}
                      </small>
                    </div>
                  );
                })}

                <label className="sr-only" htmlFor="reply-text">
                  Reactie
                </label>

                <textarea
                  id="reply-text"
                  value={replyText}
                  maxLength={500}
                  placeholder="Schrijf een reactie..."
                  onChange={function (e) {
                    setReplyText(e.target.value);
                  }}
                />

                {replyError != "" && (
                  <p className="error" role="alert">
                    {replyError}
                  </p>
                )}

                <button
                  type="button"
                  className="primary"
                  disabled={replyText.trim() == ""}
                  onClick={function () {
                    addReply(selected);
                  }}
                >
                  Versturen
                </button>
              </div>
            </div>
          )}

          {/* Here is the history tab: a list of everything that happened, newest first */}
          {/* Activity history */}

          {tab == "activity" && (
            <div>
              <div className="side-head">
                <strong>ACTIVITEIT</strong>
                <span>{activities.length}</span>
              </div>

              {activityError != "" && (
                <div className="side-pad">
                  <p className="error" role="alert">
                    {activityError}
                  </p>

                  <button type="button" onClick={getActivities}>
                    Opnieuw proberen
                  </button>
                </div>
              )}

              {activityError == "" && activities.length == 0 && (
                <p className="side-pad">
                  Nog geen activiteit voor dit project
                </p>
              )}

              {activities.map(function (activity) {
                let who = "Medewerker";

                if (activity.actor_type == "reviewer") {
                  who = "Reviewer";
                }

                return (
                  <div className="activity-row" key={activity.id}>
                    <p>
                      <strong>{who}:</strong>{" "}
                      {activity.description}
                    </p>

                    <small>
                      {new Date(
                        activity.created_at
                      ).toLocaleString()}
                    </small>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* Here is the container with the website. SiteFrame shows the website and the pins */}
        {/* Right: the website with pins */}

        <section className="preview">
          <SiteFrame
            url={project.url}
            title={project.name}
            feedback={feedback}
            selectedId={selectedId}
            numberOf={numberOf}
            placing={false}
            newPin={null}
            goTo={goTo}
            onSelect={openItem}
          />
        </section>
      </div>

      {/* Here are the windows (modals). Only one is open at a time, the "dialog" variable says which */}
      {/* Windows */}

      {(dialog == "url" || dialog == "edit") && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
          >
            <h2 id="edit-title">
              {dialog == "edit" && "Project bewerken"}
              {dialog == "url" && "URL instellen"}
            </h2>

            <form onSubmit={saveEdit} noValidate>
              {dialog == "edit" && (
                <div>
                  <label htmlFor="edit-name">
                    Projectnaam
                  </label>

                  <input
                    id="edit-name"
                    value={editName}
                    maxLength={80}
                    onChange={function (e) {
                      setEditName(e.target.value);
                    }}
                  />

                  {nameError != "" && (
                    <p className="error" role="alert">
                      {nameError}
                    </p>
                  )}
                </div>
              )}

              <label htmlFor="edit-url">
                Website URL
              </label>

              <input
                id="edit-url"
                value={editUrl}
                placeholder="https://website.nl"
                onChange={function (e) {
                  setEditUrl(e.target.value);
                }}
              />

              {urlError != "" && (
                <p className="error" role="alert">
                  {urlError}
                </p>
              )}

              {editError != "" && (
                <p className="error" role="alert">
                  {editError}
                </p>
              )}

              <div className="modal-buttons">
                <button
                  type="button"
                  onClick={function () {
                    setDialog("");
                  }}
                >
                  Annuleren
                </button>

                <button type="submit" className="primary">
                  Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {dialog == "link" && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="link-title"
          >
            <h2 id="link-title">Delen: reviewlink</h2>

            <p>
              Stuur deze link naar je klant. Een account is niet nodig.
            </p>

            <p className="linkbox">
              {reviewUrl}
            </p>

            {linkMessage != "" && (
              <p role="status">
                {linkMessage}
              </p>
            )}

            {linkError != "" && (
              <p className="error" role="alert">
                {linkError}
              </p>
            )}

            <div className="modal-buttons">
              <button
                type="button"
                onClick={function () {
                  setDialog("");
                }}
              >
                Sluiten
              </button>

              <button type="button" onClick={generateLink}>
                Nieuwe link genereren
              </button>

              <button type="button" className="primary" onClick={copyLink}>
                Link kopiëren
              </button>
            </div>
          </div>
        </div>
      )}

      {dialog == "delete" && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title">Project verwijderen?</h2>

            <p>
              Weet je zeker dat je dit project wilt verwijderen?
              Alle feedback en reacties worden ook verwijderd.
            </p>

            {deleteError != "" && (
              <p className="error" role="alert">
                {deleteError}
              </p>
            )}

            <div className="modal-buttons">
              <button
                type="button"
                onClick={function () {
                  setDialog("");
                }}
              >
                Annuleren
              </button>

              <button
                type="button"
                className="danger"
                onClick={deleteProject}
              >
                Project verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
