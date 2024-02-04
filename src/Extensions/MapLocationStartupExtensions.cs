using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using XperienceCommunity.MapLocationSelector.Models;

namespace XperienceCommunity.MapLocationSelector.Extensions
{
    /// <summary>
    /// Application startup extension methods.
    /// </summary>
    public static class MapLocationStartupExtensions
    {
        public static IServiceCollection AddXperienceCommunityMapLocationSelector(this IServiceCollection services, IConfiguration configuration)
        {
            return services
                .Configure<MapLocationOptions>(configuration.GetSection(MapLocationOptions.SECTION_NAME));
        }
    }
}
