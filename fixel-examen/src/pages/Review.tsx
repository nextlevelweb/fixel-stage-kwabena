import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";
import { isValidText } from "../validation";

// Note: these are different, SMALLER types than in Projectbeheer.tsx. A reviewer
// may only see these fields (via the RPC functions, chapter 14.5) — for example
// no created_by, because that would leak a real account id to an anonymous visitor.
type PublicProject = {
  id: number;
  name: string;
  url: string;
};

type PublicFeedback = {
  id: number;
  comment: string;
  status: "open" | "bezig" | "afgerond";
  x_percent: number;
  y_percent: number;
  created_at: string;
};

type PublicReply = {
  id: number;
  author_type: string;
  author_name: string | null;
  message: string;
  created_at: string;
};

export default function Review() {
  // :publicKey comes from the route "/review/:publicKey" (App.tsx).
  const { publicKey } = useParams<{ publicKey: string }>();
  // Reference to the iframe container in the HTML, needed to query its dimensions
  // as soon as something is clicked (see handleContainerClick).
  const containerRef = useRef<HTMLDivElement>(null);

  const [project, setProject] = useState<PublicProject | null>(null);
  const [feedback, setFeedback] = useState<PublicFeedback[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [invalidLink, setInvalidLink] = useState(false);

  // "Placement mode": when pinMode is on, the next click on the
  // website means "a new feedback point goes here", instead of just a click.
  const [pinMode, setPinMode] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  const [commentDraft, setCommentDraft] = useState("");

  // Which existing feedback point is open in the right-hand panel, plus its replies.
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null);
  const [replies, setReplies] = useState<PublicReply[]>([]);
  const [reviewerName, setReviewerName] = useState("");
  const [replyDraft, setReplyDraft] = useState("");

  // When the link is opened (or if someone accidentally puts a different key
  // in the URL), fetch the project and the feedback.
  useEffect(() => {
    if (!publicKey) return;
    loadProject();
    loadFeedback();
  }, [publicKey]);

  // FE-04: fetches the project via the RPC function get_public_project — NEVER
  // directly via .from("projects"), because an anonymous visitor has no access
  // to that (chapter 14.3). If the key does not exist, we'll then show
  // the fully separate "invalid link" screen.
  async function loadProject() {
    setLoading(true);
    const { data, error: rpcError } = await supabase
      .rpc("get_public_project", { p_key: publicKey })
      .maybeSingle();

    setLoading(false);

    if (rpcError || !data) {
      setInvalidLink(true);
      return;
    }

    setProject(data as PublicProject);
  }

  // Fetches all feedback points for this project, again via an RPC function.
  async function loadFeedback() {
    const { data, error: rpcError } = await supabase.rpc("get_public_feedback", {
      p_key: publicKey,
    });

    if (!rpcError) {
      setFeedback((data ?? []) as PublicFeedback[]);
    }
  }

  // Called on a click anywhere on the website preview.
  function handleContainerClick(event: MouseEvent<HTMLDivElement>) {
    // Only do something if "Feedback plaatsen" is active — otherwise a click is
    // just a click (e.g. to view an existing point via its own button).
    if (!pinMode || !containerRef.current) return;

    // Convert the position to a PERCENTAGE of width/height (TE-04), not
    // to pixels — this way the pin stays in the right place on every screen size.
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setPendingPosition({ x, y });
    setSelectedFeedbackId(null);
  }

  // FE-05: the reviewer submits the new feedback they just typed in.
  async function submitFeedback() {
    if (!pendingPosition || !publicKey) return;

    if (!isValidText(commentDraft)) {
      setError("Beschrijf wat je bedoelt.");
      return;
    }

    // add_public_feedback (chapter 14.5) also checks the length and the
    // position (0-100) itself once more — so this is not the only line of defense.
    const { error: rpcError } = await supabase.rpc("add_public_feedback", {
      p_key: publicKey,
      p_comment: commentDraft.trim(),
      p_x: pendingPosition.x,
      p_y: pendingPosition.y,
    });

    if (rpcError) {
      setError("Feedback opslaan mislukt.");
      return;
    }

    setCommentDraft("");
    setPendingPosition(null);
    setPinMode(false);
    setError("");
    await loadFeedback(); // show the new pin immediately
  }

  // Clicking an existing pin: select that feedback point and fetch its replies.
  async function openFeedback(feedbackId: number) {
    setPendingPosition(null);
    setSelectedFeedbackId(feedbackId);
    const { data, error: rpcError } = await supabase.rpc("get_public_replies", {
      p_key: publicKey,
      p_feedback_id: feedbackId,
    });

    if (!rpcError) {
      setReplies((data ?? []) as PublicReply[]);
    }
  }

  // FE-08: the reviewer (without an account) posts a reply to an existing
  // feedback point, optionally including their name.
  async function submitReply() {
    if (!selectedFeedbackId || !publicKey) return;

    if (!isValidText(replyDraft)) {
      setError("Schrijf een reactie van maximaal 500 tekens.");
      return;
    }

    const { error: rpcError } = await supabase.rpc("add_public_reply", {
      p_key: publicKey,
      p_feedback_id: selectedFeedbackId,
      p_name: reviewerName.trim(),
      p_message: replyDraft.trim(),
    });

    if (rpcError) {
      setError("Reactie niet verstuurd, probeer opnieuw.");
      return;
    }

    setReplyDraft("");
    setError("");
    await openFeedback(selectedFeedbackId); // fetch the replies again, including the new one
  }

  if (loading) {
    return <p className="center-message">Laden...</p>;
  }

  // TE-03: an unknown or expired key shows a COMPLETELY separate screen —
  // not a half-filled page with an error message, but also no trace whatsoever
  // of project data. This is the "ALTERNATIVE SCREEN" from the wireframe.
  if (invalidLink) {
    return (
      <div className="page invalid-link-page">
        <div className="invalid-link-box">
          <h2>Deze reviewlink is niet (meer) geldig</h2>
          <p>Er is geen projectdata of feedback zichtbaar. Vraag de medewerker om een nieuwe link.</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const selectedFeedback = feedback.find((f) => f.id === selectedFeedbackId) ?? null;

  return (
    <div className="page review-page">
      <header className="topbar">
        <strong>FIXEL — review van klant</strong>
        <div className="topbar-actions">
          <button
            onClick={() => {
              setPinMode((v) => !v);
              setSelectedFeedbackId(null);
            }}
          >
            {pinMode ? "Annuleer plaatsing" : "Feedback plaatsen"}
          </button>
          <button className="btn-outline" onClick={loadFeedback}>
            Ververs
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="review-layout">
        <div className="review-main">
          <div ref={containerRef} className="iframe-wrap" onClick={handleContainerClick}>
            <iframe src={project.url} title={project.name} className="review-frame" />
            {/* Only visible/clickable during "Feedback plaatsen" — captures the click. */}
            {pinMode && <div className="pin-overlay" />}

            {/* Numbered, colored pins — the number is simply the position in the
                list (1, 2, 3, ...), the color comes from the status. */}
            {feedback.map((item, index) => (
              <button
                key={item.id}
                className={`pin ${item.status}`}
                style={{ left: `${item.x_percent}%`, top: `${item.y_percent}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  openFeedback(item.id);
                }}
                title={item.comment}
              >
                {index + 1}
              </button>
            ))}

            {pendingPosition && (
              <div
                className="pending-pin"
                style={{ left: `${pendingPosition.x}%`, top: `${pendingPosition.y}%` }}
              />
            )}
          </div>
        </div>

        <aside className="review-side">
          {pendingPosition && (
            <div className="card">
              <h2>Nieuwe feedback</h2>
              <textarea
                placeholder="Wat valt je op deze plek op?"
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
              />
              <button onClick={submitFeedback}>Feedback versturen</button>
            </div>
          )}

          {!pendingPosition && selectedFeedback && (
            <div className="card">
              <h2>Feedbackpunt #{feedback.findIndex((f) => f.id === selectedFeedback.id) + 1}</h2>
              <span className={`status-pill ${selectedFeedback.status}`}>{selectedFeedback.status}</span>

              <p className="eyebrow">Omschrijving</p>
              <p>{selectedFeedback.comment}</p>

              <p className="eyebrow">Reacties</p>
              {replies.length === 0 && <p className="feedback-meta">Nog geen reacties.</p>}
              {replies.map((reply) => (
                <p key={reply.id} className="reply">
                  <strong>
                    {reply.author_type === "medewerker" ? "Medewerker" : reply.author_name || "Jij"}:
                  </strong>{" "}
                  {reply.message}
                </p>
              ))}

              <input
                placeholder="Je naam (optioneel)"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
              />
              <textarea
                placeholder="Schrijf een reactie..."
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
              />
              <button onClick={submitReply}>Reactie versturen</button>
            </div>
          )}

          {!pendingPosition && !selectedFeedback && (
            <div className="card">
              <p className="feedback-meta">
                Klik op een pin om een feedbackpunt te bekijken, of klik op "Feedback plaatsen" en
                daarna op de website om een nieuw punt toe te voegen.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}