'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(SplitText, ScrollTrigger);

export function TextMotion({
  children,
  animateOnScroll = true,
  delay = 0,
  type = 'slide'
}) {
  const u = useRef(null);
  const f = useRef([]);
  const d = useRef([]);

  const waitForFonts = async () => {
    try {
      await document.fonts.ready;
      const e = ['Koulen', 'Host Grotesk', 'DM Mono'].map((name) =>
        document.fonts.check(`16px ${name}`)
      );
      await Promise.all(e);
      await new Promise((res) => setTimeout(res, 100));
      return true;
    } catch {
      await new Promise((res) => setTimeout(res, 200));
      return true;
    }
  };

  useEffect(() => {
    if (!u.current) return;
    let isCancelled = false;

    (async () => {
      await waitForFonts();
      if (isCancelled || !u.current) return;

      d.current.forEach((split) => split && split.revert && split.revert());
      d.current = [];
      f.current = [];

      let elements = [];
      if (u.current.hasAttribute('data-copy-wrapper')) {
        elements = Array.from(u.current.children);
      } else {
        elements = [u.current];
      }

      if (type === 'slide') {
        const lines = [];
        elements.forEach((el) => {
          f.current.push(el);
          const split = SplitText.create(el, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'line',
            lineThreshold: 0.1
          });
          d.current.push(split);
          const textIndent = window.getComputedStyle(el).textIndent;
          if (textIndent && textIndent !== '0px') {
            if (split.lines.length > 0) split.lines[0].style.paddingLeft = textIndent;
            el.style.textIndent = '0';
          }
          lines.push(...split.lines);
        });

        if (lines.length > 0) {
          gsap.set(lines, { y: '100%' });
          const anim = gsap.to(lines, {
            y: '0%',
            duration: 1,
            stagger: 0.1,
            ease: 'power4.out',
            delay: delay,
            paused: animateOnScroll
          });

          if (animateOnScroll) {
            ScrollTrigger.create({
              trigger: u.current,
              start: 'top 80%',
              animation: anim,
              once: true,
              refreshPriority: -1
            });
          }
        }
      } else if (type === 'flicker') {
        const chars = [];
        elements.forEach((el) => {
          f.current.push(el);
          const split = SplitText.create(el, { type: 'words,chars' });
          d.current.push(split);
          chars.push(...split.chars);
        });

        if (chars.length > 0) {
          gsap.set(chars, { opacity: 0 });
          const anim = gsap.to(chars, {
            duration: 0.05,
            opacity: 1,
            ease: 'power2.inOut',
            delay: delay,
            stagger: { amount: 0.5, each: 0.1, from: 'random' },
            paused: animateOnScroll
          });

          if (animateOnScroll) {
            ScrollTrigger.create({
              trigger: u.current,
              start: 'top 85%',
              animation: anim,
              once: true
            });
          }
        }
      }
    })();

    return () => {
      isCancelled = true;
      d.current.forEach((split) => split && split.revert && split.revert());
    };
  }, [animateOnScroll, delay, type]);

  if (React.Children.count(children) === 1 && React.isValidElement(children)) {
    return React.cloneElement(children, { ref: u });
  }
  return (
    <div ref={u} data-copy-wrapper="true">
      {children}
    </div>
  );
}
export default TextMotion;
