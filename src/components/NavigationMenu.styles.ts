export const navigationStyles = `
/**
 * Navigation Menu Styles
 * CSS für das Hamburger-Menü und die Navigation
 * Isolated for Shadow DOM
 */

/* Touch Area for better interaction */
:host {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: #333;
  text-align: left;
}

.nav-menu__touch-area {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 25px;
  z-index: 999;
  cursor: pointer;
  background: transparent;
}

/* Notch-Style Toggle Button */
.nav-menu__toggle {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: rgba(0, 0, 0, 0.8);
  border: none;
  border-radius: 0 0 15px 15px;
  padding: 0.75rem 1.5rem 0.75rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  min-width: 60px;
}

.nav-menu__toggle::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 40%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  border-radius: 0 0 1px 1px;
  animation: notchGlow 4s ease-in-out infinite;
}

.nav-menu__toggle::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

@keyframes notchGlow {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.6; }
}

.nav-menu__toggle:hover {
  background: rgba(0, 0, 0, 0.95);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  transform: translateX(-50%) translateY(2px);
}

.nav-menu__toggle:hover::before {
  animation-duration: 2s;
  width: 60%;
}

.nav-menu__toggle:hover::after {
  opacity: 1;
}

.nav-menu__hamburger {
  display: flex;
  flex-direction: column;
  width: 20px;
  height: 14px;
  position: relative;
  justify-content: space-between;
}

.nav-menu__hamburger span {
  display: block;
  height: 1.5px;
  background: #ffffff;
  border-radius: 1px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
}

.nav-menu__hamburger span:nth-child(1) {
  width: 100%;
}

.nav-menu__hamburger span:nth-child(2) {
  width: 75%;
  margin-left: auto;
}

.nav-menu__hamburger span:nth-child(3) {
  width: 50%;
  margin-left: auto;
}

/* Hamburger Animation beim Öffnen */
.nav-menu--open .nav-menu__toggle {
  background: rgba(102, 126, 234, 0.95);
  border-radius: 0 0 20px 20px;
  padding: 1rem 2rem 1rem 2rem;
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
}

.nav-menu--open .nav-menu__hamburger span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
  width: 100%;
}

.nav-menu--open .nav-menu__hamburger span:nth-child(2) {
  opacity: 0;
  transform: scale(0);
}

.nav-menu--open .nav-menu__hamburger span:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
  width: 100%;
}

/* Overlay */
.nav-menu__overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.nav-menu--open .nav-menu__overlay {
  opacity: 1;
  visibility: visible;
}

/* Menu Panel */
.nav-menu__panel {
  position: fixed;
  top: -100%;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 400px;
  max-height: 85vh;
  background: #ffffff;
  z-index: 999;
  transition: top 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0 0 20px 20px;
  /* Reset text alignment and color to ensure isolation */
  text-align: left;
  color: #333;
}

.nav-menu--open .nav-menu__panel {
  top: 60px; /* Positioniert direkt unter dem Notch */
}

/* Header */
.nav-menu__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e1e5e9;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.nav-menu__logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.1rem;
}

.nav-menu__logo-icon {
  font-size: 1.5rem;
}

.nav-menu__close {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.nav-menu__close:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Content */
.nav-menu__content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-height: calc(85vh - 80px); /* Berücksichtigt Header-Höhe */
}

/* Status Indicator */
.nav-menu__status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 0.9rem;
  border-left: 4px solid #28a745;
  color: #333;
}

.nav-menu__status-indicator--error {
  color: #dc3545;
}

.nav-menu__status-indicator--success {
  color: #28a745;
}

/* Navigation Links */
.nav-menu__nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-menu__link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  text-decoration: none;
  color: #333;
  border-radius: 8px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.nav-menu__link:hover {
  background: #f8f9fa;
  border-color: #e1e5e9;
}

.nav-menu__link--active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

.nav-menu__link-icon {
  font-size: 1.1rem;
  width: 20px;
  text-align: center;
}

/* Sections */
.nav-menu__section {
  border-top: 1px solid #e1e5e9;
  padding-top: 1rem;
}

.nav-menu__section:first-child {
  border-top: none;
  padding-top: 0;
}

.nav-menu__section-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Flavor Grid */
.nav-menu__flavor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.nav-menu__flavor-btn {
  padding: 0.75rem 0.5rem;
  background: #f8f9fa;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  font-size: 0.8rem;
  color: #333;
}

.nav-menu__flavor-btn:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.nav-menu__flavor-btn--active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

.nav-menu__flavor-name {
  display: block;
  font-weight: 500;
}

/* Action Buttons */
.nav-menu__actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-menu__action-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  background: none;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
  color: #333;
}

.nav-menu__action-btn:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
  transform: translateY(-1px);
}

.nav-menu__action-icon {
  font-size: 1.1rem;
  width: 20px;
  text-align: center;
}

.nav-menu__action-text {
  font-weight: 500;
}

/* Footer */
.nav-menu__footer {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #e1e5e9;
  font-size: 0.8rem;
  color: #666;
}

.nav-menu__version {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.nav-menu__current-url {
  font-family: 'Courier New', monospace;
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  word-break: break-all;
  color: #333;
}

/* Notification */
.nav-menu__notification {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #28a745;
  color: white;
  padding: 0.875rem 1.25rem;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1002;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s ease;
}

.nav-menu__notification--show {
  opacity: 1;
  transform: translateY(0);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .nav-menu__panel {
    width: 95%;
    max-width: 350px;
  }
  
  .nav-menu--open .nav-menu__panel {
    top: 50px; /* Angepasst für mobile */
  }
  
  .nav-menu__toggle {
    padding: 0.625rem 1.25rem 0.625rem 1.25rem;
    min-width: 50px;
  }
  
  .nav-menu__toggle:hover {
    padding: 0.75rem 1.5rem 0.75rem 1.5rem;
  }
  
  .nav-menu--open .nav-menu__toggle {
    padding: 0.875rem 1.75rem 0.875rem 1.75rem;
  }
  
  .nav-menu__hamburger {
    width: 18px;
    height: 12px;
  }
  
  .nav-menu__flavor-grid {
    grid-template-columns: 1fr;
  }
  
  .nav-menu__content {
    max-height: calc(85vh - 60px);
  }
}

@media (max-width: 480px) {
  .nav-menu__panel {
    width: 98%;
    border-radius: 0 0 15px 15px;
  }
  
  .nav-menu--open .nav-menu__panel {
    top: 45px; /* Noch kompakter für kleine Displays */
  }
  
  .nav-menu__toggle {
    padding: 0.5rem 1rem 0.5rem 1rem;
    min-width: 45px;
    border-radius: 0 0 12px 12px;
  }
  
  .nav-menu__toggle:hover {
    padding: 0.625rem 1.25rem 0.625rem 1.25rem;
  }
  
  .nav-menu--open .nav-menu__toggle {
    padding: 0.75rem 1.5rem 0.75rem 1.5rem;
    border-radius: 0 0 15px 15px;
  }
  
  .nav-menu__hamburger {
    width: 16px;
    height: 10px;
  }
}

/* Dark Theme Support */
@media (prefers-color-scheme: dark) {
  .nav-menu__toggle {
    background: rgba(34, 34, 34, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .nav-menu__toggle:hover {
    background: rgba(34, 34, 34, 1);
  }
  
  .nav-menu--open .nav-menu__toggle {
    background: rgba(102, 126, 234, 0.95);
  }
  
  .nav-menu__hamburger span {
    background: #fff;
  }
  
  .nav-menu__panel {
    background: #1a1a1a;
  }
  
  .nav-menu__header {
    border-bottom-color: #333;
  }
  
  .nav-menu__content {
    color: #fff;
  }
  
  .nav-menu__status {
    background: #2d2d2d;
    color: #fff;
  }
  
  .nav-menu__link {
    color: #fff;
  }
  
  .nav-menu__link:hover {
    background: #2d2d2d;
    border-color: #444;
  }
  
  .nav-menu__section {
    border-top-color: #333;
  }
  
  .nav-menu__section-title {
    color: #aaa;
  }
  
  .nav-menu__flavor-btn {
    background: #2d2d2d;
    border-color: #444;
    color: #fff;
  }
  
  .nav-menu__flavor-btn:hover {
    background: #3d3d3d;
    border-color: #555;
  }
  
  .nav-menu__action-btn {
    border-color: #444;
    color: #fff;
  }
  
  .nav-menu__action-btn:hover {
    background: #2d2d2d;
    border-color: #555;
  }
  
  .nav-menu__footer {
    border-top-color: #333;
    color: #aaa;
  }
  
  .nav-menu__current-url {
    background: #2d2d2d;
    color: #fff;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .nav-menu__toggle,
  .nav-menu__panel,
  .nav-menu__overlay,
  .nav-menu__hamburger span,
  .nav-menu__link,
  .nav-menu__flavor-btn,
  .nav-menu__action-btn,
  .nav-menu__notification {
    transition: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .nav-menu__toggle {
    border: 2px solid #000;
  }
  
  .nav-menu__panel {
    border: 2px solid #000;
  }
  
  .nav-menu__link,
  .nav-menu__flavor-btn,
  .nav-menu__action-btn {
    border: 1px solid #000;
  }
}
`;
