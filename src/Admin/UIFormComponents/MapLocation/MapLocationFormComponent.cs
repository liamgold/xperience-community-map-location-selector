using CMS.Helpers;
using Kentico.Xperience.Admin.Base.FormAnnotations;
using Kentico.Xperience.Admin.Base.Forms;
using Microsoft.Extensions.Options;
using XperienceCommunity.MapLocationSelector;
using XperienceCommunity.MapLocationSelector.Models;

[assembly: RegisterFormComponent("XperienceCommunity.MapLocationSelector", typeof(MapLocationFormComponent), "Map location selector")]
namespace XperienceCommunity.MapLocationSelector
{
    [ComponentAttribute(typeof(MapLocationFormComponentAttribute))]
    public class MapLocationFormComponent : FormComponent<MapLocationFormComponentClientProperties, string>
    {
        // The name of client React component to invoke, without the 'FormComponent' suffix
        public override string ClientComponentName => "@xperiencecommunity/map-location-selector/MapLocation";

        private readonly MapLocationOptions _mapLocationOptions;

        public MapLocationFormComponent(IOptions<MapLocationOptions> options)
        {
            _mapLocationOptions = options.Value;
        }

        protected override Task ConfigureClientProperties(MapLocationFormComponentClientProperties clientProperties)
        {
            base.ConfigureClientProperties(clientProperties);

            clientProperties.MapLatitude = ValidationHelper.GetDouble(_mapLocationOptions.MapLatitude, 0);
            clientProperties.MapLongitude = ValidationHelper.GetDouble(_mapLocationOptions.MapLongitude, 0);

            // Check for an existing stored value, if we have one then prepare the data for the react component
            if (!string.IsNullOrWhiteSpace(clientProperties.Value))
            {
                var locationValues = clientProperties.Value.Split(',', StringSplitOptions.RemoveEmptyEntries);

                if (locationValues.Length == 2)
                {
                    var latitude = ValidationHelper.GetDouble(locationValues[0], 0);
                    var longitude = ValidationHelper.GetDouble(locationValues[1], 0);

                    // set the pin values from the stored value
                    clientProperties.PinLatitude = latitude;
                    clientProperties.PinLongitude = longitude;

                    // we also want to move the map to focus on it
                    clientProperties.MapLatitude = latitude;
                    clientProperties.MapLongitude = longitude;
                }
            }

            return Task.CompletedTask;
        }
    }

    // Client properties class
    public class MapLocationFormComponentClientProperties : FormComponentClientProperties<string>
    {
        public double MapLatitude { get; set; }

        public double MapLongitude { get; set; }

        public double? PinLatitude { get; set; }

        public double? PinLongitude { get; set; }
    }

    // Attribute for usage for widget field configurations
    public class MapLocationFormComponentAttribute : FormComponentAttribute
    {
    }
}
