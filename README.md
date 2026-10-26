# LocalityMap

A phone web app for surveying streets on foot or from a car and turning what you see into OpenStreetMap edits. It records where the camera was and which way it faced, lets you mark photos, groups everything by road or area for review, and uploads only what you approve.

It targets the tags [BeamNG.Earth](https://github.com/TecnaGamer/BeamNG.Earth) builds its world from, plus the neighbouring tags it is likely to use later. Photos stay on the phone; only tag changes go to OSM. The full survey (geotagged photos and camera poses) can be exported for future reprocessing.

Live app: https://yahms.github.io/localitymap/

---

## 1. Setup

### Host it
Camera, location and motion sensors only work over `https://`. This repository is served by GitHub Pages (Settings → Pages → Deploy from branch `main`, folder `/`). Open the address on the phone and add it to the home screen.

### Connect your OSM account
1. openstreetmap.org → your name → *My Settings* → *OAuth 2 applications* → *Register new application*.
2. Redirect URI: `https://yahms.github.io/localitymap/`. For the installed iPhone app also add `urn:ietf:wg:oauth:2.0:oob` on a second line.
3. Untick *Confidential application*. Tick *Read user preferences*, *Modify the map*, *Modify notes*.
4. Paste the Client ID into LocalityMap → Settings.

iPhone home-screen apps can't receive the sign-in redirect, so set *Sign-in method* to *Copy a code by hand* there. To rehearse, switch Settings → Server to the dev sandbox and register a second app on `master.apis.dev.openstreetmap.org`.

---

## 2. Capturing

The Capture tab is a full-screen camera with three controls under the picture (beside it in landscape):

| Control | What it does |
|---|---|
| **On foot \| Drive** switch | The active mode is filled green. Locked while a drive is recording. |
| **Main button** | Its shape shows its job: **Start** (turns on camera, compass and GPS) → white disc (on foot: take a photo) or red dot (drive: start recording) → red square (end the drive). |
| **⋯** | OSM roads on the camera, the plan map, video recording, an extra photo during a drive, importing photos, turning sensors off. |

The badge at the top always says where you are: grey **OFF**, green **ON FOOT**, amber **DRIVE · READY**, red **● REC 12:03**.

### On foot
Tap Start, hold the phone upright in portrait or landscape, wait for a good GPS fix and a steady heading, and take the photo. Green lines over the camera are the kerbs OSM implies (see Accuracy).

### In the car (drive mode)
Switch to Drive, mount the phone facing forward in landscape, tap Start, then the red dot before you set off. Tap the red square to end the drive. Keep LocalityMap on screen while driving.

| Speed | Rule (defaults, change in Settings) |
|---|---|
| below 5 km/h | no photos (avoids piles at lights) |
| 5–50 km/h | one photo every 15 m travelled |
| above 50 km/h | one photo every 2 s |

- **Heading** comes from the GPS course over the ground while moving above about 15 km/h, plus a *mount offset* for a phone that isn't pointing exactly forward. In-car compasses are unreliable, so the compass is only used when slow.
- **Trail**: every GPS fix (position, accuracy, altitude, speed, course) and the phone's orientation five times a second are recorded for the whole drive.
- **Refine**: when the drive ends, the app smooths the whole trail with a Kalman smoother, which uses fixes before *and after* each photo, and re-places every photo from it. On a simulated bend with ordinary phone GPS this cut position error from about 4.6 m to 1.9 m and heading error from 3.4° to 1.4°. Older drives can be refined from their card in Review (only drives recorded with 0.4 or later have a trail).
- **Video (optional)**: ⋯ → *Record video too*, set before you start recording. About 19 MB per minute. In review, a drive photo gets a **Video** bar to step ±0.2 s or ±1 s and *Add as a new photo*, for example to catch a sign at the best distance or a frame without motion blur. The new photo's position and orientation come from the refined trail. Video can't make frames sharper than the stills (the stills are frames from the same camera stream); it gives you every frame in between. The drive card's *Video* button saves the whole file.
- The screen is kept awake. iOS and Android stop web apps when the screen locks or you switch apps.
- Photos are about 300 KB each; the HUD shows storage used.

### Import
Photos from the gallery work too. iPhone photos usually carry position and camera direction in their EXIF data; others can be positioned on the map by hand.

### Repeat passes
One pass is a guess; a second pass, ideally in the other direction, is a check. LocalityMap tracks every road you drive in 40 m stretches, per direction of travel, and counts how many separate drives covered each stretch (a photo covers the ~30 m the camera sees ahead). The goal is **2 passes in every direction traffic can use** (one-way streets, roundabouts and motorways only need their own direction); change it under Settings → *Passes wanted per direction*.

While driving, the panel under the heading shows:
- **On**: the road you're on, which way, and which pass this is.
- **Next**: the nearest stretch still needing a pass, which direction to drive it, and an arrow pointing to it.
- **Plan**: a small map with every road you've surveyed: red has a direction with no passes, amber is partly done, green is done.

Turn-by-turn navigation isn't built in. Switching to a maps app would stop the camera, because phones pause web apps in the background. Use the arrow and plan map, or a second device (car screen or another phone) for navigation.

### Import
Photos from the gallery work too. iPhone photos usually carry position and camera direction in their EXIF data; others can be positioned on the map by hand.

---

## 3. Reviewing

The **Review** tab has four views.

- **Photos**: drives (with every photo) and single photos. Open one to mark it.
- **By road**: every OSM road that appears in your photos (the road a drive photo was on, or the road a hand photo looks along), with the photos in order. Open a road to get the **road sheet**: flip through all its photos with that road highlighted, fill in one set of road details for the whole way, and approve everything on it at once. If marks on different photos disagree (say `lanes=2` on one and `3` on another), the road sheet flags the conflict and their individual road marks are merged into the one change when you save.
- **By area**: about 450 m squares named after their main streets, listing every change in the area for bulk approval.
- **Passes**: a map and list of every road driven, showing how many passes each direction has.

### Letting the camera do it (vision)
Lining up kerb lines by hand on every photo doesn't scale, and a correction on one photo doesn't fit the next, because each photo has its own GPS and tilt error. So LocalityMap looks at the photos itself.

**Everything runs on your device, with no accounts and no running costs.** *Analyse* on a photo, a road sheet or a drive card runs a street-scene model ([MaskFormer trained on Mapillary Vistas](https://huggingface.co/onnx-community/maskformer-resnet50-vistas)) in the browser using [Transformers.js](https://github.com/xenova/transformers.js/). The model is downloaded once from Hugging Face (165 MB, or 83 MB for *Lighter*), then works offline. No photo ever leaves the device.

It labels every pixel with one of 65 street classes, including road, **kerb**, **kerb cut**, **lane marking**, crossing markings, footpath, verge, vegetation, wall, fence, guard rail, barrier, **utility pole**, **street light**, sign, traffic light, catch basin, manhole, fire hydrant, junction box, bench, bin, post box, vehicles, people and sky.

*Best* quality (the default) runs each photo twice, normal and mirrored, and averages the two, and labels at full resolution rather than the model's quarter-size grid. That took 1.7 s a photo on a computer with a graphics chip in testing. Phones are slower, so analyse long drives on a computer (see *Reviewing on an iPad or computer*).

From the labels the app works out:

| From the photo | How | Used for |
|---|---|---|
| Both road edges | where road surface (incl. markings, parking, drains) meets kerb, footpath, verge, wall… on each row | everything below |
| True camera tilt | the tilt at which both edges come out parallel on the ground | fixes the phone's tilt reading |
| Road angle to the camera | direction of the edges | fixes the heading against the OSM road |
| Where the car sat across the road | distance to each edge | fixes the sideways GPS error |
| Road width, kerb to kerb | distance between the edges | `width`, median over all photos of the road |
| Kerb or not, each side | the kerb class at the edge (kerb cut = lowered) | `kerb` |
| Kerb height and top width | fitted across views from different sideways distances (see below) | raised vs mountable vs flush |
| Footpath or verge beyond the kerb | the class past the kerb | `sidewalk` |
| Lane lines and their spacing | lane-marking pixels inside the road | `lane_markings`, estimated `lanes` |
| Street lights, utility poles, signs, signals, hydrants, drains, cabinets, benches, bins, post boxes, crossing markings | blobs of those classes, placed where they meet the ground; lamps and signs take the position of the pole they hang on | new points, grouped across photos and passes, checked against OSM |
| Fences, walls, guard rails, barriers | which side of the road they're on | listed per side |
| Overhead wires | thin dark lines against the sky | flagged so you can draw the lines |
| Vehicles across the road | where they meet the road | lane hints |

With *Line photos up automatically* on (Settings → Vision), every analysed photo corrects its own turn, tilt and sideways position against the OSM road, so there's no slider work. *What the app sees* on a photo shows the labels; *Undo* restores the original pose.

**Kerb height needs two directions.** A kerb's apparent width in a photo depends on its height, its top width and how far it is sideways from the camera, so one viewpoint can't separate height from width. Driving the road both ways sees each kerb from about 2 m and about 5 m away, and the app fits height and top width from those views. In testing this recovered a 150 mm barrier kerb and an 80 mm mountable kerb to within 3 mm. With only one direction you get a rough height, labelled as such, and no `kerb` suggestion.

**What it doesn't do automatically:**
- **Read signs.** On-device text readers misread speed limits in testing (a 60 came out as 30), and a wrong limit is worse than none. Each sign the model finds is shown as a crop next to *Stop / Give way / Speed limit [number]* for you to pick.
- **Tell power lines from phone lines, or low from high voltage.** Wires and utility poles are found; drawing the lines and tagging them stays with you.
- **Tell trees from hedges.** Vegetation isn't split into individual trees.

Everything found arrives as a suggestion marked *found by the camera*. It goes through the same review and approval as your own marks, and is never uploaded until you approve it. Changesets that include such marks are tagged `source=survey;camera`. Mention the camera assistance in your changeset comment too; OSM's community expects that for machine-assisted edits.

### Checking against other passes (expected vs seen)
From a road sheet or the Passes view, *Check against passes* walks through everything that should be visible along that road:
- objects already in OSM within 25 m of it: signals, signs, crossings, street lights, poles, hydrants, bus stops, cabinets, trees
- new points you marked

For each one it picks the best photo from a *different* drive (the photo a point was marked on doesn't count as confirmation), rings the spot where it should appear, and you answer **Seen it**, **Not there** or **Can't tell**. On a computer use the keys `S`, `N`, `C`, `O` (other photo) and the arrow keys.

The summary then:
- lets you approve your new points that were seen again on another drive
- flags your points that weren't there on a later drive, so you can check them before approving
- lists OSM objects not visible on two or more separate drives and never seen. Deleting map data needs care, so it offers to add an OSM note for other mappers rather than deleting.

The photo overlay now also shows OSM point objects (light blue rings with a short pole), so missing or misplaced ones stand out while marking.

Spotting objects is done by you, not automatically. Automatic detection is planned for the native app (see section 5).

### Reviewing on an iPad or computer
Survey data lives on the device that captured it. To review elsewhere:
1. On the phone: Settings → *Export with photos* (or *Export* on a drive card or area) and send the zip by AirDrop, Files, email or cable.
2. On the iPad or computer: open https://yahms.github.io/localitymap/ → Review → *Import from another device*.
3. Review there, using the bigger screen and keyboard shortcuts. You can sign in and upload to OSM from that device directly.
4. To bring decisions back to the phone, use *Export reviews only* on the reviewing device and import it on the phone. It's small (no photos) and merges mark by mark, with the most recent change winning.

There's no automatic sync. That would need a server or a cloud drive connection, which this app deliberately doesn't have.

### Marking a photo
Tap the photo where the thing is and choose what it is (list below). The app traces your tap as a line of sight from the camera, finds the OSM road or building it hits, and for new points estimates the distance from the camera tilt (assumes flat ground and that you tapped the base of the object).

### Accuracy
OSM stores a road as one line down its middle. The overlay turns that into both **kerb lines** using the road's `width` tag (solid), or an estimate from its lane count or road type (dashed). Building footprints are pink, with their roof height dashed if OSM knows it. Line the kerbs up with the real ones using the three adjustments under the photo, in this order:

1. **Turn**: until the road runs in the right direction.
2. **Shift**: moves the camera sideways in 0.25 m or 1 m steps. GPS is often a lane or two off.
3. **Tilt**: until the far kerbs meet at the right height. Phone tilt readings can be a degree out, and that matters.

Every mark on the photo moves with these corrections.

If the kerbs only line up when the lines are wider or narrower than the real road, OSM's width is wrong (or missing): fix it with the measure tool.

- **Measuring width**: in a Road mark, *Measure the width on the photo*, then tap one kerb and then the other where they meet the road surface. Only the part across the road is counted. A 1° tilt error turns a 7.0 m road into 5.7 m at 15 m away, so line up the kerbs first and measure as close to the camera as you can. A tape measure is still better where it's safe.
- **Drive heading**: if a drive photo needs a heading correction, *Apply to drive* applies it to every GPS-course photo of that drive and stores it as the mount offset for future drives.
- **Position**: drag the blue camera arrow or any numbered point on the map. Esri imagery (licensed for OSM editing) is available in the map's layer switcher.
- **Field of view**: if marks near the photo edges land consistently too far sideways, adjust *Camera field of view* in Settings.
- **Declination**: compasses read magnetic north; enter your local declination in Settings.

---

## 4. Data points collected

What BeamNG.Earth uses today comes from its README (roads with lanes, widths, speed limits and markings, sidewalks and curbs, curb ramps, storm drains, traffic islands, roundabouts, shoulders, toll booths, retaining walls, street lights, utility poles, traffic signals, stop and speed-limit signs, bridges by type, buildings with real heights and roofs). Everything else is collected because it's cheap to record while you're there and likely to matter in later versions.

"How it's handled" uses these terms:
- **Way field**: a value on an existing OSM way, filled on a photo or once per road in the road sheet; the upload changes that tag on the way.
- **Point on road**: a new node inserted into the road's geometry where your line of sight crosses it.
- **Point**: a new free-standing node, placed by line of sight and tilt distance.
- **Auto**: worked out by the app, editable.

### Roads (`highway=*` ways)

| Data | OSM tag | BeamNG.Earth today | How it's handled |
|---|---|---|---|
| Lane count | `lanes` | yes (lane count) | Way field |
| Lanes per direction | `lanes:forward`, `lanes:backward` | likely (lane layout) | Way field |
| Road width | `width` | yes (widths) | Way field; measure kerb to kerb |
| Speed limit | `maxspeed` | yes (AI and signs) | Way field |
| Surface | `surface` | yes (e.g. cobblestone streets) | Way field |
| Smoothness | `smoothness` | future | Way field |
| One way | `oneway` | yes (AI one-way streets) | Way field |
| Roundabout | `junction=roundabout` | yes | Way field |
| Footpaths | `sidewalk` | yes (sidewalks and curbs) | Way field |
| Bike lanes | `cycleway:both` | future | Way field |
| Street parking | `parking:both` | future (it parks cars along streets) | Way field |
| Street lighting | `lit` | future | Way field |
| Lane markings | `lane_markings` | yes (markings) | Way field |
| Sealed shoulder | `shoulder` | yes (motorway shoulders) | Way field |
| Kerb type | `kerb` | yes (curbs) | Way field |
| Median / divider | `divider` | future (traffic islands) | Way field |
| Turn lanes | `turn:lanes` | future | Note (needs per-lane editing) |
| Missing or re-routed road | geometry | — | Note (draw it in iD/JOSM) |

### Bridges (ways with `bridge=*`)

| Data | OSM tag | BeamNG.Earth today | How it's handled |
|---|---|---|---|
| Structure | `bridge:structure` | yes (beam, truss, arch, cable-stayed, suspension) | Way field |
| Material | `material` | future | Way field |
| Signed clearance | `maxheight` | future | Way field |
| Deck width | `width` | likely | Way field |

### Traffic control (points on the road)

| Data | OSM tags | BeamNG.Earth today | How it's handled |
|---|---|---|---|
| Traffic signals | `highway=traffic_signals` + `direction` | yes | Point on road; direction Auto |
| Stop sign | `highway=stop` + `direction` | yes | Point on road; direction Auto (the sign faced the camera) |
| Give way sign | `highway=give_way` + `direction` | likely | Point on road; direction Auto |
| Speed limit sign | `traffic_sign=maxspeed` + `maxspeed` + `direction` | yes (speed-limit signs) | Point on road; direction Auto |
| Pedestrian crossing | `highway=crossing` + `crossing`, `crossing:markings`, `kerb`, `tactile_paving` | likely (curb ramps) | Point on road |
| Traffic calming | `traffic_calming=hump/bump/table/cushion/island/chicane/rumble_strip` | future | Point on road |
| Toll booth | `barrier=toll_booth` | yes | Point on road |
| Gate, boom, bollard, cattle grid | `barrier=*` | future | Point on road |

### Street furniture (free-standing points)

| Data | OSM tags | BeamNG.Earth today | How it's handled |
|---|---|---|---|
| Street light | `highway=street_lamp` + `lamp_mount` | yes | Point |
| Power pole | `power=pole` + `material` | yes (poles with wires) | Point |
| Other utility pole | `man_made=utility_pole` | yes | Point |
| Storm drain | `man_made=manhole` + `manhole=drain` | yes | Point |
| Fire hydrant | `emergency=fire_hydrant` + `fire_hydrant:type` | future | Point |
| Bus stop | `highway=bus_stop` + `shelter`, `bench` | future | Point |
| Street cabinet | `man_made=street_cabinet` | future | Point |
| Tree | `natural=tree` + `leaf_type`, `height` | yes (trees; it uses a canopy model today) | Point |

### Buildings and walls (existing ways)

| Data | OSM tag | BeamNG.Earth today | How it's handled |
|---|---|---|---|
| Building type | `building` | yes (regional styles, churches) | Way field |
| Storeys | `building:levels` | yes (real heights) | Way field |
| Height | `height` | yes | Way field; compare with the dashed roof line in the photo |
| Roof shape | `roof:shape` | yes (roofs) | Way field |
| Roof storeys / height | `roof:levels`, `roof:height` | likely | Way field |
| Wall material | `building:material` | yes (siding, brick, stucco looks) | Way field |
| Roof material | `roof:material` | likely | Way field |
| Wall / roof colour | `building:colour`, `roof:colour` | future | Way field (text) |
| Wall, retaining wall, fence, guard rail | `barrier`, `height`, `material` | yes (retaining walls) | Way field on existing barrier ways |
| Missing building | geometry | — | Note |

### Also recorded with every photo (exported, not uploaded)

| Data | Where it goes | Why |
|---|---|---|
| Position, GPS accuracy, speed, GPS course, altitude | `survey.json`, photo EXIF | re-locate photos later; Panoramax/Mapillary upload |
| Full GPS trail and orientation samples for each drive | `trails.json` | re-run better smoothing; video frame positions |
| Camera direction, tilt and roll (full orientation as three vectors) | `survey.json`, direction in EXIF | rebuild the view for 3D/AR work |
| Heading source and any manual correction | `survey.json` | judge reliability |
| Field of view, camera height | `survey.json` | measurements from photos |
| Every mark, including rejected ones | `survey.json` | redo decisions with better tools |

Export from a drive card, an area, or Settings → *Export everything*. The zip holds geotagged JPEGs, `survey.json` and `cameras.geojson`.

---

## 5. Where a web app stops

The web app is fine for the survey-review-upload loop. These are the limits you'll hit, and what a native app would add.

| Limit in the browser | Effect | Native fix |
|---|---|---|
| iPhone Safari gives an ambiguous compass value in landscape | LocalityMap learns the compass offset while you hold the phone upright in portrait or flat, then carries it into landscape with the gyroscope. It needs that portrait moment after each start. | Core Motion `xTrueNorthZVertical` gives full orientation against true north in any pose |
| App is suspended when the screen locks or you switch apps | Drive mode must stay on screen | Background location; a foreground-only camera session is still needed, but it survives notifications |
| No control over shutter speed, focus or lens; no lens calibration | Motion blur at speed, estimated field of view; video is compressed frames of the same stream | AVFoundation: fast shutter, fixed focus, per-frame camera intrinsics, ultra-wide lens |
| GPS about 1 Hz, no raw satellite data, no barometer | Live positions are extrapolated; after the drive, the trail smoother fixes most of it. Altitude is GPS-only (±10 m or worse) | ARKit visual-inertial tracking gives centimetre-level relative motion between photos |
| No AR on iPhone browsers (WebXR AR is Android Chrome only) | The live overlay is a projection of flat ground, not true AR | ARKit: plane detection, depth (LiDAR on Pro models), anchored 3D overlays |
| Only one app runs in front, and web apps pause in the background | No turn-by-turn navigation alongside capture | CarPlay or in-app navigation in the native capture app |
| Vision models in the browser run one photo at a time, and big models are slow on phones | Long drives are best analysed on a computer; signs are read by you | Core ML runs larger models, including sign readers, on every video frame in real time |
| Browser storage can be cleared by iOS for sites not installed to the home screen | Lost surveys if not installed | Files on device, iCloud backup |

**Do we need Xcode yet?** Not for what's here. You'll need a native iPhone app when you want any of: true AR overlays and a 3D model built from the drive, automatic detection while driving, or reliable capture with the screen off. That means a Mac with Xcode and an Apple Developer account (free for installing on your own phone for 7 days at a time; USD 99/year for TestFlight and longer installs).

A practical route is to keep this web app as the review and upload desk, and later build a small native capture app (Swift + ARKit) that writes the same `survey.json` format. Photos from either then flow through the same review.

### Roadmap toward 3D / AR
1. Now: geotagged photos with full camera orientation, OSM overlay on photos and on the live camera.
2. Now: repeat passes in both directions with expected-vs-seen checks, which give confirmed observations from independent viewpoints.
3. Next (web): reconstruct points seen in two or more drive photos by triangulating lines of sight; build simple extruded buildings from OSM footprints plus your heights and roofs, shown in the overlay.
4. Native: automatic detection fills in the expected-vs-seen answers, and ARKit session during drives for precise camera paths, LiDAR depth where available, live 3D model of the street placed over the camera view.

---

## OSM etiquette

- You review and approve every change; nothing is uploaded automatically, so this is ordinary manual mapping.
- Only add what you saw on the ground. Don't copy from Google Maps or Street View.
- Keep each upload to one area with a clear comment saying where; the app drafts one.
- Drive mode is for passengers or a fixed mount set up before the trip. Don't mark photos while driving.

## When it shows up in BeamNG.Earth

BeamNG.Earth reads roads and buildings from Overture Maps and OpenStreetMap, with lanes, widths and speed limits from OSM via OSM US Layercake. Edits appear after those sources next refresh and after BeamNG.Earth's download cache for that area is cleared.

## Files

- `index.html`: the whole app
- `sw.js`: offline cache for the app shell and libraries
- `manifest.webmanifest`, `icon*`: home-screen install
