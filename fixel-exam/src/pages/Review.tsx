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

  // Position of the pin
  const [x, setX] =
    useState<number | null>(null);

  const [y, setY] =
    useState<number | null>(null);

  // Existing feedback
  const [feedback, setFeedback] =
    useState<any[]>([]);

  // Load project when page opens
  useEffect(function () {
    getProject();
  }, []);

  // Find project using the public review key
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
    }
  }

  // Get feedback for this project
  async function getFeedback(
    projectId: string
  ) {
    const result =
      await supabase
        .from("feedback_items")
        .select("*")
        .eq(
          "project_id",
          projectId
        );

    if (result.data) {
      setFeedback(result.data);
    }
  }

  // Save position when reviewer clicks
  function choosePosition(
    e: React.MouseEvent<HTMLDivElement>
  ) {
    const box =
      e.currentTarget.getBoundingClientRect();

    const clickX =
      e.clientX - box.left;

    const clickY =
      e.clientY - box.top;

    const xPercent =
      (clickX / box.width) * 100;

    const yPercent =
      (clickY / box.height) * 100;

    setX(xPercent);
    setY(yPercent);
  }

  // Save feedback
  async function addFeedback(
    e: React.FormEvent
  ) {
    e.preventDefault();

    // Reviewer must choose a position
    if (x == null || y == null) {
      alert(
        "Klik eerst op de website"
      );
      return;
    }

    // Feedback may not be empty
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

    alert(
      "Feedback toegevoegd"
    );

    // Clear new feedback
    setMessage("");
    setX(null);
    setY(null);

    // Reload feedback
    getFeedback(project.id);
  }

  // Project does not exist
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

      {/* Website area */}
      <div
        className="review-area"
        onClick={choosePosition}
      >
        <iframe
          src={project.url}
          title={project.name}
        />

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

        {/* Existing feedback pins */}
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

      <h2>
        Feedback toevoegen
      </h2>

      <form onSubmit={addFeedback}>
        <label>
          Feedback
        </label>

        <textarea
          value={message}
          maxLength={500}
          onChange={function (e) {
            setMessage(
              e.target.value
            );
          }}
        />

        <button type="submit">
          Feedback toevoegen
        </button>
      </form>

      <h2>
        Feedback
      </h2>

      {feedback.length == 0 && (
        <p>
          Nog geen feedback op dit
          project.
        </p>
      )}

      {feedback.map(function (item) {
        return (
          <div key={item.id}>
            <hr />

            <p>
              {item.comment}
            </p>

            <p>
              Status:
              {" "}
              {item.status}
            </p>
          </div>
        );
      })}
    </main>
  );
}