const REQUEST_TYPE_LABELS = {
  custom_commission: "Custom art commission(s)",
  existing_license: "Existing art license(s)",
  custom_track: "Custom track(s) / cue(s)",
  catalog_track: "Cleared catalog track(s)",
  mastering: "Mixing / mastering only",
  retainer: "Monthly retainer",
  bundle: "Art + music bundle(s)",
};

const LANE_LABELS = {
  art: "Art",
  music: "Music",
  both: "Art + Music",
};

const stored = sessionStorage.getItem("nja_work_request");
const summaryOutput = document.getElementById("summary-output");
const intro = document.getElementById("intro");

if (!stored) {
  if (intro) {
    intro.textContent =
      "No submission found. Use the work request form to start.";
  }
} else {
  const payload = JSON.parse(stored);
  const raw = payload.raw || {};

  if (intro) {
    if (payload._email_sent) {
      intro.textContent =
        "Thanks — your work request was sent to Ninja Jo Artworks. We’ll review your details and confirm scope with the creator before issuing a firm quote or agreement.";
    } else if (payload._email_skipped) {
      intro.textContent =
        "Thanks — your request was recorded. If you do not hear from us within two business days, email ninjajoartworks@gmail.com with your project details.";
    } else {
      intro.textContent =
        "Thanks — we saved your request, but the email could not be sent. Please also email ninjajoartworks@gmail.com so we can follow up promptly.";
    }
  }

  const summary = buildClientSummary(raw);
  const block = document.createElement("div");
  block.className = "confirm-block";
  block.innerHTML = "<h3>Your submission</h3>";

  const grid = document.createElement("div");
  grid.className = "mapping-grid";

  for (const [label, value] of summary) {
    const row = document.createElement("div");
    row.className = "mapping-row";
    row.innerHTML = `<div class="mapping-label">${label}</div><div class="mapping-value">${escapeHtml(String(value || "—"))}</div>`;
    grid.appendChild(row);
  }

  block.appendChild(grid);
  summaryOutput?.appendChild(block);

  const submitted = document.getElementById("submitted-at");
  if (submitted && raw._submitted_at) {
    submitted.textContent = formatSubmittedAt(raw._submitted_at);
  }
}

function buildClientSummary(raw) {
  const summary = [
    ["Name", raw.legal_name + (raw.entity_name ? ` · ${raw.entity_name}` : "")],
    ["Email", raw.email],
    ["Creative lane", LANE_LABELS[raw.lane] || raw.lane],
    [
      "Request type",
      REQUEST_TYPE_LABELS[raw.request_type] ||
        raw.request_type?.replace(/_/g, " "),
    ],
    ["Target delivery", raw.target_deadline],
  ];

  if (raw.project_title?.trim()) {
    summary.push(["Project", raw.project_title.trim()]);
  }

  if (raw.lane === "art" || raw.lane === "both") {
    if (raw.deliverable_description?.trim()) {
      summary.push(["Art scope", raw.deliverable_description.trim()]);
    }
  }

  if (raw.lane === "music" || raw.lane === "both") {
    if (raw.track_need_description?.trim()) {
      summary.push(["Music scope", raw.track_need_description.trim()]);
    }
  }

  return summary;
}

function formatSubmittedAt(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}