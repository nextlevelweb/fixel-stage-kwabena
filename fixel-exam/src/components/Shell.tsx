import Nav from "./Nav";

// This component is the frame around a page: the top bar and the grey content area.
// "props.children" is the page that we put inside it.
// (In Laravel this is like a layout with @yield.)
export default function Shell(props: any) {
  return (
    <div className="app">
      <Nav />

      {/* Here is the grey area where the content of the page comes */}
      <main className="content">
        <div className="content-inner">
          {props.children}
        </div>
      </main>
    </div>
  );
}
