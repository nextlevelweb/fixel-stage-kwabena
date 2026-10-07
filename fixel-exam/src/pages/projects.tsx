import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import { supabase } from "../supabase";

export default function Projects() {
  const [projects, setProjects] =
    useState<any[]>([]);
  const [name, setName] =
    useState("");
  const [website, setWebsite] =
    useState("");

  useEffect(function () {
    getProjects();
  }, []);

  // Alle projecten ophalen
  async function getProjects() {
    const result =
      await supabase
        .from("projects")
        .select("*");

    if (result.data) {
      setProjects(result.data);
    }
  }

  // Nieuw project toevoegen
  async function addProject(
    e: React.FormEvent
  ) {
    e.preventDefault();

    // Simpele controle
    if (name == "") {
      alert("Vul een projectnaam in");
      return;
    }

    if (website == "") {
      alert("Vul een website in");
      return;
    }



    // Unieke link maken voor reviewer
    const publicKey =
      crypto.randomUUID();

    // Project opslaan
    const result =
      await supabase
        .from("projects")
        .insert({
          name: name,
          website_url: website,
          public_key: publicKey
        });



    if (result.error) {
      alert("Project kon niet worden toegevoegd");
      return;
    }



    // Inputs leeg maken
    setName("");
    setWebsite("");

    // Projectlijst opnieuw ophalen
    getProjects();
  }

  // Project verwijderen
  async function deleteProject(id: number) {
    const answer =
      confirm("Wil je dit project verwijderen?");

    if (answer == false) {
      return;
    }

    await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    getProjects();
  }

  // Project bewerken
  async function editProject(project: any) {
    const newName =
      prompt("Nieuwe projectnaam", project.name);

    // Op annuleren geklikt
    if (newName == null) {
      return;
    }

    const newWebsite =
      prompt("Nieuwe website URL", project.website_url);

    if (newWebsite == null) {
      return;
    }

    const result =
      await supabase
        .from("projects")
        .update({
          name: newName,
          website_url: newWebsite
        })
        .eq("id", project.id);

    if (result.error) {
      alert("Project kon niet worden aangepast");
      return;
    }

    getProjects();
  }

  return (
    <>
      <Nav />
      <main>
        <h1>Projecten</h1>
        <h2>Nieuw project</h2>
        <form onSubmit={addProject}>
          <label>
            Projectnaam
          </label>

          <input
            value={name}
            onChange={function (e) {
              setName(e.target.value);

            }}
          />

          <label>
            Website URL
          </label>

          <input
            value={website}
            placeholder="https://website.nl"
            onChange={function (e) {
              setWebsite(e.target.value);
            }}
          />
          <button type="submit">
            Project toevoegen
          </button>
        </form>



        <h2>Alle projecten</h2>

        {projects.map(function (project) {
          return (
            <div key={project.id}>
              <h3>
                {project.name}
              </h3>

              <p>
                {project.website_url}
              </p>

              <Link
                to={"/projects/" + project.id}
              >
                Open project
              </Link>

              <p>
                Reviewer link:{" "}
                <a
                  href={"/review/" + project.public_key}
                  target="_blank"
                >
                  {window.location.origin + "/review/" + project.public_key}
                </a>
              </p>
              <button
  onClick={function () {
    deleteProject(project.id);
  }}>

  Verwijderen

</button>

              <button
                onClick={function () {
                  editProject(project); // Open edit project
                }}
              >
                Bewerken
              </button>

              <hr />
            </div>
          );
        })}
      </main>
    </>
  );
}
