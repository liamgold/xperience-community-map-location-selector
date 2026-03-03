using CMS.Helpers;
using Kentico.Xperience.Admin.Base.FormAnnotations;
using Kentico.Xperience.Admin.Base.Forms;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text.Json;
using XperienceCommunity.MapLocationSelector.Models;

[assembly: RegisterFormComponent(
    "XperienceCommunity.GoogleMapLocationSelector",
    typeof(XperienceCommunity.MapLocationSelector.GoogleMapLocationFormComponent),
    "Google Map location selector")]

namespace XperienceCommunity.MapLocationSelector
{
    /// <summary>
    /// A form component that renders a Google Map with Places Autocomplete search,
    /// map click-to-pin, and reverse geocoding. Stores address, latitude, and longitude as JSON.
    /// </summary>
    [ComponentAttribute(typeof(GoogleMapLocationFormComponentAttribute))]
    public class GoogleMapLocationFormComponent : FormComponent<GoogleMapLocationFormComponentClientProperties, string>
    {
        public override string ClientComponentName => "@xperiencecommunity/map-location-selector/GoogleMapLocation";

        private readonly MapLocationOptions _mapLocationOptions;
        private readonly ILogger<GoogleMapLocationFormComponent>? _logger;

        public GoogleMapLocationFormComponent(IOptions<MapLocationOptions> options)
        {
            _mapLocationOptions = options.Value;
        }

        public GoogleMapLocationFormComponent(
            IOptions<MapLocationOptions> options,
            ILogger<GoogleMapLocationFormComponent> logger)
            : this(options)
        {
            _logger = logger;
        }

        protected override Task ConfigureClientProperties(GoogleMapLocationFormComponentClientProperties clientProperties)
        {
            base.ConfigureClientProperties(clientProperties);

            var apiKey = _mapLocationOptions.GoogleApiKey ?? string.Empty;

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger?.LogWarning(
                    "Google Maps API key is not configured. Set 'GoogleApiKey' in the '{Section}' configuration section.",
                    MapLocationOptions.SECTION_NAME);
            }

            clientProperties.ApiKey = apiKey;
            clientProperties.DefaultLatitude = ValidationHelper.GetDouble(_mapLocationOptions.MapLatitude, 0);
            clientProperties.DefaultLongitude = ValidationHelper.GetDouble(_mapLocationOptions.MapLongitude, 0);
            clientProperties.DefaultZoom = ValidationHelper.GetInteger(_mapLocationOptions.MapZoom, 10);

            clientProperties.Address = string.Empty;
            clientProperties.Latitude = 0;
            clientProperties.Longitude = 0;

            if (!string.IsNullOrWhiteSpace(clientProperties.Value))
            {
                try
                {
                    var mapData = JsonSerializer.Deserialize<GoogleMapLocationData>(clientProperties.Value);
                    if (mapData != null)
                    {
                        clientProperties.Address = mapData.Address ?? string.Empty;
                        clientProperties.Latitude = mapData.Latitude;
                        clientProperties.Longitude = mapData.Longitude;
                    }
                }
                catch (Exception ex)
                {
                    _logger?.LogError(ex, "Failed to parse Google Map location data from value: {Value}", clientProperties.Value);
                    clientProperties.Address = string.Empty;
                    clientProperties.Latitude = 0;
                    clientProperties.Longitude = 0;
                }
            }

            return Task.CompletedTask;
        }
    }

    public class GoogleMapLocationFormComponentClientProperties : FormComponentClientProperties<string>
    {
        public string ApiKey { get; set; } = string.Empty;
        public double DefaultLatitude { get; set; }
        public double DefaultLongitude { get; set; }
        public int DefaultZoom { get; set; }
        public string Address { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }

    /// <summary>
    /// Attribute to use the Google Map Location Selector form component on widget properties.
    /// </summary>
    public class GoogleMapLocationFormComponentAttribute : FormComponentAttribute
    {
    }

    /// <summary>
    /// Data model for Google Map location information stored as JSON.
    /// </summary>
    public class GoogleMapLocationData
    {
        public string Address { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}
