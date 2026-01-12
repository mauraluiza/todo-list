import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

export function Modal({ isOpen, onClose, children, title }) {
    if (!isOpen) return null

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])

    return createPortal(
        <div className={`modal-overlay visible`} onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    {/* If title is a string, render as h2, else render children (custom input) */}
                    {typeof title === 'string' ? <h2>{title}</h2> : title}

                    <button className="close-modal-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    )
}
