import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";
import { checkText } from "../validation";
import SiteFrame from "../components/SiteFrame";
import "../styles/Review.css";
import "../styles/FeedbackShared.css";

// Text for each status
const STATUS_LABELS: any = {
  open: "Open",
  bezig: "Bezig",
  afgerond: "Afgerond"
};

// This component is the page that the client opens with the review link (FE-04, FE-05).
// The client has no account, so everything goes through database functions (rpc)
// that check the key in the link. The key only gives access to ONE project (TE-03).
export default function Review() {
  const params = useParams();

  // Data of this review link
  const [project, setProject] =
    useState<any>(null);

  const [feedback, setFeedback] =
    useState<any[]>([]);

  const [replies, setReplies] =
    useState<any[]>([]);

  // Screen state
  const [loading, setLoading] =
    useState(true);

  const [loadFailed, setLoadFailed] =
    useState(false);

  // Technical reason, shown small under the error
  const [loadReason, setLoadReason] =
    useState("");

  // Feedback item that is open in the right panel
  const [selectedId, setSelectedId] =
    useState<any>(null);

  // New feedback
  const [feedbackMode, setFeedbackMode] =
    useState(false);

  // Spot of the new pin: x and y are percentages of the page, path is the page
  const [pin, setPin] =
    useState<any>(null);

  // Page that is shown, and a request to open another page
  const [currentPage, setCurrentPage] =
    useState("/");

  const [goTo, setGoTo] =
    useState<any>(null);

  const [message, setMessage] =
    useState("");

  const [formError, setFormError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  // Reply form
  const [replyText, setReplyText] =
    useState("");

  const [replyName, setReplyName] =
    useState("");

  const [replyError, setReplyError] =
    useState("");

  useEffect(function () {
    loadReview();

    // The reviewer sees status changes without reloading
    const timer = setInterval(loadReview, 15000);

    return function () {
      clearInterval(timer);
    };
  }, []);

  // This function asks the database function review_get for everything of this link:
  // the project, its feedback and the replies. A wrong key gives back nothing (null).
  // It runs when the page opens and again every 15 seconds, so the client sees a new
  // status without reloading.
  async function loadReview() {
    const result =
      await supabase.rpc("review_get", {
        p_key: params.publicKey
      });

    if (result.error) {
      console.error(result.error);
      setLoadReason(result.error.message);
      setLoadFailed(true);
      setLoading(false);
      return;
    }

    setLoadFailed(false);
    setLoading(false);

    // Invalid link: no project data at all
    if (result.data == null) {
      setProject(null);
      return;
    }

    setProject(result.data.project);
    setFeedback(result.data.feedback);
    setReplies(result.data.replies);
  }

  // This function runs when the client clicked on the website while placing feedback.
  // It remembers the spot (x and y are percentages of the page) and the page.
  // Then the form appears and feedback mode stops.
  function placePin(
    x: number,
    y: number,
    path: string
  ) {
    setPin({ x: x, y: y, path: path });
    setFormError("");
    setNotice("");
    setSelectedId(null);

    // Stop feedback mode after choosing a place
    setFeedbackMode(false);
  }

  // This function saves new feedback (FE-05).
  // 1. Check that there is a pin and a text of 1 to 500 characters.
  // 2. Call the database function review_add_feedback with the key, the spot and the page.
  // 3. Clear the form and load everything again, so the new feedback shows up.
  async function addFeedback(
    e: React.FormEvent
  ) {
    e.preventDefault();
    setNotice("");

    if (pin == null) {
      setFormError("Klik eerst op de website");
      return;
    }

    // The pin stays when the text is wrong
    const problem =
      checkText(message, "Beschrijf wat je bedoelt");

    if (problem != "") {
      setFormError(problem);
      return;
    }

    const result =
      await supabase.rpc("review_add_feedback", {
        p_key: params.publicKey,
        p_x: pin.x,
        p_y: pin.y,
        p_page: pin.path,
        p_comment: message.trim()
      });

    if (result.error) {
      setFormError("Feedback kon niet worden opgeslagen, probeer opnieuw");
      return;
    }

    setMessage("");
    setFormError("");
    setPin(null);
    setNotice("Feedback toegevoegd");

    loadReview();
  }

  // This function saves a reply of the client (FE-08).
  // The text must be filled in. The name is optional.
  // A failed reply keeps the text in the box, so nothing is lost.
  async function addReply(item: any) {
    const problem =
      checkText(replyText, "Schrijf eerst een reactie");

    if (problem != "") {
      setReplyError(problem);
      return;
    }

    const result =
      await supabase.rpc("review_add_reply", {
        p_key: params.publicKey,
        p_feedback_id: String(item.id),
        p_message: replyText.trim(),
        p_author_name: replyName.trim()
      });

    // The text stays in the box
    if (result.error) {
      setReplyError("Reactie niet verstuurd, probeer opnieuw");
      return;
    }

    setReplyText("");
    setReplyError("");

    loadReview();
  }

  // This function gives the number of a feedback item: #1, #2, #3...
  // It is the place of the item in the list, oldest first.
  function numberOf(id: any) {
    for (let i = 0; i < feedback.length; i++) {
      if (feedback[i].id == id) {
        return i + 1;
      }
    }

    return 0;
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

  // This function gives the page of a feedback item. Old feedback without a page counts as "/".
  function pageOf(item: any) {
    if (!item.page_path) {
      return "/";
    }

    return item.page_path;
  }

  // This function opens one feedback item in the right panel
  // and asks the website to show the page of that item.
  function selectItem(item: any) {
    setReplyText("");
    setReplyError("");
    setNotice("");
    setPin(null);
    setSelectedId(item.id);

    setGoTo({ path: pageOf(item), count: Date.now() });
  }

  // Loading
  if (loading) {
    return (
      <p className="page-message">
        Laden...
      </p>
    );
  }

  // Could not load
  if (project == null && loadFailed) {
    return (
      <div className="page-message">
        <p className="error" role="alert">
          De review kon niet worden geladen — probeer het opnieuw
        </p>

        <p className="small">
          {loadReason}
        </p>

        <button type="button" onClick={loadReview}>
          Opnieuw proberen
        </button>
      </div>
    );
  }

  // Invalid review link: no data, no pins
  if (project == null) {
    // Here is the page for a review link that is not valid: no project data and no pins (TE-03)
    return (
      <div className="app review-page">
        {/* Here is the bar on top */}
        <header className="reviewbar">
          <strong>FIXEL</strong>
        </header>

        <div className="page-message">
          <p className="error" role="alert">
            Deze reviewlink is niet (meer) geldig
          </p>
        </div>
      </div>
    );
  }

  // The feedback item that is open in the right panel
  let selected: any = null;

  for (const item of feedback) {
    if (item.id == selectedId) {
      selected = item;
    }
  }

  // Here is the container of the whole page: a bar on top, the website on the left, the panel on the right
  return (
    <div className="app review-page">
      {/* Here is the bar on top with the text "FIXEL — review van ..." */}
      <header className="reviewbar">
        <strong>FIXEL — review van {project.name}</strong>
      </header>

      <div className="review-body">
        {/* Here is the container with the website. SiteFrame shows the website and the pins */}
        {/* Left: the website */}
        <div className="review-area">
          <SiteFrame
            url={project.url}
            title={project.name}
            feedback={feedback}
            selectedId={selectedId}
            numberOf={numberOf}
            placing={feedbackMode}
            newPin={pin}
            goTo={goTo}
            onPlace={placePin}
            onSelect={selectItem}
            onPageChange={setCurrentPage}
          />
        </div>

        {/*
           Here is the white panel on the right. It shows one of three things:
           1. the form for new feedback (after a pin is placed)
           2. one feedback item with its replies
           3. the start view with the Feedback plaatsen button and the list
        */}
        {/* Right: panel */}
        <aside className="review-panel">
          {/* New feedback, only after a pin is placed */}
          {pin != null && (
            <div>
              <div className="panel-block">
                <h2>Feedback toevoegen</h2>

                <p className="small">
                  Pagina: {pin.path}
                </p>
              </div>

              <form
                className="panel-block"
                onSubmit={addFeedback}
                noValidate
              >
                <label htmlFor="feedback-text">
                  Wat moet hier veranderd worden?
                </label>

                <textarea
                  id="feedback-text"
                  value={message}
                  maxLength={500}
                  placeholder="Beschrijf wat je bedoelt..."
                  onChange={function (e) {
                    setMessage(e.target.value);
                  }}
                />

                {formError != "" && (
                  <p className="error" role="alert">
                    {formError}
                  </p>
                )}

                <div className="modal-buttons">
                  <button
                    type="button"
                    onClick={function () {
                      setPin(null);
                      setMessage("");
                      setFormError("");
                    }}
                  >
                    Annuleren
                  </button>

                  <button type="submit" className="primary">
                    Feedback toevoegen
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Here is one feedback item: the page, the description, the status and the replies */}
          {/* One feedback item: description, status and replies */}
          {pin == null && selected != null && (
            <div>
              <div className="panel-block">
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

                <label htmlFor="reply-name">
                  Naam (niet verplicht)
                </label>

                <input
                  id="reply-name"
                  value={replyName}
                  maxLength={80}
                  onChange={function (e) {
                    setReplyName(e.target.value);
                  }}
                />

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

          {/* Here is the start view: the button to place feedback and the list of all feedback */}
          {/* Start: place feedback and see the list */}
          {pin == null && selected == null && (
            <div>
              <div className="panel-block">
                <h2>Feedback</h2>

                <p className="small">
                  Klik op de website, een pin verschijnt, en beschrijf
                  wat er niet klopt.
                </p>

                <p className="small">
                  Je bekijkt nu de pagina:{" "}
                  <strong>{currentPage}</strong>
                </p>

                <button
                  type="button"
                  className="primary"
                  onClick={function () {
                    setNotice("");
                    setFeedbackMode(!feedbackMode);
                  }}
                >
                  {feedbackMode && "Feedbackmodus stoppen"}
                  {feedbackMode == false && "Feedback plaatsen"}
                </button>

                {notice != "" && (
                  <p role="status">
                    {notice}
                  </p>
                )}

                <p className="small">
                  Laadt de website niet?{" "}
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open de website in een nieuw tabblad
                  </a>
                </p>
              </div>

              {feedback.length == 0 && (
                <p className="panel-block">
                  Nog geen feedback op dit project
                </p>
              )}

              {feedback.map(function (item) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="feedback-row"
                    onClick={function () {
                      selectItem(item);
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
                  </button>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
