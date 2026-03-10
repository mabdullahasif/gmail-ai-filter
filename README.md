# Gmail AI Filter 

A modern, real-time AI-powered dashboard designed to intelligently filter and organize your Gmail inbox. Built with **FastAPI**, **React 19**, and **Tailwind CSS v4**.

---

## Project Structure

The project is structured as a unified monorepo for easier development:

- **Root `/`**: Frontend repository (React + TypeScript + Vite).
- **`/backend`**: Python logic (FastAPI + Socket.io + IMAP scripts).
- **`/src`**: Modern UI components powered by Framer Motion.

## Features

- **Real-time Monitoring**: Connect live to your inbox via **WebSockets** and track the scan progress, byte-by-byte.
- **Key-based Categorization**: Intelligent rules group emails into *Priority*, *Support*, *Sales*, *Billing*, *Spam*, and more.
- **Sentiment Analysis**: Automatically flags emails with negative sentiment using **TextBlob**, moving them to Priority for urgent response.
- **Bank & Domain Routing**: Detects financial entities (Meezan, EasyPaisa, etc.) and routes them to dedicated sub-labels.
- **Premium UI/UX**: Glassmorphic dashboard with scrolling logs, animated progress bars, and high-performance transitions.
- **Secure Architecture**: Uses Google's standard IMAP protocol with dedicated **App Password** support.

---

## Getting Started

### 1. Prerequisites
- **Python 3.10+** (for the backend)
- **Node.js 18+ & npm** (for the dashboard)
- A Gmail account with **IMAP enabled**.

### 2. Quick Setup (Root)

Run these commands from the main project folder:

1.  **Install Frontend Dependencies**:
    ```bash
    npm install
    ```
2.  **Install Backend Dependencies**:
    ```bash
    pip install -r backend/requirements.txt
    ```
3.  **Start Both Services**:
    ```bash
    npm run start
    ```
    - **Frontend**: Available at [`http://localhost:5173`](http://localhost:5173)
    - **Backend**: Health check at [`http://localhost:8001`](http://localhost:8001)

---

## Configuration & Security

### Generating an App Password
For security, Gmail requires an **App Password** instead of your primary login:
1.  Go to your [Google Account App Passwords](https://myaccount.google.com/apppasswords).
2.  Generate a new password for **"Mail"** (it will be a 16-character code).
3.  Launch the dashboard and enter your email and this 16-character key.

### Filtering Logic
You can customize the detection rules in `backend/filter_logic.py`:
- `labels_required`: New Gmail folders to auto-create.
- `domain_filters`: Specific sender associations.
- `keywords`: Custom terms for categorizing Support, Billing, etc.

---

## Available Scripts

- `npm run dev`: Runs the Vite frontend only.
- `npm run backend`: Runs the FastAPI server only.
- `npm run start`: Parallelizes both frontend and backend for a seamless workspace.
- `npm run lint`: Performs ESLint checks on your TSX files.

---

## Contributing
Contributions are welcome! Submit a PR or open an issue to suggest further AI enhancements or UI refinements.

