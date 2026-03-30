# The difference between a SIL assessment and a HAZOP

These two studies come up together constantly in process safety conversations, and they get conflated just as often. A plant manager who has sat through both can usually describe what happened in the room. What's less common is a clear understanding of why they're different, why the sequence matters, and what each one actually produces.

## The short version

A HAZOP asks: what can go wrong in this process?

A SIL assessment asks: for the safety function we're relying on to prevent or mitigate that, how reliable does it need to be?

One finds the problem. The other defines the performance requirement for the instrumented solution. They answer different questions at different stages of the safety lifecycle, and neither replaces the other.

## What a HAZOP does

A Hazard and Operability Study is a structured, team-based examination of a process. The team works through the process node by node, applying standardised guide words (No, More, Less, Reverse, Other Than, among others) to process parameters like flow, pressure, temperature, and level.

For each combination, the team asks:

- What could cause this deviation?
- What happens if it occurs?
- What safeguards are already in place?
- Is the residual risk acceptable?
- What additional measures are needed?

The output is a register of hazard scenarios, causes, consequences, existing safeguards, and recommended actions. Some will be design changes. Some will be procedural. And some will be a recommendation that a Safety Instrumented Function (SIF) is needed to provide additional risk reduction.

This is the part people miss: the HAZOP identifies that instrumented protection may be required. It doesn't determine what level of reliability that protection must achieve. Those are two different questions, and the second one belongs to the SIL assessment.

A HAZOP is governed by IEC 61882 and is a qualitative study. The quality of the output depends heavily on the facilitator and the team in the room, which should include process engineers, operations staff, instrumentation and control engineers, maintenance representation, and HSE input.

## What a SIL assessment does

A SIL (Safety Integrity Level) assessment is performed once a SIF has been identified as necessary. Its purpose is to determine how much risk reduction that SIF must provide, expressed as a target SIL.

SIL levels run from 1 to 4:

- SIL 1: roughly 10-fold risk reduction
- SIL 2: 100-fold
- SIL 3: 1,000-fold
- SIL 4: 10,000-fold (rare in process industries)

The most common method for determining the required SIL is LOPA (Layer of Protection Analysis). LOPA takes the hazard scenario from the HAZOP, establishes the frequency of the initiating event, identifies the independent protection layers (IPLs) that can be credited, and calculates whether the residual risk after those IPLs meets the facility's tolerable risk target. If there's a gap, the SIF must close it, and the size of that gap determines the required SIL.

The assessment is governed by IEC 61508 (generic functional safety) and IEC 61511 (process industry sector). In South Africa, this aligns with the Major Hazard Installation Regulations framework for facilities where a SIS forms part of the risk reduction strategy.

## How the two studies connect

In practice the sequence looks like this:

1. HAZOP identifies hazard scenarios, causes, consequences, and existing safeguards
2. Risk evaluation determines whether existing safeguards are sufficient
3. Where they aren't, a SIF is proposed and a SIL assessment (typically via LOPA) determines the required SIL
4. The SIF is designed to meet that target
5. SIL verification confirms the design actually achieves the required probability of failure on demand

The HAZOP comes first. The SIL assessment depends on it. Without a rigorous HAZOP, the SIL assessment has no foundation: it lacks the scenarios, causes, consequences, and safeguard inventory that LOPA needs to produce a defensible result.

## A practical example

Consider a pressure vessel containing flammable liquid. During the HAZOP, the team examines the node for high pressure.

**HAZOP finding:**
The basic process control system pressure control valve could fail open, causing excessive feed, reactor overpressure, loss of containment, and a potential fire or explosion. Existing safeguards include a pressure alarm, operator response, and a pressure relief valve. The team recommends verifying that the proposed high-high pressure trip SIF meets the required SIL.

**SIL assessment (LOPA) result:**
The initiating event frequency (control valve failure) is 0.1 per year. The pressure relief valve is credited as an IPL with a probability of failure on demand of 0.01. Operator response to the alarm does not qualify as an IPL because it lacks the required independence from the basic process control system. The mitigated frequency without the SIF is 0.001 per year. The tolerable risk target is 0.00001 per year. The SIF needs to provide 100-fold risk reduction: SIL 2.

The HAZOP identified the problem. The SIL assessment set the performance requirement for the solution.

## Misconceptions worth correcting

**"A HAZOP establishes the SIL."**
No. A HAZOP may recommend that a SIF is needed and flag a scenario for SIL assessment. Assigning a SIL target requires a separate risk reduction calculation.

**"Every safeguard in the HAZOP becomes an IPL in LOPA."**
This catches people out regularly. To be credited as an IPL, a safeguard must meet strict criteria for independence, specificity, and auditability. Many safeguards that appear in HAZOP worksheets won't qualify.

**"Every hazard scenario from the HAZOP needs a SIL."**
Many scenarios are adequately addressed by non-instrumented safeguards, procedural controls, or inherently safer design. A SIF is only needed where instrumented protection is required to close a residual risk gap.

**"SIL is a property of a device."**
This one persists despite years of correction. There is no such thing as a SIL-rated transmitter or a SIL-rated control system. What exists are components with published failure rate data that make them suitable for use in a SIL-rated loop. The SIL is a property of the complete safety function: the sensor, logic solver, and final element together, including their architecture, redundancy, and maintenance regime.

**"SIL assessment and SIL verification are the same thing."**
Different activities, both required. The SIL assessment determines the required SIL. SIL verification confirms the designed system actually achieves it. Skipping verification after a correct assessment still leaves the question unanswered.

## What plant managers should take from this

If you manage a process facility, the distinction boils down to this: the HAZOP protects you from not seeing the hazard. The SIL assessment protects you from underdesigning the safety function once you've seen it.

Both need to be done properly. A weak HAZOP produces scenarios too vague to support rigorous LOPA. A SIL assessment without a proper HAZOP behind it produces targets that lack a defensible basis. And neither study is self-closing: the SIF still has to be designed, verified, installed, commissioned, proof-tested, and maintained.

In South Africa, for facilities covered by the Major Hazard Installation Regulations, functional safety documentation (HAZOP records, SIL determination basis, SRS, and verification calculations) forms part of the evidence base that regulators and insurers may request. Getting the studies right at the start is considerably cheaper than reconstructing them later.

*This article is a general overview. For site-specific hazard studies, SIL determination, or functional safety lifecycle support, consult a qualified functional safety engineer or certified HAZOP facilitator.*