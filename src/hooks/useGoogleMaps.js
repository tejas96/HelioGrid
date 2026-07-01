import { useState, useEffect, useRef, useCallback } from "react";
import { loadGoogleMapsScript, initMap, addMarker, removeMarker } from "../services/mapsService";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export default function useGoogleMaps({ mapContainerRef, searchInputRef, onLocationSelect }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);

  const placeMarker = useCallback((latLng, address = "") => {
    if (!mapRef.current) return;
    removeMarker(markerRef.current);
    const position = {
      lat: typeof latLng.lat === "function" ? latLng.lat() : latLng.lat,
      lng: typeof latLng.lng === "function" ? latLng.lng() : latLng.lng,
    };
    markerRef.current = addMarker(mapRef.current, position);
    if (onLocationSelect) {
      onLocationSelect({ ...position, address });
    }
  }, [onLocationSelect]);

  useEffect(() => {
    if (!mapContainerRef?.current) return;

    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY)
      .then(() => {
        const defaultCenter = { lat: 28.6139, lng: 77.2090 };
        mapRef.current = initMap(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 18,
        });

        mapRef.current.addListener("dblclick", (e) => {
          e.stop();
          placeMarker(e.latLng);
        });

        setIsLoaded(true);
      })
      .catch((err) => {
        console.error("Google Maps failed to load:", err);
        setError("Failed to load Google Maps. Check your API key.");
      });

    return () => {
      removeMarker(markerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !searchInputRef?.current || !mapRef.current) return;
    if (autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
      types: ["geocode", "establishment"],
    });

    autocomplete.bindTo("bounds", mapRef.current);

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) return;

      if (place.geometry.viewport) {
        mapRef.current.fitBounds(place.geometry.viewport);
      } else {
        mapRef.current.setCenter(place.geometry.location);
        mapRef.current.setZoom(20);
      }

      setTimeout(() => {
        mapRef.current.setZoom(20);
        mapRef.current.setMapTypeId("satellite");
      }, 300);

      const position = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address || place.name || "",
      };

      placeMarker(position, position.address);
    });

    autocompleteRef.current = autocomplete;
  }, [isLoaded, searchInputRef, placeMarker]);

  const panTo = useCallback((lat, lng, zoom = 20) => {
    if (!mapRef.current) return;
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(zoom);
  }, []);

  const clearMarker = useCallback(() => {
    removeMarker(markerRef.current);
    markerRef.current = null;
  }, []);

  return { isLoaded, error, map: mapRef.current, panTo, clearMarker, placeMarker };
}