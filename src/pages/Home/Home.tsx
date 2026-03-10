import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdLogin, MdPersonAdd, MdVisibility } from 'react-icons/md'
import { selectionCards, homeBrandTagline } from './homeData'
import type { SelectionCard } from './homeData'
import './Home.css'

const BRAND_LETTERS = ['E', 'v', 'e', 'n', 't', '\u00A0', 'S', 'e', 'n', 's', 'e']

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [activeCard, setActiveCard] = useState<string | null>(null)

  /**
   * Handle Card Selection logic
   */
  const handleCardSelect = useCallback(
      (card: SelectionCard) => {
        setActiveCard(card.id)

        // logic: Guest mode එක click කළහොත් කලින් තිබූ login දත්ත ඉවත් කර 
        // කෙලින්ම event-form එකට redirect කරයි.
        if (card.id === 'guest') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('result');
          
          // animation එක පෙනීමට සුළු වෙලාවකට පසු navigate කරයි
          setTimeout(() => navigate('/event-form'), 220);
        } else {
          // අනෙකුත් options (Login/Register) සඳහා අදාළ route එකට යයි
          setTimeout(() => navigate(card.route), 220);
        }
      },
      [navigate],
  )

  const renderIcon = (key: SelectionCard['iconKey']): React.ReactElement => {
    const size = 32
    const color = 'var(--es-gold-primary)'
    if (key === 'login') return <MdLogin size={size} color={color} />
    if (key === 'register') return <MdPersonAdd size={size} color={color} />
    return <MdVisibility size={size} color={color} />
  }

  return (
      <div className="event-sense-home">
        {/* Background Decorative Elements */}
        <div className="es-home-bg-glow es-home-bg-glow--top" />
        <div className="es-home-bg-glow es-home-bg-glow--bottom" />
        <div className="es-home-bg-grid" />

        <div className="es-home-content">

          {/* ===== HERO SECTION ===== */}
          <div className="es-home-hero">
            <p className="es-home-eyebrow">AI-Powered Event Budgeting</p>

            <div className="es-home-brand-loader">
              <div className="es-home-loader-wrapper">
                {BRAND_LETTERS.map((letter, i) => (
                    <span
                        key={i}
                        className="es-home-loader-letter"
                        style={{ animationDelay: `${0.1 + i * 0.105}s` }}
                    >
                      {letter}
                    </span>
                ))}
                <div className="es-home-loader-scan" />
              </div>
            </div>

            <div className="es-home-divider" />
            <p className="es-home-tagline">{homeBrandTagline}</p>

            <div className="es-home-trust-strip">
              <div className="es-home-trust-item">
                <span className="es-home-trust-num">10,000+</span>
                <span className="es-home-trust-label">Events Analysed</span>
              </div>
              <div className="es-home-trust-sep" />
              <div className="es-home-trust-item">
                <span className="es-home-trust-num">98%</span>
                <span className="es-home-trust-label">Budget Accuracy</span>
              </div>
              <div className="es-home-trust-sep" />
              <div className="es-home-trust-item">
                <span className="es-home-trust-num">5★</span>
                <span className="es-home-trust-label">User Rating</span>
              </div>
            </div>
          </div>

          {/* ===== SELECTION CARDS ===== */}
          <div className="es-home-cards-section">
            <p className="es-home-cards-label">Choose how you'd like to continue</p>

            <div className="es-home-cards-grid">
              {selectionCards.map((card, idx) => (
                  <div
                      key={card.id}
                      className={`es-home-card es-home-card--${idx}${activeCard === card.id ? ' es-home-card--active' : ''}`}
                      onClick={() => handleCardSelect(card)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleCardSelect(card)}
                      aria-label={`Continue as ${card.label}`}
                  >
                    <div className="es-home-card__shine" />

                    <div className="es-home-card__icon-wrap">
                      {renderIcon(card.iconKey)}
                    </div>

                    <h2 className="es-home-card__heading">{card.label}</h2>
                    <p className="es-home-card__desc">{card.description}</p>

                    <div className="es-home-card__arrow">
                      Continue
                      <span className="es-home-card__arrow-icon">→</span>
                    </div>
                  </div>
              ))}
            </div>
          </div>

          {/* ===== FOOTER ===== */}
          <p className="es-home-footer">
            © {new Date().getFullYear()} Event Sense · Powered by machine learning
          </p>
        </div>
      </div>
  )
}

export default Home