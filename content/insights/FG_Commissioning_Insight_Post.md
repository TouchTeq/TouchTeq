# What to Expect During a Fire and Gas System Commissioning

There's a version of commissioning that most people have seen: a technician walks around with a clipboard, presses a test button on a detector, the panel beeps, and someone signs off a form. That's not commissioning. That's a functional check, and it's not enough to know whether a fire and gas system will actually perform when it's needed.

Proper F&G commissioning is a structured, documented process that proves the entire system — from field sensors through to logic, alarms, and physical outputs — works as designed, in the real environment it's been installed in. It's the difference between a system that passed a test and a system you can rely on.

---

## Why the F&G System Gets Commissioned First

Before fuel systems, rotating equipment, or process systems are brought online, the fire and gas system needs to be ready. Every subsequent commissioning activity introduces hazards — hydrocarbons, pressure, heat — that the F&G system exists to detect and respond to. Commissioning it last, or in parallel with live process systems, removes the safety net before you know it works.

This sequencing is a fundamental principle, not a preference.

---

## The Phases of a Proper Commissioning

### Pre-Commissioning: Before Anything Gets Tested

Pre-commissioning is document and installation verification. Nothing gets powered up until this is done properly.

On the documentation side, the commissioning team should be working from the Fire and Gas Philosophy document, the Cause and Effect matrix, instrument index and loop diagrams, P&IDs, equipment data sheets, hazardous area classification drawings, and equipment certification records. Every piece of installed equipment needs to be traceable back to a document.

On the physical side, inspectors verify that detectors are mounted in the correct locations with correct orientations, that wiring terminations are complete with correct polarity, that cable insulation resistance meets specification, that earthing and bonding is in order, and — critically — that every device installed in a classified hazardous area carries the correct Ex certification for that zone. A Zone 1 area with Zone 2 rated equipment is a compliance failure before commissioning has even started.

In South Africa, fire detection and suppression work must be carried out by **SAQCC Fire-registered** competent persons. If that's not confirmed before the team arrives on site, it needs to be confirmed before they start work.

### Factory Acceptance Testing (FAT)

For larger or more complex systems, FAT happens at the manufacturer's facility before equipment ships to site. The logic solver is tested against simulated inputs, cause and effect matrices are verified, and wiring inside control cabinets is checked against project drawings.

Skipping FAT is a common project shortcut with a predictable consequence — logic errors and wiring faults that would take hours to resolve in a factory take days to diagnose and fix in the field. It's not a place to save time.

For integrated plants, an **Integrated FAT (IFAT)** tests the F&G system alongside the Basic Process Control System and ESD system together, verifying that data passes correctly across the interfaces before anything leaves the factory.

### Power-Up and Panel Commissioning

Once pre-commissioning is complete, the panel is energised and initial diagnostics are reviewed. Technicians verify supply voltages, check startup behaviour, confirm battery backup meets the specified standby duration, and review any fault conditions showing on the panel before field devices are connected.

This is also where the cause and effect logic gets a first review — checking that the programmed matrix matches the approved C&E document before any field testing begins.

### Loop Testing and Detector Commissioning

Each field device is tested individually. For **gas detectors**, this means zero and span calibration with certified test gas, performed in sequence — zero before span. Skipping certified test gas or using the wrong gas concentration invalidates the calibration.

For **optical flame detectors**, end-to-end functional testing with an approved test lamp is required to confirm the optical path is clear and the detector is correctly aimed. Self-diagnostic indicators on the detector confirm internal health — they do not confirm that the detector is pointed at the right area, that nothing is obscuring its field of view, or that it will respond to an actual flame event. Those things only get confirmed by testing the full optical path.

Each loop test should be recorded by instrument tag, with the technician's name, date, result, and any corrective action taken.

### Cause and Effect Testing

