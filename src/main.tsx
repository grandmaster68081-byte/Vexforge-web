import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PortalShell } from "./components/PortalShell";
import { Home } from "./pages/Home";
import { Game } from "./pages/Game";
import { Cards } from "./pages/Cards";
import { World } from "./pages/World";
import { News } from "./pages/News";
import { Media } from "./pages/Media";
import { Download } from "./pages/Download";
import { Support } from "./pages/Support";
import { Legal } from "./pages/Legal";
import { NotFound } from "./pages/NotFound";
import "./styles/portal.css";

function App() {
  return (
    <BrowserRouter>
      <PortalShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/world" element={<World />} />
          <Route path="/news" element={<News />} />
          <Route path="/media" element={<Media />} />
          <Route path="/download" element={<Download />} />
          <Route path="/download/android" element={<Download />} />
          <Route path="/support" element={<Support />} />
          <Route path="/privacy" element={<Legal kind="privacy" />} />
          <Route path="/terms" element={<Legal kind="terms" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PortalShell>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
