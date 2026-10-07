import { useEffect, useRef, useState } from "react";
let PROXY = false;
if (import.meta.env.DEV) {
  PROXY = true;
}
if (import.meta.env.VITE_SITE_PROXY == "true") {
  PROXY = true;
}

function frameSrc(url: string) {
  if (PROXY) {
    return "/site-proxy?url=" + encodeURIComponent(url);
  }
  return url;
}

export default function SiteFrame(props: any) {
  const frameRef = useRef<any>(null);
  const [src, setSrc] =
    useState(frameSrc(props.url));
  const [info, setInfo] =
    useState<any>(null);
  const [fallback, setFallback] =
    useState(false);

  // RECEIVE WEBSITE INFORMATION
  useEffect(function () {
    function onMessage(event: any) {
      const frame = frameRef.current;

      if (frame == null) {
        return;
      }

      if (event.source != frame.contentWindow) {
        return;
      }

      if (event.data == null) {
        return;
      }

      if (event.data.type != "fixel-page") {
        return;
      }

      setInfo(event.data);
    }

    window.addEventListener(
      "message",
      onMessage
    );

    return function () {
      window.removeEventListener(
        "message",
        onMessage
      );
    };
  }, []);

  // CURRENT PAGE
  let infoPath = "";
  if (info != null) {
    infoPath = info.path;
  }

  useEffect(function () {
    if (infoPath == "") {
      return;
    }

    if (props.onPageChange) {
      props.onPageChange(infoPath);
    }
  }, [infoPath]);

  // FALLBACK
  useEffect(function () {
    if (info != null) {
      setFallback(false);
      return;
    }


    const timer = setTimeout(
      function () {
        setFallback(true);
      },
      4000
    );

    return function () {
      clearTimeout(timer);
    };
  }, [info, src]);

  // WEBSITE URL CHANGED
  const lastUrl =
    useRef(props.url);

  useEffect(function () {
    if (lastUrl.current == props.url) {
      return;
    }

    lastUrl.current =
      props.url;

    setInfo(null);
    setSrc(
      frameSrc(props.url)
    );
  }, [props.url]);

  // GO TO ANOTHER PAGE
  useEffect(function () {
    if (props.goTo == null) {
      return;
    }


    if (info != null) {
      if (info.path == props.goTo.path) {
        return;
      }
    }

    const url =
      new URL(
        props.goTo.path,
        props.url
      ).href;


    setInfo(null);
    setSrc(
      frameSrc(url)
    );
  }, [props.goTo]);

  // DO WE KNOW THE PAGE SIZE?
  let known = false;
  if (info != null) {
    known = true;
  }



  let guessing = false;
  if (PROXY == false) {
    guessing = true;
  }
  if (fallback) {
    guessing = true;
  }

  // CURRENT PAGE
  let currentPath = "/";
  if (known) {
    currentPath = info.path;
  }

  // PIN POSITION
  function pinStyle(
    xPercent: number,
    yPercent: number
  ) {

    if (known) {

      const left =
        (xPercent / 100) *
        info.docWidth -
        info.scrollX;

      const top =
        (yPercent / 100) *
        info.docHeight -
        info.scrollY;

      if (left < -14) {
        return null;
      }

      if (
        left >
        info.viewWidth + 14
      ) {

        return null;
      }

      if (top < -14) {

        return null;
      }

      if (
        top >
        info.viewHeight + 14
      ) {

        return null;
      }

      return {
        left: "0px",
        top: "0px",

        transform:
          "translate(" +
          left +
          "px, " +
          top +
          "px) translate(-50%, -50%)"
      };
    }



    if (guessing == false) {
      return null;
    }

    return {
      left: xPercent + "%",
      top: yPercent + "%"

    };
  }



  // PLACE NEW PIN
  function onLayerClick(event: any) {
    const box =
      event.currentTarget
        .getBoundingClientRect();

    const clickX =
      event.clientX -
      box.left;

    const clickY =
      event.clientY -
      box.top;

    let x =
      (clickX / box.width) *
      100;
    let y =
      (clickY / box.height) *
      100;

    if (known) {
      x =
        ((clickX + info.scrollX) /
          info.docWidth) *
        100;
      y =
        ((clickY + info.scrollY) /
          info.docHeight) *
        100;
    }


    if (x < 0) {
      x = 0;
    }

    if (x > 100) {
      x = 100;
    }

    if (y < 0) {
      y = 0;
    }

    if (y > 100) {
      y = 100;
    }

    props.onPlace(
      x,
      y,
      currentPath
    );
  }

  // SCROLL WEBSITE
  function onLayerWheel(event: any) {
    const frame =
      frameRef.current;

    if (frame == null) {
      return;
    }

    if (
      frame.contentWindow == null
    ) {
      return;
    }


    try {
      frame.contentWindow.scrollBy(
        event.deltaX,
        event.deltaY
      );

    } catch {
      return;
    }
  }



  // PINS ON THIS PAGE
  let pins: any[] = [];

  for (const item of props.feedback) {
    let page =
      item.page_path;

    if (page == null) {
      page = "/";
    }

    if (page == "") {
      page = "/";
    }

    if (page == currentPath) {
      pins.push(item);
    }
  }

  // FEEDBACK LAYER
  let layer = null;

  if (props.placing) {
    layer = (
      <div
        className="feedback-layer"
        onClick={onLayerClick}
        onWheel={onLayerWheel}
      >

        <p className="feedback-help">
          Klik op de plek waar je
          feedback wilt geven
        </p>
      </div>
    );
  }

  // NEW PIN
  let newPinButton = null;

  if (props.newPin != null) {
    if (
      props.newPin.path ==
      currentPath
    ) {
      const style =
        pinStyle(
          props.newPin.x,
          props.newPin.y
        );


      if (style != null) {
        newPinButton = (
          <button
            className="feedback-pin new-pin"
            style={style}
            type="button"
          >
            +
          </button>
        );
      }
    }
  }



  // OLD PINS
  let pinButtons: any[] = [];

  for (const item of pins) {
    const style =
      pinStyle(
        item.x_percent,
        item.y_percent
      );


    if (style != null) {
      let className =
        "feedback-pin pin-" +
        item.status;

      if (
        item.id ==
        props.selectedId
      ) {

        className =
          className +
          " selected";
      }


      pinButtons.push(
        <button
          key={item.id}
          className={className}
          style={style}
          type="button"
          onClick={function () {
            props.onSelect(item);

          }}
        >
          {props.numberOf(item.id)}
        </button>

      );
    }
  }



  // SCREEN
  return (
    <div className="site-frame">

      <iframe
        ref={frameRef}
        src={src}
        title={props.title}
      />
      {layer}

      {newPinButton}
      {pinButtons}
    </div>
  );
}