"""
CareerAI — Roadmap Service

Converts top skill gaps into concrete, actionable items calibrated specifically
to each target career field.

Each roadmap item:
- Addresses a specific gap in the context of the selected career
- Belongs to a structured phase (Foundation, Core, Advanced, Portfolio)
- Is a single, concrete action (e.g. "Build Y using X" rather than generic "Learn X")
- Has estimated hours and curated official documentation/learning resources
- Traces back to the gap and career it addresses
"""

import uuid
from typing import Dict, List, Optional

from app.models.schemas import (
    GapItem,
    GapsResponse,
    GapClassification,
    RoadmapItem,
    RoadmapResponse,
)
from app.services.career_service import get_career
from app.utils.logging import get_logger

logger = get_logger(__name__)


# =============================================================================
# Career-Specific Action Templates Matrix
# career_name -> skill_name -> { action, phase, hours, url }
# =============================================================================

CAREER_ACTION_TEMPLATES: Dict[str, Dict[str, Dict]] = {
    "Software Engineer": {
        "Python": {
            "action": "Build a high-concurrency RESTful microservice with FastAPI, SQLAlchemy 2.0, JWT authentication, and pytest coverage > 85%",
            "phase": "Core",
            "hours": 22,
            "url": "https://fastapi.tiangolo.com/tutorial/",
        },
        "Data Structures & Algorithms": {
            "action": "Complete curated 75 LeetCode problems focusing on dynamic programming, graph traversals, and heap optimization",
            "phase": "Foundation",
            "hours": 45,
            "url": "https://leetcode.com/problemset/",
        },
        "System Design": {
            "action": "Design an end-to-end distributed URL shortener and rate-limiter system documenting caching (Redis), database sharding, and fault tolerance",
            "phase": "Advanced",
            "hours": 30,
            "url": "https://github.com/donnemartin/system-design-primer",
        },
        "Git": {
            "action": "Master advanced Git workflows: interactive rebasing, bisect debugging, squash merges, and submodule management on open-source repos",
            "phase": "Foundation",
            "hours": 10,
            "url": "https://learngitbranching.js.org/",
        },
        "SQL": {
            "action": "Optimize complex relational queries with indexing strategies, window functions, CTEs, and execution plan (EXPLAIN ANALYZE) profiling in PostgreSQL",
            "phase": "Foundation",
            "hours": 18,
            "url": "https://use-the-index-luke.com/",
        },
        "RESTful APIs": {
            "action": "Design OpenAPI 3.0 specification with idempotency keys, cursor-based pagination, rate limits, and automated contract testing",
            "phase": "Core",
            "hours": 16,
            "url": "https://restfulapi.net/",
        },
        "Docker": {
            "action": "Containerize Python/Go services with multi-stage Dockerfiles, non-root users, vulnerability scans (Trivy), and docker-compose local cluster",
            "phase": "Core",
            "hours": 14,
            "url": "https://docs.docker.com/get-started/",
        },
        "Testing & QA": {
            "action": "Implement a complete testing pyramid: unit tests with Pytest/Mock, integration tests with Testcontainers, and CI test runner",
            "phase": "Core",
            "hours": 16,
            "url": "https://docs.pytest.org/",
        },
        "Agile/Scrum": {
            "action": "Simulate 2 sprint cycles using Jira/GitHub Projects: user story sizing, sprint retrospectives, and branch PR workflows",
            "phase": "Foundation",
            "hours": 8,
            "url": "https://www.atlassian.com/agile",
        },
        "Linux": {
            "action": "Configure Linux system services with systemd, write Bash daemon scripts, monitor CPU/memory metrics, and configure firewall rules (UFW/iptables)",
            "phase": "Foundation",
            "hours": 14,
            "url": "https://linuxjourney.com/",
        },
    },
    "ML Engineer": {
        "Python": {
            "action": "Build an asynchronous ML inference service in Python with FastAPI, ONNX Runtime, and batch processing for low-latency scoring",
            "phase": "Foundation",
            "hours": 25,
            "url": "https://fastapi.tiangolo.com/",
        },
        "Machine Learning": {
            "action": "Train, evaluate, and benchmark ensemble and gradient boosting models (XGBoost/LightGBM) with hyperparameter search (Optuna) and SHAP explainability",
            "phase": "Core",
            "hours": 32,
            "url": "https://scikit-learn.org/stable/tutorial/",
        },
        "Deep Learning": {
            "action": "Implement and train custom convolutional and transformer architectures in PyTorch with mixed-precision training and gradient clipping",
            "phase": "Advanced",
            "hours": 40,
            "url": "https://pytorch.org/tutorials/",
        },
        "PyTorch": {
            "action": "Build a deep learning pipeline in PyTorch with custom Dataset, DataLoader, multi-GPU DDP training, and TensorBoard metric logging",
            "phase": "Core",
            "hours": 30,
            "url": "https://pytorch.org/tutorials/beginner/basics/intro.html",
        },
        "Docker": {
            "action": "Build optimized GPU-accelerated Docker containers for ML inference using NVIDIA Container Toolkit and lightweight CUDA runtime base images",
            "phase": "Core",
            "hours": 16,
            "url": "https://docs.docker.com/",
        },
        "scikit-learn": {
            "action": "Construct clean sklearn Pipeline objects with custom feature transformers, ColumnTransformer, and cross-validated grid search",
            "phase": "Core",
            "hours": 20,
            "url": "https://scikit-learn.org/stable/modules/compose.html",
        },
        "SQL": {
            "action": "Write analytical SQL queries to extract feature store aggregations, cohort metrics, and rolling window features for ML training sets",
            "phase": "Foundation",
            "hours": 16,
            "url": "https://mode.com/sql-tutorial/",
        },
        "RESTful APIs": {
            "action": "Deploy model prediction endpoints with schema validation (Pydantic), request batching, and latency profiling under load (Locust)",
            "phase": "Core",
            "hours": 18,
            "url": "https://fastapi.tiangolo.com/",
        },
        "Kubernetes": {
            "action": "Deploy ML model service on Kubernetes with KEDA autoscaling based on queue length and GPU resource allocation limits",
            "phase": "Advanced",
            "hours": 24,
            "url": "https://kubernetes.io/docs/tutorials/",
        },
        "AWS": {
            "action": "Set up AWS SageMaker endpoint deployment with S3 model artifact versioning and CloudWatch inference latency alarms",
            "phase": "Advanced",
            "hours": 22,
            "url": "https://docs.aws.amazon.com/sagemaker/",
        },
        "Natural Language Processing": {
            "action": "Fine-tune HuggingFace transformer models (BERT/RoBERTa) for sequence classification using PEFT/LoRA and evaluate with ROUGE/BLEU",
            "phase": "Portfolio",
            "hours": 30,
            "url": "https://huggingface.co/learn/nlp-course/",
        },
    },
    "Data Scientist": {
        "Python": {
            "action": "Develop automated data transformation and exploratory data analysis (EDA) pipelines in Python using vectorized operations and modular scripting",
            "phase": "Foundation",
            "hours": 20,
            "url": "https://realpython.com/tutorials/data-science/",
        },
        "Statistical Analysis": {
            "action": "Conduct rigorous hypothesis testing (A/B testing, ANOVA, chi-square) with statistical power calculations and confidence intervals on observational data",
            "phase": "Core",
            "hours": 28,
            "url": "https://www.khanacademy.org/math/statistics-probability",
        },
        "Machine Learning": {
            "action": "Build end-to-end predictive modeling pipelines comparing regression, random forests, and gradient boosting with cross-validation",
            "phase": "Core",
            "hours": 28,
            "url": "https://scikit-learn.org/",
        },
        "SQL": {
            "action": "Master advanced SQL analytics: recursive CTEs, window functions (LEAD, LAG, NTILE), and pivot transformations for cohort retention analysis",
            "phase": "Foundation",
            "hours": 20,
            "url": "https://www.sql-practice.com/",
        },
        "Pandas": {
            "action": "Process large datasets with Pandas: efficient memory optimization with categorical types, multi-index aggregation, and vectorized string processing",
            "phase": "Foundation",
            "hours": 18,
            "url": "https://pandas.pydata.org/docs/",
        },
        "Data Visualization": {
            "action": "Create an executive-level interactive dashboard with Plotly/Streamlit showing dynamic filters, drill-down metrics, and statistical distributions",
            "phase": "Portfolio",
            "hours": 20,
            "url": "https://plotly.com/python/",
        },
        "scikit-learn": {
            "action": "Perform feature selection, multicollinearity diagnosis (VIF), and dimensionality reduction (PCA/t-SNE) for high-dimensional feature spaces",
            "phase": "Core",
            "hours": 22,
            "url": "https://scikit-learn.org/",
        },
        "R": {
            "action": "Perform exploratory data modeling and tidyverse pipelines (dplyr, ggplot2) with statistical summary tests in R",
            "phase": "Core",
            "hours": 20,
            "url": "https://r4ds.had.co.nz/",
        },
        "Natural Language Processing": {
            "action": "Extract insights from unstructured customer review texts using topic modeling (BERTopic/LDA) and sentiment analysis",
            "phase": "Advanced",
            "hours": 24,
            "url": "https://huggingface.co/",
        },
        "Data Engineering": {
            "action": "Design reproducible ETL pipelines using DuckDB, Parquet columnar storage, and Apache Airflow DAG scheduling",
            "phase": "Advanced",
            "hours": 24,
            "url": "https://duckdb.org/docs/",
        },
    },
    "Cybersecurity Analyst": {
        "Network Security": {
            "action": "Perform deep packet inspection and network traffic analysis using Wireshark and Zeek to detect malicious beaconing and port scans",
            "phase": "Foundation",
            "hours": 28,
            "url": "https://www.wireshark.org/docs/",
        },
        "Linux": {
            "action": "Harden Linux systems: configure SSH key pairs, audit with Lynis, enforce PAM policies, and inspect system logs in /var/log/journal",
            "phase": "Foundation",
            "hours": 18,
            "url": "https://linuxjourney.com/",
        },
        "Python": {
            "action": "Write custom security automation tools in Python: port scanner with Scapy, automated log parser for brute-force attempts, and hash cracking verifier",
            "phase": "Core",
            "hours": 24,
            "url": "https://scapy.net/",
        },
        "SIEM Tools": {
            "action": "Deploy an open-source SIEM (Wazuh or ELK), configure Syslog ingestion, create correlation rules for brute-force attacks, and build alert dashboards",
            "phase": "Core",
            "hours": 26,
            "url": "https://wazuh.com/",
        },
        "Penetration Testing": {
            "action": "Complete 10 offensive security labs on TryHackMe/HackTheBox covering OWASP Top 10 web vulnerabilities (SQLi, XSS, CSRF, SSRF)",
            "phase": "Advanced",
            "hours": 32,
            "url": "https://tryhackme.com/",
        },
        "Cryptography": {
            "action": "Implement secure data transmission using TLS 1.3, analyze cryptographic flaws (padding oracle, weak ciphers), and manage PKI certificate authorities",
            "phase": "Core",
            "hours": 22,
            "url": "https://cryptopals.com/",
        },
        "Incident Response": {
            "action": "Draft a comprehensive CSIRT Incident Response Playbook for ransomware and data exfiltration according to NIST SP 800-61 guidelines",
            "phase": "Portfolio",
            "hours": 20,
            "url": "https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final",
        },
        "Bash": {
            "action": "Create automated Linux security audit scripts in Bash to flag world-writable files, unquoted service paths, and unauthorized SUID binaries",
            "phase": "Foundation",
            "hours": 14,
            "url": "https://www.gnu.org/software/bash/manual/",
        },
        "AWS": {
            "action": "Audit AWS cloud security posture: inspect IAM policies for least privilege, configure AWS CloudTrail, and enable AWS GuardDuty alerts",
            "phase": "Advanced",
            "hours": 20,
            "url": "https://aws.amazon.com/security/",
        },
        "SQL": {
            "action": "Analyze SQL injection mechanisms, craft prepared statements defenses, and audit database access logs for abnormal query patterns",
            "phase": "Foundation",
            "hours": 14,
            "url": "https://portswigger.net/web-security/sql-injection",
        },
    },
    "Cloud Engineer": {
        "AWS": {
            "action": "Deploy a highly available, multi-AZ cloud architecture on AWS using VPC, ALB, Auto Scaling groups, RDS Multi-AZ, and S3 with lifecycle policies",
            "phase": "Core",
            "hours": 26,
            "url": "https://aws.amazon.com/getting-started/",
        },
        "Docker": {
            "action": "Write secure, production-grade Dockerfiles with multi-stage builds, rootless containers, and scan images for CVEs using Trivy",
            "phase": "Foundation",
            "hours": 16,
            "url": "https://docs.docker.com/",
        },
        "Kubernetes": {
            "action": "Provision a Kubernetes cluster with Helm charts, Ingress-NGINX controller, Cert-Manager TLS, and rolling zero-downtime deployment strategies",
            "phase": "Advanced",
            "hours": 30,
            "url": "https://kubernetes.io/docs/tutorials/",
        },
        "Terraform": {
            "action": "Manage cloud infrastructure as code (IaC) with Terraform: modularize VPC and compute resources, configure remote S3 state with DynamoDB locking",
            "phase": "Core",
            "hours": 24,
            "url": "https://developer.hashicorp.com/terraform/tutorials",
        },
        "Linux": {
            "action": "Configure enterprise Linux servers: kernel parameter tuning (sysctl), storage LVM configuration, systemd services, and SSH bastions",
            "phase": "Foundation",
            "hours": 18,
            "url": "https://linuxjourney.com/",
        },
        "Python": {
            "action": "Develop automated cloud maintenance scripts using Python and Boto3 (AWS SDK): snapshot automation, cost tagging enforcement, and orphan resource cleanups",
            "phase": "Foundation",
            "hours": 18,
            "url": "https://boto3.amazonaws.com/v1/documentation/api/latest/index.html",
        },
        "DevOps": {
            "action": "Implement GitOps workflows using ArgoCD or Flux to automatically reconcile Kubernetes clusters against a GitHub declarative repository",
            "phase": "Advanced",
            "hours": 22,
            "url": "https://argo-cd.readthedocs.io/",
        },
        "CI/CD": {
            "action": "Construct an automated GitHub Actions pipeline with automated linting, security testing, container build & push to ECR, and deployment to staging",
            "phase": "Core",
            "hours": 18,
            "url": "https://docs.github.com/en/actions",
        },
        "Cloud Architecture": {
            "action": "Produce a Well-Architected Framework review document evaluating operational excellence, security, reliability, performance, and cost optimization",
            "phase": "Portfolio",
            "hours": 22,
            "url": "https://aws.amazon.com/architecture/well-architected/",
        },
        "Bash": {
            "action": "Write robust Bash automation scripts with strict error handling (`set -euo pipefail`), CLI arguments parsing, and remote execution via Ansible",
            "phase": "Foundation",
            "hours": 12,
            "url": "https://www.gnu.org/software/bash/manual/",
        },
    },
    "Full Stack Developer": {
        "JavaScript": {
            "action": "Master modern ESNext JavaScript: event loop concurrency, Promises/async generators, closures, prototypes, and deep clone/debounce utility implementation",
            "phase": "Foundation",
            "hours": 20,
            "url": "https://javascript.info/",
        },
        "React": {
            "action": "Build a responsive, accessible React 18+ application utilizing custom hooks, Context API, optimistic UI updates, and code-splitting with React.lazy",
            "phase": "Core",
            "hours": 28,
            "url": "https://react.dev/learn",
        },
        "Node.js": {
            "action": "Create an asynchronous REST and WebSocket backend with Express or NestJS, featuring rate limiting, JWT auth cookies, and centralized error handling",
            "phase": "Core",
            "hours": 26,
            "url": "https://nodejs.org/en/learn",
        },
        "SQL": {
            "action": "Design a normalized relational schema for a multi-tenant application with foreign key constraints, indexes, and write migration scripts using Prisma or Drizzle ORM",
            "phase": "Foundation",
            "hours": 16,
            "url": "https://www.postgresql.org/docs/",
        },
        "TypeScript": {
            "action": "Migrate a full-stack project to TypeScript with strict type checking, discriminated unions, utility types, and end-to-end API type safety (tRPC/Zod)",
            "phase": "Core",
            "hours": 20,
            "url": "https://www.typescriptlang.org/docs/",
        },
        "RESTful APIs": {
            "action": "Implement resilient REST APIs with idempotent endpoints, HTTP caching headers (ETag), pagination (offset vs cursor), and OpenAPI docs",
            "phase": "Foundation",
            "hours": 16,
            "url": "https://restfulapi.net/",
        },
        "Git": {
            "action": "Follow Trunk-Based Development or GitHub Flow: semantic commit messages, atomic PRs, resolving merge conflicts, and automated PR preview deployments",
            "phase": "Foundation",
            "hours": 10,
            "url": "https://learngitbranching.js.org/",
        },
        "PostgreSQL": {
            "action": "Configure connection pooling with PgBouncer, implement full-text search with tsvector/GIN indexes, and write complex JOIN queries with JSONB aggregations",
            "phase": "Core",
            "hours": 18,
            "url": "https://www.postgresql.org/docs/",
        },
        "Docker": {
            "action": "Compose a full-stack local development environment with Docker Compose: frontend, API server, PostgreSQL database, and Redis cache with health checks",
            "phase": "Core",
            "hours": 14,
            "url": "https://docs.docker.com/",
        },
        "Next.js": {
            "action": "Develop a performant Next.js App Router project leveraging Server Components (RSC), Server Actions, static generation, and streaming with Suspense",
            "phase": "Portfolio",
            "hours": 26,
            "url": "https://nextjs.org/docs",
        },
        "MongoDB": {
            "action": "Design document schemas with Mongoose: schema validation, compound indexes, aggregation pipelines ($lookup, $unwind), and replica set transactions",
            "phase": "Core",
            "hours": 16,
            "url": "https://www.mongodb.com/docs/",
        },
    },
}

