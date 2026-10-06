import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import { supabase } from "../supabase";

export default function Projects() {
  // Hier bewaren we alle projecten
  const [projects, setProjects] = useState<any[]>([]);
  useEffect(function () {
    getProjects();
  }, []);

  // Projecten ophalen uit Supabase
  async function getProjects() {
    const result =
      await supabase
        .from("projects")
        .select("*");

    if (result.data) {
      setProjects(result.data);
    }
  }

  return (
    <>
      <Nav />
      <main>
        <h1>Projecten</h1>
        {projects.map(function (project) {
          return (
            <div key={project.id}>
              <h2>
                {project.name}
              </h2>
              <p>
                {project.website_url}
              </p>

              <Link
                to={"/projects/" + project.id}
              >
                Open project
              </Link>
              <hr />
            </div>
          );
        })}
      </main>

    </>

  );

}