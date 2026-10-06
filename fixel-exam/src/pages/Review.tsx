import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";
export default function Review() {

  // Public key uit URL
  const params = useParams();
  const [project, setProject] =
    useState<any>(null);

  useEffect(function () {
    getProject();
  }, []);

  // Project zoeken met public key
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
    }
  }

  if (project == null) {
    return (
      <main>
        <p>
          Project niet gevonden.
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>
        Review {project.name}
      </h1>
      <p>
        Hier kun je feedback geven.
      </p>
      <a
        href={project.website_url}
        target="_blank" >
        Website openen
      </a>
    </main>
  );
}