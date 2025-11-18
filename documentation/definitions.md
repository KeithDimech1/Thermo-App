# Thermochronology Field Definitions

**Last Updated:** 2025-11-18
**Purpose:** Quick reference for geological and analytical terminology

---

## Core Concepts

### Datapoint Architecture

**Datapoint** - One analytical session (specific lab, date, method, analyst)
- Same sample can be analyzed multiple times
- Each session = 1 datapoint with complete QC metadata

**Batch** - Group of analyses run together
- Links unknowns to reference materials
- Enables QC by comparing to standards with known ages

**Reference Material** - Standards with known ages
- Durango apatite (31.4 Ma)
- Fish Canyon tuff zircon (28.2 Ma)
- Mt. Dromedary apatite (98.7 Ma)

---

## Fission-Track (FT) Fields

### Age Calculations

**Pooled Age**
- Age from all grain data combined
- Assumes single population (all grains same age)
- Uses weighted mean of all grain counts
- Formula: Based on total Ns, Ni across all grains

**Central Age**
- Age accounting for overdispersion
- Random effects model (lognormal)
- More robust when age scatter present
- Recommended over pooled age (Kohn et al. 2024)

**Single Grain Age**
- Age for individual grain
- Calculated from grain-specific Ns, Ni, Nd
- Used in radial plots and mixture modeling

### Statistical Parameters

**Dispersion**
- Measure of age scatter beyond analytical uncertainty
- 0% = all scatter explained by counting statistics
- >0% indicates geological complexity or U zoning
- Typical values: 0-20% (sediment), 0-5% (bedrock)

**P(χ²)** - Chi-square probability
- Tests if scatter explained by analytical uncertainty alone
- P > 0.05: Passes (single population likely)
- P < 0.05: Fails (overdispersion present)
- Sensitive to grain count (high n → easier to fail)

**MSWD** - Mean Square of Weighted Deviates
- Similar to reduced chi-square
- MSWD ≈ 1: Expected scatter
- MSWD >> 1: Excess scatter (geological or analytical)
- Used in (U-Th)/He more than FT

### Track Count Data

**Ns** - Spontaneous track count
- Fossil tracks from U-238 fission
- Counted on polished, etched grain surface

**Ni** - Induced track count
- Tracks from neutron irradiation (EDM only)
- Counted on same grain after re-etch

**Nd** - Dosimeter track count
- Tracks on mica or glass standard (EDM only)
- Measures neutron fluence

**ρs, ρi, ρd** - Track densities (tracks/cm²)
- Normalized counts accounting for area counted
- Used in age equations

**U ppm** - Uranium concentration
- From LA-ICP-MS (no irradiation needed)
- Replaces Ni/ρi in LA-ICP-MS age equations

### Track Length Data

**MTL** - Mean Track Length
- Average confined track length (μm)
- Indicates thermal history
- Unannealed: ~16 μm (apatite), ~14 μm (zircon)
- Shorter tracks = more annealing (hotter thermal history)

**c-axis angle** - Track orientation
- Angle between track and crystallographic c-axis
- Affects annealing rate (c-parallel anneal faster)
- Critical for kinetic modeling

### Kinetic Parameters

**Dpar** - Etch pit diameter parallel to c-axis
- Proxy for Cl content (kinetic parameter)
- Measured in μm (typical: 1.5-3.0)
- Larger Dpar → higher Cl → slower annealing

**rmr₀** - Reduced mean length (etchant-corrected)
- Kinetic parameter from track length reduction
- Used in annealing models (Ketcham et al.)
- Accounts for compositional variation

**Cl content** - Chlorine in apatite
- Measured via EPMA or calibrated from Dpar
- Shifts PAZ: ~60-120°C (F-apatite) to ~100-160°C (Cl-rich)
- Critical for thermal history modeling

---

## (U-Th)/He Fields

### Age Calculations

**Raw Age** - Uncorrected age
- From He, U, Th measurements only
- Does not account for alpha ejection
- Always older than corrected age

**Corrected Age** - After Ft correction
- Accounts for alpha particle ejection from grain edges
- Ft typically 0.6-0.9 (depends on grain geometry)
- This is the reported age

**Ft** - Alpha ejection correction factor
- Calculated from grain dimensions (length, width, radius)
- Assumes crystal geometry (hexagonal prism, sphere, etc.)
- Smaller grains → more ejection → lower Ft

