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

### On foot
*Capture → On foot.* Hold the phone upright in portrait or landscape. Wait for a good GPS fix and a steady heading, then shoot. Green lines drawn over the live camera are the roads OSM already has; if they don't sit on the real road, the heading is off (see Accuracy below).

### In the car (drive mode)
*Capture → In the car.* Mount the phone facing forward in landscape, start drive mode before you move, then leave it alone.

| Speed | Rule (defaults, change in Settings) |
|---|---|
| below 5 km/h | no photos (avoids piles at lights) |
| 5–50 km/h | one photo every 15 m travelled |
| above 50 km/h | one photo every 2 s |

- **Heading** comes from the GPS course over the ground while moving above about 15 km/h, plus a *mount offset* for a phone that isn't pointing exactly forward. In-car compasses are unreliable (steel body, electronics, magnets in mounts), so the compass is only used when slow.
- **Position** is extrapolated from the last GPS fix to the moment of the shot, since fixes arrive about once a second (at 60 km/h that's up to 17 m).
- The screen is kept awake. iOS and Android stop web apps when the screen locks or you switch apps, so keep LocalityMap in front.
- Photos are about 300 KB each; the HUD shows storage used.

### Import
Photos from the gallery work too. iPhone photos usually carry position and camera direction in their EXIF data; others can be positioned on the map by hand.

---

## 3. Reviewing

The **Review** tab has three views.

- **Photos**: drives (with every photo) and single photos. Open one to mark it.
- **By road**: every OSM road that appears in your photos (the road a drive photo was on, or the road a hand photo looks along), with the photos in order. Open a road to get the **road sheet**: flip through all its photos with that road highlighted, fill in one set of road details for the whole way, and approve everything on it at once. If marks on different photos disagree (say `lanes=2` on one and `3` on another), the road sheet flags the conflict and their individual road marks are merged into the one change when you save.
- **By area**: about 450 m squares named after their main streets, listing every change in the area for bulk approval.

### Marking a photo
Tap the photo where the thing is and choose what it is (list below). The app traces your tap as a line of sight from the camera, finds the OSM road or building it hits, and for new points estimates the distance from the camera tilt (assumes flat ground and that you tapped the base of the object).

### Accuracy
- **Heading**: the overlay draws OSM roads and building outlines (dashed = roof height from OSM tags) into the photo using the recorded camera pose. Use the heading buttons until the green lines sit on the real road. Every mark on that photo moves with it.
- **Drive heading**: if a drive photo needs a correction, *Apply to drive* applies it to every GPS-course photo of that drive and stores it as the mount offset for future drives.
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
| Position, GPS accuracy, speed, GPS course | `survey.json`, photo EXIF | re-locate photos later; Panoramax/Mapillary upload |
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
| No control over shutter speed, focus or lens; no lens calibration | Motion blur at speed, estimated field of view | AVFoundation: fast shutter, fixed focus, per-frame camera intrinsics, ultra-wide lens |
| GPS about 1 Hz, no sensor fusion with motion | Positions between fixes are extrapolated | ARKit visual-inertial tracking gives centimetre-level relative motion between photos |
| No AR on iPhone browsers (WebXR AR is Android Chrome only) | The live overlay is a projection of flat ground, not true AR | ARKit: plane detection, depth (LiDAR on Pro models), anchored 3D overlays |
| On-device detection of signs, poles and lanes is slow in the browser | Everything is marked by hand | Core ML runs detection on every frame in real time |
| Browser storage can be cleared by iOS for sites not installed to the home screen | Lost surveys if not installed | Files on device, iCloud backup |

**Do we need Xcode yet?** Not for what's here. You'll need a native iPhone app when you want any of: true AR overlays and a 3D model built from the drive, automatic detection while driving, or reliable capture with the screen off. That means a Mac with Xcode and an Apple Developer account (free for installing on your own phone for 7 days at a time; USD 99/year for TestFlight and longer installs).

A practical route is to keep this web app as the review and upload desk, and later build a small native capture app (Swift + ARKit) that writes the same `survey.json` format. Photos from either then flow through the same review.

### Roadmap toward 3D / AR
1. Now: geotagged photos with full camera orientation, OSM overlay on photos and on the live camera.
2. Next (web): reconstruct points seen in two or more drive photos by triangulating lines of sight; build simple extruded buildings from OSM footprints plus your heights and roofs, shown in the overlay.
3. Native: ARKit session during drives for precise camera paths, LiDAR depth where available, live 3D model of the street placed over the camera view.

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
