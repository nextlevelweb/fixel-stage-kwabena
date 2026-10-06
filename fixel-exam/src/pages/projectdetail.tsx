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

useEffect(function () {
  getProject();
  getFeedback();
}, []);

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

  if (project == null) {
    return <p>Laden...</p>;
  }

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
{feedback.map(function (item) {
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
      <p>
        Status: {item.status}
      </p>
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