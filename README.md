# GreenTrace 🌍

**Live Application:** [https://greentrace-650561528596.us-central1.run.app/](https://greentrace-650561528596.us-central1.run.app/)

GreenTrace is an AI-powered carbon footprint tracker and personalized coaching application. Rather than giving generic advice, it analyzes a user's logged travel, diet, and energy data to provide hyper-personalized, actionable sustainability recommendations.

## 🌟 App Functionality

### 1. Activity Tracking & Emission Calculation
Users can log daily activities across three main categories:
- **Travel**: Input transportation modes (e.g., car, public transit, walking) and distance.
- **Diet**: Log meal types and dietary habits.
- **Energy**: Track household electricity and energy usage.
The application processes these inputs and calculates an estimated carbon emission score based on standard emission factors.

### 2. AI Sustainability Coach (Google Gemini)
GreenTrace integrates the Google Gemini API (`gemini-1.5-flash`) to offer dynamic, interactive chat capabilities. 
- The AI acts as a dedicated sustainability coach.
- It is context-aware, reading the user's past activities and generating highly specific, personalized suggestions instead of generic tips.
- Includes smart fallback mechanisms to ensure the chat remains responsive even if AI services are temporarily unavailable.

### 3. Geographic Footprint Map (Google Maps)
A dedicated Travel Map feature visually plots the user's footprint impact on a geographic interface:
- **Heatmap Indicators**: Uses color-coded markers (green, yellow, red) to indicate the intensity of emissions for specific trips.
- **Sustainability Comparisons**: Visualizes how individual choices compare against eco-friendly alternatives.

### 4. User Profiles & Secure Authentication
A complete user authentication system ensures data privacy:
- Secure login and registration.
- Encrypted password storage using `bcryptjs`.
- Session management via JSON Web Tokens (JWT).

## 🏗️ Code Architecture & Technology

The project is structured as a full-stack JavaScript monorepo, maintaining clear separation of concerns between the client and server.

### Frontend Client
- **Framework**: React (built with Vite)
- **Styling**: Tailwind CSS / Vanilla CSS for a premium, responsive, and dynamic user interface with glassmorphism and modern aesthetics.
- **State & Data Fetching**: Context API / Hooks for global state and async API requests.
- **Component Architecture**: Modular component design separating UI elements (e.g., Maps, Chat interface, Dashboard widgets).

### Backend Server
- **Runtime**: Node.js with Express.js framework.
- **Database**: Native Node.js SQLite (`node:sqlite`). A file-based database for seamless data persistence and rapid querying, with relational tables for Users, Activities, and Sessions.
- **Security**: Includes `helmet` for HTTP headers, `express-rate-limit` for mitigating brute-force attacks, and `zod` for strict request validation.
- **AI Integration Service**: An isolated service layer that handles the Gemini API configuration, context building, prompt engineering, and intelligent fallback responses.
