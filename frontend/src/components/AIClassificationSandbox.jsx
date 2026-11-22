import { useState } from 'react'
import { Upload, Play, Zap, Loader } from 'lucide-react'
import axios from 'axios'

const AIClassificationSandbox = () => {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const presets = [
    { name: 'Vehicle Horn', emoji: '🚗', desc: 'Traffic noise simulation' },
    { name: 'Construction Drilling', emoji: '🏗️', desc: 'Heavy machinery' },
    { name: 'Crowd Shouting', emoji: '👥', desc: 'Public gathering' },
    { name: 'Loud Music', emoji: '🎵', desc: 'Entertainment venue' },
  ]

  const mockClassifications = {
    'Vehicle Horn': {
      category: 'Traffic Noise',
      confidence: 0.94,
      alternatives: ['Car Horn', 'Traffic', 'Vehicle Sound'],
      recommendations: [
        'Implement traffic management system',
        'Promote public transportation',
        'Establish no-honking zones',
      ],
    },
    'Construction Drilling': {
      category: 'Construction Noise',
      confidence: 0.91,
      alternatives: ['Power Tool', 'Machinery', 'Industrial'],
      recommendations: [
        'Enforce working hour restrictions',
        'Use noise barriers',
        'Schedule during daytime only',
      ],
    },
    'Crowd Shouting': {
      category: 'Crowd Noise',
      confidence: 0.88,
      alternatives: ['Public Speaking', 'Cheering', 'Shouting'],
      recommendations: [
        'Noise management at events',
        'Event scheduling optimization',
        'Crowd control measures',
      ],
    },
    'Loud Music': {
      category: 'Music/Entertainment',
      confidence: 0.92,
      alternatives: ['Speaker System', 'Live Performance', 'Audio'],
      recommendations: [
        'Volume control enforcement',
        'Venue soundproofing',
        'Time restrictions',
      ],
    },
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) setFile(selectedFile)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) setFile(droppedFile)
  }

  const classifyAudio = async () => {
    if (!file) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      // In production, this would hit: POST /api/classify-audio
      // For now, use mock data
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulate API response
      const mockResult = mockClassifications['Construction Drilling']
      setResult(mockResult)
    } catch (error) {
      console.error('Classification error:', error)
      setResult({
        category: 'Unknown',
        confidence: 0.0,
        error: 'Classification failed',
      })
    } finally {
      setLoading(false)
    }
  }

  const classifyPreset = (presetName) => {
    setLoading(true)
    setTimeout(() => {
      setResult(mockClassifications[presetName])
      setLoading(false)
    }, 1200)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
          🧠 AI Sound Classification Sandbox
        </h3>
        <p className="text-gray-600">
          Upload audio or test with presets to see YAMNet sound classification in action
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive ? 'border-green-600 bg-green-50' : 'border-gray-300'
            }`}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <input
              type="file"
              accept=".wav,.mp3,.ogg"
              onChange={handleFileChange}
              className="hidden"
              id="audio-upload"
            />
            <label htmlFor="audio-upload" className="cursor-pointer">
              <p className="font-semibold text-gray-900 mb-2">Drop audio file or click to upload</p>
              <p className="text-sm text-gray-500">.wav, .mp3, .ogg (max 10MB)</p>
            </label>
          </div>

          {file && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900">📁 Selected: {file.name}</p>
            </div>
          )}

          <button
            onClick={classifyAudio}
            disabled={!file || loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Classifying...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Classify Audio
              </>
            )}
          </button>

          <div className="border-t pt-6">
            <h4 className="font-bold mb-4">Quick Presets</h4>
            <div className="grid grid-cols-2 gap-3">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => classifyPreset(preset.name)}
                  disabled={loading}
                  className="p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg transition-all disabled:opacity-50 text-left"
                >
                  <div className="text-2xl mb-2">{preset.emoji}</div>
                  <p className="font-semibold text-sm text-gray-900">{preset.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div>
          {result ? (
            <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
              {result.error ? (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-red-900 font-semibold">{result.error}</p>
                </div>
              ) : (
                <>
                  {/* Category */}
                  <div>
                    <p className="text-sm text-gray-600 font-mono mb-2">DETECTED CATEGORY</p>
                    <p className="text-3xl font-black text-gray-900">{result.category}</p>
                  </div>

                  {/* Confidence */}
                  <div>
                    <p className="text-sm text-gray-600 font-mono mb-2">CONFIDENCE SCORE</p>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-black text-green-600 font-mono">
                        {(result.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-600"
                          style={{ width: `${result.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Alternatives */}
                  {result.alternatives && (
                    <div>
                      <p className="text-sm text-gray-600 font-mono mb-2">ALTERNATIVE CLASSIFICATIONS</p>
                      <div className="flex gap-2 flex-wrap">
                        {result.alternatives.map((alt) => (
                          <span
                            key={alt}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-semibold"
                          >
                            {alt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {result.recommendations && (
                    <div>
                      <p className="text-sm text-gray-600 font-mono mb-3">MITIGATION RECOMMENDATIONS</p>
                      <ul className="space-y-2">
                        {result.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex gap-3">
                            <span className="text-green-600 font-bold text-lg flex-shrink-0">✓</span>
                            <span className="text-sm text-gray-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-4">🎙️</div>
                <p className="text-gray-600">Upload an audio file or select a preset to see classification results</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIClassificationSandbox
