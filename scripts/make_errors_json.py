"""Build src/data/errors.json for the site from the error log's errors.csv plus a plain-words line per row.
Dates, days, stage, era, finder and reach are copied from the CSV by code, never by hand."""
import csv, json, sys

SRC, OUT = sys.argv[1], sys.argv[2]

TEXT = {
 "E001": "A price feed's signal had no age check, so a stale signal could be used. An adversarial review agent found it, beyond its brief.",
 "E003": "One cell of a price replay looked strong. Pre-registered robustness checks (a shifted clock, a calendar split) refused it in the same build.",
 "E004": "An agent challenged a closed verdict by mixing up the smallest effect a test can detect with its interval. Recomputing from the committed table rejected the challenge.",
 "E005": "An idea was labelled established on the premise that new listings had no quotes. The next research loop found that almost all already had them.",
 "E006": "A replay's large gain came from look-ahead. A decomposition rule flagged it in the same commit.",
 "E007": "A positive secondary cell did not replicate when it was tested as the pre-registered primary on a set of related markets.",
 "E008": "A result chosen on the same data failed its frozen holdout. The claim then stayed in the project's main notes for a month after the failure was recorded.",
 "E009": "A candidate from a first look was closed by its registered second look. A weak row: a test doing its job, not an agent mistake.",
 "E010": "A comparison script had a logic bug. An independent review marked it a blocker.",
 "E011": "A draft public thread made two false claims, one about how long the work had run. A reader agent flagged that one the day it appeared; a trace of each claim to its file and line corrected both.",
 "E012": "An audit program gave the wrong reason flag on a look-ahead case. The independent checker's first run caught it.",
 "E013": "A draft said the audit's rulebook was time-stamped on a blockchain. On that date it was only frozen in git and pushed. A copy-draft agent caught the orchestrator's error.",
 "E014": "An eval rubric asked for a cause the task gave no way to find. Blind grading of the rerun showed it.",
 "E015": "A commit deleted 226 lines of safety code. A halt during a paper-mode soak test led to the investigation that found it; the stripped code never ran.",
 "E016": "The paper trader filled every order at once at its limit price and charged no fees. I noticed a balance gap in a live run and stopped the bot. A collaborator, not an agent, wrote the instant fills; the agents kept the model for two months.",
 "E017": "A new bot's scanner used the settlement time as the order deadline, so none of its live orders filled.",
 "E018": "A price filter fell back to a stale setting and silently rejected markets in a live bot.",
 "E019": "A bot went live on a signal that did not match its backtest. An ad hoc check found it, and that check became a launch rule.",
 "E020": "Six code pushes caused six restarts during a live run. I asked for every fix in one batch.",
 "E021": "The notes held a wrong rule about when trading closes before settlement. A later sprint found it while reproducing the settlement rule, which matched every case.",
 "E022": "A figure in the notes was cited to a document that does not contain it. A sweep that re-derived cited numbers found it.",
 "E023": "A backtest had look-ahead, and a bot had gone live on it. A re-analysis found it. The source lists it twice; it is counted once.",
 "E024": "An agent diagnosed a stuck bot without tracing the code. I made it trace the code mechanically; that found the real cause, about an hour in.",
 "E025": "An incident report overstated how much of the logs it covered. I challenged the report as vague, and the agent disclosed the overstatement.",
 "E026": "A new background loop was not stubbed in the tests, so CI hung on every pull request until a fix 14 days later.",
 "E027": "A stale headline figure stayed in the notes. Rerunning the canonical report found it.",
 "E028": "The notes said no events reached a price band. Re-deriving from the raw file showed that some did.",
 "E029": "An agent re-ran a test that an earlier verdict had already closed, without checking the notes first. I caught it. It cost about 39 minutes and 144k tokens.",
 "E030": "A web research agent's stale report of a product launch was relayed to me as news. The sources do not say who noticed.",
 "E031": "A per-trade figure was quoted from a scan that had not finished. A quant review's question led to a reread of the full scan.",
 "E032": "A reported match rate was a floating-point artifact, and a results table could not be reproduced. An adversarial review caught both.",
 "E033": "Two agents gave two numbers for one measure, 99.09% and 93.91%, one of them from a filter nobody declared. Result tables with declared filters caught it.",
 "E034": "A replay measured the bot's own resting order instead of the market, so its result was an artifact. An adversarial review led to its withdrawal the same day.",
 "E035": "A safety-check skill looked for code names that never existed in the code. A prompt audit found it.",
 "E036": "A script kept the label 'canonical, look-ahead fixed' after a second look-ahead was found in it. A sweep found the stale label.",
 "E037": "The notes miscounted how many liquid series existed. A census found more, and several of them listed nothing.",
 "E038": "A file pattern picked a metadata file as the data file. A sweep of every such pattern found it.",
 "E039": "A cost was ported from another market instead of measured. Measuring each market's own depth showed the port was wrong.",
 "E040": "A results file that must never change was edited by hand after it was built. An audit re-run found it.",
 "E041": "A data pull rewrote a raw file in place when it resumed. The same audit re-run found it.",
 "E042": "Five result tables were built from inputs kept in a temporary session folder, so they cannot be rebuilt.",
 "E043": "Some verify steps wrote the file before comparing, and others compared nothing, while the notes said every check matched byte for byte.",
 "E044": "A fill test used a five-minute window and called markets too small. The lead withdrew the rule and reran with a 24-hour window.",
 "E045": "withheld",
 "E046": "The notes cited a table row that did not exist. A data review found it; a citation checker came after.",
 "E047": "withheld",
 "E048": "The notes contradicted the code, and a skill cited sources that did not exist. A prompt audit with 155 findings; several defects in one row, with no single start date.",
 "E049": "Figures copied by hand into the notes did not match their table. A data review found them.",
 "E050": "The notes kept saying a script had a hard-coded value after a fix the same day had removed it.",
 "E051": "A push carried four commits from another session along with its own. The pushing session listed them and told me. Private repo only.",
 "E052": "A missed recording lost rows from a paper ledger.",
 "E053": "A scheduled dry run did not start.",
 "E054": "withheld",
 "E055": "A move list overstated how a holdout failed: the point estimate came out ahead, and only the lower bound fell short. A claims review caught it.",
}

# Withheld until the owner rules on them (review B2, DECISIONS 108): they come from work that is not public yet.
# They stay in every count; their TEXT line is the single word "withheld".

rows = []
with open(SRC, newline="") as f:
    for r in csv.DictReader(f):
        if r["counted_in_totals"] != "yes":
            continue
        rows.append({
            "id": r["id"],
            "stage": r["stage_caught"],
            "era": r["era"],
            "in": None if r["date_in"] == "unknown" else r["date_in"],
            "found": r["date_found"],
            "days": int(r["days_alive"]) if r["days_alive"] else None,
            "by": r["found_by"],
            "reach": r["reach"],
            "text": TEXT[r["id"]],
        })
missing = set(TEXT) - {r["id"] for r in rows}
assert not missing, missing
assert len(rows) == 54, len(rows)
json.dump({"rows": rows}, open(OUT, "w"), indent=1, ensure_ascii=False)
open(OUT, "a").write("\n")
print("rows", len(rows))
