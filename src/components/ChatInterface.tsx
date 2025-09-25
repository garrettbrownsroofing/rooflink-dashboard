'use client'

import { useState, useRef, useEffect } from 'react'
import { MonroeDashboardMetrics } from '@/types/rooflink'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isLoading?: boolean
}

interface ChatInterfaceProps {
  dashboardData: MonroeDashboardMetrics | null
  isConnected: boolean
}

export default function ChatInterface({ dashboardData, isConnected }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your RoofLink data assistant. I can help you analyze your dashboard metrics, answer questions about your business performance, and provide insights about your roofing business in Monroe, LA. What would you like to know?',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const generateContextualResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()
    
    // If no dashboard data, provide general help
    if (!dashboardData) {
      return "I don't have access to your dashboard data yet. Please connect to the RoofLink MCP server and fetch your data first. Once you have data loaded, I can help you analyze your business metrics, trends, and provide insights about your roofing business performance."
    }

    // Revenue and financial questions
    if (message.includes('revenue') || message.includes('sales') || message.includes('money')) {
      const avgRevenue = dashboardData.contractsSigned > 0 ? dashboardData.soldRevenue / dashboardData.contractsSigned : 0
      return `Your current sold revenue is ${formatCurrency(dashboardData.soldRevenue)} from ${dashboardData.contractsSigned} contracts. That's an average of ${formatCurrency(avgRevenue)} per contract. Your revenue is based on ${dashboardData.period} data.`
    }

    // Lead generation questions
    if (message.includes('lead') || message.includes('prospect')) {
      const totalLeads = dashboardData.doorKnockingLeads + dashboardData.companyGeneratedLeads
      const doorKnockingPercentage = totalLeads > 0 ? (dashboardData.doorKnockingLeads / totalLeads) * 100 : 0
      return `You have ${totalLeads} total leads: ${dashboardData.doorKnockingLeads} from door knocking (${doorKnockingPercentage.toFixed(1)}%) and ${dashboardData.companyGeneratedLeads} company generated leads. Your lead conversion rate is ${dashboardData.leadConversionPercentage.toFixed(1)}% with ${dashboardData.inspections} inspections completed.`
    }

    // Performance and conversion questions
    if (message.includes('conversion') || message.includes('performance') || message.includes('how well')) {
      return `Your business performance metrics: Lead conversion rate is ${dashboardData.leadConversionPercentage.toFixed(1)}% (${dashboardData.inspections} inspections from ${dashboardData.doorKnockingLeads + dashboardData.companyGeneratedLeads} leads). You have ${dashboardData.contractsSigned} contracts signed with ${dashboardData.backlog} jobs in backlog.`
    }

    // Claims questions
    if (message.includes('claim') || message.includes('insurance')) {
      const approvalRate = dashboardData.claimsFiled > 0 ? (dashboardData.claimsApproved / dashboardData.claimsFiled) * 100 : 0
      return `You have ${dashboardData.claimsFiled} claims filed with ${dashboardData.claimsApproved} approved. That's a ${approvalRate.toFixed(1)}% approval rate. This data is from ${dashboardData.period}.`
    }

    // Backlog questions
    if (message.includes('backlog') || message.includes('pending') || message.includes('scheduled')) {
      return `You have ${dashboardData.backlog} jobs in your backlog. These are approved jobs that haven't been scheduled, completed, or closed yet. This represents ${dashboardData.backlog} potential revenue opportunities that need attention.`
    }

    // General summary
    if (message.includes('summary') || message.includes('overview') || message.includes('how am i doing')) {
      return `Here's your Monroe, LA roofing business summary for ${dashboardData.period}:

📊 **Revenue**: ${formatCurrency(dashboardData.soldRevenue)} from ${dashboardData.contractsSigned} contracts
👥 **Leads**: ${dashboardData.doorKnockingLeads + dashboardData.companyGeneratedLeads} total (${dashboardData.doorKnockingLeads} door knocking, ${dashboardData.companyGeneratedLeads} company generated)
🔍 **Inspections**: ${dashboardData.inspections} completed (${dashboardData.leadConversionPercentage.toFixed(1)}% conversion rate)
📋 **Claims**: ${dashboardData.claimsFiled} filed, ${dashboardData.claimsApproved} approved
⏳ **Backlog**: ${dashboardData.backlog} jobs pending

Your business is performing well with a solid conversion rate and good revenue generation!`
    }

    // Trend analysis
    if (message.includes('trend') || message.includes('compare') || message.includes('vs')) {
      return `To analyze trends, I'd need historical data from multiple time periods. Currently, I can only see your ${dashboardData.period} data. To get trend analysis, you could compare this period's metrics with previous periods by changing the date range in your dashboard.`
    }

    // Recommendations
    if (message.includes('recommend') || message.includes('improve') || message.includes('suggest')) {
      const recommendations = []
      
      if (dashboardData.leadConversionPercentage < 50) {
        recommendations.push("• Focus on improving lead conversion - consider better qualification processes")
      }
      if (dashboardData.backlog > 5) {
        recommendations.push("• Address your backlog of pending jobs to maintain customer satisfaction")
      }
      if (dashboardData.doorKnockingLeads > dashboardData.companyGeneratedLeads * 2) {
        recommendations.push("• Diversify lead sources - consider investing more in company-generated leads")
      }
      if (dashboardData.claimsApproved / Math.max(1, dashboardData.claimsFiled) < 0.8) {
        recommendations.push("• Review claims filing process to improve approval rates")
      }
      
      if (recommendations.length === 0) {
        recommendations.push("• Your metrics look strong! Consider scaling successful strategies")
      }
      
      return `Based on your current metrics, here are my recommendations:\n\n${recommendations.join('\n')}\n\nYour overall performance is solid with ${dashboardData.contractsSigned} contracts and ${formatCurrency(dashboardData.soldRevenue)} in revenue.`
    }

    // Default response for unrecognized queries
    return `I can help you analyze your roofing business data! Here's what I can tell you about:

• **Revenue & Sales**: Ask about your ${formatCurrency(dashboardData.soldRevenue)} in sold revenue
• **Lead Performance**: ${dashboardData.doorKnockingLeads + dashboardData.companyGeneratedLeads} total leads with ${dashboardData.leadConversionPercentage.toFixed(1)}% conversion
• **Business Summary**: Get an overview of all your metrics
• **Claims Status**: ${dashboardData.claimsFiled} claims filed, ${dashboardData.claimsApproved} approved
• **Backlog**: ${dashboardData.backlog} jobs pending completion
• **Recommendations**: Get AI-powered suggestions for improvement

What specific aspect of your business would you like me to analyze?`
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue('')
    setIsLoading(true)

    try {
      // Prepare messages for OpenAI API
      const apiMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      
      apiMessages.push({
        role: 'user',
        content: currentInput
      })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          dashboardData: dashboardData
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error getting AI response:', error)
      
      // Fallback to local response generation
      const response = generateContextualResponse(currentInput)
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response + '\n\n*Note: Using local analysis. OpenAI integration requires API key configuration.*',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const suggestedQuestions = [
    "How is my revenue performance?",
    "What's my lead conversion rate?",
    "Give me a business summary",
    "How many jobs are in my backlog?",
    "What recommendations do you have?"
  ]

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">AI Data Assistant</h3>
          <p className="text-sm text-gray-600">Ask questions about your RoofLink data</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dashboardData ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-xs text-gray-500">
            {dashboardData ? 'Data Available' : 'No Data'}
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              <div className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInputValue(question)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about your dashboard data..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {/* Status Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="flex items-start gap-2">
          <div className="text-blue-600 mt-0.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium">AI Assistant Features:</p>
            <ul className="mt-1 text-xs space-y-1">
              <li>• Powered by OpenAI GPT for intelligent data analysis</li>
              <li>• Analyze your dashboard metrics and trends</li>
              <li>• Answer questions about revenue, leads, and performance</li>
              <li>• Provide business insights and recommendations</li>
              <li>• Generate summaries and reports</li>
              <li>• Contextual understanding of your roofing business</li>
            </ul>
            <p className="text-xs text-blue-600 mt-2">
              <strong>Note:</strong> OpenAI integration requires OPENAI_API_KEY environment variable. 
              Falls back to local analysis if not configured.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
