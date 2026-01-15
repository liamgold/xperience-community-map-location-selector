namespace XperienceCommunity.MapLocationSelector.Models
{
    public sealed class MapLocationOptions
    {
        /// <summary>
        /// Configuration section name.
        /// </summary>
        public const string SECTION_NAME = "xperiencecommunity.maplocation";


        /// <summary>
        /// The map starting latitude.
        /// </summary>
        public double? MapLatitude
        {
            get;
            set;
        }

        /// <summary>
        /// The map starting longitude.
        /// </summary>
        public double? MapLongitude
        {
            get;
            set;
        }

        /// <summary>
        /// Change the default zoom level of the map.
        /// </summary>
        public int? MapZoom
        {
            get;
            set;
        }

        /// <summary>
        /// Allow the manual entry of latitude and longitude coordinates.
        /// </summary>
        public bool? ManualEntry
        {
            get;
            set;
        }
    }
}
