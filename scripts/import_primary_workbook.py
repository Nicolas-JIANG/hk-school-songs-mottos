#!/usr/bin/env python3

from __future__ import annotations

import json
import re
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "data" / "HK primary school.xlsx"
JSON_PATH = ROOT / "data" / "schools.json"
JS_PATH = ROOT / "data" / "schools.js"

MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
DOC_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS = {"main": MAIN_NS, "rel": REL_NS}

LINK_HEADERS = {"學校官方網址", "校歌網址", "Youtube"}
TITLE_KEYS = ("校名", "School Name")


@dataclass(frozen=True)
class ColumnDef:
    index: int
    key: str
    label: str


def col_to_num(col_name: str) -> int:
    value = 0
    for ch in col_name:
        value = value * 26 + ord(ch) - 64
    return value


def parse_cell_ref(cell_ref: str) -> tuple[int, int]:
    match = re.fullmatch(r"([A-Z]+)(\d+)", cell_ref)
    if not match:
        raise ValueError(f"Unexpected cell reference: {cell_ref}")
    return col_to_num(match.group(1)), int(match.group(2))


def normalize_whitespace(value: str) -> str:
    text = str(value or "")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.strip() for line in text.split("\n")]
    text = "\n".join(line for line in lines if line)
    if text.upper() == "NA":
        return ""
    return text.strip()


def make_column_defs(raw_headers: Iterable[str]) -> list[ColumnDef]:
    counts = Counter(raw_headers)
    seen: Counter[str] = Counter()
    column_defs: list[ColumnDef] = []

    for index, label in enumerate(raw_headers, start=1):
        label = normalize_whitespace(label)
        seen[label] += 1
        if counts[label] > 1:
            key = f"{label}_{seen[label]}"
        else:
            key = label
        column_defs.append(ColumnDef(index=index, key=key, label=label))

    return column_defs


def get_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    shared_strings_path = "xl/sharedStrings.xml"
    if shared_strings_path not in archive.namelist():
        return []

    root = ET.fromstring(archive.read(shared_strings_path))
    strings: list[str] = []
    for item in root.findall("main:si", NS):
        text = "".join(node.text or "" for node in item.iter(f"{{{MAIN_NS}}}t"))
        strings.append(text)
    return strings


def get_cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")

    if cell_type == "inlineStr":
        inline = cell.find("main:is", NS)
        if inline is None:
            return ""
        return "".join(node.text or "" for node in inline.iter(f"{{{MAIN_NS}}}t"))

    value_node = cell.find("main:v", NS)
    if value_node is None:
        return ""

    raw_value = value_node.text or ""
    if cell_type == "s":
        return shared_strings[int(raw_value)]
    return raw_value


def get_sheet_path(archive: zipfile.ZipFile) -> tuple[str, str]:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    workbook_rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    rel_map = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in workbook_rels.findall(f"{{{REL_NS}}}Relationship")
    }

    first_sheet = workbook.find("main:sheets/main:sheet", NS)
    if first_sheet is None:
        raise RuntimeError("Workbook has no sheets.")

    sheet_name = first_sheet.attrib["name"]
    relationship_id = first_sheet.attrib[f"{{{DOC_REL_NS}}}id"]
    target = rel_map[relationship_id]
    return sheet_name, f"xl/{target}"


def get_hyperlinks(archive: zipfile.ZipFile, sheet_path: str) -> dict[str, str]:
    rels_path = sheet_path.replace("xl/", "xl/worksheets/_rels/") + ".rels"
    if rels_path not in archive.namelist():
        return {}

    rels_root = ET.fromstring(archive.read(rels_path))
    rel_map = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels_root.findall("rel:Relationship", NS)
    }

    sheet_root = ET.fromstring(archive.read(sheet_path))
    hyperlink_root = sheet_root.find("main:hyperlinks", NS)
    if hyperlink_root is None:
        return {}

    hyperlinks: dict[str, str] = {}
    for item in hyperlink_root.findall("main:hyperlink", NS):
        ref = item.attrib.get("ref")
        relationship_id = item.attrib.get(f"{{{DOC_REL_NS}}}id")
        if ref and relationship_id and relationship_id in rel_map:
            hyperlinks[ref] = rel_map[relationship_id]
    return hyperlinks


