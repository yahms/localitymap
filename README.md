# LocalityMap

A phone web app for surveying streets and turning what you see into OpenStreetMap edits. It records where you stand and which way the camera faces, lets you tap the photo on what is wrong or missing, and turns each mark into a proposed OSM change you review before anything is sent.

It is aimed at the tags BeamNG.Earth reads: lane counts, road width, speed limits, surface, footpaths, lighting, lane markings, building storeys / height / roof shape, plus street lights, traffic signals, stop and give-way signs, crossings, speed humps, power poles and trees.

Everything runs on the phone. Photos never leave it; only the tag changes go to OSM.

## 1. Host it (5 minutes, free)

Camera, GPS and compass only work on an `https://` page, so put these files on any static host:

**GitHub Pages**
1. Create a new public repository, e.g. `localitymap`.
2. Upload every file in this folder (Add file → Upload files).
3. Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
4. After a minute the app is at `https://<your-username>.github.io/localitymap/`.

Netlify Drop or Cloudflare Pages work the same way (drag the folder in).

On the phone, open the address and add it to the home screen (Android: menu → *Install app*; iPhone: Share → *Add to Home Screen*).

## 2. Connect your OSM account

1. Sign in at openstreetmap.org → your name → *My Settings* → *OAuth 2 applications* → *Register new application*.
2. Name: `LocalityMap (personal)`.
3. Redirect URI: the exact address from step 1, e.g. `https://<your-username>.github.io/localitymap/`. If you will use the installed app on an iPhone, add a second line: `urn:ietf:wg:oauth:2.0:oob`.
4. **Untick** *Confidential application*.
5. Tick *Read user preferences*, *Modify the map* and *Modify notes*.
6. Copy the **Client ID** into the app's Settings.

To practise first, choose *Dev sandbox* in Settings and register a second application on `https://master.apis.dev.openstreetmap.org` (separate account). The sandbox has almost no map data, so it is only useful for testing the upload of new points.

**iPhone home-screen app:** iOS opens sign-in pages outside the installed app, so the automatic return does not reach it. Set *Sign-in method* to *Copy a code by hand*, sign in, and paste the code OSM shows you. In Safari (not installed) the automatic method works.

## 3. Survey

1. **Capture.** Tap *Start*, allow camera, location and motion. Stand still until GPS says *good fix* (±15 m or better) and the heading says *steady*, then take the photo. Hold the phone upright; the photo's centre line is the recorded heading.
2. **Mark.** Open the survey and tap the photo on the thing to fix:
   - *Road* / *Building*: pick the OSM way (the app suggests the one along that line of sight) and fill only the values you can see. Blank means "leave as is".
   - *Street light, power pole, tree*: tap where it meets the ground. The app estimates distance from the phone's tilt; adjust if needed.
   - *Signals, stop, give way, crossing, speed hump*: these are joined into the road itself at the point where your line of sight crosses it. Stop and give-way get a `direction` worked out from which way you were facing.
   - *Note*: anything you can't express as tags (e.g. "new roundabout, road layout changed"). Notes let other mappers fix it with aerial imagery.
3. **Review.** This is where accuracy comes from:
   - The photo shows OSM drawn over it: green lines are roads, pink are building footprints (dashed = roof height from OSM tags), yellow is anything you're editing. Labels show the current `lanes`, `width` and speed.
   - Use the heading buttons until the green road lines sit on the real road. Phone compasses are often 5–15° off, so this step matters; every mark moves with it.
   - Drag the blue camera arrow on the map if GPS put you on the wrong side of the street. Drag any numbered point to where it really is.
   - Read the warnings (possible duplicates, points landing on junction vertices, long distances), then *Approve* or *Reject* each change.
4. **Upload.** The Upload tab lists every approved change, fetches the current version of each road or building, writes a changeset comment for you, and sends it with `source=survey`. *Export .osc for JOSM* gives you a file to open in JOSM instead if you want a desktop check first.

## Getting accurate results

- **Width:** measure kerb to kerb with a tape or a measuring app where it's safe; don't guess from photos.
- **Lanes:** OSM `lanes` counts marked through lanes in both directions, not turning pockets or parking lanes.
- **Field of view:** if marks near the edge of the photo land consistently too far left or right, adjust *Camera field of view* in Settings.
- **Declination:** compasses read magnetic north. Look up your local declination (NOAA's calculator) and enter it in Settings; it is small in Perth but not zero.
- **Tilt distances** assume flat ground and that you tapped the base of the object. On slopes, drag the point on the map instead.

## OSM etiquette this app follows

- Every change is reviewed by you before upload; nothing is bulk or automatic, so this counts as normal manual mapping, not an automated edit.
- Only add what you saw on the ground. Don't copy from Google Street View or Google Maps; that breaks OSM's licence.
- Esri imagery in the map is licensed for OSM editing and is useful for positioning; the OSM map layer is the default.
- Keep changesets to one area and write a clear comment. The app drafts one; edit it to say where.

## When it shows up in BeamNG.Earth

BeamNG.Earth gets roads and buildings from Overture Maps and OpenStreetMap, with lane counts, widths and speed limits taken from OSM via OSM US Layercake. Those sources are rebuilt periodically, so your edits appear in-game after their next refresh and after you clear BeamNG.Earth's download cache for that area, not immediately.

## Files

- `index.html` – the whole app
- `sw.js` – offline cache for the app shell
- `manifest.webmanifest`, `icon*` – home-screen install
