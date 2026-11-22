import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, FileText, TrendingUp } from 'lucide-react'
import axios from 'axios'

const Analytics = () => {
  const [timeSeriesData, setTimeSeriesData] = useState([])
  const [locationComparison, setLocationComparison] = useState([])
  const [soundTypes, setSoundTypes] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('24h')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [tsRes, lcRes, stRes] = await Promise.all([
          axios.get(`/api/analytics/timeseries?period=${selectedPeriod}`),
          axios.get('/api/analytics/location-comparison'),
          axios.get('/api/analytics/sound-types'),
        ])
        setTimeSeriesData(tsRes.data)
        setLocationComparison(lcRes.data)
        setSoundTypes(stRes.data)
      } catch (error) {
        console.log('Using demo data...')
        setDemoData()
      }
    }

    fetchAnalytics()
  }, [selectedPeriod])

  const setDemoData = () => {
    // Time series data
    const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
    const tsData = hours.map((time, idx) => ({
      time,
      avgNoise: 60 + Math.random() * 30,
      maxNoise: 85 + Math.random() * 20,
      minNoise: 50 + Math.random() * 10,
    }))
    setTimeSeriesData(tsData)

    // Location comparison
    setLocationComparison([
      { name: 'Road Junction (S)', avgNoise: 92, peakNoise: 105, duration: 240 },
      { name: 'Hospital (N)', avgNoise: 65, peakNoise: 75, duration: 180 },
      { name: 'Residential (E)', avgNoise: 72, peakNoise: 88, duration: 210 },
      { name: 'Park (W)', avgNoise: 58, peakNoise: 72, duration: 150 },
      { name: 'Market (C)', avgNoise: 78, peakNoise: 92, duration: 230 },
    ])

    // Sound types
    setSoundTypes([
      { name: 'Traffic Noise', value: 35, events: 142 },
      { name: 'Construction', value: 25, events: 48 },
      { name: 'Music/Entertainment', value: 20, events: 31 },
      { name: 'Crowd Noise', value: 15, events: 29 },
      { name: 'Other', value: 5, events: 8 },
    ])
  }

  const COLORS = ['#dc2626', '#f97316', '#3b82f6', '#10b981', '#8b5cf6']

  const handleExportCSV = () => {
    if (!timeSeriesData.length) {
      alert('No data to export')
      return
    }

    let csvContent = "Green Drive NoiseSense AI - EVS Environmental Report\n"
    csvContent += `Generated: ${new Date().toLocaleString()}\n`
    csvContent += `Report Period: ${selectedPeriod}\n\n`
    csvContent += "NOISE TREND DATA\n"
    csvContent += "Time,Average Noise (dB),Max Noise (dB),Min Noise (dB)\n"
    csvContent += timeSeriesData.map(d => `${d.time},${d.avgNoise.toFixed(1)},${d.maxNoise.toFixed(1)},${d.minNoise.toFixed(1)}`).join("\n")
    csvContent += "\n\nLOCATION COMPARISON\n"
    csvContent += "Location,Average Noise (dB),Peak Noise (dB),Duration (min)\n"
    csvContent += locationComparison.map(l => `${l.name},${l.avgNoise},${l.peakNoise},${l.duration}`).join("\n")
    csvContent += "\n\nSOUND TYPE DISTRIBUTION\n"
    csvContent += "Sound Type,Percentage,Events Detected\n"
    csvContent += soundTypes.map(s => `${s.name},${s.value}%,${s.events}`).join("\n")

    const link = document.createElement("a")
    link.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent))
    link.setAttribute("download", `GREEN_DRIVE_EVS_Report_${new Date().getTime()}.csv`)
    link.click()
  }

  const handleExportPDF = () => {
    alert('PDF export feature will be available with actual backend integration')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2">📈 Analytics & Reports</h2>
        <p className="text-green-100">Comprehensive noise analysis and historical trends</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2">
          {['24h', '7d', '30d', '90d'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                selectedPeriod === period
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period === '24h' ? 'Last 24 Hours' : period === '7d' ? 'Last 7 Days' : period === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Time Series Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6">📊 Noise Levels Over Time</h3>
        {timeSeriesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#6b7280" />
              <YAxis stroke="#6b7280" label={{ value: 'Noise Level (dB)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                formatter={(value) => value.toFixed(1)}
              />
              <Legend />
              <Line type="monotone" dataKey="avgNoise" stroke="#16a34a" strokeWidth={2} name="Average Noise" />
              <Line type="monotone" dataKey="maxNoise" stroke="#dc2626" strokeWidth={2} name="Peak Noise" />
              <Line type="monotone" dataKey="minNoise" stroke="#3b82f6" strokeWidth={2} name="Min Noise" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-gray-500">Loading chart...</div>
        )}
      </div>

      {/* Location Comparison */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6">🗺️ Location Comparison</h3>
        {locationComparison.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={locationComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#6b7280" label={{ value: 'Noise Level (dB)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                formatter={(value) => value.toFixed(1)}
              />
              <Legend />
              <Bar dataKey="avgNoise" fill="#16a34a" name="Average Noise" />
              <Bar dataKey="peakNoise" fill="#dc2626" name="Peak Noise" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-gray-500">Loading chart...</div>
        )}
      </div>

      {/* Sound Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6">🎵 Sound Type Distribution</h3>
          {soundTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={soundTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {soundTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">Loading chart...</div>
          )}
        </div>

        {/* Sound Type List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6">📋 Sound Type Details</h3>
          <div className="space-y-3">
            {soundTypes.map((type, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  ></div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{type.name}</p>
                    <p className="text-xs text-gray-600">{type.events} events detected</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{type.value}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Peak Noise', value: '105 dB', icon: '📈', color: 'red' },
          { label: 'Average Noise', value: '72 dB', icon: '📊', color: 'blue' },
          { label: 'Total Events', value: '258', icon: '📢', color: 'green' },
          { label: 'Alert Count', value: '12', icon: '🚨', color: 'orange' },
        ].map((metric, idx) => (
          <div key={idx} className={`bg-white rounded-lg shadow p-6 border-l-4 border-${metric.color}-600`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">{metric.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
              </div>
              <div className="text-4xl">{metric.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Alert History */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-600" />
          Recent Noise Events
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Time</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Location</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Noise Level</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Duration</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { time: '14:32', location: 'Road Junction (S)', level: 102, type: 'Traffic', duration: '3 min', status: 'Critical' },
                { time: '14:28', location: 'Market (C)', level: 85, type: 'Commercial', duration: '5 min', status: 'Warning' },
                { time: '14:15', location: 'Residential (E)', level: 76, type: 'Construction', duration: '8 min', status: 'Warning' },
                { time: '13:50', location: 'Hospital (N)', level: 68, type: 'Mixed', duration: '2 min', status: 'Normal' },
                { time: '13:30', location: 'Park (W)', level: 55, type: 'Nature', duration: '1 min', status: 'Normal' },
              ].map((event, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-semibold text-gray-900">{event.time}</td>
                  <td className="px-4 py-3 text-gray-700">{event.location}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-gray-900">{event.level} dB</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{event.type}</td>
                  <td className="px-4 py-3 text-gray-700">{event.duration}</td>
                  <td className="px-4 py-3">
                    {event.status === 'Critical' ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-semibold">🔴 {event.status}</span>
                    ) : event.status === 'Warning' ? (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-semibold">🟠 {event.status}</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">🟢 {event.status}</span>
                    )}
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

export default Analytics
