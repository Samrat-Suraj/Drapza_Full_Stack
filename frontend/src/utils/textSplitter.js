/**
 * High-performance text splitter for GSAP character, word, and line animations.
 */
export const splitWordsAndChars = (element) => {
  const text = element.innerText;
  element.innerHTML = '';
  
  const words = text.split(' ');
  const wordEls = [];
  const charEls = [];

  words.forEach((word, wIdx) => {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'split-word-mask';
    wordSpan.style.display = 'inline-block';
    wordSpan.style.overflow = 'hidden';
    wordSpan.style.verticalAlign = 'top';

    const wordInner = document.createElement('span');
    wordInner.className = 'split-word';
    wordInner.style.display = 'inline-block';

    const chars = word.split('');
    chars.forEach((char) => {
      const charSpan = document.createElement('span');
      charSpan.className = 'split-char';
      charSpan.style.display = 'inline-block';
      charSpan.textContent = char;
      wordInner.appendChild(charSpan);
      charEls.push(charSpan);
    });

    wordSpan.appendChild(wordInner);
    element.appendChild(wordSpan);
    wordEls.push(wordInner);

    if (wIdx < words.length - 1) {
      const space = document.createTextNode(' ');
      element.appendChild(space);
    }
  });

  return {
    words: wordEls,
    chars: charEls,
    revert: () => {
      element.innerText = text;
    }
  };
};

export const splitCharsOnly = (element) => {
  const text = element.innerText;
  element.innerHTML = '';
  const charEls = [];

  for (let i = 0; i < text.length; i++) {
    const span = document.createElement('span');
    span.className = 'split-char';
    span.style.display = text[i] === ' ' ? 'inline' : 'inline-block';
    span.textContent = text[i];
    element.appendChild(span);
    charEls.push(span);
  }

  return {
    chars: charEls,
    revert: () => {
      element.innerText = text;
    }
  };
};

export const scrambleText = (elements, duration = 0.4) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  const els = Array.isArray(elements) ? elements : [elements];

  els.forEach((el) => {
    const originalText = el.textContent;
    let iterations = 0;
    const maxIterations = Math.floor(Math.random() * 6) + 4;
    el.style.opacity = '1';

    const interval = setInterval(() => {
      el.textContent = chars[Math.floor(Math.random() * chars.length)];
      iterations++;
      if (iterations >= maxIterations) {
        clearInterval(interval);
        el.textContent = originalText;
      }
    }, 25);

    setTimeout(() => {
      clearInterval(interval);
      el.textContent = originalText;
    }, duration * 1000);
  });
};
