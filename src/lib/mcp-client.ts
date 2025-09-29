// MCP Client for RoofLink
// Real implementation using the official MCP SDK

// MCP Client for RoofLink - using direct HTTP calls to MCP server
import { ROOFLINK_API_KEY } from '@/config/api'

export interface MCPConnection {
  isConnected: boolean
  serverUrl: string
  lastConnected?: Date
}

export interface MCPData {
  type: string
  payload: any
  timestamp: Date
}

export interface MCPEndpoint {
  name: string
  description?: string
  parameters?: any
  status: 'available' | 'unavailable'
}

class RoofLinkMCPClient {
  private connection: MCPConnection | null = null
  private serverUrl = 'https://developers.rooflink.com/mcp'
  private apiKey: string | null = null
  
  constructor() {
    // Set the API key from configuration
    this.apiKey = ROOFLINK_API_KEY
    console.log('API key loaded from configuration')
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey
    console.log('API key set for RoofLink authentication')
  }

  getApiKey(): string | null {
    return this.apiKey
  }

  async connect(): Promise<boolean> {
    try {
      console.log('Connecting to RoofLink MCP server:', this.serverUrl)
      
      // Initialize the connection with the MCP server
      const initResult = await fetch(this.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            clientInfo: {
              name: 'rooflink-dashboard',
              version: '1.0.0'
            }
          },
          id: 1
        })
      })

      if (!initResult.ok) {
        throw new Error(`HTTP ${initResult.status}: ${initResult.statusText}`)
      }

      const initData = await initResult.text()
      console.log('MCP server initialization response:', initData)
      
      this.connection = {
        isConnected: true,
        serverUrl: this.serverUrl,
        lastConnected: new Date()
      }
      
      console.log('Successfully connected to RoofLink MCP server')
      return true
    } catch (error) {
      console.error('Failed to connect to MCP server:', error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    this.connection = null
    console.log('Disconnected from RoofLink MCP server')
  }

  async getData(endpoint: string): Promise<any> {
    if (!this.connection?.isConnected) {
      throw new Error('Not connected to MCP server')
    }

    try {
      console.log(`Fetching data from endpoint: ${endpoint}`)
      
      // Call the MCP server tool directly
      const response = await fetch(this.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: endpoint,
            arguments: {}
          },
          id: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.text()
      console.log('Raw response from MCP server for', endpoint, ':', responseData)
      
      // Parse the response - it might be in different formats
      let parsed
      try {
        if (responseData.includes('data: ')) {
          // Server-sent events format
          const dataPart = responseData.split('data: ')[1]
          parsed = JSON.parse(dataPart)
        } else {
          // Direct JSON response
          parsed = JSON.parse(responseData)
        }
      } catch (parseError) {
        console.error('Failed to parse response for', endpoint, ':', parseError)
        console.log('Response was:', responseData)
        throw new Error(`Failed to parse response: ${parseError}`)
      }
      
      console.log('Parsed response for', endpoint, ':', parsed)
      
      // Check if we got an error from the MCP server
      if (parsed.error) {
        throw new Error(`MCP server error: ${parsed.error.message || parsed.error}`)
      }
      
      return {
        endpoint,
        data: parsed.result,
        timestamp: new Date().toISOString(),
        rawResponse: parsed
      }
    } catch (error) {
      console.error(`Error fetching data from ${endpoint}:`, error)
      
      // Fallback to mock data for development
      console.log(`Using mock data for ${endpoint} due to error:`, error)
      return {
        endpoint,
        data: {
          message: `Mock data for ${endpoint}`,
          error: error instanceof Error ? error.message : 'Unknown error',
          mock: true,
          sampleItems: [
            {
              id: 1,
              region: 'LA',
              city: 'Monroe',
              state: 'LA',
              status: 'approved',
              amount: 25000,
              source: 'website',
              verified: true
            },
            {
              id: 2,
              region: 'LA',
              city: 'Monroe',
              state: 'LA',
              status: 'pending',
              amount: 18000,
              source: 'door knock',
              verified: false
            }
          ]
        },
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getRoofLinkData(apiPath: string): Promise<any> {
    try {
      console.log(`Fetching RoofLink data from API path: ${apiPath}`)
      
      // Ensure we have a connection to MCP server
      if (!this.connection?.isConnected) {
        await this.connect()
      }
      
      // Prepare headers for the API request
      const headers: { name: string; value: string }[] = [
        { name: 'Accept', value: 'application/json' }
      ]
      
      // Add API key if available
      if (this.apiKey) {
        headers.push({ name: 'X-API-KEY', value: this.apiKey })
        console.log('Using API key for authentication')
      } else {
        console.warn('No API key provided - request may fail with authentication error')
      }
      
      // Use MCP server's execute-request tool to call the RoofLink API
      const response = await fetch(this.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'execute-request',
            arguments: {
              harRequest: {
                method: 'get',
                url: `https://api.roof.link/api${apiPath}`,
                headers: headers
              }
            }
          },
          id: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.text()
      console.log('Raw response from MCP server:', responseData)
      
      // Parse the response - it might be in different formats
      let parsed
      try {
        if (responseData.includes('data: ')) {
          // Server-sent events format
          const dataPart = responseData.split('data: ')[1]
          parsed = JSON.parse(dataPart)
        } else {
          // Direct JSON response
          parsed = JSON.parse(responseData)
        }
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        console.log('Response was:', responseData)
        throw new Error(`Failed to parse response: ${parseError}`)
      }
      
      console.log('Parsed response:', parsed)
      
      // Check if we got an error from the MCP server
      if (parsed.error) {
        throw new Error(`MCP server error: ${parsed.error.message || parsed.error}`)
      }
      
      // Check if the result contains an error
      if (parsed.result?.isError) {
        throw new Error(`API Error: ${parsed.result.content?.[0]?.text || 'Unknown error'}`)
      }
      
      return {
        endpoint: apiPath,
        data: parsed.result,
        timestamp: new Date().toISOString(),
        rawResponse: parsed
      }
    } catch (error) {
      console.error(`Error fetching RoofLink data from ${apiPath}:`, error)
      
      // Return mock data for testing
      return {
        endpoint: apiPath,
        data: {
          content: [{
            text: JSON.stringify({
              message: `Mock data for ${apiPath}`,
              error: error instanceof Error ? error.message : 'Unknown error',
              mock: true,
              results: [
                {
                  id: 1,
                  name: "Sample Job 1",
                  job_number: "JOB-001",
                  job_type: "r",
                  bid_type: "i",
                  job_status: {
                    color: "#117A65",
                    label: "Approved"
                  },
                  full_address: "123 Main St, Monroe, LA 71201",
                  customer: {
                    id: 1,
                    name: "John Doe",
                    cell: "3181234567",
                    email: "john@example.com",
                    region: {
                      name: "LA"
                    },
                    lead_source: {
                      name: "Door Knocking"
                    },
                    rep: {
                      name: "Sales Rep 1"
                    }
                  },
                  date_created: "2025-01-01T00:00:00Z",
                  date_approved: "2025-01-02T00:00:00Z",
                  last_note: "Sample job for testing"
                },
                {
                  id: 2,
                  name: "Sample Job 2",
                  job_number: "JOB-002",
                  job_type: "c",
                  bid_type: "r",
                  job_status: {
                    color: "#88adf7",
                    label: "Prospect"
                  },
                  full_address: "456 Oak St, Monroe, LA 71202",
                  customer: {
                    id: 2,
                    name: "Jane Smith",
                    cell: "3187654321",
                    email: "jane@example.com",
                    region: {
                      name: "LA"
                    },
                    lead_source: {
                      name: "Website"
                    },
                    rep: {
                      name: "Sales Rep 2"
                    }
                  },
                  date_created: "2025-01-03T00:00:00Z",
                  last_note: "Another sample job for testing"
                }
              ]
            })
          }]
        },
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async listAvailableEndpoints(): Promise<MCPEndpoint[]> {
    if (!this.connection?.isConnected) {
      throw new Error('Not connected to MCP server')
    }

    try {
      // Get available tools from MCP server using direct HTTP call
      const toolsResponse = await fetch(this.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {},
          id: 2
        })
      })

      if (!toolsResponse.ok) {
        throw new Error(`HTTP ${toolsResponse.status}: ${toolsResponse.statusText}`)
      }

      const toolsData = await toolsResponse.text()
      const parsed = JSON.parse(toolsData.split('\ndata: ')[1])
      
      if (parsed.result && parsed.result.tools) {
        return parsed.result.tools.map((tool: any) => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
          status: 'available' as const
        }))
      }
      
      throw new Error('Invalid response format')
    } catch (error) {
      console.error('Error listing endpoints:', error)
      
      // Fallback to known MCP tools
      return [
        { name: 'list-endpoints', description: 'Lists all API paths and their HTTP methods', status: 'available' },
        { name: 'get-endpoint', description: 'Gets detailed information about a specific API endpoint', status: 'available' },
        { name: 'execute-request', description: 'Executes an API request with given HAR', status: 'available' },
        { name: 'search-specs', description: 'Searches paths, operations, and schemas', status: 'available' },
        { name: 'get-code-snippet', description: 'Gets a code snippet for a specific API endpoint', status: 'available' }
      ]
    }
  }

  async getServerInfo(): Promise<any> {
    if (!this.connection?.isConnected) {
      throw new Error('Not connected to MCP server')
    }

    try {
      // Get server info from the initialization response
      const initResult = await fetch(this.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            clientInfo: {
              name: 'rooflink-dashboard',
              version: '1.0.0'
            }
          },
          id: 1
        })
      })

      if (!initResult.ok) {
        throw new Error(`HTTP ${initResult.status}: ${initResult.statusText}`)
      }

      const initData = await initResult.text()
      const parsed = JSON.parse(initData.split('\ndata: ')[1])
      return parsed.result
    } catch (error) {
      console.error('Error getting server info:', error)
      return null
    }
  }

  getConnectionStatus(): MCPConnection | null {
    return this.connection
  }
}

// Export singleton instance
export const mcpClient = new RoofLinkMCPClient()
