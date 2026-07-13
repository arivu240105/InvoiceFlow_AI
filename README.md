# InvoiceFlow AI 🚀

> **Intelligent Invoice Processing & Finance Automation Assistant**

InvoiceFlow AI is an AI-powered finance automation platform designed to streamline accounts payable workflows. By automatically extracting structured ledger data, running logical validations, assessing compliance risks, and generating professional Excel summaries, it saves finance teams hours of manual entry and eliminates calculation errors.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 (Vite, TypeScript)
- **Styling**: Tailwind CSS v3 (Glassmorphic dark design)
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

### Backend
- **Framework**: FastAPI (Python 3.12)
- **Execution Server**: Uvicorn
- **Parser**: PyMuPDF (`fitz` for digital extraction)
- **Data Reconciliations**: Pandas & Openpyxl (Excel formatting)
- **API Clients**: Gemini API (via `google-genai`), OpenAI SDK, Groq API

---

## 🏗️ Folder Structure

```
invoiceflow-ai/
├── backend/
│   ├── main.py                 # FastAPI Entrypoint
│   ├── api/
│   │   └── endpoints.py        # Upload, Extract, Validate, Chat, Exports routes
│   ├── services/
│   │   ├── ocr_service.py      # PDF parsing & layout checks
│   │   ├── llm_service.py      # LLM clients & local Mock logic
│   │   ├── validation_service.py # Calculations & risk engine
│   │   └── export_service.py   # openpyxl Excel & CSV decorators
│   ├── requirements.txt
│   └── test_api.py             # Integration test harness
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Tab dashboard controller
│   │   ├── utils/
│   │   │   └── api.ts          # Axios endpoints
│   │   └── components/
│   │       ├── UploadZone.tsx  # Drag/drop upload & sandbox loader
│   │       ├── InvoiceViewer.tsx # Iframe PDF/Image previews
│   │       ├── ExtractionPanel.tsx # Editable metadata fields & line items
│   │       ├── ValidationPanel.tsx # Compliance checklists
│   │       ├── RiskDetectionPanel.tsx # SVG circular confidence gauge
│   │       ├── ChatBot.tsx     # Context-aware chat sidebar
│   │       └── ExportCenter.tsx # Export actions (XLSX, CSV, JSON)
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## 🚦 AI Pipeline & Execution Flow

```
   [ Upload Invoice ]  --> PDF or Image
          │
          ▼
   [ Text Parsing ]    --> Searchable text extracted via PyMuPDF (fitz)
          │
          ▼
 [ Structured Extract ] --> Parse metadata & line items into Pydantic models using LLMs
          │
          ▼
 [ Compliance Audit ]   --> Reconcile sums, check tax IDs, chronological dates
          │
          ▼
 [ Executive Summary ]  --> Generate summary markdown and set Chat contexts
          │
          ▼
 [ Downstream Action ]  --> Query chatbot, export ledger reports (XLSX, CSV, JSON)
```

---

## 🔌 Sandbox & Local Mock Mode

To make hacking and testing seamless, the system has a built-in **Mock LLM & Text Engine**. If no API keys are found in your `.env` configuration, the backend automatically intercepts calls to extract, validate, and chat, serving highly realistic structured outputs.

Furthermore, we've integrated three standard **Quick Testing Invoices** on the landing page:
1. **Acme IT Services** (USD, valid invoice data)
2. **Global Office Supplies** (USD, valid invoice data)
3. **EcoPower Solar** (EUR, valid invoice data)

---

## 🚀 Getting Started

### 1. Configure the Backend
Ensure you have Python 3.12+ installed. 

```bash
# Navigate to the backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Set up LLM API credentials in .env
copy .env.example .env
```

To run the backend server:
```bash
python main.py
```
The server starts at `http://127.0.0.1:8000`.

### 2. Configure the Frontend
Ensure you have Node.js and npm installed.

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```
The application starts at `http://localhost:5173`. Open this URL in your browser to run the app.

---

## 🧪 Running Integration Tests

We have written complete integration tests verifying API schema boundaries and session parameters. To run the test suite:

```bash
# From the root directory:
backend/venv/Scripts/python backend/test_api.py
```
All 6 tests should output `OK`.
