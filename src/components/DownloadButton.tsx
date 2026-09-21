import { ReactNode } from "react";

export function DownloadButton({ href, children, secondary = false }: { href: string | null; children: ReactNode; secondary?: boolean }) {
  if (!href) {
    return <span className={`downloadButton ${secondary ? "downloadButton--secondary" : ""} is-disabled`} aria-disabled="true">{children}<small>Próximamente</small></span>;
  }
  return <a className={`downloadButton ${secondary ? "downloadButton--secondary" : ""}`} href={href} target="_blank" rel="noreferrer">{children}</a>;
}
