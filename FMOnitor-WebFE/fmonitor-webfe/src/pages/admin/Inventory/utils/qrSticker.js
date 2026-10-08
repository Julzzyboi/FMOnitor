import QRCodeStyling from 'qr-code-styling'
import logo from '../../../../assets/logo.png'
import { formatItemId } from './itemId'

// What a sticker's QR code holds: the item ID exactly as printed under it
// (e.g. "FMO-INV-0042"), so any phone camera shows something meaningful and
// the mobile app can look the item up from it.
export function qrPayload(item) {
  return formatItemId(item.id)
}

export const DOT_STYLES = [
  ['square', 'Square'],
  ['rounded', 'Rounded'],
  ['extra-rounded', 'Extra rounded'],
  ['dots', 'Dots'],
  ['classy', 'Classy'],
  ['classy-rounded', 'Classy rounded'],
]

// Dot styles that still scan reliably with the logo covering the middle.
// Tested by decoding every style/corner/size combination: Dots, Classy and
// Classy rounded failed with the logo at 2in and 3in, so for those the logo
// is left out.
const LOGO_SAFE_DOT_STYLES = ['square', 'rounded', 'extra-rounded']

export function logoAllowed(design) {
  return LOGO_SAFE_DOT_STYLES.includes(design.dotStyle)
}

export function logoShown(design) {
  return design.showLogo && logoAllowed(design)
}

// No "Rounded" (extra-rounded) corners: decoding every finished sticker
// showed they failed with longer IDs at 2in/3in, while Square and Circle
// passed every case.
export const CORNER_STYLES = [
  ['square', 'Square'],
  ['dot', 'Circle'],
]

// Dark enough on white for any phone to scan.
export const COLOR_PRESETS = [
  ['#111827', 'Black'],
  ['#1e3a8a', 'Navy'],
  ['#14532d', 'Green'],
  ['#7f1d1d', 'Maroon'],
  ['#6b4e00', 'FMO Gold'],
]

// The frame is decoration around the code, not part of it, so light colours
// like yellow are fine here.
export const FRAME_COLOR_PRESETS = [
  ['#f2a30f', 'FMO Gold'],
  ['#fccb35', 'FMO Yellow'],
  ['#111827', 'Black'],
  ['#1e3a8a', 'Navy'],
  ['#7f1d1d', 'Maroon'],
]

// Physical sticker width/height in inches (square stickers).
export const STICKER_SIZES = [
  ['1.5', 'Small · 1.5 in (38 mm)'],
  ['2', 'Medium · 2 in (51 mm)'],
  ['3', 'Large · 3 in (76 mm)'],
]

export const DEFAULT_DESIGN = {
  dotStyle: 'square',
  cornerStyle: 'square',
  color: '#111827',
  cornerColor: '#111827',
  showLogo: true,
  showFrame: true,
  frameColor: '#f2a30f',
  size: '2',
}

const STORAGE_KEY = 'fmonitor.qrStickerDesign'

// The design is shared by every item's sticker, so it's remembered per browser.
export function loadDesign() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!saved) return DEFAULT_DESIGN
    const design = { ...DEFAULT_DESIGN, ...saved }
    // A design saved before an option was removed falls back to the default.
    if (!CORNER_STYLES.some(([value]) => value === design.cornerStyle)) design.cornerStyle = DEFAULT_DESIGN.cornerStyle
    return design
  } catch {
    return DEFAULT_DESIGN
  }
}

export function saveDesign(design) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(design))
  } catch {
    // Private mode / storage blocked - the design just isn't remembered.
  }
}

// WCAG contrast of a hex colour against white. QR scanners need strong
// contrast; below ~4:1 some phones struggle to read the code.
export function contrastOnWhite(hex) {
  const channels = hex
    .replace('#', '')
    .match(/.{2}/g)
    .map((c) => {
      const v = parseInt(c, 16) / 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    })
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  return 1.05 / (luminance + 0.05)
}
export const MIN_SCAN_CONTRAST = 4

// A sticker is the QR code with the item ID under it, optionally inside a
// thick rounded frame. Proportions are fractions of the sticker's width,
// shared by the on-screen preview, the print sheet and the PNG so all three
// match; the QR gets all the height the frame and ID line leave free.
export function stickerLayout(design) {
  const base = { lineHeight: 1.15, idGap: 0.025, id: 0.075 }
  const textHeight = base.idGap + base.id * base.lineHeight
  if (design.showFrame) {
    // `inset` is the white gap between frame and code - scanners need that
    // quiet zone to find where the code starts.
    const border = 0.045
    const inset = 0.065
    return { ...base, border, inset, radius: 0.13, qr: 1 - (border + inset) * 2 - textHeight }
  }
  const inset = 0.05
  return { ...base, border: 0, inset, radius: 0.06, qr: 1 - inset * 2 - textHeight - 0.02 }
}

// Share of the code's width the centre logo covers.
const LOGO_SIZE = 0.24

