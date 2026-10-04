# Subject-area courses

The Academy has 18 original courses and 111 standalone subject-area courses, giving 129 courses and 1,290 project recipes. The subject-area courses cover computing, finance, business, law and society, hospitality, education, wellbeing, beauty, fashion and art, traditional studies, safety, technical trades, agriculture and home science.

## How they were chosen

A public vocational-training catalogue of 286 programme listings was reviewed. Near-duplicate variants of the same subject (for example a diploma and an advanced diploma, or a certificate and a diploma, in the same field) were merged. Each merged group became one Academy course, so 286 listings produced 111 courses. The titles of the merged listings are stored on each course as `aliases` and are used only by catalogue search.

## What is original

Nothing is copied from the source catalogue. The alignment record in `content/source/iisdt-syllabi.json` holds only the subject area, programme code, duration, eligibility and the six module headings of the listing that the course follows, plus the listing titles and addresses that were merged into it. Every summary, module title, principle, task, criterion and worked example was written for the Academy.

Each course has five modules and ten projects. Every project uses fictional cases or practice data, states three checks, and ends with a worked example. Calculations in worked examples were checked.

## Scope and safety

Courses in safety, trades, wellbeing, beauty, traditional studies, finance and law carry a `notice` that is shown on the course page. It states that the course teaches planning and theory with fictional cases, that hands-on work needs supervised training, and that nothing replaces medical, legal, financial or mental health advice. Traditional-studies courses are written as cultural and symbolic traditions and make no predictive or therapeutic claims. Independent subject review is still required before any assessed credential is issued.

## Access and pricing

Subject-area courses are paid courses with no mapped professional programme (`legacyProgrammeIds` is empty and `legacy` is null). Access follows the same entitlement rules as other paid courses. No price is recorded in the repository. The owner creates offers in the administration area, where the offer limit is now 200.

## Source files and rebuilding

| File | Purpose |
|---|---|
| `content/source/iisdt-catalogue.json` | The reviewed listing titles and addresses |
| `content/source/clusters.py` | Which listings merge into which course, with category |
| `content/iisdt/*.py` | Authored course content, grouped by subject |
| `content/iisdt/validate.py` | Structure checks (ten rows, three criteria, fictional wording, example length, tools) |
| `content/iisdt/adapter.py` | Converts the authored files into atlas inputs, notices and aliases |
| `content/source/iisdt-syllabi.json` | Alignment record, written by `build_atlas.py` |

Run `python3 content/iisdt/validate.py --all` to check the content and `npm run curriculum` to rebuild `content/atlas.json`, `dist/catalogue.json`, `dist/preview-data.js` and `docs/CURRICULUM_MAP.md`.

## Row format

Each project is one line: `title|principle|task|criterion;criterion;criterion|worked example`. An optional sixth field names a built-in practice tool for that project. Projects run in order from Beginner to Expert practice, two per module, and the tenth project is the capstone.
