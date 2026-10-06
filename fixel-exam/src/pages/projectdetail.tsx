import { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import Nav from "../components/Nav";

import { supabase } from "../supabase";


export default function ProjectDetail() {

  // Haalt het project id uit de URL
  const params = useParams();
  const [project, setProject] =
    useState<any>(null);

  useEffect(function () {
    getProject();
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
      </main>
    </>
  );
  
}