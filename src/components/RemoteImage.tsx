import { useState } from "react";

export function RemoteImage({ src, alt, className = "", position = "center", eager = false }: { src: string; alt: string; className?: string; position?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <div className={`remoteImage ${failed ? "remoteImage--failed" : ""} ${className}`}>
    {!failed && <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" fetchPriority={eager ? "high" : "auto"} style={{ objectPosition: position }} onError={() => setFailed(true)} />}
    {failed && <span aria-hidden="true">VEXFORGE</span>}
  </div>;
}
