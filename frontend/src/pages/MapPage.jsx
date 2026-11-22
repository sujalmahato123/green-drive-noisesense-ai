import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import axios from 'axios'

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const MapPage = () => {
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [loading, setLoading] = useState(true)

  const kolkataLocations = [
    {
      id: 1,
      name: 'Road Junction (South)',
      lat: 22.5355,
      lng: 88.3613,
      noiseLevel: 92,
      status: 'critical',
      description: 'Major traffic intersection with heavy vehicle movement',
      soundType: 'Traffic Noise',
    },
    {
      id: 2,
      name: 'Hospital Area (North)',
      lat: 22.5731,
      lng: 88.3639,
      noiseLevel: 65,
      status: 'normal',
      description: 'Quieter zone near medical facilities',
      soundType: 'Mixed',
    },
    {
      id: 3,
      name: 'Residential Zone (East)',
      lat: 22.5497,
      lng: 88.3987,
      noiseLevel: 72,
      status: 'warning',
      description: 'Residential area with occasional construction',
      soundType: 'Mixed',
    },
    {
      id: 4,
      name: 'Park Area (West)',
      lat: 22.5444,
      lng: 88.3296,
      noiseLevel: 58,
      status: 'normal',
      description: 'Green space with minimal traffic',
      soundType: 'Birds, Wind',
    },
    {
      id: 5,
      name: 'Market District (Central)',
      lat: 22.5522,
      lng: 88.3647,
      noiseLevel: 78,
      status: 'warning',
      description: 'Commercial area with shops and vendors',
      soundType: 'Commercial Noise',
    },
  ]

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get('/api/locations')
        setLocations(response.data)
      } catch (error) {
        console.log('Using demo locations...')
        setLocations(kolkataLocations)
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
  }, [])

  const getMarkerColor = (status) => {
    switch (status) {
      case 'critical':
        return '#dc2626' // red
      case 'warning':
        return '#f97316' // orange
      default:
        return '#16a34a' // green
    }
  }

  const getMarkerIcon = (status) => {
    const color = getMarkerColor(status)
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">📍</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2">🗺️ Interactive Noise Map</h2>
        <p className="text-green-100">Real-time monitoring across Kolkata • Click on markers for details</p>
      </div>

      {/* Map Legend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-bold text-gray-900 mb-4">Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-full border-2 border-white shadow"></div>
            <span className="text-gray-700"><span className="font-bold">Critical</span> (High Noise)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full border-2 border-white shadow"></div>
            <span className="text-gray-700"><span className="font-bold">Warning</span> (Medium Noise)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-full border-2 border-white shadow"></div>
            <span className="text-gray-700"><span className="font-bold">Normal</span> (Low Noise)</span>
          </div>
        </div>
      </div>

      {/* Main Map and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
          <MapContainer
            center={[22.5544, 88.3663]}
            zoom={12}
            style={{ height: '500px', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {locations.map((location) => (
              <div key={location.id}>
                {/* Circle for noise radius visualization */}
                <Circle
                  center={[location.lat, location.lng]}
                  radius={Math.min(location.noiseLevel * 10, 500)}
                  fillColor={getMarkerColor(location.status)}
                  color={getMarkerColor(location.status)}
                  weight={2}
                  opacity={0.2}
                  fillOpacity={0.1}
                />
                {/* Marker */}
                <Marker
                  position={[location.lat, location.lng]}
                  icon={getMarkerIcon(location.status)}
                  eventHandlers={{
                    click: () => setSelectedLocation(location),
                  }}
                >
                  <Popup>
                    <div className="text-sm font-semibold">{location.name}</div>
                    <div className="text-xs text-gray-600 mt-1">Noise: {location.noiseLevel} dB</div>
                  </Popup>
                </Marker>
              </div>
            ))}
          </MapContainer>
        </div>

        {/* Location Details */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6">📍 Location Details</h3>
          {selectedLocation ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                <h4 className="font-bold text-gray-900 mb-2">{selectedLocation.name}</h4>
                <p className="text-sm text-gray-700">{selectedLocation.description}</p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-600">Status:</span>
                {selectedLocation.status === 'critical' ? (
                  <span className="px-3 py-1 bg-red-600 text-white text-xs rounded-full font-semibold">🔴 Critical</span>
                ) : selectedLocation.status === 'warning' ? (
                  <span className="px-3 py-1 bg-orange-500 text-white text-xs rounded-full font-semibold">🟠 Warning</span>
                ) : (
                  <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full font-semibold">🟢 Normal</span>
                )}
              </div>

              {/* Noise Level */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Current Noise Level</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-gray-900">{selectedLocation.noiseLevel}</p>
                  <p className="text-gray-600">dB</p>
                </div>
                <div className="mt-3 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      selectedLocation.status === 'critical'
                        ? 'bg-red-600'
                        : selectedLocation.status === 'warning'
                        ? 'bg-orange-500'
                        : 'bg-green-600'
                    }`}
                    style={{ width: `${Math.min((selectedLocation.noiseLevel / 120) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Sound Type */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 font-semibold mb-2">🧠 Detected Sound Type</p>
                <p className="text-sm text-blue-800">{selectedLocation.soundType}</p>
              </div>

              {/* Coordinates */}
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p>📍 {selectedLocation.lat.toFixed(4)}°N, {selectedLocation.lng.toFixed(4)}°E</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Click on a marker to view details</p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="mt-6 pt-6 border-t space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Locations</span>
              <span className="font-bold text-gray-900">{locations.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Average Noise</span>
              <span className="font-bold text-gray-900">
                {(locations.reduce((sum, l) => sum + l.noiseLevel, 0) / locations.length).toFixed(1)} dB
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Critical Zones</span>
              <span className="font-bold text-red-600">{locations.filter(l => l.status === 'critical').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* All Locations Table */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6">📊 All Monitored Locations</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Location</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Noise Level</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Sound Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {locations.map((location) => (
                <tr key={location.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-semibold text-gray-900">{location.name}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-gray-900">{location.noiseLevel} dB</span>
                  </td>
                  <td className="px-4 py-3">
                    {location.status === 'critical' ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-semibold">🔴 Critical</span>
                    ) : location.status === 'warning' ? (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-semibold">🟠 Warning</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">🟢 Normal</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{location.soundType}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedLocation(location)}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default MapPage
