"""
Seed script for Neo4j graph database.

Seeds ~60 skill nodes, 10 category nodes, and ~150 relationships.

Usage:
    cd backend
    python -m scripts.seed_graph
"""

import asyncio
import sys

from neo4j import AsyncGraphDatabase

from app.config import settings

# ---------------------------------------------------------------------------
# Data definitions
# ---------------------------------------------------------------------------

categories = [
    {"id": "cat_programming", "name": "Programming Fundamentals", "name_ko": "프로그래밍 기초", "color": "#FF6B6B", "icon": "code"},
    {"id": "cat_web", "name": "Web Fundamentals", "name_ko": "웹 기초", "color": "#4ECDC4", "icon": "globe"},
    {"id": "cat_frontend", "name": "Frontend", "name_ko": "프론트엔드", "color": "#45B7D1", "icon": "layout"},
    {"id": "cat_backend", "name": "Backend", "name_ko": "백엔드", "color": "#96CEB4", "icon": "server"},
    {"id": "cat_devops", "name": "DevOps", "name_ko": "데브옵스", "color": "#FFEAA7", "icon": "cloud"},
    {"id": "cat_data", "name": "Data Science", "name_ko": "데이터 사이언스", "color": "#DDA0DD", "icon": "bar-chart"},
    {"id": "cat_mobile", "name": "Mobile", "name_ko": "모바일", "color": "#98D8C8", "icon": "smartphone"},
    {"id": "cat_ai", "name": "AI/ML", "name_ko": "AI/머신러닝", "color": "#F7DC6F", "icon": "cpu"},
    {"id": "cat_system", "name": "System Design", "name_ko": "시스템 설계", "color": "#BB8FCE", "icon": "layers"},
    {"id": "cat_cs", "name": "CS Fundamentals", "name_ko": "CS 기초", "color": "#85C1E9", "icon": "book"},
]

