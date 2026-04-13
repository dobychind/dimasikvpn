'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/* ═══════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════ */

const NAV_ITEMS = [
  { label: 'Возможности', href: '#features' },
  { label: 'Тарифы', href: '#pricing' },
  { label: 'Установка', href: '#setup' },
  { label: 'Подключиться', href: '#connect' },
]

const FEATURES = [
  {
    num: '01',
    title: 'VLESS + Reality',
    desc: 'Трафик неотличим от обычного TLS. Не блокируется DPI-фильтрами.',
  },
  {
    num: '02',
    title: 'Скорость без потерь',
    desc: 'Сервер во Франкфурте на канале 25 Гбит/с. Стриминг, игры, звонки — без лагов.',
  },
  {
    num: '03',
    title: 'Нулевые логи',
    desc: 'Никаких журналов. Ваш трафик — только ваше дело.',
  },
]

type Platform = 'ios' | 'android' | 'windows' | 'macos'

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'ios', label: 'iOS' },
  { id: 'android', label: 'Android' },
  { id: 'windows', label: 'Windows' },
  { id: 'macos', label: 'macOS' },
]

const GUIDES: Record<
  Platform,
  { app: string; desc: string; links: { label: string; url: string }[]; steps: string[] }
> = {
  ios: {
    app: 'Streisand / V2Box',
    desc: 'Streisand и V2Box удалены из российского App Store. Ниже — как установить.',
    links: [
      { label: 'Streisand', url: 'https://apps.apple.com/app/streisand/id6450534064' },
      { label: 'V2Box', url: 'https://apps.apple.com/app/v2box-v2ray-client/id6446814690' },
    ],
    steps: [
      'Смените регион Apple ID на любой другой (например, США или Казахстан) — в настройках Apple ID \u2192 Медиа и покупки \u2192 Страна/регион. После скачивания можно вернуть обратно.',
      'Если приложение уже было установлено — оно продолжит работать. Просто обновите подписку.',
      'Скопируйте subscription-ссылку \u2192 в приложении + \u2192 Добавить подписку \u2192 вставьте ссылку \u2192 подключайтесь.',
    ],
  },
  android: {
    app: 'V2rayNG',
    desc: 'Открытый клиент для Android. Стабильный и бесплатный.',
    links: [
      { label: 'Google Play', url: 'https://play.google.com/store/apps/details?id=com.v2ray.ang' },
      { label: 'GitHub APK', url: 'https://github.com/2dust/v2rayNG/releases' },
    ],
    steps: [
      'Установите V2rayNG из Google Play или скачайте APK',
      'Меню \u2192 Подписки \u2192 + \u2192 вставьте ссылку \u2192 Обновить',
      'Выберите сервер и нажмите кнопку подключения',
    ],
  },
  windows: {
    app: 'Hiddify',
    desc: 'Современный клиент с красивым интерфейсом. Открытый код.',
    links: [{ label: 'GitHub', url: 'https://github.com/hiddify/hiddify-app/releases' }],
    steps: [
      'Скачайте Hiddify с GitHub и установите',
      'New Profile \u2192 вставьте subscription-ссылку \u2192 сохраните',
      'Выберите сервер и нажмите Connect',
    ],
  },
  macos: {
    app: 'Streisand / Hiddify',
    desc: 'Streisand для Mac или Hiddify — кроссплатформенный клиент.',
    links: [
      { label: 'Streisand', url: 'https://apps.apple.com/app/streisand/id6450534064' },
      { label: 'Hiddify', url: 'https://github.com/hiddify/hiddify-app/releases' },
    ],
    steps: [
      'Скачайте Streisand из Mac App Store (если доступен) или Hiddify с GitHub',
      '+ \u2192 Добавить подписку \u2192 вставьте subscription-ссылку',
      'Выберите конфигурацию и включите VPN',
    ],
  },
}

/* ═══════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════ */

/* ── Text Scramble / Decrypt Effect ──────────────────── */

