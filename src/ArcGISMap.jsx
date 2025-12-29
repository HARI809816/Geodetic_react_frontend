import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import SceneView from "@arcgis/core/views/SceneView";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import DistanceMeasurement2D from "@arcgis/core/widgets/DistanceMeasurement2D";
import AreaMeasurement2D from "@arcgis/core/widgets/AreaMeasurement2D";
import Expand from "@arcgis/core/widgets/Expand";
import Home from "@arcgis/core/widgets/Home";
import Bookmarks from "@arcgis/core/widgets/Bookmarks";
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery";
import Bookmark from "@arcgis/core/webmap/Bookmark";
import Viewpoint from "@arcgis/core/Viewpoint";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import esriConfig from "@arcgis/core/config";

// 🔴 OPTIONAL: Add API key here
const ARCGIS_API_KEY = "AAPTxy8BH1VEsoebNVZXo8HurAU2wRtTCz35rS0IvyV5k0_FmOjKifjQ4MXaetOWAPxQ99ta0HCHYBSsLmJ-RxrEVoyLsT6hCItuii1Wq0Ctiu8ofOMIIcBYiR8_N3HQmOSC4MrerZZW_MiUovETiVP-I6qSZhn0k8qO1SF990cDX26ydD9ug32faqQlUjvebO0WHRrwPN3h0mdKEKlKMAZE8hjWCQHcEG7BM34DXJKiL7A.AT1_B2uSZ31B"; // "YOUR_API_KEY_HERE"

