import asyncio
import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.config import settings

CONTENT_DATA = [
    # CS Fundamentals
    {"skill_node_id": "cs_data_structures", "title": "자료구조 기초 - freeCodeCamp", "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", "content_type": "course", "provider": "freeCodeCamp", "language": "en", "estimated_minutes": 300, "is_free": True},
    {"skill_node_id": "cs_data_structures", "title": "자료구조 강의 - CS50", "url": "https://cs50.harvard.edu/x/", "content_type": "course", "provider": "Harvard", "language": "en", "estimated_minutes": 600, "is_free": True},
    {"skill_node_id": "cs_algorithms", "title": "알고리즘 시각화 학습", "url": "https://visualgo.net/", "content_type": "tutorial", "provider": "VisuAlgo", "language": "en", "estimated_minutes": 120, "is_free": True},

    # Programming Languages
    {"skill_node_id": "prog_python", "title": "Python 공식 튜토리얼", "url": "https://docs.python.org/ko/3/tutorial/", "content_type": "documentation", "provider": "Python.org", "language": "ko", "estimated_minutes": 480, "is_free": True},
    {"skill_node_id": "prog_python", "title": "점프 투 파이썬", "url": "https://wikidocs.net/book/1", "content_type": "article", "provider": "WikiDocs", "language": "ko", "estimated_minutes": 600, "is_free": True},
    {"skill_node_id": "prog_javascript", "title": "JavaScript.info 모던 자바스크립트", "url": "https://ko.javascript.info/", "content_type": "tutorial", "provider": "javascript.info", "language": "ko", "estimated_minutes": 600, "is_free": True},
    {"skill_node_id": "prog_javascript", "title": "MDN JavaScript 가이드", "url": "https://developer.mozilla.org/ko/docs/Web/JavaScript/Guide", "content_type": "documentation", "provider": "MDN", "language": "ko", "estimated_minutes": 480, "is_free": True},
    {"skill_node_id": "prog_typescript", "title": "TypeScript 공식 핸드북", "url": "https://www.typescriptlang.org/ko/docs/handbook/", "content_type": "documentation", "provider": "TypeScript", "language": "ko", "estimated_minutes": 240, "is_free": True},
    {"skill_node_id": "prog_sql", "title": "SQLBolt 인터랙티브 학습", "url": "https://sqlbolt.com/", "content_type": "tutorial", "provider": "SQLBolt", "language": "en", "estimated_minutes": 120, "is_free": True},

    # Web Fundamentals
    {"skill_node_id": "web_html", "title": "MDN HTML 입문", "url": "https://developer.mozilla.org/ko/docs/Learn/HTML", "content_type": "documentation", "provider": "MDN", "language": "ko", "estimated_minutes": 120, "is_free": True},
    {"skill_node_id": "web_css", "title": "MDN CSS 입문", "url": "https://developer.mozilla.org/ko/docs/Learn/CSS", "content_type": "documentation", "provider": "MDN", "language": "ko", "estimated_minutes": 240, "is_free": True},
    {"skill_node_id": "web_http", "title": "HTTP 완벽 가이드 요약", "url": "https://developer.mozilla.org/ko/docs/Web/HTTP", "content_type": "documentation", "provider": "MDN", "language": "ko", "estimated_minutes": 120, "is_free": True},

    # Frontend
    {"skill_node_id": "fe_react", "title": "React 공식 튜토리얼", "url": "https://react.dev/learn", "content_type": "tutorial", "provider": "React", "language": "en", "estimated_minutes": 480, "is_free": True},
    {"skill_node_id": "fe_nextjs", "title": "Next.js Learn", "url": "https://nextjs.org/learn", "content_type": "course", "provider": "Vercel", "language": "en", "estimated_minutes": 360, "is_free": True},
    {"skill_node_id": "fe_css_frameworks", "title": "Tailwind CSS 공식 문서", "url": "https://tailwindcss.com/docs", "content_type": "documentation", "provider": "Tailwind", "language": "en", "estimated_minutes": 180, "is_free": True},

    # Backend
    {"skill_node_id": "be_fastapi", "title": "FastAPI 공식 튜토리얼", "url": "https://fastapi.tiangolo.com/ko/tutorial/", "content_type": "tutorial", "provider": "FastAPI", "language": "ko", "estimated_minutes": 300, "is_free": True},
    {"skill_node_id": "be_django", "title": "Django Girls 튜토리얼", "url": "https://tutorial.djangogirls.org/ko/", "content_type": "tutorial", "provider": "Django Girls", "language": "ko", "estimated_minutes": 480, "is_free": True},
    {"skill_node_id": "be_postgresql", "title": "PostgreSQL 튜토리얼", "url": "https://www.postgresqltutorial.com/", "content_type": "tutorial", "provider": "PostgreSQL Tutorial", "language": "en", "estimated_minutes": 300, "is_free": True},
    {"skill_node_id": "be_auth", "title": "JWT 인증 이해하기", "url": "https://jwt.io/introduction", "content_type": "article", "provider": "jwt.io", "language": "en", "estimated_minutes": 30, "is_free": True},

    # DevOps
    {"skill_node_id": "devops_git", "title": "Git 입문 - 생활코딩", "url": "https://opentutorials.org/course/3837", "content_type": "course", "provider": "생활코딩", "language": "ko", "estimated_minutes": 180, "is_free": True},
    {"skill_node_id": "devops_docker", "title": "Docker 공식 시작하기", "url": "https://docs.docker.com/get-started/", "content_type": "documentation", "provider": "Docker", "language": "en", "estimated_minutes": 180, "is_free": True},
    {"skill_node_id": "devops_cicd", "title": "GitHub Actions 가이드", "url": "https://docs.github.com/ko/actions/quickstart", "content_type": "documentation", "provider": "GitHub", "language": "ko", "estimated_minutes": 120, "is_free": True},

    # Data Science
    {"skill_node_id": "data_pandas", "title": "Pandas 공식 시작하기", "url": "https://pandas.pydata.org/docs/getting_started/", "content_type": "documentation", "provider": "Pandas", "language": "en", "estimated_minutes": 240, "is_free": True},
    {"skill_node_id": "data_statistics", "title": "Khan Academy 통계학", "url": "https://ko.khanacademy.org/math/statistics-probability", "content_type": "course", "provider": "Khan Academy", "language": "ko", "estimated_minutes": 600, "is_free": True},

    # AI/ML
    {"skill_node_id": "ai_sklearn", "title": "Scikit-learn 튜토리얼", "url": "https://scikit-learn.org/stable/tutorial/", "content_type": "tutorial", "provider": "scikit-learn", "language": "en", "estimated_minutes": 300, "is_free": True},
    {"skill_node_id": "ai_deep_learning", "title": "fast.ai 딥러닝 코스", "url": "https://course.fast.ai/", "content_type": "course", "provider": "fast.ai", "language": "en", "estimated_minutes": 1200, "is_free": True},
    {"skill_node_id": "ai_numpy", "title": "NumPy 기초 튜토리얼", "url": "https://numpy.org/doc/stable/user/absolute_beginners.html", "content_type": "documentation", "provider": "NumPy", "language": "en", "estimated_minutes": 120, "is_free": True},

    # System Design
    {"skill_node_id": "sys_design_patterns", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer", "content_type": "article", "provider": "GitHub", "language": "en", "estimated_minutes": 600, "is_free": True},
    {"skill_node_id": "sys_distributed", "title": "분산 시스템 패턴", "url": "https://martinfowler.com/articles/patterns-of-distributed-systems/", "content_type": "article", "provider": "Martin Fowler", "language": "en", "estimated_minutes": 300, "is_free": True},

    # --- 누락 스킬 컨텐츠 보강 (market_demand >= 0.7 우선) ---

    # Java
    {"skill_node_id": "prog_java", "title": "Oracle Java 튜토리얼", "url": "https://docs.oracle.com/javase/tutorial/", "content_type": "documentation", "provider": "Oracle", "language": "en", "estimated_minutes": 600, "is_free": True},
    {"skill_node_id": "prog_java", "title": "생활코딩 Java", "url": "https://opentutorials.org/course/1223", "content_type": "course", "provider": "생활코딩", "language": "ko", "estimated_minutes": 360, "is_free": True},

    # Go
    {"skill_node_id": "prog_go", "title": "A Tour of Go", "url": "https://go.dev/tour/", "content_type": "tutorial", "provider": "Go", "language": "en", "estimated_minutes": 120, "is_free": True},
    {"skill_node_id": "prog_go", "title": "Go by Example", "url": "https://gobyexample.com/", "content_type": "tutorial", "provider": "Go by Example", "language": "en", "estimated_minutes": 180, "is_free": True},

    # Rust
    {"skill_node_id": "prog_rust", "title": "The Rust Programming Language (공식 교재)", "url": "https://doc.rust-lang.org/book/", "content_type": "documentation", "provider": "Rust", "language": "en", "estimated_minutes": 720, "is_free": True},

    # Node.js
    {"skill_node_id": "be_nodejs", "title": "Node.js 공식 가이드", "url": "https://nodejs.org/ko/learn/getting-started/introduction-to-nodejs", "content_type": "documentation", "provider": "Node.js", "language": "ko", "estimated_minutes": 240, "is_free": True},
    {"skill_node_id": "be_nodejs", "title": "생활코딩 Node.js", "url": "https://opentutorials.org/course/3332", "content_type": "course", "provider": "생활코딩", "language": "ko", "estimated_minutes": 300, "is_free": True},

    # Spring Boot
    {"skill_node_id": "be_spring", "title": "Spring Boot 공식 가이드", "url": "https://spring.io/guides", "content_type": "documentation", "provider": "Spring", "language": "en", "estimated_minutes": 480, "is_free": True},
    {"skill_node_id": "be_spring", "title": "Baeldung Spring Boot 튜토리얼", "url": "https://www.baeldung.com/spring-boot", "content_type": "tutorial", "provider": "Baeldung", "language": "en", "estimated_minutes": 360, "is_free": True},

    # MongoDB
    {"skill_node_id": "be_mongodb", "title": "MongoDB University", "url": "https://learn.mongodb.com/", "content_type": "course", "provider": "MongoDB", "language": "en", "estimated_minutes": 360, "is_free": True},

    # Vue.js
    {"skill_node_id": "fe_vue", "title": "Vue.js 공식 튜토리얼", "url": "https://vuejs.org/tutorial/", "content_type": "tutorial", "provider": "Vue.js", "language": "en", "estimated_minutes": 240, "is_free": True},

    # React (기존 1개 → 추가)
    {"skill_node_id": "fe_react", "title": "벨로퍼트와 함께하는 모던 리액트", "url": "https://react.vlpt.us/", "content_type": "tutorial", "provider": "벨로퍼트", "language": "ko", "estimated_minutes": 480, "is_free": True},

    # AWS
    {"skill_node_id": "devops_aws", "title": "AWS Skill Builder 무료 교육", "url": "https://explore.skillbuilder.aws/learn", "content_type": "course", "provider": "AWS", "language": "en", "estimated_minutes": 600, "is_free": True},
    {"skill_node_id": "devops_aws", "title": "AWS 공식 시작하기", "url": "https://aws.amazon.com/ko/getting-started/", "content_type": "documentation", "provider": "AWS", "language": "ko", "estimated_minutes": 240, "is_free": True},

    # Kubernetes
    {"skill_node_id": "devops_k8s", "title": "Kubernetes 공식 튜토리얼", "url": "https://kubernetes.io/ko/docs/tutorials/", "content_type": "tutorial", "provider": "Kubernetes", "language": "ko", "estimated_minutes": 360, "is_free": True},
    {"skill_node_id": "devops_k8s", "title": "쿠버네티스 안내서", "url": "https://subicura.com/k8s/", "content_type": "tutorial", "provider": "subicura", "language": "ko", "estimated_minutes": 300, "is_free": True},

    # Linux
    {"skill_node_id": "devops_linux", "title": "Linux Journey", "url": "https://linuxjourney.com/", "content_type": "tutorial", "provider": "Linux Journey", "language": "en", "estimated_minutes": 300, "is_free": True},
    {"skill_node_id": "devops_linux", "title": "생활코딩 리눅스", "url": "https://opentutorials.org/course/2598", "content_type": "course", "provider": "생활코딩", "language": "ko", "estimated_minutes": 180, "is_free": True},

    # Operating Systems
    {"skill_node_id": "cs_os", "title": "OSTEP (무료 OS 교재)", "url": "https://pages.cs.wisc.edu/~remzi/OSTEP/", "content_type": "article", "provider": "University of Wisconsin", "language": "en", "estimated_minutes": 600, "is_free": True},

    # Networking
    {"skill_node_id": "cs_networking", "title": "널널한 개발자 네트워크 기초", "url": "https://www.youtube.com/playlist?list=PLXvgR_grOs1BFH-TuqFsfHqbh-gpMbFoy", "content_type": "course", "provider": "널널한 개발자", "language": "ko", "estimated_minutes": 360, "is_free": True},

    # Design Patterns
    {"skill_node_id": "cs_design_patterns", "title": "Refactoring Guru 디자인 패턴", "url": "https://refactoring.guru/design-patterns", "content_type": "tutorial", "provider": "Refactoring Guru", "language": "en", "estimated_minutes": 300, "is_free": True},

    # Algorithms (기존 1개 → 추가)
    {"skill_node_id": "cs_algorithms", "title": "프로그래머스 코딩테스트", "url": "https://programmers.co.kr/learn/challenges", "content_type": "tutorial", "provider": "프로그래머스", "language": "ko", "estimated_minutes": 600, "is_free": True},
    {"skill_node_id": "cs_algorithms", "title": "백준 온라인 저지", "url": "https://www.acmicpc.net/", "content_type": "tutorial", "provider": "백준", "language": "ko", "estimated_minutes": 600, "is_free": True},
]


async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Clear existing content
        await session.execute(text("DELETE FROM content"))
        await session.commit()
        print("Cleared existing content")

        # Insert seed content
        for item in CONTENT_DATA:
            await session.execute(
                text("""
                    INSERT INTO content (id, skill_node_id, title, url, content_type, provider, language, estimated_minutes, is_free, description, difficulty)
                    VALUES (:id, :skill_node_id, :title, :url, :content_type, :provider, :language, :estimated_minutes, :is_free, '', 0.5)
                """),
                {
                    "id": str(uuid.uuid4()),
                    **item,
                },
            )
        await session.commit()
        print(f"Seeded {len(CONTENT_DATA)} content entries")

    await engine.dispose()
    print("Seed content complete!")


if __name__ == "__main__":
    asyncio.run(seed())