This is the part that proves the logic. Inputs are simulated — a gas detector in alarm, a flame detector activating, a manual call point being triggered — and the team verifies that the programmed responses follow: which alarms sound, which beacons activate, which HVAC systems trip, which ESD signals are sent, which suppression outputs are enabled.

One important operational point: relay-activated outputs — deluge valves, suppression releases, ESD trips — should be inhibited or physically isolated before cause and effect testing begins. Triggering a deluge system in a live plant area to prove a logic response is not a test. It's an incident.

All inhibits applied during testing must be tracked and formally restored before handover. Bypasses left in place at startup are one of the most common and most dangerous commissioning close-out failures.

### Integrated Systems Testing

Once individual systems are proven, integrated testing confirms that the F&G system communicates correctly with everything else — the DCS, ESD system, HVAC controls, public address and general alarm systems, fire pumps, and any other interfaces defined in the design. A flame detector going into alarm should produce a specific, verifiable chain of responses across multiple systems. Integrated testing is how you confirm that chain actually works end to end.

---

## What Gets Handed Over at the End

A properly closed-out commissioning produces a dossier that should include completed pre-commissioning checklists, loop test reports, cause and effect test records, functional performance test results, punch list items and their resolution status, as-built drawings reflecting any field changes, calibration certificates, and equipment certification documents.

This is not paperwork for its own sake. It's the baseline record for every proof test, modification, and audit that will happen over the life of the system. A commissioning dossier that's incomplete or poorly compiled becomes a problem the first time someone needs to demonstrate that the system was properly validated before startup.

Operations and maintenance staff should also receive formal training before the system is handed over — not a walkthrough, but documented training covering system architecture, alarm response, bypass procedures, detector testing methods, and maintenance schedules. New staff join organisations constantly. If the training isn't documented, it doesn't transfer.

### Pre-Startup Safety Review (PSSR)

Before hazardous chemicals or process fluids are introduced, a Pre-Startup Safety Review confirms that construction matches design specifications, operating and emergency procedures are in place, all HAZOP recommendations have been implemented, and operator training is complete. Under IEC 61511, this aligns with the Functional Safety Assessment required before startup.

The PSSR is the formal gate between a commissioned system and a live one. It shouldn't be treated as a formality.

---

## What Plant Managers Should Watch For

A few things consistently separate well-run commissioning campaigns from ones that create problems later:

**Anything still inhibited or bypassed at handover.** Get a written list of every inhibit applied during testing and confirm each one is restored and signed off before the system goes live.

**End-to-end detector testing, not just panel health.** If the commissioning report doesn't show test lamp results for flame detectors and certified test gas results for gas detectors, the detectors haven't been properly commissioned.

**Hazardous area compliance.** If any equipment in a classified area doesn't have the correct Ex certification for its zone, that needs to be resolved before startup — not retrospectively documented.

**Documentation completeness.** A commissioning dossier with gaps is a liability. Future modifications, proof test planning, and regulatory inspections all depend on having a complete baseline record.

**Proof test planning in place before handover.** The maintenance team should receive a proof test plan with defined intervals and procedures as part of the handover package. The period immediately after commissioning is not a maintenance-free honeymoon — it's when the system's real performance data starts accumulating.

---

## The South African Regulatory Context

In South Africa, F&G commissioning for process facilities intersects with the OHS Act, the Major Hazard Installation Regulations (2022), and SANS standards including **SANS 10139** for fire detection and alarm systems and **SANS 14520** for gaseous extinguishing systems. The Department of Employment and Labour's requirements for pre-startup confirmation of safety system readiness apply to major hazard installations, and SAQCC Fire registration requirements apply to the personnel doing the work.

For operations extending into other SADC countries, the technical approach translates well — but verify the specific regulatory requirements and approval authorities for each jurisdiction before assuming South African compliance carries across.

---

*This article is intended as a general overview for plant operators and managers. For site-specific commissioning planning, scoping, or execution, consult a qualified fire and gas engineer with relevant process industry experience.*
