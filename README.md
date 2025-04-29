# Form Builder

A full-stack form builder application that allows users to create, manage, and share custom forms. Built with a modern frontend and backend stack.

## Features

- User authentication (login/register)
- Create and manage forms
- Multiple question types
- Real-time response tracking
- Share forms with anyone

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Deployment:** Vercel (Frontend), Railway (Backend)

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Kumarankit101/Forms.git
   cd Forms

### Frontend Setup

1. Navigate to Frontend directory:

```bash
cd Frontend

2. Set up environment variables:

Create a `.env` file in the root directory and add the following variables:
```bash
VITE_API_URL=URL_ADDRESS

```

3. Install dependencies:

```bash
npm install
```

4. Start development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5138`

### Backend Setup

1. Navigate to Backend directory:

```bash
cd Backend
```

2. Install dependencies:

```bash
npm install
```
e
3. Set up environment variables:

Create a `.env` file in the root directory and add the following variables:
```bash
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret

4. Run database migrations:

```bash
npx prisma migrate dev
```

5. Start development server:

```bash
npm run dev
```

The backend API will be available at `http://localhost:3000`
