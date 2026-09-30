import { auditEconomy } from '../src/audits/economyAudit.ts';
const report=auditEconomy(10000);console.log(JSON.stringify(report,null,2));process.exitCode=report.ok?0:1;
