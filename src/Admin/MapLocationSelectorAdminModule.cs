using Kentico.Xperience.Admin.Base;
using XperienceCommunity.MapLocationSelector;

[assembly: CMS.AssemblyDiscoverable]
[assembly: CMS.RegisterModule(typeof(MapLocationSelectorAdminModule))]

namespace XperienceCommunity.MapLocationSelector
{
    internal class MapLocationSelectorAdminModule : AdminModule
    {
        public MapLocationSelectorAdminModule()
            : base(nameof(MapLocationSelectorAdminModule))
        {
        }

        protected override void OnInit()
        {
            base.OnInit();

            // Makes the module accessible to the admin UI
            RegisterClientModule("xperiencecommunity", "map-location-selector");
        }
    }
}