function TextScramble({
  text,
  delay = 0,
  className,
}: {
  text: string
  delay?: number
  className?: string
}) {
  const [display, setDisplay] = useState('')
  const scrambleChars = '0123456789ABCDEF:;<>=?'

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    let interval: ReturnType<typeof setInterval>
    let locked = 0

    timeout = setTimeout(() => {
      interval = setInterval(() => {
        const next = text
          .split('')
          .map((char, i) => {
            if (char === ' ') return ' '
            if (i < locked) return char
            return scrambleChars[Math.floor(Math.random() * scrambleChars.length)]
          })
          .join('')

        setDisplay(next)
        locked += 0.8

        if (locked >= text.length) {
          clearInterval(interval)
          setDisplay(text)
        }
      }, 35)
    }, delay)

    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
  }, [text, delay, scrambleChars])

  return <span className={className}>{display || '\u00A0'}</span>
}

/* ── Particle Globe (Canvas) ─────────────────────────── */

const ParticleGlobe = memo(function ParticleGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let angle = 0

    const N = 90
    const golden = (1 + Math.sqrt(5)) / 2
    const basePoints: [number, number, number][] = []

    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const theta = 2 * Math.PI * golden * i
      basePoints.push([Math.cos(theta) * r, y, Math.sin(theta) * r])
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas!.getBoundingClientRect()
      canvas!.width = rect.width * dpr
      canvas!.height = rect.height * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function draw() {
      const rect = canvas!.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      ctx!.clearRect(0, 0, w, h)

      angle += 0.0018
      const cosA = Math.cos(angle)
      const sinA = Math.sin(angle)
      const tiltCos = Math.cos(0.3)
      const tiltSin = Math.sin(0.3)

      const projected = basePoints.map(([x, y, z]) => {
        const rx = x * cosA - z * sinA
        const rz = x * sinA + z * cosA
        const ry2 = y * tiltCos - rz * tiltSin
        const rz2 = y * tiltSin + rz * tiltCos

        const fov = 2.8
        const scale = fov / (fov + rz2)
        return {
          px: rx * scale * (w * 0.34) + w * 0.5,
          py: ry2 * scale * (h * 0.34) + h * 0.48,
          z: rz2,
          scale,
        }
      })

      // Sort back-to-front
      const sorted = [...projected].sort((a, b) => a.z - b.z)

      // Draw connections
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const dx = sorted[i].px - sorted[j].px
          const dy = sorted[i].py - sorted[j].py
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 85) {
            const depthAlpha = ((sorted[i].z + sorted[j].z) / 2 + 1) / 2
            const distAlpha = 1 - dist / 85
            const alpha = distAlpha * depthAlpha * 0.12
            ctx!.strokeStyle = `rgba(52, 211, 153, ${alpha})`
            ctx!.lineWidth = 0.6
            ctx!.beginPath()
            ctx!.moveTo(sorted[i].px, sorted[i].py)
            ctx!.lineTo(sorted[j].px, sorted[j].py)
            ctx!.stroke()
          }
        }
      }

      // Draw dots
      for (const p of sorted) {
        const alpha = (p.z + 1) / 2 * 0.65 + 0.12
        const size = Math.max(1, p.scale * 2.2)
        ctx!.fillStyle = `rgba(52, 211, 153, ${alpha})`
        ctx!.beginPath()
        ctx!.arc(p.px, p.py, size, 0, Math.PI * 2)
        ctx!.fill()

        // Glow for front-facing dots
        if (p.z > 0.4) {
          ctx!.fillStyle = `rgba(52, 211, 153, ${(p.z - 0.4) * 0.08})`
          ctx!.beginPath()
          ctx!.arc(p.px, p.py, size * 4, 0, Math.PI * 2)
          ctx!.fill()
        }
      }

      animId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="hero-globe" />
})

/* ── Magnetic Button ─────────────────────────────────── */

function MagneticButton({
  children,
  className,
  href,
  onClick,
  disabled,
  type,
}: {
  children: React.ReactNode
  className?: string
  href?: string
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
  type?: 'submit' | 'button'
}) {
  const ref = useRef<HTMLElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 180, damping: 18 })
  const springY = useSpring(y, { stiffness: 180, damping: 18 })

  const handleMouse = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      x.set((e.clientX - rect.left - rect.width / 2) * 0.2)
      y.set((e.clientY - rect.top - rect.height / 2) * 0.2)
    },
    [x, y]
  )

  const reset = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])

  const props = {
    ref: ref as React.Ref<HTMLAnchorElement & HTMLButtonElement>,
    className,
    onMouseMove: handleMouse,
    onMouseLeave: reset,
    style: { x: springX, y: springY },
  }

  if (href) {
    return (
      <motion.a href={href} {...props}>
        {children}
      </motion.a>
    )
  }

  return (
    <motion.button type={type} disabled={disabled} onClick={onClick} {...props}>
      {children}
    </motion.button>
  )
}

/* ── Spring Reveal Defaults ──────────────────────────── */

const springTransition = {
  type: 'spring' as const,
  stiffness: 70,
  damping: 22,
}

/* ═══════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════ */

export default function Home() {
  const [platform, setPlatform] = useState<Platform>('ios')
  const [username, setUsername] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    subscriptionUrl: string
    message: string
  } | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [navScrolled, setNavScrolled] = useState(false)

  const guide = GUIDES[platform]

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, inviteCode }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Ошибка регистрации')
        return
      }

      setResult({
        subscriptionUrl: data.user.subscriptionUrl,
        message: data.message,
      })

      window.location.href = data.user.subscriptionUrl
    } catch {
      setError('Не удалось подключиться к серверу')
    } finally {
      setLoading(false)
    }
  }

  function copyUrl() {
    if (!result) return
    navigator.clipboard.writeText(result.subscriptionUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* ── Navigation ────────────────────────────────── */}
      <nav className={`nav ${navScrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="nav-inner">
            <a href="#" className="nav-logo">
              <div className="nav-monogram">D</div>
              <span className="nav-brand">DimasikVPN</span>
            </a>
            <div className="nav-links">
              {NAV_ITEMS.map((item) => (
                <a key={item.href} href={item.href} className="nav-link">
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ...springTransition }}
          >
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              VLESS + REALITY // FRANKFURT
            </div>
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ...springTransition }}
          >
            <span className="hero-title-line">
              <TextScramble text="Интернет" delay={500} />
            </span>
            <span className="hero-title-line">
              <TextScramble text="без " delay={800} />
              <TextScramble
                text="границ"
                delay={950}
                className="hero-title-accent"
              />
            </span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, ...springTransition }}
          >
            Быстрый VPN на базе VLESS + Reality. Не определяется DPI,
            работает там, где другие не могут. Настройка за 2 минуты.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, ...springTransition }}
          >
            <MagneticButton href="#connect" className="btn-primary">
              Получить конфиг
            </MagneticButton>
            <a href="#setup" className="btn-ghost">
              Как подключиться
            </a>
          </motion.div>
        </div>

        <motion.div
          className="hero-globe-wrapper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1.5 }}
        >
          <ParticleGlobe />
        </motion.div>
      </section>

      {/* ── Stats ─────────────────────────────────────── */}
      <div className="container">
        <div className="stats-bar">
          {[
            { num: '25', label: 'Гбит/с канал' },
            { num: '<15', label: 'мс до EU' },
            { num: '99.9%', label: 'Аптайм' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              className="stat"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.1, ...springTransition }}
            >
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Features ──────────────────────────────────── */}
      <section id="features" className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={springTransition}
          >
            <div className="section-label">Возможности</div>
            <h2 className="section-title">
              Почему
              <br />
              DimasikVPN
            </h2>
            <p className="section-desc">
              Современный протокол, который маскируется под обычный
              HTTPS-трафик. Невидим для блокировок.
            </p>
          </motion.div>

          <div className="features-list">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.num}
                className="feature-row"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.08, ...springTransition }}
              >
                <span className="feature-num">{f.num}</span>
                <h3 className="feature-name">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────── */}
      <section id="pricing" className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={springTransition}
          >
            <div className="section-label">Тарифы</div>
            <h2 className="section-title">Просто и честно</h2>
            <p className="section-desc">
              Бесплатно для друзей и знакомых. Нужен инвайт-код.
            </p>
          </motion.div>

          <motion.div
            className="price-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: 0.1, ...springTransition }}
          >
            <div className="price-label">Friends & Family</div>
            <div className="price-amount">
              0<span className="price-currency"> &#8381;</span>
            </div>
            <div className="price-period">бесплатно по инвайту</div>
            <ul className="price-features-list">
              {[
                'VLESS + Reality протокол',
                'Все платформы',
                'Автообновление конфига',
                'Поддержка в Telegram',
              ].map((f) => (
                <li key={f} className="price-feature">
                  <span className="price-check">+</span>
                  {f}
                </li>
              ))}
            </ul>
            <MagneticButton href="#connect" className="btn-primary full">
              Получить доступ
            </MagneticButton>
          </motion.div>
        </div>
      </section>

      {/* ── Setup ─────────────────────────────────────── */}
      <section id="setup" className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={springTransition}
          >
            <div className="section-label">Установка</div>
            <h2 className="section-title">Подключение за 2 минуты</h2>
            <p className="section-desc">
              Выберите платформу и следуйте инструкции.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: 0.1, ...springTransition }}
          >
            <div className="platforms">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`platform-tab ${platform === p.id ? 'active' : ''}`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="guide-panel">
              <h3 className="guide-title">{guide.app}</h3>
              <p className="guide-desc">{guide.desc}</p>

              <div className="download-links">
                {guide.links.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-btn"
                  >
                    <span className="download-arrow">&darr;</span>
                    {l.label}
                  </a>
                ))}
              </div>

              {guide.steps.map((step, i) => (
                <div key={i} className="step">
                  <div className="step-num">{i + 1}</div>
                  <p className="step-text">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Connect ───────────────────────────────────── */}
      <section id="connect" className="section">
        <div className="container">
          <motion.div
            className="connect-box"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={springTransition}
          >
            <div className="section-label">Подключиться</div>
            <h2
              className="section-title"
              style={{ fontSize: 28, marginBottom: 8, textAlign: 'center' }}
            >
              Получите конфиг
            </h2>
            <p
              className="hint-text"
              style={{ marginBottom: 28, marginTop: 0 }}
            >
              Введите никнейм и инвайт-код — мы создадим вашу
              subscription-ссылку.
            </p>

            <form onSubmit={handleRegister}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Никнейм (латиница)"
                  className="input-field"
                  required
                />
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Инвайт-код"
                  className="input-field"
                  required
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <MagneticButton
                  type="submit"
                  disabled={loading}
                  className="btn-primary full"
                >
                  {loading ? 'Создаём...' : 'Получить конфиг'}
                </MagneticButton>
              </div>
            </form>

            {error && <p className="error-text">{error}</p>}

            {result && (
              <motion.div
                className="result-box"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springTransition}
              >
                <p className="result-message">{result.message}</p>
                <div className="code-block">
                  <code>{result.subscriptionUrl}</code>
                </div>
                <button onClick={copyUrl} className="copy-btn">
                  {copied ? 'Скопировано' : 'Скопировать ссылку'}
                </button>
                <p className="hint-text">
                  Вставьте эту ссылку в VPN-клиент (инструкция выше).
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="footer">
        <div className="container">
          <p className="footer-text">
            DimasikVPN &copy; 2026 — Сделано с вниманием к приватности
          </p>
        </div>
      </footer>
    </>
  )
}
