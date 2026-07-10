const form = document.getElementById("work-request-form");
const laneSelect = document.getElementById("lane");
const requestTypeSelect = document.getElementById("request_type");
const requestTypeHint = document.getElementById("request-type-hint");

const artSection = document.getElementById("art-section");
const musicSection = document.getElementById("music-section");
const artTermsSection = document.getElementById("art-terms-section");
const musicTermsSection = document.getElementById("music-terms-section");

const REQUEST_TYPES_BY_LANE = {
  art: [
    { value: "custom_commission", label: "Custom art commission(s)" },
    { value: "existing_license", label: "Existing art license(s) (one project each)" },
    { value: "retainer", label: "Monthly art retainer" },
  ],
  music: [
    { value: "custom_track", label: "Custom track(s) / cue(s)" },
    { value: "catalog_track", label: "Cleared catalog track(s)" },
    { value: "mastering", label: "Mixing / mastering only" },
    { value: "retainer", label: "Monthly music retainer" },
  ],
  both: [
    { value: "bundle", label: "Art + music bundle(s) (custom)" },
    { value: "custom_commission", label: "Custom art commission(s)" },
    { value: "custom_track", label: "Custom track(s) / cue(s)" },
    { value: "existing_license", label: "Existing art license(s) (one project each)" },
    { value: "catalog_track", label: "Cleared catalog track(s)" },
    { value: "retainer", label: "Monthly retainer (multi-lane)" },
  ],
};

const LANE_HINTS = {
  art: "Art lane — commissions, existing-piece licenses, and retainers for Ninja Jo.",
  music: "Music lane — custom cues, catalog licensing, mastering, and retainers for roster producers.",
  both: "Both lanes — bundle or separate art and music scopes in one request.",
};

function showLaneSections() {
  const lane = laneSelect.value;
  const showArt = lane === "art" || lane === "both";
  const showMusic = lane === "music" || lane === "both";

  artSection.classList.toggle("visible", showArt);
  musicSection.classList.toggle("visible", showMusic);
  artTermsSection?.classList.toggle("visible", showArt);
  musicTermsSection?.classList.toggle("visible", showMusic);
}

function rebuildRequestTypeOptions() {
  const lane = laneSelect.value;
  const previous = requestTypeSelect.value;
  const allowed = REQUEST_TYPES_BY_LANE[lane] || [];

  requestTypeSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = lane ? "Select…" : "Select creative lane first…";
  requestTypeSelect.appendChild(placeholder);

  for (const opt of allowed) {
    const el = document.createElement("option");
    el.value = opt.value;
    el.textContent = opt.label;
    requestTypeSelect.appendChild(el);
  }

  if (allowed.some((o) => o.value === previous)) {
    requestTypeSelect.value = previous;
  }

  requestTypeSelect.disabled = !lane;
  if (requestTypeHint) {
    requestTypeHint.textContent = lane
      ? LANE_HINTS[lane]
      : "Pick Art, Music, or Both — request types update to match.";
  }

  toggleConditionalFields();
}

function toggleConditionalFields() {
  const lane = laneSelect.value;
  const type = requestTypeSelect.value;

  const existing = document.getElementById("existing-art-field");
  if (existing) {
    existing.classList.toggle(
      "visible",
      type === "existing_license" && (lane === "art" || lane === "both")
    );
  }

  const catalog = document.getElementById("catalog-track-field");
  if (catalog) {
    catalog.classList.toggle(
      "visible",
      type === "catalog_track" && (lane === "music" || lane === "both")
    );
  }
}

laneSelect?.addEventListener("change", () => {
  showLaneSections();
  rebuildRequestTypeOptions();
});

requestTypeSelect?.addEventListener("change", toggleConditionalFields);

showLaneSections();
rebuildRequestTypeOptions();

function collectFormData() {
  const data = new FormData(form);
  const obj = {};
  for (const [key, value] of data.entries()) {
    if (obj[key] !== undefined) {
      if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
      obj[key].push(value);
    } else {
      obj[key] = value;
    }
  }
  obj._submitted_at = new Date().toISOString();
  return obj;
}

