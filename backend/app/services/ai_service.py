import json
import logging
from typing import Optional, Type
import asyncio

from openai import AsyncOpenAI, RateLimitError, APITimeoutError, APIError
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    """Raised when all AI attempts fail."""
    pass


class AIService:
    """Shared OpenAI client wrapper with retry, fallback, and token tracking."""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.primary_model = "gpt-4o-mini"
        self.fallback_model = "gpt-4o"
        self.total_tokens_used = 0

    async def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4000,
        response_format: Optional[dict] = None,
    ) -> dict | str:
        """
        Call OpenAI with retry and fallback logic.

        1. Try primary model (gpt-4o-mini)
        2. On failure -> retry once
        3. On second failure -> fallback to gpt-4o
        4. On total failure -> raise AIServiceError
        """
        target_model = model or self.primary_model

        # Attempt 1: Primary model
        try:
            return await self._call(target_model, system_prompt, user_prompt, temperature, max_tokens, response_format)
        except (RateLimitError, APITimeoutError) as e:
            logger.warning(f"Primary model attempt 1 failed: {e}")

        # Attempt 2: Retry primary model with backoff
        try:
            await asyncio.sleep(1)
            return await self._call(target_model, system_prompt, user_prompt, temperature, max_tokens, response_format)
        except (RateLimitError, APITimeoutError, APIError) as e:
            logger.warning(f"Primary model attempt 2 failed: {e}")

        # Attempt 3: Fallback model
        if target_model != self.fallback_model:
            try:
                logger.info(f"Falling back to {self.fallback_model}")
                await asyncio.sleep(2)
                return await self._call(self.fallback_model, system_prompt, user_prompt, temperature, max_tokens, response_format)
            except Exception as e:
                logger.error(f"Fallback model failed: {e}")
                raise AIServiceError(f"All AI attempts failed. Last error: {e}")

        raise AIServiceError("All AI attempts exhausted")

    async def _call(
        self,
        model: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
        response_format: Optional[dict],
    ) -> dict | str:
        """Make a single OpenAI API call."""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        kwargs = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "timeout": 30.0,
        }

        if response_format:
            kwargs["response_format"] = response_format

        response = await self.client.chat.completions.create(**kwargs)

        # Track token usage
        if response.usage:
            self.total_tokens_used += response.usage.total_tokens
            logger.info(
                f"Tokens used: {response.usage.total_tokens} "
                f"(prompt: {response.usage.prompt_tokens}, "
                f"completion: {response.usage.completion_tokens})"
            )

        content = response.choices[0].message.content

        # Parse JSON if response_format was JSON
        if response_format and response_format.get("type") == "json_object":
            try:
                return json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}")
                raise AIServiceError(f"Invalid JSON response from AI: {e}")

        return content

    async def complete_batch(
        self,
        prompts: list[tuple[str, str]],  # list of (system_prompt, user_prompt)
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        response_format: Optional[dict] = None,
        concurrency: int = 5,
    ) -> list[dict | str]:
        """
        Execute multiple prompts in parallel with concurrency limit.
        Returns results in the same order as input prompts.
        """
        semaphore = asyncio.Semaphore(concurrency)

        async def limited_complete(system_prompt: str, user_prompt: str):
            async with semaphore:
                return await self.complete(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    model=model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    response_format=response_format,
                )

        tasks = [limited_complete(sp, up) for sp, up in prompts]
        return await asyncio.gather(*tasks, return_exceptions=True)

    async def complete_json(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4000,
    ) -> dict:
        """Convenience method for JSON responses."""
        result = await self.complete(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )
        if isinstance(result, str):
            return json.loads(result)
        return result
