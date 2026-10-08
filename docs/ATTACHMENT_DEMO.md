# School demonstration and evidence guide

Use this as a demonstration outline and an evidence checklist. It is not a completed attachment report. Fill in only work and observations that actually took place.

## A 7–10 minute demonstration

1. **Problem and scope:** explain the current support workflow observed at NKPCU and the specific gap agreed with ICT. State what this prototype covers and whether it was piloted.
2. **Staff view:** sign in as `staff`, submit a fault linked to an asset, and open its tracking page.
3. **ICT view:** sign out and sign in as `technician`. Assign the new request, mark it in progress, add a discussion note, and record a resolution.
4. **Confirmation:** sign back in as the requester and confirm that the issue is fixed. Show that closure is a requester action.
5. **Equipment history:** sign in as `supervisor`, open the linked asset, and show the repair events and QR label. Explain that phones require a reachable app URL.
6. **Preventive work:** schedule maintenance, then complete it with findings. Show the preserved record.
7. **Knowledge and reporting:** open a guide, explain publication review, show dashboard totals, and download a CSV.
8. **Engineering evidence:** show the database relationships, permissions, automated tests, and one change made after real user feedback.
9. **Evaluation and handover:** present the actual pilot results, known limitations, and who would maintain the tool.

## Evidence to collect during the attachment

| Evidence | What to retain |
| --- | --- |
| Requirements | Meeting notes, approved scope, existing-system overlap checks |
| Design | Workflow, data model, role decisions, interface iterations |
| Development | Git commits, issues fixed, implementation explanations |
| Testing | Test results and observed user task outcomes |
| Pilot | Dates, users/tasks sampled, baseline and pilot measurements |
| Feedback | Anonymised comments and the changes they caused |
| Handover | Setup guide, user guide, maintenance responsibilities |

Use fictional or anonymised screenshots for school. Do not present demo numbers as actual departmental performance.

## Suggested logbook entry structure

- Date and task performed.
- Workplace need or requirement addressed.
- Technical approach and why it was selected.
- Challenge encountered and how it was resolved.
- Verification performed and result.
- Feedback received and next action.

## Technical topics you can explain

Session authentication and CSRF; access control by role and requester; relational databases; migrations; transactions; model validation; responsive React interfaces; CSV exports; QR linking; automated workflow tests; deployment boundaries; and user evaluation. Explain only the parts you understand and worked on.
