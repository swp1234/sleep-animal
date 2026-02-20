/* =================================================================
   Sleep Animal Quiz - App Logic
   Chronotype: Bear, Lion, Wolf, Dolphin
   ================================================================= */

(() => {
  'use strict';

  // ===== Questions: each answer maps to an animal =====
  // a=bear, b=lion, c=wolf, d=dolphin
  const QUESTIONS = [
    { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 },
    { id: 6 }, { id: 7 }, { id: 8 }, { id: 9 }, { id: 10 }
  ];

  const ANIMALS = ['bear', 'lion', 'wolf', 'dolphin'];
  const ANIMAL_EMOJIS = { bear: '🐻', lion: '🦁', wolf: '🐺', dolphin: '🐬' };
  const ANIMAL_PCTS = { bear: '55', lion: '15', wolf: '15', dolphin: '10' };
  const ANSWER_MAP = { a: 'bear', b: 'lion', c: 'wolf', d: 'dolphin' };
  const OPTION_KEYS = ['a', 'b', 'c', 'd'];
  const TIP_ICONS = ['🌙', '💤', '🛏️', '✨', '🍵'];

  // ===== State =====
  let answers = new Array(10).fill(null);
  let currentIdx = 0;
  let isDark = true;

  // ===== DOM helpers =====
  const $ = id => document.getElementById(id);
  const screens = {
    start: $('screen-start'),
    quiz: $('screen-quiz'),
    result: $('screen-result'),
  };

  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ===== Stars generation =====
  function generateStars() {
    const container = document.querySelector('.stars');
    if (!container) return;
    container.innerHTML = '';
    const count = 60;
    for (let i = 0; i < count; i++) {
      const star = document.createElement('span');
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.setProperty('--dur', (2 + Math.random() * 4) + 's');
      star.style.setProperty('--delay', (Math.random() * 3) + 's');
      star.style.width = (1 + Math.random() * 2) + 'px';
      star.style.height = star.style.width;
      container.appendChild(star);
    }
  }

  // ===== Theme =====
  function initTheme() {
    const saved = localStorage.getItem('sleep-animal-theme');
    isDark = saved ? saved === 'dark' : true;
    applyTheme();
  }
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    $('theme-btn').textContent = isDark ? '☀️' : '🌙';
  }
  $('theme-btn').addEventListener('click', () => {
    isDark = !isDark;
    localStorage.setItem('sleep-animal-theme', isDark ? 'dark' : 'light');
    applyTheme();
  });

  // ===== Start screen animal cards =====
  function renderAnimalCards() {
    ANIMALS.forEach(animal => {
      const nameEl = document.querySelector(`.animal-card[data-animal="${animal}"] .animal-name`);
      const descEl = document.querySelector(`.animal-card[data-animal="${animal}"] .animal-desc`);
      if (nameEl) nameEl.textContent = i18n.t(`animals.${animal}`);
      if (descEl) descEl.textContent = i18n.t(`animalIntro.${animal}`);
    });
  }

  // ===== Quiz Logic =====
  function renderQuestion(idx) {
    const q = QUESTIONS[idx];
    const total = QUESTIONS.length;

    // Progress
    $('progress-label').textContent = `${idx + 1} / ${total}`;
    $('progress-fill').style.width = `${((idx + 1) / total) * 100}%`;

    // Question
    $('q-number').textContent = `Q${q.id}`;
    $('q-text').textContent = i18n.t(`q${q.id}.text`);

    // Options
    const optionsWrap = $('options-wrap');
    optionsWrap.innerHTML = '';
    OPTION_KEYS.forEach(key => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      if (answers[idx] === key) btn.classList.add('selected');
      btn.dataset.key = key;
      btn.innerHTML = `<span class="option-label">${key.toUpperCase()}</span>${i18n.t(`q${q.id}.${key}`)}`;
      btn.addEventListener('click', () => selectAnswer(key));
      optionsWrap.appendChild(btn);
    });

    // Nav buttons
    $('btn-prev').disabled = idx === 0;
    $('btn-next').textContent = idx === total - 1
      ? i18n.t('quiz.finish')
      : i18n.t('quiz.next');
  }

  function selectAnswer(key) {
    answers[currentIdx] = key;

    // Update visual
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.key === key);
    });

    // Auto-advance after short delay
    if (currentIdx < QUESTIONS.length - 1) {
      setTimeout(() => {
        currentIdx++;
        renderQuestion(currentIdx);
      }, 350);
    }
  }

  $('btn-prev').addEventListener('click', () => {
    if (currentIdx > 0) {
      currentIdx--;
      renderQuestion(currentIdx);
    }
  });

  $('btn-next').addEventListener('click', () => {
    if (answers[currentIdx] === null) {
      // Shake effect
      const card = document.querySelector('.question-card');
      card.style.animation = 'none';
      card.offsetHeight; // force reflow
      card.style.animation = 'shake 0.4s ease';
      return;
    }
    if (currentIdx < QUESTIONS.length - 1) {
      currentIdx++;
      renderQuestion(currentIdx);
    } else {
      showResult();
    }
  });

  // ===== Score Calculation =====
  function calcResult() {
    const scores = { bear: 0, lion: 0, wolf: 0, dolphin: 0 };
    answers.forEach(key => {
      if (key && ANSWER_MAP[key]) {
        scores[ANSWER_MAP[key]]++;
      }
    });

    // Find the animal with the highest score
    let maxAnimal = 'bear';
    let maxScore = 0;
    for (const [animal, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxAnimal = animal;
      }
    }
    return { animal: maxAnimal, scores };
  }

  // ===== Result Rendering =====
  function showResult() {
    const { animal, scores } = calcResult();

    showScreen('result');

    // Animal emoji + name
    $('result-emoji').textContent = i18n.t(`results.${animal}.emoji`) || ANIMAL_EMOJIS[animal];
    $('result-type-label').textContent = i18n.t('results.yourType');

    const nameEl = $('result-name');
    nameEl.textContent = i18n.t(`results.${animal}.name`);
    nameEl.className = 'result-animal-name ' + animal;

    // Percentage
    const pct = i18n.t(`results.${animal}.pct`) || ANIMAL_PCTS[animal];
    $('result-percentage').textContent = i18n.t('results.percentage').replace('{pct}', pct);

    // Description
    $('result-desc').textContent = i18n.t(`results.${animal}.description`);

    // Traits
    const traitsContainer = $('traits-list');
    traitsContainer.innerHTML = '';
    const traits = i18n.t(`results.${animal}.traits`);
    if (Array.isArray(traits)) {
      traits.forEach(trait => {
        const chip = document.createElement('span');
        chip.className = 'trait-chip';
        chip.textContent = trait;
        traitsContainer.appendChild(chip);
      });
    }

    // Sleep tips
    $('section-tips-title').textContent = i18n.t('results.sleepTips');
    const tipsContainer = $('tips-list');
    tipsContainer.innerHTML = '';
    const tips = i18n.t(`results.${animal}.sleepTips`);
    if (Array.isArray(tips)) {
      tips.forEach((tip, idx) => {
        const item = document.createElement('div');
        item.className = 'tip-item';
        item.innerHTML = `<span class="tip-icon">${TIP_ICONS[idx % TIP_ICONS.length]}</span><span>${tip}</span>`;
        tipsContainer.appendChild(item);
      });
    }

    // Ideal schedule
    $('section-schedule-title').textContent = i18n.t('results.idealSchedule');
    const scheduleContainer = $('schedule-card');
    scheduleContainer.innerHTML = '';
    const schedule = i18n.t(`results.${animal}.idealSchedule`);
    if (schedule && typeof schedule === 'object') {
      const scheduleItems = [
        { key: 'wake', icon: '🌅', cls: 'wake' },
        { key: 'peak', icon: '🎯', cls: 'peak' },
        { key: 'exercise', icon: '🏃', cls: 'exercise' },
        { key: 'wind', icon: '🧘', cls: 'wind' },
        { key: 'sleep', icon: '😴', cls: 'sleep' },
      ];
      scheduleItems.forEach(si => {
        if (schedule[si.key]) {
          const item = document.createElement('div');
          item.className = 'schedule-item';
          item.innerHTML = `
            <div class="schedule-icon ${si.cls}">${si.icon}</div>
            <span class="schedule-text">${schedule[si.key]}</span>
          `;
          scheduleContainer.appendChild(item);
        }
      });
    }

    // GA4 event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'sleep_animal_complete', {
        sleep_animal: animal,
        event_category: 'quiz',
      });
    }
  }

  // ===== Share =====
  $('btn-twitter').addEventListener('click', () => {
    const { animal } = calcResult();
    const name = i18n.t(`results.${animal}.name`);
    const emoji = ANIMAL_EMOJIS[animal];
    const pct = i18n.t(`results.${animal}.pct`) || ANIMAL_PCTS[animal];
    const text = i18n.t('share.twitterText')
      .replace('{animal}', name)
      .replace('{emoji}', emoji)
      .replace('{pct}', pct);
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text + ' https://dopabrain.com/sleep-animal/')}`, '_blank');
    if (typeof gtag !== 'undefined') gtag('event', 'share', { method: 'twitter' });
  });

  $('btn-copy').addEventListener('click', function() {
    navigator.clipboard.writeText('https://dopabrain.com/sleep-animal/').then(() => {
      this.textContent = '✅ ' + i18n.t('share.copied');
      setTimeout(() => { this.textContent = '📋 ' + i18n.t('share.copy'); }, 2000);
    });
    if (typeof gtag !== 'undefined') gtag('event', 'share', { method: 'url_copy' });
  });

  // ===== Navigation =====
  $('btn-start').addEventListener('click', () => {
    answers = new Array(10).fill(null);
    currentIdx = 0;
    showScreen('quiz');
    renderQuestion(0);
    if (typeof gtag !== 'undefined') gtag('event', 'sleep_animal_start');
  });

  $('btn-retry').addEventListener('click', () => {
    answers = new Array(10).fill(null);
    currentIdx = 0;
    showScreen('start');
    if (typeof gtag !== 'undefined') gtag('event', 'sleep_animal_retry');
  });

  // ===== Language =====
  const langBtn = $('lang-btn');
  const langMenu = $('lang-menu');
  langBtn.addEventListener('click', e => {
    e.stopPropagation();
    langMenu.classList.toggle('hidden');
  });
  document.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      await i18n.setLanguage(btn.dataset.lang);
      langMenu.classList.add('hidden');
      renderAnimalCards();
      // Re-render current screen
      if (screens.quiz.classList.contains('active')) renderQuestion(currentIdx);
      if (screens.result.classList.contains('active')) showResult();
    });
  });
  document.addEventListener('click', () => langMenu.classList.add('hidden'));

  // ===== Init =====
  initTheme();
  generateStars();

  window.addEventListener('languageChanged', () => {
    document.querySelectorAll('.lang-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === i18n.getCurrentLanguage());
    });
    renderAnimalCards();
  });

  // Hide loader
  window.addEventListener('load', () => {
    setTimeout(() => {
      $('app-loader').classList.add('hidden');
    }, 300);
  });

  // AdSense
  try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
})();