skills = [
    # CS Fundamentals (6)
    {"id": "cs_data_structures", "name": "Data Structures", "name_ko": "자료구조", "category": "cat_cs", "difficulty": 0.5, "market_demand": 0.9, "estimated_hours": 80, "description": "Arrays, linked lists, trees, graphs, hash tables"},
    {"id": "cs_algorithms", "name": "Algorithms", "name_ko": "알고리즘", "category": "cat_cs", "difficulty": 0.6, "market_demand": 0.9, "estimated_hours": 100, "description": "Sorting, searching, dynamic programming, graph algorithms"},
    {"id": "cs_os", "name": "Operating Systems", "name_ko": "운영체제", "category": "cat_cs", "difficulty": 0.6, "market_demand": 0.6, "estimated_hours": 60, "description": "Processes, threads, memory management, file systems"},
    {"id": "cs_networking", "name": "Networking", "name_ko": "네트워크", "category": "cat_cs", "difficulty": 0.5, "market_demand": 0.7, "estimated_hours": 50, "description": "TCP/IP, HTTP, DNS, OSI model"},
    {"id": "cs_db_theory", "name": "Database Theory", "name_ko": "데이터베이스 이론", "category": "cat_cs", "difficulty": 0.5, "market_demand": 0.8, "estimated_hours": 50, "description": "Relational model, normalization, ACID, transactions"},
    {"id": "cs_design_patterns", "name": "Design Patterns", "name_ko": "디자인 패턴", "category": "cat_cs", "difficulty": 0.5, "market_demand": 0.7, "estimated_hours": 40, "description": "Singleton, Factory, Observer, Strategy patterns"},

    # Programming (7)
    {"id": "prog_python", "name": "Python", "name_ko": "파이썬", "category": "cat_programming", "difficulty": 0.3, "market_demand": 0.95, "estimated_hours": 80, "description": "General-purpose programming language"},
    {"id": "prog_javascript", "name": "JavaScript", "name_ko": "자바스크립트", "category": "cat_programming", "difficulty": 0.3, "market_demand": 0.95, "estimated_hours": 80, "description": "Web programming language"},
    {"id": "prog_typescript", "name": "TypeScript", "name_ko": "타입스크립트", "category": "cat_programming", "difficulty": 0.4, "market_demand": 0.9, "estimated_hours": 50, "description": "Typed superset of JavaScript"},
    {"id": "prog_java", "name": "Java", "name_ko": "자바", "category": "cat_programming", "difficulty": 0.4, "market_demand": 0.85, "estimated_hours": 100, "description": "Enterprise programming language"},
    {"id": "prog_go", "name": "Go", "name_ko": "Go", "category": "cat_programming", "difficulty": 0.4, "market_demand": 0.75, "estimated_hours": 60, "description": "Systems programming language by Google"},
    {"id": "prog_rust", "name": "Rust", "name_ko": "러스트", "category": "cat_programming", "difficulty": 0.8, "market_demand": 0.7, "estimated_hours": 120, "description": "Systems programming with memory safety"},
    {"id": "prog_sql", "name": "SQL", "name_ko": "SQL", "category": "cat_programming", "difficulty": 0.3, "market_demand": 0.9, "estimated_hours": 40, "description": "Database query language"},

    # Web Fundamentals (5)
    {"id": "web_html", "name": "HTML", "name_ko": "HTML", "category": "cat_web", "difficulty": 0.1, "market_demand": 0.9, "estimated_hours": 20, "description": "Markup language for web pages"},
    {"id": "web_css", "name": "CSS", "name_ko": "CSS", "category": "cat_web", "difficulty": 0.3, "market_demand": 0.85, "estimated_hours": 40, "description": "Styling language for web pages"},
    {"id": "web_http", "name": "HTTP/REST", "name_ko": "HTTP/REST", "category": "cat_web", "difficulty": 0.3, "market_demand": 0.9, "estimated_hours": 20, "description": "HTTP protocol and RESTful API design"},
    {"id": "web_security", "name": "Web Security", "name_ko": "웹 보안", "category": "cat_web", "difficulty": 0.5, "market_demand": 0.8, "estimated_hours": 30, "description": "CORS, XSS, CSRF, authentication patterns"},
    {"id": "web_browser_apis", "name": "Browser APIs", "name_ko": "브라우저 API", "category": "cat_web", "difficulty": 0.4, "market_demand": 0.7, "estimated_hours": 30, "description": "DOM, Fetch, Storage, Web Workers"},

    # Frontend (8)
    {"id": "fe_react", "name": "React", "name_ko": "리액트", "category": "cat_frontend", "difficulty": 0.5, "market_demand": 0.95, "estimated_hours": 80, "description": "Component-based UI library"},
    {"id": "fe_nextjs", "name": "Next.js", "name_ko": "Next.js", "category": "cat_frontend", "difficulty": 0.5, "market_demand": 0.85, "estimated_hours": 60, "description": "React framework with SSR/SSG"},
    {"id": "fe_vue", "name": "Vue.js", "name_ko": "Vue.js", "category": "cat_frontend", "difficulty": 0.35, "market_demand": 0.7, "estimated_hours": 60, "description": "Progressive JavaScript framework"},
    {"id": "fe_state_mgmt", "name": "State Management", "name_ko": "상태 관리", "category": "cat_frontend", "difficulty": 0.5, "market_demand": 0.8, "estimated_hours": 30, "description": "Redux, Zustand, Context API"},
    {"id": "fe_css_frameworks", "name": "CSS Frameworks", "name_ko": "CSS 프레임워크", "category": "cat_frontend", "difficulty": 0.2, "market_demand": 0.8, "estimated_hours": 20, "description": "Tailwind CSS, Bootstrap, styled-components"},
    {"id": "fe_testing", "name": "Frontend Testing", "name_ko": "프론트엔드 테스팅", "category": "cat_frontend", "difficulty": 0.5, "market_demand": 0.75, "estimated_hours": 40, "description": "Jest, React Testing Library, Cypress"},
    {"id": "fe_build_tools", "name": "Build Tools", "name_ko": "빌드 도구", "category": "cat_frontend", "difficulty": 0.4, "market_demand": 0.7, "estimated_hours": 20, "description": "Webpack, Vite, esbuild"},
    {"id": "fe_performance", "name": "Web Performance", "name_ko": "웹 성능 최적화", "category": "cat_frontend", "difficulty": 0.6, "market_demand": 0.75, "estimated_hours": 40, "description": "Core Web Vitals, lazy loading, code splitting"},

    # Backend (8)
    {"id": "be_nodejs", "name": "Node.js", "name_ko": "Node.js", "category": "cat_backend", "difficulty": 0.4, "market_demand": 0.9, "estimated_hours": 60, "description": "JavaScript runtime for servers"},
    {"id": "be_fastapi", "name": "FastAPI", "name_ko": "FastAPI", "category": "cat_backend", "difficulty": 0.4, "market_demand": 0.8, "estimated_hours": 40, "description": "Modern Python web framework"},
    {"id": "be_django", "name": "Django", "name_ko": "장고", "category": "cat_backend", "difficulty": 0.5, "market_demand": 0.75, "estimated_hours": 60, "description": "Full-featured Python web framework"},
    {"id": "be_spring", "name": "Spring Boot", "name_ko": "스프링 부트", "category": "cat_backend", "difficulty": 0.6, "market_demand": 0.85, "estimated_hours": 80, "description": "Java enterprise framework"},
    {"id": "be_postgresql", "name": "PostgreSQL", "name_ko": "PostgreSQL", "category": "cat_backend", "difficulty": 0.4, "market_demand": 0.9, "estimated_hours": 40, "description": "Advanced relational database"},
    {"id": "be_mongodb", "name": "MongoDB", "name_ko": "MongoDB", "category": "cat_backend", "difficulty": 0.3, "market_demand": 0.65, "estimated_hours": 30, "description": "Document-oriented NoSQL database"},
    {"id": "be_redis", "name": "Redis", "name_ko": "Redis", "category": "cat_backend", "difficulty": 0.3, "market_demand": 0.8, "estimated_hours": 20, "description": "In-memory data store and cache"},
    {"id": "be_auth", "name": "Authentication", "name_ko": "인증/인가", "category": "cat_backend", "difficulty": 0.5, "market_demand": 0.9, "estimated_hours": 30, "description": "JWT, OAuth, session management"},

    # DevOps (6)
    {"id": "devops_git", "name": "Git", "name_ko": "Git", "category": "cat_devops", "difficulty": 0.2, "market_demand": 0.95, "estimated_hours": 20, "description": "Version control system"},
    {"id": "devops_docker", "name": "Docker", "name_ko": "도커", "category": "cat_devops", "difficulty": 0.4, "market_demand": 0.95, "estimated_hours": 30, "description": "Containerization platform"},
    {"id": "devops_k8s", "name": "Kubernetes", "name_ko": "쿠버네티스", "category": "cat_devops", "difficulty": 0.7, "market_demand": 0.8, "estimated_hours": 80, "description": "Container orchestration"},
    {"id": "devops_cicd", "name": "CI/CD", "name_ko": "CI/CD", "category": "cat_devops", "difficulty": 0.5, "market_demand": 0.85, "estimated_hours": 30, "description": "GitHub Actions, Jenkins, automated pipelines"},
    {"id": "devops_aws", "name": "AWS", "name_ko": "AWS", "category": "cat_devops", "difficulty": 0.6, "market_demand": 0.9, "estimated_hours": 80, "description": "Amazon Web Services cloud platform"},
    {"id": "devops_linux", "name": "Linux", "name_ko": "리눅스", "category": "cat_devops", "difficulty": 0.4, "market_demand": 0.85, "estimated_hours": 40, "description": "Linux system administration"},

    # Data Science (6)
    {"id": "data_sql_advanced", "name": "SQL Advanced", "name_ko": "SQL 고급", "category": "cat_data", "difficulty": 0.5, "market_demand": 0.85, "estimated_hours": 40, "description": "Window functions, CTEs, query optimization"},
    {"id": "data_pandas", "name": "Pandas", "name_ko": "판다스", "category": "cat_data", "difficulty": 0.4, "market_demand": 0.85, "estimated_hours": 40, "description": "Python data manipulation library"},
    {"id": "data_visualization", "name": "Data Visualization", "name_ko": "데이터 시각화", "category": "cat_data", "difficulty": 0.3, "market_demand": 0.75, "estimated_hours": 30, "description": "Matplotlib, Seaborn, Plotly"},
    {"id": "data_statistics", "name": "Statistics", "name_ko": "통계학", "category": "cat_data", "difficulty": 0.5, "market_demand": 0.8, "estimated_hours": 60, "description": "Probability, hypothesis testing, regression"},
    {"id": "data_etl", "name": "ETL", "name_ko": "ETL", "category": "cat_data", "difficulty": 0.5, "market_demand": 0.75, "estimated_hours": 40, "description": "Extract, Transform, Load pipelines"},
    {"id": "data_modeling", "name": "Data Modeling", "name_ko": "데이터 모델링", "category": "cat_data", "difficulty": 0.5, "market_demand": 0.8, "estimated_hours": 40, "description": "Schema design, dimensional modeling"},

    # AI/ML (6)
    {"id": "ai_numpy", "name": "NumPy", "name_ko": "넘파이", "category": "cat_ai", "difficulty": 0.3, "market_demand": 0.8, "estimated_hours": 20, "description": "Numerical computing library"},
    {"id": "ai_sklearn", "name": "Scikit-learn", "name_ko": "사이킷런", "category": "cat_ai", "difficulty": 0.5, "market_demand": 0.8, "estimated_hours": 60, "description": "Machine learning library"},
    {"id": "ai_deep_learning", "name": "Deep Learning", "name_ko": "딥러닝", "category": "cat_ai", "difficulty": 0.7, "market_demand": 0.8, "estimated_hours": 100, "description": "Neural networks, TensorFlow, PyTorch"},
    {"id": "ai_nlp", "name": "NLP", "name_ko": "자연어 처리", "category": "cat_ai", "difficulty": 0.7, "market_demand": 0.8, "estimated_hours": 80, "description": "Text processing, transformers, LLMs"},
    {"id": "ai_cv", "name": "Computer Vision", "name_ko": "컴퓨터 비전", "category": "cat_ai", "difficulty": 0.7, "market_demand": 0.7, "estimated_hours": 80, "description": "Image processing, CNNs, object detection"},
    {"id": "ai_mlops", "name": "MLOps", "name_ko": "MLOps", "category": "cat_ai", "difficulty": 0.6, "market_demand": 0.8, "estimated_hours": 60, "description": "ML model deployment, monitoring, pipelines"},

    # Mobile (4)
    {"id": "mobile_react_native", "name": "React Native", "name_ko": "리액트 네이티브", "category": "cat_mobile", "difficulty": 0.5, "market_demand": 0.75, "estimated_hours": 60, "description": "Cross-platform mobile with React"},
    {"id": "mobile_flutter", "name": "Flutter", "name_ko": "플러터", "category": "cat_mobile", "difficulty": 0.5, "market_demand": 0.7, "estimated_hours": 60, "description": "Cross-platform mobile by Google"},
    {"id": "mobile_swift", "name": "Swift/iOS", "name_ko": "Swift/iOS", "category": "cat_mobile", "difficulty": 0.5, "market_demand": 0.7, "estimated_hours": 80, "description": "Native iOS development"},
    {"id": "mobile_kotlin", "name": "Kotlin/Android", "name_ko": "Kotlin/Android", "category": "cat_mobile", "difficulty": 0.5, "market_demand": 0.7, "estimated_hours": 80, "description": "Native Android development"},

    # System Design (4)
    {"id": "sys_distributed", "name": "Distributed Systems", "name_ko": "분산 시스템", "category": "cat_system", "difficulty": 0.8, "market_demand": 0.8, "estimated_hours": 120, "description": "CAP theorem, consistency, partitioning"},
    {"id": "sys_microservices", "name": "Microservices", "name_ko": "마이크로서비스", "category": "cat_system", "difficulty": 0.7, "market_demand": 0.8, "estimated_hours": 60, "description": "Service architecture, API gateway, service mesh"},
    {"id": "sys_message_queues", "name": "Message Queues", "name_ko": "메시지 큐", "category": "cat_system", "difficulty": 0.5, "market_demand": 0.75, "estimated_hours": 30, "description": "Kafka, RabbitMQ, event-driven architecture"},
    {"id": "sys_design_patterns", "name": "System Design Patterns", "name_ko": "시스템 설계 패턴", "category": "cat_system", "difficulty": 0.7, "market_demand": 0.85, "estimated_hours": 80, "description": "Load balancing, caching, CDN, database sharding"},
]

