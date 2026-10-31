'use client';

import React from 'react';
import { TextMotion } from './TextMotion';

export const DEFAULT_ABOUT_CONFIG = {
  isEnabled: true,
  subtitle: 'Clothing reduced to pure signal',
  statement: 'Our collections are built for the frictionless, the fast, and the quietly defiant.',
  footerTag: '/ Core State /',
  showIcon: true,
  iconScale: 100,
  customSymbolImage: null,
};

/**
 * 1:1 Modular About / Brand Statement Section
 */
export function AboutSection({
  config = {},
  isEditable = false,
  onUpdate = null,
  className = '',
  style = {},
}) {
  const finalConfig = { ...DEFAULT_ABOUT_CONFIG, ...config };

  if (finalConfig.isEnabled === false && !isEditable) {
    return null;
  }

  const handleBlur = (field, e) => {
    if (!onUpdate || !isEditable) return;
    const text = e.currentTarget.textContent?.trim() || '';
    onUpdate({ [field]: text });
  };

  return (
    <section className={`about ${className}`.trim()} style={style}>
      <div className="container">
        <div className="about-copy">
          {finalConfig.subtitle &&
            (isEditable ? (
              <p
                key={`sub-${finalConfig.subtitle}`}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlur('subtitle', e)}
                className="outline-none focus:ring-1 focus:ring-white/40 hover:bg-white/5 px-2 py-0.5 rounded cursor-text transition-all inline-block"
                title="Click to edit Subtitle"
              >
                {finalConfig.subtitle}
              </p>
            ) : (
              <TextMotion type="flicker" delay={0.1}>
                <p>{finalConfig.subtitle}</p>
              </TextMotion>
            ))}

          {isEditable ? (
            <h3
              key={`stmt-${finalConfig.statement}`}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlur('statement', e)}
              className="outline-none focus:ring-1 focus:ring-white/40 hover:bg-white/5 px-3 py-1 rounded cursor-text transition-all"
              title="Click to edit Statement"
            >
              {finalConfig.statement ||
                'Our collections are built for the frictionless, the fast, and the quietly defiant.'}
            </h3>
          ) : (
            <TextMotion type="slide" delay={0.25}>
              <h3>
                {finalConfig.statement ||
                  'Our collections are built for the frictionless, the fast, and the quietly defiant.'}
              </h3>
            </TextMotion>
          )}

          {finalConfig.showIcon !== false && (
            <div
              className="about-icon"
              style={
                finalConfig.iconScale && finalConfig.iconScale !== 100
                  ? {
                      transform: `scale(${finalConfig.iconScale / 100})`,
                      transition: 'transform 0.3s ease',
                    }
                  : undefined
              }
            >
              {finalConfig.customSymbolImage ? (
                <img
                  src={finalConfig.customSymbolImage}
                  alt="Brand Symbol"
                  className="w-full h-full object-contain filter drop-shadow-[0_10px_30px_rgba(255,255,255,0.15)]"
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
      </div>
      <div className="section-footer light">
        {isEditable ? (
          <p
            key={`ft-${finalConfig.footerTag}`}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleBlur('footerTag', e)}
            className="outline-none focus:ring-1 focus:ring-white/40 hover:bg-white/5 px-2 py-0.5 rounded cursor-text transition-all inline-block"
            title="Click to edit Footer Tag"
          >
            {finalConfig.footerTag || '/ Core State /'}
          </p>
        ) : (
          <p>{finalConfig.footerTag || '/ Core State /'}</p>
        )}
      </div>
    </section>
  );
}

export default AboutSection;
