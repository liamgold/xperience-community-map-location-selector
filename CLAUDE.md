# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Xperience by Kentico** UI form component library that provides a map location selector for the admin interface. It's packaged as a NuGet package for distribution.

**Key Technology Stack:**
- Backend: .NET 8.0, ASP.NET Core, Xperience by Kentico 28.2.0+
- Frontend: React 18, TypeScript, Leaflet (for maps), React-Leaflet
- Build: Webpack 5 with custom Kentico configuration

## Architecture

### Hybrid .NET + React Component Pattern

This project follows Xperience by Kentico's **admin module pattern** where:

1. **Backend C# Form Component** (`src/Admin/UIFormComponents/MapLocation/MapLocationFormComponent.cs`)
   - Extends `FormComponent<TClientProperties, TValue>`
   - Registered via `[RegisterFormComponent]` assembly attribute
   - Specifies the React component via `ClientComponentName` property
   - Passes configuration to frontend via `MapLocationFormComponentClientProperties`
   - Value format: `"latitude,longitude"` (comma-separated string, or empty string if not set)

2. **Admin Module Registration** (`src/Admin/MapLocationSelectorAdminModule.cs`)
   - Inherits from `AdminModule`
   - Registers the client module using `RegisterClientModule("xperiencecommunity", "map-location-selector")`
   - These names MUST match the webpack `orgName` and `projectName` configuration

3. **React Frontend Component** (`src/Admin/Client/src/components/MapLocation/MapLocationFormComponent.tsx`)
   - Exported from `src/Admin/Client/src/entry.tsx`
   - Receives props from backend via `FormComponentProps` interface
   - Communicates back to backend via `props.onChange(value)` callback
   - Built by webpack and output to `src/Admin/Client/dist/`

4. **Webpack Build Integration**
   - Compiled JavaScript is embedded in the NuGet package via `<AdminClientPath Include="Admin\Client\dist\**">`
   - The `AdminOrgName` property in csproj must match webpack's `orgName`
   - Final module name: `@{orgName}/{projectName}/ComponentName`

### Configuration System

The component requires runtime configuration via ASP.NET Core configuration:

```json
"xperiencecommunity.maplocation": {
    "MapLatitude": "53.799009663238486",
    "MapLongitude": "-1.549048364271424"
}
```

This is registered in the consuming app via `builder.Services.AddXperienceCommunityMapLocationSelector(builder.Configuration)`.

## Build Commands

### Full Build (for NuGet Package)
```bash
# 1. Build React frontend
cd src/Admin/Client
npm install
npm run build

# 2. Build .NET library (includes frontend artifacts)
cd ../../..
dotnet restore
dotnet build --configuration Release
```

The NuGet package is auto-generated in `src/bin/Release/` due to `<GeneratePackageOnBuild>true</GeneratePackageOnBuild>`.

### Development Workflow

**Frontend only (with hot reload):**
```bash
cd src/Admin/Client
npm start  # Runs webpack-dev-server on port 3009
```

**Backend rebuild:**
```bash
dotnet build --configuration Release
```

### Testing
There are no automated tests in this project currently.

## Dependency Management

This project uses **Central Package Management** via `Directory.Packages.props`:
- All NuGet package versions are centralized in `Directory.Packages.props`
- Individual `.csproj` files reference packages WITHOUT version attributes
- `packages.lock.json` is generated and committed for reproducible builds
- Kentico packages are pinned to 28.2.0

**Important:** When updating Kentico packages, update all three together:
- `Kentico.Xperience.Admin`
- `Kentico.Xperience.ImageProcessing`
- `Kentico.Xperience.WebApp`

Also update the frontend packages:
- `@kentico/xperience-admin-base`
- `@kentico/xperience-admin-components`
- `@kentico/xperience-webpack-config`

## Key Implementation Details

### Value Storage Format
The form component stores location as: `"{latitude},{longitude}"` or `""` (empty string if no selection).

When reading existing values in `ConfigureClientProperties`:
1. Split on comma
2. Parse to doubles
3. Set both `PinLatitude/PinLongitude` (for marker) and `MapLatitude/MapLongitude` (to center map)

### React-Leaflet Integration
- Uses OpenStreetMap tiles (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`)
- Custom marker icon required (default markers don't render correctly)
- `MapClickHandler` component uses `useMapEvents` hook to capture map clicks
- Click marker to clear selection (sets values to `null`)

### Webpack Configuration
Uses `@kentico/xperience-webpack-config` as base, merged with custom config:
- Babel loader for TS/TSX
- CSS loader with style injection
- Asset/resource loader for images
- Dev server on port 3009
- Output cleaned on each build

## CI/CD

GitHub Actions workflows:
- **CI** (`.github/workflows/ci.yml`): Runs on PRs to main, builds and tests
- **Publish** (`.github/workflows/publish.yml`): Publishes to NuGet.org on GitHub releases using OIDC trusted publishing

Dependabot (`.github/dependabot.yml`):
- Weekly updates for NuGet packages (ignores Kentico.Xperience.*)
- Weekly updates for npm packages in `/src/Admin/Client` (ignores @kentico/xperience-*)
- Weekly updates for GitHub Actions

## Common Gotchas

1. **Module registration names must match everywhere:**
   - `MapLocationSelectorAdminModule.cs`: `RegisterClientModule("xperiencecommunity", "map-location-selector")`
   - `webpack.config.js`: `orgName: "xperiencecommunity"`, `projectName: "map-location-selector"`
   - `.csproj`: `<AdminOrgName>xperiencecommunity</AdminOrgName>`

2. **Frontend build must complete before .NET build** to embed dist files in package

3. **Leaflet CSS must be imported** or maps won't render correctly

4. **React/React-DOM overrides** in package.json ensure single React instance (required by Kentico)