# (from_id, to_id, strength)
prerequisites = [
    # CS foundations
    ("cs_data_structures", "cs_algorithms", 0.9),
    ("cs_data_structures", "cs_db_theory", 0.7),
    ("cs_networking", "web_http", 0.8),
    ("cs_db_theory", "be_postgresql", 0.7),
    ("cs_db_theory", "be_mongodb", 0.5),
    ("cs_design_patterns", "sys_microservices", 0.6),

    # Web flow
    ("web_html", "web_css", 0.9),
    ("web_html", "prog_javascript", 0.5),
    ("web_css", "fe_css_frameworks", 0.7),
    ("prog_javascript", "web_browser_apis", 0.7),
    ("prog_javascript", "prog_typescript", 0.9),
    ("prog_javascript", "fe_react", 0.8),
    ("prog_javascript", "be_nodejs", 0.8),
    ("prog_typescript", "fe_nextjs", 0.7),
    ("prog_typescript", "fe_react", 0.6),

    # Frontend chain
    ("fe_react", "fe_nextjs", 0.9),
    ("fe_react", "fe_state_mgmt", 0.7),
    ("fe_react", "fe_testing", 0.6),
    ("fe_react", "fe_performance", 0.5),
    ("fe_react", "mobile_react_native", 0.7),
    ("web_css", "fe_react", 0.3),  # CSS는 React의 필수 선행이 아닌 도움 수준
    ("fe_css_frameworks", "fe_react", 0.4),

    # Backend chain
    ("prog_python", "be_fastapi", 0.9),
    ("prog_python", "be_django", 0.9),
    ("prog_python", "data_pandas", 0.7),
    ("prog_python", "ai_numpy", 0.7),
    ("prog_java", "be_spring", 0.9),
    ("prog_sql", "be_postgresql", 0.8),
    ("prog_sql", "data_sql_advanced", 0.9),
    ("web_http", "be_fastapi", 0.6),
    ("web_http", "be_nodejs", 0.6),
    ("web_http", "web_security", 0.7),
    # PostgreSQL → Redis 삭제: 독립 기술, RELATED_TO로 이동
    ("web_security", "be_auth", 0.8),

    # DevOps chain
    ("devops_linux", "devops_docker", 0.6),
    ("devops_docker", "devops_k8s", 0.9),
    ("devops_docker", "devops_cicd", 0.6),
    ("devops_linux", "devops_aws", 0.5),
    ("devops_docker", "devops_aws", 0.5),

    # Data chain
    ("data_pandas", "data_visualization", 0.7),
    ("data_pandas", "data_etl", 0.6),
    ("data_statistics", "ai_sklearn", 0.8),
    ("data_statistics", "data_modeling", 0.6),
    ("data_sql_advanced", "data_etl", 0.5),
    ("data_sql_advanced", "data_modeling", 0.6),

    # AI/ML chain
    ("ai_numpy", "data_pandas", 0.6),
    ("ai_numpy", "ai_sklearn", 0.8),
    ("ai_sklearn", "ai_deep_learning", 0.8),
    ("ai_deep_learning", "ai_nlp", 0.7),
    ("ai_deep_learning", "ai_cv", 0.7),
    ("ai_deep_learning", "ai_mlops", 0.5),
    ("devops_docker", "ai_mlops", 0.6),

    # OS → 시스템 영역 (OS가 고립되어 있었음)
    ("cs_os", "devops_linux", 0.7),         # OS 이해 → 리눅스 관리
    ("cs_os", "devops_docker", 0.5),        # 프로세스/네임스페이스 → 컨테이너
    ("cs_os", "sys_distributed", 0.5),      # 프로세스/스레드 → 분산시스템

    # 알고리즘 → AI/ML (누락)
    ("cs_algorithms", "ai_sklearn", 0.6),   # 최적화 알고리즘 → ML

    # 디자인 패턴 확장 (기존 1개만 연결)
    ("cs_design_patterns", "be_spring", 0.5),  # GoF 패턴 → Spring
    ("cs_design_patterns", "be_django", 0.4),  # MVC 패턴 → Django

    # CSS → 웹 성능 (누락)
    ("web_css", "fe_performance", 0.5),     # CSS 최적화 → 웹 성능

    # DB 이론 → 데이터 사이언스 (누락)
    ("cs_db_theory", "data_sql_advanced", 0.7),  # 정규화/트랜잭션 → 고급 SQL

    # System design chain
    ("cs_networking", "sys_distributed", 0.7),
    ("be_postgresql", "sys_distributed", 0.5),
    ("sys_distributed", "sys_microservices", 0.8),
    ("sys_distributed", "sys_message_queues", 0.6),
    ("sys_microservices", "sys_design_patterns", 0.7),
    ("be_redis", "sys_design_patterns", 0.5),
    ("sys_message_queues", "sys_design_patterns", 0.5),
]

# (from_id, to_id, relation_type, strength)
related = [
    ("fe_react", "fe_vue", "alternative", 0.8),
    ("be_fastapi", "be_django", "alternative", 0.7),
    ("be_postgresql", "be_mongodb", "alternative", 0.6),
    ("mobile_react_native", "mobile_flutter", "alternative", 0.8),
    ("mobile_swift", "mobile_kotlin", "alternative", 0.7),
    ("prog_python", "prog_javascript", "complementary", 0.5),
    ("prog_go", "prog_rust", "alternative", 0.6),
    ("fe_react", "be_nodejs", "complementary", 0.6),
    ("devops_aws", "devops_k8s", "complementary", 0.7),
    ("ai_nlp", "ai_cv", "complementary", 0.5),
    ("data_pandas", "ai_numpy", "complementary", 0.8),
    ("be_auth", "web_security", "complementary", 0.8),
    ("fe_nextjs", "fe_vue", "alternative", 0.5),
    ("devops_cicd", "devops_docker", "complementary", 0.7),
    ("be_postgresql", "be_redis", "complementary", 0.5),  # DB + 캐시 보완 관계
]


# ---------------------------------------------------------------------------
# Seed logic
# ---------------------------------------------------------------------------

async def clear_data(session) -> None:
    await session.run("MATCH (n) DETACH DELETE n")
    print("Cleared existing data")


