import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";

export default function Review() {
  const params = useParams();
  const [project, setProject] =
    useState<any>(null);

  const [page, setPage] =
    useState("/");

  const [element, setElement] =
    useState("");

  const [message, setMessage] =
    useState("");

const [screenshot, setScreenshot] =
  useState<any>(null);

  useEffect(function () {
    getProject();
  }, []);

  // Project ophalen via openbare sleutel
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

  // Feedback opslaan
  async function addFeedback(
    e: React.FormEvent
  ) {
    e.preventDefault();

    // Feedback mag niet leeg zijn
    if (message == "") {
      alert("Schrijf eerst feedback");
      return;
    }

    // Standaard geen screenshot
    let screenshotUrl: string | null = null;

    // Alleen uploaden als er een bestand is
    if (screenshot) {
      // Unieke naam maken
      const fileName =
        Date.now() +
        "-" +
        screenshot.name;

      // Bestand uploaden
      const upload =
        await supabase.storage
          .from("screenshots")
          .upload(
            fileName,
            screenshot
          );

      if (upload.error) {
        alert(
          "Screenshot kon niet worden geupload"
        );
        return;
      }

      // Openbare URL ophalen
      const urlResult =
        supabase.storage
          .from("screenshots")
          .getPublicUrl(fileName);

      screenshotUrl =
        urlResult.data.publicUrl;
    }

    // Feedback opslaan
    const result =
      await supabase
        .from("feedback")
        .insert({
          project_id: project.id,
          page_path: page,
          element: element,
          message: message,
          screenshot_url: screenshotUrl,
          status: "nieuw"
        });

    if (result.error) {
      alert(
        "Feedback kon niet worden opgeslagen"
      );
      return;
    }

    // Activiteit bewaren
    await supabase
      .from("activities")
      .insert({
        project_id: project.id,
        text: "Nieuwe feedback toegevoegd"
      });

    alert("Feedback toegevoegd");

    // Inputs leeg maken
    setElement("");
    setMessage("");
    setScreenshot(null);
  }
  if (project == null) {
    return (
      <main>
        <p>Project niet gevonden.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>
        Feedback voor {project.name}
      </h1>
      <a
        href={project.website_url}
        target="_blank"
      >
        Website openen
      </a>

      <h2>Feedback toevoegen</h2>
      <form onSubmit={addFeedback}>
        <label>
          Pagina
        </label>

        <input
          value={page}
          placeholder="/contact"
          onChange={function (e) {
            setPage(e.target.value);
          }}
        />

        <label>
          Element
        </label>

        <input
          value={element}
          placeholder="Bijvoorbeeld menu knop"
          onChange={function (e) {
            setElement(e.target.value);
          }}
        />

<label>
  Screenshot
</label>
<input
  type="file"
  accept="image/*"
  onChange={function (e) {
    if (e.target.files) {
      setScreenshot(
        e.target.files[0]
      );
    }
  }}
/>
        <label>
          Feedback
        </label>

        <textarea
          value={message}
          onChange={function (e) {
            setMessage(e.target.value);
          }}
        />

        <label>
          Screenshot (optioneel)
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={function (e) {
            if (e.target.files) {
              setScreenshot(e.target.files[0]);
            }
          }}
        />
        <button type="submit">
          Feedback toevoegen
        </button>
      </form>
    </main>
  );
  
}