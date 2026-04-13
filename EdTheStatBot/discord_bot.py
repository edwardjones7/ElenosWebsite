import asyncio
import os
import sys

import discord
from dotenv import load_dotenv

from rag import answer_question


load_dotenv()

BOT_PREFIX = os.getenv("BOT_PREFIX", "!cfb").strip()
TOKEN = os.getenv("DISCORD_BOT_TOKEN", "").strip()

if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


intents = discord.Intents.default()
intents.message_content = True


class CfbBot(discord.Client):
    async def on_ready(self) -> None:
        print(f"Logged in as {self.user}")
        print(f"Listening for prefix: {BOT_PREFIX}")

    async def on_message(self, message: discord.Message) -> None:
        if message.author.bot:
            return
        if not message.content.startswith(BOT_PREFIX):
            return

        question = message.content[len(BOT_PREFIX) :].strip()
        if not question:
            await message.channel.send("Ask a question after the prefix.")
            return

        await message.channel.typing()
        loop = asyncio.get_running_loop()
        try:
            answer = await loop.run_in_executor(None, answer_question, question)
        except FileNotFoundError as exc:
            await message.channel.send(str(exc))
            return
        await message.channel.send(answer)


def main() -> None:
    if not TOKEN:
        raise ValueError("Missing DISCORD_BOT_TOKEN env var.")
    client = CfbBot(intents=intents)
    client.run(TOKEN)


if __name__ == "__main__":
    main()
