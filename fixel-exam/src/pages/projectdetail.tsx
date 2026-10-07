import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Nav from "../components/Nav";
import { supabase } from "../supabase";

export default function ProjectDetail() {
  // Project id from the URL
  const params = useParams();

  // Project
  const [project, setProject] =
    useState<any>(null);

  // Feedback from this project
  const [feedback, setFeedback] =
    useState<any[]>([]);

  // Status filter
  const [filter, setFilter] =
    useState("alles");

  // Search text
  const [search, setSearch] =
    useState("");

  // Sorting
  const [sort, setSort] =
    useState("newest");

  // Project history
  const [activities, setActivities] =
    useState<any[]>([]);

  useEffect(function () {
    getProject();
    getFeedback();
    getActivities();
  }, []);

  // Get one project
  async function getProject() {
    const result =
      await supabase
        .from("projects")
        .select("*")
        .eq("id", params.id)
        .single();

    if (result.data) {
      setProject(result.data);
    }
  }

  // Get feedback from this project
  async function getFeedback() {
    const result =
      await supabase
        .from("feedback_items")
        .select("*")
        .eq(
          "project_id",
          params.id
        );

    if (result.data) {
      setFeedback(result.data);
    }
  }

  // Get project history
  async function getActivities() {
    const result =
      await supabase
        .from("activity_log")
        .select("*")
        .eq(
          "project_id",
          params.id
        )
        .order(
          "created_at",
          { ascending: false }
        );

    if (result.data) {
      setActivities(result.data);
    }
  }

  // Change feedback status
  async function changeStatus(
    id: string,
    newStatus: string
  ) {
    const result =
      await supabase
        .from("feedback_items")
        .update({
          status: newStatus
        })
        .eq("id", id);

    if (result.error) {
      alert(
        "Status kon niet worden aangepast"
      );

      return;
    }

    // Save action in history
    await supabase
      .from("activity_log")
      .insert({
        project_id: params.id,
        actor_type: "medewerker",
        type_gebeurtenis: "status",
        omschrijving:
          "Feedback status veranderd naar " +
          newStatus
      });

    // Reload
    getFeedback();
    getActivities();
  }

  // Make copy so original array is not changed
  let sortedFeedback =
    [...feedback];

  // Sort feedback
  sortedFeedback.sort(function (a, b) {
    const dateA =
      new Date(
        a.created_at
      ).getTime();

    const dateB =
      new Date(
        b.created_at
      ).getTime();

    if (sort == "oldest") {
      return dateA - dateB;
    }

    return dateB - dateA;
  });

  // Loading
  if (project == null) {
    return (
      <p>
        Laden...
      </p>
    );
  }

  // Filter and search
  const shownFeedback =
    sortedFeedback.filter(
      function (item) {

        // Filter status
        if (
          filter != "alles" &&
          item.status != filter
        ) {
          return false;
        }

        // Search in feedback comment
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

  return (
    <>
      <Nav />

      <main>

        <h1>
          {project.name}
        </h1>


        {/* Website URL */}

        <h2>
          Website
        </h2>

        <a
          href={project.url}
          target="_blank"
        >
          {project.url}
        </a>


        {/* Reviewer link */}

        <h2>
          Reviewlink
        </h2>

        <a
          href={
            "/review/" +
            project.public_key
          }
          target="_blank"
        >
          Open reviewer pagina
        </a>


        {/* Feedback */}

        <h2>
          Feedback
        </h2>


        {/* Search */}

        <label>
          Zoeken
        </label>

        <input
          placeholder="Zoek feedback..."
          value={search}
          onChange={function (e) {
            setSearch(
              e.target.value
            );
          }}
        />


        {/* Filter */}

        <label>
          Filter
        </label>

        <select
          value={filter}
          onChange={function (e) {
            setFilter(
              e.target.value
            );
          }}
        >
          <option value="alles">
            Alles
          </option>

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


        {/* Sort */}

        <label>
          Sorteren
        </label>

        <select
          value={sort}
          onChange={function (e) {
            setSort(
              e.target.value
            );
          }}
        >
          <option value="newest">
            Nieuwste eerst
          </option>

          <option value="oldest">
            Oudste eerst
          </option>
        </select>


        {/* No feedback */}

        {shownFeedback.length == 0 && (
          <p>
            Geen feedback gevonden.
          </p>
        )}


        {/* Feedback list */}

        {shownFeedback.map(
          function (item) {
            return (
              <div key={item.id}>
                <hr />

                <p>
                  Feedback #{item.id}
                </p>

                <p>
                  {item.comment}
                </p>

                <p>
                  Positie:{" "}
                  {Math.round(
                    item.x_percent
                  )}
                  % /{" "}
                  {Math.round(
                    item.y_percent
                  )}
                  %
                </p>


                {/* Change status */}

                <label>
                  Status
                </label>

                <select
                  value={item.status}
                  onChange={function (e) {
                    changeStatus(
                      item.id,
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

              </div>
            );
          }
        )}


        {/* Activity history */}

        <h2>
          Activiteiten
        </h2>

        {activities.length == 0 && (
          <p>
            Nog geen activiteit voor dit
            project.
          </p>
        )}

        {activities.map(
          function (activity) {
            return (
              <div key={activity.id}>

                <p>
                  {
                    activity.omschrijving
                  }
                </p>

                <small>
                  {new Date(
                    activity.created_at
                  ).toLocaleString()}
                </small>

                <hr />

              </div>
            );
          }
        )}

      </main>
    </>
  );
}