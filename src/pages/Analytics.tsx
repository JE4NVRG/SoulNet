import React, { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Pie, Line, Bar } from 'react-chartjs-2'
import { Brain, TrendingUp, BarChart3, Target, Smile, Meh, Frown, AlertCircle, Flame } from 'lucide-react'
import { apiFetch } from '../lib/apiClient'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface AnalyticsData {
  totalMemories: number
  typeDistribution: {
    profile: number
    preference: number
    goal: number
    skill: number
    fact: number
  }
  sentimentStats: {
    positive: number
    neutral: number
    negative: number
  }
  averageConfidence: number
  streak: number
  timelineData: Array<{
    month: string
    monthName: string
    count: number
  }>
  memoriesByMonth: Array<{
    month: string
    count: number
  }>
  memoriesByYear: Array<{
    year: string
    count: number
  }>
}

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiFetch('/api/analytics')
        const data = await response.json()
        
        if (data.success) {
          setAnalyticsData(data.data)
        } else {
          setError(data.error || 'Erro ao carregar analytics')
        }
      } catch (err) {
        console.error('Error loading analytics:', err)
        setError('Erro ao carregar dados de analytics')
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  // Sentiment Distribution (Pie Chart)
  const sentimentData = {
    labels: ['Positivo', 'Neutro', 'Negativo'],
    datasets: [
      {
        data: analyticsData ? [
          analyticsData.sentimentStats.positive,
          analyticsData.sentimentStats.neutral,
          analyticsData.sentimentStats.negative
        ] : [0, 0, 0],
        backgroundColor: ['#10B981', '#6B7280', '#EF4444'],
        borderColor: ['#059669', '#4B5563', '#DC2626'],
        borderWidth: 2,
      },
    ],
  }

  // Monthly Timeline (Line Chart)
  const timelineData = {
    labels: analyticsData?.timelineData.map(item => item.monthName) || [],
    datasets: [
      {
        label: 'Memórias por Mês',
        data: analyticsData?.timelineData.map(item => item.count) || [],
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  }

  // Type Distribution (Bar Chart)
  const typeData = {
    labels: ['Perfil', 'Preferência', 'Meta', 'Habilidade', 'Fato'],
    datasets: [
      {
        label: 'Memórias por Tipo',
        data: analyticsData ? [
          analyticsData.typeDistribution.profile,
          analyticsData.typeDistribution.preference,
          analyticsData.typeDistribution.goal,
          analyticsData.typeDistribution.skill,
          analyticsData.typeDistribution.fact
        ] : [0, 0, 0, 0, 0],
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6'
        ],
        borderColor: [
          '#2563EB',
          '#059669',
          '#D97706',
          '#DC2626',
          '#7C3AED'
        ],
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'white',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'white',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: 'white',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'white',
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
      },
    },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-lg">Carregando...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-lg">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-lg">Nenhum dado disponível</div>
          </div>
        </div>
      </div>
    )
  }

  const totalMemories = analyticsData.sentimentStats.positive + analyticsData.sentimentStats.negative + analyticsData.sentimentStats.neutral
  const positivePercentage = totalMemories > 0 ? ((analyticsData.sentimentStats.positive / totalMemories) * 100).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Análise de Sentimentos</h1>
          <p className="text-blue-200">Visualize como seus sentimentos evoluem ao longo do tempo</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-green-400 text-2xl font-bold">{analyticsData.sentimentStats.positive}</div>
            <div className="text-white text-sm">Memórias Positivas</div>
            <div className="text-green-300 text-xs">{positivePercentage}% do total</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-gray-400 text-2xl font-bold">{analyticsData.sentimentStats.neutral}</div>
            <div className="text-white text-sm">Memórias Neutras</div>
            <div className="text-gray-300 text-xs">{totalMemories > 0 ? ((analyticsData.sentimentStats.neutral / totalMemories) * 100).toFixed(1) : '0'}% do total</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-red-400 text-2xl font-bold">{analyticsData.sentimentStats.negative}</div>
            <div className="text-white text-sm">Memórias Negativas</div>
            <div className="text-red-300 text-xs">{totalMemories > 0 ? ((analyticsData.sentimentStats.negative / totalMemories) * 100).toFixed(1) : '0'}% do total</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-blue-400 text-2xl font-bold">{analyticsData.averageConfidence}%</div>
            <div className="text-white text-sm">Confiança Média</div>
            <div className="text-blue-300 text-xs">Precisão da análise</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sentiment Distribution */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Distribuição de Sentimentos</h2>
            <div className="h-64">
              <Pie data={sentimentData} options={doughnutOptions} />
            </div>
          </div>

          {/* Trend Chart */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Tendência Mensal</h2>
            <div className="h-64">
              <Line data={timelineData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Type Distribution Chart */}
        <div className="mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Distribuição por Tipo</h2>
            <div className="h-64">
              <Bar data={typeData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium mb-2">Padrão Emocional</h3>
                <p className="text-sm text-blue-200">
                  {analyticsData.sentimentStats.positive > analyticsData.sentimentStats.negative 
                    ? "Suas memórias mostram um padrão predominantemente positivo! 🌟"
                    : analyticsData.sentimentStats.negative > analyticsData.sentimentStats.positive
                    ? "Suas memórias mostram alguns desafios. Considere focar em momentos positivos. 💪"
                    : "Suas memórias mostram um equilíbrio emocional interessante. ⚖️"
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Target className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-medium mb-2">Qualidade da Análise</h3>
                <p className="text-sm text-blue-200">
                  {analyticsData.averageConfidence > 80
                    ? "Alta confiança na análise de sentimentos! 🎯"
                    : analyticsData.averageConfidence > 60
                    ? "Boa confiança na análise de sentimentos. 👍"
                    : "Análise com confiança moderada. Mais dados podem melhorar a precisão. 📈"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics