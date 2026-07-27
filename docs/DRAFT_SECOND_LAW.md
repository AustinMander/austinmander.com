# Draft: Second Law section + essay page

Copy drafts for austinmander.com. Three pieces:

1. **Homepage block** (short, sits under the positioning line)
2. **Project page** at `/work/second-law` (the full pitch)
3. **Essay page** at `/writing/second-law` (standalone, see `ESSAY_second-law.md`)

No em dashes anywhere in the copy below.

Placement note: this does not fit `src/lib/case-studies.ts`, which is shaped around a client, an
industry and a testimonial. There is no client here. It is closer to the `public/studies/` pattern,
but the live piece is a Vite build rather than a single inline `index.html`, so it cannot go through
`sync-studies.mjs` as-is. Two clean options: embed the deployed page in an iframe from a normal
Next route, or add a `kind: "external"` entry to the studies manifest that links out. Either way the
copy below is the same.

---

## 1. Homepage block

Goes directly under "I build AI systems that actually work." It answers the question that line
provokes.

> ### How would you know?
>
> That is the only question worth asking about a claim like the one above, so here is a piece of
> work that is entirely about answering it.
>
> **Second Law** is a fluid simulation that measures its own disorder in real time. Two dyes get
> stirred together, then the equations are run backwards. The flow visibly retraces. The measurement
> does not come back.
>
> The interesting part is not the physics. It is that the first version of the instrument was
> **wrong**, and I found it before shipping by testing the measurement against cases where I already
> knew the answer. It scored a perfect crystal as more disordered than random noise. Then I wrote a
> claim that my own data contradicted, and had to withdraw it publicly.
>
> Both failures are in the commit history, along with three unedited reviews that caught me. That is
> the actual work: not the thing that looks impressive, the discipline that would have caught it if
> it were wrong.
>
> [See it running](https://austinmander.github.io/second-law/) ·
> [Read the essay](/writing/second-law) ·
> [Source](https://github.com/AustinMander/second-law)

---

## 2. Project page: `/work/second-law`

### Hero

**Second Law**
A GPU fluid that measures its own entropy, then runs the equations backwards to show the measurement
does not come back.

*Raw WebGL2. Zero runtime dependencies. 20 KB gzipped. 262,144 particles at 60 fps.*

[Open the live piece](https://austinmander.github.io/second-law/)

---

### What it is

Seven bands of two fluorescent dyes, unmixed and still. A shear rolls them into Kelvin-Helmholtz
billows. The billows break into filaments. Then the velocity field is negated, which is the exact
time-reversal symmetry of the equations being solved, and the fluid runs backwards.

The vortices unwind. The bands come partway back. You can watch it happening.

The entropy does not come back. It keeps rising while the picture returns.

Two numbers on screen say two different things at once, and that contradiction is the whole piece.
`D`, the distance from the original state, falls from 0.180 to 0.133 because the bands really are
reassembling. `S`, the mixing entropy, climbs from 0.340 to 0.360 anyway.

---

### Why it exists

Most generative graphics work has a specific failure: the physics is a costume. It looks like fluid,
but nothing is measured and nothing could be found to be wrong. You could swap the solver for
animated noise and almost nobody would notice.

I wanted the opposite. A piece where the visuals are downstream of a real measurement, and where the
whole thing makes a claim that could turn out to be false.

That constraint is what makes it a portfolio piece rather than a screensaver, because it is the same
constraint that separates a working system from a demo.

---

### The part I would actually point at

**The first instrument was broken and I nearly shipped it.**

The original design measured how spread out the particles were. It seemed obviously right. Run it on
cases where you already know the answer, though, and:

| state | what it scored |
|---|---|
| a perfect crystal | **1.000**, maximum disorder |
| random noise | 0.999 |

The ordered state scored higher than the disordered one. The entire piece, every number on screen,
the colour design, the whole narrative, was built on an instrument that reads a crystal as maximum
chaos.

The code would have worked perfectly. It would have rendered a beautiful fluid with a confident
readout in the corner reporting a number that meant nothing, and essentially nobody would ever have
checked. It would have been a **more** dishonest piece for being well-built.

I caught it by spending an hour testing the measurement on synthetic cases with known answers before
writing a single line of the renderer.

**Then I overstated the result and had to retract it.**

Having fixed the instrument, I wrote a better-sounding claim than the data supported: that reversing
the flow always makes things worse. One of my own test scripts, sitting in the same folder,
falsified it. I had quoted the four rows that agreed and skipped the ones that did not.

Nothing was fabricated. Every number I quoted was a real measurement from real code. The selection
did all the lying, which is how this usually goes.

The claim on the site now is the weaker one that survives all the evidence.

---

### How it is verified

The claim is falsifiable, and there is a test that fails if it stops being true.

- **26 unit tests** on the measurement itself, including a mathematical invariant that must hold and
  adversarial inputs designed to make it produce nonsense
- **Browser tests** asserting the claim against the live piece: that entropy starts low, rises
  through the mixing, and stays above twice its starting value after the reversal
- **A resolution study** across a factor of 16, to check the result is not an artifact of my own
  approximations
- **Three adversarial reviews**, checked in unedited, including the parts where they are harsh and
  correct

Every number on screen is computed from the same dye field you are looking at, by the same functions
that are unit-tested. None of it is decorative.

---

### Engineering

| | |
|---|---|
| Solver | Stable Fluids (Stam 1999), semi-Lagrangian advection with RK2 trace, vorticity confinement, 32 Jacobi pressure iterations |
| Particles | 262,144 tracers in GPU texture memory, instanced quads with no attribute buffers, coloured by sampling the dye field they move through |
| Instrument | GPU reduction pyramid into a fenced non-blocking readback, so measuring never stalls the render |
| Stack | Raw WebGL2, TypeScript, zero runtime dependencies |

Three decisions that were measured rather than assumed, and one that was wrong:

- A more accurate advection scheme was tested and rejected: three times the cost for no measurable
  difference in the result.
- Velocity is stored in screen units rather than grid units, so the physics does not silently change
  when quality drops on a weaker device.
- Brightness tracks the boundary between the dyes rather than the dye itself. Tracking the dye gives
  a uniformly lit frame with no black in it, because the two species always sum to one.
- The middle quality tier shipped broken for a day. Its grid size did not divide down cleanly to the
  measurement resolution, so every reading on that tier failed silently. A review found it. There is
  now a test that runs all three tiers.

---

### Links

- [Live piece](https://austinmander.github.io/second-law/)
- [Essay: on making a thing that measures its own failure](/writing/second-law)
- [Source and reviews](https://github.com/AustinMander/second-law)

---

## 3. Pull quotes

For social, the CV, or a slide. Each stands alone.

> A measurement you have not tried to break is decoration.

> The code would have worked perfectly. It would have reported a number that meant nothing, and
> almost nobody would ever have checked. It would have been a more dishonest piece for being
> well-built.

> Nothing was fabricated. Every number was a real measurement from real code. The selection did all
> the lying.

> The failure mode was never that I could not tell. It was that I had stopped asking.

---

## 4. Notes for whoever builds this

- The homepage block should be **short**. It exists to provoke a click, not to explain fluid
  dynamics. Do not mention Loschmidt, Boltzmann or Kelvin-Helmholtz above the fold. Nobody buying
  anything cares, and it reads as showing off.
- The two failure tables (crystal scoring 1.000, and the withdrawn claim) are the strongest content
  on the page. They should be visible without scrolling on the project page.
- The live piece is self-contained, 20 KB, has a quality ladder, honours `prefers-reduced-motion`,
  and falls back to a static poster where WebGL2 is unavailable. It is safe to embed. Use
  `?ui=0&pace=1.6` for a background, which hides the readout and slows it down.
- Do not use it as a decorative site background on the homepage. The piece is an argument. Turning
  it into wallpaper spends the interesting thing to get a texture.
