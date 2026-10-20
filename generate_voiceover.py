import json
import os
import struct
import subprocess
import wave

WORKSPACE_DIR = "/Users/nattestad/workspaces/motionGraphicHIC"
ASSETS_DIR = os.path.join(WORKSPACE_DIR, "assets")
SIRI_CLI = os.path.join(WORKSPACE_DIR, "siri_neural_tts")
os.makedirs(ASSETS_DIR, exist_ok=True)

SCENES = [
    {
        "id": 1,
        "start": 0.12,
        "window_end": 5.05,
        "title": "01 / THE OLD DILEMMA",
        "speech": (
            "Web creators always had to choose: rich CSS, or raw Canvas power."
        ),
        "caption": (
            "Web creators always had to choose: rich CSS, or raw Canvas power."
        ),
    },
    {
        "id": 2,
        "start": 5.12,
        "window_end": 10.45,
        "title": "02 / ENTER HTML-IN-CANVAS",
        "speech": (
            "Meet HTML in Canvas. One attribute unlocks live DOM inside your"
            " canvas."
        ),
        "caption": (
            "Meet HTML-in-Canvas. One attribute—layoutsubtree—unlocks live DOM"
            " inside your canvas."
        ),
    },
    {
        "id": 3,
        "start": 10.50,
        "window_end": 15.75,
        "title": "03 / 3D & PIXEL SHADERS",
        "speech": (
            "Bend Flexbox cards in 3D, run shaders, and burst text into"
            " particles."
        ),
        "caption": (
            "Bend Flexbox cards in 3D, run shaders, and burst text into"
            " particles."
        ),
    },
    {
        "id": 4,
        "start": 15.82,
        "window_end": 20.25,
        "title": "04 / ACCESSIBLE, SELECTABLE & INTERACTIVE",
        "speech": (
            "Content stays accessible to screen readers, selectable, and"
            " interactive."
        ),
        "caption": (
            "Content stays accessible to screen readers, selectable, and"
            " interactive."
        ),
    },
    {
        "id": 5,
        "start": 20.30,
        "window_end": 25.20,
        "title": "05 / DYNAMIC & REACTIVE",
        "speech": (
            "Everything stays live. Tweak text size, headlines, or themes on"
            " the fly."
        ),
        "caption": (
            "Everything stays live. Tweak text size, headlines, or themes on"
            " the fly."
        ),
    },
    {
        "id": 6,
        "start": 25.22,
        "window_end": 30.00,
        "title": "06 / CAPTURE IN ONE CLICK",
        "speech": (
            "HTML in Canvas. Design with the DOM, and capture video in one"
            " click."
        ),
        "caption": (
            "HTML-in-Canvas. Design with the DOM, and capture video in one"
            " click."
        ),
    },
]

SAMPLE_RATE = 48000
TOTAL_DURATION = 30.0
total_samples = int(SAMPLE_RATE * TOTAL_DURATION)
master_pcm = [0.0] * total_samples


def trim_silence(samples, threshold=220, pad_samples=1200):
  if not samples:
    return samples
  first = 0
  last = len(samples) - 1
  while first < last and abs(samples[first]) < threshold:
    first += 1
  while last > first and abs(samples[last]) < threshold:
    last -= 1
  first = max(0, first - pad_samples)
  last = min(len(samples), last + pad_samples)
  return samples[first:last]


timing_report = []

for s in SCENES:
  scene_id = s["id"]
  pcm_path = os.path.join(ASSETS_DIR, f"scene_{scene_id}.pcm")
  wav_path = os.path.join(ASSETS_DIR, f"scene_{scene_id}.wav")

  subprocess.run([SIRI_CLI, s["speech"], pcm_path], check=True)

  with open(pcm_path, "rb") as pf:
    raw = pf.read()
  os.remove(pcm_path)

  n_frames = len(raw) // 2
  raw_samples = list(struct.unpack(f"<{n_frames}h", raw[: n_frames * 2]))
  samples = trim_silence(raw_samples)

  with wave.open(wav_path, "wb") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(SAMPLE_RATE)
    wf.writeframes(struct.pack(f"<{len(samples)}h", *samples))

  dur = len(samples) / SAMPLE_RATE
  start_idx = int(s["start"] * SAMPLE_RATE)

  fade_len = int(0.015 * SAMPLE_RATE)
  for i, val in enumerate(samples):
    if start_idx + i < total_samples:
      env = 1.0
      if i < fade_len:
        env = i / fade_len
      elif i > len(samples) - fade_len:
        env = (len(samples) - i) / fade_len
      master_pcm[start_idx + i] += (val / 32768.0) * env

  s["duration"] = round(dur, 3)
  s["end"] = round(s["start"] + dur, 3)
  gap = round(s["window_end"] - s["end"], 3)
  timing_report.append(s)
  print(
      f"Scene {scene_id} (Siri Neural 48kHz): start={s['start']:.2f}s,"
      f" dur={dur:.2f}s, end={s['end']:.2f}s, window_end={s['window_end']:.2f}s"
      f" (gap={gap:+.2f}s)"
  )

master_wav = os.path.join(ASSETS_DIR, "voiceover.wav")
with wave.open(master_wav, "wb") as wf:
  wf.setnchannels(1)
  wf.setsampwidth(2)
  wf.setframerate(SAMPLE_RATE)
  clamped = [max(-32767, min(32767, int(x * 31500))) for x in master_pcm]
  wf.writeframes(struct.pack(f"<{len(clamped)}h", *clamped))

with open(os.path.join(ASSETS_DIR, "timings.json"), "w", encoding="utf-8") as f:
  json.dump(timing_report, f, indent=2)

print("48kHz Siri Neural voiceover.wav and timings.json written successfully!")
