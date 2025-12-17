# 🚌 Macau Bus Tracker (MacauBus-Web)

A modern, fast, and mobile-friendly web application for tracking real-time public bus information in Macau. Built with **React** and **Vite**, this project aims to provide a superior user experience compared to existing solutions.

## ✨ Key Features

*   **Real-Time Tracking**: View live bus locations moving on the route timeline.
*   **Intelligent ETA**: Accurate estimated arrival times calculated using real-time traffic data, dwell times, and bus speed.
*   **Nearest Stop Locator**: One-tap geolocation to find the closest bus stop to you.
*   **Interactive Maps**: Visualize full route paths and traffic conditions using **Leaflet**.
*   **Traffic Visualization**: Color-coded segments (Green/Yellow/Red) showing real-time road congestion.
*   **Multi-Language Support**: Fully localized in Traditional Chinese (繁中), English, and Portuguese (Português).
*   **Responsive Design**: optimized for mobile devices with swipe gestures and bottom sheets.
*   **PWA Ready**: designed to look and feel like a native app.

## 🛠 Tech Stack

*   **Frontend Framework**: [React 19](https://react.dev/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Maps**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
*   **State & Data**: Custom Hooks, Context API
*   **HTTP Client**: [Axios](https://axios-http.com/)
*   **Internationalization**: [i18next](https://www.i18next.com/)
*   **Deployment**: GitHub Pages

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/BrianWong05/macau_bus.git
    cd macau_bus
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:5173/macau_bus/](http://localhost:5173/macau_bus/) in your browser.

## 📱 Usage

1.  **Select a Route**: Choose a bus route (e.g., 25, 26A, 33) from the dashboard.
2.  **View Stops**: See the list of stops with live bus icons moving between them.
3.  **Find Nearest**: Click the **📍** floating button to scroll to your closest stop.
4.  **Check Map**: Tap "Map" or the map icon to view the route on a map overlay.
5.  **Switch Direction**: Use the "Switch Direction" button to see the return route.

## 📂 Project Structure

```
src/
├── assets/          # Static assets
├── components/      # Reusable UI components (BusList, RouteMapModal, etc.)
├── features/        # Feature-based modules (route-tracker logic)
├── hooks/           # Custom React hooks (useRouteData, useTraffic)
├── services/        # API integration (fetch functions)
├── utils/           # Helper functions (distance calc, formatting)
├── i18n/            # Localization configuration
├── App.tsx          # Main application entry
└── main.tsx         # React root
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

Status: **Active Development** 🚧
