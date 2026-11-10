"""100+ Professional ATS-Compliant CV Templates Catalog and Theme Configurations."""

from typing import Dict, Any, List, Optional

# Color Palettes (Curated for Top-Tier Professional Resumes)
PALETTES = {
    "slate_navy": {"primary": "#0F172A", "secondary": "#2563EB", "accent": "#38BDF8", "text": "#1E293B", "bg": "#F8FAFC", "rule": "#CBD5E1"},
    "dubai_sapphire": {"primary": "#1E1B4B", "secondary": "#4338CA", "accent": "#06B6D4", "text": "#0F172A", "bg": "#F0FDF4", "rule": "#C7D2FE"},
    "saudi_emerald": {"primary": "#064E3B", "secondary": "#059669", "accent": "#10B981", "text": "#064E3B", "bg": "#F0FDF4", "rule": "#A7F3D0"},
    "riyadh_gold": {"primary": "#1C1917", "secondary": "#B45309", "accent": "#D97706", "text": "#292524", "bg": "#FFFBEB", "rule": "#FDE68A"},
    "pure_black": {"primary": "#000000", "secondary": "#1E293B", "accent": "#475569", "text": "#000000", "bg": "#FFFFFF", "rule": "#000000"},
    "minimal_graphite": {"primary": "#18181B", "secondary": "#3F3F46", "accent": "#71717A", "text": "#27272A", "bg": "#FAFAFA", "rule": "#E4E4E7"},
    "executive_burgundy": {"primary": "#4A0404", "secondary": "#831843", "accent": "#9F1239", "text": "#1E293B", "bg": "#FFF1F2", "rule": "#FECDD3"},
    "royal_cobalt": {"primary": "#172554", "secondary": "#1D4ED8", "accent": "#3B82F6", "text": "#1E293B", "bg": "#EFF6FF", "rule": "#BFDBFE"},
    "gulf_teal": {"primary": "#134E4A", "secondary": "#0F766E", "accent": "#14B8A6", "text": "#134E4A", "bg": "#F0FDFA", "rule": "#99F6E4"},
    "charcoal_crimson": {"primary": "#111827", "secondary": "#991B1B", "accent": "#DC2626", "text": "#1F2937", "bg": "#FEF2F2", "rule": "#FECACA"},
    "nordic_frost": {"primary": "#0B192C", "secondary": "#1E3E62", "accent": "#000000", "text": "#1E293B", "bg": "#F5F5F7", "rule": "#CBD5E1"},
    "silicon_cyan": {"primary": "#022C43", "secondary": "#053F5C", "accent": "#00ADB5", "text": "#1E293B", "bg": "#F9FAFB", "rule": "#E5E7EB"},
}

CATEGORIES = [
    "Gulf & Middle East",
    "Tech & Software",
    "Executive & Leadership",
    "Data & AI",
    "Finance & Banking",
    "Minimalist ATS",
    "Creative & Remote"
]

