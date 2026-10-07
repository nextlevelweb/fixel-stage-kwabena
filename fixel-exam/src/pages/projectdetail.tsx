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

  useEffect(function () {
    getProject();
    getFeedback();
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

  // Status van feedback veranderen
  async function changeStatus(
    id: number,
    newStatus: string
  ) {
    await supabase
      .from("feedback")
      .update({
        status: newStatus
      })
      .eq("id", id);

    // Lijst opnieuw ophalen
    getFeedback();
  }

  if (project == null) {
    return <p>Laden...</p>;
  }

  // Alleen feedback met de gekozen status tonen
  const shownFeedback = feedback.filter(function (item) {
    if (filter == "alles") {
      return true;
    }
    return item.status == filter;
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
      </main>
    </>
  );
}
