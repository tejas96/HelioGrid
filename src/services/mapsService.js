export const loadGoogleMapsScript = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }

    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google.maps));
      existingScript.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export const initMap = (container, options = {}) => {
  const defaultOptions = {
    zoom: 20,
    mapTypeId: "satellite",
    tilt: 0,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: true,
    rotateControl: false,
  };
  return new window.google.maps.Map(container, { ...defaultOptions, ...options });
};

export const initAutocomplete = (inputElement, map, onPlaceSelected) => {
  const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
    types: ["geocode", "establishment"],
  });

  autocomplete.bindTo("bounds", map);

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (!place.geometry || !place.geometry.location) return;

    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(20);
    }

    const location = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      address: place.formatted_address || place.name || "",
    };

    onPlaceSelected(location);
  });

  return autocomplete;
};

export const addMarker = (map, position, options = {}) => {
  const marker = new window.google.maps.Marker({
    position,
    map,
    animation: window.google.maps.Animation.DROP,
    ...options,
  });
  return marker;
};

export const removeMarker = (marker) => {
  if (marker) marker.setMap(null);
};