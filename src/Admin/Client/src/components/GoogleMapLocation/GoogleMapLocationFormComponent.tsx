import React, { useEffect, useRef, useState } from "react";
import { FormComponentProps } from "@kentico/xperience-admin-base";
import { FormItemWrapper } from "@kentico/xperience-admin-components";

export interface GoogleMapLocationFormComponentProps
  extends FormComponentProps {
  apiKey: string;
  defaultLatitude: number;
  defaultLongitude: number;
  defaultZoom: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  value?: string;
}

interface GoogleMapLocationData {
  address: string;
  latitude: number;
  longitude: number;
}

declare global {
  interface Window {
    google: any;
    initGoogleMap: () => void;
  }
}

const parseValueFromJson = (
  jsonString: string | undefined
): GoogleMapLocationData => {
  if (!jsonString) {
    return { address: "", latitude: 0, longitude: 0 };
  }
  try {
    const parsed = JSON.parse(jsonString) as GoogleMapLocationData;
    return {
      address: parsed.address || "",
      latitude: parsed.latitude ?? 0,
      longitude: parsed.longitude ?? 0,
    };
  } catch {
    return { address: "", latitude: 0, longitude: 0 };
  }
};

export const GoogleMapLocationFormComponent: React.FC<
  GoogleMapLocationFormComponentProps