### Chemistry

**eU** - Effective Uranium
- eU = U + 0.235 × Th
- Accounts for Th contribution to He production
- Used in radiation damage calculations
- Units: ppm

**U, Th, Sm** - Parent isotope concentrations
- Measured via ICP-MS after He extraction
- Required for age calculation
- Sm minor contributor (~1% of He typically)

**He** - Helium-4 content
- Measured via noble gas mass spectrometry
- Units: ncc (nanocubic centimeters at STP)

### Grain Geometry

**Rs** - Sphere radius
- Equivalent sphere radius for Ft calculation
- Calculated from grain volume and surface area
- Used in Farley et al. (1996) Ft equations

**a, b, c** - Crystal dimensions
- For hexagonal prism geometry
- a = grain radius, c = half-length
- Measured under microscope or via 3D imaging

**Volume, Surface Area**
- Measured or calculated from dimensions
- Required for accurate Ft correction
- 3D laser scanning increasingly used

---

## Analytical Methods

### EDM (External Detector Method)

**Process:**
1. Polish and etch grains
2. Count spontaneous tracks (Ns)
3. Irradiate with thermal neutrons
4. Re-etch and count induced tracks (Ni)
5. Count dosimeter tracks (Nd)

**Advantages:**
- Higher accuracy (matched Poisson design)
- Better for U-zoned grains
- Lower equipment cost

**Disadvantages:**
- Slower (weeks for irradiation)
- No simultaneous U-Pb dating

### LA-ICP-MS (Laser Ablation ICP-MS)

**Process:**
1. Polish and etch grains
2. Count spontaneous tracks (Ns)
3. Ablate same area with laser
4. Measure U (and trace elements) via mass spec

**Advantages:**
- Rapid (days vs weeks)
- Simultaneous U-Pb + trace elements
- No irradiation needed

**Disadvantages:**
- Higher dispersion (U-zoning effects)
- More complex zero-count handling
- Higher equipment cost

---

## Provenance & Metadata

**IGSN** - International Geo Sample Number
- Global unique identifier for physical samples
- Format: IEXXX0001, AU1234, etc.
- Registered at geosamples.org
- Enables sample tracking across studies

**ORCID** - Open Researcher & Contributor ID
- Persistent identifier for researchers
- Format: 0000-0001-2345-6789
- Links people to their data contributions
- Used for collector, analyst, PI roles

**DOI** - Digital Object Identifier
- Citable identifier for datasets
- Minted for published data packages
- Enables proper academic citation
- EarthBank assigns DOIs automatically

---

## Geological Context

**Closure Temperature (Tc)**
- Temperature below which daughter products retained
- AFT: ~110°C (±20°C, Cl-dependent)
- ZFT: ~240°C
- AHe: ~70°C (radiation damage dependent)
- ZHe: ~180°C

**PAZ** - Partial Annealing Zone
- Temperature range of partial track retention
- AFT: ~60-120°C (F-apatite) to ~100-160°C (Cl-rich)
- Tracks progressively shorten with time at PAZ temps

**PRZ** - Partial Retention Zone
- Temperature range of partial He retention
- AHe: ~40-80°C (radiation damage dependent)
- Older, more damaged grains retain He to higher temps

---

## Data Quality Indicators

**Track Density Ratio (ρs/ρi)**
- Should be similar across grains if single population
- Large variation suggests mixing, U-zoning, or alteration

**Zero-count grains**
- Grains with Ns = 0 (very young or low-U)
- EDM: Straightforward (assign upper age limit)
- LA-ICP-MS: Complex (abundance-based approach)

**Standard Reproducibility**
- Reference material ages should match accepted values
- Typical precision: ±2-5% (1σ)
- Larger variation indicates analytical problems

**Grain Count**
- Minimum: 20 grains recommended (Kohn et al. 2024)
- More grains → better statistics
- Detrital samples may need 50-100+ grains

---

## References

- **Kohn et al. (2024)** - GSA Bulletin 136:3891-3920 - Reporting standards
- **Nixon et al. (2025)** - Chemical Geology 696:123092 - EarthBank FAIR platform
- **Farley et al. (1996)** - GCA 60:4223-4229 - (U-Th)/He Ft corrections
- **Ketcham et al. (2007)** - Am Min 92:799-810 - Annealing models

---

**For more details:** See `build-data/documentation/foundation/` for complete research papers
