# AC Circuit Practice Problem Generator v0.16

A browser-based AC circuit practice tool for introductory electronics students.

## What changed from v0.15

- Added two progressive hints to every template. Strategy text is hidden until requested, while essential answer-format and reference instructions remain visible.
- Added a category-dependent Problem type selector, with mixed practice as the default within each category.
- Added four qualitative filter templates covering limiting behavior, phase lead/lag, response-curve descriptions, and series-RLC behavior around resonance.
- Changed complex multiplication and division hints and solutions to convert both operands to polar form, then operate on magnitudes and angles.
- Added anonymous GoatCounter events for hints and problem-type selections without sending generated values or student identifiers.
- Preserved the small analytics disclosure in the footer without adding a consent banner.
- Updated the subtle footer version label to v0.16.

## Included template families

1. Series RC equivalent impedance
2. Series RL equivalent impedance
3. Series RLC equivalent impedance
4. Parallel RC equivalent impedance
5. Parallel RL equivalent impedance
6. Series RC or RL source current
7. Series RC capacitor voltage
8. Parallel RC source current from branch currents
9. RC filter classification, voltage ratio, and output voltage
10. LR filter classification, voltage ratio, and output voltage
11. RC or LR filter classification and cutoff frequency
12. Series RLC filter classification, resonant frequency, bandwidth, and quality factor
13. One resistor plus an LC, L₁L₂, or C₁C₂ pair in series
14. One resistor plus an LC, L₁L₂, or C₁C₂ pair in parallel
15. One resistor in series with a parallel LC, L₁L₂, or C₁C₂ pair
16. One resistor in parallel with a series LC, L₁L₂, or C₁C₂ pair
17. Resistor power in a series reactive circuit
18. Resistor power in a nontrivial mixed series-parallel reactive circuit
19. Current and all three component-voltage phasors in a series RLC circuit
20. Unknown capacitor or inductor from a specified impedance angle
21. Unknown frequency from a specified impedance angle
22. Loaded RC or RL output-voltage phasor
23. Required source voltage for a specified capacitor voltage
24. RC or LR component design for a specified cutoff frequency
25. Series-RLC component design for a specified resonant frequency
26. Series-RLC resistor design for a specified bandwidth or quality factor
27. RC or LR response comparison at 0.1f<sub>c</sub>, f<sub>c</sub>, and 10f<sub>c</sub>
28. RC or LR voltage gain in decibels
29. RC or LR frequency for a specified voltage gain in decibels
30. Series-RLC resonant frequency, current, and inductor/capacitor voltages at resonance
31. Phasor addition in polar notation, with rectangular and polar results
32. Complex-number multiplication with rectangular or mixed rectangular/polar inputs
33. Complex-number division with rectangular or mixed rectangular/polar inputs
34. Time-domain cosine waveform to RMS phasor conversion
35. RMS phasor to time-domain cosine waveform conversion
36. Qualitative RC or LR low- and high-frequency limiting behavior
37. Qualitative RC or LR output phase lead/lag
38. Qualitative RC or LR magnitude-response matching
39. Qualitative series-RLC behavior at and away from resonance

All values and answers are generated locally from explicit circuit formulas. No AI or server is involved in generating problems.

## Run it

Open `ac-circuit-practice-v0.16.html` directly in a modern browser. CSS, JavaScript, and circuit artwork are embedded, so no web server is required. Analytics runs only at `https://wgannett.github.io/ac-practice-problems/`; local copies are not tracked.

The separate source files and `assets/` directory remain available for editing. Run `node build-standalone.mjs` after making changes to rebuild the standalone file.

## Test it

Run `node smoke-test.mjs`. The test generates 100 examples from every template family, checks qualitative filter logic, two-level hints, subtype coverage, numerical calculations, required interface hooks, and confirms that all circuit images are embedded in the standalone build.

Keyboard shortcuts: `H` reveals the next hint, `R` reveals the answer, and `N` generates a new problem.
