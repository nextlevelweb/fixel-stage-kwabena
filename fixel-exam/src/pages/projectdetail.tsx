import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Nav from "../components/Nav";
import { supabase } from "../supabase";

export default function ProjectDetail() {

  // Haalt het project id uit de URL
  const params = useParams();

  const [project, setProject] =
    useState<any>(null);

  const [feedback, setFeedback] =
    useState<any[]>([]);

  const [filter, setFilter] =
    useState("alles");

  const [search, setSearch] =
    useState("");

  const [sort, setSort] =
    useState("newest");

  const [activities, setActivities] =
    useState<any[]>([]);

  useEffect(function () {
    getProject();
    getFeedback();
    getActivities();
  }, []);

  // Eén project ophalen
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

  // Feedback van dit project ophalen
  async function getFeedback() {
    const result =
      await supabase
        .from("feedback")
        .select("*")
        .eq(
          "project_id",
          params.id
        );

    if (result.data) {
      setFeedback(result.data);
    }
  }

  // Activiteiten ophalen
  async function getActivities() {
    const result =
      await supabase
        .from("activities")
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

  // Status van feedback veranderen
  async function changeStatus(
    id: number,
    newStatus: string
  ) {
    // Status aanpassen
    await supabase
      .from("feedback")
      .update({
        status: newStatus
      })
      .eq("id", id);

    // Activiteit bewaren
    await supabase
      .from("activities")
      .insert({
        project_id: Number(params.id),
        text:
          "Feedback status veranderd naar " +
          newStatus
      });

    // Lijst opnieuw ophalen
    getFeedback();
    getActivities();
  }

  // Kopie maken van feedback
  let sortedFeedback =
    [...feedback];

  // Sorteren
  sortedFeedback.sort(function (a, b) {
    const dateA =
      new Date(
        a.created_at
      ).getTime();

    const dateB =
      new Date(
        b.created_at
      ).getTime();

    // Oudste eerst
    if (sort == "oldest") {
      return dateA - dateB;
    }

    // Nieuwste eerst
    return dateB - dateA;
  });

  if (project == null) {
    return <p>Laden...</p>;
  }

  // Alleen feedback tonen die past bij de status en het zoekwoord
  const shownFeedback = sortedFeedback.filter(function (item) {
    // Status controleren
    if (
      filter != "alles" &&
      item.status != filter
    ) {
      return false;
    }

    // Tekst waarin we zoeken
    const text =
      item.message +
      " " +
      item.page_path +
      " " +
      item.element;

    // Zoekwoord controleren
    if (
      !text
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    ) {
      return false;
    }

    return true;
  });

  return (
    <>
      <Nav />
      <main>
        <h1>
          {project.name}
        </h1>
        <p>
          Website:
        </p>


        <a
          href={project.website_url}
          target="_blank"
        >
          {project.website_url}
        </a>

        <h2>Reviewer link</h2>
        <a
          href={"/review/" + project.public_key}
        >
          Open reviewer pagina
        </a>

        <h2>Feedback</h2>

        <label>
          Zoeken
        </label>

        <input
          placeholder="Zoek feedback..."
          value={search}
          onChange={function (e) {
            setSearch(e.target.value);
          }}
        />

        <label>
          Filter
        </label>

        <select
          value={filter}
          onChange={function (e) {
            setFilter(e.target.value);
          }}
        >
          <option value="alles">
            Alles
          </option>
          <option value="nieuw">
            Nieuw
          </option>
          <option value="in behandeling">
            In behandeling
          </option>
          <option value="afgerond">
            Afgerond
          </option>
        </select>

        <label>
          Sorteren
        </label>

        <select
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

        {shownFeedback.map(function (item) {
          return (
            <div key={item.id}>
              <hr />
              <p>
                Pagina: {item.page_path}
              </p>
              <p>
                Element: {item.element}
              </p>
              <p>
                {item.message}
              </p>

              <select
                value={item.status}
                onChange={function (e) {
                  changeStatus(
                    item.id,
                    e.target.value
                  );
                }}
              >
                <option value="nieuw">
                  Nieuw
                </option>
                <option value="in behandeling">
                  In behandeling
                </option>
                <option value="afgerond">
                  Afgerond
                </option>
              </select>

              {item.screenshot_url && (
                <a
                  href={item.screenshot_url}
                  target="_blank"
                >
                  Screenshot bekijken
                </a>
              )}
            </div>
          );
        })}

        <h2>Activiteiten</h2>

        {activities.map(function (activity) {
          return (
            <div key={activity.id}>
              <p>
                {activity.text}
              </p>

              <small>
                {new Date(
                  activity.created_at
                ).toLocaleString()}
              </small>

              <hr />
            </div>
          );
        })}
      </main>
    </>
  );
}
