import React from "react";
import { FormComponentProps } from "@kentico/xperience-admin-base";
import {
  Box,
  FormEditMode,
  FormItemWrapper,
  Input,
  Spacing,
} from "@kentico/xperience-admin-components";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Icon, LatLngTuple, LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";

const customMarkerIcon = new Icon({
  iconUrl: markerIcon,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const decimalRegex = /^-?\d*\.?\d*$/;

export interface MapLocationFormComponentProps extends FormComponentProps {
  mapLatitude: number;
  mapLongitude: number;
  mapZoom?: number;
  pinLatitude: number | null;
  pinLongitude: number | null;
  manualEntry?: boolean;
}

// Splits the stored "latitude,longitude" value into its text parts
const splitValue = (value: unknown): [string, string] => {
  if (typeof value !== "string" || !value) {
    return ["", ""];
  }
  const parts = value.split(",");
  if (parts.length !== 2) {
    return ["", ""];
  }
  return [parts[0].trim(), parts[1].trim()];
};

// Parses a coordinate, returning null if it is not a usable number
const parseCoordinate = (text: string): number | null => {
  if (!text) {
    return null;
  }
  const value = parseFloat(text);
  return Number.isFinite(value) ? value : null;
};

// Map click handler component to report the clicked position
const MapClickHandler: React.FC<{
  onClick: (e: LeafletMouseEvent) => void;
}> = ({ onClick }) => {
  useMapEvents({ click: onClick });
  return null;
};

export const MapLocationFormComponent: React.FC<
  MapLocationFormComponentProps
> = (props) => {
  // Text shown in the manual entry inputs. Kept separately from the Kentico value so
  // partial input (e.g. "53." or "-") can be typed without being reformatted.
  const [latitudeText, setLatitudeText] = React.useState<string>(
    () => splitValue(props.value)[0]
  );
  const [longitudeText, setLongitudeText] = React.useState<string>(
    () => splitValue(props.value)[1]
  );

  // The last value this component reported to Kentico
  const lastReportedValue = React.useRef<unknown>(props.value);

  // Resync the inputs when Kentico changes the value externally (e.g. form reset or reload)
  React.useEffect(() => {
    if (props.value === lastReportedValue.current) {
      return;
    }
    lastReportedValue.current = props.value;
    const [lat, lng] = splitValue(props.value);
    setLatitudeText(lat);
    setLongitudeText(lng);
  }, [props.value]);

  // Only notify Kentico when the editor has actually changed the value, so the form
  // is not marked as dirty on load
  const reportValue = (newValue: string) => {
    lastReportedValue.current = newValue;
    if (props.onChange && newValue !== (props.value ?? "")) {
      props.onChange(newValue);
    }
  };

  const reportCoordinates = (latText: string, lngText: string) => {
    const lat = parseCoordinate(latText);
    const lng = parseCoordinate(lngText);
    reportValue(lat === null || lng === null ? "" : `${lat},${lng}`);
  };

  const latitude = parseCoordinate(latitudeText);
  const longitude = parseCoordinate(longitudeText);
  const clickedPosition: LatLngTuple | null =
    latitude !== null && longitude !== null ? [latitude, longitude] : null;

  // The field cannot be changed when the form is disabled or read only
  const isReadOnly =
    !!props.disabled ||
    (props.editMode ?? FormEditMode.Default) !== FormEditMode.Default;

  const editableAttribute =
    !props.manualEntry || isReadOnly ? { disabled: true } : {};

  // Map click handler to set the latitude and longitude values
  const handleMapClick = (e: LeafletMouseEvent) => {
    const lat = String(e.latlng.lat);
    const lng = String(e.latlng.lng);
    setLatitudeText(lat);
    setLongitudeText(lng);
    reportCoordinates(lat, lng);
  };

  // Marker click handler to clear the latitude and longitude values
  const handleMarkerClick = () => {
    setLatitudeText("");
    setLongitudeText("");
    reportValue("");
  };

  // Handle Manual Changes
  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (decimalRegex.test(newValue)) {
      setLatitudeText(newValue);
      reportCoordinates(newValue, longitudeText);
    }
  };

  const handleLonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (decimalRegex.test(newValue)) {
      setLongitudeText(newValue);
      reportCoordinates(latitudeText, newValue);
    }
  };

  return (
    <FormItemWrapper
      label={props.label}
      invalid={props.invalid}
      validationMessage={props.validationMessage}
      markAsRequired={props.required}
      labelIcon={props.tooltip ? "xp-i-circle" : undefined}
      labelIconTooltip={props.tooltip}
      explanationText="Click on the map to select a location. The latitude and longitude values will be automatically updated. Click on the marker to clear the selection."
    >
      <Box spacingY={Spacing.S}>
        <MapContainer
          center={[props.mapLatitude, props.mapLongitude]}
          zoom={props.mapZoom ?? 15}
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {!isReadOnly && <MapClickHandler onClick={handleMapClick} />}

          {clickedPosition && (
            <Marker
              // Leaflet only reads "interactive" on creation, so recreate the marker when it changes
              key={isReadOnly ? "readonly" : "editable"}
              position={clickedPosition}
              icon={customMarkerIcon}
              interactive={!isReadOnly}
              eventHandlers={isReadOnly ? {} : { click: handleMarkerClick }}
            />
          )}
        </MapContainer>
      </Box>
      <Box spacingY={Spacing.S}>
        <Input
          label="Latitude"
          placeholder="Current latitude value"
          type="text"
          {...editableAttribute}
          value={latitudeText}
          onChange={handleLatChange}
        />
      </Box>
      <Box spacingY={Spacing.S}>
        <Input
          label="Longitude"
          placeholder="Current longitude value"
          type="text"
          {...editableAttribute}
          value={longitudeText}
          onChange={handleLonChange}
        />
      </Box>
    </FormItemWrapper>
  );
};