# Generic fallback actions for skills not specifically mapped in the career matrix
GLOBAL_ACTION_TEMPLATES: Dict[str, Dict] = {
    "Python": {
        "action": "Build and deploy a modular Python application with type hinting, automated unit tests, and CI automation",
        "phase": "Core",
        "hours": 20,
        "url": "https://docs.python.org/3/tutorial/",
    },
    "JavaScript": {
        "action": "Build an interactive client-side web application using modern ES6+ JavaScript, DOM APIs, and asynchronous fetch flows",
        "phase": "Foundation",
        "hours": 20,
        "url": "https://javascript.info/",
    },
    "React": {
        "action": "Build a responsive single-page web app with React components, state management, and API data fetching",
        "phase": "Core",
        "hours": 24,
        "url": "https://react.dev/learn",
    },
    "Docker": {
        "action": "Containerize an application with Docker, write a multi-stage Dockerfile, and configure docker-compose for local development",
        "phase": "Core",
        "hours": 14,
        "url": "https://docs.docker.com/get-started/",
    },
    "Kubernetes": {
        "action": "Deploy a multi-tier microservice application to a Kubernetes cluster with Services, Ingress, and ConfigMaps",
        "phase": "Advanced",
        "hours": 22,
        "url": "https://kubernetes.io/docs/tutorials/",
    },
    "SQL": {
        "action": "Complete advanced SQL query challenges: joins, subqueries, grouping, and index tuning on a relational database",
        "phase": "Foundation",
        "hours": 15,
        "url": "https://www.sql-practice.com/",
    },
    "Git": {
        "action": "Practice collaborative Git workflows: feature branching, rebasing, pull request reviews, and merge conflict resolution",
        "phase": "Foundation",
        "hours": 8,
        "url": "https://learngitbranching.js.org/",
    },
}

