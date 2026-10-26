# LocalityMap data format

This is the contract between the two halves of LocalityMap:

- **Field capture** (the phone): records photos, the GPS trail and the camera pose.
- **Processing** (the Process tab today, a native processor later): analyses photos, finds objects and kerbs, and writes results.

Anything that can read a survey zip and write results in this shape can stand in for the web app's processing. LocalityMap imports the results, merges them, and you review and upload as usual. All processing is meant to run locally. No step depends on a paid or remote service.

Version: written by LocalityMap 0.6. Readers should ignore fields they don't know.

## The survey zip

| Path | What it is |
|---|---|
| `photos/<id>.jpg` | The photo, with EXIF GPS position, direction and time. Only in "with photos" exports. |
| `survey.json` | Everything else: one entry per photo, plus review decisions and objects. |
| `trails.json` | The GPS and orientation trail for each drive. |
| `cameras.geojson` | Camera positions as GeoJSON points, handy for a quick look in QGIS. |

### survey.json

```jsonc
{
  "app": "LocalityMap 0.6.0",
  "exported": "2026-10-26T03:12:00Z",
  "frame": "ENU metres at each camera; basis vectors are unit vectors (east, north, up)",
  "photos": [ /* one per photo, below */ ],
  "checks": { "<feature key>": [ { "o": "<photo id>", "v": "seen|gone|unsure", "trip": "...", "at": 1730000000000 } ] },
  "trips":  { "<trip id>": { "started": "...", "mountOffset": 0, "videoStart": 1730000000000, "videoMime": "video/mp4" } },
  "objects": [ /* see Objects */ ],
  "with_photos": true
}
```

Each photo entry:

| Field | Meaning |
|---|---|
| `id`, `file`, `created`, `kind` (`foot`/`drive`), `trip` | Identity. `trip` groups the photos from one drive. |
| `image` `{w,h}`, `hfov_long_deg` | Size, and horizontal field of view across the long side. |
| `camera.lat/lon`, `gps_accuracy_m`, `speed_ms`, `gps_course_deg` | GPS fix at the shutter (refined if the drive was refined). |
| `camera.heading_deg`, `heading_source`, `heading_correction_deg` | Where the lens points, after any manual or automatic correction. |
| `camera.height_m` | Lens height above the road. |
| `camera.basis_enu.forward/right/up` | Full camera orientation as unit vectors in local east-north-up. A pixel at fractions (x, y) of the image looks along `forward + (2x−1)·tan(hfov/2)·right + (1−2y)·tan(vfov/2)·up`. |
| `marks[]` | Changes proposed or decided for this photo: `preset`, `x`,`y` (fractions), `status`, `lat`,`lon`, `values` (OSM tag values), `way`. |
| `record` | The app's full internal record, including `vision` (below). Use it to round-trip. |

### trails.json

An array of `{ trip: <trip id>, t0, fixes: [...], orient: [...], motion: [...] }`. Times are milliseconds since epoch.

- `fixes[]`: `{ t, lat, lon, acc, alt, altAcc, speed, course }` — every GPS fix (speed m/s, course degrees, nulls when the phone didn't report them).
- `orient[]`: `{ t, f, r, u, h0, H }` — the camera basis (forward/right/up, ENU unit vectors, before compass correction) about 5 times a second, the raw compass heading `h0`, and the corrected heading `H`.
- `motion[]` (0.7+): flat pairs `[ms since t0, vertical acceleration in tenths of m/s²]`, about 50 per second, gravity removed. Speed humps show as two jolts one wheelbase apart (front then rear wheels).

## Results

### Per photo: `record.vision`

```jsonc
{
  "v": 2,
  "at": "2026-10-26T03:20:00Z",
  "model": "onnx-community/maskformer-resnet50-vistas fp32 x2",
  "W": 1066, "H": 600,                 // size of the label map
  "rle": [label, runLength, ...],       // per-pixel Mapillary Vistas class index, row-major, run-length coded
  "pose0": { "adj": 0, "tilt": 0, "lat": 0, "lon": 0, "shift": 0 },   // camera pose before auto-align
  "res": {
    "road":     { "width": 7.1, "offL": -2.3, "offR": 4.8, "kerbL": {...}, "kerbR": {...}, "nl": "...", "nr": "..." },
    "markings": [ ... ],
    "objects":  [ { "kind": "utility", "x": 0.61, "y": 0.74, "box": [x0,y0,x1,y1], "ground": true, "height": 9.1, "dist": 14.2 } ],
    "cars": [ ... ],
    "wires": { "wires": 2, "high": false }
  }
}
```

`x`, `y` and `box` are fractions of the image. For upright objects, (`x`, `y`) is the base. When importing, a newer `vision.at` replaces an older one.

### Objects

One entry per physical object, built from every photo that saw it:

```jsonc
{
  "id": "obj-…",
  "kind": "utility",              // lamp, utility, sign, signal, hydrant, drain, cabinet, bench, bin, mailbox, crosswalk, calming
  "type": "power_pole",           // suggested or chosen OSM preset
  "lat": -31.95, "lon": 115.86,   // best position
  "height": 9,
  "views":  [ { "o": "<photo id>", "x": 0.61, "y": 0.74, "box": [...], "dist": 14.2, "lat": ..., "lon": ... } ],
  "missed": ["<photo id>"],       // photos that should show it but didn't (after re-processing)
  "expected": 5,                  // photos whose view should include it
  "trips": 2, "spread": 0.6,      // separate passes; RMS scatter of the sightings in metres
  "conf": 0.84,
  "osm": { "id": "123", "label": "Power pole", "lat": ..., "lon": ... },  // matching OSM node within 5 m, if any
  "bumps": [ { "trip": "...", "t": 0, "lat": 0, "lon": 0, "peak": 6.2, "pair": true, "kmh": 36, "course": 0 } ],   // calming only: jolts felt while driving
  "drove": 3,                     // calming only: drives with motion data that passed over the spot
  "values": { "hazard": "hump" }, // signs kept in the survey: parking_sign, warning_sign, advisory_speed, other_sign
  "keep": true,                   // approved but not uploaded
  "status": "new|reprocess|reprocessed|approved|ignored",
  "refined": true, "moved": false, "notes": ["…"],
  "updated": 1730000000000
}
```

When importing, the newer `updated` wins. A processor should leave reviewed objects alone: keep `status`, `type`, and the position of anything `approved`, `ignored`, or `moved`.

## What a native processor should do

These steps match the Process tab, so results stay comparable:

1. **Refine drives.** Smooth each trail (constant-velocity Kalman filter plus RTS smoother), then re-time and re-place photos along it.
2. **Segment** each photo with a Mapillary Vistas model (the app uses MaskFormer ResNet-50; anything that outputs the same 65 classes works). Average normal and mirrored passes.
3. **Analyse the scene.** Find road edges and kerbs, fit tilt so the two edges run parallel, find markings, objects and wires.
4. **Auto-align** each photo to the OSM way it's on, using the turn, tilt and sideways shift the road edges imply.
5. **Build objects.** Cluster detections of the same kind within 3.5 m, count the photos that should have seen each one, and match it to OSM.
6. **Re-process flagged objects.** Crop around each object's expected position in every photo that should show it, segment the crop at higher resolution, and intersect the sight lines (least squares, dropping lines more than 1.5 m out). Only trust the result when the lines meet at 6° or more; otherwise use the ground-contact estimate.

A processor can be much faster than the browser. It can use the full photo resolution, run larger models, and process whole drives in parallel. The review steps stay in the app.
