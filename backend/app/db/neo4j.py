from collections.abc import AsyncGenerator

from neo4j import AsyncDriver, AsyncGraphDatabase

from app.config import settings


class Neo4jDatabase:
    def __init__(self) -> None:
        self._driver: AsyncDriver | None = None

    async def connect(self) -> None:
        self._driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
        )
        await self._driver.verify_connectivity()

    async def disconnect(self) -> None:
        if self._driver is not None:
            await self._driver.close()
            self._driver = None

neo4j_db = Neo4jDatabase()


async def get_neo4j() -> AsyncGenerator[AsyncDriver, None]:
    if neo4j_db._driver is None:
        raise RuntimeError("Neo4j driver is not connected")
    yield neo4j_db._driver
