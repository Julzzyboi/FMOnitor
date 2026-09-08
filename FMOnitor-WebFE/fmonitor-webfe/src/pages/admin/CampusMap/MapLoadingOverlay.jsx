import logo from '../../../assets/logo.png'

// Same branded pulsing-logo + sliding-bar loading treatment as Login.jsx's
// "Signing you in..." state - reused here for both loading phases this page
// goes through (fetching campus/facility data, then Mapbox's own style+tiles
// loading once MapCanvas mounts) so the whole thing reads as one continuous
// loading experience instead of two different-looking loaders back to back.
function MapLoadingOverlay({ label }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-white">
      <img src={logo} alt="FMOnitor" className="h-16 w-16 animate-pulse" />
      <div className="h-1 w-32 overflow-hidden rounded-full bg-amber-100">
        <div className="h-full w-1/2 animate-[loading-bar_1s_ease-in-out_infinite] rounded-full bg-[#fccb35]" />
      </div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
    </div>
  )
}

export default MapLoadingOverlay
