import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";

export default function Review() {
  const params = useParams();

  // Project
  const [project, setProject] =
    useState<any>(null);

  // Feedback text
  const [message, setMessage] =
    useState("");

  // Position of new pin
  const [x, setX] =
    useState<number | null>(null);

  const [y, setY] =
    useState<number | null>(null);

  // Feedback items
  const [feedback, setFeedback] =
    useState<any[]>([]);

  // Replies
  const [replies, setReplies] =
    useState<any[]>([]);

  // Which feedback we reply to
  const [replyFeedbackId, setReplyFeedbackId] =
    useState<number | null>(null);

  // Reply text
  const [replyText, setReplyText] =
    useState("");

  // Feedback mode
  const [feedbackMode, setFeedbackMode] =
    useState(false);


  useEffect(function () {
    getProject();
  }, []);


  // Get project by public key
  async function getProject() {
    const result =
      await supabase
        .from("projects")
        .select("*")
        .eq(
          "public_key",
          params.publicKey
        )
        .single();

    if (result.data) {
      setProject(result.data);

      getFeedback(
        result.data.id
      );

      getReplies();
    }
  }


  // Get feedback
  async function getFeedback(
    projectId: number
  ) {
    const result =
      await supabase
        .from("feedback_items")
        .select("*")
        .eq(
          "project_id",
          projectId
        )
        .order(
          "created_at",
          { ascending: true }
        );

    if (result.data) {
      setFeedback(result.data);
    }
  }


  // Get replies
  async function getReplies() {
    const result =
      await supabase
        .from("feedback_replies")
        .select("*")
        .order(
          "created_at",
          { ascending: true }
        );

    if (result.data) {
      setReplies(result.data);
    }
  }


  // Choose position for new feedback
  function choosePosition(
    e: React.MouseEvent<HTMLDivElement>
  ) {
    const box =
      e.currentTarget.getBoundingClientRect();

    const clickX =
      e.clientX - box.left;

    const clickY =
      e.clientY - box.top;

    // Convert position to percentage
    const xPercent =
      (clickX / box.width) * 100;

    const yPercent =
      (clickY / box.height) * 100;

    setX(xPercent);
    setY(yPercent);

    // Stop feedback mode after choosing a place
    setFeedbackMode(false);
  }


  // Add new feedback
  async function addFeedback(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (x == null || y == null) {
      alert(
        "Klik eerst op de website"
      );

      return;
    }

    if (message.trim() == "") {
      alert(
        "Beschrijf wat je bedoelt"
      );

      return;
    }

    const result =
      await supabase
        .from("feedback_items")
        .insert({
          project_id: project.id,
          x_percent: x,
          y_percent: y,
          comment: message,
          status: "open"
        });

    if (result.error) {
      alert(
        "Feedback kon niet worden opgeslagen"
      );

      return;
    }


    // Add activity
    await supabase
      .from("activity_log")
      .insert({
        project_id: project.id,

        // Reviewer has no account
        created_by: null,

        actor_type: "reviewer",

        event_type: "feedback",

        description:
          "Nieuwe feedback geplaatst: " +
          message
      });


    setMessage("");
    setX(null);
    setY(null);

    getFeedback(project.id);

    alert(
      "Feedback toegevoegd"
    );
  }


  // Add reviewer reply
  async function addReply(
    feedbackId: number
  ) {
    if (replyText.trim() == "") {
      return;
    }


    const result =
      await supabase
        .from("feedback_replies")
        .insert({
          feedback_id: feedbackId,

          // Reviewer has no account
          created_by: null,

          author_type: "reviewer",

          author_name: null,

          message: replyText
        });


    if (result.error) {
      alert(
        "Reactie kon niet worden opgeslagen"
      );

      return;
    }


    // Add activity
    await supabase
      .from("activity_log")
      .insert({
        project_id: project.id,

        created_by: null,

        actor_type: "reviewer",

        event_type: "reactie",

        description:
          "Nieuwe reactie: " +
          replyText
      });


    // Clear input
    setReplyText("");
    setReplyFeedbackId(null);


    // Reload replies
    getReplies();


    alert(
      "Reactie toegevoegd"
    );
  }


  // Invalid review link
  if (project == null) {
    return (
      <main>
        <p>
          Deze reviewlink is niet geldig.
        </p>
      </main>
    );
  }


  return (
    <main>

      <h1>
        Review van {project.name}
      </h1>


      <p>
        Klik op de website waar je
        feedback wilt geven.
      </p>


      {/* Feedback mode button */}

      <button
        type="button"
        onClick={function () {
          setFeedbackMode(
            !feedbackMode
          );
        }}
      >
        {feedbackMode
          ? "Feedbackmodus stoppen"
          : "Feedback plaatsen"}
      </button>


      {/* Website */}

      <div className="review-area">

        {/* Customer website */}
        <iframe
          src={project.url}
          title={project.name}
        />


        {/* Transparent click layer */}
        {feedbackMode && (
          <div
            className="feedback-layer"
            onClick={choosePosition}
          >
            <p className="feedback-help">
              Klik op de plek waar je
              feedback wilt geven
            </p>
          </div>
        )}


        {/* New pin */}

        {x != null && y != null && (
          <button
            className="feedback-pin new-pin"
            style={{
              left: x + "%",
              top: y + "%"
            }}
            type="button"
          >
            +
          </button>
        )}


        {/* Existing pins */}

        {feedback.map(function (item) {
          return (
            <button
              key={item.id}
              className="feedback-pin"
              style={{
                left:
                  item.x_percent + "%",

                top:
                  item.y_percent + "%"
              }}
              type="button"
            >
              {item.id}
            </button>
          );
        })}

      </div>


      {/* Add feedback */}

      {x != null && y != null && (
        <div>

          <h2>
            Feedback toevoegen
          </h2>

          <form onSubmit={addFeedback}>

            <label>
              Wat moet hier veranderd worden?
            </label>

            <textarea
              value={message}
              maxLength={500}
              placeholder="Beschrijf wat je bedoelt..."
              onChange={function (e) {
                setMessage(
                  e.target.value
                );
              }}
            />

            <button type="submit">
              Feedback toevoegen
            </button>

            <button
              type="button"
              onClick={function () {
                setX(null);
                setY(null);
                setMessage("");
              }}
            >
              Annuleren
            </button>

          </form>

        </div>
      )}


      {/* Feedback list */}

      <h2>
        Feedback
      </h2>


      {feedback.length == 0 && (
        <p>
          Nog geen feedback op dit project.
        </p>
      )}


      {feedback.map(function (item) {

        return (
          <div key={item.id}>

            <hr />


            <h3>
              Feedback #{item.id}
            </h3>


            <p>
              {item.comment}
            </p>


            <p>
              Status: {item.status}
            </p>


            {/* Replies */}

            <h4>
              Reacties
            </h4>


            {replies
              .filter(function (reply) {

                return (
                  reply.feedback_id ==
                  item.id
                );

              })
              .map(function (reply) {

                return (
                  <div key={reply.id}>

                    <p>
                      <strong>
                        {reply.author_type}
                      </strong>
                    </p>

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


            {/* Open reply box */}

            {replyFeedbackId != item.id && (

              <button
                type="button"
                onClick={function () {

                  setReplyFeedbackId(
                    item.id
                  );

                }}
              >
                Reageren
              </button>

            )}


            {/* Reply form */}

            {replyFeedbackId == item.id && (

              <div>

                <textarea
                  value={replyText}
                  placeholder="Schrijf een reactie..."
                  maxLength={500}
                  onChange={function (e) {

                    setReplyText(
                      e.target.value
                    );

                  }}
                />


                <button
                  type="button"
                  onClick={function () {

                    addReply(
                      item.id
                    );

                  }}
                >
                  Versturen
                </button>


                <button
                  type="button"
                  onClick={function () {

                    setReplyText("");

                    setReplyFeedbackId(
                      null
                    );

                  }}
                >
                  Annuleren
                </button>

              </div>

            )}

          </div>
        );

      })}

    </main>
  );
}