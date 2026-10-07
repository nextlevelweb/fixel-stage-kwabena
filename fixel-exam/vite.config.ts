// This file tells Vite (the tool that turns your code into a real website) how to
// build your project: "use React", plus a small proxy for the review screen.
// (Think of it like the webpack.mix.js / vite.config.js of a Laravel project.)
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";

// /site-proxy?url=https://site.nl/contact
// Fetches the website for us and sends it back from OUR address, without the headers that
// forbid iframes, plus one extra script (public/fixel-proxy.js). Because the page now comes
// from our own address, Fixel can see the scroll position and the page that is shown, and
// feedback pins can stay on the right spot. The client does not have to change their website.
// This only runs on your own computer (npm run dev / npm run preview).
// This function answers every request to /site-proxy.
// 1. Read the website address from ?url=
// 2. Fetch that page from the internet
// 3. For a normal web page, put our script (fixel-proxy.js) and a <base> tag at the top.
//    The <base> tag makes images and styles load from the real website.
async function handleProxy(req: any, res: any) {
  try {
    const target = new URL(String(req.url), "http://localhost").searchParams.get("url");
    if (target === null || /^https?:\/\//.test(target) === false) {
      res.statusCode = 400;
      res.end("Ongeldige url");
      return;
    }

    const answer = await fetch(target, { redirect: "follow" });
    let type = answer.headers.get("content-type");
    if (type === null) {
      type = "";
    }
    res.statusCode = answer.status;
    res.setHeader("content-type", type);

    if (type.includes("text/html") === false) {
      res.end(Buffer.from(await answer.arrayBuffer())); // image, pdf, ...: send as is
      return;
    }

    // <base> makes images/css load from the real website. Our script must come from OUR
    // address, so it gets a full address (otherwise <base> would point it at the real website).
    let protocol = "http";
    if (req.socket.encrypted) {
      protocol = "https";
    }
    const origin = protocol + "://" + req.headers.host;

    let html = await answer.text();
    const extra =
      '<script src="' + origin + '/fixel-proxy.js"></script>' +
      '<base href="' + answer.url + '">';
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, (tag) => tag + extra);
    } else {
      html = extra + html;
    }
    res.end(html);
  } catch (error) {
    res.statusCode = 502;
    res.end("De website kon niet worden geladen.");
  }
}

// This plugin connects the function above to the Vite server, so /site-proxy exists
// when you run npm run dev or npm run preview.
function siteProxy(): Plugin {
  return {
    name: "site-proxy",
    configureServer(server) {
      server.middlewares.use("/site-proxy", handleProxy);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/site-proxy", handleProxy);
    },
  };
}

export default defineConfig({
  plugins: [react(), siteProxy()],
  test: {
    // the screen tests start a fake browser, that can be slow on a busy computer
    testTimeout: 20000,
  },
});
