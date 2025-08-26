import React, { useState, useEffect } from 'react'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js'
import { useMemoriesStore } from '../store/memoriesStore'
import type { SentimentStats, SentimentTrend } from '../types/api'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
)

const Analytics: React.FC = () => {
  const { memories, fetchMemories } = useMemoriesStore()
  const [sentimentStats, setSentimentStats] = useState<SentimentStats>({
    positive: 0,
    negative: 0,
    neutral: 0,
    total: 0
  })
  const [sentimentTrends, setSentimentTrends] = useState<SentimentTrend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchMemories()
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (memories.length > 0) {
      calculateSentimentStats()
      calculateSentimentTrends()
    }
  }, [memories])

  const calculateSentimentStats = () => {
    const stats = memories.reduce(
      (acc, memory) => {
        const sentiment = memory.sentiment || 'neutral'
        acc[sentiment as keyof SentimentStats]++
        return acc
      },
      { positive: 0, negative: 0, neutral: 0, total: 0 }
    )
    stats.total = memories.length
    setSentimentStats(stats)
  }

  const calculateSentimentTrends = () => {
    // Group memories by date (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })

    const trends = last7Days.map(date => {
      const dayMemories = memories.filter(memory => {
        const memoryDate = new Date(memory.created_at).toISOString().split('T')[0]
        return memoryDate === date
      })

      const dayStats = dayMemories.reduce(
        (acc, memory) => {
          const sentiment = memory.sentiment || 'neutral'
          acc[sentiment as keyof SentimentStats]++
          return acc
        },
        { positive: 0, negative: 0, neutral: 0 }
      )

      return {
        date,
        ...dayStats
      }
    })

    setSentimentTrends(trends)
  }

  const doughnutData = {
    labels: ['Positivo', 'Neutro', 'Negativo'],
    datasets: [
      {
        data: [sentimentStats.positive, sentimentStats.neutral, sentimentStats.negative],
        backgroundColor: ['#10B981', '#6B7280', '#EF4444'],
        borderColor: ['#059669', '#4B5563', '#DC2626'],
        borderWidth: 2,
      },
    ],
  }

  const lineData = {
    labels: sentimentTrends.map(trend => {
      const date = new Date(trend.date)
      return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Positivo',
        data: sentimentTrends.map(trend => trend.positive),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Neutro',
        data: sentimentTrends.map(trend => trend.neutral),
        borderColor: '#6B7280',
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Negativo',
        data: sentimentTrends.map(trend => trend.negative),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  }

  const totalMemories = sentimentStats.positive + sentimentStats.negative + sentimentStats.neutral
  const positivePercentage = totalMemories > 0 ? ((sentimentStats.positive / totalMemories) * 100).toFixed(1) : '0'
  const averageConfidence = memories.length > 0 
    ? (memories.reduce((sum, memory) => sum + (memory.confidence || 0), 0) / memories.length * 100).toFixed(1)
    : '0'

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-lg">Carregando análises...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📊 Analytics</h1>
          <p className="text-blue-200">Análise de sentimentos das suas memórias</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-green-400 text-2xl font-bold">{sentimentStats.positive}</div>
            <div className="text-white text-sm">Memórias Positivas</div>
            <div className="text-green-300 text-xs">{positivePercentage}% do total</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-400 text-2xl font-bold">{sentimentStats.neutral}</div>
            <div className="text-white text-sm">Memórias Neutras</div>
            <div className="text-gray-300 text-xs">{totalMemories > 0 ? ((sentimentStats.neutral / totalMemories) * 100).toFixed(1) : '0'}% do total</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-red-400 text-2xl font-bold">{sentimentStats.negative}</div>
            <div className="text-white text-sm">Memórias Negativas</div>
            <div className="text-red-300 text-xs">{totalMemories > 0 ? ((sentimentStats.negative / totalMemories) * 100).toFixed(1) : '0'}% do total</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-blue-400 text-2xl font-bold">{averageConfidence}%</div>
            <div className="text-white text-sm">Confiança Média</div>
            <div className="text-blue-300 text-xs">Precisão da análise</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Distribution Chart */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Distribuição de Sentimentos</h2>
            <div className="h-64">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>

          {/* Trend Chart */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Tendência dos Últimos 7 Dias</h2>
            <div className="h-64">
              <Line data={lineData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">💡 Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-white">
              <h3 className="font-medium mb-2">Padrão Emocional</h3>
              <p className="text-sm text-blue-200">
                {sentimentStats.positive > sentimentStats.negative 
                  ? "Suas memórias mostram um padrão predominantemente positivo! 🌟"
                  : sentimentStats.negative > sentimentStats.positive
                  ? "Suas memórias mostram alguns desafios. Considere focar em momentos positivos. 💪"
                  : "Suas memórias mostram um equilíbrio emocional interessante. ⚖️"
                }
              </p>
            </div>
            <div className="text-white">
              <h3 className="font-medium mb-2">Qualidade da Análise</h3>
              <p className="text-sm text-blue-200">
                {parseFloat(averageConfidence) > 80
                  ? "Alta confiança na análise de sentimentos! 🎯"
                  : parseFloat(averageConfidence) > 60
                  ? "Boa confiança na análise de sentimentos. 👍"
                  : "Análise com confiança moderada. Mais dados podem melhorar a precisão. 📈"
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics