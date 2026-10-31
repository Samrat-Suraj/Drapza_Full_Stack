'use client';

import React from 'react';
import { TextMotion } from './TextMotion';
import { DrapzaSymbol } from './drapza/DrapzaSymbol';

export const DEFAULT_TEXTBLOCK_CONFIG = {
  headline: 'Designed absence, engineered silence.',
  headlineLine1: 'DESIGNED ABSENCE,',
  headlineLine2: 'ENGINEERED SILENCE.',
  paragraph1:
    'Designed for quiet tension. Built on structure, not spectacle. Each piece functions with intent, nothing more. Neutral in tone, deliberate in volume, uniform for moving through static.',
  paragraph2:
    'No ornament. No history. Just form engineered to remain. Indifferent to season, untouched by noise. Modular in cut, detached in presence. A system for those who exit the frame.',
  showSymbol: true,
  customSymbolImage: '',
  backgroundColor: '#0a0a0a',
  textColor: '#ffffff',
  isEnabled: true,
};

/**
 * 1:1 Modular Text Block Section
 * Shared across Storefront and Admin Editor with full live controls.
 */
export function TextBlock({
  config = {},
  isEditable = false,
  onUpdate = null,
  className = '',
  style = {},
}) {
  const finalConfig = { ...DEFAULT_TEXTBLOCK_CONFIG, ...config };

  if (finalConfig.isEnabled === false && !isEditable) {
    return null;
  }

  const handleBlur = (field, e) => {
    if (!onUpdate || !isEditable) return;
    const text = e.currentTarget.textContent?.trim() || '';
    onUpdate({ [field]: text });
  };

  const fullHeadline =
    finalConfig.headline ||
    `${finalConfig.headlineLine1 || 'Designed absence,'} ${finalConfig.headlineLine2 || 'engineered silence.'}`;

  return (
    <section
      className={`text-block ${className}`.trim()}
      style={{
        ...style,
        backgroundColor: finalConfig.backgroundColor || undefined,
        color: finalConfig.textColor || undefined,
      }}
    >
      <div className="container">
        {/* Column 1: Big Headline & Brand Symbol */}
        <div className="text-block-col">
          {isEditable ? (
            <h3
              key={`tb-hl-${fullHeadline}`}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlur('headline', e)}
              className="outline-none focus:ring-1 focus:ring-white/40 hover:bg-white/5 px-2 py-1 rounded cursor-text transition-all pointer-events-auto"
              title="Click directly to edit Text Block Headline"
              style={{ color: finalConfig.textColor || '#ffffff' }}
            >
              {fullHeadline}
            </h3>
          ) : (
            <TextMotion type="slide">
              <h3 style={{ color: finalConfig.textColor || undefined }}>
                {fullHeadline}
              </h3>
            </TextMotion>
          )}

          {finalConfig.showSymbol !== false && (
            <div className="text-block-logo">
              {finalConfig.customSymbolImage ? (
                <img
                  src={finalConfig.customSymbolImage}
                  alt="Emblem"
                  className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 object-contain filter drop-shadow-md"
                />
              ) : (
                <svg
                  width="706"
                  height="673"
                  viewBox="0 0 706 673"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M705.23 329.88H502.48C613.57 213.37 675.09 107.26 645.17 73.92C614 39.18 493.58 94.58 359.13 200.68V0H346.1V211.08C326.26 227.11 306.18 244.2 286.08 262.24C260.94 284.8 237.26 307.49 215.34 329.89H0V342.92H202.75C91.66 459.43 30.1399 565.54 60.0599 598.88C91.2299 633.62 211.65 578.22 346.1 472.12V672.8H359.13V461.72C378.97 445.69 399.05 428.6 419.15 410.56C444.29 388 467.97 365.31 489.89 342.91H705.23V329.88ZM593.21 120.54C620.44 150.89 576.84 236.61 492.23 329.88H410.66C382.91 322.18 366.83 306.1 359.13 278.35V209.47C467.08 127.76 564.64 88.71 593.2 120.55L593.21 120.54ZM289.99 266.59C308.74 249.77 327.54 234.03 346.11 219.49V283.66C337.87 308.17 322.14 322.69 296.21 329.88H225.05C244.83 308.87 266.58 287.59 289.99 266.59ZM112.03 552.25C84.7999 521.9 128.4 436.18 213.01 342.91H301.51C324.3 350.57 338.45 364.71 346.11 387.51V463.33C238.16 545.04 140.6 584.09 112.04 552.25H112.03ZM415.25 406.2C396.5 423.02 377.7 438.76 359.13 453.3V392.81C366.33 366.88 380.84 351.14 405.35 342.91H480.19C460.41 363.92 438.66 385.2 415.25 406.2Z"
                    fill="#edf1e8"
                  />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Column 2: Editorial Body Copy */}
        <div className="text-block-col">
          <div className="text-block-copy">
            {isEditable ? (
              <p
                key={`p1-${finalConfig.paragraph1}`}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlur('paragraph1', e)}
                className="bodyCopy sm outline-none focus:ring-1 focus:ring-white/40 hover:bg-white/5 p-2 rounded cursor-text transition-all pointer-events-auto"
                title="Click directly to edit Column 1 Paragraph"
              >
                {finalConfig.paragraph1}
              </p>
            ) : (
              <TextMotion type="slide">
                <p className="bodyCopy sm">{finalConfig.paragraph1}</p>
              </TextMotion>
            )}
          </div>

          <div className="text-block-copy">
            {isEditable ? (
              <p
                key={`p2-${finalConfig.paragraph2}`}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlur('paragraph2', e)}
                className="bodyCopy sm outline-none focus:ring-1 focus:ring-white/40 hover:bg-white/5 p-2 rounded cursor-text transition-all pointer-events-auto"
                title="Click directly to edit Column 2 Paragraph"
              >
                {finalConfig.paragraph2}
              </p>
            ) : (
              <TextMotion type="slide" delay={0.2}>
                <p className="bodyCopy sm">{finalConfig.paragraph2}</p>
              </TextMotion>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TextBlock;