export function qrOptions(item, design, pixelSize) {
  const withLogo = logoShown(design)
  return {
    width: pixelSize,
    height: pixelSize,
    type: 'canvas',
    data: qrPayload(item),
    margin: 0,
    // H (30% recovery) leaves room for the logo covering the middle.
    qrOptions: { errorCorrectionLevel: withLogo ? 'H' : 'Q' },
    image: withLogo ? logo : undefined,
    imageOptions: { hideBackgroundDots: true, imageSize: LOGO_SIZE, margin: 4, crossOrigin: 'anonymous' },
    dotsOptions: { type: design.dotStyle, color: design.color },
    cornersSquareOptions: { type: design.cornerStyle, color: design.cornerColor },
    cornersDotOptions: { type: design.cornerStyle === 'square' ? 'square' : 'dot', color: design.cornerColor },
    backgroundOptions: { color: '#ffffff' },
  }
}

export function createQr(item, design, pixelSize) {
  return new QRCodeStyling(qrOptions(item, design, pixelSize))
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Print-quality QR image: 300 dpi at the chosen sticker size.
async function qrDataUrl(item, design) {
  const pixels = Math.round(Number(design.size) * 300)
  const blob = await createQr(item, design, pixels).getRawData('png')
  return blobToDataUrl(blob)
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

function stickerHtml(item, qrSrc) {
  return `<div class="sticker"><img class="qr" src="${qrSrc}" alt=""><div class="id">${escapeHtml(formatItemId(item.id))}</div></div>`
}

// Prints `copies` stickers on as few pages as possible, each with a dashed
// cut line, via a hidden iframe so the app page itself isn't affected.
export async function printStickers(item, design, copies) {
  const qrSrc = await qrDataUrl(item, design)
  const size = Number(design.size)
  const L = stickerLayout(design)
  const sticker = stickerHtml(item, qrSrc)
  // With a frame the frame itself is the cut guide; without one, a thin
  // dashed line marks where to cut.
  const outline = design.showFrame
    ? `border: ${size * L.border}in solid ${design.frameColor};`
    : 'border: 1px dashed #9ca3af;'

  const html = `<!doctype html><html><head><meta charset="utf-8">
<title>${escapeHtml(formatItemId(item.id))} stickers</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet">
<style>
  @page { margin: 0.4in; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Montserrat', Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { display: flex; flex-wrap: wrap; gap: 0.12in; }
  .sticker {
    width: ${size}in; height: ${size}in; padding: ${size * L.inset}in; background: #ffffff;
    ${outline} border-radius: ${size * L.radius}in;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    break-inside: avoid; page-break-inside: avoid; text-align: center; overflow: hidden;
  }
  .sticker > * { flex-shrink: 0; line-height: ${L.lineHeight}; max-width: 100%; }
  .qr { width: ${size * L.qr}in; height: ${size * L.qr}in; }
  .id { margin-top: ${size * L.idGap}in; font-size: ${size * L.id}in; font-weight: 800; letter-spacing: 0.04em; color: #111827; }
</style></head>
<body><div class="sheet">${Array.from({ length: copies }, () => sticker).join('')}</div></body></html>`

  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument
  doc.open()
  doc.write(html)
  doc.close()

  const win = iframe.contentWindow
  await new Promise((resolve) => (win.document.readyState === 'complete' ? resolve() : win.addEventListener('load', resolve)))
  // Give the web font a moment so the ID doesn't print in a fallback font.
  await Promise.race([win.document.fonts?.ready, new Promise((r) => setTimeout(r, 1500))])

  const cleanup = () => setTimeout(() => iframe.remove(), 500)
  win.addEventListener('afterprint', cleanup, { once: true })
  win.focus()
  win.print()
  setTimeout(cleanup, 60000)
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text
  let cut = text
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1)
  return `${cut}…`
}

// One sticker drawn on a canvas at 300 dpi, laid out like the printed one.
// Corners outside the rounded frame stay transparent.
export async function renderStickerCanvas(item, design) {
  const px = Math.round(Number(design.size) * 300)
  const qrImg = await loadImage(await qrDataUrl(item, design))
  const L = stickerLayout(design)
  await document.fonts?.load(`800 ${px * L.id}px Montserrat`).catch(() => {})

  const canvas = document.createElement('canvas')
  canvas.width = px
  canvas.height = px
  const ctx = canvas.getContext('2d')

  const radius = px * L.radius
  const border = px * L.border
  if (design.showFrame) {
    ctx.fillStyle = design.frameColor
    ctx.beginPath()
    ctx.roundRect(0, 0, px, px, radius)
    ctx.fill()
  }
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(border, border, px - border * 2, px - border * 2, Math.max(0, radius - border))
  ctx.fill()

  const qrSize = px * L.qr
  const idSize = px * L.id
  const idBox = idSize * L.lineHeight

  // QR + gap + ID line, centred inside the frame.
  let y = (px - (qrSize + px * L.idGap + idBox)) / 2
  ctx.drawImage(qrImg, (px - qrSize) / 2, y, qrSize, qrSize)
  y += qrSize + px * L.idGap
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.font = `800 ${idSize}px Montserrat, Arial, sans-serif`
  ctx.fillStyle = '#111827'
  // Centre the glyphs in their line box, like CSS line-height does.
  const maxTextWidth = px - (border + px * L.inset) * 2
  ctx.fillText(fitText(ctx, formatItemId(item.id), maxTextWidth), px / 2, y + (idBox - idSize) / 2)
  return canvas
}

export async function downloadStickerPng(item, design) {
  const canvas = await renderStickerCanvas(item, design)
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = `${formatItemId(item.id)}-sticker.png`
  a.click()
}