DEFAULT_ACTION = {
    "action": "Build a portfolio project demonstrating practical proficiency in {skill_name}, document the architecture, and publish on GitHub",
    "phase": "Core",
    "hours": 18,
    "url": None,
}


def generate_roadmap_items(
    gaps: List[GapItem],
    career_name: Optional[str] = None,
) -> List[RoadmapItem]:
    """
    Convert skill gaps into concrete, career-tailored roadmap action items.

    Lookup hierarchy:
    1. Career-specific action template (CAREER_ACTION_TEMPLATES[career_name][skill])
    2. Global action template (GLOBAL_ACTION_TEMPLATES[skill])
    3. Dynamic career-tailored fallback
    """
    items = []
    career_templates = CAREER_ACTION_TEMPLATES.get(career_name or "", {})

    for i, gap in enumerate(gaps):
        # 1. Try career-specific template
        template = career_templates.get(gap.skill_name)

        # 2. Fall back to global action template
        if not template:
            template = GLOBAL_ACTION_TEMPLATES.get(gap.skill_name)

        if template:
            action_title = template["action"]
            phase = template.get("phase", "Core")
            hours = template["hours"]
            url = template.get("url")
        else:
            role_hint = f" for {career_name}" if career_name else ""
            action_title = f"Build a practical hands-on project{role_hint} demonstrating mastery in {gap.skill_name}, document it and publish on GitHub"
            phase = "Foundation" if gap.current_level <= 1 else ("Advanced" if gap.target_level >= 4 else "Core")
            hours = DEFAULT_ACTION["hours"]
            url = DEFAULT_ACTION.get("url")

        # Scale estimated hours by gap size (bigger gap = more learning hours)
        if gap.gap_size >= 3:
            hours = int(hours * 1.5)
        elif gap.gap_size <= 1:
            hours = max(6, int(hours * 0.75))

        items.append(RoadmapItem(
            id=uuid.uuid4(),
            action_title=action_title,
            action_detail=(
                f"Priority: {gap.classification.value.upper()} • "
                f"Current: {gap.current_level}/5 ➔ Target: {gap.target_level}/5. "
                f"{gap.importance.value.capitalize()} skill ({gap.priority_score:.1f} priority score)."
            ),
            priority_order=i + 1,
            phase=phase,
            estimated_hours=hours,
            resource_url=url,
            gap_skill_name=gap.skill_name,
            is_completed=False,
            completed_at=None,
        ))

    return items


async def generate_roadmap(
    profile: 'StudentProfileResponse',
    career_id: str,
    gaps: GapsResponse,
) -> RoadmapResponse:
    """
    Generate a personalized roadmap from skill gaps tailored to the specified career.
    """
    career = get_career(career_id)
    career_name = career.name if career else (gaps.career_name or "")
    items = generate_roadmap_items(gaps.gaps, career_name=career_name)

    logger.info(
        "roadmap_generated",
        student_id=str(profile.id),
        career=career_name or "unknown",
        items_count=len(items),
    )

    return RoadmapResponse(
        student_id=profile.id,
        career_id=gaps.career_id,
        career_name=gaps.career_name or career_name,
        items=items,
    )
