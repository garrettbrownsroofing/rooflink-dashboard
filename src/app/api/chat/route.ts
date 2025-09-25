import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { messages, dashboardData } = await request.json()

    if (!dashboardData) {
      return NextResponse.json({
        error: 'No dashboard data provided'
      }, { status: 400 })
    }

    // Create a system prompt that includes the dashboard data context
    const systemPrompt = `You are an AI assistant helping analyze roofing business data for a company in Monroe, LA. 

Current Dashboard Data:
- Region: ${dashboardData.region}
- Period: ${dashboardData.period}
- Date Range: ${dashboardData.startDate} to ${dashboardData.endDate}
- Contracts Signed: ${dashboardData.contractsSigned}
- Sold Revenue: $${dashboardData.soldRevenue.toLocaleString()}
- Door Knocking Leads: ${dashboardData.doorKnockingLeads}
- Company Generated Leads: ${dashboardData.companyGeneratedLeads}
- Total Leads: ${dashboardData.doorKnockingLeads + dashboardData.companyGeneratedLeads}
- Lead Conversion Rate: ${dashboardData.leadConversionPercentage.toFixed(1)}%
- Inspections: ${dashboardData.inspections}
- Claims Filed: ${dashboardData.claimsFiled}
- Claims Approved: ${dashboardData.claimsApproved}
- Claims Approval Rate: ${dashboardData.claimsFiled > 0 ? ((dashboardData.claimsApproved / dashboardData.claimsFiled) * 100).toFixed(1) : 0}%
- Backlog: ${dashboardData.backlog} jobs
- Average Revenue per Contract: $${dashboardData.contractsSigned > 0 ? Math.round(dashboardData.soldRevenue / dashboardData.contractsSigned).toLocaleString() : 0}

Your role is to:
1. Analyze this roofing business data and provide insights
2. Answer questions about performance, trends, and metrics
3. Give actionable recommendations for business improvement
4. Explain what the numbers mean in business context
5. Help identify opportunities and areas for improvement

Be helpful, professional, and focus on practical business insights. Use the actual data provided and avoid making assumptions about data not shown.`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    return NextResponse.json({
      message: completion.choices[0]?.message?.content || 'No response generated'
    })

  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json({
      error: 'Failed to get AI response'
    }, { status: 500 })
  }
}