function mapToAgreementFields(data) {
  const address = [
    data.address_line1,
    data.address_line2,
    [data.city, data.state, data.postal_code].filter(Boolean).join(", "),
    data.country,
  ]
    .filter(Boolean)
    .join("\n");

  const requestLabels = {
    custom_commission: "Custom art commission(s)",
    existing_license: "Existing art license(s)",
    custom_track: "Custom track(s) / cue(s)",
    catalog_track: "Cleared catalog track(s)",
    mastering: "Mixing / mastering only",
    retainer: "Monthly retainer",
    bundle: "Art + music bundle(s)",
  };

  const mapping = {
    "Agreement party": data.legal_name + (data.entity_name ? ` (${data.entity_name})` : ""),
    "Client address": address,
    "Contact email": data.email,
    "Signatory": `${data.signatory_name} — ${data.signatory_title}`,
    Lane: data.lane?.toUpperCase(),
    "Request type": requestLabels[data.request_type] || data.request_type?.replace(/_/g, " "),
    "ContracTracker status": "Lead",
  };

  if (data.lane === "art" || data.lane === "both") {
    Object.assign(mapping, {
      "Art — Description": data.deliverable_description,
      "Art — Dimensions / format": data.dimensions_format,
      "Art — Usage type": data.usage_type,
      "Art — Usage details": data.usage_details,
      "Art — Style / references": data.style_references,
      "Art — Complexity notes": data.complexity_notes,
      "Art — Existing piece (license)": data.existing_art_piece || "—",
      "Commission Fee (quote TBD)": data.budget_range || "To be quoted",
      "Target delivery": data.target_deadline,
    });
  }

  if (data.lane === "music" || data.lane === "both") {
    Object.assign(mapping, {
      "Track / need": data.track_need_description,
      "Duration / edit": data.duration_edit,
      "Delivery format": data.delivery_format,
      "Project title": data.project_title,
      "Media type": data.media_type,
      Territory: data.territory,
      Term: data.term,
      Distribution: data.distribution,
      Exclusivity: data.exclusivity,
      "Catalog track": data.catalog_track_name || "—",
      "License Fee (quote TBD)": data.budget_range || "To be quoted",
    });
  }

  Object.assign(mapping, {
    "Rush requested": data.rush_needed === "yes" ? "Yes" : "No",
    "PO / NTE cap": data.po_nte_cap || "—",
    "Client has own contract": data.has_client_contract === "yes" ? "Yes — forward to Kevin" : "No",
    "Additional notes": data.additional_notes || "—",
  });

  return mapping;
}

function formatSubmissionEmail(payload) {
  const lines = ["NINJA JO ARTWORKS — WORK REQUEST", ""];
  for (const [label, value] of Object.entries(payload.agreement_mapping)) {
    lines.push(`${label}: ${value || "—"}`);
  }
  lines.push("", "--- Raw JSON ---", JSON.stringify(payload.raw, null, 2));
  return lines.join("\n");
}

async function submitToInbox(payload) {
  const key = window.NJA_FORM_CONFIG?.web3formsAccessKey?.trim();
  if (!key) {
    return { ok: false, skipped: true, reason: "no_access_key" };
  }

  const raw = payload.raw;
  const res = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: key,
      botcheck: false,
      subject: `NJA Work Request — ${raw.lane} — ${raw.legal_name}`,
      from_name: raw.legal_name,
      email: raw.email,
      phone: raw.phone || "",
      message: formatSubmissionEmail(payload),
    }),
  });

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok && json.success, skipped: false, json };
}

function validateForm(data) {
  const errors = [];
  const required = [
    "legal_name",
    "email",
    "address_line1",
    "city",
    "state",
    "postal_code",
    "signatory_name",
    "signatory_title",
    "lane",
    "request_type",
    "target_deadline",
    "budget_range",
  ];

  for (const field of required) {
    if (!data[field]?.toString().trim()) {
      errors.push(field);
    }
  }

  const lane = data.lane;
  if (lane === "art" || lane === "both") {
    if (!data.prepay_ack || !data.revisions_ack) {
      errors.push("art_acknowledgments");
    }
    if (!data.deliverable_description?.trim()) {
      errors.push("deliverable_description");
    }
  }

  if (lane === "music" || lane === "both") {
    if (!data.music_quote_ack) {
      errors.push("music_acknowledgments");
    }
    if (!data.track_need_description?.trim()) {
      errors.push("track_need_description");
    }
  }

  return errors;
}

function clearFieldErrors() {
  document.querySelectorAll(".field-error").forEach((el) => el.remove());
}

function showFieldErrors(errors) {
  for (const name of errors) {
    const input = form.querySelector(`[name="${name}"]`);
    if (input) {
      const err = document.createElement("span");
      err.className = "field-error";
      err.textContent = "Required";
      input.closest(".field")?.appendChild(err);
    }
  }

  if (errors.includes("art_acknowledgments")) {
    const ack = document.getElementById("art-ack-group");
    if (ack && !ack.querySelector(".field-error")) {
      const err = document.createElement("span");
      err.className = "field-error";
      err.textContent = "Please acknowledge the art commission terms.";
      ack.appendChild(err);
    }
  }

  if (errors.includes("music_acknowledgments")) {
    const ack = document.getElementById("music-ack-group");
    if (ack && !ack.querySelector(".field-error")) {
      const err = document.createElement("span");
      err.className = "field-error";
      err.textContent = "Please acknowledge the music licensing terms.";
      ack.appendChild(err);
    }
  }

  form.querySelector(".field-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearFieldErrors();

  const data = collectFormData();
  if (data.botcheck) {
    return;
  }
  const errors = validateForm(data);

  if (errors.length) {
    showFieldErrors(errors);
    return;
  }

  const payload = {
    raw: data,
    agreement_mapping: mapToAgreementFields(data),
  };

  const submitBtn = form.querySelector('button[type="submit"]');
  const prevLabel = submitBtn?.textContent;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
  }

  let emailResult = { ok: false, skipped: true };
  try {
    emailResult = await submitToInbox(payload);
  } catch {
    emailResult = { ok: false, skipped: false, reason: "network_error" };
  }

  payload._email_sent = emailResult.ok;
  payload._email_skipped = emailResult.skipped;

  sessionStorage.setItem("nja_work_request", JSON.stringify(payload));

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = prevLabel;
  }

  window.location.href = "confirmation.html";
});