# Base list of 105 curated professional templates
TEMPLATES_CATALOG: List[Dict[str, Any]] = [
    # --- Category 1: Gulf & Middle East (Templates 1 - 15) ---
    {
        "id": "gulf_dubai_sapphire",
        "name": "Dubai Silicon Oasis Pro",
        "category": "Gulf & Middle East",
        "layout": "split_header",
        "palette": "dubai_sapphire",
        "badge": "Top Choice for UAE 🇦🇪",
        "ats_score": "99% ATS Pass",
        "description": "Tailored for UAE tech hubs with verified GCC residency clearance and structured leadership highlights.",
        "font_family": "Helvetica"
    },
    {
        "id": "saudi_vision_emerald",
        "name": "Riyadh Vision 2030 Emerald",
        "category": "Gulf & Middle East",
        "layout": "modern_accent",
        "palette": "saudi_emerald",
        "badge": "Saudi Arabia 🇸🇦 Standard",
        "ats_score": "99% ATS Pass",
        "description": "Prestigious emerald accent optimized for Riyadh RHQ multinationals, NEOM, and enterprise contracts.",
        "font_family": "Helvetica"
    },
    {
        "id": "abu_dhabi_executive",
        "name": "Abu Dhabi Sovereign Executive",
        "category": "Gulf & Middle East",
        "layout": "single_column",
        "palette": "slate_navy",
        "badge": "Enterprise UAE",
        "ats_score": "100% ATS Pass",
        "description": "Formal, high-gravity corporate styling for government, sovereign wealth funds, and enterprise tech.",
        "font_family": "Times-Roman"
    },
    {
        "id": "riyadh_fintech_gold",
        "name": "KSA FinTech & Banking Elite",
        "category": "Gulf & Middle East",
        "layout": "split_header",
        "palette": "riyadh_gold",
        "badge": "SAMA Compliant",
        "ats_score": "98% ATS Pass",
        "description": "Golden amber accents designed for Saudi financial institutions, digital payments, and banking.",
        "font_family": "Helvetica"
    },
    {
        "id": "neom_future_builder",
        "name": "NEOM Giga-Project Architect",
        "category": "Gulf & Middle East",
        "layout": "modern_accent",
        "palette": "gulf_teal",
        "badge": "NEOM Ready",
        "ats_score": "99% ATS Pass",
        "description": "Forward-looking technical layout highlighting large-scale infrastructure, sustainability, and cloud.",
        "font_family": "Helvetica"
    },
    {
        "id": "qatar_pearl_corporate",
        "name": "Doha West Bay Professional",
        "category": "Gulf & Middle East",
        "layout": "single_column",
        "palette": "executive_burgundy",
        "badge": "Qatar 🇶🇦 Standard",
        "ats_score": "100% ATS Pass",
        "description": "Executive maroon trim crafted for Doha energy, banking, and government technology organizations.",
        "font_family": "Times-Roman"
    },
    {
        "id": "dubai_internet_city",
        "name": "Dubai Internet City Modern",
        "category": "Gulf & Middle East",
        "layout": "split_header",
        "palette": "royal_cobalt",
        "badge": "DIC & DTEC Tech",
        "ats_score": "99% ATS Pass",
        "description": "Modern high-contrast layout tailored for scale-ups and multinationals in Dubai Internet City.",
        "font_family": "Helvetica"
    },
    {
        "id": "gulf_healthcare_bio",
        "name": "Gulf BioTech & Health Specialist",
        "category": "Gulf & Middle East",
        "layout": "single_column",
        "palette": "gulf_teal",
        "badge": "MOHAP / DHA Ready",
        "ats_score": "100% ATS Pass",
        "description": "Structured credentialing and compliance format for healthcare, pharma, and health-tech in GCC.",
        "font_family": "Helvetica"
    },
    {
        "id": "saudi_cloud_infra",
        "name": "Riyadh Hyperscale Cloud Lead",
        "category": "Gulf & Middle East",
        "layout": "compact_dense",
        "palette": "saudi_emerald",
        "badge": "Cloud Sovereign",
        "ats_score": "99% ATS Pass",
        "description": "High-density technical grid focusing on AWS/GCP/Oracle cloud regions in Saudi Arabia.",
        "font_family": "Helvetica"
    },
    {
        "id": "difc_private_equity",
        "name": "DIFC Global Wealth Advisor",
        "category": "Gulf & Middle East",
        "layout": "single_column",
        "palette": "slate_navy",
        "badge": "DIFC & ADGM Elite",
        "ats_score": "100% ATS Pass",
        "description": "Understated luxury typography for private equity, investment banking, and fintech compliance.",
        "font_family": "Times-Roman"
    },
    {
        "id": "sharjah_innovation",
        "name": "Sharjah Research & Tech Park",
        "category": "Gulf & Middle East",
        "layout": "modern_accent",
        "palette": "silicon_cyan",
        "badge": "R&D Focused",
        "ats_score": "98% ATS Pass",
        "description": "Innovation-forward design for technical consultants and researchers in UAE academic hubs.",
        "font_family": "Helvetica"
    },
    {
        "id": "red_sea_hospitality",
        "name": "Red Sea Global Enterprise Lead",
        "category": "Gulf & Middle East",
        "layout": "split_header",
        "palette": "gulf_teal",
        "badge": "Tourism & Mega-Hub",
        "ats_score": "99% ATS Pass",
        "description": "Optimized for leadership roles in Saudi Arabia's premier luxury and tourism developments.",
        "font_family": "Helvetica"
    },
    {
        "id": "gulf_telecom_core",
        "name": "GCC Telecom & 5G Specialist",
        "category": "Gulf & Middle East",
        "layout": "compact_dense",
        "palette": "royal_cobalt",
        "badge": "e& / stc Standard",
        "ats_score": "99% ATS Pass",
        "description": "Detailed networking, infrastructure, and telecommunications architecture layout.",
        "font_family": "Helvetica"
    },
    {
        "id": "dubai_ai_campus",
        "name": "Dubai AI Campus Innovator",
        "category": "Gulf & Middle East",
        "layout": "split_header",
        "palette": "dubai_sapphire",
        "badge": "AI Center of Excellence",
        "ats_score": "99% ATS Pass",
        "description": "High-tech look emphasizing LLM deployments, autonomous agents, and machine learning models.",
        "font_family": "Helvetica"
    },
    {
        "id": "saudi_digital_academy",
        "name": "Saudi Digital Transformation",
        "category": "Gulf & Middle East",
        "layout": "modern_accent",
        "palette": "saudi_emerald",
        "badge": "National Program",
        "ats_score": "100% ATS Pass",
        "description": "Balanced corporate layout built for consultants driving Vision 2030 digital modernization.",
        "font_family": "Helvetica"
    },

    # --- Category 2: Tech & Software (Templates 16 - 35) ---
    {
        "id": "silicon_tech_indigo",
        "name": "Silicon Valley Full-Stack",
        "category": "Tech & Software",
        "layout": "single_column",
        "palette": "slate_navy",
        "badge": "US FAANG Favorite",
        "ats_score": "100% ATS Pass",
        "description": "Crisp typography engineered to pass Google, Meta, and Amazon automated applicant screening.",
        "font_family": "Helvetica"
    },
    {
        "id": "backend_architect_dark",
        "name": "High-Throughput Backend Lead",
        "category": "Tech & Software",
        "layout": "compact_dense",
        "palette": "silicon_cyan",
        "badge": "Microservices Heavy",
        "ats_score": "99% ATS Pass",
        "description": "Highlights distributed systems, concurrency, database throughput, and API response metrics.",
        "font_family": "Helvetica"
    },
    {
        "id": "cloud_devops_kubernetes",
        "name": "Site Reliability & Cloud Platform",
        "category": "Tech & Software",
        "layout": "compact_dense",
        "palette": "nordic_frost",
        "badge": "K8s & Terraform Focus",
        "ats_score": "100% ATS Pass",
        "description": "Dedicated infrastructure matrix for Docker, Kubernetes, Terraform, AWS, and CI/CD engineers.",
        "font_family": "Helvetica"
    },
    {
        "id": "frontend_ui_clean",
        "name": "Modern Frontend & Design Systems",
        "category": "Tech & Software",
        "layout": "split_header",
        "palette": "dubai_sapphire",
        "badge": "React & Next.js",
        "ats_score": "98% ATS Pass",
        "description": "Sleek layout with distinct sections for web performance, accessibility, and UI frameworks.",
        "font_family": "Helvetica"
    },
    {
        "id": "python_fastapi_expert",
        "name": "Python & Async API Specialist",
        "category": "Tech & Software",
        "layout": "single_column",
        "palette": "slate_navy",
        "badge": "FastAPI & Django",
        "ats_score": "100% ATS Pass",
        "description": "Focused on backend microservices, async celery workers, and PostgreSQL optimizations.",
        "font_family": "Helvetica"
    },
    {
        "id": "mobile_ios_android",
        "name": "Cross-Platform Mobile Engineer",
        "category": "Tech & Software",
        "layout": "modern_accent",
        "palette": "royal_cobalt",
        "badge": "iOS & Flutter",
        "ats_score": "99% ATS Pass",
        "description": "Structured to highlight App Store releases, active MAU scales, and offline-first architectures.",
        "font_family": "Helvetica"
    },
    {
        "id": "cybersecurity_soc",
        "name": "Cybersecurity & InfoSec Defense",
        "category": "Tech & Software",
        "layout": "single_column",
        "palette": "charcoal_crimson",
        "badge": "SOC2 & ISO 27001",
        "ats_score": "100% ATS Pass",
        "description": "Emphasizes penetration testing, zero-trust security, compliance audits, and SIEM tooling.",
        "font_family": "Helvetica"
    },
    {
        "id": "enterprise_java_spring",
        "name": "Enterprise Java & Spring Core",
        "category": "Tech & Software",
        "layout": "single_column",
        "palette": "pure_black",
        "badge": "Enterprise Scale",
        "ats_score": "100% ATS Pass",
        "description": "Classical robust formatting favored by multinational enterprise software organizations.",
        "font_family": "Helvetica"
    },
    {
        "id": "golang_cloud_native",
        "name": "Golang & Distributed Systems",
        "category": "Tech & Software",
        "layout": "compact_dense",
        "palette": "gulf_teal",
        "badge": "High Concurrency",
        "ats_score": "99% ATS Pass",
        "description": "Optimized for low-latency network services, gRPC protocols, and memory-efficient software.",
        "font_family": "Helvetica"
    },
    {
        "id": "blockchain_web3_core",
        "name": "Web3 & Smart Contract Engineer",
        "category": "Tech & Software",
        "layout": "split_header",
        "palette": "dubai_sapphire",
        "badge": "Solidity & EVM",
        "ats_score": "98% ATS Pass",
        "description": "Built for Dubai Crypto Valley and international decentralized protocol organizations.",
        "font_family": "Helvetica"
    },
    {
        "id": "qa_automation_lead",
        "name": "QA Automation & Test Architect",
        "category": "Tech & Software",
        "layout": "single_column",
        "palette": "minimal_graphite",
        "badge": "Cypress & Playwright",
        "ats_score": "100% ATS Pass",
        "description": "Highlights test coverage percentages, load testing suites, and deployment reliability metrics.",
        "font_family": "Helvetica"
    },
    {
        "id": "embedded_iot_firmware",
        "name": "Embedded Systems & IoT Hardware",
        "category": "Tech & Software",
        "layout": "compact_dense",
        "palette": "slate_navy",
        "badge": "C/C++ & RTOS",
        "ats_score": "99% ATS Pass",
        "description": "Specialized for hardware, sensor networks, firmware development, and edge devices.",
        "font_family": "Helvetica"
    },
    {
        "id": "solutions_architect_aws",
        "name": "Principal Solutions Architect",
        "category": "Tech & Software",
        "layout": "modern_accent",
        "palette": "riyadh_gold",
        "badge": "AWS Certified",
        "ats_score": "99% ATS Pass",
        "description": "Designed for pre-sales technical leadership, high-level system diagrams, and cloud advisory.",
        "font_family": "Helvetica"
    },
    {
        "id": "graphql_api_gateway",
        "name": "API Gateway & Platform Engineer",
        "category": "Tech & Software",
        "layout": "split_header",
        "palette": "silicon_cyan",
        "badge": "Federated GraphQL",
        "ats_score": "98% ATS Pass",
        "description": "Focuses on developer experience, schema federations, and platform internal tooling.",
        "font_family": "Helvetica"
    },
    {
        "id": "linux_kernel_systems",
        "name": "Low-Level Systems Programmer",
        "category": "Tech & Software",
        "layout": "single_column",
        "palette": "pure_black",
        "badge": "Rust & C++",
        "ats_score": "100% ATS Pass",
        "description": "Stripped of all visual fluff, prioritizing deep performance, assembly, and kernel patches.",
        "font_family": "Helvetica"
    },
    {
        "id": "tech_lead_manager",
        "name": "Engineering Manager & Tech Lead",
        "category": "Tech & Software",
        "layout": "split_header",
        "palette": "royal_cobalt",
        "badge": "Hiring & Strategy",
        "ats_score": "99% ATS Pass",
        "description": "Balanced split between hands-on architectural contributions and team growth metrics.",
        "font_family": "Helvetica"
    },
    {
        "id": "ruby_rails_scale",
        "name": "Rapid Prototype & SaaS Engineer",
        "category": "Tech & Software",
        "layout": "modern_accent",
        "palette": "charcoal_crimson",
        "badge": "SaaS Accelerator",
        "ats_score": "98% ATS Pass",
        "description": "Emphasizes fast time-to-market, bootstrapped revenue growth, and scalable monoliths.",
        "font_family": "Helvetica"
    },
    {
        "id": "database_dba_admin",
        "name": "Database Administrator & Data Architect",
        "category": "Tech & Software",
        "layout": "compact_dense",
        "palette": "nordic_frost",
        "badge": "Postgres & MySQL",
        "ats_score": "100% ATS Pass",
        "description": "Showcases query plan tuning, replication topologies, sharding, and backup recovery.",
        "font_family": "Helvetica"
    },
    {
        "id": "observability_monitoring",
        "name": "Observability & Telemetry Specialist",
        "category": "Tech & Software",
        "layout": "single_column",
        "palette": "gulf_teal",
        "badge": "Datadog & Grafana",
        "ats_score": "99% ATS Pass",
        "description": "Structured for tracing, distributed log aggregation, alerting thresholds, and SLO tracking.",
        "font_family": "Helvetica"
    },
    {
        "id": "game_dev_unreal",
        "name": "Interactive 3D & Game Engine Dev",
        "category": "Tech & Software",
        "layout": "split_header",
        "palette": "silicon_cyan",
        "badge": "Unreal & C++",
        "ats_score": "98% ATS Pass",
        "description": "Dedicated to shaders, real-time graphics pipelines, physics engines, and gaming studios.",
        "font_family": "Helvetica"
    },

    # --- Category 3: Executive & Leadership (Templates 36 - 50) ---
    {
        "id": "cto_boardroom_classic",
        "name": "Chief Technology Officer (CTO)",
        "category": "Executive & Leadership",
        "layout": "single_column",
        "palette": "slate_navy",
        "badge": "Boardroom Ready",
        "ats_score": "100% ATS Pass",
        "description": "Authoritative executive typography with prominent strategic vision and capital management.",
        "font_family": "Times-Roman"
    },
    {
        "id": "vp_engineering_hybrid",
        "name": "VP of Engineering & Scale",
        "category": "Executive & Leadership",
        "layout": "split_header",
        "palette": "royal_cobalt",
        "badge": "Organization Builder",
        "ats_score": "99% ATS Pass",
        "description": "Highlights headcount scaling (10 to 100+), multi-million dollar budgets, and roadmap velocity.",
        "font_family": "Helvetica"
    },
    {
        "id": "cpo_product_visionary",
        "name": "Chief Product Officer (CPO)",
        "category": "Executive & Leadership",
        "layout": "modern_accent",
        "palette": "dubai_sapphire",
        "badge": "Product-Led Growth",
        "ats_score": "99% ATS Pass",
        "description": "Puts product market fit, ARR expansion, customer retention, and UX strategy front and center.",
        "font_family": "Helvetica"
    },
    {
        "id": "director_cloud_ops",
        "name": "Director of Cloud Infrastructure",
        "category": "Executive & Leadership",
        "layout": "compact_dense",
        "palette": "nordic_frost",
        "badge": "Multi-Cloud Strategy",
        "ats_score": "100% ATS Pass",
        "description": "Focuses on cloud unit economics, FinOps cost savings, multi-region compliance, and SLAs.",
        "font_family": "Helvetica"
    },
    {
        "id": "managing_director_gulf",
        "name": "Regional Managing Director GCC",
        "category": "Executive & Leadership",
        "layout": "single_column",
        "palette": "saudi_emerald",
        "badge": "P&L Ownership",
        "ats_score": "100% ATS Pass",
        "description": "Formal layout for leaders managing Gulf business entities, joint ventures, and P&L statements.",
        "font_family": "Times-Roman"
    },
    {
        "id": "head_of_ai_strategy",
        "name": "Head of Enterprise AI & Data",
        "category": "Executive & Leadership",
        "layout": "split_header",
        "palette": "gulf_teal",
        "badge": "AI Transformation",
        "ats_score": "98% ATS Pass",
        "description": "Positioning leaders who drive organizational adoption of generative AI and enterprise automation.",
        "font_family": "Helvetica"
    },
    {
        "id": "coo_operational_excellence",
        "name": "Chief Operating Officer (COO)",
        "category": "Executive & Leadership",
        "layout": "single_column",
        "palette": "slate_navy",
        "badge": "Process & Scale",
        "ats_score": "100% ATS Pass",
        "description": "Structured around operational efficiency, supply chain, OKR execution, and margin growth.",
        "font_family": "Times-Roman"
    },
    {
        "id": "ciso_cyber_executive",
        "name": "Chief Information Security Officer",
        "category": "Executive & Leadership",
        "layout": "modern_accent",
        "palette": "charcoal_crimson",
        "badge": "Governance & Risk",
        "ats_score": "99% ATS Pass",
        "description": "Tailored for board-level risk management, incident response command, and regulatory oversight.",
        "font_family": "Helvetica"
    },
    {
        "id": "general_manager_tech",
        "name": "General Manager - Digital Ventures",
        "category": "Executive & Leadership",
        "layout": "split_header",
        "palette": "riyadh_gold",
        "badge": "Corporate Venture",
        "ats_score": "99% ATS Pass",
        "description": "Blends corporate governance with startup agility for corporate venture studios in the Gulf.",
        "font_family": "Helvetica"
    },
    {
        "id": "partner_tech_consulting",
        "name": "Partner - Technology Advisory",
        "category": "Executive & Leadership",
        "layout": "single_column",
        "palette": "pure_black",
        "badge": "Big 4 & MBB Standard",
        "ats_score": "100% ATS Pass",
        "description": "Classic consulting typography trusted by McKinsey, BCG, Bain, and Strategy& partners.",
        "font_family": "Times-Roman"
    },
    {
        "id": "director_data_analytics",
        "name": "Director of Business Intelligence",
        "category": "Executive & Leadership",
        "layout": "compact_dense",
        "palette": "silicon_cyan",
        "badge": "Executive Insights",
        "ats_score": "99% ATS Pass",
        "description": "Highlights data monetization, cross-functional dashboard adoption, and analytics teams.",
        "font_family": "Helvetica"
    },
    {
        "id": "head_of_talent_people",
        "name": "VP of People & Organization",
        "category": "Executive & Leadership",
        "layout": "modern_accent",
        "palette": "executive_burgundy",
        "badge": "Global Culture",
        "ats_score": "98% ATS Pass",
        "description": "Centers on talent retention, international recruitment, and compensation structures.",
        "font_family": "Helvetica"
    },
    {
        "id": "board_advisor_governance",
        "name": "Independent Board Advisor",
        "category": "Executive & Leadership",
        "layout": "single_column",
        "palette": "slate_navy",
        "badge": "Audit & ESG",
        "ats_score": "100% ATS Pass",
        "description": "Ultra-clean single page focusing on committee appointments, capital raises, and fiduciary guidance.",
        "font_family": "Times-Roman"
    },
    {
        "id": "director_devops_platform",
        "name": "Director of Platform Engineering",
        "category": "Executive & Leadership",
        "layout": "split_header",
        "palette": "nordic_frost",
        "badge": "Internal Developer Platform",
        "ats_score": "99% ATS Pass",
        "description": "Balances engineering leadership with developer productivity and cost optimization.",
        "font_family": "Helvetica"
    },
    {
        "id": "program_director_pmo",
        "name": "Enterprise PMO Program Director",
        "category": "Executive & Leadership",
        "layout": "compact_dense",
        "palette": "royal_cobalt",
        "badge": "PgMP / PMP Certified",
        "ats_score": "100% ATS Pass",
        "description": "Engineered for managing multi-million dollar transformation programs and vendor portfolios.",
        "font_family": "Helvetica"
    },

    # --- Category 4: Data & AI (Templates 51 - 65) ---
    {
        "id": "ai_ml_engineer_deep",
        "name": "Applied AI & LLM Systems Engineer",
        "category": "Data & AI",
        "layout": "modern_accent",
        "palette": "silicon_cyan",
        "badge": "LangChain & RAG",
        "ats_score": "99% ATS Pass",
        "description": "Tailored for generative AI, vector databases, model fine-tuning, and production evaluation.",
        "font_family": "Helvetica"
    },
    {
        "id": "data_scientist_quantitative",
        "name": "Senior Quantitative Data Scientist",
        "category": "Data & AI",
        "layout": "single_column",
        "palette": "slate_navy",
        "badge": "A/B Testing & Causal",
        "ats_score": "100% ATS Pass",
        "description": "Highlights statistical inference, experiment design, algorithmic lift, and business impact.",
        "font_family": "Helvetica"
    },
    {
        "id": "data_engineer_pipeline",
        "name": "Big Data & Streaming Architect",
        "category": "Data & AI",
        "layout": "compact_dense",
        "palette": "nordic_frost",
        "badge": "Spark & Snowflake",
        "ats_score": "99% ATS Pass",
        "description": "Showcases terabyte-scale ETL pipelines, Airflow DAGs, Kafka topics, and Lakehouse modeling.",
        "font_family": "Helvetica"
    },
    {
        "id": "mlops_platform_deploy",
        "name": "MLOps & Model Lifecycle Engineer",
        "category": "Data & AI",
        "layout": "compact_dense",
        "palette": "gulf_teal",
        "badge": "Kubeflow & MLflow",
        "ats_score": "99% ATS Pass",
        "description": "Focuses on automated retraining pipelines, model drift monitoring, and low-latency inference.",
        "font_family": "Helvetica"
    },
    {
        "id": "computer_vision_edge",
        "name": "Computer Vision & Edge Inference",
        "category": "Data & AI",
        "layout": "split_header",
        "palette": "royal_cobalt",
        "badge": "OpenCV & PyTorch",
        "ats_score": "98% ATS Pass",
        "description": "Built for real-time video streaming, object detection, and TensorRT hardware optimization.",
        "font_family": "Helvetica"
    },
    {
        "id": "nlp_conversational_ai",
        "name": "NLP & Conversational Agent Specialist",
        "category": "Data & AI",
        "layout": "modern_accent",
        "palette": "dubai_sapphire",
        "badge": "Transformers & BERT",
        "ats_score": "99% ATS Pass",
        "description": "Highlights multilingual Arabic/English tokenization, sentiment models, and chatbot agents.",
        "font_family": "Helvetica"
    },
    {
        "id": "bi_analytics_powerbi",
        "name": "Power BI & Tableau Lead Analyst",
        "category": "Data & AI",
        "layout": "single_column",
        "palette": "riyadh_gold",
        "badge": "DAX & SQL Mastery",
        "ats_score": "100% ATS Pass",
        "description": "Structured for automated executive dashboards, complex DAX measures, and data warehousing.",
        "font_family": "Helvetica"
    },
    {
        "id": "deep_learning_researcher",
        "name": "Deep Learning Research Scientist",
        "category": "Data & AI",
        "layout": "single_column",
        "palette": "pure_black",
        "badge": "NeurIPS / ICML Ready",
        "ats_score": "100% ATS Pass",
        "description": "Prioritizes research publications, open-source citations, and novel model architectures.",
        "font_family": "Times-Roman"
    },
    {
        "id": "data_product_manager",
        "name": "Data & AI Product Manager",
        "category": "Data & AI",
        "layout": "split_header",
        "palette": "slate_navy",
        "badge": "Algorithmic ROI",
        "ats_score": "99% ATS Pass",
        "description": "Bridges machine learning feasibility with commercial revenue models and compliance.",
        "font_family": "Helvetica"
    },
    {
        "id": "reinforcement_learning_robot",
        "name": "Robotics & RL Systems Engineer",
        "category": "Data & AI",
        "layout": "compact_dense",
        "palette": "silicon_cyan",
        "badge": "ROS2 & Simulation",
        "ats_score": "98% ATS Pass",
        "description": "Highlighting autonomous navigation, sensor fusion, and digital twin simulation.",
        "font_family": "Helvetica"
    },
    {
        "id": "data_governance_steward",
        "name": "Chief Data Governance Officer",
        "category": "Data & AI",
        "layout": "single_column",
        "palette": "saudi_emerald",
        "badge": "GDPR & PDPL Ready",
        "ats_score": "100% ATS Pass",
        "description": "Focuses on Saudi PDPL data sovereignty, cataloging, lineage, and privacy frameworks.",
        "font_family": "Times-Roman"
    },
    {
        "id": "financial_quant_trader",
        "name": "Algorithmic Trading & Quant Analyst",
        "category": "Data & AI",
        "layout": "compact_dense",
        "palette": "minimal_graphite",
        "badge": "High Frequency Alpha",
        "ats_score": "100% ATS Pass",
        "description": "High-density metrics format showing Sharpe ratios, alpha generation, and backtesting systems.",
        "font_family": "Helvetica"
    },
    {
        "id": "graph_database_network",
        "name": "Knowledge Graph & Neo4j Specialist",
        "category": "Data & AI",
        "layout": "modern_accent",
        "palette": "dubai_sapphire",
        "badge": "Ontologies & Cypher",
        "ats_score": "99% ATS Pass",
        "description": "Showcases fraud detection rings, semantic reasoning networks, and entity resolution.",
        "font_family": "Helvetica"
    },
    {
        "id": "prompt_engineer_workflow",
        "name": "Enterprise Prompt Architect",
        "category": "Data & AI",
        "layout": "split_header",
        "palette": "gulf_teal",
        "badge": "Context Engineering",
        "ats_score": "98% ATS Pass",
        "description": "Demonstrates LLM guardrails, few-shot prompt libraries, and agentic tool chaining.",
        "font_family": "Helvetica"
    },
    {
        "id": "health_data_epidemiology",
        "name": "Clinical Informatics & Health AI",
        "category": "Data & AI",
        "layout": "single_column",
        "palette": "nordic_frost",
        "badge": "FHIR & Biostatistics",
        "ats_score": "100% ATS Pass",
        "description": "Crafted for electronic medical record interoperability, diagnostic modeling, and clinical trials.",
        "font_family": "Helvetica"
    },

    # --- Category 5: Finance & Banking (Templates 66 - 80) ---
    {
        "id": "investment_banker_mna",
        "name": "Mergers & Acquisitions Associate",
        "category": "Finance & Banking",
        "layout": "single_column",
        "palette": "pure_black",
        "badge": "Wall Street / DIFC",
        "ats_score": "100% ATS Pass",
        "description": "Rigorous traditional banking standard with deal sizes, transaction multiples, and valuation.",
        "font_family": "Times-Roman"
    },
    {
        "id": "chartered_accountant_acca",
        "name": "Senior Chartered Accountant (ACCA/CPA)",
        "category": "Finance & Banking",
        "layout": "single_column",
        "palette": "slate_navy",
        "badge": "IFRS & GCC VAT",
        "ats_score": "100% ATS Pass",
        "description": "Tailored for UAE corporate tax, Saudi Zakat & tax compliance, and statutory auditing.",
        "font_family": "Times-Roman"
    },
    {
        "id": "financial_controller_group",
        "name": "Group Financial Controller",
        "category": "Finance & Banking",
        "layout": "compact_dense",
        "palette": "riyadh_gold",
        "badge": "Consolidation & ERP",
        "ats_score": "100% ATS Pass",
        "description": "Highlights multi-entity ERP migrations (SAP/Oracle), cashflow forecasting, and working capital.",
        "font_family": "Helvetica"
    },
    {
        "id": "islamic_finance_sharia",
        "name": "Islamic Banking & Sukuk Specialist",
        "category": "Finance & Banking",
        "layout": "single_column",
        "palette": "saudi_emerald",
        "badge": "AAOIFI Compliant",
        "ats_score": "100% ATS Pass",
        "description": "Optimized for Sharia-compliant capital markets, Murabaha, Sukuk bonds, and Islamic banking.",
        "font_family": "Times-Roman"
    },
    {
        "id": "internal_audit_risk",
        "name": "Head of Internal Audit & Forensics",
        "category": "Finance & Banking",
        "layout": "single_column",
        "palette": "minimal_graphite",
        "badge": "CIA / CISA Certified",
        "ats_score": "100% ATS Pass",
        "description": "Emphasizes fraud prevention, SOX compliance, enterprise risk registers, and governance.",
        "font_family": "Helvetica"
    },
    {
        "id": "fintech_payments_lead",
        "name": "Payment Gateway & Neobank Lead",
        "category": "Finance & Banking",
        "layout": "split_header",
        "palette": "royal_cobalt",
        "badge": "Visa / Mastercard / Mada",
        "ats_score": "99% ATS Pass",
        "description": "Focuses on interchange revenue, transaction rails, PCI-DSS compliance, and API integrations.",
        "font_family": "Helvetica"
    },
    {
        "id": "fpa_manager_commercial",
        "name": "Commercial FP&A Manager",
        "category": "Finance & Banking",
        "layout": "modern_accent",
        "palette": "slate_navy",
        "badge": "Budgeting & Strategy",
        "ats_score": "99% ATS Pass",
        "description": "Highlights variance analysis, 5-year strategic models, cost allocation, and EBITDA expansions.",
        "font_family": "Helvetica"
    },
    {
        "id": "treasury_cash_manager",
        "name": "Corporate Treasury & FX Specialist",
        "category": "Finance & Banking",
        "layout": "compact_dense",
        "palette": "gulf_teal",
        "badge": "Liquidity & Hedging",
        "ats_score": "100% ATS Pass",
        "description": "Detailed currency hedging, credit facility negotiations, and centralized cash pools.",
        "font_family": "Helvetica"
    },
    {
        "id": "credit_risk_underwriter",
        "name": "Commercial Credit Risk Underwriter",
        "category": "Finance & Banking",
        "layout": "single_column",
        "palette": "pure_black",
        "badge": "Basel III Standards",
        "ats_score": "100% ATS Pass",
        "description": "Displays loan portfolio default rates, credit scoring models, and collateral evaluations.",
        "font_family": "Times-Roman"
    },
    {
        "id": "wealth_manager_hnw",
        "name": "Private Wealth Advisor (HNW/UHNW)",
        "category": "Finance & Banking",
        "layout": "split_header",
        "palette": "executive_burgundy",
        "badge": "Family Office Focus",
        "ats_score": "98% ATS Pass",
        "description": "Tailored for private banks managing high-net-worth family portfolios in the Gulf.",
        "font_family": "Times-Roman"
    },
    {
        "id": "anti_money_laundering_aml",
        "name": "AML & Financial Crime Specialist",
        "category": "Finance & Banking",
        "layout": "single_column",
        "palette": "charcoal_crimson",
        "badge": "CAMS Certified",
        "ats_score": "100% ATS Pass",
        "description": "Highlights KYC onboarding, sanctions screening, PEP checks, and regulatory reporting.",
        "font_family": "Helvetica"
    },
    {
        "id": "venture_capital_analyst",
        "name": "Venture Capital Investment Associate",
        "category": "Finance & Banking",
        "layout": "modern_accent",
        "palette": "dubai_sapphire",
        "badge": "Seed to Series B",
        "ats_score": "99% ATS Pass",
        "description": "Highlights deal flow sourcing, due diligence memorandums, cap tables, and founder networks.",
        "font_family": "Helvetica"
    },
    {
        "id": "corporate_tax_advisor",
        "name": "UAE & Saudi Corporate Tax Specialist",
        "category": "Finance & Banking",
        "layout": "single_column",
        "palette": "saudi_emerald",
        "badge": "FTA & ZATCA Expert",
        "ats_score": "100% ATS Pass",
        "description": "Specialized for the 9% UAE Corporate Tax and Saudi transfer pricing regulations.",
        "font_family": "Times-Roman"
    },
    {
        "id": "actuary_insurance_risk",
        "name": "Senior Insurance Actuary & Pricing",
        "category": "Finance & Banking",
        "layout": "compact_dense",
        "palette": "nordic_frost",
        "badge": "Solvency II / IFRS 17",
        "ats_score": "99% ATS Pass",
        "description": "Calculates loss reserves, pricing models, catastrophe reinsurance, and actuarial models.",
        "font_family": "Helvetica"
    },
    {
        "id": "real_estate_finance_analyst",
        "name": "Real Estate Investment & REITS",
        "category": "Finance & Banking",
        "layout": "split_header",
        "palette": "riyadh_gold",
        "badge": "Dubai / Riyadh Land",
        "ats_score": "99% ATS Pass",
        "description": "Showcases asset valuations, net operating income (NOI), cap rates, and development finance.",
        "font_family": "Helvetica"
    },

    # --- Category 6: Minimalist ATS (Templates 81 - 95) ---
    {
        "id": "ats_pure_standard",
        "name": "Universal Taleo & Workday Pass",
        "category": "Minimalist ATS",
        "layout": "single_column",
        "palette": "pure_black",
        "badge": "100% Parse Guaranteed",
        "ats_score": "100% ATS Pass",
        "description": "The quintessential zero-error resume. Parses flawlessly through any enterprise screening bot.",
        "font_family": "Helvetica"
    },
    {
        "id": "ats_greenhouse_modern",
        "name": "Greenhouse Clean Scan",
        "category": "Minimalist ATS",
        "layout": "single_column",
        "palette": "slate_navy",
        "badge": "Startup Greenhouse",
        "ats_score": "100% ATS Pass",
        "description": "Minimalist layout with subtle indigo headers favored by high-growth venture-backed companies.",
        "font_family": "Helvetica"
    },
    {
        "id": "ats_ivy_league",
        "name": "Harvard & Wharton Traditional",
        "category": "Minimalist ATS",
        "layout": "single_column",
        "palette": "pure_black",
        "badge": "Ivy League Standard",
        "ats_score": "100% ATS Pass",
        "description": "Strict serif academic styling with centered contact info and chronological bullet structure.",
        "font_family": "Times-Roman"
    },
    {
        "id": "ats_compact_one_page",
        "name": "Single Page Rush (Zero Overflow)",
        "category": "Minimalist ATS",
        "layout": "compact_dense",
        "palette": "pure_black",
        "badge": "Strictly 1 Page",
        "ats_score": "100% ATS Pass",
        "description": "Optimized typography margins specifically calculated to guarantee zero accidental page spills.",
        "font_family": "Helvetica"
    },
    {
        "id": "ats_sap_successfactors",
        "name": "SAP SuccessFactors Compliance",
        "category": "Minimalist ATS",
        "layout": "single_column",
        "palette": "minimal_graphite",
        "badge": "Global Enterprise",
        "ats_score": "100% ATS Pass",
        "description": "Standardized section headers calibrated to align with SAP SuccessFactors field mappings.",
        "font_family": "Helvetica"
    },
    {
        "id": "ats_lever_tech_flow",
        "name": "Lever Clean Tech Recruiter",
        "category": "Minimalist ATS",
        "layout": "single_column",
        "palette": "slate_navy",
        "badge": "Fast Recruiter Skim",
        "ats_score": "100% ATS Pass",
        "description": "Engineered for 6-second recruiter scanning with bold metrics and crisp keyword placement.",
        "font_family": "Helvetica"
    },
    {
        "id": "ats_bullet_quantified",
        "name": "STAR Metric Heavy (XYZ Formula)",
        "category": "Minimalist ATS",
        "layout": "single_column",
        "palette": "pure_black",
        "badge": "Google XYZ Formula",
        "ats_score": "100% ATS Pass",
        "description": "Optimized to present achievements as: Accomplished [X], as measured by [Y], by doing [Z].",
        "font_family": "Helvetica"
    },
    {
        "id": "ats_icims_compliant",
        "name": "iCIMS Government & Enterprise",
        "category": "Minimalist ATS",
        "layout": "single_column",
        "palette": "minimal_graphite",
        "badge": "Strict Parsing",
        "ats_score": "100% ATS Pass",
        "description": "Designed for strict defense, aeronautics, and government contractors using iCIMS portals.",
        "font_family": "Helvetica"
    },
    {
        "id": "ats_linear_timeline",
        "name": "Chronological Master Resume",
        "category": "Minimalist ATS",
        "layout": "single_column",
        "palette": "slate_navy",
        "badge": "Career Stability",
        "ats_score": "100% ATS Pass",
        "description": "Linear timeline clearly highlighting continuous promotion and organizational tenure.",
        "font_family": "Times-Roman"
    },
    {
        "id": "ats_skills_first_matrix",
        "name": "Functional & Competency First",
        "category": "Minimalist ATS",
        "layout": "compact_dense",
        "palette": "pure_black",
        "badge": "Career Pivot & Skills",
        "ats_score": "99% ATS Pass",
        "description": "Elevates technical competencies to the top for professionals transitioning between domains.",
        "font_family": "Helvetica"
    },
    {
        "id": "ats_entry_fresh_grad",
        "name": "Fresh Graduate & Academic Honors",
        "category": "Minimalist ATS",
        "layout": "single_column",
        "palette": "royal_cobalt",
        "badge": "Entry Level Standard",
        "ats_score": "100% ATS Pass",
        "description": "Puts degrees, capstone projects, and GPA honors first for candidates with 0–2 years experience.",
        "font_family": "Helvetica"
    },
    {
        "id": "ats_senior_staff_two_page",
        "name": "Senior Staff 2-Page Detailed",
        "category": "Minimalist ATS",
        "layout": "single_column",
        "palette": "pure_black",
        "badge": "10+ Years History",
        "ats_score": "100% ATS Pass",
        "description": "Calibrated spacing for experienced 10+ year veterans requiring a structured two-page journey.",
        "font_family": "Times-Roman"
    },
    {
        "id": "ats_contrast_accent_rule",
        "name": "Understated Divider Line",
        "category": "Minimalist ATS",
        "layout": "single_column",
        "palette": "slate_navy",
        "badge": "Clean Aesthetics",
        "ats_score": "100% ATS Pass",
        "description": "Subtle horizontal rules between sections to guide the recruiter's eye without breaking parsers.",
        "font_family": "Helvetica"
    },
    {
        "id": "ats_international_relocation",
        "name": "Global Expat & Visa Eligible",
        "category": "Minimalist ATS",
        "layout": "single_column",
        "palette": "saudi_emerald",
        "badge": "Relocation Ready",
        "ats_score": "100% ATS Pass",
        "description": "Highlights international mobility, passport readiness, and immediate notice period availability.",
        "font_family": "Helvetica"
    },
    {
        "id": "ats_pure_text_terminal",
        "name": "Silicon Monospace Minimal",
        "category": "Minimalist ATS",
        "layout": "compact_dense",
        "palette": "pure_black",
        "badge": "Hacker Clean",
        "ats_score": "100% ATS Pass",
        "description": "Raw, precise layout favored by Linux kernel contributors and deep infrastructure teams.",
        "font_family": "Helvetica"
    },

    # --- Category 7: Creative, Product & International Remote (Templates 96 - 105) ---
    {
        "id": "remote_global_async",
        "name": "Async Remote Specialist (US/EU/GCC)",
        "category": "Creative & Remote",
        "layout": "split_header",
        "palette": "dubai_sapphire",
        "badge": "Timezone Agile",
        "ats_score": "99% ATS Pass",
        "description": "Highlights timezone overlap (PST, EST, GMT, GST), async documentation, and remote autonomy.",
        "font_family": "Helvetica"
    },
    {
        "id": "product_manager_growth",
        "name": "Product-Led Growth (PLG) Leader",
        "category": "Creative & Remote",
        "layout": "modern_accent",
        "palette": "royal_cobalt",
        "badge": "Metrics & Funnels",
        "ats_score": "98% ATS Pass",
        "description": "Puts retention curves, cohort metrics, CAC/LTV payback, and feature discovery upfront.",
        "font_family": "Helvetica"
    },
    {
        "id": "scrum_agile_coach",
        "name": "Agile Coach & Scrum Master",
        "category": "Creative & Remote",
        "layout": "single_column",
        "palette": "gulf_teal",
        "badge": "PSM III / SAFe",
        "ats_score": "99% ATS Pass",
        "description": "Highlights sprint velocity improvements, cycle time reductions, and agile team facilitation.",
        "font_family": "Helvetica"
    },
    {
        "id": "technical_writer_docs",
        "name": "Technical Documentation Specialist",
        "category": "Creative & Remote",
        "layout": "single_column",
        "palette": "nordic_frost",
        "badge": "Docs-As-Code",
        "ats_score": "100% ATS Pass",
        "description": "Exceptionally clean typography highlighting developer guides, OpenAPI specs, and tutorials.",
        "font_family": "Helvetica"
    },
    {
        "id": "ui_ux_product_designer",
        "name": "UX Research & Product Designer",
        "category": "Creative & Remote",
        "layout": "split_header",
        "palette": "silicon_cyan",
        "badge": "Design Systems",
        "ats_score": "98% ATS Pass",
        "description": "Structured case study format highlighting Figma tokens, user interviews, and conversion lifts.",
        "font_family": "Helvetica"
    },
    {
        "id": "developer_advocate_devrel",
        "name": "Developer Relations & Evangelist",
        "category": "Creative & Remote",
        "layout": "modern_accent",
        "palette": "dubai_sapphire",
        "badge": "Community & SDKs",
        "ats_score": "98% ATS Pass",
        "description": "Highlights hackathons, conference talks, GitHub community stars, and technical articles.",
        "font_family": "Helvetica"
    },
    {
        "id": "growth_marketer_b2b",
        "name": "B2B SaaS Growth & Demand Gen",
        "category": "Creative & Remote",
        "layout": "compact_dense",
        "palette": "charcoal_crimson",
        "badge": "Pipeline & SEO",
        "ats_score": "99% ATS Pass",
        "description": "Emphasizes marketing qualified leads (MQLs), CAC reductions, organic traffic, and paid channels.",
        "font_family": "Helvetica"
    },
    {
        "id": "customer_success_enterprise",
        "name": "Enterprise Customer Success (CSM)",
        "category": "Creative & Remote",
        "layout": "single_column",
        "palette": "slate_navy",
        "badge": "Net Retention (NRR)",
        "ats_score": "100% ATS Pass",
        "description": "Focuses on 110%+ net retention rates, renewal values, executive QBRs, and customer onboarding.",
        "font_family": "Helvetica"
    },
    {
        "id": "strategy_operations_chief",
        "name": "Chief of Staff & BizOps",
        "category": "Creative & Remote",
        "layout": "split_header",
        "palette": "riyadh_gold",
        "badge": "Cross-Functional",
        "ats_score": "99% ATS Pass",
        "description": "Positions utility players who execute executive special projects, fundraising, and organizational goals.",
        "font_family": "Helvetica"
    },
    {
        "id": "digital_nomad_contractor",
        "name": "Global Fractional Tech Consultant",
        "category": "Creative & Remote",
        "layout": "modern_accent",
        "palette": "gulf_teal",
        "badge": "Fractional & Retainer",
        "ats_score": "99% ATS Pass",
        "description": "Tailored for senior contractors offering fractional architecture, code audits, and sprint acceleration.",
        "font_family": "Helvetica"
    }
]


def get_template(template_id: Optional[str] = None) -> Dict[str, Any]:
    """Retrieves a specific template by ID or returns the default."""
    if not template_id:
        return TEMPLATES_CATALOG[0]
    
    for t in TEMPLATES_CATALOG:
        if t["id"] == template_id:
            return t
            
    return TEMPLATES_CATALOG[0]


def get_palette(palette_name: str) -> Dict[str, str]:
    """Returns the hex color dictionary for a given palette name."""
    return PALETTES.get(palette_name, PALETTES["slate_navy"])


def list_templates(category: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns all templates, optionally filtered by category, with resolved hex colors."""
    results = []
    for t in TEMPLATES_CATALOG:
        if category and category.lower() != "all" and t["category"].lower() != category.lower():
            continue
        p = get_palette(t["palette"])
        results.append({
            **t,
            "colors": p
        })
    return results