async def create_categories(session) -> None:
    for cat in categories:
        await session.run(
            "CREATE (:Category {id: $id, name: $name, name_ko: $name_ko, color: $color, icon: $icon})",
            **cat,
        )
    print(f"Created {len(categories)} categories")


async def create_skills(session) -> None:
    for skill in skills:
        await session.run(
            """
            CREATE (:Skill {
                id: $id, name: $name, name_ko: $name_ko, category: $category,
                difficulty: $difficulty, market_demand: $market_demand,
                estimated_hours: $estimated_hours, description: $description,
                source: 'core', created_at: datetime()
            })
            """,
            **skill,
        )
    print(f"Created {len(skills)} skills")


async def create_part_of_relationships(session) -> None:
    for skill in skills:
        await session.run(
            """
            MATCH (s:Skill {id: $skill_id}), (c:Category {id: $cat_id})
            CREATE (s)-[:PART_OF]->(c)
            """,
            skill_id=skill["id"],
            cat_id=skill["category"],
        )
    print(f"Created {len(skills)} PART_OF relationships")


async def create_prerequisite_relationships(session) -> None:
    for from_id, to_id, strength in prerequisites:
        await session.run(
            """
            MATCH (a:Skill {id: $from_id}), (b:Skill {id: $to_id})
            CREATE (a)-[:PREREQUISITE_OF {strength: $strength, source: 'core'}]->(b)
            """,
            from_id=from_id,
            to_id=to_id,
            strength=strength,
        )
    print(f"Created {len(prerequisites)} PREREQUISITE_OF relationships")


