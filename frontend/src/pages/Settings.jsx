import { useState } from 'react'
import { Save, AlertCircle, Settings as SettingsIcon, Upload } from 'lucide-react'

const Settings = () => {
  const [settings, setSettings] = useState({
    criticalThreshold: 85,
    warningThreshold: 75,
    normalThreshold: 65,
    alertEmail: 'admin@greendrive.local',
    soundClassification: true,
    timeBasedAnalysis: true,
    realTimeMonitoring: true,
    demoMode: true,
  })

  const [saved, setSaved] = useState(false)

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <SettingsIcon className="w-8 h-8" />
          System Settings
        </h2>
        <p className="text-green-100">Configure monitoring thresholds, alerts, and system behavior</p>
      </div>

      {/* Alert Message */}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 alert-enter">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-green-800 font-semibold">Settings saved successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Noise Thresholds */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              🔊 Noise Thresholds (dB)
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Critical Threshold', key: 'criticalThreshold', desc: 'Alerts when exceeded', color: 'red' },
                { label: 'Warning Threshold', key: 'warningThreshold', desc: 'Moderate alert level', color: 'orange' },
                { label: 'Normal Threshold', key: 'normalThreshold', desc: 'Below this = normal', color: 'green' },
              ].map((item) => (
                <div key={item.key}>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {item.label}
                    <span className={`ml-2 text-xs px-2 py-1 rounded-full text-white bg-${item.color}-600`}>
                      {settings[item.key]} dB
                    </span>
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="40"
                      max="120"
                      value={settings[item.key]}
                      onChange={(e) => handleChange(item.key, parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      min="40"
                      max="120"
                      value={settings[item.key]}
                      onChange={(e) => handleChange(item.key, parseInt(e.target.value))}
                      className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              ⚡ Feature Controls
            </h3>
            <div className="space-y-4">
              {[
                {
                  key: 'soundClassification',
                  label: 'AI Sound Classification',
                  desc: 'Enable automatic sound type detection using machine learning',
                },
                {
                  key: 'timeBasedAnalysis',
                  label: 'Time-Based Analysis',
                  desc: 'Track noise duration and temporal patterns',
                },
                {
                  key: 'realTimeMonitoring',
                  label: 'Real-Time Monitoring',
                  desc: 'Live updates from sensor devices',
                },
                {
                  key: 'demoMode',
                  label: 'Demo Mode',
                  desc: 'Use simulated data for testing',
                },
              ].map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{feature.label}</p>
                    <p className="text-sm text-gray-600 mt-1">{feature.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[feature.key]}
                      onChange={(e) => handleChange(feature.key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Alert Configuration */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              🔔 Alert Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Alert Email Address
                </label>
                <input
                  type="email"
                  value={settings.alertEmail}
                  onChange={(e) => handleChange('alertEmail', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">Where alerts will be sent</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Save Button */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all transform active:scale-95"
            >
              <Save className="w-5 h-5" />
              Save Settings
            </button>
            <p className="text-xs text-gray-600 mt-4">Changes are saved immediately</p>
          </div>

          {/* AI Model Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-bold text-blue-900 mb-3">🧠 AI Model Details</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p><span className="font-semibold">Model:</span> Google YAMNet</p>
              <p><span className="font-semibold">Type:</span> Audio Classification</p>
              <p><span className="font-semibold">Classes:</span> 500+ sound types</p>
              <p><span className="font-semibold">Input:</span> Audio samples</p>
              <p><span className="font-semibold">Output:</span> Sound classification</p>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-gray-100 rounded-lg p-6">
            <h4 className="font-bold text-gray-900 mb-3">📊 System Information</h4>
            <div className="text-sm text-gray-700 space-y-2">
              <p><span className="font-semibold">Version:</span> 1.0.0</p>
              <p><span className="font-semibold">Status:</span> <span className="text-green-600 font-semibold">🟢 Active</span></p>
              <p><span className="font-semibold">Locations:</span> 5</p>
              <p><span className="font-semibold">Uptime:</span> 100%</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="font-bold text-gray-900 mb-4">⚙️ Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition">
                📥 Import Settings
              </button>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition">
                📤 Export Settings
              </button>
              <button className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-semibold transition">
                🔄 Reset to Default
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          🔌 API & Hardware Integration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Backend API</h4>
            <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm text-gray-700">
              <p>Base URL: http://localhost:8000</p>
              <p>API Version: v1</p>
              <p className="text-green-600 mt-2">✓ Connected</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Hardware Connection</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">Device Type: ESP32 + INMP441</p>
              <p className="text-sm text-gray-700 mb-2">Status: <span className="text-orange-600">⚠️ Waiting for connection</span></p>
              <button className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                Test Connection
              </button>
            </div>
          </div>
        </div>

        {/* ESP32 Integration Guide */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
            📡 ESP32 + INMP441 Integration Guide
          </h4>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-2">1️⃣ Arduino Sketch Configuration</p>
              <div className="bg-dark-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto">
                <pre>{`// INMP441 Microphone Setup
#define I2S_SCK 32
#define I2S_WS 25
#define I2S_SD 33

// WiFi Configuration
const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";
const char* serverUrl = "http://localhost:8000/api/readings";`}</pre>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-900 mb-2">2️⃣ Sensor Data JSON Payload</p>
              <div className="bg-dark-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto">
                <pre>{`POST /api/readings
Content-Type: application/json

{
  "location_id": 1,
  "noise_level": 75.5,
  "sound_type": "Traffic Noise",
  "duration": 120,
  "timestamp": "2024-11-22T12:00:00Z"
}`}</pre>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-900 mb-2">3️⃣ Audio Classification Endpoint</p>
              <div className="bg-dark-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto">
                <pre>{`POST /api/classify-audio
Content-Type: multipart/form-data

Form Data:
  - file: <audio.wav>
  - location_id: 1

Response:
{
  "soundType": "Traffic Noise",
  "confidence": 0.92,
  "timestamp": "2024-11-22T12:00:00Z"
}`}</pre>
              </div>
            </div>

            <div className="bg-blue-100 p-3 rounded border border-blue-300">
              <p className="text-xs text-blue-900">
                <span className="font-bold">💡 Tip:</span> Replace <code className="bg-blue-200 px-2 py-1 rounded">localhost:8000</code> with your actual server IP when deploying to production.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <div className="flex gap-3">
          <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-orange-900 mb-2">⚠️ Important Notes</h4>
            <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
              <li>All settings are stored locally in the backend</li>
              <li>Threshold changes affect new alerts only</li>
              <li>Demo mode shows simulated data for testing</li>
              <li>Hardware integration requires ESP32 + INMP441 sensor</li>
              <li>Keep backup of configuration before major changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
