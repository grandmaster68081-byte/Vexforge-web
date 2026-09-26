import type { ReactNode } from 'react';
export function StatCard({label,value,hint,icon,tone='cyan'}:{label:string;value:string;hint?:string;icon:ReactNode;tone?:'cyan'|'violet'|'green'|'amber'}){
 return <article className={`stat-card tone-${tone}`}><div className="stat-icon">{icon}</div><div className="stat-copy"><small>{label}</small><strong>{value}</strong>{hint&&<span>{hint}</span>}</div></article>;
}
