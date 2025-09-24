# RoofLink Dashboard

A fresh, clean dashboard built with Next.js and powered by the RoofLink MCP (Model Context Protocol) server.

## Features

- 🚀 **Fresh Start**: Clean, minimal project structure
- 🔌 **MCP Integration**: Direct connection to RoofLink MCP server
- 📊 **Real-time Data**: Live data from RoofLink APIs
- 🎨 **Modern UI**: Built with Tailwind CSS
- 📱 **Responsive**: Works on all devices

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## MCP Server

This dashboard connects to the official RoofLink MCP server at:
- **URL**: `https://developers.rooflink.com/mcp`
- **Type**: Model Context Protocol server
- **Authentication**: Handled automatically by MCP

## Project Structure

```
src/
├── app/           # Next.js app directory
├── components/    # React components
├── lib/          # Utilities and MCP client
└── public/       # Static assets
```

## Deployment

This project is configured for automatic deployment to Vercel via GitHub.

## Next Steps

- [ ] Implement actual MCP client connection
- [ ] Add real data fetching from RoofLink APIs
- [ ] Build dashboard components
- [ ] Add authentication if needed
- [ ] Implement error handling and loading states