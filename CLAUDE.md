# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

Open `index.html` directly in a browser — no build step, server, or dependencies required.

## Architecture

Single-file app (`index.html`, ~1337 lines) with three sections:

- **CSS** (lines 9–775): CSS variables for the dark theme (green `#00ff88`, purple `#7b61ff`, red `#ff6b6b`), component styles, color-coded character display, animations, and responsive breakpoint at 500px.
- **HTML** (lines 776–1023): Two-tab layout — "생성" (generator) and "강도 체크" (strength checker).
- **JavaScript** (lines 1024–1335): All logic inline, no modules.

## Key Design Decisions

**Cryptographic randomness**: Password generation uses `crypto.getRandomValues()` + Fisher-Yates shuffle, not `Math.random()`. Keep this intact.

**Strength scoring**: The checker evaluates 8 criteria (length, character variety, no repeated runs, no sequential patterns like `abc`/`qwerty`/`123`, not in a 45-entry common-password list) and computes entropy as `length × log₂(charPoolSize)`.

**Privacy**: All processing is client-side. No network requests are made.

**Language**: UI text is in Korean. Keep new UI strings consistent with the existing Korean labels.
