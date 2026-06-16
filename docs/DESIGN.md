# InfraTrack — Design (UML)

The whole app is designed up front as **7 UML diagrams**, written in **PlantUML**. The canonical
source files live in [`design/`](design/). The diagrams depict the **final app** (with auth,
photo upload, and AI), even though earlier weeks only build parts of it.

## How to render / export
- **Online (no install):** open a `.puml` file, copy its contents into
  <https://www.planttext.com> or <http://www.plantuml.com/plantuml/uml/>, then export PNG/SVG.
- **VS Code:** install the *PlantUML* extension → open a `.puml` → `Alt+D` to preview → right-click to export.
- Save exports into [`design/img/`](design/img/) with the same base name so the previews below render.

## The 7 diagrams

| # | Diagram (FR) | Source | What it shows |
|---|---|---|---|
| 1 | Cas d'utilisation (use-case) | [use-case.puml](design/use-case.puml) | Actors (Citizen, Authority, Admin, Vision AI) + their actions; `<<include>>` ties Report Issue to photo / GPS / AI / attribution |
| 2 | Classes | [class.puml](design/class.puml) | The 6 entities + 4 enums, attributes, relationships, multiplicities |
| 3 | Séquence — report | [seq-report.puml](design/seq-report.puml) | Headline flow: photo → AI severity → geo-attribution → save |
| 4 | Séquence — login | [seq-login.puml](design/seq-login.puml) | JWT auth: verify password, sign token |
| 5 | Séquence — status change | [seq-status.puml](design/seq-status.puml) | Authority moves status; citizen reads the StatusEvent feed |
| 6 | Activité | [activity.puml](design/activity.puml) | Report-to-resolution across Citizen / System / Authority swimlanes |
| 7 | États-transitions | [state-issue.puml](design/state-issue.puml) | The `Issue.status` lifecycle (REPORTED → … → RESOLVED / REJECTED) |

## Previews
*(empty until you export PNGs into `design/img/`)*

![Use case](design/img/use-case.png)
![Class](design/img/class.png)
![Sequence – report](design/img/seq-report.png)
![Sequence – login](design/img/seq-login.png)
![Sequence – status](design/img/seq-status.png)
![Activity](design/img/activity.png)
![State](design/img/state-issue.png)
