import { auditBattle } from '../src/audits/battleAudit.ts';
const report=auditBattle(2500);console.log(JSON.stringify(report,null,2));process.exitCode=report.ok?0:1;