> = (props) => {
  const isDisabled =
    String(props.editMode) === "Disabled" ||
    (props as any).disabled === true;

  const getInitialValues = (): GoogleMapLocationData => {
    if (props.value) {
      return parseValueFromJson(props.value);
    }
    return {
      address: props.address || "",
      latitude: props.latitude ?? 0,
      longitude: props.longitude ?? 0,
    };
  };

  const initialValues = getInitialValues();
  const [address, setAddress] = useState<string>(initialValues.address);
  const [latitude, setLatitude] = useState<number>(initialValues.latitude);
  const [longitude, setLongitude] = useState<number>(initialValues.longitude);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const autocompleteInstanceRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const isInitialMount = useRef<boolean>(true);
  const lastSavedValue = useRef<string>("");

  useEffect(() => {
    if (!props.apiKey) {
      return;
    }

    if (window.google && window.google.maps) {
      setIsLoaded(true);
      initializeMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${props.apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsLoaded(true);
      initializeMap();
    };
    script.onerror = () => {
      console.error("Failed to load Google Maps script");
    };
    document.head.appendChild(script);
  }, [props.apiKey]);

  const setupMapInteractions = () => {
    if (
      !mapInstanceRef.current ||
      !window.google ||
      !window.google.maps
    ) {
      return;
    }

    const componentDisabled =
      String(props.editMode) === "Disabled" ||
      (props as any).disabled === true;
    const mapInstance = mapInstanceRef.current;

    if (mapInstance._clickListeners) {
      window.google.maps.event.clearListeners(mapInstance, "click");
    }

    if (!componentDisabled) {
      const clickListener = mapInstance.addListener(
        "click",
        (event: any) => {
          if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();

            setLatitude(lat);
            setLongitude(lng);

            if (markerInstanceRef.current) {
              markerInstanceRef.current.setPosition({ lat, lng });
            } else {
              const newMarker = new window.google.maps.Marker({
                position: { lat, lng },
                map: mapInstance,
              });
              markerInstanceRef.current = newMarker;
            }

            if (geocoderRef.current) {
              geocoderRef.current.geocode(
                { location: { lat, lng } },
                (results: any[], status: string) => {
                  if (
                    status === "OK" &&
                    results &&
                    results.length > 0
                  ) {
                    const addr = results[0].formatted_address;
                    setAddress(addr);
                    if (markerInstanceRef.current) {
                      markerInstanceRef.current.setTitle(addr);
                    }
                    if (searchInputRef.current) {
                      searchInputRef.current.value = addr;
                    }
                  } else {
                    const fallbackAddr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    setAddress(fallbackAddr);
                    if (markerInstanceRef.current) {
                      markerInstanceRef.current.setTitle(fallbackAddr);
                    }
                    if (searchInputRef.current) {
                      searchInputRef.current.value = fallbackAddr;
                    }
                  }
                }
              );
            }
          }
        }
      );
      mapInstance._clickListeners = clickListener;
    }
  };

  const setupAutocomplete = () => {
    if (
      !searchInputRef.current ||
      !mapInstanceRef.current ||
      !window.google ||
      !window.google.maps
    ) {
      return;
    }

    const componentDisabled =
      String(props.editMode) === "Disabled" ||
      (props as any).disabled === true;

    if (autocompleteInstanceRef.current) {
      window.google.maps.event.clearInstanceListeners(
        autocompleteInstanceRef.current
      );
      autocompleteInstanceRef.current = null;
    }

    if (!componentDisabled) {
      const autocompleteInstance =
        new window.google.maps.places.Autocomplete(
          searchInputRef.current,
          {
            types: ["address"],
            fields: ["formatted_address", "geometry", "name"],
          }
        );

      autocompleteInstance.addListener("place_changed", () => {
        const place = autocompleteInstance.getPlace();
        if (place.geometry && mapInstanceRef.current) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const addr =
            place.formatted_address || place.name || "";

          setAddress(addr);
          setLatitude(lat);
          setLongitude(lng);

          mapInstanceRef.current.setCenter({ lat, lng });
          mapInstanceRef.current.setZoom(15);

          if (markerInstanceRef.current) {
            markerInstanceRef.current.setPosition({ lat, lng });
            markerInstanceRef.current.setTitle(addr);
          } else {
            const newMarker = new window.google.maps.Marker({
              position: { lat, lng },
              map: mapInstanceRef.current,
              title: addr,
            });
            markerInstanceRef.current = newMarker;
          }
        }
      });

      autocompleteInstanceRef.current = autocompleteInstance;
    }
  };

  const initializeMap = () => {
    if (!window.google || !window.google.maps) {
      return;
    }

    if (mapRef.current && !mapInstanceRef.current) {
      const hasLocation = latitude !== 0 || longitude !== 0;
      const defaultCenter = hasLocation
        ? { lat: latitude, lng: longitude }
        : {
            lat: props.defaultLatitude || 0,
            lng: props.defaultLongitude || 0,
          };

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: hasLocation ? 15 : props.defaultZoom || 10,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      mapInstanceRef.current = mapInstance;

      geocoderRef.current = new window.google.maps.Geocoder();

      setupMapInteractions();

      if (hasLocation) {
        const markerInstance = new window.google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: mapInstance,
          title: address || "Selected location",
        });
        markerInstanceRef.current = markerInstance;
      }

      setupAutocomplete();
    } else if (mapInstanceRef.current) {
      setupMapInteractions();
      setupAutocomplete();
    }
  };

  useEffect(() => {
    if (isLoaded && mapInstanceRef.current) {
      const timer = setTimeout(() => {
        setupMapInteractions();
        setupAutocomplete();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [props.editMode, isLoaded]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const initialMapData: GoogleMapLocationData = {
        address: address || "",
        latitude: latitude || 0,
        longitude: longitude || 0,
      };
      lastSavedValue.current = JSON.stringify(initialMapData);
      return;
    }

    if (props.onChange) {
      const mapData: GoogleMapLocationData = {
        address: address || "",
        latitude: latitude || 0,
        longitude: longitude || 0,
      };
      const valueToSet = JSON.stringify(mapData);

      if (valueToSet !== lastSavedValue.current) {
        lastSavedValue.current = valueToSet;
        props.onChange(valueToSet);
      }
    }
  }, [address, latitude, longitude, props.onChange]);

  useEffect(() => {
    let hasChanges = false;
    let newAddress = address;
    let newLatitude = latitude;
    let newLongitude = longitude;

    if (props.value) {
      const parsed = parseValueFromJson(props.value);
      if (
        parsed.address !== address ||
        parsed.latitude !== latitude ||
        parsed.longitude !== longitude
      ) {
        newAddress = parsed.address;
        newLatitude = parsed.latitude;
        newLongitude = parsed.longitude;
        hasChanges = true;
      }
    } else if (
      props.address !== undefined ||
      props.latitude !== undefined ||
      props.longitude !== undefined
    ) {
      if (props.address !== undefined && props.address !== address) {
        newAddress = props.address || "";
        hasChanges = true;
      }
      if (
        props.latitude !== undefined &&
        props.latitude !== latitude
      ) {
        newLatitude = props.latitude ?? 0;
        hasChanges = true;
      }
      if (
        props.longitude !== undefined &&
        props.longitude !== longitude
      ) {
        newLongitude = props.longitude ?? 0;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      setAddress(newAddress);
      setLatitude(newLatitude);
      setLongitude(newLongitude);

      const propsMapData: GoogleMapLocationData = {
        address: newAddress,
        latitude: newLatitude,
        longitude: newLongitude,
      };
      lastSavedValue.current = JSON.stringify(propsMapData);

      if (
        isInitialMount.current &&
        (newAddress || newLatitude || newLongitude)
      ) {
        isInitialMount.current = false;
      }
    }
  }, [
    props.value,
    props.address,
    props.latitude,
    props.longitude,
    address,
    latitude,
    longitude,
  ]);

  useEffect(() => {
    if (mapInstanceRef.current && (latitude || longitude)) {
      mapInstanceRef.current.setCenter({
        lat: latitude,
        lng: longitude,
      });
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setPosition({
          lat: latitude,
          lng: longitude,
        });
      } else {
        const newMarker = new window.google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: mapInstanceRef.current,
          title: address || "Selected location",
        });
        markerInstanceRef.current = newMarker;
      }
    }
  }, [latitude, longitude, address]);

  const handleAddressChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAddress(event.target.value);
  };

  const handleClear = () => {
    setAddress("");
    setLatitude(0);
    setLongitude(0);
    if (markerInstanceRef.current) {
      markerInstanceRef.current.setMap(null);
      markerInstanceRef.current = null;
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({
        lat: props.defaultLatitude || 0,
        lng: props.defaultLongitude || 0,
      });
      mapInstanceRef.current.setZoom(props.defaultZoom || 10);
    }
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  };

  if (!props.apiKey) {
    return (
      <FormItemWrapper
        label={props.label}
        invalid={props.invalid}
        validationMessage={props.validationMessage}
        markAsRequired={props.required}
        labelIcon={props.tooltip ? "xp-i-circle" : undefined}
        labelIconTooltip={props.tooltip}
        explanationText="Google Maps API key is not configured."
      >
        <div
          style={{
            padding: "10px",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: 0, color: "#666" }}>
            Google Maps API key is required. Please configure{" "}
            <code>GoogleApiKey</code> in the{" "}
            <code>xperiencecommunity.maplocation</code> configuration
            section of your appsettings.json.
          </p>
        </div>
      </FormItemWrapper>
    );
  }

  return (
    <FormItemWrapper
      label={props.label}
      invalid={props.invalid}
      validationMessage={props.validationMessage}
      markAsRequired={props.required}
      labelIcon={props.tooltip ? "xp-i-circle" : undefined}
      labelIconTooltip={props.tooltip}
      explanationText="Search for an address or click on the map to pin a location. The address, latitude, and longitude will be saved."
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {/* Search Input */}
        <div style={{ position: "relative" }}>
          <input
            ref={searchInputRef}
            type="text"
            value={address}
            onChange={handleAddressChange}
            placeholder="Search for an address..."
            disabled={!isLoaded || isDisabled}
            readOnly={isDisabled}
            style={{
              width: "100%",
              padding: "10px 40px 10px 12px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
          {address && !isDisabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "18px",
                color: "#666",
                padding: "4px 8px",
              }}
              title="Clear"
            >
              ×
            </button>
          )}
        </div>

        {/* Map Container */}
        <div
          ref={mapRef}
          style={{
            width: "100%",
            height: "400px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: "#f5f5f5",
          }}
        />

        {/* Coordinates Display */}
        {(latitude !== 0 || longitude !== 0) && (
          <div
            style={{
              padding: "10px",
              backgroundColor: "#f9f9f9",
              borderRadius: "4px",
              fontSize: "12px",
              color: "#666",
            }}
          >
            <strong>Coordinates:</strong> {latitude.toFixed(6)},{" "}
            {longitude.toFixed(6)}
          </div>
        )}

        {!isLoaded && (
          <div
            style={{
              padding: "10px",
              backgroundColor: "#fff3cd",
              borderRadius: "4px",
              fontSize: "12px",
              color: "#856404",
            }}
          >
            Loading Google Maps...
          </div>
        )}
      </div>
    </FormItemWrapper>
  );
};
