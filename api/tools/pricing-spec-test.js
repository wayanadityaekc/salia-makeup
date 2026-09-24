#!/usr/bin/env node
// Asserts the server price rules, and that the server table matches the frontend
// table in ../../lib/config.js (the two are kept identical on purpose — the
// estimate the guest sees must equal the total the owner is shown). Run after
// touching a price in either file.
const fs = require("fs");
const path = require("path");
const pricing = require("../pricing");

let pass = 0;
const fail = [];
function eq(label, got, want) {
  if (got === want) pass++;
  else fail.push(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

// --- Rules -------------------------------------------------------------------
// Plain make up, in-town, no hairdo.
eq("makeup base", pricing.quote({ service_id: "makeup", area_id: "dalam-kota" }).total, 150000);
// Hairdo add-on applies to plain make up.
eq("makeup + hairdo", pricing.quote({ service_id: "makeup", area_id: "dalam-kota", hairdo: true }).total, 250000);
// Area fee adds on top.
eq("makeup + far area", pricing.quote({ service_id: "makeup", area_id: "luar-jauh" }).total, 250000);
eq("makeup + hairdo + far", pricing.quote({ service_id: "makeup", area_id: "luar-jauh", hairdo: true }).total, 350000);
// Hairdo-included service ignores the add-on even if hairdo:true is sent.
eq("wisuda ignores hairdo flag", pricing.quote({ service_id: "wisuda", area_id: "dalam-kota", hairdo: true }).total, 300000);
// Nail art never charges the hairdo add-on.
eq("nail gel ignores hairdo flag", pricing.quote({ service_id: "nail-gel", area_id: "dalam-kota", hairdo: true }).total, 150000);
// Unknown service is rejected, not silently priced.
eq("unknown service errors", pricing.quote({ service_id: "nope" }).error, "unknown_service");
// Unknown area falls back to zero fee, does not throw.
eq("unknown area -> zero fee", pricing.quote({ service_id: "makeup", area_id: "nope" }).total, 150000);
// Resolved names come from the table, not the client.
eq("service_nama resolved", pricing.quote({ service_id: "nail-design", area_id: "dalam-kota" }).service_nama, "Nail Art Design");
eq("area_nama resolved", pricing.quote({ service_id: "makeup", area_id: "luar-20" }).area_nama, "Luar kota (< 20 km)");

// --- Server table === frontend table -----------------------------------------
// Parse ../../lib/config.js without importing it (it's ESM). We only need the
// numbers, so read the base/fee/hairdoAddon literals out of the source.
const cfg = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "config.js"), "utf8");

function baseFor(id) {
  // matches:  id: "makeup", ... base: 150000  (within one object literal)
  const re = new RegExp(`id:\\s*"${id}"[\\s\\S]*?base:\\s*(\\d+)`);
  const m = cfg.match(re);
  return m ? Number(m[1]) : null;
}
function feeFor(id) {
  const re = new RegExp(`id:\\s*"${id}"[\\s\\S]*?fee:\\s*(\\d+)`);
  const m = cfg.match(re);
  return m ? Number(m[1]) : null;
}

for (const s of pricing.allServices) {
  eq(`frontend base matches ${s.id}`, baseFor(s.id), s.base);
}
for (const a of pricing.areas) {
  eq(`frontend fee matches ${a.id}`, feeFor(a.id), a.fee);
}
const addonMatch = cfg.match(/hairdoAddon\s*=\s*(\d+)/);
eq("frontend hairdoAddon matches", addonMatch ? Number(addonMatch[1]) : null, pricing.hairdoAddon);

// --- Report ------------------------------------------------------------------
if (fail.length) {
  console.error(`pricing-spec-test FAILED (${fail.length}):`);
  for (const f of fail) console.error("  - " + f);
  process.exit(1);
}
console.log(`pricing-spec-test OK — ${pass} assertions.`);
