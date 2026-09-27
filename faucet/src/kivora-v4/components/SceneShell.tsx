import type { ReactNode } from "react";

export type KivoraSceneId = "deck" | "field" | "vault" | "chronicle" | "settlement";

export function SceneShell({
  scene,
  eyebrow,
  title,
  accent = "cyan",
  background,
  children,
}: {
  scene: KivoraSceneId;
  eyebrow: string;
  title: ReactNode;
  accent?: "cyan" | "lime" | "violet" | "gold";
  background?: string;
  children: ReactNode;
}) {
  return (
    <section className={`kivora-v4-scene kivora-v4-scene-${scene}`} data-accent={accent}>
      {background ? <div className="kivora-v4-scene-art" style={{ backgroundImage: `url(${background})` }} /> : null}
      <div className="kivora-v4-scene-shade" />
      <div className="kivora-v4-scene-content">
        <div className={`kivora-v4-eyebrow accent-${accent}`}>{eyebrow}</div>
        <h1>{title}</h1>
        {children}
      </div>
    </section>
  );
}
