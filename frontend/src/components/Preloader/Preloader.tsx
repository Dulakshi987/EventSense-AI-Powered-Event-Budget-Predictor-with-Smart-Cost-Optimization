import React, { useEffect, useState } from 'react'
import './Preloader.css'

interface PreloaderProps {
    onComplete: () => void
}

const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
    const [visible, setVisible] = useState<boolean>(true)
    const [fadeOut, setFadeOut] = useState<boolean>(false)

    useEffect(() => {
        const fadeTimer = setTimeout(() => setFadeOut(true), 2200)
        const hideTimer = setTimeout(() => {
            setVisible(false)
            onComplete()
        }, 2800)

        return () => {
            clearTimeout(fadeTimer)
            clearTimeout(hideTimer)
        }
    }, [onComplete])

    if (!visible) return null

    return (
        <div className={`es-preloader${fadeOut ? ' es-preloader--fade-out' : ''}`}>

            <div className="es-preloader__inner">

                <div className="es-preloader__loader">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="es-preloader__square" />
                    ))}
                </div>

                <h1 className="es-preloader__brand">
                    Event <span>Sense</span>
                </h1>

                <p className="es-preloader__tagline">Experience Beyond Moments</p>

            </div>
        </div>
    )
}

export default Preloader