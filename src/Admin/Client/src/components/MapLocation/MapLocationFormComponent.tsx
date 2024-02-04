import React from "react";
import { FormComponentProps } from "@kentico/xperience-admin-base";
import {
  Box,
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

export interface MapLocationFormComponentProps extends FormComponentProps {
  mapLatitude: number;
  mapLongitude: number;
  pinLatitude: number | null;
  pinLongitude: number | null;
}

export const MapLocationFormComponent: React.FC<
  MapLocationFormComponentProps
> = (props) => {
  // State to store the latitude and longitude values, initialized with the Kentico values passed to the component
  const [latitude, setLatitude] = React.useState<number | null>(
    props.pinLatitude
  );
  const [longitude, setLongitude] = React.useState<number | null>(
    props.pinLongitude
  );

  const clickedPosition: LatLngTuple | null =
    latitude && longitude ? [latitude, longitude] : null;

  // Marker click handler to clear the latitude and longitude values
  const handleMarkerClick = () => {
    setLatitude(null);
    setLongitude(null);
  };

  // Map click handler component to update the latitude and longitude values when the map is clicked
  const MapClickHandler = () => {
    useMapEvents({
      click: (e: LeafletMouseEvent) => {
        setLatitude(e.latlng.lat);
        setLongitude(e.latlng.lng);
      },
    });
    return null;
  };

  // Update the Kentico value when the latitude or longitude changes
  React.useEffect(
    function updateKentico() {
      if (props.onChange) {
        // If latitude or longitude is null, clear the Kentico value
        if (latitude === null || longitude === null) {
          props.onChange("");
        } else {
          props.onChange(`${latitude},${longitude}`);
        }
      }
    },
    [latitude, longitude]
  );

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
          zoom={15}
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <MapClickHandler />

          {clickedPosition && (
            <Marker
              position={clickedPosition}
              icon={customMarkerIcon}
              eventHandlers={{ click: handleMarkerClick }}
            />
          )}
        </MapContainer>
      </Box>
      <Box spacingY={Spacing.S}>
        <Input
          label="Latitude"
          placeholder="Current latitude value"
          type="text"
          disabled
          value={latitude || ""}
        />
      </Box>
      <Box spacingY={Spacing.S}>
        <Input
          label="Longitude"
          placeholder="Current longitude value"
          type="text"
          disabled
          value={longitude || ""}
        />
      </Box>
    </FormItemWrapper>
  );
};
