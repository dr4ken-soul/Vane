"""One-line smoke test for the Edge neural TTS pipeline."""
import asyncio
import traceback
from pathlib import Path

import edge_tts

TEXT = "Vane verifies carbon by physics, not trust."
OUT = Path(__file__).resolve().parent / "assets" / "vo-test.mp3"


async def synth() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(TEXT, "en-GB-RyanNeural", rate="+2%", volume="+0%")
    try:
        await communicate.save(str(OUT))
    except Exception:
        traceback.print_exc()
        raise
    print("written", OUT, OUT.stat().st_size)


asyncio.run(synth())
