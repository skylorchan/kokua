# Data sources

Every dataset the app ships is listed here with its URL, publisher, license, and the date
it was retrieved. Downloads run in CI (`.github/workflows/data.yml`, scripts in
`scripts/data/`) because the development container can't reach these hosts. Field names
were checked against the live services on 2026-10-25.

## Shipped in the app

| Dataset                                     | Publisher                                                                                   | URL                                                                                                                    | License / terms                                                                                                                       | Data date                                                                                                        | Retrieved  | File                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------- |
| Tsunami Evacuation Zones (layer 2)          | Hawaiʻi Statewide GIS Program (from the City and County of Honolulu and the other counties) | https://geodata.hawaii.gov/arcgis/rest/services/Hazards/MapServer/2                                                    | No license stated. Public records with the State's disclaimer: not warranted for content or accuracy, not a legal representation.     | Oʻahu April 2025; Hawaiʻi Island March 2025 (corrected Nov 2025); Kauaʻi March 2025; Maui, Molokaʻi, Lānaʻi 2013 | 2026-10-25 | `public/data/zones.geojson`                                 |
| Extreme Tsunami Evacuation Zones (layer 12) | Same                                                                                        | https://geodata.hawaii.gov/arcgis/rest/services/Hazards/MapServer/12                                                   | Same                                                                                                                                  | Same                                                                                                             | 2026-10-25 | `public/data/zones.geojson`                                 |
| Potential Hurricane Refuge Areas (Oʻahu)    | City and County of Honolulu, Department of Emergency Management                             | https://services.arcgis.com/tNJpAOha4mODLkXz/arcgis/rest/services/Potential_Emergency_Shelter_Edit_EOC/FeatureServer/0 | No license stated. Published publicly by the City (ArcGIS item `5dcbab301711462e8cdaf0a3b69436d6`); City disclaimer on its GIS items. | Layer updated 2026-08-14                                                                                         | 2026-10-25 | `public/data/places.geojson`                                |
| Active weather alerts                       | National Weather Service                                                                    | https://api.weather.gov/alerts/active?area=HI                                                                          | U.S. Government work, public domain                                                                                                   | Live                                                                                                             | Live       | Fetched by the app; last copy saved on the device           |
| Oʻahu basemap (zoom 0 to 14)                | Protomaps daily build `20261025.pmtiles`, made from OpenStreetMap                           | https://build.protomaps.com/                                                                                           | OpenStreetMap data: ODbL. Attribution "© OpenStreetMap contributors, Protomaps" is shown on the map.                                  | OSM as of 2026-10-25                                                                                             | 2026-10-25 | `public/tiles/oahu.pmtiles` (build recorded in `oahu.json`) |
| Map fonts (Noto Sans)                       | Noto Project, via protomaps/basemaps-assets                                                 | https://github.com/protomaps/basemaps-assets                                                                           | SIL Open Font License 1.1 (`public/map/fonts/OFL.txt`)                                                                                |                                                                                                                  | 2026-10-25 | `public/map/fonts/`                                         |
| Map icons (sprites)                         | protomaps/basemaps-assets, derived from tangrams/icons                                      | https://github.com/protomaps/basemaps-assets                                                                           | MIT (`public/map/sprites/LICENSE.md`)                                                                                                 |                                                                                                                  | 2026-10-25 | `public/map/sprites/`                                       |

### Notes on how the data is used

- **Zones** are simplified by about 1 m (`maxAllowableOffset` 0.00001°) and rounded to
  about 10 cm, which shrinks the download to 2.3 MB. A point exactly on an edge counts
  as inside. Sanity tests (`src/geo/realData.test.ts`) check known places: Waikīkī Beach
  and Hilo bayfront inside, Punahou School and UH Mānoa outside.
- **Refuge areas**: the layer's `Status`, `Open_`, and `Close_` fields are ignored on
  purpose. An offline copy can't know whether a site is open right now, and the app never
  implies it is. DEM's own cautions are shown: not every site opens, they have no
  supplies, and homes built 1995 or later outside hazard areas may be safer. Oʻahu only.
- **Alerts**: test and exercise messages, cancellations, and alerts replaced by a newer
  one in the same response are dropped. Text is shown in English as issued.

## Test fixtures (real data)

| File                                              | Source                                          | Captured   |
| ------------------------------------------------- | ----------------------------------------------- | ---------- |
| `src/features/alerts/fixtures/nws-active-HI.json` | https://api.weather.gov/alerts/active?area=HI   | 2026-10-25 |
| `src/features/alerts/fixtures/nws-recent-HI.json` | https://api.weather.gov/alerts?area=HI&limit=50 | 2026-10-25 |

Hand-written fixtures in unit tests (for cases the real responses didn't contain, like
cancellations and updates) are labeled "Test fixture only" in the test files.

## Text content

| Content                                          | Source                                                             | Checked                                    |
| ------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------ |
| Natural tsunami warning signs                    | National Weather Service, https://www.weather.gov/safety/tsunami   | Written in session 1; not re-checked since |
| 14-day kit, 1 gallon of water per person per day | Hawaiʻi Emergency Management Agency, https://dod.hawaii.gov/hiema/ | 2026-10-25                                 |
| Refuge area cautions                             | Honolulu DEM's description of the refuge area layer                | 2026-10-25                                 |

## Looked at and not used

| Dataset                                                                   | Why not                                                                                                                        |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| HIFLD National Shelter System Facilities (FEMA / American Red Cross)      | All 234 Hawaiʻi records were last verified in 2008-2009.                                                                       |
| Honolulu "Potential Emergency Shelters" (`Public_Safety/FeatureServer/5`) | No longer in the City's service as of 2026-10-25 (the service was last changed 2026-07-28). The refuge area layer replaces it. |
| Pacific Disaster Center `Potential_Emergency_Shelters_PDC`                | A third-party copy last edited 2024; the City's own layer is newer.                                                            |
| Tsunami Safe Zones (layers 11 and 13)                                     | Not needed yet. Could show where to go, as a later feature.                                                                    |
