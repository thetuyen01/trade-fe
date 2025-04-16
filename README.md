# Trade App

A modern trading platform frontend built with React, Vite, and Ant Design.

## Features

- **Authentication**: Login, register, and logout functionality
- **Profile Management**: View and update user profile
- **Package Management**: Browse, purchase, and manage trading packages
- **Wallet**: View balance, deposit funds, and manage transactions
- **Transaction History**: Track all financial activities

## Tech Stack

- **React + Vite**: For fast development and optimized build
- **Zustand**: State management
- **React Query**: Data fetching and caching
- **React Router DOM**: Routing
- **Axios**: API requests
- **Tailwind CSS**: Utility-first styling
- **Ant Design**: UI components

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/your-username/trade-app.git
   cd trade-app
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your API base URL:

   ```
   VITE_API_BASE_URL=http://your-api-url.com/api
   ```

4. Start the development server:

   ```
   npm run dev
   ```

5. Build for production:
   ```
   npm run build
   ```

## Project Structure

```
src/
├── components/         # Reusable components
│   ├── layout/         # Layout components (Header, Sidebar, Footer)
│   └── shared/         # Shared components (LoadingSpinner, ErrorMessage)
├── pages/              # Route components
│   ├── auth/           # Authentication pages
│   ├── profile/        # User profile pages
│   ├── packages/       # Trading packages pages
│   ├── wallet/         # Wallet management
│   └── transactions/   # Transaction history
├── services/           # API service modules
├── store/              # Zustand store modules
├── hooks/              # Custom hooks
├── utils/              # Utility functions
├── App.tsx             # Main app component with routes
└── main.tsx            # Entry point
```

## API Integration

The app expects a REST API with the following endpoints:

- **Auth**: `/auth/login`, `/auth/register`, `/auth/logout`, `/auth/me`
- **Packages**: `/packages`, `/packages/user`, `/packages/purchase`, `/packages/cancel`
- **Wallet**: `/wallet`, `/wallet/transactions`, `/wallet/deposit`
- **Transactions**: `/transactions`

## License

This project is licensed under the MIT License.
