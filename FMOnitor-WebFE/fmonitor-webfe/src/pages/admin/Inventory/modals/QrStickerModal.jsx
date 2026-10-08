import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faPrint, faDownload, faTriangleExclamation, faRotateLeft, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { formatItemId } from '../utils/itemId'
import {
  COLOR_PRESETS,
  FRAME_COLOR_PRESETS,
  CORNER_STYLES,
  DEFAULT_DESIGN,
  DOT_STYLES,
  MIN_SCAN_CONTRAST,
  STICKER_SIZES,
  contrastOnWhite,
  createQr,
  downloadStickerPng,
  loadDesign,
  logoAllowed,
  logoShown,
  printStickers,
  qrOptions,
  saveDesign,
  stickerLayout,
} from '../utils/qrSticker'

const PREVIEW_PX = 260
const MAX_COPIES = 100

const labelClass = 'text-[10px] font-semibold uppercase tracking-wide text-gray-400'
const selectClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#fccb35] focus:outline-none focus:ring-2 focus:ring-[#fccb35]/30'

// `checkContrast` is off for the frame - it's decoration, not part of the code.
function ColorPicker({ label, value, onChange, presets = COLOR_PRESETS, checkContrast = true }) {
  const lowContrast = checkContrast && contrastOnWhite(value) < MIN_SCAN_CONTRAST
  return (
    <div className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map(([hex, name]) => (
          <button
            key={hex}
            type="button"
            onClick={() => onChange(hex)}
            title={name}
            aria-label={name}
            aria-pressed={value === hex}
            className={`h-7 w-7 cursor-pointer rounded-full ring-offset-2 transition-shadow duration-150 ${
              value === hex ? 'ring-2 ring-[#fccb35]' : 'hover:ring-2 hover:ring-gray-200'
            }`}
            style={{ backgroundColor: hex }}
          />
        ))}
        <label
          title="Custom colour"
          className="relative flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-gray-300 text-[10px] font-bold text-gray-400 hover:border-gray-400"
        >
          +
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
      {lowContrast && (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-700">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 h-3 w-3 shrink-0" />
          This colour is too light - some phones may not scan the code. Pick a darker one.
        </p>
      )}
    </div>
  )
}

