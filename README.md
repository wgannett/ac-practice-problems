# AC Circuit Practice Problem Generator v0.12

A browser-based AC circuit practice tool for introductory electronics students.

## What changed from v0.11

- Added inverse RC and LR filter problems that solve for frequency from a specified dB gain.
- Added a separate RLC resonance problem set.
- Moved resonant-component and bandwidth/quality-factor design problems into RLC resonance.
- Added series-RLC current and component-voltage calculations at resonance.
- Added a Phasors & waveforms problem set with phasor addition, phasor division, and conversions between sinusoidal waveforms and RMS phasors.
- Added a subtle visible version label in the page footer.

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
32. Phasor division in polar notation, with polar and rectangular results
33. Time-domain cosine waveform to RMS phasor conversion
34. RMS phasor to time-domain cosine waveform conversion

All values and answers are generated locally from explicit circuit formulas. No AI or server is involved in generating problems.

## Run it

Open `ac-circuit-practice-v0.12.html` directly in a modern browser. CSS, JavaScript, and circuit artwork are embedded, so no web server is required.

The separate source files and `assets/` directory remain available for editing. Run `node build-standalone.mjs` after making changes to rebuild the standalone file.

## Test it

Run `node smoke-test.mjs`. The test generates 100 examples from every template family, checks the new phasor, waveform, inverse-gain, and resonance calculations, verifies required interface hooks, and confirms that all circuit images are embedded in the standalone build.

Keyboard shortcuts: `R` reveals the answer and `N` generates a new problem.
