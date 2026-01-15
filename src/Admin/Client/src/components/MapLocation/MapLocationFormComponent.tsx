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

export interface MapLocationFormComponentProps extends FormComponentProps {
  mapLatitude: number;
  mapLongitude: number;
  mapZoom?: number;
  pinLatitude: number | null;
  pinLongitude: number | null;
  manualEntry?: boolean;
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

  const decimalRegex = /^-?\d*\.?\d*$/

  const clickedPosition: LatLngTuple | null =
    latitude && longitude ? [latitude, longitude] : null;

  let editableAttribute = !!!props.manualEntry || props.editMode != FormEditMode.Default ? { disabled: true } : {};
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

  // Parse New Value
  const parseNewValue = (newValue: string) =>
  {
    if (!newValue) {
    newValue = "0";
    }
    var value = parseFloat(newValue);
    if (Number.isNaN(value)) {
      value = 0
    }
    return value
  }


  // Handle Manual Changes
  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => 
  {
    let newValue = e.target.value;
    if (props.onChange && decimalRegex.test(newValue))
    {
      var value = parseNewValue(newValue);
      setLatitude(value)
    }
  } 

  const handleLonChange = (e: React.ChangeEvent<HTMLInputElement>) => 
  {
    let newValue = e.target.value;
    if (props.onChange && decimalRegex.test(newValue))
    {
      var value = parseNewValue(newValue);
      setLongitude(value)
    }
  } 

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
          zoom={props.mapZoom ?? 15}
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
          {...editableAttribute}
          value={latitude}
          onChange={handleLatChange}
        />
      </Box>
      <Box spacingY={Spacing.S}>
        <Input
          label="Longitude"
          placeholder="Current longitude value"
          type="text"
          {...editableAttribute}
          value={longitude}
          onChange={handleLonChange}
        />
      </Box>
    </FormItemWrapper>
  );
};
