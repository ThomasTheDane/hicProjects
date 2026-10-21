/**
 * HTML-in-Canvas 30-Second Interactive Motion Graphics Ad & Video Capture Studio
 * Strictly adheres to secure DOM manipulation (textContent only, no innerHTML)
 * and deterministic timeline-driven 60fps rendering.
 */
(function () {
  'use strict';

  const DESIGN_W = 1920;
  const DESIGN_H = 1080;
  const TOTAL_DURATION = 30.0;

  // Allow-listed color themes (Cyber Neon, Vox Editorial, Emerald Matrix, Solar Flare)
  const THEMES = {
    cyber: {
      name: 'Cyber Neon',
      bgTop: '#060b18',
      bgBottom: '#02040a',
      gridColor: 'rgba(56, 189, 248, 0.08)',
      primary: '#38bdf8',
      secondary: '#818cf8',
      tertiary: '#f43f5e',
      accent: '#10b981',
      cardBg: 'rgba(15, 23, 42, 0.88)',
      cardBorder: 'rgba(56, 189, 248, 0.52)',
      textMain: '#f8fafc',
      textMuted: '#94a3b8',
      isLight: false
    },
    editorial: {
      name: 'Vox Editorial',
      bgTop: '#f5f0e6',
      bgBottom: '#ebe3d2',
      gridColor: 'rgba(44, 42, 40, 0.08)',
      primary: '#e85a4f',
      secondary: '#4a8fe7',
      tertiary: '#d97706',
      accent: '#2a9d8f',
      cardBg: 'rgba(255, 252, 245, 0.94)',
      cardBorder: 'rgba(44, 42, 40, 0.28)',
      textMain: '#242220',
      textMuted: '#6a655d',
      isLight: true
    },
    emerald: {
      name: 'Emerald Matrix',
      bgTop: '#041410',
      bgBottom: '#020806',
      gridColor: 'rgba(16, 185, 129, 0.09)',
      primary: '#10b981',
      secondary: '#06b6d4',
      tertiary: '#a855f7',
      accent: '#34d399',
      cardBg: 'rgba(6, 28, 22, 0.88)',
      cardBorder: 'rgba(16, 185, 129, 0.5)',
      textMain: '#ecfdf5',
      textMuted: '#6ee7b7',
      isLight: false
    },
    solar: {
      name: 'Solar Flare',
      bgTop: '#180814',
      bgBottom: '#090308',
      gridColor: 'rgba(245, 158, 11, 0.08)',
      primary: '#f59e0b',
      secondary: '#ec4899',
      tertiary: '#38bdf8',
      accent: '#fbbf24',
      cardBg: 'rgba(32, 12, 26, 0.88)',
      cardBorder: 'rgba(245, 158, 11, 0.52)',
      textMain: '#fffbeb',
      textMuted: '#fda4af',
      isLight: false
    }
  };

  // Exact scene windows & voiceover script metadata (Siri Neural 48kHz)
  const SCENES = [
    {
      id: 1,
      start: 0.0,
      end: 5.05,
      tag: '01 / THE OLD DILEMMA (0:00 - 0:05)',
      caption: 'Web creators always had to choose: rich CSS, or raw Canvas power.'
    },
    {
      id: 2,
      start: 5.05,
      end: 10.45,
      tag: '02 / ENTER HTML-IN-CANVAS (0:05 - 0:10)',
      caption: 'Meet HTML-in-Canvas. One attribute—layoutsubtree—unlocks live DOM inside your canvas.'
    },
    {
      id: 3,
      start: 10.45,
      end: 15.75,
      tag: '03 / 3D & PIXEL SHADERS (0:10 - 0:15)',
      caption: 'Bend Flexbox cards in 3D, run shaders, and burst text into particles.'
    },
    {
      id: 4,
      start: 15.75,
      end: 20.25,
      tag: '04 / ACCESSIBLE, SELECTABLE & INTERACTIVE (0:15 - 0:20)',
      caption: 'Content stays accessible to screen readers, selectable, and interactive.'
    },
    {
      id: 5,
      start: 20.25,
      end: 25.20,
      tag: '05 / DYNAMIC & REACTIVE (0:20 - 0:25)',
      caption: 'Everything stays live. Tweak text size, headlines, or themes on the fly.'
    },
    {
      id: 6,
      start: 25.20,
      end: 30.0,
      tag: '06 / CAPTURE IN ONE CLICK (0:25 - 0:30)',
      caption: 'HTML-in-Canvas. Design with the DOM, and capture video in one click.'
    }
  ];

  // Live user-configurable state (validated & clamped)
  const state = {
    textScale: 1.0,
    customHeadline: 'Design with CSS. Render with Shaders.',
    fxIntensity: 1.0,
    captureDuration: 30,
    themeKey: 'editorial',
    isPlaying: false,
    isMuted: false,
    isRecording: false,
    isInstantRendering: false,
    currentTime: 0.0,
    lastFramePerf: 0,
    nativeHicSupported: false
  };

  // DOM References
  const canvas = document.getElementById('ad-canvas');
  const mainCtx = canvas.getContext('2d');
  let ctx = mainCtx;
  const hicHeroCard = document.getElementById('hic-hero-card');
  const hicCardHeading = document.getElementById('hic-card-heading');

  const apiStatusDot = document.getElementById('api-status-dot');
  const apiModeText = document.getElementById('api-mode-text');
  const btnPlayPause = document.getElementById('btn-play-pause');
  const playIcon = document.getElementById('play-icon');
  const playLabel = document.getElementById('play-label');
  const btnRestart = document.getElementById('btn-restart');
  const btnMute = document.getElementById('btn-mute');
  const btnCapture = document.getElementById('btn-capture');
  const btnInstantCapture = document.getElementById('btn-instant-capture');
  const timeReadout = document.getElementById('time-readout');
  const scrubber = document.getElementById('timeline-scrubber');
  const scenePillsContainer = document.getElementById('scene-pills-container');

  const inputTextScale = document.getElementById('input-text-scale');
  const badgeTextScale = document.getElementById('badge-text-scale');
  const inputCustomHeadline = document.getElementById('input-custom-headline');
  const inputFxIntensity = document.getElementById('input-fx-intensity');
  const badgeFxIntensity = document.getElementById('badge-fx-intensity');
  const inputCaptureDuration = document.getElementById('input-capture-duration');
  const badgeCaptureDuration = document.getElementById('badge-capture-duration');
  const themeGrid = document.getElementById('theme-grid');
  const badgeThemeName = document.getElementById('badge-theme-name');

  const scriptSceneTag = document.getElementById('script-scene-tag');
  const scriptCaptionText = document.getElementById('script-caption-text');
  const statusToast = document.getElementById('status-toast');
  const statusToastText = document.getElementById('status-toast-text');

  // Offscreen buffer for scanline chromatic shader / 3D card slicing
  const cardBuffer = document.createElement('canvas');
  cardBuffer.width = 920;
  cardBuffer.height = 500;
  const cardCtx = cardBuffer.getContext('2d');

  // Deterministic Particle Pool (180 particles)
  const PARTICLES = Array.from({ length: 180 }, (_, i) => ({
    seed: i * 1.371,
    radius: 2.0 + (i % 5) * 1.1,
    orbitRadius: 160 + (i * 19) % 680,
    speed: 0.4 + (i % 7) * 0.14,
    colorIndex: i % 3
  }));

  // Web Audio & Voiceover State
  let audioCtx = null;
  let voiceoverBuffer = null;
  let activeVoiceSource = null;
  let masterGainNode = null;
  let streamDestNode = null;
  let lastTriggeredSceneId = 0;

  // MediaRecorder State
  let mediaRecorder = null;
  let recordedChunks = [];

  // ── Utility & Mathematical Easing Helpers ──────────────────────────
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function lerp(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
  }

  function progressInWindow(t, start, end) {
    if (end <= start) return 0;
    return clamp((t - start) / (end - start), 0, 1);
  }

  function easeOutCubic(x) {
    const c = clamp(x, 0, 1);
    return 1 - Math.pow(1 - c, 3);
  }

  function easeInOutCubic(x) {
    const c = clamp(x, 0, 1);
    return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
  }

  // Analytical damped harmonic spring solver (0 -> 1 with natural overshoot)
  function spring(elapsedSec, opts) {
    if (elapsedSec <= 0) return 0;
    const stiffness = (opts && opts.stiffness) || 180;
    const damping = (opts && opts.damping) || 15;
    const mass = (opts && opts.mass) || 1;
    const omega0 = Math.sqrt(stiffness / mass);
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));
    if (zeta < 1) {
      const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
      const env = Math.exp(-zeta * omega0 * elapsedSec);
      return 1 - env * (Math.cos(omegaD * elapsedSec) + ((zeta * omega0) / omegaD) * Math.sin(omegaD * elapsedSec));
    }
    return 1 - (1 + omega0 * elapsedSec) * Math.exp(-omega0 * elapsedSec);
  }

  function showToast(msg, isWarn) {
    statusToastText.textContent = String(msg);
    statusToast.classList.add('visible');
    if (isWarn) {
      statusToast.classList.add('warn');
    } else {
      statusToast.classList.remove('warn');
    }
  }

  // ── HTML-in-Canvas Feature Detection & Paint Binding ───────────────
  function detectHtmlInCanvas() {
    const hasDrawElement = typeof ctx.drawElementImage === 'function';
    state.nativeHicSupported = hasDrawElement;
    if (hasDrawElement) {
      apiModeText.textContent = 'Native HTML-in-Canvas (drawElementImage) Active';
      canvas.onpaint = function () {
        renderFrame(state.currentTime);
      };
    } else {
      apiModeText.textContent = 'HTML-in-Canvas Studio (layoutsubtree + 60fps Sync)';
    }
  }

  function syncDomSubtreeCard() {
    const theme = THEMES[state.themeKey] || THEMES.editorial;
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--text-scale', String(state.textScale));
    rootStyle.setProperty('--hic-card-bg', theme.cardBg);
    rootStyle.setProperty('--hic-card-border', theme.cardBorder);
    rootStyle.setProperty('--hic-text-main', theme.textMain);
    rootStyle.setProperty('--hic-text-muted', theme.textMuted);
    rootStyle.setProperty('--hic-primary', theme.primary);
    rootStyle.setProperty(
      '--hic-badge-bg',
      theme.isLight ? 'rgba(232, 90, 79, 0.14)' : 'rgba(56, 189, 248, 0.2)'
    );
    hicCardHeading.textContent = state.customHeadline;
    if (typeof canvas.requestPaint === 'function') {
      canvas.requestPaint();
    }
  }

  // ── Web Audio API Engine (Voiceover WAV + Procedural Musical SFX) ──
  async function ensureAudioInitialized() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
      masterGainNode = audioCtx.createGain();
      masterGainNode.gain.value = state.isMuted ? 0 : 1;
      masterGainNode.connect(audioCtx.destination);
      streamDestNode = audioCtx.createMediaStreamDestination();
      masterGainNode.connect(streamDestNode);
    }
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    if (!voiceoverBuffer) {
      try {
        if (typeof window.__VOICEOVER_WAV_B64__ === 'string' && window.__VOICEOVER_WAV_B64__.length > 0) {
          const binStr = atob(window.__VOICEOVER_WAV_B64__);
          const len = binStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binStr.charCodeAt(i);
          }
          voiceoverBuffer = await audioCtx.decodeAudioData(bytes.buffer);
        } else {
          const resp = await fetch('assets/voiceover.wav');
          if (resp.ok) {
            const arrayBuf = await resp.arrayBuffer();
            voiceoverBuffer = await audioCtx.decodeAudioData(arrayBuf);
          }
        }
      } catch (_err) {
        // Fallback if audio file is unavailable: procedural synth SFX still works
      }
    }
  }

  function stopVoiceoverPlayback() {
    if (activeVoiceSource) {
      try {
        activeVoiceSource.stop();
        activeVoiceSource.disconnect();
      } catch (_e) {
        // Ignore if already stopped
      }
      activeVoiceSource = null;
    }
  }

  function startVoiceoverAt(offsetSec) {
    stopVoiceoverPlayback();
    if (!audioCtx || !voiceoverBuffer) return;
    const clampedOffset = clamp(offsetSec, 0, Math.max(0, voiceoverBuffer.duration - 0.05));
    const src = audioCtx.createBufferSource();
    src.buffer = voiceoverBuffer;
    src.connect(masterGainNode);
    src.start(0, clampedOffset);
    activeVoiceSource = src;
  }

  // Synthesize subtle musical transition chimes & tactile clicks in Web Audio
  function playSceneTransitionSfx(sceneId) {
    if (!audioCtx || state.isMuted) return;
    const now = audioCtx.currentTime;

    // Soft harmonic synth chime per scene
    const freqs = [220, 277.18, 329.63, 392.0, 440.0, 523.25];
    const baseFreq = freqs[(sceneId - 1) % freqs.length];

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq * 0.5, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.18);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.65);

    osc.connect(gain);
    gain.connect(masterGainNode);
    osc.start(now);
    osc.stop(now + 0.68);
  }

  // ── Canvas Drawing Primitives ──────────────────────────────────────
  function drawRoundedRect(context, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + w, y, x + w, y + h, radius);
    context.arcTo(x + w, y + h, x, y + h, radius);
    context.arcTo(x, y + h, x, y, radius);
    context.arcTo(x, y, x + w, y, radius);
    context.closePath();
  }

  function drawBackgroundAndGrid(t, theme) {
    // 1. Gradient backdrop
    const grad = ctx.createLinearGradient(0, 0, DESIGN_W, DESIGN_H);
    grad.addColorStop(0, theme.bgTop);
    grad.addColorStop(1, theme.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

    // 2. Ambient radial glow orbs
    const orb1X = DESIGN_W * (0.28 + Math.sin(t * 0.5) * 0.08);
    const orb1Y = DESIGN_H * (0.32 + Math.cos(t * 0.4) * 0.06);
    const rad1 = ctx.createRadialGradient(orb1X, orb1Y, 10, orb1X, orb1Y, 560);
    rad1.addColorStop(0, theme.isLight ? 'rgba(232, 90, 79, 0.12)' : 'rgba(56, 189, 248, 0.13)');
    rad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rad1;
    ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

    const orb2X = DESIGN_W * (0.74 + Math.cos(t * 0.45) * 0.07);
    const orb2Y = DESIGN_H * (0.68 + Math.sin(t * 0.55) * 0.06);
    const rad2 = ctx.createRadialGradient(orb2X, orb2Y, 10, orb2X, orb2Y, 520);
    rad2.addColorStop(0, theme.isLight ? 'rgba(74, 143, 231, 0.10)' : 'rgba(129, 140, 248, 0.12)');
    rad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rad2;
    ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

    // 3. Animated coordinate grid
    ctx.save();
    ctx.strokeStyle = theme.gridColor;
    ctx.lineWidth = 1.5;
    const gridSpacing = 80;
    const offset = (t * 24) % gridSpacing;
    for (let x = -gridSpacing + offset; x < DESIGN_W; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, DESIGN_H);
      ctx.stroke();
    }
    for (let y = -gridSpacing + offset * 0.5; y < DESIGN_H; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(DESIGN_W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Render the live DOM Hero Card into offscreen buffer (using native drawElementImage when available)
  function renderLiveHeroCardToBuffer(t, theme) {
    const w = cardBuffer.width;
    const h = cardBuffer.height;
    cardCtx.clearRect(0, 0, w, h);

    if (state.nativeHicSupported && hicHeroCard) {
      try {
        cardCtx.drawElementImage(hicHeroCard, 20, 20, w - 40, h - 40);
        return;
      } catch (_e) {
        // Fallback to high-DPI synchronized canvas card render
      }
    }

    const scale = state.textScale;
    cardCtx.save();

    // Card body with glowing border
    drawRoundedRect(cardCtx, 24, 24, w - 48, h - 48, 28);
    cardCtx.fillStyle = theme.cardBg;
    cardCtx.fill();
    cardCtx.lineWidth = 3;
    cardCtx.strokeStyle = theme.cardBorder;
    cardCtx.stroke();

    // Top inner highlight
    drawRoundedRect(cardCtx, 48, 52, 390 * clamp(scale, 0.85, 1.2), 42 * clamp(scale, 0.9, 1.15), 21);
    cardCtx.fillStyle = theme.isLight ? 'rgba(232, 90, 79, 0.14)' : 'rgba(56, 189, 248, 0.18)';
    cardCtx.fill();

    cardCtx.font = `700 ${Math.round(16 * scale)}px "SF Mono", Menlo, monospace`;
    cardCtx.fillStyle = theme.primary;
    cardCtx.textBaseline = 'middle';
    cardCtx.fillText('LIVE <canvas layoutsubtree> DOM', 66, 73 * clamp(scale, 0.95, 1.05));

    // Dynamic User Headline (wrapped cleanly with Flexbox-equivalent spacing)
    const fontSize = Math.round(46 * scale);
    cardCtx.font = `800 ${fontSize}px "Inter", -apple-system, sans-serif`;
    cardCtx.fillStyle = theme.textMain;
    cardCtx.textBaseline = 'top';

    const words = state.customHeadline.split(' ');
    const maxLineW = w - 104;
    let line = '';
    let yCursor = 118;
    const lineHeight = Math.round(fontSize * 1.16);

    for (let i = 0; i < words.length; i++) {
      const testLine = line ? line + ' ' + words[i] : words[i];
      if (cardCtx.measureText(testLine).width > maxLineW && line) {
        cardCtx.fillText(line, 52, yCursor);
        line = words[i];
        yCursor += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      cardCtx.fillText(line, 52, yCursor);
      yCursor += lineHeight;
    }

    // Sub-caption
    const bodyFontSize = Math.round(21 * scale);
    cardCtx.font = `500 ${bodyFontSize}px "Inter", -apple-system, sans-serif`;
    cardCtx.fillStyle = theme.textMuted;
    cardCtx.fillText('Real CSS Flexbox, live reflow & A11y tree inside 60fps Canvas.', 52, yCursor + 14);

    // Interactive Flexbox Pill Row at bottom of card
    const pills = [
      { label: 'CSS Flexbox ✓', color: theme.primary },
      { label: 'WebGL Shaders ✓', color: theme.secondary },
      { label: `Scale: ${Math.round(scale * 100)}%`, color: theme.accent }
    ];
    let pillX = 52;
    const pillY = h - 92;
    for (let i = 0; i < pills.length; i++) {
      const p = pills[i];
      cardCtx.font = `700 ${Math.round(16 * scale)}px "Inter", sans-serif`;
      const tw = cardCtx.measureText(p.label).width;
      const pw = tw + 34;
      drawRoundedRect(cardCtx, pillX, pillY, pw, 42, 12);
      cardCtx.fillStyle = theme.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)';
      cardCtx.fill();
      cardCtx.lineWidth = 1.5;
      cardCtx.strokeStyle = p.color;
      cardCtx.stroke();

      cardCtx.fillStyle = p.color;
      cardCtx.textBaseline = 'middle';
      cardCtx.fillText(p.label, pillX + 17, pillY + 21);
      pillX += pw + 16;
    }

    // Subtle diagonal shimmer sweep across the card
    const sweepPos = ((t * 0.55) % 1.6) - 0.3;
    const shimmerGrad = cardCtx.createLinearGradient(
      w * (sweepPos - 0.2),
      0,
      w * (sweepPos + 0.2),
      h
    );
    shimmerGrad.addColorStop(0, 'rgba(255,255,255,0)');
    shimmerGrad.addColorStop(0.5, 'rgba(255,255,255,0.11)');
    shimmerGrad.addColorStop(1, 'rgba(255,255,255,0)');
    cardCtx.fillStyle = shimmerGrad;
    drawRoundedRect(cardCtx, 24, 24, w - 48, h - 48, 28);
    cardCtx.fill();

    cardCtx.restore();
  }

  // Draw a high-precision vector cursor (Arrow or Pointing Hand)
  function drawVectorCursor(x, y, isHand, clickScale, accentColor) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(clickScale, clickScale);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;

    ctx.beginPath();
    if (!isHand) {
      // Crisp macOS/SaaS pointer arrow
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 38);
      ctx.lineTo(10, 29);
      ctx.lineTo(18, 44);
      ctx.lineTo(24, 41);
      ctx.lineTo(16, 26);
      ctx.lineTo(29, 26);
      ctx.closePath();
    } else {
      // Pointing hand indicator
      drawRoundedRect(ctx, -6, 0, 28, 36, 10);
    }
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = accentColor || '#0f172a';
    ctx.stroke();
    ctx.restore();
  }

  // ── SCENE 1 (0.0s – 5.05s): THE OLD DILEMMA (DOM vs. RAW CANVAS) ───
  function renderScene1(t, theme) {
    const localT = t - 0.0;
    const exitP = progressInWindow(t, 4.55, 5.05);
    const exitScale = lerp(1, 0.88, easeInOutCubic(exitP));
    const exitAlpha = 1 - easeInOutCubic(exitP);

    ctx.save();
    ctx.globalAlpha = exitAlpha;
    ctx.translate(DESIGN_W / 2, DESIGN_H / 2);
    ctx.scale(exitScale, exitScale);
    ctx.translate(-DESIGN_W / 2, -DESIGN_H / 2);

    // Top Header Zone
    const titleSp = spring(localT - 0.05, { stiffness: 170, damping: 16 });
    ctx.save();
    ctx.translate(0, lerp(-40, 0, titleSp));
    ctx.font = `800 ${Math.round(54 * state.textScale)}px "Inter", sans-serif`;
    ctx.fillStyle = theme.textMain;
    ctx.textAlign = 'center';
    ctx.fillText('THE WEB CREATOR’S DILEMMA', DESIGN_W / 2, 118);

    ctx.font = `500 ${Math.round(24 * state.textScale)}px "Inter", sans-serif`;
    ctx.fillStyle = theme.textMuted;
    ctx.fillText('For decades, rich CSS layouts and raw GPU pixel shaders lived in separate worlds.', DESIGN_W / 2, 162);
    ctx.restore();

    // Left Card: Rich CSS & DOM (Flat 2D Box)
    const leftSp = spring(localT - 0.25, { stiffness: 160, damping: 15 });
    const leftX = lerp(-600, 150, leftSp);
    const cardY = 235;
    const cardW = 730;
    const cardH = 580;

    ctx.save();
    ctx.translate(leftX, cardY);
    drawRoundedRect(ctx, 0, 0, cardW, cardH, 28);
    ctx.fillStyle = theme.cardBg;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = theme.primary;
    ctx.stroke();

    // Badge
    drawRoundedRect(ctx, 44, 42, 240, 40, 20);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
    ctx.fill();
    ctx.font = '700 16px "SF Mono", Menlo, monospace';
    ctx.fillStyle = theme.primary;
    ctx.textAlign = 'left';
    ctx.fillText('WORLD A: HTML + CSS', 64, 67);

    ctx.font = `800 ${Math.round(40 * state.textScale)}px "Inter", sans-serif`;
    ctx.fillStyle = theme.textMain;
    ctx.fillText('Crisp Flexbox & Typography', 44, 134);

    // Pros list
    const domPros = [
      '✓ Automatic Flexbox & Grid Reflow',
      '✓ Internationalization & Crisp Fonts',
      '✓ Screen Readers & Keyboard A11y'
    ];
    ctx.font = `600 ${Math.round(23 * state.textScale)}px "Inter", sans-serif`;
    ctx.fillStyle = theme.accent;
    for (let i = 0; i < domPros.length; i++) {
      ctx.fillText(domPros[i], 44, 210 + i * 52);
    }

    // Limitation Stamp
    drawRoundedRect(ctx, 44, 410, cardW - 88, 116, 18);
    ctx.fillStyle = 'rgba(244, 63, 94, 0.14)';
    ctx.fill();
    ctx.strokeStyle = theme.tertiary;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '800 22px "SF Mono", Menlo, monospace';
    ctx.fillStyle = theme.tertiary;
    ctx.fillText('✕ TRAPPED IN FLAT 2D BOXES', 72, 458);
    ctx.font = '500 19px "Inter", sans-serif';
    ctx.fillStyle = theme.textMuted;
    ctx.fillText('No custom WebGL pixel shaders or particle physics.', 72, 494);
    ctx.restore();

    // Right Card: Raw <canvas> (Pixel Power, Broken Layout)
    const rightSp = spring(localT - 0.45, { stiffness: 160, damping: 15 });
    const rightX = lerp(DESIGN_W + 100, 1040, rightSp);

    ctx.save();
    ctx.translate(rightX, cardY);
    drawRoundedRect(ctx, 0, 0, cardW, cardH, 28);
    ctx.fillStyle = theme.cardBg;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = theme.secondary;
    ctx.stroke();

    drawRoundedRect(ctx, 44, 42, 260, 40, 20);
    ctx.fillStyle = 'rgba(129, 140, 248, 0.18)';
    ctx.fill();
    ctx.font = '700 16px "SF Mono", Menlo, monospace';
    ctx.fillStyle = theme.secondary;
    ctx.fillText('WORLD B: RAW <canvas>', 64, 67);

    ctx.font = `800 ${Math.round(40 * state.textScale)}px "Inter", sans-serif`;
    ctx.fillStyle = theme.textMain;
    ctx.fillText('60fps Shaders & Particles', 44, 134);

    // Animated shader wave preview inside Right Card
    ctx.save();
    drawRoundedRect(ctx, 44, 175, cardW - 88, 195, 16);
    ctx.clip();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
    ctx.fillRect(44, 175, cardW - 88, 195);
    for (let waveIdx = 0; waveIdx < 3; waveIdx++) {
      ctx.beginPath();
      for (let x = 44; x <= cardW - 44; x += 12) {
        const y = 272 + Math.sin(x * 0.018 + t * 4.5 + waveIdx * 1.4) * (34 + waveIdx * 10);
        if (x === 44) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = waveIdx === 0 ? theme.primary : waveIdx === 1 ? theme.secondary : theme.tertiary;
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    ctx.restore();

    // Limitation Stamp (Broken fillText overflow)
    drawRoundedRect(ctx, 44, 410, cardW - 88, 116, 18);
    ctx.fillStyle = 'rgba(244, 63, 94, 0.14)';
    ctx.fill();
    ctx.strokeStyle = theme.tertiary;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '800 22px "SF Mono", Menlo, monospace';
    ctx.fillStyle = theme.tertiary;
    ctx.fillText('✕ ctx.fillText() HAS ZERO LAYOUT', 72, 458);
    ctx.font = '500 19px "Inter", sans-serif';
    ctx.fillStyle = theme.textMuted;
    ctx.fillText('No CSS, no line-wrap, no Flexbox, invisible to screen readers.', 72, 494);
    ctx.restore();

    // Center "VS" Badge
    const vsSp = spring(localT - 0.7, { stiffness: 220, damping: 12 });
    ctx.save();
    ctx.translate(DESIGN_W / 2, cardY + cardH / 2);
    ctx.scale(vsSp, vsSp);
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fillStyle = theme.tertiary;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.font = '900 28px "Inter", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VS', 0, 2);
    ctx.restore();

    ctx.restore();
  }

  // ── SCENE 2 (5.05s – 10.25s): ENTER HTML-IN-CANVAS (layoutsubtree) ─
  function renderScene2(t, theme) {
    const localT = t - 5.05;
    const enterSp = spring(localT, { stiffness: 165, damping: 16 });
    const clickTime = 2.35; // localT = 2.35s -> t = 7.40s
    const isActivated = localT >= clickTime;
    const postClickSp = spring(localT - clickTime, { stiffness: 180, damping: 14 });

    ctx.save();

    // Header
    ctx.textAlign = 'center';
    ctx.font = `800 ${Math.round(54 * state.textScale)}px "Inter", sans-serif`;
    ctx.fillStyle = theme.textMain;
    ctx.fillText('ENTER HTML-IN-CANVAS', DESIGN_W / 2, lerp(40, 118, enterSp));

    ctx.font = `500 ${Math.round(24 * state.textScale)}px "Inter", sans-serif`;
    ctx.fillStyle = theme.textMuted;
    ctx.fillText('One attribute bridges live browser DOM directly into the Canvas rendering pipeline.', DESIGN_W / 2, 162);

    // Code Editor Card
    const codeW = 1180;
    const codeH = 470;
    const codeX = (DESIGN_W - codeW) / 2;
    const codeY = lerp(340, 225, enterSp);

    ctx.save();
    ctx.translate(codeX, codeY);

    // Glowing aura when activated
    if (isActivated) {
      ctx.shadowColor = theme.primary;
      ctx.shadowBlur = 45 * postClickSp * state.fxIntensity;
    }

    drawRoundedRect(ctx, 0, 0, codeW, codeH, 26);
    ctx.fillStyle = '#090d16';
    ctx.fill();
    ctx.lineWidth = isActivated ? 3.5 : 2;
    ctx.strokeStyle = isActivated ? theme.accent : theme.cardBorder;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Window traffic lights
    const dots = ['#f43f5e', '#f59e0b', '#10b981'];
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(38 + i * 26, 36, 8, 0, Math.PI * 2);
      ctx.fillStyle = dots[i];
      ctx.fill();
    }
    ctx.font = '600 16px "SF Mono", Menlo, monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText('index.html + render.js — Chrome HTML-in-Canvas API', 135, 42);

    // Typed Code Lines
    const codeLines = [
      { delay: 0.2, text: '<!-- 1. Enable DOM subtree layout inside canvas -->', color: '#64748b' },
      { delay: 0.45, text: '<canvas id="stage" width="1920" height="1080" layoutsubtree>', color: '#38bdf8' },
      { delay: 0.7, text: '  <div class="hero-card">' + state.customHeadline.slice(0, 32) + '</div>', color: '#f8fafc' },
      { delay: 0.95, text: '</canvas>', color: '#38bdf8' },
      { delay: 1.25, text: '// 2. Rasterize live DOM at 60fps inside onpaint', color: '#64748b' },
      { delay: 1.5, text: 'canvas.onpaint = () => ctx.drawElementImage(card, x, y);', color: '#10b981' }
    ];

    const fontPx = Math.round(23 * clamp(state.textScale, 0.85, 1.15));
    ctx.font = `600 ${fontPx}px "SF Mono", Menlo, monospace`;
    for (let i = 0; i < codeLines.length; i++) {
      const item = codeLines[i];
      const p = progressInWindow(localT, item.delay, item.delay + 0.45);
      if (p > 0) {
        const chars = Math.floor(item.text.length * easeOutCubic(p));
        ctx.fillStyle = item.color;
        ctx.fillText(item.text.slice(0, chars), 48, 108 + i * 48);
      }
    }

    // Interactive CTA Button inside Code Card ("Activate layoutsubtree")
    const btnW = 390;
    const btnH = 64;
    const btnX = codeW - btnW - 48;
    const btnY = codeH - btnH - 36;
    const isClickDip = localT >= clickTime - 0.08 && localT <= clickTime + 0.14;
    const btnScale = isClickDip ? 0.94 : isActivated ? 1.03 : 1.0;

    ctx.save();
    ctx.translate(btnX + btnW / 2, btnY + btnH / 2);
    ctx.scale(btnScale, btnScale);
    drawRoundedRect(ctx, -btnW / 2, -btnH / 2, btnW, btnH, 16);
    ctx.fillStyle = isActivated ? theme.accent : theme.primary;
    ctx.fill();
    ctx.font = '800 21px "Inter", sans-serif';
    ctx.fillStyle = '#041019';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      isActivated ? '✓ layoutsubtree ACTIVE (60 FPS)' : '⚡ Activate layoutsubtree',
      0,
      1
    );
    ctx.restore();

    // Expanding shockwave ring on click
    if (isActivated && postClickSp < 0.99) {
      const ringProgress = progressInWindow(localT, clickTime, clickTime + 0.9);
      ctx.beginPath();
      ctx.arc(btnX + btnW / 2, btnY + btnH / 2, ringProgress * 520, 0, Math.PI * 2);
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 6 * (1 - ringProgress);
      ctx.globalAlpha = 1 - ringProgress;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // Animated Vector Cursor Gliding In & Clicking Button
    const cursorMoveP = easeInOutCubic(progressInWindow(localT, 1.1, clickTime));
    const targetX = codeX + btnX + btnW * 0.55;
    const targetY = codeY + btnY + btnH * 0.55;
    const curX = lerp(DESIGN_W - 180, targetX, cursorMoveP);
    const curY = lerp(DESIGN_H - 120, targetY, cursorMoveP) - Math.sin(cursorMoveP * Math.PI) * 90;
    const isHovering = cursorMoveP > 0.82;
    const clickScale = isClickDip ? 0.85 : 1.0;
    drawVectorCursor(curX, curY, isHovering, clickScale, theme.primary);

    // Bottom Feature Merge Pills after activation
    if (isActivated) {
      const features = [
        'DOM Flexbox + CSS Variables',
        'ctx.drawElementImage() Zero-Copy',
        'WebGL & 2D Pixel Shaders'
      ];
      for (let i = 0; i < features.length; i++) {
        const fSp = spring(localT - clickTime - 0.12 * i, { stiffness: 190, damping: 14 });
        const fx = 310 + i * 450;
        const fy = lerp(840, 765, fSp);
        ctx.save();
        ctx.globalAlpha = clamp(fSp, 0, 1);
        drawRoundedRect(ctx, fx, fy, 400, 66, 16);
        ctx.fillStyle = theme.cardBg;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = theme.accent;
        ctx.stroke();
        ctx.font = '700 20px "Inter", sans-serif';
        ctx.fillStyle = theme.textMain;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(features[i], fx + 200, fy + 33);
        ctx.restore();
      }
    }

    ctx.restore();
  }

  // ── SCENE 3 (10.25s – 15.65s): 3D PERSPECTIVE, CHROMATIC SHADERS & PARTICLES ─
  function renderScene3(t, theme) {
    const localT = t - 10.25;
    const enterSp = spring(localT, { stiffness: 150, damping: 15 });
    const fxMult = state.fxIntensity;

    // 1. Render live DOM hero card into offscreen buffer
    renderLiveHeroCardToBuffer(t, theme);

    ctx.save();

    // Header
    ctx.textAlign = 'center';
    ctx.font = `800 ${Math.round(52 * state.textScale)}px "Inter", sans-serif`;
    ctx.fillStyle = theme.textMain;
    ctx.fillText('SUPERPOWER #1: LIVE DOM IN 3D & PIXEL SHADERS', DESIGN_W / 2, lerp(40, 112, enterSp));

    ctx.font = `500 ${Math.round(23 * state.textScale)}px "Inter", sans-serif`;
    ctx.fillStyle = theme.textMuted;
    ctx.fillText('Your live CSS card is rasterized into a GPU texture—ready for wave warps, RGB splits & particles.', DESIGN_W / 2, 156);

    // 2. Orbiting Curl-Noise Particle Field behind & around card
    const centerX = DESIGN_W / 2;
    const centerY = 535;
    const palette = [theme.primary, theme.secondary, theme.tertiary];

    for (let i = 0; i < PARTICLES.length; i++) {
      const pt = PARTICLES[i];
      const angle = pt.seed + localT * pt.speed * (0.6 + fxMult * 0.5);
      const waveR = pt.orbitRadius + Math.sin(localT * 2.5 + pt.seed) * 45 * fxMult;
      const px = centerX + Math.cos(angle) * waveR * 1.35;
      const py = centerY + Math.sin(angle * 1.2) * (waveR * 0.52);

      ctx.beginPath();
      ctx.arc(px, py, pt.radius * (0.8 + fxMult * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = palette[pt.colorIndex];
      ctx.globalAlpha = 0.65 * clamp(enterSp, 0, 1);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 3. Multi-Slice 3D Perspective + Wave Displacement + RGB Chromatic Split on Live Card
    const cardW = cardBuffer.width;
    const cardH = cardBuffer.height;
    const baseX = centerX - cardW / 2;
    const baseY = centerY - cardH / 2;
    const tiltWave = Math.sin(localT * 2.1) * 14 * fxMult;

    // Stacked glowing shadow layers behind the 3D card
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(enterSp, enterSp);
    for (let layer = 3; layer >= 1; layer--) {
      drawRoundedRect(
        ctx,
        -cardW / 2 + layer * tiltWave * 0.55 + 24,
        -cardH / 2 + layer * 14 + 24,
        cardW - 48,
        cardH - 48,
        28
      );
      ctx.fillStyle = layer === 1 ? 'rgba(56, 189, 248, 0.14)' : 'rgba(129, 140, 248, 0.07)';
      ctx.strokeStyle = layer === 1 ? theme.primary : theme.secondary;
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // Horizontal scanline slice displacement (simulates fragment shader wave + 3D perspective)
    const sliceH = 6;
    const rgbShift = 6.5 * fxMult * Math.sin(localT * 3.8);

    ctx.save();
    for (let sy = 0; sy < cardH; sy += sliceH) {
      const normY = (sy / cardH) - 0.5;
      // 3D keystone perspective scale per scanline
      const perspectiveScale = 1 + normY * Math.sin(localT * 1.8) * 0.11 * fxMult;
      const waveOffsetX =
        Math.sin(sy * 0.024 - localT * 5.2) * 14 * fxMult * Math.sin(localT * 1.5);

      const destW = cardW * perspectiveScale * enterSp;
      const destX = centerX - destW / 2 + waveOffsetX;
      const destY = baseY + sy * enterSp;

      // Chromatic ghost pass (when fxIntensity > 0.2)
      if (Math.abs(rgbShift) > 1.2) {
        ctx.globalAlpha = 0.26;
        ctx.drawImage(
          cardBuffer,
          0,
          sy,
          cardW,
          sliceH,
          destX - rgbShift,
          destY,
          destW,
          sliceH * enterSp
        );
        ctx.drawImage(
          cardBuffer,
          0,
          sy,
          cardW,
          sliceH,
          destX + rgbShift,
          destY,
          destW,
          sliceH * enterSp
        );
        ctx.globalAlpha = 1.0;
      }

      // Main crisp slice
      ctx.drawImage(
        cardBuffer,
        0,
        sy,
        cardW,
        sliceH,
        destX,
        destY,
        destW,
        sliceH * enterSp
      );
    }
    ctx.restore();

    // Live Shader Telemetry Pill at bottom
    drawRoundedRect(ctx, centerX - 330, 825, 660, 54, 27);
    ctx.fillStyle = theme.cardBg;
    ctx.fill();
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '700 18px "SF Mono", Menlo, monospace';
    ctx.fillStyle = theme.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `SHADER FX INTENSITY: ${Math.round(fxMult * 100)}%  •  TEXT SCALE: ${Math.round(state.textScale * 100)}%`,
      centerX,
      852
    );

    ctx.restore();
  }

  // ── SCENE 4 (15.65s – 20.85s): ACCESSIBILITY, SELECTABILITY & INTERACTIVITY ─
  function renderScene4(t, theme) {
    const localT = t - 15.65;
    const enterSp = spring(localT, { stiffness: 160, damping: 16 });

    ctx.save();

    // Header Zone (Y: 0–200)
    ctx.textAlign = 'center';
    ctx.font = `800 ${Math.round(50 * state.textScale)}px "Inter", sans-serif`;
    ctx.fillStyle = theme.textMain;
    ctx.fillText('SUPERPOWER #2: ACCESSIBLE, SELECTABLE & INTERACTIVE', DESIGN_W / 2, lerp(40, 110, enterSp));

    ctx.font = `500 ${Math.round(23 * state.textScale)}px "Inter", sans-serif`;
    ctx.fillStyle = theme.textMuted;
    ctx.fillText('Unlike dead Canvas pixels, <canvas layoutsubtree> preserves the live DOM tree for users & assistive tech.', DESIGN_W / 2, 154);

    // ── LEFT STAGE: ORBITAL ACCESSIBILITY HUB WITH CIRCLING ADVANTAGE NODES ──
    const hubCx = 510;
    const hubCy = 540;
    const orbitR = 235;

    // Sonar pulse rings radiating from Accessibility Core
    for (let rIdx = 0; rIdx < 3; rIdx++) {
      const pulsePhase = ((localT * 0.65 + rIdx * 0.33) % 1);
      const ringR = 75 + pulsePhase * 210;
      ctx.beginPath();
      ctx.arc(hubCx, hubCy, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = theme.primary;
      ctx.lineWidth = 2.5 * (1 - pulsePhase);
      ctx.globalAlpha = 0.45 * (1 - pulsePhase) * clamp(enterSp, 0, 1);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Dashed orbital track circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(hubCx, hubCy, orbitR, 0, Math.PI * 2);
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 4 Circling Advantage Satellites (Upright counter-rotated badges orbiting the core)
    const satellites = [
      {
        title: 'SCREEN READER',
        sub: 'Live ARIA & Role Tree',
        icon: '🔊',
        color: theme.primary,
        baseAngle: -Math.PI / 2
      },
      {
        title: 'SELECTABLE TEXT',
        sub: 'Highlight, Copy & Find',
        icon: '𝗜',
        color: theme.accent,
        baseAngle: 0
      },
      {
        title: 'KEYBOARD FOCUS',
        sub: 'Native Tab ⇥ Order',
        icon: '⇥',
        color: theme.secondary,
        baseAngle: Math.PI / 2
      },
      {
        title: 'DOM INTERACTIVE',
        sub: 'Click, Hover & Input',
        icon: '⚡',
        color: theme.tertiary,
        baseAngle: Math.PI
      }
    ];

    const orbitSpeed = 0.55; // radians/sec smooth revolution
    for (let i = 0; i < satellites.length; i++) {
      const sat = satellites[i];
      const satSp = clamp(spring(localT - 0.15 - i * 0.12, { stiffness: 175, damping: 14 }), 0, 1.15);
      const angle = sat.baseAngle + localT * orbitSpeed;
      const sx = hubCx + Math.cos(angle) * orbitR * satSp;
      const sy = hubCy + Math.sin(angle) * (orbitR * 0.88) * satSp;

      // Glowing energy tether from core to satellite
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(hubCx, hubCy);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = sat.color;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.42;
      ctx.stroke();
      ctx.restore();

      // Orbiting Advantage Pill Card (stays horizontally level while circling!)
      const pillW = 248;
      const pillH = 78;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(satSp, satSp);

      drawRoundedRect(ctx, -pillW / 2, -pillH / 2, pillW, pillH, 20);
      ctx.fillStyle = theme.cardBg;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = sat.color;
      ctx.stroke();

      // Icon circle on left of satellite badge
      ctx.beginPath();
      ctx.arc(-pillW / 2 + 38, 0, 22, 0, Math.PI * 2);
      ctx.fillStyle = sat.color;
      ctx.fill();

      ctx.font = '800 20px "Inter", sans-serif';
      ctx.fillStyle = '#041019';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sat.icon, -pillW / 2 + 38, 1);

      // Satellite title & subtitle
      ctx.textAlign = 'left';
      ctx.font = '800 15.5px "SF Mono", Menlo, monospace';
      ctx.fillStyle = theme.textMain;
      ctx.fillText(sat.title, -pillW / 2 + 72, -10);

      ctx.font = '600 14px "Inter", sans-serif';
      ctx.fillStyle = theme.textMuted;
      ctx.fillText(sat.sub, -pillW / 2 + 72, 13);

      ctx.restore();
    }

    // Central Universal Accessibility Emblem Core
    const coreSp = spring(localT - 0.05, { stiffness: 190, damping: 14 });
    ctx.save();
    ctx.translate(hubCx, hubCy);
    ctx.scale(coreSp, coreSp);

    // Outer glowing shield circle
    ctx.beginPath();
    ctx.arc(0, 0, 76, 0, Math.PI * 2);
    ctx.fillStyle = theme.cardBg;
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = 32;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 4;
    ctx.strokeStyle = theme.primary;
    ctx.stroke();

    // Inner dashed ring rotating counter-clockwise
    ctx.save();
    ctx.rotate(-localT * 0.8);
    ctx.beginPath();
    ctx.arc(0, 0, 62, 0, Math.PI * 2);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.restore();

    // Universal Accessibility Figure Vector Icon (Head + Outstretched Arms + Torso + Legs)
    ctx.strokeStyle = theme.textMain;
    ctx.fillStyle = theme.primary;
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Head
    ctx.beginPath();
    ctx.arc(0, -26, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Outstretched arms arc
    ctx.beginPath();
    ctx.moveTo(-30, -8);
    ctx.quadraticCurveTo(0, -2, 30, -8);
    ctx.stroke();

    // Torso
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(0, 12);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(-18, 36);
    ctx.lineTo(0, 12);
    ctx.lineTo(18, 36);
    ctx.stroke();

    ctx.font = '800 13px "SF Mono", Menlo, monospace';
    ctx.fillStyle = theme.accent;
    ctx.textAlign = 'center';
    ctx.fillText('A11Y DOM CORE', 0, 54);
    ctx.restore();

    // ── RIGHT STAGE: LIVE SELECTABILITY, KEYBOARD FOCUS & VOICEOVER DEMO CARD ──
    const cardX = 955;
    const cardY = 230;
    const cardW = 835;
    const cardH = 595;

    ctx.save();
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28);
    ctx.fillStyle = theme.cardBg;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = theme.cardBorder;
    ctx.stroke();

    // Top Window Header Bar
    ctx.font = '700 16px "SF Mono", Menlo, monospace';
    ctx.fillStyle = theme.primary;
    ctx.textAlign = 'left';
    ctx.fillText('LIVE DOM SUBTREE INTERACTION STAGE', cardX + 42, cardY + 46);

    // 1. LIVE TEXT SELECTION DEMO (0.2s -> 5.0s)
    const selProgress = easeInOutCubic(progressInWindow(localT, 0.35, 1.85));
    const headlineY = cardY + 108;
    const headlineFontPx = Math.round(36 * clamp(state.textScale, 0.8, 1.25));
    ctx.font = `800 ${headlineFontPx}px "Inter", sans-serif`;
    const dispText = state.customHeadline.slice(0, 36);
    const fullTextW = Math.min(cardW - 96, ctx.measureText(dispText).width);
    const currentSelW = fullTextW * selProgress;

    // Selection highlight background box + handles
    if (selProgress > 0.02) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.32)';
      drawRoundedRect(ctx, cardX + 42, headlineY - 8, currentSelW + 12, headlineFontPx + 20, 8);
      ctx.fill();

      // Left & Right selection range pins
      ctx.fillStyle = theme.primary;
      ctx.fillRect(cardX + 40, headlineY - 10, 4, headlineFontPx + 24);
      ctx.fillRect(cardX + 52 + currentSelW, headlineY - 10, 4, headlineFontPx + 24);
      ctx.beginPath();
      ctx.arc(cardX + 42, headlineY - 12, 6, 0, Math.PI * 2);
      ctx.arc(cardX + 54 + currentSelW, headlineY + headlineFontPx + 16, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Crisp selectable headline text
    ctx.fillStyle = theme.textMain;
    ctx.textBaseline = 'top';
    ctx.fillText(dispText, cardX + 48, headlineY);

    // Floating Context Menu Pill ("Copy ⌘C | Look Up | Speak") popping above selection
    if (selProgress > 0.55) {
      const menuSp = spring(localT - 1.25, { stiffness: 210, damping: 14 });
      ctx.save();
      const menuX = cardX + 48 + currentSelW * 0.5;
      const menuY = headlineY - 38;
      ctx.translate(menuX, menuY);
      ctx.scale(menuSp, menuSp);
      drawRoundedRect(ctx, -165, -22, 330, 40, 12);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = theme.primary;
      ctx.stroke();
      ctx.font = '700 15px "SF Mono", Menlo, monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📋 Copy ⌘C   •   🔍 Find ⌘F   •   🔊 Speak', 0, -2);
      ctx.restore();
    }

    // 2. KEYBOARD TAB FOCUS & INTERACTIVE CONTROLS ROW (localT: 1.5s -> 5.0s)
    const focusStep = localT < 2.2 ? 0 : localT < 3.3 ? 1 : 2;
    const controlsY = cardY + 230;
    const interactiveItems = [
      { label: '⇥ [1] <input> Search Canvas', w: 265, color: theme.primary },
      { label: '⇥ [2] <button> Toggle Shader', w: 255, color: theme.accent },
      { label: '⇥ [3] <a href> Docs Link', w: 215, color: theme.secondary }
    ];

    let itemX = cardX + 42;
    for (let i = 0; i < interactiveItems.length; i++) {
      const it = interactiveItems[i];
      const isFocused = focusStep === i;

      drawRoundedRect(ctx, itemX, controlsY, it.w, 64, 14);
      ctx.fillStyle = isFocused ? 'rgba(16, 185, 129, 0.16)' : 'rgba(148, 163, 184, 0.1)';
      ctx.fill();
      ctx.lineWidth = isFocused ? 3.5 : 1.5;
      ctx.strokeStyle = isFocused ? theme.accent : theme.cardBorder;
      ctx.stroke();

      // Glowing :focus-visible outer ring when focused via Tab key
      if (isFocused) {
        ctx.save();
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        drawRoundedRect(ctx, itemX - 6, controlsY - 6, it.w + 12, 76, 18);
        ctx.stroke();
        ctx.restore();

        // Floating ":focus-visible (Tab ⇥)" tag
        drawRoundedRect(ctx, itemX + 12, controlsY - 34, 178, 26, 8);
        ctx.fillStyle = theme.accent;
        ctx.fill();
        ctx.font = '800 13px "SF Mono", Menlo, monospace';
        ctx.fillStyle = '#041019';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(':focus-visible (Tab ⇥)', itemX + 101, controlsY - 21);
      }

      ctx.font = '700 16px "SF Mono", Menlo, monospace';
      ctx.fillStyle = isFocused ? theme.textMain : theme.textMuted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.label, itemX + it.w / 2, controlsY + 32);

      itemX += it.w + 18;
    }

    // 3. SCREEN READER / ASSISTIVE TECH LIVE ARIA ANNOUNCEMENT HUD (localT: 0.6s -> 5.0s)
    const ariaY = cardY + 345;
    const ariaW = cardW - 84;
    const ariaH = 205;

    drawRoundedRect(ctx, cardX + 42, ariaY, ariaW, ariaH, 20);
    ctx.fillStyle = theme.isLight ? 'rgba(24, 24, 27, 0.92)' : 'rgba(2, 6, 23, 0.85)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = theme.secondary;
    ctx.stroke();

    // Screen Reader Header + Animated Equalizer Bars
    ctx.font = '800 16px "SF Mono", Menlo, monospace';
    ctx.fillStyle = theme.secondary;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔊 SCREEN READER / ACCESSIBILITY TREE INSPECTOR', cardX + 70, ariaY + 38);

    // 14-Bar Live VoiceOver Equalizer on right of header
    for (let b = 0; b < 14; b++) {
      const barH = 8 + Math.abs(Math.sin(localT * 7 + b * 0.7)) * 24;
      const bx = cardX + ariaW - 140 + b * 11;
      drawRoundedRect(ctx, bx, ariaY + 38 - barH / 2, 6, barH, 3);
      ctx.fillStyle = b % 2 === 0 ? theme.primary : theme.accent;
      ctx.fill();
    }

    // Accessibility Tree Nodes Readout
    const treeLines = [
      `role="region" aria-label="Interactive Canvas Banner"  ✓ EXPOSED`,
      `├─ heading [level=2]: "${state.customHeadline.slice(0, 30)}"  ✓ SELECTABLE`,
      `└─ button [focusable=true]: "Toggle Shader" (Tab Index 2)  ✓ INTERACTIVE`
    ];
    ctx.font = '600 18px "SF Mono", Menlo, monospace';
    for (let i = 0; i < treeLines.length; i++) {
      ctx.fillStyle = i === 1 ? theme.accent : '#e2e8f0';
      ctx.fillText(treeLines[i], cardX + 70, ariaY + 86 + i * 38);
    }

    ctx.restore();
    ctx.restore();
  }

  // ── SCENE 5 (20.25s – 25.20s): LIVE DYNAMIC & REACTIVE CONTROLS ───
  function renderScene5(t, theme) {
    const localT = t - 20.25;
    const enterSp = spring(localT, { stiffness: 165, damping: 16 });

    renderLiveHeroCardToBuffer(t, theme);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `800 ${Math.round(52 * state.textScale)}px "Inter", sans-serif`;
    ctx.fillStyle = theme.textMain;
    ctx.fillText('SUPERPOWER #3: TRULY DYNAMIC & REACTIVE', DESIGN_W / 2, lerp(40, 112, enterSp));

    ctx.font = `500 ${Math.round(23 * state.textScale)}px "Inter", sans-serif`;
    ctx.fillStyle = theme.textMuted;
    ctx.fillText('Try changing the Typography Scale, Headline, or Theme in the right panel right now!', DESIGN_W / 2, 156);

    // Left: Live Card Preview with Dynamic Dimension Callout Arrows
    const cardX = 130;
    const cardY = 240;
    ctx.save();
    ctx.translate(cardX, cardY);
    ctx.drawImage(cardBuffer, 0, 0);

    // Dimension measurement bracket showing live reflow
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    drawRoundedRect(ctx, 18, 18, cardBuffer.width - 36, cardBuffer.height - 36, 30);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Right: Live Parameter Inspector HUD reflecting actual user settings
    const hudX = 1090;
    const hudY = 264;
    const hudW = 690;
    const hudH = 450;

    drawRoundedRect(ctx, hudX, hudY, hudW, hudH, 24);
    ctx.fillStyle = theme.cardBg;
    ctx.fill();
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.font = '800 24px "Inter", sans-serif';
    ctx.fillStyle = theme.textMain;
    ctx.textAlign = 'left';
    ctx.fillText('LIVE DOM-IN-CANVAS INSPECTOR', hudX + 40, hudY + 54);

    const rows = [
      {
        label: 'CSS --text-scale Variable',
        val: `${Math.round(state.textScale * 100)}% (${state.textScale.toFixed(2)}x)`,
        pct: (state.textScale - 0.75) / (1.4 - 0.75),
        color: theme.primary
      },
      {
        label: 'Shader & 3D Tilt Intensity',
        val: `${Math.round(state.fxIntensity * 100)}%`,
        pct: state.fxIntensity / 1.8,
        color: theme.secondary
      },
      {
        label: 'Active Theme Palette',
        val: theme.name,
        pct: 0.85,
        color: theme.accent
      }
    ];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const ry = hudY + 115 + i * 105;

      ctx.font = '600 19px "Inter", sans-serif';
      ctx.fillStyle = theme.textMuted;
      ctx.textAlign = 'left';
      ctx.fillText(r.label, hudX + 40, ry);

      ctx.font = '700 19px "SF Mono", Menlo, monospace';
      ctx.fillStyle = r.color;
      ctx.textAlign = 'right';
      ctx.fillText(r.val, hudX + hudW - 40, ry);

      // Animated slider bar
      drawRoundedRect(ctx, hudX + 40, ry + 18, hudW - 80, 18, 9);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.18)';
      ctx.fill();

      const fillW = Math.max(24, (hudW - 80) * clamp(r.pct, 0.05, 1));
      drawRoundedRect(ctx, hudX + 40, ry + 18, fillW, 18, 9);
      ctx.fillStyle = r.color;
      ctx.fill();
    }

    ctx.restore();
  }

  // ── SCENE 6 (25.20s – 30.00s): GRAND FINALE & ONE-CLICK CAPTURE ───
  function renderScene6(t, theme) {
    const localT = t - 25.20;
    const enterSp = spring(localT, { stiffness: 160, damping: 14 });

    ctx.save();

    // Radial particle burst
    const cx = DESIGN_W / 2;
    const cy = DESIGN_H / 2 - 30;
    const palette = [theme.primary, theme.secondary, theme.accent];

    for (let i = 0; i < 120; i++) {
      const pt = PARTICLES[i];
      const angle = pt.seed + localT * 0.35;
      const dist = 180 + ((pt.orbitRadius + localT * 90) % 680);
      const px = cx + Math.cos(angle) * dist * 1.3;
      const py = cy + Math.sin(angle) * dist * 0.65;

      ctx.beginPath();
      ctx.arc(px, py, pt.radius * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = palette[pt.colorIndex];
      ctx.globalAlpha = 0.55 * clamp(enterSp, 0, 1);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Center Hero Finale Lockup Card
    const boxW = 1260;
    const boxH = 540;
    const boxX = cx - boxW / 2;
    const boxY = cy - boxH / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(enterSp, enterSp);
    ctx.translate(-cx, -cy);

    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 34);
    ctx.fillStyle = theme.cardBg;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = theme.primary;
    ctx.stroke();

    // Top Pill
    drawRoundedRect(ctx, cx - 230, boxY + 48, 460, 44, 22);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
    ctx.fill();
    ctx.font = '800 17px "SF Mono", Menlo, monospace';
    ctx.fillStyle = theme.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CHROME HTML-IN-CANVAS + MEDIARECORDER', cx, boxY + 70);

    // Main Finale Headline
    ctx.font = `900 ${Math.round(68 * clamp(state.textScale, 0.8, 1.25))}px "Inter", sans-serif`;
    ctx.fillStyle = theme.textMain;
    ctx.fillText('Design with DOM. Render Unbound.', cx, boxY + 175);

    // User's live custom headline echoed as sub-banner
    ctx.font = `600 ${Math.round(30 * clamp(state.textScale, 0.8, 1.2))}px "Inter", sans-serif`;
    ctx.fillStyle = theme.secondary;
    ctx.fillText(`“${state.customHeadline}”`, cx, boxY + 250);

    // Call to Action Capture Button inside Canvas
    const ctaW = 540;
    const ctaH = 84;
    const ctaX = cx - ctaW / 2;
    const ctaY = boxY + 335;
    const pulse = 1 + Math.sin(localT * 6) * 0.025;

    ctx.save();
    ctx.translate(cx, ctaY + ctaH / 2);
    ctx.scale(pulse, pulse);
    drawRoundedRect(ctx, -ctaW / 2, -ctaH / 2, ctaW, ctaH, 22);
    ctx.fillStyle = theme.tertiary;
    ctx.fill();
    ctx.font = '800 26px "Inter", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('● Click “Capture & Download Video” Below', 0, 2);
    ctx.restore();

    ctx.font = '500 20px "Inter", sans-serif';
    ctx.fillStyle = theme.textMuted;
    ctx.fillText('Exports 60fps Canvas Video + Synchronized Voiceover Audio in One Click', cx, boxY + 472);

    ctx.restore();
    ctx.restore();
  }

  // ── Persistent Bottom Broadcast Lower-Third & Progress Bar ────────
  function renderBroadcastOverlay(t, theme, activeScene) {
    ctx.save();

    // Subtitle / Caption Bar at bottom of 1920x1080 canvas (Y: 940..1040)
    const barW = 1480;
    const barH = 82;
    const barX = (DESIGN_W - barW) / 2;
    const barY = 952;

    drawRoundedRect(ctx, barX, barY, barW, barH, 18);
    ctx.fillStyle = theme.isLight ? 'rgba(255, 252, 245, 0.92)' : 'rgba(9, 13, 24, 0.86)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = theme.cardBorder;
    ctx.stroke();

    // Scene Tag Pill on left of caption bar
    drawRoundedRect(ctx, barX + 18, barY + 18, 250, 46, 12);
    ctx.fillStyle = theme.primary;
    ctx.fill();
    ctx.font = '800 16px "SF Mono", Menlo, monospace';
    ctx.fillStyle = '#041019';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`SCENE 0${activeScene.id} / 06`, barX + 143, barY + 41);

    // Spoken Voiceover Caption Text
    ctx.font = `600 ${Math.round(23 * clamp(state.textScale, 0.85, 1.12))}px "Inter", sans-serif`;
    ctx.fillStyle = theme.textMain;
    ctx.textAlign = 'left';
    ctx.fillText(activeScene.caption, barX + 292, barY + 42);

    // Master 30s timeline progress bar along bottom edge of canvas
    const totalPct = clamp(t / TOTAL_DURATION, 0, 1);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.fillRect(0, DESIGN_H - 8, DESIGN_W, 8);
    ctx.fillStyle = theme.primary;
    ctx.fillRect(0, DESIGN_H - 8, DESIGN_W * totalPct, 8);

    ctx.restore();
  }

  // ── Master Frame Render Dispatcher ─────────────────────────────────
  function getSceneForTime(t) {
    for (let i = 0; i < SCENES.length; i++) {
      if (t >= SCENES[i].start && t <= SCENES[i].end) {
        return SCENES[i];
      }
    }
    return SCENES[SCENES.length - 1];
  }

  function renderSceneToCanvas(t) {
    const theme = THEMES[state.themeKey] || THEMES.editorial;
    const activeScene = getSceneForTime(t);

    drawBackgroundAndGrid(t, theme);

    if (activeScene.id === 1) {
      renderScene1(t, theme);
    } else if (activeScene.id === 2) {
      renderScene2(t, theme);
    } else if (activeScene.id === 3) {
      renderScene3(t, theme);
    } else if (activeScene.id === 4) {
      renderScene4(t, theme);
    } else if (activeScene.id === 5) {
      renderScene5(t, theme);
    } else {
      renderScene6(t, theme);
    }

    renderBroadcastOverlay(t, theme, activeScene);
    return activeScene;
  }

  function renderFrame(t) {
    const activeScene = renderSceneToCanvas(t);
    updateUiTelemetry(t, activeScene);
  }

  function updateUiTelemetry(t, activeScene) {
    timeReadout.textContent = `${t.toFixed(1).padStart(4, '0')}s / ${TOTAL_DURATION.toFixed(1)}s • 60 FPS`;
    scrubber.value = String(t.toFixed(2));
    scriptSceneTag.textContent = activeScene.tag;
    scriptCaptionText.textContent = activeScene.caption;

    // Highlight active scene jump pill
    const buttons = scenePillsContainer.querySelectorAll('.scene-jump-btn');
    buttons.forEach((btn, idx) => {
      if (idx + 1 === activeScene.id) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Trigger subtle Web Audio chime on scene change while playing
    if (state.isPlaying && activeScene.id !== lastTriggeredSceneId) {
      lastTriggeredSceneId = activeScene.id;
      playSceneTransitionSfx(activeScene.id);
    }
  }

  // ── Main 60fps Animation Loop ──────────────────────────────────────
  function tick(nowPerf) {
    if (state.isPlaying) {
      const dt = Math.min(0.1, (nowPerf - state.lastFramePerf) / 1000);
      state.lastFramePerf = nowPerf;
      state.currentTime += dt;

      const targetStopTime = state.isRecording ? state.captureDuration : TOTAL_DURATION;

      if (state.currentTime >= targetStopTime) {
        state.currentTime = targetStopTime;
        renderFrame(state.currentTime);
        if (state.isRecording) {
          finishVideoCapture();
        } else {
          pausePlayback();
          showToast('30s commercial finished! Click Play to watch again or Capture to export video.', false);
        }
      } else {
        renderFrame(state.currentTime);
      }
    }
    requestAnimationFrame(tick);
  }

  async function startPlayback(fromTime) {
    await ensureAudioInitialized();
    if (typeof fromTime === 'number') {
      state.currentTime = clamp(fromTime, 0, TOTAL_DURATION);
    } else if (state.currentTime >= TOTAL_DURATION - 0.1) {
      state.currentTime = 0;
    }
    state.isPlaying = true;
    state.lastFramePerf = performance.now();
    lastTriggeredSceneId = getSceneForTime(state.currentTime).id;

    playIcon.textContent = '⏸';
    playLabel.textContent = 'Pause Commercial';

    startVoiceoverAt(state.currentTime);
    playSceneTransitionSfx(lastTriggeredSceneId);
  }

  function pausePlayback() {
    state.isPlaying = false;
    stopVoiceoverPlayback();
    playIcon.textContent = '▶';
    playLabel.textContent = 'Play 30s Commercial (with Voiceover)';
  }

  // ── One-Click Video + Audio Capture via HTML-in-Canvas + MediaRecorder ──
  function getSupportedMimeType() {
    const candidates = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];
    for (let i = 0; i < candidates.length; i++) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidates[i])) {
        return candidates[i];
      }
    }
    return '';
  }

  async function startVideoCapture() {
    if (state.isRecording) {
      finishVideoCapture();
      return;
    }

    await ensureAudioInitialized();
    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      showToast('MediaRecorder is not supported in this browser.', true);
      return;
    }

    const canvasStream = canvas.captureStream(60);
    const combinedTracks = [...canvasStream.getVideoTracks()];
    if (streamDestNode && streamDestNode.stream.getAudioTracks().length > 0) {
      combinedTracks.push(...streamDestNode.stream.getAudioTracks());
    }
    const combinedStream = new MediaStream(combinedTracks);

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: mimeType,
      videoBitsPerSecond: 14000000
    });

    mediaRecorder.ondataavailable = function (ev) {
      if (ev.data && ev.data.size > 0) {
        recordedChunks.push(ev.data);
      }
    };

    mediaRecorder.onstop = function () {
      const blob = new Blob(recordedChunks, { type: mimeType });
      const ext = mimeType.indexOf('mp4') !== -1 ? 'mp4' : 'webm';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `html-in-canvas-ad-${state.captureDuration}s.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      showToast(`Exported html-in-canvas-ad-${state.captureDuration}s.${ext} (${(blob.size / (1024 * 1024)).toFixed(2)} MB)!`, false);
    };

    state.isRecording = true;
    apiStatusDot.classList.add('recording');
    btnCapture.classList.add('is-recording');
    btnCapture.textContent = `⏹ Stop & Save Video (${state.captureDuration}s Recording...)`;
    showToast(`Recording ${state.captureDuration}s HTML-in-Canvas video + voiceover at 60fps...`, false);

    mediaRecorder.start(200);
    await startPlayback(0);
  }

  function finishVideoCapture() {
    pausePlayback();
    state.isRecording = false;
    apiStatusDot.classList.remove('recording');
    btnCapture.classList.remove('is-recording');
    btnCapture.textContent = `● Capture & Download Video (${state.captureDuration}s)`;

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }

  // ── Instant Non-Realtime Capture via Offscreen HTML-in-Canvas + WebCodecs + OfflineAudioContext ──
  function u32be(v) {
    return new Uint8Array([(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]);
  }

  function u16be(v) {
    return new Uint8Array([(v >>> 8) & 255, v & 255]);
  }

  function asciiBytes(str) {
    const out = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      out[i] = str.charCodeAt(i) & 0xff;
    }
    return out;
  }

  function concatUint8(arrays) {
    let total = 0;
    for (let i = 0; i < arrays.length; i++) {
      total += arrays[i].byteLength;
    }
    const out = new Uint8Array(total);
    let offset = 0;
    for (let i = 0; i < arrays.length; i++) {
      out.set(arrays[i], offset);
      offset += arrays[i].byteLength;
    }
    return out;
  }

  function mp4Box(type, children) {
    const body = children && children.length ? concatUint8(children) : new Uint8Array(0);
    return concatUint8([u32be(8 + body.byteLength), asciiBytes(type), body]);
  }

  function mp4FullBox(type, version, flags, children) {
    const vf = ((version & 0xff) << 24) | (flags & 0xffffff);
    const body = children && children.length ? concatUint8(children) : new Uint8Array(0);
    return mp4Box(type, [u32be(vf), body]);
  }

  async function renderOfflineAudioTrack(durationSec, sampleRate) {
    await ensureAudioInitialized();
    const totalFrames = Math.ceil(durationSec * sampleRate);
    const OfflineCtxClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OfflineCtxClass) return null;

    const offlineCtx = new OfflineCtxClass(2, totalFrames, sampleRate);
    if (!state.isMuted) {
      if (voiceoverBuffer) {
        const src = offlineCtx.createBufferSource();
        src.buffer = voiceoverBuffer;
        src.connect(offlineCtx.destination);
        src.start(0);
      }

      const freqs = [220, 277.18, 329.63, 392.0, 440.0, 523.25];
      for (let i = 0; i < SCENES.length; i++) {
        const sc = SCENES[i];
        if (sc.start >= durationSec) break;
        const baseFreq = freqs[(sc.id - 1) % freqs.length];
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq * 0.5, sc.start);
        osc.frequency.exponentialRampToValueAtTime(baseFreq, sc.start + 0.18);
        gain.gain.setValueAtTime(0.001, sc.start);
        gain.gain.linearRampToValueAtTime(0.06, sc.start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0008, sc.start + 0.65);
        osc.connect(gain);
        gain.connect(offlineCtx.destination);
        osc.start(sc.start);
        osc.stop(Math.min(durationSec, sc.start + 0.68));
      }
    }
    return offlineCtx.startRendering();
  }

  function muxMp4VideoAndAudio(opts) {
    const width = opts.width;
    const height = opts.height;
    const fps = opts.fps;
    const durationSec = opts.durationSec;
    const videoChunks = opts.videoChunks;
    const avcDescription = opts.avcDescription;
    const audioChunks = opts.audioChunks || [];
    const audioSampleRate = opts.audioSampleRate || 48000;
    const audioDescription = opts.audioDescription;

    const ftyp = mp4Box('ftyp', [
      asciiBytes('isom'),
      u32be(512),
      asciiBytes('isomiso2avc1mp41')
    ]);

    const mdatHeaderSize = 8;
    const videoStartOffset = ftyp.byteLength + mdatHeaderSize;

    const videoOffsets = [];
    const videoSizes = [];
    const syncSamples = [];
    const mdatParts = [];
    let runningOffset = videoStartOffset;

    for (let i = 0; i < videoChunks.length; i++) {
      const vc = videoChunks[i];
      videoOffsets.push(runningOffset);
      videoSizes.push(vc.data.byteLength);
      if (vc.isKey) {
        syncSamples.push(i + 1);
      }
      mdatParts.push(vc.data);
      runningOffset += vc.data.byteLength;
    }

    const audioOffsets = [];
    const audioSizes = [];
    for (let i = 0; i < audioChunks.length; i++) {
      const ac = audioChunks[i];
      audioOffsets.push(runningOffset);
      audioSizes.push(ac.data.byteLength);
      mdatParts.push(ac.data);
      runningOffset += ac.data.byteLength;
    }

    const mdat = mp4Box('mdat', mdatParts);

    const movieTimescale = 1000;
    const movieDuration = Math.round(durationSec * movieTimescale);
    const identityMatrix = concatUint8([
      u32be(0x00010000), u32be(0), u32be(0),
      u32be(0), u32be(0x00010000), u32be(0),
      u32be(0), u32be(0), u32be(0x40000000)
    ]);

    const mvhd = mp4FullBox('mvhd', 0, 0, [
      u32be(0),
      u32be(0),
      u32be(movieTimescale),
      u32be(movieDuration),
      u32be(0x00010000),
      u16be(0x0100),
      new Uint8Array(10),
      identityMatrix,
      new Uint8Array(24),
      u32be(audioChunks.length > 0 ? 3 : 2)
    ]);

    // Video Track (track_ID = 1)
    const videoTimescale = fps * 1000;
    const sampleDelta = 1000;
    const videoTrackDuration = videoChunks.length * sampleDelta;

    const videoTkhd = mp4FullBox('tkhd', 0, 3, [
      u32be(0),
      u32be(0),
      u32be(1),
      u32be(0),
      u32be(movieDuration),
      new Uint8Array(8),
      u16be(0),
      u16be(0),
      u16be(0),
      u16be(0),
      identityMatrix,
      u32be((width << 16) >>> 0),
      u32be((height << 16) >>> 0)
    ]);

    const videoMdhd = mp4FullBox('mdhd', 0, 0, [
      u32be(0),
      u32be(0),
      u32be(videoTimescale),
      u32be(videoTrackDuration),
      u16be(0x55c4),
      u16be(0)
    ]);

    const videoHdlr = mp4FullBox('hdlr', 0, 0, [
      u32be(0),
      asciiBytes('vide'),
      new Uint8Array(12),
      asciiBytes('VideoHandler\0')
    ]);

    const vmhd = mp4FullBox('vmhd', 0, 1, [u16be(0), new Uint8Array(6)]);
    const dref = mp4FullBox('dref', 0, 0, [
      u32be(1),
      mp4FullBox('url ', 0, 1, [])
    ]);
    const dinf = mp4Box('dinf', [dref]);

    const avcCBox = mp4Box('avcC', [avcDescription]);
    const avc1Box = mp4Box('avc1', [
      new Uint8Array(6),
      u16be(1),
      new Uint8Array(16),
      u16be(width),
      u16be(height),
      u32be(0x00480000),
      u32be(0x00480000),
      u32be(0),
      u16be(1),
      new Uint8Array(32),
      u16be(0x0018),
      u16be(0xffff),
      avcCBox
    ]);
    const videoStsd = mp4FullBox('stsd', 0, 0, [u32be(1), avc1Box]);
    const videoStts = mp4FullBox('stts', 0, 0, [
      u32be(1),
      u32be(videoChunks.length),
      u32be(sampleDelta)
    ]);
    const stssEntries = [u32be(syncSamples.length)];
    for (let i = 0; i < syncSamples.length; i++) {
      stssEntries.push(u32be(syncSamples[i]));
    }
    const videoStss = mp4FullBox('stss', 0, 0, stssEntries);
    const videoStsc = mp4FullBox('stsc', 0, 0, [
      u32be(1),
      u32be(1),
      u32be(1),
      u32be(1)
    ]);
    const stszEntries = [u32be(0), u32be(videoSizes.length)];
    for (let i = 0; i < videoSizes.length; i++) {
      stszEntries.push(u32be(videoSizes[i]));
    }
    const videoStsz = mp4FullBox('stsz', 0, 0, stszEntries);
    const stcoEntries = [u32be(videoOffsets.length)];
    for (let i = 0; i < videoOffsets.length; i++) {
      stcoEntries.push(u32be(videoOffsets[i]));
    }
    const videoStco = mp4FullBox('stco', 0, 0, stcoEntries);

    const videoStbl = mp4Box('stbl', [
      videoStsd,
      videoStts,
      videoStss,
      videoStsc,
      videoStsz,
      videoStco
    ]);
    const videoMinf = mp4Box('minf', [vmhd, dinf, videoStbl]);
    const videoMdia = mp4Box('mdia', [videoMdhd, videoHdlr, videoMinf]);
    const videoTrak = mp4Box('trak', [videoTkhd, videoMdia]);

    const moovChildren = [mvhd, videoTrak];

    // Optional Audio Track (track_ID = 2)
    if (audioChunks.length > 0) {
      const audioTkhd = mp4FullBox('tkhd', 0, 3, [
        u32be(0),
        u32be(0),
        u32be(2),
        u32be(0),
        u32be(movieDuration),
        new Uint8Array(8),
        u16be(0),
        u16be(0),
        u16be(0x0100),
        u16be(0),
        identityMatrix,
        u32be(0),
        u32be(0)
      ]);

      const audioTrackDuration = audioChunks.length * 1024;
      const audioMdhd = mp4FullBox('mdhd', 0, 0, [
        u32be(0),
        u32be(0),
        u32be(audioSampleRate),
        u32be(audioTrackDuration),
        u16be(0x55c4),
        u16be(0)
      ]);

      const audioHdlr = mp4FullBox('hdlr', 0, 0, [
        u32be(0),
        asciiBytes('soun'),
        new Uint8Array(12),
        asciiBytes('SoundHandler\0')
      ]);

      const smhd = mp4FullBox('smhd', 0, 0, [u16be(0), u16be(0)]);
      const audioDinf = mp4Box('dinf', [dref]);

      const asc =
        audioDescription && audioDescription.byteLength > 0
          ? audioDescription
          : new Uint8Array([0x11, 0x90]);

      const esdsPayload = concatUint8([
        new Uint8Array([0x03, 23 + asc.byteLength, 0x00, 0x02, 0x00]),
        new Uint8Array([0x04, 15 + asc.byteLength, 0x40, 0x15, 0x00, 0x00, 0x00]),
        u32be(128000),
        u32be(128000),
        new Uint8Array([0x05, asc.byteLength]),
        asc,
        new Uint8Array([0x06, 0x01, 0x02])
      ]);
      const esdsBox = mp4FullBox('esds', 0, 0, [esdsPayload]);

      const mp4aBox = mp4Box('mp4a', [
        new Uint8Array(6),
        u16be(1),
        new Uint8Array(8),
        u16be(2),
        u16be(16),
        u16be(0),
        u16be(0),
        u32be((audioSampleRate << 16) >>> 0),
        esdsBox
      ]);

      const audioStsd = mp4FullBox('stsd', 0, 0, [u32be(1), mp4aBox]);
      const audioStts = mp4FullBox('stts', 0, 0, [
        u32be(1),
        u32be(audioChunks.length),
        u32be(1024)
      ]);
      const audioStsc = mp4FullBox('stsc', 0, 0, [
        u32be(1),
        u32be(1),
        u32be(1),
        u32be(1)
      ]);
      const aStszEntries = [u32be(0), u32be(audioSizes.length)];
      for (let i = 0; i < audioSizes.length; i++) {
        aStszEntries.push(u32be(audioSizes[i]));
      }
      const audioStsz = mp4FullBox('stsz', 0, 0, aStszEntries);
      const aStcoEntries = [u32be(audioOffsets.length)];
      for (let i = 0; i < audioOffsets.length; i++) {
        aStcoEntries.push(u32be(audioOffsets[i]));
      }
      const audioStco = mp4FullBox('stco', 0, 0, aStcoEntries);

      const audioStbl = mp4Box('stbl', [
        audioStsd,
        audioStts,
        audioStsc,
        audioStsz,
        audioStco
      ]);
      const audioMinf = mp4Box('minf', [smhd, audioDinf, audioStbl]);
      const audioMdia = mp4Box('mdia', [audioMdhd, audioHdlr, audioMinf]);
      const audioTrak = mp4Box('trak', [audioTkhd, audioMdia]);
      moovChildren.push(audioTrak);
    }

    const moov = mp4Box('moov', moovChildren);
    return new Blob([ftyp, mdat, moov], { type: 'video/mp4' });
  }

  async function findSupportedAvcConfig(width, height, fps) {
    const codecs = [
      'avc1.64002a',
      'avc1.4d002a',
      'avc1.42002a',
      'avc1.4d0028',
      'avc1.420028'
    ];
    for (let i = 0; i < codecs.length; i++) {
      const cfg = {
        codec: codecs[i],
        width: width,
        height: height,
        bitrate: 10000000,
        framerate: fps,
        latencyMode: 'realtime',
        avc: { format: 'avc' }
      };
      try {
        const res = await VideoEncoder.isConfigSupported(cfg);
        if (res && res.supported) {
          return cfg;
        }
      } catch (_e) {
        // Try next profile
      }
    }
    return null;
  }

  async function startInstantVideoCapture() {
    if (state.isInstantRendering || state.isRecording) return;

    if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') {
      showToast('WebCodecs VideoEncoder is not available in this browser for instant offline export.', true);
      return;
    }

    const durationSec = state.captureDuration;
    const fps = 30;
    const totalFrames = Math.round(durationSec * fps);

    const videoConfig = await findSupportedAvcConfig(DESIGN_W, DESIGN_H, fps);
    if (!videoConfig) {
      showToast('Hardware H.264 WebCodecs encoder unavailable; use real-time Capture instead.', true);
      return;
    }

    state.isInstantRendering = true;
    btnInstantCapture.disabled = true;
    btnCapture.disabled = true;
    btnInstantCapture.classList.add('is-rendering');
    btnInstantCapture.textContent = '⚡ Rendering 0%...';
    showToast(`Rendering & encoding ${durationSec}s clip offscreen (no playback required)...`, false);

    try {
      syncDomSubtreeCard();

      // 1. Render full audio mix offline in milliseconds via OfflineAudioContext
      const audioSampleRate = 48000;
      const renderedAudioBuffer = await renderOfflineAudioTrack(durationSec, audioSampleRate);

      // 2. Encode AAC audio offline if supported and not muted
      const audioChunks = [];
      let audioDescription = null;
      if (renderedAudioBuffer && !state.isMuted && typeof AudioEncoder !== 'undefined' && typeof AudioData !== 'undefined') {
        const aacConfig = {
          codec: 'mp4a.40.2',
          sampleRate: audioSampleRate,
          numberOfChannels: 2,
          bitrate: 128000
        };
        let aacSupported = false;
        try {
          const sup = await AudioEncoder.isConfigSupported(aacConfig);
          aacSupported = Boolean(sup && sup.supported);
        } catch (_e) {
          aacSupported = false;
        }

        if (aacSupported) {
          const audioEncoder = new AudioEncoder({
            output: function (chunk, meta) {
              if (meta && meta.decoderConfig && meta.decoderConfig.description && !audioDescription) {
                audioDescription = new Uint8Array(meta.decoderConfig.description);
              }
              const buf = new Uint8Array(chunk.byteLength);
              chunk.copyTo(buf);
              audioChunks.push({ data: buf, timestamp: chunk.timestamp });
            },
            error: function () {}
          });
          audioEncoder.configure(aacConfig);

          const ch0 = renderedAudioBuffer.getChannelData(0);
          const ch1 = renderedAudioBuffer.getChannelData(1);
          const packetSize = 1024;
          for (let offset = 0; offset + packetSize <= renderedAudioBuffer.length; offset += packetSize) {
            const planar = new Float32Array(packetSize * 2);
            planar.set(ch0.subarray(offset, offset + packetSize), 0);
            planar.set(ch1.subarray(offset, offset + packetSize), packetSize);
            const ad = new AudioData({
              format: 'f32-planar',
              sampleRate: audioSampleRate,
              numberOfFrames: packetSize,
              numberOfChannels: 2,
              timestamp: Math.round((offset / audioSampleRate) * 1000000),
              data: planar
            });
            audioEncoder.encode(ad);
            ad.close();
          }
          await audioEncoder.flush();
          audioEncoder.close();
        }
      }

      // 3. Render & encode all video frames on an offscreen canvas without disturbing on-screen state
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = DESIGN_W;
      offscreenCanvas.height = DESIGN_H;
      const offscreenCtx = offscreenCanvas.getContext('2d');

      const videoChunks = [];
      let avcDescription = null;

      const videoEncoder = new VideoEncoder({
        output: function (chunk, meta) {
          if (meta && meta.decoderConfig && meta.decoderConfig.description && !avcDescription) {
            avcDescription = new Uint8Array(meta.decoderConfig.description);
          }
          const buf = new Uint8Array(chunk.byteLength);
          chunk.copyTo(buf);
          videoChunks.push({
            data: buf,
            isKey: chunk.type === 'key',
            timestamp: chunk.timestamp
          });
        },
        error: function () {}
      });
      videoEncoder.configure(videoConfig);

      const frameDurationUs = Math.round(1000000 / fps);

      for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
        const t = (frameIdx / fps);

        // Render deterministically onto offscreenCtx while preserving mainCtx on screen
        ctx = offscreenCtx;
        renderSceneToCanvas(t);
        ctx = mainCtx;

        const timestampUs = Math.round((frameIdx / fps) * 1000000);
        const vFrame = new VideoFrame(offscreenCanvas, {
          timestamp: timestampUs,
          duration: frameDurationUs
        });
        videoEncoder.encode(vFrame, { keyFrame: frameIdx % fps === 0 });
        vFrame.close();

        if (frameIdx % 15 === 0) {
          const pct = Math.round(((frameIdx + 1) / totalFrames) * 100);
          btnInstantCapture.textContent = `⚡ Rendering ${pct}%...`;
          while (videoEncoder.encodeQueueSize > 16) {
            await new Promise((r) => setTimeout(r, 4));
          }
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      btnInstantCapture.textContent = '⚡ Finalizing MP4...';
      await videoEncoder.flush();
      videoEncoder.close();

      if (!avcDescription || videoChunks.length === 0) {
        throw new Error('No video chunks produced by encoder');
      }

      const mp4Blob = muxMp4VideoAndAudio({
        width: DESIGN_W,
        height: DESIGN_H,
        fps: fps,
        durationSec: durationSec,
        videoChunks: videoChunks,
        avcDescription: avcDescription,
        audioChunks: audioChunks,
        audioSampleRate: audioSampleRate,
        audioDescription: audioDescription
      });

      const url = URL.createObjectURL(mp4Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `html-in-canvas-instant-${durationSec}s.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      showToast(
        `Instant export complete: html-in-canvas-instant-${durationSec}s.mp4 (${(mp4Blob.size / (1024 * 1024)).toFixed(2)} MB)!`,
        false
      );
    } catch (_err) {
      ctx = mainCtx;
      showToast('Instant offline export encountered an encoder error; please try Capture & Download.', true);
    } finally {
      ctx = mainCtx;
      state.isInstantRendering = false;
      btnInstantCapture.disabled = false;
      btnCapture.disabled = false;
      btnInstantCapture.classList.remove('is-rendering');
      btnInstantCapture.textContent = `⚡ Instant Download (${state.captureDuration}s)`;
    }
  }

  // ── Event Listeners & Strict Input Validation ──────────────────────
  function bindEvents() {
    btnPlayPause.addEventListener('click', function () {
      if (state.isPlaying) {
        pausePlayback();
      } else {
        startPlayback();
      }
    });

    btnRestart.addEventListener('click', function () {
      startPlayback(0);
    });

    btnMute.addEventListener('click', function () {
      state.isMuted = !state.isMuted;
      if (masterGainNode && audioCtx) {
        masterGainNode.gain.setValueAtTime(state.isMuted ? 0 : 1, audioCtx.currentTime);
      }
      btnMute.textContent = state.isMuted ? '🔇 Voice & SFX: MUTED' : '🔊 Voice & SFX: ON';
    });

    btnCapture.addEventListener('click', function () {
      startVideoCapture();
    });

    if (btnInstantCapture) {
      btnInstantCapture.addEventListener('click', function () {
        startInstantVideoCapture();
      });
    }

    scrubber.addEventListener('input', function () {
      const val = clamp(parseFloat(scrubber.value) || 0, 0, TOTAL_DURATION);
      state.currentTime = val;
      if (state.isPlaying) {
        startVoiceoverAt(val);
      }
      renderFrame(val);
    });

    // Scene Jump Buttons
    const jumpBtns = scenePillsContainer.querySelectorAll('.scene-jump-btn');
    jumpBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const startSec = clamp(parseFloat(btn.getAttribute('data-scene-start')) || 0, 0, TOTAL_DURATION);
        state.currentTime = startSec;
        if (state.isPlaying) {
          startVoiceoverAt(startSec);
        }
        renderFrame(startSec);
      });
    });

    // Live Typography Scale Control (Validated float [0.75, 1.40])
    inputTextScale.addEventListener('input', function () {
      const scaleVal = clamp(parseFloat(inputTextScale.value) || 1.0, 0.75, 1.40);
      state.textScale = scaleVal;
      badgeTextScale.textContent = `${Math.round(scaleVal * 100)}%`;
      syncDomSubtreeCard();
      renderFrame(state.currentTime);
    });

    // Live Custom Headline Input (Sanitized plain text, max 44 chars)
    inputCustomHeadline.addEventListener('input', function () {
      const raw = String(inputCustomHeadline.value || '').replace(/[\u0000-\u001F\u007F]/g, '');
      state.customHeadline = raw.slice(0, 44) || 'Design with CSS. Render with Shaders.';
      syncDomSubtreeCard();
      renderFrame(state.currentTime);
    });

    // Live Shader & 3D FX Intensity Control (Validated float [0.0, 1.8])
    inputFxIntensity.addEventListener('input', function () {
      const fxVal = clamp(parseFloat(inputFxIntensity.value) || 0, 0.0, 1.8);
      state.fxIntensity = fxVal;
      badgeFxIntensity.textContent = `${Math.round(fxVal * 100)}%`;
      renderFrame(state.currentTime);
    });

    // Capture Duration Control (Validated int [5, 30])
    inputCaptureDuration.addEventListener('input', function () {
      const dur = clamp(parseInt(inputCaptureDuration.value, 10) || 30, 5, 30);
      state.captureDuration = dur;
      badgeCaptureDuration.textContent = dur === 30 ? 'Full 30s' : `First ${dur}s`;
      if (!state.isRecording) {
        btnCapture.textContent = `● Capture & Download Video (${dur}s)`;
      }
      if (btnInstantCapture && !state.isInstantRendering) {
        btnInstantCapture.textContent = `⚡ Instant Download (${dur}s)`;
      }
    });

    // Allow-listed Theme Switcher
    const themeBtns = themeGrid.querySelectorAll('.theme-btn');
    themeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const candidate = btn.getAttribute('data-theme');
        if (!Object.prototype.hasOwnProperty.call(THEMES, candidate)) return;
        state.themeKey = candidate;
        badgeThemeName.textContent = THEMES[candidate].name;
        themeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        syncDomSubtreeCard();
        renderFrame(state.currentTime);
      });
    });
  }

  // ── Initialization ─────────────────────────────────────────────────
  function init() {
    detectHtmlInCanvas();
    syncDomSubtreeCard();
    bindEvents();
    renderFrame(0);
    requestAnimationFrame(tick);
  }

  init();
})();
