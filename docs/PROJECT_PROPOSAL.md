# Project proposal: NKPCU ICT Service Desk

## Proposed problem

ICT support may arrive through several channels, making it difficult to track outstanding work, review repeated equipment faults, and preserve troubleshooting knowledge. This is a hypothesis to validate with the department, not a confirmed claim about NKPCU.

## Objective

Develop and evaluate an internal platform that gives staff a clear support workflow and gives ICT a shared view of requests, device histories, maintenance, and reviewed guides.

## Intended users

Staff report and follow their own problems. Technicians handle the work queue, equipment, and maintenance. Supervisors review the service picture and publish troubleshooting guidance.

## MVP scope

Request submission → triage and assignment → progress updates → documented resolution → requester confirmation. Reopen if the problem persists. Equipment and maintenance records link to the support history. Aggregate counts and CSV exports provide a reviewable operational record.

## Success measures to agree before a pilot

| Measure | Baseline | Pilot observation |
| --- | --- | --- |
| Time to log and retrieve a support request | Measure current process | Measure the same task in the app |
| Requests with a recorded owner and status | Sample current records | Sample pilot records |
| Completed requests with documented resolution | Sample current records | Sample pilot records |
| Staff ability to submit and follow a request | Observe current process | Observe representative users |
| Equipment records with traceable repair history | Inspect existing records | Inspect pilot assets |

Do not set an arbitrary improvement claim before measuring the baseline. Report the sample size, time window, and limitations.

## Suggested milestones

1. Confirm the workflow, existing ERP overlap, users, and boundaries with the supervisor.
2. Evaluate this local MVP with fictional data and revise requirements.
3. Agree role permissions, target times, device fields, and guide review ownership.
4. Run a small approved pilot with a separate database.
5. Evaluate actual user feedback, fix issues, and prepare handover and school evidence.

## Constraints

No dependency on production ERP access for the first version. Real integrations depend on supported interfaces and the company's decisions. Keep the project maintainable and hand over source, setup instructions, and limitations. The prototype must not be presented as an officially adopted service without departmental adoption.