function Toggle({ label, hint, checked, disabled = false, onChange }) {
  return (
    <label
      className={`flex items-center justify-between gap-3 py-1 text-sm ${
        disabled ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer text-gray-700'
      }`}
    >
      <span>
        {label}
        {hint && <span className="block text-[11px] leading-snug text-gray-400">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-150 disabled:cursor-not-allowed ${checked ? 'bg-[#fccb35]' : 'bg-gray-200'}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left] duration-150 ${checked ? 'left-[18px]' : 'left-0.5'}`}
        />
      </button>
    </label>
  )
}

// Live preview of the printed sticker, using the same layout as print/PNG.
function StickerPreview({ item, design }) {
  const qrRef = useRef(null)
  const qrInstance = useRef(null)
  const s = PREVIEW_PX
  const L = stickerLayout(design)
  const qrPx = Math.round(s * L.qr)
  // Drawn at 2x and scaled down so it stays sharp on high-DPI screens.
  const renderPx = qrPx * 2

  useEffect(() => {
    if (!qrInstance.current) {
      qrInstance.current = createQr(item, design, renderPx)
      qrInstance.current.append(qrRef.current)
    } else {
      qrInstance.current.update(qrOptions(item, design, renderPx))
    }
  }, [item, design, renderPx])

  const line = { flexShrink: 0, lineHeight: L.lineHeight, maxWidth: '100%' }
  return (
    <div
      className={`flex flex-col items-center justify-center overflow-hidden bg-white text-center shadow-sm ${
        design.showFrame ? 'border-solid' : 'border border-dashed border-gray-300'
      }`}
      style={{
        width: s,
        height: s,
        padding: s * L.inset,
        borderRadius: s * L.radius,
        ...(design.showFrame && { borderWidth: s * L.border, borderColor: design.frameColor }),
      }}
    >
      <div ref={qrRef} style={{ width: qrPx, height: qrPx, flexShrink: 0 }} className="[&>canvas]:h-full [&>canvas]:w-full" />
      <div
        className="font-extrabold text-gray-900"
        style={{ ...line, marginTop: s * L.idGap, fontSize: s * L.id, letterSpacing: '0.04em' }}
      >
        {formatItemId(item.id)}
      </div>
    </div>
  )
}

function QrStickerModal({ item, onClose }) {
  const [design, setDesign] = useState(loadDesign)
  const [copies, setCopies] = useState(1)
  const [busy, setBusy] = useState(null) // 'print' | 'download' | null
  const [error, setError] = useState(null)

  const update = (patch) =>
    setDesign((prev) => {
      const next = { ...prev, ...patch }
      saveDesign(next)
      return next
    })

  const copiesNumber = Math.min(MAX_COPIES, Math.max(1, Math.floor(Number(copies) || 1)))

  const run = async (kind, action) => {
    setBusy(kind)
    setError(null)
    try {
      await action()
    } catch {
      setError(kind === 'print' ? 'Could not prepare the stickers for printing.' : 'Could not create the sticker image.')
    } finally {
      setBusy(null)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-10">
      <div onClick={onClose} aria-hidden="true" className="absolute inset-0 bg-black/50" />

      <div className="relative flex max-h-full w-full max-w-3xl animate-[fade-in-up_0.25s_ease-out_forwards] flex-col overflow-hidden rounded-2xl bg-white opacity-0 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">QR Code Sticker</h3>
            <p className="text-xs text-gray-500">
              {item.name} · <span className="font-mono font-semibold">{formatItemId(item.id)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto px-6 py-5 md:flex-row">
          <div className="flex shrink-0 flex-col items-center gap-2 md:sticky md:top-0 md:self-start">
            <div className="rounded-2xl bg-gray-100 p-5">
              <StickerPreview item={item} design={design} />
            </div>
            <p className="text-[11px] text-gray-400">
              Preview · prints at {design.size} × {design.size} in
            </p>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Dot Style</span>
                <select value={design.dotStyle} onChange={(e) => update({ dotStyle: e.target.value })} className={selectClass}>
                  {DOT_STYLES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Corner Style</span>
                <select
                  value={design.cornerStyle}
                  onChange={(e) => update({ cornerStyle: e.target.value })}
                  className={selectClass}
                >
                  {CORNER_STYLES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <ColorPicker label="Code Colour" value={design.color} onChange={(color) => update({ color })} />
            <ColorPicker
              label="Corner Colour"
              value={design.cornerColor}
              onChange={(cornerColor) => update({ cornerColor })}
            />

            <div className="rounded-xl border border-gray-100 px-3 py-1.5">
              <Toggle
                label="FMO logo in the centre"
                hint={logoAllowed(design) ? null : "Not available with this dot style - the code wouldn't scan reliably."}
                checked={logoShown(design)}
                disabled={!logoAllowed(design)}
                onChange={(showLogo) => update({ showLogo })}
              />
              <Toggle
                label="Frame around the sticker"
                checked={design.showFrame}
                onChange={(showFrame) => update({ showFrame })}
              />
            </div>

            {design.showFrame && (
              <ColorPicker
                label="Frame Colour"
                value={design.frameColor}
                presets={FRAME_COLOR_PRESETS}
                checkContrast={false}
                onChange={(frameColor) => update({ frameColor })}
              />
            )}

            <div className="grid grid-cols-[1fr_auto] gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Sticker Size</span>
                <select value={design.size} onChange={(e) => update({ size: e.target.value })} className={selectClass}>
                  {STICKER_SIZES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex w-24 flex-col gap-1.5">
                <span className={labelClass}>Copies</span>
                <input
                  type="number"
                  min="1"
                  max={MAX_COPIES}
                  value={copies}
                  onChange={(e) => setCopies(e.target.value)}
                  onBlur={() => setCopies(copiesNumber)}
                  className={selectClass}
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => update(DEFAULT_DESIGN)}
              className="flex cursor-pointer items-center gap-1.5 self-start text-xs font-semibold text-gray-400 transition-colors duration-150 hover:text-gray-600"
            >
              <FontAwesomeIcon icon={faRotateLeft} className="h-3 w-3" />
              Reset to default design
            </button>
            <p className="-mt-2 text-[11px] text-gray-400">
              The design is saved and used for every item's sticker on this computer.
            </p>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={() => run('download', () => downloadStickerPng(item, design))}
            disabled={busy !== null}
            className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-600 transition-colors duration-150 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FontAwesomeIcon icon={busy === 'download' ? faSpinner : faDownload} className={`h-3.5 w-3.5 ${busy === 'download' ? 'animate-spin' : ''}`} />
            Download PNG
          </button>
          <button
            type="button"
            onClick={() => run('print', () => printStickers(item, design, copiesNumber))}
            disabled={busy !== null}
            className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#fccb35] px-5 text-sm font-semibold text-gray-900 shadow-sm transition-colors duration-150 hover:bg-[#e6b82f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FontAwesomeIcon icon={busy === 'print' ? faSpinner : faPrint} className={`h-3.5 w-3.5 ${busy === 'print' ? 'animate-spin' : ''}`} />
            Print {copiesNumber > 1 ? `${copiesNumber} Stickers` : 'Sticker'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default QrStickerModal
