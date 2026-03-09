/* =================================================================
   Sleep Animal - Circular Sleep Timeline Builder
   Users place activities on a 24-hour clock to reveal chronotype
   ================================================================= */

(() => {
  'use strict';

  // ===== Activity definitions =====
  const ACTIVITIES = [
    { id: 'sleep',    color: '#5B6ABF' },
    { id: 'nap',      color: '#8B7BDE' },
    { id: 'caffeine', color: '#D4915C' },
    { id: 'exercise', color: '#5BBF7B' },
    { id: 'screen',   color: '#BF5B5B' },
    { id: 'work',     color: '#BFA95B' },
    { id: 'meal',     color: '#BF8B5B' },
    { id: 'relax',    color: '#5BBFB8' },
  ];

  const ACTIVITY_ICONS = {
    sleep: '😴', nap: '💤', caffeine: '☕',
    exercise: '🏃', screen: '📱', work: '💼',
    meal: '🍽️', relax: '🧘',
  };

  const ANIMALS = ['bear', 'lion', 'wolf', 'dolphin'];
  const ANIMAL_EMOJIS = { bear: '🐻', lion: '🦁', wolf: '🐺', dolphin: '🐬' };
  const ANIMAL_PCTS = { bear: '55', lion: '15', wolf: '15', dolphin: '10' };
  const TIP_ICONS = ['🌙', '💤', '🛏️', '✨', '🍵'];

  // Reference chronotype schedules (hour -> activity mapping)
  const CHRONOTYPE_PATTERNS = {
    bear: {
      sleep: [23, 0, 1, 2, 3, 4, 5, 6],
      work: [10, 11, 12, 13, 14],
      exercise: [12],
      caffeine: [8],
      meal: [7, 13, 19],
      relax: [21, 22],
      screen: [15, 16],
    },
    lion: {
      sleep: [22, 23, 0, 1, 2, 3, 4],
      work: [6, 7, 8, 9, 10, 11],
      exercise: [5],
      caffeine: [6],
      meal: [7, 12, 18],
      relax: [20, 21],
      screen: [14, 15],
    },
    wolf: {
      sleep: [1, 2, 3, 4, 5, 6, 7],
      work: [17, 18, 19, 20, 21, 22, 23],
      exercise: [18],
      caffeine: [14],
      meal: [10, 15, 21],
      relax: [0],
      screen: [22, 23],
    },
    dolphin: {
      sleep: [0, 1, 2, 3, 4, 5],
      work: [10, 11],
      exercise: [7],
      caffeine: [8],
      meal: [7, 12, 19],
      nap: [14],
      relax: [22, 23],
      screen: [16, 17],
    },
  };

  // ===== State =====
  const timeline = new Array(24).fill(null); // each slot: activity id or null
  let selectedActivity = null;
  let isDark = true;

  // ===== DOM helpers =====
  const $ = id => document.getElementById(id);
  const screens = {
    start: $('screen-start'),
    timeline: $('screen-timeline'),
    result: $('screen-result'),
  };

  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ===== Stars =====
  function generateStars() {
    const container = document.querySelector('.stars');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 60; i++) {
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

  // ===== Activity Palette =====
  function renderPalette() {
    const palette = $('activity-palette');
    palette.innerHTML = '';
    ACTIVITIES.forEach(act => {
      const btn = document.createElement('button');
      btn.className = 'activity-btn';
      btn.dataset.activity = act.id;
      btn.style.setProperty('--activity-color', act.color);
      if (selectedActivity === act.id) btn.classList.add('selected');

      const dot = document.createElement('span');
      dot.className = 'activity-dot';
      dot.style.background = act.color;

      const label = document.createElement('span');
      label.textContent = `${ACTIVITY_ICONS[act.id]} ${i18n.t('activities.' + act.id)}`;

      btn.appendChild(dot);
      btn.appendChild(label);

      btn.addEventListener('click', () => {
        // Toggle: if already selected, deselect (eraser mode)
        if (selectedActivity === act.id) {
          selectedActivity = null;
        } else {
          selectedActivity = act.id;
        }
        renderPalette();
        updateCenterText();
      });

      palette.appendChild(btn);
    });

    // Eraser button
    const eraserBtn = document.createElement('button');
    eraserBtn.className = 'activity-btn';
    eraserBtn.style.setProperty('--activity-color', 'rgba(255,255,255,0.3)');
    if (selectedActivity === '__eraser') eraserBtn.classList.add('selected');

    const eraserLabel = document.createElement('span');
    eraserLabel.textContent = `🧹 ${i18n.t('activities.eraser')}`;
    eraserBtn.appendChild(eraserLabel);

    eraserBtn.addEventListener('click', () => {
      selectedActivity = selectedActivity === '__eraser' ? null : '__eraser';
      renderPalette();
      updateCenterText();
    });
    palette.appendChild(eraserBtn);
  }

  function updateCenterText() {
    const icon = $('clock-center-icon');
    const text = $('clock-center-text');
    if (selectedActivity && selectedActivity !== '__eraser') {
      icon.textContent = ACTIVITY_ICONS[selectedActivity] || '🌙';
      text.textContent = i18n.t('activities.' + selectedActivity);
    } else if (selectedActivity === '__eraser') {
      icon.textContent = '🧹';
      text.textContent = i18n.t('activities.eraser');
    } else {
      icon.textContent = '🌙';
      text.textContent = i18n.t('timeline.tapHour');
    }
  }

  // ===== Circular Clock SVG =====
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const CX = 200, CY = 200;
  const OUTER_R = 170, INNER_R = 80;
  const LABEL_R = OUTER_R + 16;

  function polarToXY(cx, cy, r, angleDeg) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function createArcPath(startAngle, endAngle, outerR, innerR) {
    const s1 = polarToXY(CX, CY, outerR, startAngle);
    const e1 = polarToXY(CX, CY, outerR, endAngle);
    const s2 = polarToXY(CX, CY, innerR, endAngle);
    const e2 = polarToXY(CX, CY, innerR, startAngle);
    const large = endAngle - startAngle > 180 ? 1 : 0;

    return [
      `M ${s1.x} ${s1.y}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${e1.x} ${e1.y}`,
      `L ${s2.x} ${s2.y}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${e2.x} ${e2.y}`,
      'Z',
    ].join(' ');
  }

  function renderClock() {
    const svg = $('clock-svg');
    svg.innerHTML = '';

    // Background circle
    const bgCircle = document.createElementNS(SVG_NS, 'circle');
    bgCircle.setAttribute('cx', CX);
    bgCircle.setAttribute('cy', CY);
    bgCircle.setAttribute('r', OUTER_R);
    bgCircle.setAttribute('fill', 'none');
    bgCircle.setAttribute('stroke', isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)');
    bgCircle.setAttribute('stroke-width', '1');
    svg.appendChild(bgCircle);

    // Inner circle
    const innerCircle = document.createElementNS(SVG_NS, 'circle');
    innerCircle.setAttribute('cx', CX);
    innerCircle.setAttribute('cy', CY);
    innerCircle.setAttribute('r', INNER_R);
    innerCircle.setAttribute('fill', isDark ? 'rgba(10,10,26,0.8)' : 'rgba(240,240,255,0.8)');
    innerCircle.setAttribute('stroke', isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)');
    innerCircle.setAttribute('stroke-width', '1');
    svg.appendChild(innerCircle);

    // Segments (24 hours)
    for (let h = 0; h < 24; h++) {
      const startAngle = h * 15; // 360/24 = 15 degrees per hour
      const endAngle = startAngle + 14.5; // small gap
      const activity = timeline[h];
      const actObj = ACTIVITIES.find(a => a.id === activity);

      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', createArcPath(startAngle, endAngle, OUTER_R, INNER_R));
      path.setAttribute('class', 'clock-segment' + (activity ? ' filled' : ''));
      path.setAttribute('data-hour', h);

      if (actObj) {
        path.setAttribute('fill', actObj.color);
        path.setAttribute('fill-opacity', '0.7');
        path.setAttribute('stroke', actObj.color);
        path.setAttribute('stroke-width', '1');
      } else {
        path.setAttribute('fill', isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)');
        path.setAttribute('stroke', isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)');
        path.setAttribute('stroke-width', '0.5');
      }

      path.addEventListener('click', () => handleHourClick(h));

      // Touch support for painting
      path.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleHourClick(h);
      }, { passive: false });

      svg.appendChild(path);
    }

    // Hour labels (outside the ring)
    for (let h = 0; h < 24; h += 1) {
      // Only show every 3 hours for readability
      if (h % 3 !== 0) continue;
      const angle = h * 15;
      const pos = polarToXY(CX, CY, LABEL_R, angle);

      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', pos.x);
      text.setAttribute('y', pos.y);
      text.setAttribute('class', 'clock-hour-label');

      // Format: 0 -> 12AM, 6 -> 6AM, 12 -> 12PM, 18 -> 6PM
      let label;
      if (h === 0) label = '12AM';
      else if (h === 12) label = '12PM';
      else if (h < 12) label = h + 'AM';
      else label = (h - 12) + 'PM';

      text.textContent = label;
      svg.appendChild(text);
    }

    // Night/day indicator arcs (subtle)
    const nightArc = document.createElementNS(SVG_NS, 'path');
    // Night: roughly 21:00 to 6:00 (315 deg to 90 deg)
    nightArc.setAttribute('d', createArcPath(315, 360 + 90, OUTER_R + 3, OUTER_R + 1));
    nightArc.setAttribute('fill', 'rgba(91, 106, 191, 0.15)');
    nightArc.setAttribute('pointer-events', 'none');
    svg.appendChild(nightArc);

    const dayArc = document.createElementNS(SVG_NS, 'path');
    dayArc.setAttribute('d', createArcPath(90, 315, OUTER_R + 3, OUTER_R + 1));
    dayArc.setAttribute('fill', 'rgba(232, 168, 56, 0.12)');
    dayArc.setAttribute('pointer-events', 'none');
    svg.appendChild(dayArc);

    updateStats();
    updateAnalyzeBtn();
  }

  function handleHourClick(hour) {
    if (selectedActivity === '__eraser') {
      timeline[hour] = null;
    } else if (selectedActivity) {
      timeline[hour] = selectedActivity;
    }
    renderClock();
  }

  // ===== Legend =====
  function renderLegend() {
    const legend = $('timeline-legend');
    legend.innerHTML = '';
    ACTIVITIES.forEach(act => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      const dot = document.createElement('span');
      dot.className = 'legend-dot';
      dot.style.background = act.color;
      const label = document.createElement('span');
      label.textContent = i18n.t('activities.' + act.id);
      item.appendChild(dot);
      item.appendChild(label);
      legend.appendChild(item);
    });
  }

  // ===== Stats =====
  function updateStats() {
    const stats = $('timeline-stats');
    stats.innerHTML = '';

    const counts = {};
    let filled = 0;
    timeline.forEach(act => {
      if (act) {
        counts[act] = (counts[act] || 0) + 1;
        filled++;
      }
    });

    const sleepHours = counts.sleep || 0;
    const activeHours = filled;

    const statData = [
      { value: sleepHours + 'h', labelKey: 'stats.sleepHours' },
      { value: activeHours + '/24', labelKey: 'stats.filledSlots' },
      { value: (counts.caffeine || 0) + 'h', labelKey: 'stats.caffeineHours' },
    ];

    statData.forEach(s => {
      const card = document.createElement('div');
      card.className = 'stat-card';
      card.innerHTML = `<div class="stat-value">${s.value}</div><div class="stat-label">${i18n.t(s.labelKey)}</div>`;
      stats.appendChild(card);
    });
  }

  function updateAnalyzeBtn() {
    const btn = $('btn-analyze');
    const filled = timeline.filter(Boolean).length;
    btn.disabled = filled < 4;
  }

  // ===== Chronotype Scoring =====
  function calcChronotype() {
    const scores = { bear: 0, lion: 0, wolf: 0, dolphin: 0 };

    // Score based on sleep timing
    const sleepHours = [];
    const wakeHour = findTransition(null, 'sleep', true); // first non-sleep after sleep
    const bedHour = findTransition('sleep', null, false); // first sleep

    timeline.forEach((act, h) => {
      if (act === 'sleep') sleepHours.push(h);
    });

    // Bedtime scoring
    const bedtime = findFirstHourOf('sleep');
    if (bedtime !== -1) {
      // Bear: 22-23, Lion: 21-22, Wolf: 0-2, Dolphin: 23-1
      if (bedtime >= 22 && bedtime <= 23) { scores.bear += 3; scores.lion += 2; }
      else if (bedtime >= 21 && bedtime < 22) { scores.lion += 3; scores.bear += 1; }
      else if (bedtime >= 0 && bedtime <= 2) { scores.wolf += 3; }
      else if (bedtime === 23 || bedtime === 0) { scores.dolphin += 2; scores.bear += 1; }
      else if (bedtime >= 3) { scores.wolf += 2; scores.dolphin += 2; }
      else if (bedtime >= 20 && bedtime < 21) { scores.lion += 2; }
    }

    // Wake time scoring
    const wakeTime = findWakeTime();
    if (wakeTime !== -1) {
      if (wakeTime >= 5 && wakeTime <= 6) { scores.lion += 3; }
      else if (wakeTime >= 7 && wakeTime <= 8) { scores.bear += 3; scores.dolphin += 1; }
      else if (wakeTime >= 9) { scores.wolf += 3; }
      else if (wakeTime === 6 || wakeTime === 7) { scores.bear += 2; scores.dolphin += 2; }
    }

    // Sleep duration
    const sleepCount = sleepHours.length;
    if (sleepCount >= 7 && sleepCount <= 8) { scores.bear += 2; scores.lion += 2; }
    else if (sleepCount >= 9) { scores.wolf += 1; }
    else if (sleepCount <= 5) { scores.dolphin += 3; }
    else if (sleepCount === 6) { scores.dolphin += 1; scores.wolf += 1; }

    // Exercise timing
    const exerciseHours = [];
    timeline.forEach((act, h) => { if (act === 'exercise') exerciseHours.push(h); });
    exerciseHours.forEach(h => {
      if (h >= 5 && h <= 7) scores.lion += 2;
      else if (h >= 11 && h <= 13) scores.bear += 2;
      else if (h >= 17 && h <= 19) scores.wolf += 2;
      else if (h >= 7 && h <= 9) scores.dolphin += 1;
    });

    // Caffeine timing
    const caffeineHours = [];
    timeline.forEach((act, h) => { if (act === 'caffeine') caffeineHours.push(h); });
    caffeineHours.forEach(h => {
      if (h >= 6 && h <= 8) { scores.bear += 1; scores.lion += 1; }
      else if (h >= 14 && h <= 18) scores.wolf += 2;
      else if (h >= 8 && h <= 10) scores.dolphin += 1;
    });

    // Work/productive hours
    const workHours = [];
    timeline.forEach((act, h) => { if (act === 'work') workHours.push(h); });
    workHours.forEach(h => {
      if (h >= 6 && h <= 11) scores.lion += 1;
      else if (h >= 10 && h <= 14) scores.bear += 1;
      else if (h >= 17 && h <= 23) scores.wolf += 1;
      else if (h >= 10 && h <= 12) scores.dolphin += 1;
    });

    // Screen time
    const screenHours = [];
    timeline.forEach((act, h) => { if (act === 'screen') screenHours.push(h); });
    screenHours.forEach(h => {
      if (h >= 22 || h <= 2) { scores.wolf += 1; scores.dolphin += 1; }
    });

    // Nap scoring
    const napHours = [];
    timeline.forEach((act, h) => { if (act === 'nap') napHours.push(h); });
    if (napHours.length > 0) {
      scores.dolphin += 2;
      scores.bear += 1;
    }

    // Irregularity bonus for dolphin
    const actTypes = new Set(timeline.filter(Boolean));
    if (actTypes.size >= 6) scores.dolphin += 1;

    // Find winner
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

  function findFirstHourOf(activity) {
    // Find the first hour of a contiguous sleep block that contains late night
    // Check if sleep wraps around midnight
    const hours = [];
    timeline.forEach((act, h) => { if (act === activity) hours.push(h); });
    if (hours.length === 0) return -1;

    // Find the start of the main sleep block
    // Look for the transition from non-sleep to sleep going backwards from midnight
    for (let h = 23; h >= 0; h--) {
      if (timeline[h] === activity && (h === 0 || timeline[(h - 1 + 24) % 24] !== activity)) {
        return h;
      }
    }
    return hours[0];
  }

  function findWakeTime() {
    // Find when sleep ends (transition from sleep to non-sleep in morning hours)
    for (let h = 4; h <= 12; h++) {
      if (timeline[h] !== 'sleep' && timeline[(h - 1 + 24) % 24] === 'sleep') {
        return h;
      }
    }
    return -1;
  }

  function findTransition(from, to, forward) {
    for (let i = 0; i < 24; i++) {
      const h = forward ? i : (23 - i);
      const prev = (h - 1 + 24) % 24;
      if (timeline[prev] === from && timeline[h] === to) return h;
    }
    return -1;
  }

  // ===== Result =====
  function showResult() {
    const { animal, scores } = calcChronotype();

    showScreen('result');

    // Animal emoji + name
    $('result-emoji').textContent = ANIMAL_EMOJIS[animal];
    $('result-type-label').textContent = i18n.t('results.yourType');

    const nameEl = $('result-name');
    nameEl.textContent = i18n.t(`results.${animal}.name`);
    nameEl.className = 'result-animal-name ' + animal;

    // Percentage
    const pct = i18n.t(`results.${animal}.pct`) || ANIMAL_PCTS[animal];
    $('result-percentage').textContent = i18n.t('results.percentage').replace('{pct}', pct);

    // Description
    $('result-desc').textContent = i18n.t(`results.${animal}.description`);

    // Comparison clocks
    renderComparisonClocks(animal);

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
        event_category: 'timeline_builder',
      });
    }
  }

  // ===== Comparison Mini-Clocks =====
  function renderComparisonClocks(animal) {
    const container = $('comparison-clocks');
    container.innerHTML = '';

    // User's timeline
    const userItem = document.createElement('div');
    userItem.className = 'comparison-item';
    userItem.innerHTML = `<div class="comparison-label">${i18n.t('results.yourTimeline')}</div>`;
    const userClock = document.createElement('div');
    userClock.className = 'comparison-clock';
    userClock.appendChild(createMiniClock(timeline));
    userItem.appendChild(userClock);
    container.appendChild(userItem);

    // Animal ideal timeline
    const pattern = CHRONOTYPE_PATTERNS[animal];
    const idealTimeline = new Array(24).fill(null);
    for (const [act, hours] of Object.entries(pattern)) {
      hours.forEach(h => { idealTimeline[h] = act; });
    }

    const idealItem = document.createElement('div');
    idealItem.className = 'comparison-item';
    idealItem.innerHTML = `<div class="comparison-label">${ANIMAL_EMOJIS[animal]} ${i18n.t('results.idealTimeline')}</div>`;
    const idealClock = document.createElement('div');
    idealClock.className = 'comparison-clock';
    idealClock.appendChild(createMiniClock(idealTimeline));
    idealItem.appendChild(idealClock);
    container.appendChild(idealItem);
  }

  function createMiniClock(data) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    const cx = 100, cy = 100, outerR = 85, innerR = 40;

    // Background
    const bg = document.createElementNS(SVG_NS, 'circle');
    bg.setAttribute('cx', cx);
    bg.setAttribute('cy', cy);
    bg.setAttribute('r', outerR);
    bg.setAttribute('fill', 'none');
    bg.setAttribute('stroke', isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)');
    bg.setAttribute('stroke-width', '1');
    svg.appendChild(bg);

    const inner = document.createElementNS(SVG_NS, 'circle');
    inner.setAttribute('cx', cx);
    inner.setAttribute('cy', cy);
    inner.setAttribute('r', innerR);
    inner.setAttribute('fill', isDark ? 'rgba(10,10,26,0.6)' : 'rgba(240,240,255,0.6)');
    inner.setAttribute('stroke', isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)');
    inner.setAttribute('stroke-width', '1');
    svg.appendChild(inner);

    for (let h = 0; h < 24; h++) {
      const startAngle = h * 15;
      const endAngle = startAngle + 14;
      const activity = data[h];
      const actObj = ACTIVITIES.find(a => a.id === activity);

      const p1 = polarToXY(cx, cy, outerR, startAngle);
      const p2 = polarToXY(cx, cy, outerR, endAngle);
      const p3 = polarToXY(cx, cy, innerR, endAngle);
      const p4 = polarToXY(cx, cy, innerR, startAngle);

      const path = document.createElementNS(SVG_NS, 'path');
      const d = [
        `M ${p1.x} ${p1.y}`,
        `A ${outerR} ${outerR} 0 0 1 ${p2.x} ${p2.y}`,
        `L ${p3.x} ${p3.y}`,
        `A ${innerR} ${innerR} 0 0 0 ${p4.x} ${p4.y}`,
        'Z',
      ].join(' ');
      path.setAttribute('d', d);

      if (actObj) {
        path.setAttribute('fill', actObj.color);
        path.setAttribute('fill-opacity', '0.65');
      } else {
        path.setAttribute('fill', isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)');
      }
      svg.appendChild(path);
    }

    return svg;
  }

  // ===== Share =====
  $('btn-twitter').addEventListener('click', () => {
    const { animal } = calcChronotype();
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
    timeline.fill(null);
    selectedActivity = null;
    showScreen('timeline');
    renderPalette();
    renderClock();
    renderLegend();
    updateCenterText();
    if (typeof gtag !== 'undefined') gtag('event', 'sleep_animal_start');
  });

  $('btn-clear').addEventListener('click', () => {
    timeline.fill(null);
    renderClock();
  });

  $('btn-analyze').addEventListener('click', () => {
    showResult();
  });

  $('btn-retry').addEventListener('click', () => {
    timeline.fill(null);
    selectedActivity = null;
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
      // Re-render current screen content
      if (screens.timeline.classList.contains('active')) {
        renderPalette();
        renderClock();
        renderLegend();
        updateCenterText();
      }
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
