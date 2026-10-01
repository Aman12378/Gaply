/**
 * ui.js - Skill Gap Analyzer
 * Handles DOM rendering, UI components, SVG Radar chart, Conic-gradient gauge,
 * accessible tabs, learning checklist, history drawer, and export APIs.
 */

(function (root) {
  'use strict';
  root.AppUI = (function () {
  'use strict';

  const CHECKLIST_STORAGE_KEY = 'skill_analyzer_learning_checklist_v1';
  const HISTORY_STORAGE_KEY = 'skill_analyzer_history_v1';

  // Load learning checklist from localStorage
  function getLearningChecklist() {
    try {
      const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  // Save learning checklist
  function saveLearningChecklist(list) {
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save learning checklist:', e);
    }
  }

  // Add skill to learning checklist
  function addToChecklist(skill) {
    const list = getLearningChecklist();
    if (!list.some(item => item.id === skill.id)) {
      list.push({
        id: skill.id,
        name: skill.name,
        category: skill.category,
        addedAt: new Date().toISOString(),
        completed: false
      });
      saveLearningChecklist(list);
    }
  }

  // Toggle item in learning checklist
  function toggleChecklistItem(skillId) {
    const list = getLearningChecklist();
    const item = list.find(i => i.id === skillId);
    if (item) {
      item.completed = !item.completed;
      saveLearningChecklist(list);
    }
    return list;
  }

  // Remove item from checklist
  function removeFromChecklist(skillId) {
    const list = getLearningChecklist().filter(i => i.id !== skillId);
    saveLearningChecklist(list);
    return list;
  }

  // Saved Analyses History
  function getHistory() {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  function saveToHistory(title, company, text, analysisResult) {
    const history = getHistory();
    const newEntry = {
      id: 'analysis_' + Date.now(),
      title: title || 'Untitled Job Description',
      company: company || 'Unknown Company',
      text: text,
      timestamp: new Date().toISOString(),
      matchPercentage: analysisResult.matchPercentage,
      totalSkills: analysisResult.skillBreakdown.length,
      gapsCount: analysisResult.gaps.length
    };
    // Keep max 20 history items
    const updated = [newEntry, ...history.slice(0, 19)];
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save analysis to history:', e);
    }
    return updated;
  }

  function deleteHistoryItem(id) {
    const updated = getHistory().filter(item => item.id !== id);
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete history item:', e);
    }
    return updated;
  }

  /**
   * Render Match Gauge with conic-gradient
   */
  function renderMatchGauge(containerEl, percentage) {
    if (!containerEl) return;
    
    // Determine color based on percentage
    let color = '#ef4444'; // Red < 40
    let label = 'Low Match';
    if (percentage >= 75) {
      color = '#10b981'; // Green >= 75
      label = 'Strong Fit';
    } else if (percentage >= 50) {
      color = '#f59e0b'; // Amber >= 50
      label = 'Moderate Match';
    } else if (percentage >= 30) {
      color = '#3b82f6'; // Blue >= 30
      label = 'Needs Upskilling';
    }

    containerEl.style.background = `conic-gradient(${color} 0% ${percentage}%, var(--gauge-track, #e2e8f0) ${percentage}% 100%)`;
    
    const valueEl = containerEl.querySelector('.gauge-value');
    if (valueEl) {
      valueEl.textContent = `${percentage}%`;
    }
    const labelEl = containerEl.querySelector('.gauge-label');
    if (labelEl) {
      labelEl.textContent = label;
      labelEl.style.color = color;
    }
  }

  /**
   * Render Category Radar Chart (SVG)
   */
  function renderRadarChart(svgEl, categoryScores) {
    if (!svgEl) return;
    
    const categories = [
      { key: 'languages', label: 'Languages' },
      { key: 'tooling', label: 'Tooling' },
      { key: 'concepts', label: 'Concepts' },
      { key: 'soft_skills', label: 'Soft Skills' }
    ];

    const width = 240;
    const height = 240;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 80;

    const angleStep = (Math.PI * 2) / categories.length;

    // Build SVG inner paths
    let svgContent = `
      <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="var(--border-color, #cbd5e1)" stroke-dasharray="3,3" />
      <circle cx="${centerX}" cy="${centerY}" r="${radius * 0.75}" fill="none" stroke="var(--border-color, #e2e8f0)" stroke-dasharray="2,2" />
      <circle cx="${centerX}" cy="${centerY}" r="${radius * 0.5}" fill="none" stroke="var(--border-color, #e2e8f0)" stroke-dasharray="2,2" />
      <circle cx="${centerX}" cy="${centerY}" r="${radius * 0.25}" fill="none" stroke="var(--border-color, #e2e8f0)" stroke-dasharray="2,2" />
    `;

    const polygonPoints = [];

    categories.forEach((cat, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const scoreObj = categoryScores[cat.key] || { percentage: 0 };
      const pct = Math.min(100, Math.max(0, scoreObj.percentage));
      const pointRadius = (pct / 100) * radius;

      const x = centerX + pointRadius * Math.cos(angle);
      const y = centerY + pointRadius * Math.sin(angle);
      polygonPoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);

      // Axis Line
      const axisX = centerX + radius * Math.cos(angle);
      const axisY = centerY + radius * Math.sin(angle);
      svgContent += `<line x1="${centerX}" y1="${centerY}" x2="${axisX}" y2="${axisY}" stroke="var(--border-color, #cbd5e1)" stroke-width="1" />`;

      // Axis Label
      const labelRadius = radius + 22;
      const labelX = centerX + labelRadius * Math.cos(angle);
      const labelY = centerY + labelRadius * Math.sin(angle);
      
      let textAnchor = 'middle';
      if (Math.abs(labelX - centerX) > 10) {
        textAnchor = labelX > centerX ? 'start' : 'end';
      }

      svgContent += `<text x="${labelX}" y="${labelY + 4}" font-size="10" font-weight="600" fill="var(--text-muted, #64748b)" text-anchor="${textAnchor}">${cat.label} (${pct}%)</text>`;
    });

    // Draw Score Polygon
    if (polygonPoints.length > 0) {
      const pointsString = polygonPoints.join(' ');
      svgContent += `<polygon points="${pointsString}" fill="rgba(99, 102, 241, 0.3)" stroke="var(--primary-color, #6366f1)" stroke-width="2" />`;
      
      // Points dots
      polygonPoints.forEach(pt => {
        const [px, py] = pt.split(',');
        svgContent += `<circle cx="${px}" cy="${py}" r="4" fill="var(--primary-color, #6366f1)" />`;
      });
    }

    svgEl.innerHTML = svgContent;
  }

  /**
   * Render Accessible Skills Found view using <details> / <summary>
   */
  function renderSkillsFound(containerEl, analysisResult) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    if (analysisResult.skillBreakdown.length === 0) {
      containerEl.innerHTML = `
        <div class="empty-state">
          <p class="empty-title">No skills detected yet</p>
          <p class="empty-desc">Paste a job description or load a sample above to extract skills automatically.</p>
        </div>
      `;
      return;
    }

    const categories = {
      languages: { name: 'Programming Languages', items: [], color: 'var(--cat-languages)' },
      tooling: { name: 'Frameworks & Tools', items: [], color: 'var(--cat-tooling)' },
      concepts: { name: 'Concepts & Architecture', items: [], color: 'var(--cat-concepts)' },
      soft_skills: { name: 'Soft Skills & Leadership', items: [], color: 'var(--cat-soft-skills)' }
    };

    analysisResult.skillBreakdown.forEach(item => {
      const catKey = item.skill.category || 'concepts';
      if (categories[catKey]) {
        categories[catKey].items.push(item);
      }
    });

    Object.keys(categories).forEach(catKey => {
      const cat = categories[catKey];
      if (cat.items.length === 0) return;

      const details = document.createElement('details');
      details.className = 'category-details';
      details.open = true; // Default open for visibility

      const summary = document.createElement('summary');
      summary.className = 'category-summary';
      summary.innerHTML = `
        <span class="category-title">
          <span class="category-badge cat-${catKey}"></span>
          ${cat.name} (${cat.items.length})
        </span>
        <span class="category-count">Mentions: ${cat.items.reduce((s, i) => s + i.count, 0)}</span>
      `;

      const listEl = document.createElement('div');
      listEl.className = 'skills-chip-grid';

      cat.items.forEach(item => {
        const chip = document.createElement('div');
        chip.className = `skill-chip req-${item.requirementLevel} user-level-${item.userLevel}`;
        
        const isMatch = item.userLevel >= 1;
        const matchBadge = isMatch 
          ? `<span class="badge match-badge" title="Your proficiency: Level ${item.userLevel}/5">Lvl ${item.userLevel}/5</span>`
          : `<span class="badge missing-badge" title="Missing from your profile">Missing</span>`;

        chip.innerHTML = `
          <span class="skill-name">${item.skill.name}</span>
          <span class="skill-meta">
            <span class="req-tag req-${item.requirementLevel}">${item.requirementLevel === 'required' ? 'Required' : 'Nice-to-have'}</span>
            <span class="freq-tag">${item.count}x</span>
            ${matchBadge}
          </span>
        `;

        listEl.appendChild(chip);
      });

      details.appendChild(summary);
      details.appendChild(listEl);
      containerEl.appendChild(details);
    });
  }

  /**
   * Render Ranked Gap List
   */
  function renderGapsList(containerEl, gaps, onAddSkillToProfile, onAddSkillToLearning) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    if (!gaps || gaps.length === 0) {
      containerEl.innerHTML = `
        <div class="empty-state success-state">
          <div class="success-icon">🎉</div>
          <p class="empty-title">Zero Skill Gaps Detected!</p>
          <p class="empty-desc">Your profile matches all detected skills for this job description!</p>
        </div>
      `;
      return;
    }

    const header = document.createElement('div');
    header.className = 'gaps-header';
    header.innerHTML = `
      <p class="gaps-subtext">Found <strong>${gaps.length} skill gaps</strong> weighted by role requirement and frequency.</p>
    `;
    containerEl.appendChild(header);

    const list = document.createElement('ul');
    list.className = 'gaps-list';

    gaps.forEach((gap, index) => {
      const li = document.createElement('li');
      li.className = `gap-card req-${gap.requirementLevel}`;

      const userLvlText = gap.userLevel === 0 ? 'Not in profile' : `Level ${gap.userLevel}/5`;
      const isChecklisted = getLearningChecklist().some(item => item.id === gap.skill.id);

      li.innerHTML = `
        <div class="gap-card-main">
          <div class="gap-rank">#${index + 1}</div>
          <div class="gap-info">
            <div class="gap-title-row">
              <h4 class="gap-name">${gap.skill.name}</h4>
              <span class="gap-category cat-badge cat-${gap.skill.category}">${gap.skill.category.replace('_', ' ')}</span>
            </div>
            <div class="gap-details">
              <span class="req-pill req-${gap.requirementLevel}">${gap.requirementLevel.toUpperCase()}</span>
              <span>Mentions: ${gap.count}x</span>
              <span>Current: ${userLvlText}</span>
            </div>
          </div>
        </div>
        <div class="gap-actions">
          <button class="btn btn-sm btn-outline add-profile-btn" data-skill-id="${gap.skill.id}">
            + Set Level in Profile
          </button>
          <button class="btn btn-sm ${isChecklisted ? 'btn-success' : 'btn-primary'} add-plan-btn" data-skill-id="${gap.skill.id}">
            ${isChecklisted ? '✓ In Learning Plan' : '+ Add to Learning Plan'}
          </button>
        </div>
      `;

      // Action event listeners
      const profileBtn = li.querySelector('.add-profile-btn');
      profileBtn.addEventListener('click', () => {
        if (onAddSkillToProfile) onAddSkillToProfile(gap.skill);
      });

      const planBtn = li.querySelector('.add-plan-btn');
      planBtn.addEventListener('click', () => {
        addToChecklist(gap.skill);
        planBtn.textContent = '✓ In Learning Plan';
        planBtn.classList.remove('btn-primary');
        planBtn.classList.add('btn-success');
        if (onAddSkillToLearning) onAddSkillToLearning();
      });

      list.appendChild(li);
    });

    containerEl.appendChild(list);
  }

  /**
   * Render Learning Checklist View
   */
  function renderLearningChecklist(containerEl) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    const list = getLearningChecklist();

    if (list.length === 0) {
      containerEl.innerHTML = `
        <div class="empty-state">
          <p class="empty-title">Your Learning Plan is Empty</p>
          <p class="empty-desc">Click "+ Add to Learning Plan" on any gap in the Gaps tab to create your targeted learning checklist.</p>
        </div>
      `;
      return;
    }

    const header = document.createElement('div');
    header.className = 'checklist-header';
    const completedCount = list.filter(i => i.completed).length;
    const progressPct = Math.round((completedCount / list.length) * 100);

    header.innerHTML = `
      <div class="checklist-progress-info">
        <span>Progress: ${completedCount} of ${list.length} completed (${progressPct}%)</span>
        <progress value="${completedCount}" max="${list.length}" class="checklist-progress-bar"></progress>
      </div>
    `;
    containerEl.appendChild(header);

    const ul = document.createElement('ul');
    ul.className = 'checklist-ul';

    list.forEach(item => {
      const li = document.createElement('li');
      li.className = `checklist-item ${item.completed ? 'completed' : ''}`;

      li.innerHTML = `
        <label class="checklist-label">
          <input type="checkbox" class="checklist-checkbox" data-skill-id="${item.id}" ${item.completed ? 'checked' : ''} />
          <span class="checklist-skill-name">${item.name}</span>
          <span class="cat-badge cat-${item.category}">${item.category.replace('_', ' ')}</span>
        </label>
        <button class="btn-icon remove-checklist-btn" data-skill-id="${item.id}" title="Remove from list">✕</button>
      `;

      const checkbox = li.querySelector('.checklist-checkbox');
      checkbox.addEventListener('change', () => {
        toggleChecklistItem(item.id);
        renderLearningChecklist(containerEl);
      });

      const removeBtn = li.querySelector('.remove-checklist-btn');
      removeBtn.addEventListener('click', () => {
        removeFromChecklist(item.id);
        renderLearningChecklist(containerEl);
      });

      ul.appendChild(li);
    });

    containerEl.appendChild(ul);
  }

  /**
   * Render Tailored CV Keywords View
   */
  function renderCVKeywords(containerEl, cvKeywords) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    if (!cvKeywords || cvKeywords.length === 0) {
      containerEl.innerHTML = `
        <div class="empty-state">
          <p class="empty-title">No tailored keywords available</p>
          <p class="empty-desc">Analyze a job description first to extract targeted resume keywords.</p>
        </div>
      `;
      return;
    }

    const keywordsText = cvKeywords.map(k => k.name).join(', ');

    const wrapper = document.createElement('div');
    wrapper.className = 'cv-keywords-container';

    wrapper.innerHTML = `
      <div class="cv-box-header">
        <p class="cv-desc">Below are the top relevant skills extracted from this job description that match your profile. Copy these directly into your Resume / CV Skills section.</p>
        <button class="btn btn-primary copy-cv-btn">📋 Copy All Keywords</button>
      </div>
      <div class="cv-keywords-box">
        <code>${keywordsText}</code>
      </div>
      <div class="cv-categories-list">
        <h4>Grouped for Resume Sections:</h4>
        <div class="cv-group">
          <strong>Languages:</strong> ${cvKeywords.filter(k => k.category === 'languages').map(k => k.name).join(', ') || 'N/A'}
        </div>
        <div class="cv-group">
          <strong>Tools & Frameworks:</strong> ${cvKeywords.filter(k => k.category === 'tooling').map(k => k.name).join(', ') || 'N/A'}
        </div>
        <div class="cv-group">
          <strong>Architecture & Concepts:</strong> ${cvKeywords.filter(k => k.category === 'concepts').map(k => k.name).join(', ') || 'N/A'}
        </div>
        <div class="cv-group">
          <strong>Professional & Soft Skills:</strong> ${cvKeywords.filter(k => k.category === 'soft_skills').map(k => k.name).join(', ') || 'N/A'}
        </div>
      </div>
    `;

    const copyBtn = wrapper.querySelector('.copy-cv-btn');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(keywordsText).then(() => {
        copyBtn.textContent = '✓ Copied to Clipboard!';
        setTimeout(() => {
          copyBtn.textContent = '📋 Copy All Keywords';
        }, 2000);
      }).catch(err => {
        console.error('Clipboard copy error:', err);
      });
    });

    containerEl.appendChild(wrapper);
  }

  /**
   * Setup Accessible Tabs Switcher
   */
  function setupTabs(tabListEl, panelsMap) {
    if (!tabListEl) return;

    const tabs = tabListEl.querySelectorAll('[role="tab"]');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetPanelId = tab.getAttribute('aria-controls');
        
        // Deactivate all tabs
        tabs.forEach(t => {
          t.setAttribute('aria-selected', 'false');
          t.classList.remove('active');
        });

        // Hide all panels
        Object.keys(panelsMap).forEach(panelId => {
          const panel = panelsMap[panelId];
          if (panel) {
            panel.hidden = true;
            panel.classList.remove('active');
          }
        });

        // Activate selected tab & panel
        tab.setAttribute('aria-selected', 'true');
        tab.classList.add('active');

        const activePanel = panelsMap[targetPanelId];
        if (activePanel) {
          activePanel.hidden = false;
          activePanel.classList.add('active');
        }
      });

      // Keyboard navigation for tablist
      tab.addEventListener('keydown', e => {
        const tabArray = Array.from(tabs);
        const currentIndex = tabArray.indexOf(tab);
        let nextIndex = null;

        if (e.key === 'ArrowRight') {
          nextIndex = (currentIndex + 1) % tabArray.length;
        } else if (e.key === 'ArrowLeft') {
          nextIndex = (currentIndex - 1 + tabArray.length) % tabArray.length;
        } else if (e.key === 'Home') {
          nextIndex = 0;
        } else if (e.key === 'End') {
          nextIndex = tabArray.length - 1;
        }

        if (nextIndex !== null) {
          e.preventDefault();
          tabArray[nextIndex].focus();
          tabArray[nextIndex].click();
        }
      });
    });
  }

  return {
    getLearningChecklist: getLearningChecklist,
    addToChecklist: addToChecklist,
    toggleChecklistItem: toggleChecklistItem,
    removeFromChecklist: removeFromChecklist,
    getHistory: getHistory,
    saveToHistory: saveToHistory,
    deleteHistoryItem: deleteHistoryItem,
    renderMatchGauge: renderMatchGauge,
    renderRadarChart: renderRadarChart,
    renderSkillsFound: renderSkillsFound,
    renderGapsList: renderGapsList,
    renderLearningChecklist: renderLearningChecklist,
    renderCVKeywords: renderCVKeywords,
    setupTabs: setupTabs
  };
})();
})(typeof window !== 'undefined' ? window : globalThis);
