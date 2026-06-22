# ⚡ Zentryx WMS | Gigafactory Logistics Platform

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**[🔗 View Live Demo](#) | [📄 View Portfolio Deck](#)** *(Don't forget to insert your actual links here!)*

## 🏭 Project Overview
**Zentryx WMS** is a frontend prototype of a Gigafactory-level Warehouse Management System. Modeled around an Electric Vehicle (EV) Manufacturing environment, this application was built to demonstrate how complex physical logistics—such as supply chain bottlenecks, predictive procurement, and legal compliance—can be orchestrated through intelligent software architecture and directed user workflows.

This is my first major frontend development project, bridging my background as an Operations Manager (managing 150+ personnel and large-scale fulfillment) with software engineering. 

## ✨ Key Features & Business Logic

*   **📊 Executive Command Center:** Real-time macro telemetry dashboard tracking Inventory Accuracy, OTIF (On-Time In-Full) rates, and Dock-to-Stock velocity.
*   **🤖 Predictive Demand & Triage Hub:** Cross-references supplier lead times against upcoming market shocks (e.g., +150% demand surges) to authorize proactive ERP auto-restocks or emergency air freight.
*   **🛡️ Regulatory Compliance Interlocks:** A hard-locked Document Control Center. If critical hazardous material certifications expire, the system programmatically disables outbound fulfillment generation to prevent legal penalties.
*   **📦 Inbound Shipment (ASN) Execution:** Dynamic filtering and sorting of incoming supplier shipments with localized state execution for dock receivers.
*   **▶️ Directed Pick, Pack & Ship Workflows:** Replaces chaotic manual picking routes with system-directed pipelines, featuring dynamic triaging for B2B fleet priority orders.

## 🛠️ Technical Architecture & Stack

*   **Core Framework:** React.js (Functional Components, Hooks)
*   **Build Tool:** Vite (for fast HMR and optimized builds)
*   **Styling:** Tailwind CSS (for highly responsive, industrial-grade scannable UIs)
*   **State Management:** React Context API & `useMemo` for heavy data filtering.
*   **Data Persistence (The "Sandbox"):** `window.localStorage`

> **Note on Architecture:** Because this is a frontend-focused portfolio project, I bypassed a traditional backend database and engineered a **Local Storage Persistence Engine**. 
> 
> *Why?* This creates a safe, isolated sandbox for every visitor. Recruiters, engineers, and supply chain directors can freely test the app—executing shipments, resolving stock anomalies, and locking compliance docs—without altering the master data for other users. 

## 🚀 Running the Project Locally

To run Zentryx on your local machine, follow these steps:

1. **Clone the repository:**
```bash
   git clone [https://github.com/your-username/zentryx-wms.git](https://github.com/your-username/zentryx-wms.git)
