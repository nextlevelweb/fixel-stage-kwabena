// Runs inside the customer website (only through /site-proxy).
// It tells the review screen which page is shown and how far it is scrolled,
// so feedback pins can stay on the same spot of the page.
(function () {
  var realUrl = new URLSearchParams(window.location.search).get("url");

  // This function gives the real address of the page that is shown.
  // We see the page through our proxy, so the real address is in the ?url= part.
  function realPage() {
    try {
      return new URL(realUrl);
    } catch (error) {
      return window.location;
    }
  }

  // This function sends a message to Fixel (the parent window) with the page,
  // the scroll position and the size of the page. Fixel uses it to place the pins.
  function send() {
    var root = document.documentElement;
    var body = document.body;

    var docWidth = Math.max(root.scrollWidth, window.innerWidth);
    var docHeight = Math.max(root.scrollHeight, window.innerHeight);

    if (body) {
      docWidth = Math.max(docWidth, body.scrollWidth);
      docHeight = Math.max(docHeight, body.scrollHeight);
    }

    window.parent.postMessage(
      {
        type: "fixel-page",
        path: realPage().pathname,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        docWidth: docWidth,
        docHeight: docHeight,
        viewWidth: window.innerWidth,
        viewHeight: window.innerHeight
      },
      "*"
    );
  }

  // This function asks to send a message, but never more than once per screen update.
  // A scroll event fires many times, this keeps the page fast.
  var waiting = false;

  function queue() {
    if (waiting) {
      return;
    }

    waiting = true;

    window.requestAnimationFrame(function () {
      waiting = false;
      send();
    });
  }

  // A scroll event already fires once per screen update, so we send at once.
  // Waiting for another screen update (queue) made the pins lag behind the page.
  window.addEventListener("scroll", send, { passive: true });
  window.addEventListener("resize", queue);
  window.addEventListener("load", queue);
  document.addEventListener("DOMContentLoaded", queue);

  // The page can become taller later (images, menus)
  if (window.ResizeObserver) {
    new ResizeObserver(queue).observe(document.documentElement);
  }

  window.setInterval(queue, 1000);

  send();

  // This code watches every click on the page.
  // A link to another page is sent through the proxy again, so we keep seeing the scroll
  // position of that page too. A #link on the same page just scrolls. Mail and phone links
  // are left alone.
  document.addEventListener(
    "click",
    function (e) {
      if (e.defaultPrevented || e.button != 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      var link = null;

      if (e.target && e.target.closest) {
        link = e.target.closest("a");
      }

      if (!link || !link.href || link.hasAttribute("download")) {
        return;
      }

      var url;

      try {
        url = new URL(link.href);
      } catch (error) {
        return;
      }

      if (url.protocol != "http:" && url.protocol != "https:") {
        return;
      }

      var here = realPage();

      // Same page, only the #part is different: scroll to it
      if (
        url.origin == here.origin &&
        url.pathname == here.pathname &&
        url.search == here.search &&
        url.hash != ""
      ) {
        e.preventDefault();

        var target = document.getElementById(decodeURIComponent(url.hash.slice(1)));

        if (target) {
          target.scrollIntoView();
        }

        return;
      }

      e.preventDefault();

      window.location.href =
        window.location.origin + "/site-proxy?url=" + encodeURIComponent(url.href);
    },
    true
  );
})();
