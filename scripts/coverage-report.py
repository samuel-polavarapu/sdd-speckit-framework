#!/usr/bin/env python3
"""Writes a Markdown coverage report from a coverage XML file, and gates on a threshold.

  coverage-report.py --xml coverage.xml --out specs/001-x/coverage-report.md \\
      [--feature 001-x] [--command "pytest --cov"] [--tests "42 passed"] [--threshold 80]

Reads Cobertura XML (coverage.py, istanbul, coverlet) and JaCoCo XML (Java, Kotlin).
--threshold defaults to harness.coverageThreshold in .specify/sdd-speckit.json when the project
has one. Exit codes: 0 written and at or above the threshold; 1 written and below it; 2 the XML
could not be read. The report states only what the XML holds. Nobody writes it by hand.
"""
import argparse
import datetime
import json
import os
import sys
import xml.etree.ElementTree as ET

sys.dont_write_bytecode = True
CONFIG = ".specify/sdd-speckit.json"


def cobertura(root):
    """-> {file: {"lines": {number: hit?}, "branches": [covered, total]}}"""
    files = {}
    for cls in root.iter("class"):
        entry = files.setdefault(cls.get("filename") or "?", {"lines": {}, "branches": {}})
        for line in cls.iter("line"):
            try:
                number = int(line.get("number", "0"))
                hit = int(float(line.get("hits", "0"))) > 0
            except ValueError:
                continue
            # A line can appear under <methods> and again under <lines>. Count it once.
            entry["lines"][number] = entry["lines"].get(number, False) or hit
            cond = line.get("condition-coverage") or ""
            if line.get("branch") == "true" and "(" in cond and "/" in cond:
                try:
                    done, total = cond[cond.index("(") + 1:cond.index(")")].split("/")
                    entry["branches"][number] = (int(done), int(total))
                except ValueError:
                    pass
    return files


def jacoco(root):
    files = {}
    for package in root.iter("package"):
        for source in package.iter("sourcefile"):
            name = ("%s/%s" % (package.get("name") or "", source.get("name") or "?")).lstrip("/")
            entry = files.setdefault(name, {"lines": {}, "branches": {}})
            for line in source.iter("line"):
                try:
                    nr, mi, ci = int(line.get("nr", "0")), int(line.get("mi", "0")), int(line.get("ci", "0"))
                    mb, cb = int(line.get("mb", "0")), int(line.get("cb", "0"))
                except ValueError:
                    continue
                if mi + ci > 0:
                    entry["lines"][nr] = ci > 0
                if mb + cb > 0:
                    entry["branches"][nr] = (cb, mb + cb)
    return files


def parse(path):
    root = ET.parse(path).getroot()
    tag = root.tag.split("}")[-1]
    if tag == "coverage":
        return cobertura(root)
    if tag == "report":
        return jacoco(root)
    raise ValueError("%s is neither Cobertura nor JaCoCo XML (root element <%s>)" % (path, tag))


def ranges(numbers):
    out, run = [], []
    for n in sorted(numbers):
        if run and n == run[-1] + 1:
            run.append(n)
        else:
            if run:
                out.append(run)
            run = [n]
    if run:
        out.append(run)
    return ", ".join(str(r[0]) if len(r) == 1 else "%d-%d" % (r[0], r[-1]) for r in out)


def rate(done, total):
    return None if total == 0 else 100.0 * done / total


def pct(value):
    return "n/a" if value is None else "%.1f%%" % value


def summarise(files):
    rows = []
    for name, entry in files.items():
        lines = entry["lines"]
        covered = sum(1 for hit in lines.values() if hit)
        bdone = sum(b[0] for b in entry["branches"].values())
        btotal = sum(b[1] for b in entry["branches"].values())
        rows.append({"name": name, "covered": covered, "lines": len(lines), "bdone": bdone, "btotal": btotal,
                     "missing": [n for n, hit in lines.items() if not hit]})
    rows.sort(key=lambda r: (rate(r["covered"], r["lines"]) if r["lines"] else 100.0, r["name"]))
    return rows


def render(rows, feature, command, tests, threshold, xml_name, today):
    covered, total = sum(r["covered"] for r in rows), sum(r["lines"] for r in rows)
    bdone, btotal = sum(r["bdone"] for r in rows), sum(r["btotal"] for r in rows)
    line_rate = rate(covered, total)
    out = ["# Coverage report: %s" % feature, "",
           "Generated on %s from `%s` by `coverage-report.py`. Do not edit by hand: run the tests and" % (today, xml_name),
           "generate it again.", "",
           "- **Command:** %s" % ("`%s`" % command if command else "Not recorded"),
           "- **Tests:** %s" % (tests or "Not recorded"), ""]
    if threshold is not None:
        if line_rate is None:
            out += ["**Gate:** FAIL. The XML holds no measurable line, so the %g%% threshold is not met." % threshold, ""]
        else:
            out += ["**Gate:** %s. Line coverage is %s; the threshold is %g%%." % (
                "PASS" if line_rate >= threshold else "FAIL", pct(line_rate), threshold), ""]
    out += ["## Summary", "", "| Metric | Covered | Total | Rate |", "|---|---:|---:|---:|",
            "| Lines | %d | %d | %s |" % (covered, total, pct(line_rate)),
            "| Branches | %d | %d | %s |" % (bdone, btotal, pct(rate(bdone, btotal))), "",
            "## Files, lowest coverage first", "",
            "| File | Lines | Rate | Branches | Uncovered lines |", "|---|---:|---:|---:|---|"]
    for r in rows:
        out.append("| `%s` | %d/%d | %s | %s | %s |" % (
            r["name"], r["covered"], r["lines"], pct(rate(r["covered"], r["lines"])),
            "%d/%d" % (r["bdone"], r["btotal"]) if r["btotal"] else "-", ranges(r["missing"]) or "-"))
    out += ["", "Each uncovered line needs a test or a written reason. The report does not say a line is unreachable.", ""]
    return "\n".join(out), line_rate


def recorded_threshold():
    try:
        with open(CONFIG, encoding="utf-8") as fh:
            value = (json.load(fh).get("harness") or {}).get("coverageThreshold")
        return float(value) if isinstance(value, (int, float)) else None
    except (OSError, ValueError):
        return None


def main(argv=None):
    ap = argparse.ArgumentParser(description="Markdown coverage report from Cobertura or JaCoCo XML.")
    ap.add_argument("--xml", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--feature", default="feature")
    ap.add_argument("--command", default="", help="the command that produced the XML, recorded as given")
    ap.add_argument("--tests", default="", help="the test result line, recorded as given")
    ap.add_argument("--threshold", type=float, help="minimum line coverage in percent")
    args = ap.parse_args(argv)
    threshold = args.threshold if args.threshold is not None else recorded_threshold()
    try:
        rows = summarise(parse(args.xml))
    except (OSError, ET.ParseError, ValueError) as err:
        print("coverage-report: %s" % err, file=sys.stderr)
        return 2
    text, line_rate = render(rows, args.feature, args.command, args.tests, threshold, os.path.basename(args.xml),
                             datetime.date.today().isoformat())
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)
    print("Wrote %s: lines %s%s" % (args.out, pct(line_rate), "" if threshold is None else " (threshold %g%%)" % threshold))
    return 1 if threshold is not None and (line_rate is None or line_rate < threshold) else 0


if __name__ == "__main__":
    sys.exit(main())
