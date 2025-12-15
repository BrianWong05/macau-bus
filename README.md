# Macau Bus Tracker (MacauBus-Web)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)

A modern, mobile-first web application for tracking public transit in Macau. Providing real-time bus arrivals, route information, and traffic status in a clean, user-friendly interface.

[**Live Demo**](https://your-username.github.io/macau_bus) <!-- Replace with your actual GitHub Pages URL -->

## 🚀 Features

*   **Real-Time Tracking**: Live bus locations and arrival times (ETA).
*   **Multi-Language Support**: Fully localized in Traditional Chinese (繁體中文), English, and Portuguese (Português).
*   **Mobile-First Design**: Optimized for on-the-go usage with a responsive UI built using Tailwind CSS.
*   **Interactive Maps**: Visual bus tracking on map interfaces.
*   **Route & Stop Info**: Detailed lists of stops and routes with direction switching.
*   **En-Route Visualization**: Clear indicators for buses currently in transit between stops.

## 🏗️ Architecture & Key Challenges

### The "No-Backend" Challenge
This project is a **serverless application**. It is designed to run entirely in the user's browser without a dedicated backend server maintained by the developer. This architectural choice minimizes hosting costs and maintenance overhead but introduces significant challenges in communicating with legacy or secure external APIs.

### The CORS Solution
The data source for this application is the official Macau DSAT (Transport Bureau) API (`bis.dsat.gov.mo`). Browsers enforce Cross-Origin Resource Sharing (CORS) policies that block web applications from fetching data directly from servers that do not explicitly allow it.

To bypass this restriction without a backend, this project utilizes a **CORS Proxy**:
1.  **Request**: The React app sends a request to a CORS proxy (e.g., `corsproxy.io` or a custom Cloudflare Worker).
2.  **Forward**: The proxy forwards the request to the DSAT API.
3.  **Response**: The proxy receives the data and sends it back to the React app with the necessary CORS headers (`Access-Control-Allow-Origin: *`).

**Data Flow:**
`User Browser (React App) <-> CORS Proxy <-> DSAT SOAP/REST API`

*Note: This approach allows fetching insecure HTTP or non-standard port data from a secure HTTPS host (GitHub Pages).*

## 🛠️ Technology Stack

*   **Framework**: [React](https://reactjs.org/) (via [Vite](https://vitejs.dev/))
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Internationalization**: [react-i18next](https://react.i18next.com/)
*   **State Management**: React Hooks & Context
*   **Maps**: [Leaflet](https://leafletjs.com/) (via react-leaflet)

## 🏁 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v16 or higher recommended)
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/macau_bus.git
    cd macau_bus
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Running Locally

Start the development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

### Building for Production

Build the app for deployment (e.g., to GitHub Pages):
```bash
npm run build
```
The output files will be in the `dist` directory.

## ⚙️ Configuration

The API configuration is located in `src/services/api.ts`. If you need to switch CORS proxies or update the API endpoint:

```typescript
// src/services/api.ts

// Service URL
const BASE_URL = 'http://bis.dsat.gov.mo:8088/macau-bus';

// To change the proxy, update the createApiClient function or the request logic
// effectively wrapping the URL: `https://corsproxy.io/?${encodeURIComponent(url)}`
```

## ⚠️ Disclaimer

This application is an **unofficial client** and is not affiliated with, endorsed by, or connected to the Transport Bureau (DSAT) of Macau. All data is retrieved from public endpoints. Data accuracy is subject to the original source.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
