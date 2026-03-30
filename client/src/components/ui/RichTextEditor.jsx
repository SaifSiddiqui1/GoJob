import { useRef, useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { ChevronDown } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────
const FONT_FAMILIES = [
    { label: 'Default',          value: '' },
    { label: 'Arial',            value: 'Arial, sans-serif' },
    { label: 'Georgia',          value: 'Georgia, serif' },
    { label: 'Times New Roman',  value: '"Times New Roman", serif' },
    { label: 'Verdana',          value: 'Verdana, sans-serif' },
    { label: 'Courier New',      value: '"Courier New", monospace' },
    { label: 'Trebuchet MS',     value: '"Trebuchet MS", sans-serif' },
    { label: 'Open Sans',        value: '"Open Sans", sans-serif' },
    { label: 'Raleway',          value: 'Raleway, sans-serif' },
]

const FONT_SIZES = ['8','9','10','11','12','13','14','15','16','18','20','22','24','28','32','36']

const PALETTE = [
    // Row 1 — darks / neutrals
    '#000000','#1f2937','#374151','#4b5563','#6b7280','#9ca3af',
    // Row 2 — reds / oranges / yellows
    '#ef4444','#f97316','#eab308','#84cc16','#22c55e','#14b8a6',
    // Row 3 — blues / purples / pinks
    '#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#f43f5e',
    // Row 4 — light / backgrounds
    '#ffffff','#fef9c3','#dcfce7','#dbeafe','#ede9fe','#fce7f3',
]

const TOOLBAR_W = 440  // approx toolbar width for centering

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * RichTextEditor
 * @param {string}   value      - HTML string stored/displayed
 * @param {function} onChange   - called with new HTML string on every change
 * @param {string}   placeholder
 * @param {number}   minHeight  - px
 * @param {string}   className
 */
export default function RichTextEditor({
    value,
    onChange,
    placeholder = 'Type here…',
    minHeight = 110,
    className = '',
}) {
    const editorRef  = useRef(null)
    const toolbarRef = useRef(null)

    const [showToolbar,  setShowToolbar]  = useState(false)
    const [toolbarPos,   setToolbarPos]   = useState({ top: 0, left: 0 })
    const [showColors,   setShowColors]   = useState(false)
    const [showFonts,    setShowFonts]    = useState(false)
    const [showSizes,    setShowSizes]    = useState(false)
    const [active,       setActive]       = useState({ bold: false, italic: false, underline: false })

    // ── Init: set innerHTML once on mount ────────────────────────────────────
    useEffect(() => {
        if (!editorRef.current) return
        editorRef.current.innerHTML = value || ''
        // Prefer inline-style formatting over presentational elements
        try { document.execCommand('styleWithCSS', false, true) } catch (_) {}
    }, []) // intentionally empty — only on mount

    // ── Emit change ──────────────────────────────────────────────────────────
    const emit = useCallback(() => {
        if (editorRef.current) onChange?.(editorRef.current.innerHTML)
    }, [onChange])

    // ── Query active formats ─────────────────────────────────────────────────
    const checkFormats = useCallback(() => {
        try {
            setActive({
                bold:      document.queryCommandState('bold'),
                italic:    document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
            })
        } catch (_) {}
    }, [])

    // ── Show/reposition toolbar when selection changes ───────────────────────
    const handleSelectionChange = useCallback(() => {
        const sel = window.getSelection()
        if (!sel || sel.isCollapsed || !sel.rangeCount) {
            setShowToolbar(false)
            return
        }
        const range = sel.getRangeAt(0)
        if (!editorRef.current?.contains(range.commonAncestorContainer)) {
            setShowToolbar(false)
            return
        }
        const rect = range.getBoundingClientRect()
        if (!rect.width) { setShowToolbar(false); return }

        // Centre toolbar over selection; keep it within viewport
        let left = rect.left + rect.width / 2 - TOOLBAR_W / 2
        left = Math.max(8, Math.min(left, window.innerWidth - TOOLBAR_W - 8))

        // Try to place above; fall below if clipped
        const TOOLBAR_H = 44
        let top = rect.top - TOOLBAR_H - 10
        if (top < 8) top = rect.bottom + 8

        setToolbarPos({ top, left })
        setShowToolbar(true)
        checkFormats()
    }, [checkFormats])

    useEffect(() => {
        document.addEventListener('selectionchange', handleSelectionChange)
        return () => document.removeEventListener('selectionchange', handleSelectionChange)
    }, [handleSelectionChange])

    // Close toolbar on outside click
    useEffect(() => {
        if (!showToolbar) return
        const handler = (e) => {
            if (
                toolbarRef.current?.contains(e.target) ||
                editorRef.current?.contains(e.target)
            ) return
            setShowToolbar(false)
            setShowColors(false); setShowFonts(false); setShowSizes(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [showToolbar])

    // ── execCommand wrapper ───────────────────────────────────────────────────
    const exec = useCallback((cmd, val = null) => {
        editorRef.current?.focus()
        try { document.execCommand(cmd, false, val) } catch (_) {}
        emit()
        checkFormats()
    }, [emit, checkFormats])

    // ── Font size (px) via Range API span-wrapping — reliable cross-browser ──
    const applyFontSize = useCallback((px) => {
        const sel = window.getSelection()
        if (!sel || !sel.rangeCount) { setShowSizes(false); return }
        const range = sel.getRangeAt(0)
        if (range.collapsed) { setShowSizes(false); return }

        editorRef.current?.focus()

        const span = document.createElement('span')
        span.style.fontSize = `${px}px`

        try {
            // Works when selection stays within a single element boundary
            range.surroundContents(span)
        } catch (_) {
            // Range crosses element boundaries — extract & re-wrap
            const fragment = range.extractContents()
            span.appendChild(fragment)
            range.insertNode(span)
        }

        // Re-select the wrapped span so the user can chain formats
        const newRange = document.createRange()
        newRange.selectNodeContents(span)
        sel.removeAllRanges()
        sel.addRange(newRange)

        emit()
        setShowSizes(false)
    }, [emit])

    // ── Font family ───────────────────────────────────────────────────────────
    const applyFont = useCallback((family) => {
        exec('fontName', family || 'Arial')
        setShowFonts(false)
    }, [exec])

    // ── Text color ────────────────────────────────────────────────────────────
    const applyColor = useCallback((color) => {
        exec('foreColor', color)
        setShowColors(false)
    }, [exec])

    // ── Key handler ───────────────────────────────────────────────────────────
    const handleKeyDown = (e) => {
        // Enter → <br> (not block-level div/p)
        if (e.key === 'Enter') {
            e.preventDefault()
            try { document.execCommand('insertLineBreak') } catch (_) {}
            emit()
        }
    }

    // ── Close sub-menus when switching ───────────────────────────────────────
    const toggleColors = () => { setShowColors(v => !v); setShowFonts(false); setShowSizes(false) }
    const toggleFonts  = () => { setShowFonts(v => !v);  setShowColors(false); setShowSizes(false) }
    const toggleSizes  = () => { setShowSizes(v => !v);  setShowColors(false); setShowFonts(false) }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className={`relative ${className}`}>
            {/* ── Editable area ── */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={emit}
                onKeyDown={handleKeyDown}
                data-placeholder={placeholder}
                style={{ minHeight, lineHeight: '1.65' }}
                className={[
                    'rte-editor',
                    'w-full px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200',
                    'bg-white dark:bg-gray-900',
                    'border border-gray-200 dark:border-gray-700 rounded-xl',
                    'focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400',
                    'transition-all leading-relaxed overflow-y-auto',
                ].join(' ')}
            />

            {/* ── Floating Toolbar (portal) ── */}
            {showToolbar && ReactDOM.createPortal(
                <div
                    ref={toolbarRef}
                    style={{
                        position: 'fixed',
                        top:  toolbarPos.top,
                        left: toolbarPos.left,
                        zIndex: 99999,
                        width: TOOLBAR_W,
                        animation: 'fadeSlideDown 0.12s ease-out',
                    }}
                    className="flex items-center gap-px bg-gray-900 text-white rounded-2xl shadow-2xl shadow-black/50 px-2 py-1.5 border border-gray-700/60"
                    onMouseDown={e => e.preventDefault()} // keep editor focused
                >
                    {/* Bold / Italic / Underline */}
                    <FmtBtn active={active.bold}      onClick={() => exec('bold')}      title="Bold (Ctrl+B)">
                        <b className="font-black text-[13px]">B</b>
                    </FmtBtn>
                    <FmtBtn active={active.italic}    onClick={() => exec('italic')}    title="Italic (Ctrl+I)">
                        <i className="font-serif italic text-[13px]">I</i>
                    </FmtBtn>
                    <FmtBtn active={active.underline} onClick={() => exec('underline')} title="Underline (Ctrl+U)">
                        <span className="underline text-[13px]">U</span>
                    </FmtBtn>

                    <Sep />

                    {/* Font family */}
                    <Popup
                        label="Font"
                        isOpen={showFonts}
                        onToggle={toggleFonts}
                        minW={160}
                    >
                        {FONT_FAMILIES.map(f => (
                            <button
                                key={f.label}
                                onMouseDown={e => { e.preventDefault(); applyFont(f.value) }}
                                className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 transition-colors"
                                style={{ fontFamily: f.value || 'inherit' }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </Popup>

                    {/* Font size */}
                    <Popup
                        label="Size"
                        isOpen={showSizes}
                        onToggle={toggleSizes}
                        minW={110}
                        align="left"
                    >
                        <div className="grid grid-cols-2">
                            {FONT_SIZES.map(s => (
                                <button
                                    key={s}
                                    onMouseDown={e => { e.preventDefault(); applyFontSize(s) }}
                                    className="text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 transition-colors"
                                >
                                    {s}px
                                </button>
                            ))}
                        </div>
                    </Popup>

                    <Sep />

                    {/* Color */}
                    <Popup
                        label={
                            <span className="font-bold text-sm" style={{ textDecoration: 'underline', textDecorationColor: '#60a5fa', textDecorationThickness: '2px', textUnderlineOffset: '2px' }}>
                                A
                            </span>
                        }
                        isOpen={showColors}
                        onToggle={toggleColors}
                        minW={168}
                    >
                        <div className="p-2 grid grid-cols-6 gap-1">
                            {PALETTE.map(c => (
                                <button
                                    key={c}
                                    onMouseDown={e => { e.preventDefault(); applyColor(c) }}
                                    className="w-6 h-6 rounded-md border border-gray-600 hover:scale-110 transition-transform"
                                    style={{ background: c }}
                                    title={c}
                                />
                            ))}
                        </div>
                    </Popup>

                    <Sep />

                    {/* Clear formatting */}
                    <button
                        onMouseDown={e => { e.preventDefault(); exec('removeFormat') }}
                        className="px-2.5 py-1 text-[11px] text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors whitespace-nowrap"
                        title="Clear all formatting"
                    >
                        Clear ✕
                    </button>
                </div>,
                document.body
            )}
        </div>
    )
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function Sep() {
    return <div className="w-px h-5 bg-gray-600 mx-1 flex-shrink-0" />
}

function FmtBtn({ active, onClick, children, title }) {
    return (
        <button
            onMouseDown={e => { e.preventDefault(); onClick() }}
            title={title}
            className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg transition-colors
                ${active
                    ? 'bg-violet-500 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
        >
            {children}
        </button>
    )
}

function Popup({ label, isOpen, onToggle, children, minW = 140, align = 'left' }) {
    return (
        <div className="relative flex-shrink-0">
            <button
                onMouseDown={e => { e.preventDefault(); onToggle() }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors whitespace-nowrap"
            >
                {label}
                <ChevronDown size={10} className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div
                    className="absolute top-full mt-1.5 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-10 overflow-hidden max-h-56 overflow-y-auto"
                    style={{ minWidth: minW, [align === 'right' ? 'right' : 'left']: 0 }}
                >
                    {children}
                </div>
            )}
        </div>
    )
}