async def create_related_relationships(session) -> None:
    for from_id, to_id, relation_type, strength in related:
        await session.run(
            """
            MATCH (a:Skill {id: $from_id}), (b:Skill {id: $to_id})
            CREATE (a)-[:RELATED_TO {relation_type: $relation_type, strength: $strength, source: 'core'}]->(b)
            """,
            from_id=from_id,
            to_id=to_id,
            relation_type=relation_type,
            strength=strength,
        )
    print(f"Created {len(related)} RELATED_TO relationships")


async def seed() -> None:
    print(f"Connecting to Neo4j at {settings.NEO4J_URI} ...")

    confirm = input(
        "This will DELETE all existing Neo4j data. Continue? [y/N] "
    ).strip().lower()
    if confirm != "y":
        print("Aborted.")
        sys.exit(0)

    driver = AsyncGraphDatabase.driver(
        settings.NEO4J_URI,
        auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
    )

    try:
        async with driver.session() as session:
            await clear_data(session)
            await create_categories(session)
            await create_skills(session)
            await create_part_of_relationships(session)
            await create_prerequisite_relationships(session)
            await create_related_relationships(session)

        total_rels = len(skills) + len(prerequisites) + len(related)
        print(
            f"\nSeed complete! "
            f"{len(categories)} categories, {len(skills)} skills, "
            f"{total_rels} relationships."
        )
    finally:
        await driver.close()


if __name__ == "__main__":
    asyncio.run(seed())