def iter_sheet_rows(archive: zipfile.ZipFile, sheet_path: str, shared_strings: list[str]) -> list[dict[int, dict[str, str]]]:
    sheet_root = ET.fromstring(archive.read(sheet_path))
    sheet_data = sheet_root.find("main:sheetData", NS)
    if sheet_data is None:
        raise RuntimeError("Worksheet has no sheetData node.")

    rows: list[dict[int, dict[str, str]]] = []
    for row in sheet_data.findall("main:row", NS):
        row_map: dict[int, dict[str, str]] = {}
        for cell in row.findall("main:c", NS):
            cell_ref = cell.attrib.get("r")
            if not cell_ref:
                continue
            col_index, row_number = parse_cell_ref(cell_ref)
            row_map[col_index] = {
                "ref": cell_ref,
                "row_number": str(row_number),
                "value": get_cell_value(cell, shared_strings),
            }
        rows.append(row_map)
    return rows


def normalize_record(
    row: dict[int, dict[str, str]],
    column_defs: list[ColumnDef],
    hyperlinks: dict[str, str],
    source_row: int,
) -> dict[str, object]:
    record: dict[str, object] = {
        "id": normalize_whitespace(row[column_defs[1].index]["value"]).lower(),
        "sourceRow": source_row,
    }

    for column in column_defs:
        cell = row.get(column.index, {"ref": "", "value": ""})
        value = cell["value"]
        hyperlink = hyperlinks.get(cell["ref"], "")

        if column.label in LINK_HEADERS and hyperlink:
            value = hyperlink

        normalized = normalize_whitespace(value)
        if column.label == "成立年份" and normalized.isdigit():
            record[column.key] = int(normalized)
        else:
            record[column.key] = normalized

    return record


def build_payload() -> dict[str, object]:
    with zipfile.ZipFile(SOURCE_PATH) as archive:
        sheet_name, sheet_path = get_sheet_path(archive)
        shared_strings = get_shared_strings(archive)
        hyperlinks = get_hyperlinks(archive, sheet_path)
        rows = iter_sheet_rows(archive, sheet_path, shared_strings)

    if not rows:
        raise RuntimeError("No rows found in workbook.")

    headers = [rows[0].get(index, {"value": ""})["value"] for index in range(1, max(rows[0]) + 1)]
    column_defs = make_column_defs(headers)

    records = [
        normalize_record(row, column_defs, hyperlinks, source_row=position)
        for position, row in enumerate(rows[1:], start=2)
    ]

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceFile": SOURCE_PATH.name,
        "sheetName": sheet_name,
        "fieldOrder": [column.key for column in column_defs],
        "fieldLabels": {column.key: column.label for column in column_defs},
        "records": records,
    }
    return payload


def write_outputs(payload: dict[str, object]) -> None:
    json_text = json.dumps(payload, ensure_ascii=False, indent=2)
    JSON_PATH.write_text(json_text + "\n", encoding="utf-8")

    js_text = "\n".join(
        [
            "window.SCHOOL_DATA = " + json_text + ";",
            "window.SCHOOL_FIELDS = window.SCHOOL_DATA.fieldOrder;",
            "window.SCHOOL_FIELD_LABELS = window.SCHOOL_DATA.fieldLabels;",
            "window.SCHOOLS = window.SCHOOL_DATA.records;",
            "",
        ]
    )
    JS_PATH.write_text(js_text, encoding="utf-8")


def main() -> None:
    payload = build_payload()
    write_outputs(payload)
    print(f"Imported {len(payload['records'])} records from {SOURCE_PATH.name}")
    print(f"Wrote {JSON_PATH.relative_to(ROOT)} and {JS_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
