import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "Business Requirement Document (BRD) — Expense Tracker with Smart Insighter")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)

        # Footer (all pages)
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(54, 36, "CONFIDENTIAL & PROPRIETARY — ACADEMIC / TECHNICAL SPECIFICATION")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 46, 558, 46)
        
        self.restoreState()

def create_brd_pdf(output_path="BUSINESS_REQUIREMENT_DOCUMENT.pdf"):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    primary_color = colors.HexColor("#1e293b")
    accent_blue = colors.HexColor("#2563eb")
    dark_slate = colors.HexColor("#0f172a")
    body_color = colors.HexColor("#334155")
    border_color = colors.HexColor("#cbd5e1")
    light_bg = colors.HexColor("#f8fafc")

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=dark_slate,
        alignment=TA_LEFT,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=accent_blue,
        alignment=TA_LEFT,
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=dark_slate,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=accent_blue,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=body_color,
        alignment=TA_JUSTIFY,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=body_color,
        leftIndent=12,
        spaceAfter=3
    )

    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=primary_color
    )

    meta_val_style = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=body_color
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=body_color
    )

    code_cell_style = ParagraphStyle(
        'CodeCell',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=dark_slate
    )

    story = []

    # Title Banner
    story.append(Paragraph("BUSINESS REQUIREMENT DOCUMENT (BRD)", title_style))
    story.append(Paragraph("AI/ML-Powered Financial Intelligence & Automated Management Platform", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=accent_blue, spaceBefore=0, spaceAfter=10))

    # Meta Info Card Table
    meta_data = [
        [Paragraph("Project Title:", meta_label_style), Paragraph("Expense Tracker with Smart Insighter", meta_val_style),
         Paragraph("Date:", meta_label_style), Paragraph("September 25, 2026", meta_val_style)],
        [Paragraph("Prepared By:", meta_label_style), Paragraph("Shubham Kumar Singh", meta_val_style),
         Paragraph("Project Status:", meta_label_style), Paragraph("Production / Deployed", meta_val_style)],
        [Paragraph("Enrollment Number:", meta_label_style), Paragraph("[Your Enrollment Number]", meta_val_style),
         Paragraph("Institute:", meta_label_style), Paragraph("[Your Institute Name]", meta_val_style)],
    ]
    t_meta = Table(meta_data, colWidths=[105, 170, 85, 144])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('BOX', (0,0), (-1,-1), 0.5, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # 1. Introduction
    story.append(Paragraph("1. Introduction", h1_style))
    story.append(Paragraph(
        "In the contemporary digital financial landscape, personal expense management has transitioned from manual ledgers "
        "to automated digital systems. However, most existing applications act merely as passive data stores that require high manual effort "
        "and lack predictive capabilities. <b>Expense Tracker with Smart Insighter</b> is an enterprise-grade, full-stack financial "
        "intelligence solution designed to transform passive bookkeeping into an active, proactive financial management experience. "
        "It integrates automated machine learning pipelines with high-speed RESTful services and interactive visual analytics.",
        body_style
    ))

    # 2. Project Overview & Tech Stack
    story.append(Paragraph("2. Project Overview & Tech Stack", h1_style))
    story.append(Paragraph(
        "The platform utilizes a decoupled micro-architecture where a high-responsiveness React Single Page Application (SPA) communicates "
        "with an asynchronous FastAPI backend backed by relational persistence and Scikit-Learn data science models.",
        body_style
    ))
    
    tech_data = [
        [Paragraph("Component", table_header_style), Paragraph("Technology", table_header_style), Paragraph("Architecture & Role", table_header_style)],
        [Paragraph("Frontend Client", table_cell_style), Paragraph("React 18, Vite", table_cell_style), Paragraph("Single Page Application (SPA) with modular hooks & reactive state management", table_cell_style)],
        [Paragraph("Styling & UI", table_cell_style), Paragraph("Vanilla CSS, Lucide React", table_cell_style), Paragraph("Dark-mode glassmorphic design system with responsive layouts", table_cell_style)],
        [Paragraph("Backend Server", table_cell_style), Paragraph("FastAPI (Python 3.10+)", table_cell_style), Paragraph("Asynchronous high-throughput REST API with OpenAPI validation", table_cell_style)],
        [Paragraph("Database & ORM", table_cell_style), Paragraph("SQLite / PostgreSQL, SQLAlchemy", table_cell_style), Paragraph("Relational schema persistence, ACID transactions, and indexed querying", table_cell_style)],
        [Paragraph("Machine Learning", table_cell_style), Paragraph("Scikit-Learn, NumPy, Pandas", table_cell_style), Paragraph("TF-IDF NLP categorization, Isolation Forest anomaly scanner, Velocity regression", table_cell_style)],
        [Paragraph("Security & Auth", table_cell_style), Paragraph("JWT, Passlib (Bcrypt)", table_cell_style), Paragraph("Stateless JSON Web Tokens with encrypted claims and hashed credentials", table_cell_style)],
        [Paragraph("Deployment", table_cell_style), Paragraph("Vercel (Client), Cloud Server (API)", table_cell_style), Paragraph("Global CDN edge distribution with SPA routing rewrite rules", table_cell_style)],
    ]
    t_tech = Table(tech_data, colWidths=[90, 140, 274])
    t_tech.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('BOX', (0,0), (-1,-1), 0.5, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, light_bg]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_tech)
    story.append(Spacer(1, 8))

    # 3. Business Problem Statement
    story.append(Paragraph("3. Business Problem Statement", h1_style))
    story.append(Paragraph("Contemporary personal finance applications exhibit significant drawbacks:", body_style))
    story.append(Paragraph("• <b>High Manual Friction:</b> Manual entry and categorization lead to tracking fatigue and inconsistent record-keeping.", bullet_style))
    story.append(Paragraph("• <b>Absence of Predictive Foresight:</b> Retrospective graphs only show past mistakes rather than forecasting impending deficits.", bullet_style))
    story.append(Paragraph("• <b>Undetected Subscription Creep:</b> Subtle price increases in recurring monthly services frequently go unnoticed.", bullet_style))
    story.append(Paragraph("• <b>Lack of Intelligent Outlier Flagging:</b> Fraudulent, duplicate, or abnormal spending spikes are not isolated in real-time.", bullet_style))
    story.append(Paragraph("• <b>No Administrative Telemetry:</b> Lack of centralized oversight to monitor user engagement and platform financial health.", bullet_style))

    # 4. Business Objectives
    story.append(Paragraph("4. Business Objectives", h1_style))
    story.append(Paragraph("• <b>Automate Data Capture:</b> Provide instantaneous manual logging and bulk bank statement CSV ingestion.", bullet_style))
    story.append(Paragraph("• <b>NLP Auto-Classification:</b> Automatically classify transaction notes with confidence scoring using machine learning.", bullet_style))
    story.append(Paragraph("• <b>Predictive Month-End Velocity:</b> Calculate linear spending velocity to project final monthly balances before overspending occurs.", bullet_style))
    story.append(Paragraph("• <b>Intelligent Anomaly Radar:</b> Utilize unsupervised Isolation Forest algorithms to pinpoint statistical outliers.", bullet_style))
    story.append(Paragraph("• <b>Enterprise-Grade Security & Governance:</b> Provide secure role-based access control (RBAC) and administrative oversight.", bullet_style))

    # 5. Functional Requirements
    story.append(Paragraph("5. Functional Requirements", h1_style))
    
    story.append(Paragraph("5.1 User Authentication & Authorization", h2_style))
    story.append(Paragraph("• Secure User Registration and Login with Bcrypt password hashing (minimum 12 salt rounds).", bullet_style))
    story.append(Paragraph("• Stateless JSON Web Token (JWT) issuance with role-based access control (RBAC: User and Admin).", bullet_style))

    story.append(Paragraph("5.2 Transaction & Statement Management", h2_style))
    story.append(Paragraph("• Complete CRUD capabilities for income and expense records with category, payment mode, and timestamp attributes.", bullet_style))
    story.append(Paragraph("• Multi-format Bank Statement CSV parser with automated column normalization and batch processing.", bullet_style))

    story.append(Paragraph("5.3 Machine Learning & Financial Intelligence", h2_style))
    story.append(Paragraph("• <b>NLP Categorizer:</b> TF-IDF vectorization paired with classification models for high-accuracy transaction tagging.", bullet_style))
    story.append(Paragraph("• <b>Continuous Online Learning:</b> Adaptive retraining model incorporating user category corrections.", bullet_style))
    story.append(Paragraph("• <b>Predictive Velocity Engine:</b> Time-series regression estimating month-end burn rate and potential budget overrun.", bullet_style))
    story.append(Paragraph("• <b>Isolation Forest Anomaly Detection:</b> Unsupervised outlier modeling highlighting irregular expenditures.", bullet_style))
    story.append(Paragraph("• <b>Subscription Hike Radar:</b> Recurring billing tracking engine flagging unexpected price increases.", bullet_style))

    story.append(Paragraph("5.4 Budgets, Analytics & Admin Oversight", h2_style))
    story.append(Paragraph("• Dynamic category budget progress bars with visual status indicators (Safe, Warning, Exceeded).", bullet_style))
    story.append(Paragraph("• Interactive 60-Day Spending Heatmap matrix displaying daily expense concentration.", bullet_style))
    story.append(Paragraph("• Administrator Oversight Portal with system-wide volume, active user directories, and category distributions.", bullet_style))

    # 6. Non-Functional Requirements
    story.append(Paragraph("6. Non-Functional Requirements", h1_style))
    nfr_data = [
        [Paragraph("Category", table_header_style), Paragraph("Requirement Specification", table_header_style)],
        [Paragraph("Performance", table_cell_style), Paragraph("API response latency < 150ms for CRUD operations; ML inference latency < 400ms under standard loads.", table_cell_style)],
        [Paragraph("Security", table_cell_style), Paragraph("HTTPS transport encryption, Bcrypt credential hashing, JWT expiration, and SQL injection protection via ORM parameterization.", table_cell_style)],
        [Paragraph("Scalability", table_cell_style), Paragraph("Horizontally scalable stateless backend architecture capable of handling multi-tenant concurrent requests.", table_cell_style)],
        [Paragraph("Reliability", table_cell_style), Paragraph("99.9% uptime target with comprehensive client-side error boundaries and asynchronous exception logging.", table_cell_style)],
        [Paragraph("Usability", table_cell_style), Paragraph("Responsive dark-mode interface optimized for desktop, tablet, and mobile displays with intuitive micro-interactions.", table_cell_style)],
    ]
    t_nfr = Table(nfr_data, colWidths=[110, 394])
    t_nfr.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('BOX', (0,0), (-1,-1), 0.5, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, light_bg]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_nfr)
    story.append(Spacer(1, 8))

    # 7. User Roles & Responsibilities
    story.append(Paragraph("7. User Roles & Responsibilities", h1_style))
    roles_data = [
        [Paragraph("Role", table_header_style), Paragraph("Access Scope", table_header_style), Paragraph("Core Responsibilities & Capabilities", table_header_style)],
        [Paragraph("Standard User", table_cell_style), Paragraph("Personal Account", table_cell_style), Paragraph("Manage transactions, import statements, configure budgets, view predictive forecasts, analyze anomalies, and monitor financial health score.", table_cell_style)],
        [Paragraph("Administrator", table_cell_style), Paragraph("Platform System", table_cell_style), Paragraph("Access Administrator Portal, monitor platform gross volume, inspect active user accounts, toggle user active status, and evaluate category-wide spending distributions.", table_cell_style)],
    ]
    t_roles = Table(roles_data, colWidths=[80, 95, 329])
    t_roles.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('BOX', (0,0), (-1,-1), 0.5, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, light_bg]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_roles)
    story.append(Spacer(1, 8))

    # 8. Project Workflow
    story.append(Paragraph("8. Project Workflow", h1_style))
    story.append(Paragraph(
        "1. <b>Authentication:</b> Client submits credentials &rarr; FastAPI verifies hash &rarr; Issues signed JWT token for session state.<br/>"
        "2. <b>Transaction Intake:</b> Transaction entered manually or via CSV upload &rarr; NLP Categorizer matches text to target category.<br/>"
        "3. <b>Intelligence Analysis:</b> Backend runs Isolation Forest anomaly model and time-series velocity projection.<br/>"
        "4. <b>Visualization:</b> React client renders interactive charts, progress bars, and heatmap density matrices.<br/>"
        "5. <b>Admin Oversight:</b> Admin logs in &rarr; System authenticates admin scope &rarr; Telemetry portal displays platform aggregate health.",
        body_style
    ))

    # 9. Future Enhancements
    story.append(Paragraph("9. Future Enhancements", h1_style))
    story.append(Paragraph("• <b>Open Banking & UPI Ingestion:</b> Direct integration with automated banking APIs and UPI aggregator protocols.", bullet_style))
    story.append(Paragraph("• <b>LLM Financial Copilot:</b> Conversational AI interface for contextual natural language financial queries.", bullet_style))
    story.append(Paragraph("• <b>Multi-Currency & FX Engine:</b> Automated real-time conversion rates across international currencies.", bullet_style))
    story.append(Paragraph("• <b>Mobile Native Apps:</b> Cross-platform mobile clients for iOS and Android powered by React Native.", bullet_style))

    # 10. Conclusion
    story.append(Paragraph("10. Conclusion", h1_style))
    story.append(Paragraph(
        "<b>Expense Tracker with Smart Insighter</b> represents a comprehensive, intelligent paradigm in modern financial software engineering. "
        "By fusing responsive user-centric design with robust asynchronous backend architectures and actionable machine learning intelligence, "
        "the application fulfills all functional, analytical, and security criteria outlined in this Business Requirement Document.",
        body_style
    ))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {output_path}")

if __name__ == "__main__":
    out = "BUSINESS_REQUIREMENT_DOCUMENT.pdf"
    if len(sys.argv) > 1:
        out = sys.argv[1]
    create_brd_pdf(out)
