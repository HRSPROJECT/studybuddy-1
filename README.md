# StudyBuddy AI Learning Assistant

StudyBuddy is an AI-powered learning assistant that helps students get answers to their questions and explanations for complex concepts. It combines multiple AI services with web search to provide accurate, educational responses.

## Features

- **Ask Mode**: Upload an image of your question or enter text, and receive a detailed answer
  - Image and text understanding with Groq AI
  - Accurate web search to supplement AI knowledge
  - Follow-up questions for continued learning

- **Explain Mode**: Get comprehensive explanations of any concept
  - Dynamic research with web search for accurate information
  - Structured explanations with citations and sources
  - Image upload capabilities for visual questions

- **Technical Capabilities**:
  - Image recognition and text extraction from images
  - Web search integration for up-to-date information
  - API key rotation for uninterrupted service
  - Cloudflare Workers for secure API integration

## Technology Stack

- **Frontend**: React with Vite, Material UI
- **AI Services**: 
  - Groq AI (llama-3.2-90b-vision-preview) for image/text understanding
  - Google Gemini 2.0 Flash for answering questions
- **Web Search**: Tavily API for accurate research
- **API Management**: Cloudflare Workers

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- API keys for:
  - Groq AI
  - Google Gemini
  - Tavily Search

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/HRSPROJECT/studybuddy-1.git
   cd studybuddy-1
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your API keys in the Cloudflare Worker:
   - Navigate to `/src/cloudflare/worker.js`
   - Add your API keys to the corresponding arrays or configure them in Cloudflare Dashboard

4. Deploy the Cloudflare Worker:
   ```
   cd src/cloudflare
   npx wrangler deploy
   ```

5. Update the API endpoint in `/src/services/aiService.js` with your Cloudflare Worker URL

6. Start the development server:
   ```
   npm run dev
   ```

## Deployment

### GitHub Pages

1. Update the `vite.config.js` file with your repository name
2. Deploy to GitHub Pages:
   ```
   npm run deploy
   ```

### Other Deployment Options

- Vercel: Connect your GitHub repository for automatic deployments
- Netlify: Connect your GitHub repository or use the Netlify CLI

## API Key Management

The application uses Cloudflare Workers to manage multiple API keys for each service, allowing for:

1. API key rotation to prevent rate limiting
2. Secure storage of keys (not exposed to frontend)
3. Automatic fallback if one key reaches its limit

### Setting Up Multiple API Keys

1. Obtain multiple API keys from each service provider
2. Add them to your Cloudflare Worker environment variables
3. The worker will automatically handle rotation based on usage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
