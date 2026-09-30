import { auditEconomyPolicy } from '../src/audits/economyPolicyAudit.ts';
const report=auditEconomyPolicy();
console.log(JSON.stringify(report,null,2));
process.exitCode=report.ok?0:1;