const ArcGISMap = forwardRef(({ date, basemap, viewMode, mapInfo }, ref) => {
  const mapDiv = useRef(null);
  const viewRef = useRef(null);
  const layerRef = useRef(null);
  const searchLayerRef = useRef(null);
  const bookmarksWidgetRef = useRef(null);

  const [showCoordinates, setShowCoordinates] = useState(false);
  const showCoordinatesRef = useRef(false);
  const frozenRef = useRef(false);

  const hasApiKey = Boolean(ARCGIS_API_KEY);
  const HISTORY_KEY = "station-map-history";

  useEffect(() => {
    showCoordinatesRef.current = showCoordinates;
  }, [showCoordinates]);

  // Apply API key ONLY if present
  useEffect(() => {
    if (hasApiKey) {
      esriConfig.apiKey = ARCGIS_API_KEY;
    }
  }, [hasApiKey]);

  const saveHistory = (widget) => {
    if (!widget) return;
    // Explicitly serialize to ensure we capture the full viewpoint state
    const bookmarksData = widget.bookmarks.map(b => ({
      name: b.name,
      viewpoint: b.viewpoint ? b.viewpoint.toJSON() : null
    })).toArray();

    console.log("Saving history:", bookmarksData);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(bookmarksData));
  };

  useImperativeHandle(ref, () => ({
    addBookmark: () => {
      const view = viewRef.current;
      const widget = bookmarksWidgetRef.current;
      if (!view || !widget) return;

      const name = prompt("Enter bookmark name:");
      if (!name) return;

      const newBookmark = new Bookmark({
        name: name,
        viewpoint: view.viewpoint.clone()
      });

      widget.bookmarks.add(newBookmark);
      saveHistory(widget);
    },
    deleteBookmark: () => {
      const widget = bookmarksWidgetRef.current;
      if (!widget) return;

      const name = prompt("Enter name of bookmark to delete:");
      if (!name) return;

      const bookmarkToDelete = widget.bookmarks.find(b => b.name === name);

      if (bookmarkToDelete) {
        widget.bookmarks.remove(bookmarkToDelete);
        saveHistory(widget);
        alert(`Bookmark "${name}" deleted.`);
      } else {
        alert(`Bookmark "${name}" not found.`);
      }
    }
  }));

  const popupTemplate = {
    title: "{station}",
    content: `
      <b>Latitude:</b> {latitude}<br/>
      <b>Longitude:</b> {longitude}<br/>
      <b>Height:</b> {height_m} m<br/>
      <b>Date:</b> {date}
    `
  };

  const renderer2D = {
    type: "simple",
    symbol: {
      type: "simple-marker",
      size: 6,
      color: "blue",
      outline: { color: "white", width: 0.5 }
    }
  };

  const renderer3D = {
    type: "simple",
    symbol: {
      type: "point-3d",
      symbolLayers: [{
        type: "object",
        width: 30000,   // Width in meters
        height: 100000, // Height in meters
        resource: { primitive: "inverted-cone" },
        material: { color: "blue" }
      }]
    }
  };

  useEffect(() => {
    if (!mapDiv.current) return;

    const map = new Map({
      basemap: basemap || "gray-vector"
    });

    let view;
    if (viewMode === "3d") {
      view = new SceneView({
        container: mapDiv.current,
        map,
        qualityProfile: "medium",
        camera: {
          position: { x: 0, y: 20, z: 15000000 },
          tilt: 0,
          heading: 0
        }
      });
    } else {
      view = new MapView({
        container: mapDiv.current,
        map,
        center: [0, 20],
        zoom: 2
      });
    }

    viewRef.current = view;

    const searchLayer = new GraphicsLayer();
    searchLayerRef.current = searchLayer;
    map.add(searchLayer);

    view.ui.add(new Home({ view }), "top-left");

    const bookmarksWidget = new Bookmarks({
      view,
      editingEnabled: true
    });

    // Load bookmarks from localStorage
    const savedBookmarks = localStorage.getItem(HISTORY_KEY);
    if (savedBookmarks) {
      try {
        const parsed = JSON.parse(savedBookmarks);
        console.log("Loaded history:", parsed);

        parsed.forEach(data => {
          let bookmarkOptions = { name: data.name };

          if (data.viewpoint) {
            // Explicitly rehydrate the Viewpoint object
            bookmarkOptions.viewpoint = Viewpoint.fromJSON(data.viewpoint);
          }

          bookmarksWidget.bookmarks.add(new Bookmark(bookmarkOptions));
        });
      } catch (e) {
        console.error("Failed to load bookmarks", e);
      }
    }

    // Listen for changes in the widget UI (if user adds/deletes via widget directly)
    bookmarksWidget.bookmarks.on("change", () => {
      saveHistory(bookmarksWidget);
    });

    bookmarksWidgetRef.current = bookmarksWidget;

    view.ui.add(
      new Expand({
        view,
        content: bookmarksWidget,
        expandIcon: "bookmark",
        group: "top-right"
      }),
      "top-right"
    );

    const basemapGallery = new BasemapGallery({
      view
    });

    view.ui.add(
      new Expand({
        view,
        content: basemapGallery,
        expandIcon: "basemap",
        group: "top-right"
      }),
      "top-right"
    );

    const distance = new DistanceMeasurement2D({ view });
    const area = new AreaMeasurement2D({ view });

    view.ui.add(
      [
        new Expand({ view, content: distance, expandIcon: "measure-line", group: "top-right" }),
        new Expand({ view, content: area, expandIcon: "measure-area", group: "top-right" })
      ],
      "top-right"
    );

    const clearBtn = document.createElement("button");
    clearBtn.className = "esri-widget esri-widget--button esri-icon-trash";
    clearBtn.title = "Clear Measurements";
    clearBtn.onclick = () => {
      distance.viewModel.clear();
      area.viewModel.clear();
    };
    view.ui.add(clearBtn, "top-right");

    const coordBtn = document.createElement("button");
    coordBtn.className = "esri-widget esri-widget--button esri-icon-locate";
    coordBtn.onclick = () => {
      frozenRef.current = false;
      setShowCoordinates(v => !v);
    };
    view.ui.add(coordBtn, "top-left");

    window.zoomToLatLon = (lat, lon) => {
      view.goTo(
        { center: [lon, lat], zoom: 12 },
        { duration: 2500, easing: "in-out-cubic" }
      );
      searchLayer.removeAll();
      searchLayer.add(
        new Graphic({
          geometry: { type: "point", longitude: lon, latitude: lat },
          symbol: {
            type: "simple-marker",
            color: "red",
            size: 10,
            outline: { color: "white", width: 2 }
          }
        })
      );
    };

    const pointerHandler = view.on("pointer-move", evt => {
      const p = view.toMap(evt);
      if (!p) return;

      if (showCoordinatesRef.current && !frozenRef.current) {
        document.getElementById("lat").innerText = p.latitude.toFixed(6);
        document.getElementById("lon").innerText = p.longitude.toFixed(6);
      }
    });

    view.on("double-click", evt => {
      if (!showCoordinatesRef.current) return;
      evt.stopPropagation();
      frozenRef.current = !frozenRef.current;
    });

    return () => {
      pointerHandler.remove();
      view.destroy();
    };
  }, [viewMode, basemap]);

  useEffect(() => {
    if (!viewRef.current) return;
    const view = viewRef.current;

    // Cleanup previous layer
    if (layerRef.current) {
      view.map.remove(layerRef.current);
      layerRef.current = null;
    }

    if (mapInfo === "earthquake") {
      const url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson";

      const template = {
        title: "Earthquake Info",
        content: "Magnitude {mag} {type} hit {place} on {time}",
        fieldInfos: [
          {
            fieldName: "time",
            format: {
              dateFormat: "short-date-short-time",
            },
          },
        ],
      };

      const renderer = {
        type: "simple",
        field: "mag",
        symbol: {
          type: "simple-marker",
          color: "orange",
          outline: {
            color: "white",
          },
        },
        visualVariables: [
          {
            type: "size",
            field: "mag",
            stops: [
              { value: 2.5, size: "4px" },
              { value: 8, size: "40px" },
            ],
          },
        ],
      };

      const geojsonLayer = new GeoJSONLayer({
        url,
        popupTemplate: template,
        renderer,
        copyright: "USGS Earthquakes",
      });

      layerRef.current = geojsonLayer;
      view.map.add(geojsonLayer);

    } else {
      // Station Map Logic
      if (!date) return;

      console.log(date);

      const layer = new GeoJSONLayer({
        url: `https://geodetic-django-backend.vercel.app/api/stations/${date}/`,
        outFields: ["*"],
        popupTemplate,
        renderer: viewMode === "3d" ? renderer3D : renderer2D
      });

      layerRef.current = layer;
      view.map.add(layer);
    }
  }, [date, viewMode, mapInfo]);

  return (
    <>
      {showCoordinates && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            background: "white",
            padding: "8px",
            borderRadius: 6,
            zIndex: 10
          }}
        >
          <div>Lat: <span id="lat">--</span></div>
          <div>Lon: <span id="lon">--</span></div>
        </div>
      )}
      <div ref={mapDiv} style={{ height: "100vh", width: "100%" }} />
    </>
  );
});

export default ArcGISMap;