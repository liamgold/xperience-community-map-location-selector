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
    }
}
