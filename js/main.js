/**
 * main.js - Skill Gap Analyzer
 * Main application coordinator, event routing, debouncing, data fetching,
 * theme management, modals, and export handlers.
 */

(function () {
  'use strict';

  // Fallback Inline Skills Dictionary (In case fetch data/skills.json fails)
  const FALLBACK_SKILLS = [
    { id: "javascript", name: "JavaScript", category: "languages", synonyms: ["js", "javascript", "ecmascript", "es6"], defaultWeight: 5 },
    { id: "typescript", name: "TypeScript", category: "languages", synonyms: ["ts", "typescript"], defaultWeight: 5 },
    { id: "python", name: "Python", category: "languages", synonyms: ["python", "py", "python3"], defaultWeight: 4 },
    { id: "java", name: "Java", category: "languages", synonyms: ["java", "jdk"], defaultWeight: 4 },
    { id: "cpp", name: "C++", category: "languages", synonyms: ["c++", "cpp"], defaultWeight: 4 },
    { id: "csharp", name: "C#", category: "languages", synonyms: ["c#", "csharp", "c-sharp"], defaultWeight: 4 },
    { id: "dotnet", name: ".NET", category: "tooling", synonyms: [".net", "dotnet", ".net core"], defaultWeight: 4 },
    { id: "html", name: "HTML5", category: "languages", synonyms: ["html", "html5"], defaultWeight: 4 },
    { id: "css", name: "CSS3", category: "languages", synonyms: ["css", "css3"], defaultWeight: 4 },
    { id: "sql", name: "SQL", category: "languages", synonyms: ["sql", "mysql", "postgresql", "postgres"], defaultWeight: 4 },
    { id: "react", name: "React", category: "tooling", synonyms: ["react", "react.js", "reactjs"], defaultWeight: 5 },
    { id: "vue", name: "Vue.js", category: "tooling", synonyms: ["vue", "vue.js", "vuejs"], defaultWeight: 4 },
    { id: "nodejs", name: "Node.js", category: "tooling", synonyms: ["node", "node.js", "nodejs"], defaultWeight: 5 },
    { id: "express", name: "Express.js", category: "tooling", synonyms: ["express", "express.js"], defaultWeight: 4 },
    { id: "nextjs", name: "Next.js", category: "tooling", synonyms: ["next", "next.js", "nextjs"], defaultWeight: 4 },
    { id: "git", name: "Git", category: "tooling", synonyms: ["git", "github", "gitlab"], defaultWeight: 4 },
    { id: "docker", name: "Docker", category: "tooling", synonyms: ["docker", "containers"], defaultWeight: 4 },
    { id: "kubernetes", name: "Kubernetes", category: "tooling", synonyms: ["k8s", "kubernetes"], defaultWeight: 4 },
    { id: "aws", name: "AWS", category: "tooling", synonyms: ["aws", "amazon web services"], defaultWeight: 4 },
    { id: "tailwind", name: "Tailwind CSS", category: "tooling", synonyms: ["tailwind", "tailwindcss"], defaultWeight: 4 },
    { id: "rest_api", name: "REST API", category: "concepts", synonyms: ["rest", "restful", "rest api", "restful api"], defaultWeight: 4 },
    { id: "microservices", name: "Microservices", category: "concepts", synonyms: ["microservices"], defaultWeight: 4 },
    { id: "agile", name: "Agile / Scrum", category: "concepts", synonyms: ["agile", "scrum", "kanban"], defaultWeight: 3 },
    { id: "cicd", name: "CI/CD", category: "concepts", synonyms: ["ci/cd", "ci-cd", "continuous integration"], defaultWeight: 4 },
    { id: "responsive_design", name: "Responsive Web Design", category: "concepts", synonyms: ["responsive design", "mobile-first"], defaultWeight: 4 },
    { id: "accessibility", name: "Accessibility (a11y)", category: "concepts", synonyms: ["accessibility", "a11y", "wcag"], defaultWeight: 4 },
    { id: "communication", name: "Communication", category: "soft_skills", synonyms: ["communication"], defaultWeight: 4 },
    { id: "teamwork", name: "Teamwork", category: "soft_skills", synonyms: ["teamwork", "collaboration"], defaultWeight: 4 },
    { id: "problem_solving", name: "Problem Solving", category: "soft_skills", synonyms: ["problem-solving", "problem solving", "analytical"], defaultWeight: 4 }
  ];

  // Fallback Inline Sample JDs
  const FALLBACK_SAMPLES = [
    {
      id: "frontend-senior",
      title: "Senior Frontend Developer (React / TypeScript)",
      company: "TechScale Solutions",
      text: "We are seeking a passionate Senior Frontend Developer to lead our client-facing web application development. \n\nKey Responsibilities:\n- Build scalable, responsive web applications using React, TypeScript, and modern CSS3.\n- Architect state management solutions using Redux and optimize web performance.\n- Collaborate in an Agile / Scrum environment with designers, product managers, and backend engineers.\n- Champion Accessibility (a11y) standards and clean code practices.\n\nRequired Qualifications:\n- 4+ years of professional software development experience.\n- Strong proficiency in JavaScript (ES6+), TypeScript, and HTML5.\n- Hands-on experience with React, REST API integration, and Git.\n- Deep understanding of Responsive Web Design and cross-browser compatibility.\n- Excellent Problem Solving and Communication skills.\n\nPreferred / Nice-to-Have:\n- Experience with Next.js and Tailwind CSS is a plus.\n- Familiarity with CI/CD pipelines, Docker, and Webpack.\n- Knowledge of Automated testing using Jest or Cypress is preferred.\n- Exposure to AWS cloud infrastructure."
    },
    {
      id: "fullstack-engineer",
      title: "Full Stack Engineer (Node.js & React)",
      company: "CloudPulse Systems",
      text: "CloudPulse Systems is hiring a Full Stack Engineer to build high-performance microservices and intuitive user interfaces.\n\nResponsibilities:\n- Design and implement REST APIs and Microservices using Node.js and Express.js.\n- Develop modern frontend interfaces using React, HTML, and CSS.\n- Work with relational databases like PostgreSQL (SQL) and NoSQL stores like MongoDB.\n- Write clean, maintainable code following TDD and OOP principles.\n\nMust-Have Skills:\n- Required 3+ years experience with JavaScript, Node.js, and Express.\n- Strong expertise in SQL databases, RESTful web services, and Git version control.\n- Proficiency in Teamwork, Adaptability, and Critical Thinking.\n\nBonus Points:\n- Experience with Docker, Kubernetes, and AWS cloud services is a major plus.\n- Knowledge of GraphQL and Redis is nice to have.\n- Background in System Design and CI/CD automated deployments."
    }
  ];

  // Application State
  let skillsDictionary = [];
  let sampleJDs = [];
  let currentAnalysis = null;
  let parsedJDResult = null;
  let showHighlights = true;
  let pendingAvatarDataUrl = null;

  // DOM Elements
  let jdTextarea, charCountOutput, wordCountOutput, sampleSelect;
  let highlightedContainer, highlightToggleBtn, clearTextBtn;
  let matchGaugeEl, radarSvgEl, liveScoreOutput;
  let tabListEl, panelSkills, panelGaps, panelPlan, panelCv;

  // Auth & Header DOM Nodes
  let authButtonsContainer, userProfileBar, userAvatarChip, userAvatarImg, userDisplayName, logoutBtn;
  let openLoginBtn, openRegisterBtn, loginModal, closeLoginBtn, loginForm, loginErrorMsg, switchToRegister;
  let registerModal, closeRegisterBtn, registrationForm, regErrorMsg, switchToLogin, regResumeFile, regResumeStatus;

  // Profile Drawer & Resume DOM Nodes
  let profileDrawer, openProfileBtn, closeProfileBtn, profileSkillsList, resetProfileBtn, addProfileSkillSelect, addProfileSkillBtn;
  let drawerTabBtns, drawerTabPanels;
  let editProfileForm, editAvatarFile, editAvatarPreview, editAvatarPlaceholder;
  let editName, editEmail, editPhone, editWhatsapp, editLinkedin, editGithub, editLeetcode, editAddress, editGender;
  let resumeDropzone, resumeFileInput, browseResumeBtn, activeResumeInfo, resumeFileNameEl, resumeUploadDateEl, extractedSkillsSummaryEl, reparseResumeBtn;

  // History & Compare DOM Nodes
  let historyDrawer, openHistoryBtn, closeHistoryBtn, historyListEl, saveHistoryBtn;
  let compareModal, openCompareBtn, closeCompareBtn, runCompareBtn, compareJdBTextarea, compareResultsContainer;
  let exportBtn, printBtn, themeToggleBtn;

  /**
   * Debounce helper
   */
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Fetch skills dictionary with fallback
   */
  async function loadSkillsDictionary() {
    try {
      const response = await fetch('data/skills.json');
      if (response.ok) {
        skillsDictionary = await response.json();
      } else {
        throw new Error('Fetch failed with status ' + response.status);
      }
    } catch (e) {
      console.warn('Loading fallback skills dictionary:', e.message);
      skillsDictionary = FALLBACK_SKILLS;
    }
  }

  /**
   * Fetch sample JDs with fallback
   */
  async function loadSampleJDs() {
    try {
      const response = await fetch('data/sample-jds.json');
      if (response.ok) {
        sampleJDs = await response.json();
      } else {
        throw new Error('Fetch failed with status ' + response.status);
      }
    } catch (e) {
      console.warn('Loading fallback sample JDs:', e.message);
      sampleJDs = FALLBACK_SAMPLES;
    }
    populateSampleDropdown();
  }

  /**
   * Populate Sample JDs Dropdown
   */
  function populateSampleDropdown() {
    if (!sampleSelect) return;
    sampleSelect.innerHTML = '<option value="">-- Load a Sample Job Description --</option>';
    sampleJDs.forEach(sample => {
      const opt = document.createElement('option');
      opt.value = sample.id;
      opt.textContent = `${sample.title} (${sample.company})`;
      sampleSelect.appendChild(opt);
    });
  }

  /**
   * Core Analysis Execution
   */
  function executeAnalysis() {
    let text = jdTextarea ? jdTextarea.value : '';

    // Auto-detect and clean raw PDF code syntax if pasted/loaded into input
    if (text.includes('%PDF-') || text.includes('/Linearized') || text.includes('/DecodeParms') || text.includes('/ObjStm') || text.includes('<< /XRef')) {
      text = AppParser.cleanPdfSyntax(text);
      if (text.includes('Visual PDF Document Uploaded') || text.length < 10) {
        text = '';
      }
      if (jdTextarea) jdTextarea.value = text;
    }

    const userProfile = AppProfile.getProfile();

    // Word & Char Count
    parsedJDResult = AppParser.parseJobDescription(text, skillsDictionary);
    
    if (wordCountOutput) wordCountOutput.textContent = `${parsedJDResult.wordCount} words`;
    if (charCountOutput) charCountOutput.textContent = `${parsedJDResult.charCount} chars`;

    // Calculate match score
    currentAnalysis = AppScoring.calculateMatch(parsedJDResult, userProfile);

    // Live Output aria text
    if (liveScoreOutput) {
      liveScoreOutput.textContent = `Match score: ${currentAnalysis.matchPercentage}%. Found ${parsedJDResult.matchedSkills.length} skills and ${currentAnalysis.gaps.length} gaps.`;
    }

    // Render Highlights Panel
    if (highlightedContainer) {
      highlightedContainer.innerHTML = '';
      if (!text.trim()) {
        highlightedContainer.innerHTML = `
          <div class="empty-state">
            <p class="empty-title">Highlighted preview will appear here</p>
            <p class="empty-desc">As you type or load a job description, extracted skills will be color-coded by category.</p>
          </div>
        `;
      } else {
        const frag = AppParser.createHighlightedFragment(text, parsedJDResult.matchedSkills);
        highlightedContainer.appendChild(frag);
        if (!showHighlights) {
          highlightedContainer.classList.add('hide-highlights');
        } else {
          highlightedContainer.classList.remove('hide-highlights');
        }
      }
    }

    // Render Radial Gauge
    AppUI.renderMatchGauge(matchGaugeEl, currentAnalysis.matchPercentage);

    // Render SVG Radar Chart
    AppUI.renderRadarChart(radarSvgEl, currentAnalysis.categoryScores);

    // Render Tabs Panels
    AppUI.renderSkillsFound(panelSkills, currentAnalysis);

    AppUI.renderGapsList(
      panelGaps, 
      currentAnalysis.gaps, 
      (skill) => openProfileForSkill(skill.id),
      () => AppUI.renderLearningChecklist(panelPlan)
    );

    AppUI.renderLearningChecklist(panelPlan);

    const cvKeywords = AppScoring.generateCVKeywords(parsedJDResult, userProfile);
    AppUI.renderCVKeywords(panelCv, cvKeywords);
  }

  const debouncedAnalysis = debounce(executeAnalysis, 300);

  /**
   * Render User Skill Profile Editor
   */
  function renderProfileEditor() {
    if (!profileSkillsList) return;
    profileSkillsList.innerHTML = '';

    const profile = AppProfile.getProfile();
    const skillMap = new Map(skillsDictionary.map(s => [s.id, s]));

    const entries = Object.entries(profile);

    if (entries.length === 0) {
      profileSkillsList.innerHTML = '<p class="empty-desc">No skills added to your profile yet.</p>';
      return;
    }

    entries.forEach(([skillId, level]) => {
      const skillObj = skillMap.get(skillId) || { name: skillId, category: 'concepts' };

      const div = document.createElement('div');
      div.className = 'profile-skill-row';

      div.innerHTML = `
        <div class="profile-skill-info">
          <strong class="profile-skill-name">${skillObj.name}</strong>
          <span class="cat-badge cat-${skillObj.category}">${skillObj.category.replace('_', ' ')}</span>
        </div>
        <div class="profile-skill-controls">
          <div class="star-rating" data-skill-id="${skillId}">
            ${[1, 2, 3, 4, 5].map(lvl => `
              <button class="star-btn ${lvl <= level ? 'active' : ''}" data-level="${lvl}" title="Level ${lvl}">★</button>
            `).join('')}
          </div>
          <span class="lvl-label">Lvl ${level}/5</span>
          <button class="btn-icon remove-profile-skill" data-skill-id="${skillId}" title="Remove skill">✕</button>
        </div>
      `;

      // Star click listener
      const starBtns = div.querySelectorAll('.star-btn');
      starBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const newLvl = parseInt(btn.getAttribute('data-level'), 10);
          AppProfile.setSkillLevel(skillId, newLvl);
          renderProfileEditor();
          executeAnalysis();
        });
      });

      // Remove skill listener
      const removeBtn = div.querySelector('.remove-profile-skill');
      removeBtn.addEventListener('click', () => {
        AppProfile.removeSkill(skillId);
        renderProfileEditor();
        executeAnalysis();
      });

      profileSkillsList.appendChild(div);
    });

    populateAddProfileSkillDropdown();
  }

  function populateAddProfileSkillDropdown() {
    if (!addProfileSkillSelect) return;
    addProfileSkillSelect.innerHTML = '<option value="">-- Add Skill to Profile --</option>';

    const profile = AppProfile.getProfile();
    const sortedSkills = [...skillsDictionary].sort((a, b) => a.name.localeCompare(b.name));

    sortedSkills.forEach(s => {
      if (!profile[s.id]) {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.name} (${s.category})`;
        addProfileSkillSelect.appendChild(opt);
      }
    });
  }

  function openProfileForSkill(skillId) {
    if (profileDrawer) {
      profileDrawer.classList.add('open');
      profileDrawer.setAttribute('aria-hidden', 'false');
      switchProfileDrawerTab('skills');
    }
    const level = AppProfile.getSkillLevel(skillId);
    if (level === 0) {
      AppProfile.setSkillLevel(skillId, 3); // Default to intermediate if added from gap
      renderProfileEditor();
      executeAnalysis();
    }
  }

  /**
   * Update Header Bar User Identity & Auth State
   */
  function updateUserHeaderUI() {
    const user = AppProfile.getCurrentUser();
    const loggedIn = AppProfile.isLoggedIn();

    if (authButtonsContainer) {
      authButtonsContainer.style.display = loggedIn ? 'none' : 'flex';
    }

    if (userProfileBar) {
      userProfileBar.style.display = loggedIn ? 'flex' : 'none';
      if (userDisplayName) {
        userDisplayName.textContent = user.name || user.email;
      }
      if (userAvatarImg) {
        if (user.avatar) {
          userAvatarImg.innerHTML = `<img src="${user.avatar}" alt="Avatar" class="avatar-img" />`;
        } else {
          userAvatarImg.innerHTML = '👤';
        }
      }
    }

    if (logoutBtn) {
      logoutBtn.style.display = loggedIn ? 'inline-flex' : 'none';
    }
  }

  /**
   * Populate User Profile Edit Form Fields
   */
  function populateProfileEditForm() {
    const user = AppProfile.getCurrentUser();

    if (editName) editName.value = user.name || '';
    if (editEmail) editEmail.value = user.email || '';
    if (editPhone) editPhone.value = user.phone || '';
    if (editWhatsapp) editWhatsapp.value = user.whatsapp || '';
    if (editLinkedin) editLinkedin.value = user.linkedin || '';
    if (editGithub) editGithub.value = user.github || '';
    if (editLeetcode) editLeetcode.value = user.leetcode || '';
    if (editAddress) editAddress.value = user.address || '';
    if (editGender) editGender.value = user.gender || 'Other';

    pendingAvatarDataUrl = user.avatar || null;
    if (editAvatarPreview && editAvatarPlaceholder) {
      if (user.avatar) {
        editAvatarPreview.src = user.avatar;
        editAvatarPreview.style.display = 'block';
        editAvatarPlaceholder.style.display = 'none';
      } else {
        editAvatarPreview.style.display = 'none';
        editAvatarPlaceholder.style.display = 'block';
      }
    }

    renderActiveResumeUI(user.resume);
  }

  /**
   * Render Active Uploaded Resume Metadata Card
   */
  function renderActiveResumeUI(resume) {
    if (!activeResumeInfo) return;

    if (resume && resume.fileName) {
      activeResumeInfo.style.display = 'block';
      if (resumeFileNameEl) resumeFileNameEl.textContent = resume.fileName;
      if (resumeUploadDateEl) {
        const d = new Date(resume.uploadDate);
        resumeUploadDateEl.textContent = `Uploaded on ${isNaN(d.getTime()) ? resume.uploadDate : d.toLocaleDateString()}`;
      }

      if (extractedSkillsSummaryEl) {
        extractedSkillsSummaryEl.innerHTML = '';
        if (resume.skillsExtracted && resume.skillsExtracted.length > 0) {
          const titleP = document.createElement('p');
          titleP.className = 'form-hint';
          titleP.style.width = '100%';
          titleP.style.marginBottom = '0.25rem';
          titleP.textContent = `Auto-extracted ${resume.skillsExtracted.length} skills from resume:`;
          extractedSkillsSummaryEl.appendChild(titleP);

          const skillMap = new Map(skillsDictionary.map(s => [s.id, s]));
          resume.skillsExtracted.forEach(skillId => {
            const sObj = skillMap.get(skillId);
            const name = sObj ? sObj.name : skillId;
            const tag = document.createElement('span');
            tag.className = 'cat-badge cat-languages';
            tag.style.fontSize = '0.75rem';
            tag.textContent = name;
            extractedSkillsSummaryEl.appendChild(tag);
          });
        }
      }
    } else {
      activeResumeInfo.style.display = 'none';
    }
  }

  /**
   * Switch Profile Drawer Tabs (Info, Resume, Skills, Preview)
   */
  function switchProfileDrawerTab(tabId) {
    if (!drawerTabBtns) return;

    drawerTabBtns.forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('active', isTarget);
    });

    const panelInfo = document.getElementById('drawer-panel-info');
    const panelResume = document.getElementById('drawer-panel-resume');
    const panelSkills = document.getElementById('drawer-panel-skills');
    const panelPreview = document.getElementById('drawer-panel-preview');

    if (panelInfo) panelInfo.style.display = tabId === 'info' ? 'flex' : 'none';
    if (panelResume) panelResume.style.display = tabId === 'resume' ? 'flex' : 'none';
    if (panelSkills) panelSkills.style.display = tabId === 'skills' ? 'flex' : 'none';
    if (panelPreview) {
      panelPreview.style.display = tabId === 'preview' ? 'flex' : 'none';
      if (tabId === 'preview') {
        renderResumePreviewTab();
      }
    }
  }

  /**
   * Render Resume Preview Tab Content (Visual Document View & Extracted Skills Text View)
   */
  function renderResumePreviewTab() {
    const previewContainer = document.getElementById('resume-preview-container');
    if (!previewContainer) return;

    const user = AppProfile.getCurrentUser();
    const resume = user.resume;

    if (!resume || (!resume.text && !resume.fileDataUrl)) {
      previewContainer.innerHTML = `
        <div class="empty-state">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📄</div>
          <p class="empty-title">No Resume Uploaded Yet</p>
          <p class="empty-desc" style="margin-bottom: 1.25rem;">
            Upload your resume (.pdf, .docx, .txt) to view your visual document and extracted skill highlights here.
          </p>
          <button id="go-to-upload-btn" class="btn btn-primary">
            📥 Upload Resume Now
          </button>
        </div>
      `;

      const uploadBtn = previewContainer.querySelector('#go-to-upload-btn');
      if (uploadBtn) {
        uploadBtn.addEventListener('click', () => switchProfileDrawerTab('resume'));
      }
      return;
    }

    const d = new Date(resume.uploadDate);
    const dateStr = isNaN(d.getTime()) ? resume.uploadDate : d.toLocaleDateString();
    const isPdf = resume.fileName && resume.fileName.toLowerCase().endsWith('.pdf');
    const cleanText = AppParser.cleanPdfSyntax(resume.text || '');
    const wordCount = (cleanText.match(/\S+/g) || []).length;

    // Parse clean resume text against dictionary to highlight extracted skills
    const parsedResume = AppParser.parseJobDescription(cleanText, skillsDictionary);

    // Initial mode: If dataUrl available, default to visual view, else text view
    let activePreviewMode = resume.fileDataUrl ? 'visual' : 'text';

    function updatePreviewDOM() {
      previewContainer.innerHTML = `
        <div class="resume-preview-card" style="display: flex; flex-direction: column; flex: 1;">
          <div class="resume-preview-header" style="padding-bottom: 0.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.2rem;">📑 ${resume.fileName}</h4>
                <p class="form-hint">Uploaded: ${dateStr} • ${wordCount} words</p>
              </div>
              <div style="display: flex; gap: 0.4rem;">
                <button id="copy-resume-text-btn" class="btn btn-sm btn-outline">📋 Copy Text</button>
                <button id="load-resume-to-jd-btn" class="btn btn-sm btn-primary">⚡ Load into Analyzer</button>
              </div>
            </div>

            <!-- View Mode Switcher -->
            <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
              <button id="btn-view-visual" class="btn btn-sm ${activePreviewMode === 'visual' ? 'btn-primary' : 'btn-outline'}">
                📄 Visual Document View
              </button>
              <button id="btn-view-text" class="btn btn-sm ${activePreviewMode === 'text' ? 'btn-primary' : 'btn-outline'}">
                🔍 Extracted Skills & Text (${parsedResume.matchedSkills.length} skills)
              </button>
            </div>
          </div>

          <div id="preview-display-body" style="flex: 1; display: flex; flex-direction: column;">
            ${activePreviewMode === 'visual' ? (
              resume.fileDataUrl ? `
                <iframe 
                  src="${resume.fileDataUrl}" 
                  title="Resume PDF Document Viewer" 
                  style="width: 100%; height: 460px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background-color: #ffffff;"
                ></iframe>
              ` : `
                <div class="empty-state" style="padding: 2rem 1rem;">
                  <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">📄</div>
                  <p class="empty-title">Visual PDF Document View</p>
                  <p class="empty-desc" style="margin-bottom: 1rem;">
                    To view <strong>${resume.fileName}</strong> in document layout mode, please choose or drop your file below.
                  </p>
                  <input type="file" id="preview-reupload-input" accept=".pdf,.doc,.docx,.txt" style="display: none;" />
                  <button id="preview-reupload-btn" class="btn btn-primary">
                    📁 Select PDF File to View Document
                  </button>
                </div>
              `
            ) : `
              <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem;">
                Parsed Resume Text (Extracted Skills Highlighted):
              </div>
              <div id="resume-preview-viewport" class="highlighted-viewport" style="flex: 1; max-height: 420px; overflow-y: auto; background-color: var(--bg-card-subtle); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); white-space: pre-wrap; word-break: break-word; font-size: 0.88rem; line-height: 1.6;">
              </div>
            `}
          </div>
        </div>
      `;

      if (activePreviewMode === 'text') {
        const viewport = previewContainer.querySelector('#resume-preview-viewport');
        if (viewport) {
          const fragment = AppParser.createHighlightedFragment(cleanText, parsedResume.matchedSkills);
          viewport.appendChild(fragment);
        }
      }

      // Re-upload input handler
      const reuploadBtn = previewContainer.querySelector('#preview-reupload-btn');
      const reuploadInput = previewContainer.querySelector('#preview-reupload-input');
      if (reuploadBtn && reuploadInput) {
        reuploadBtn.addEventListener('click', () => reuploadInput.click());
        reuploadInput.addEventListener('change', e => {
          if (e.target.files && e.target.files[0]) {
            handleResumeUpload(e.target.files[0]);
          }
        });
      }

      // Event Listeners for sub-tabs
      const btnVisual = previewContainer.querySelector('#btn-view-visual');
      if (btnVisual) {
        btnVisual.addEventListener('click', () => {
          activePreviewMode = 'visual';
          updatePreviewDOM();
        });
      }

      const btnText = previewContainer.querySelector('#btn-view-text');
      if (btnText) {
        btnText.addEventListener('click', () => {
          activePreviewMode = 'text';
          updatePreviewDOM();
        });
      }

      const copyBtn = previewContainer.querySelector('#copy-resume-text-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(resume.text).then(() => {
            copyBtn.textContent = '✓ Copied!';
            setTimeout(() => { copyBtn.textContent = '📋 Copy Text'; }, 2000);
          });
        });
      }

      const loadJdBtn = previewContainer.querySelector('#load-resume-to-jd-btn');
      if (loadJdBtn) {
        loadJdBtn.addEventListener('click', () => {
          if (jdTextarea) {
            const cleanText = AppParser.cleanPdfSyntax(resume.text || '');
            if (!cleanText || cleanText.includes('Visual PDF Document Uploaded') || cleanText.includes('%PDF-') || cleanText.includes('/Linearized')) {
              alert('⚠️ The saved resume contains raw PDF binary stream data. Please re-upload your PDF file or paste plain text so text can be cleanly analyzed.');
              return;
            }
            jdTextarea.value = cleanText;
            executeAnalysis();
            if (profileDrawer) {
              profileDrawer.classList.remove('open');
              profileDrawer.setAttribute('aria-hidden', 'true');
            }
            alert('✅ Loaded your resume text into the Job Description analyzer!');
          }
        });
      }
    }

    updatePreviewDOM();
  }

  /**
   * Handle Resume File Upload Processing
   */
  async function handleResumeUpload(file) {
    if (!file) return;

    try {
      const fileDataUrl = await new Promise(res => {
        const r = new FileReader();
        r.onload = e => res(e.target.result || '');
        r.onerror = () => res('');
        r.readAsDataURL(file);
      });

      const extractedText = await AppParser.extractTextFromFile(file);
      const details = AppParser.extractResumeDetails(extractedText, skillsDictionary);

      // Auto-fill profile fields if empty
      const user = AppProfile.getCurrentUser();
      const updatedDetails = {};

      if (!user.name && details.name) updatedDetails.name = details.name;
      if (!user.email && details.email) updatedDetails.email = details.email;
      if (!user.phone && details.phone) updatedDetails.phone = details.phone;
      if (!user.whatsapp && details.whatsapp) updatedDetails.whatsapp = details.whatsapp;
      if (!user.linkedin && details.linkedin) updatedDetails.linkedin = details.linkedin;
      if (!user.github && details.github) updatedDetails.github = details.github;
      if (!user.leetcode && details.leetcode) updatedDetails.leetcode = details.leetcode;

      if (Object.keys(updatedDetails).length > 0) {
        AppProfile.updateProfileDetails(updatedDetails);
      }

      // Save resume & auto tune profile skills
      const resumeObj = {
        fileName: file.name,
        fileDataUrl: fileDataUrl,
        uploadDate: new Date().toISOString(),
        text: extractedText,
        skillsExtracted: details.extractedSkills
      };

      AppProfile.saveResume(resumeObj, true);

      // Refresh UI
      populateProfileEditForm();
      renderProfileEditor();
      updateUserHeaderUI();
      executeAnalysis();

      alert(`✅ Resume "${file.name}" uploaded successfully!\nAuto-extracted ${details.extractedSkills.length} skills and updated your profile.`);

    } catch (err) {
      console.error('Error uploading/processing resume:', err);
      alert('⚠️ Failed to parse resume file. Please ensure it is a valid text, docx, or pdf document.');
    }
  }

  /**
   * Render History Modal/Drawer
   */
  function renderHistoryDrawer() {
    if (!historyListEl) return;
    historyListEl.innerHTML = '';

    const history = AppUI.getHistory();

    if (history.length === 0) {
      historyListEl.innerHTML = '<p class="empty-desc">No saved analyses found in history.</p>';
      return;
    }

    history.forEach(item => {
      const card = document.createElement('div');
      card.className = 'history-card';
      const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      card.innerHTML = `
        <div class="history-card-header">
          <strong>${item.title}</strong>
          <span class="history-score">${item.matchPercentage}% Match</span>
        </div>
        <div class="history-card-meta">
          <span>${item.company}</span> • <span>${dateStr}</span>
        </div>
        <div class="history-card-actions">
          <button class="btn btn-sm btn-outline load-history-btn" data-id="${item.id}">Load into Analyzer</button>
          <button class="btn btn-sm btn-outline delete-history-btn" data-id="${item.id}">Delete</button>
        </div>
      `;

      card.querySelector('.load-history-btn').addEventListener('click', () => {
        if (jdTextarea) {
          jdTextarea.value = item.text;
          executeAnalysis();
          if (historyDrawer) {
            historyDrawer.classList.remove('open');
            historyDrawer.setAttribute('aria-hidden', 'true');
          }
        }
      });

      card.querySelector('.delete-history-btn').addEventListener('click', () => {
        AppUI.deleteHistoryItem(item.id);
        renderHistoryDrawer();
      });

      historyListEl.appendChild(card);
    });
  }

  /**
   * Compare Job Descriptions Modal Logic
   */
  function executeJDComparison() {
    if (!compareJdBTextarea || !compareResultsContainer) return;

    const textB = compareJdBTextarea.value.trim();
    if (!textB) {
      compareResultsContainer.innerHTML = '<p class="empty-desc">Please paste a second Job Description to compare.</p>';
      return;
    }

    const textA = jdTextarea ? jdTextarea.value : '';
    const parsedA = AppParser.parseJobDescription(textA, skillsDictionary);
    const parsedB = AppParser.parseJobDescription(textB, skillsDictionary);

    const comp = AppScoring.compareJobDescriptions(parsedA, parsedB);

    compareResultsContainer.innerHTML = `
      <div class="comparison-summary">
        <div class="comp-stat">
          <span class="stat-value">${comp.similarityPercentage}%</span>
          <span class="stat-label">Role Similarity</span>
        </div>
        <div class="comp-stat">
          <span class="stat-value">${comp.shared.length}</span>
          <span class="stat-label">Shared Skills</span>
        </div>
        <div class="comp-stat">
          <span class="stat-value">${comp.uniqueA.length}</span>
          <span class="stat-label">Unique to Role A</span>
        </div>
        <div class="comp-stat">
          <span class="stat-value">${comp.uniqueB.length}</span>
          <span class="stat-label">Unique to Role B</span>
        </div>
      </div>

      <div class="comparison-lists">
        <div class="comp-column">
          <h4>🤝 Shared Skills (${comp.shared.length})</h4>
          <ul class="comp-chip-list">
            ${comp.shared.map(s => `<li class="chip shared-chip">${s.skill.name}</li>`).join('') || '<li>None</li>'}
          </ul>
        </div>
        <div class="comp-column">
          <h4>🔹 Unique to Current Role A (${comp.uniqueA.length})</h4>
          <ul class="comp-chip-list">
            ${comp.uniqueA.map(s => `<li class="chip unique-a-chip">${s.skill.name}</li>`).join('') || '<li>None</li>'}
          </ul>
        </div>
        <div class="comp-column">
          <h4>🔸 Unique to Second Role B (${comp.uniqueB.length})</h4>
          <ul class="comp-chip-list">
            ${comp.uniqueB.map(s => `<li class="chip unique-b-chip">${s.skill.name}</li>`).join('') || '<li>None</li>'}
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Export Report via Blob download
   */
  function exportReportAsFile() {
    if (!parsedJDResult || !currentAnalysis) return;

    const user = AppProfile.getCurrentUser();

    const reportLines = [
      `==================================================`,
      `JOB DESCRIPTION SKILL GAP ANALYSIS REPORT`,
      `Candidate Name: ${user.name || 'N/A'} (${user.email || 'N/A'})`,
      `Generated: ${new Date().toLocaleString()}`,
      `==================================================\n`,
      `OVERALL MATCH SCORE: ${currentAnalysis.matchPercentage}%\n`,
      `CATEGORY BREAKDOWN:`,
      `- Programming Languages: ${currentAnalysis.categoryScores.languages.percentage}%`,
      `- Frameworks & Tooling:  ${currentAnalysis.categoryScores.tooling.percentage}%`,
      `- Concepts & Architecture: ${currentAnalysis.categoryScores.concepts.percentage}%`,
      `- Soft Skills:           ${currentAnalysis.categoryScores.soft_skills.percentage}%\n`,
      `TOP SKILL GAPS TO PRIORITIZE:`,
      ...currentAnalysis.gaps.map((g, i) => `${i + 1}. ${g.skill.name} (${g.skill.category}) - ${g.requirementLevel.toUpperCase()} (Current: Level ${g.userLevel}/5)`),
      `\nSKILLS MATCHED:`,
      ...currentAnalysis.matchedUserSkills.map(s => `- ${s.skill.name} (Proficiency Level: ${s.userLevel}/5)`),
      `\n==================================================`
    ];

    const reportContent = reportLines.join('\n');
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `Skill_Gap_Report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Animate Splash Screen Progress Bar & Fade Out
   */
  function animateSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    const progressBar = document.getElementById('splash-progress-bar');
    if (!splashScreen || !progressBar) return;

    let width = 0;
    const interval = setInterval(() => {
      width += 20;
      progressBar.style.width = width + '%';
      if (width >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          splashScreen.classList.add('hidden');
        }, 300);
      }
    }, 120);
  }

  /**
   * Single-Page Application (SPA) View Switcher (Home vs Analyzer)
   */
  function switchAppView(viewId) {
    const viewHome = document.getElementById('view-home');
    const viewAnalyzer = document.getElementById('view-analyzer');
    const navBtnHome = document.getElementById('nav-btn-home');
    const navBtnAnalyzer = document.getElementById('nav-btn-analyzer');
    const navBtnTools = document.getElementById('nav-btn-tools');

    if (!viewHome || !viewAnalyzer) return;

    if (viewId === 'home') {
      viewHome.style.display = 'block';
      viewHome.classList.add('active');
      viewAnalyzer.style.display = 'none';
      viewAnalyzer.classList.remove('active');

      if (navBtnHome) navBtnHome.classList.add('active');
      if (navBtnAnalyzer) navBtnAnalyzer.classList.remove('active');
      if (navBtnTools) navBtnTools.classList.remove('active');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewId === 'analyzer') {
      viewHome.style.display = 'none';
      viewHome.classList.remove('active');
      viewAnalyzer.style.display = 'block';
      viewAnalyzer.classList.add('active');

      if (navBtnHome) navBtnHome.classList.remove('active');
      if (navBtnAnalyzer) navBtnAnalyzer.classList.add('active');
      if (navBtnTools) navBtnTools.classList.remove('active');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Setup Theme Switcher
   */
  function setupTheme() {
    const savedTheme = localStorage.getItem('skill_analyzer_theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('skill_analyzer_theme', nextTheme);
      });
    }
  }

  /**
   * Bind DOM Elements & Event Handlers
   */
  function init() {
    // Cache DOM nodes
    jdTextarea = document.getElementById('jd-textarea');
    charCountOutput = document.getElementById('char-count');
    wordCountOutput = document.getElementById('word-count');
    sampleSelect = document.getElementById('sample-select');
    highlightedContainer = document.getElementById('highlighted-jd');
    highlightToggleBtn = document.getElementById('toggle-highlights-btn');
    clearTextBtn = document.getElementById('clear-text-btn');

    matchGaugeEl = document.getElementById('match-gauge');
    radarSvgEl = document.getElementById('radar-chart-svg');
    liveScoreOutput = document.getElementById('live-score-output');

    tabListEl = document.getElementById('analyzer-tablist');
    panelSkills = document.getElementById('panel-skills');
    panelGaps = document.getElementById('panel-gaps');
    panelPlan = document.getElementById('panel-plan');
    panelCv = document.getElementById('panel-cv');

    // Auth & Header elements
    authButtonsContainer = document.getElementById('auth-buttons-container');
    userProfileBar = document.getElementById('user-profile-bar');
    userAvatarChip = document.getElementById('user-avatar-chip');
    userAvatarImg = document.getElementById('user-avatar-img');
    userDisplayName = document.getElementById('user-display-name');
    logoutBtn = document.getElementById('logout-btn');

    openLoginBtn = document.getElementById('open-login-btn');
    openRegisterBtn = document.getElementById('open-register-btn');
    loginModal = document.getElementById('login-modal');
    closeLoginBtn = document.getElementById('close-login-btn');
    loginForm = document.getElementById('login-form');
    loginErrorMsg = document.getElementById('login-error-msg');
    switchToRegister = document.getElementById('switch-to-register');

    registerModal = document.getElementById('register-modal');
    closeRegisterBtn = document.getElementById('close-register-btn');
    registrationForm = document.getElementById('registration-form');
    regErrorMsg = document.getElementById('reg-error-msg');
    switchToLogin = document.getElementById('switch-to-login');
    regResumeFile = document.getElementById('reg-resume-file');
    regResumeStatus = document.getElementById('reg-resume-status');

    // Profile Drawer & Resume elements
    profileDrawer = document.getElementById('profile-drawer');
    openProfileBtn = document.getElementById('open-profile-btn');
    closeProfileBtn = document.getElementById('close-profile-btn');
    profileSkillsList = document.getElementById('profile-skills-list');
    resetProfileBtn = document.getElementById('reset-profile-btn');
    addProfileSkillSelect = document.getElementById('add-profile-skill-select');
    addProfileSkillBtn = document.getElementById('add-profile-skill-btn');

    drawerTabBtns = document.querySelectorAll('.drawer-tab-btn');
    drawerTabPanels = document.querySelectorAll('.drawer-tabpanel');

    editProfileForm = document.getElementById('edit-profile-form');
    editAvatarFile = document.getElementById('edit-avatar-file');
    editAvatarPreview = document.getElementById('edit-avatar-preview');
    editAvatarPlaceholder = document.getElementById('edit-avatar-placeholder');
    editName = document.getElementById('edit-name');
    editEmail = document.getElementById('edit-email');
    editPhone = document.getElementById('edit-phone');
    editWhatsapp = document.getElementById('edit-whatsapp');
    editLinkedin = document.getElementById('edit-linkedin');
    editGithub = document.getElementById('edit-github');
    editLeetcode = document.getElementById('edit-leetcode');
    editAddress = document.getElementById('edit-address');
    editGender = document.getElementById('edit-gender');

    resumeDropzone = document.getElementById('resume-dropzone');
    resumeFileInput = document.getElementById('resume-file-input');
    browseResumeBtn = document.getElementById('browse-resume-btn');
    activeResumeInfo = document.getElementById('active-resume-info');
    resumeFileNameEl = document.getElementById('resume-filename');
    resumeUploadDateEl = document.getElementById('resume-upload-date');
    extractedSkillsSummaryEl = document.getElementById('extracted-skills-summary');
    reparseResumeBtn = document.getElementById('reparse-resume-btn');

    // History & Compare elements
    historyDrawer = document.getElementById('history-drawer');
    openHistoryBtn = document.getElementById('open-history-btn');
    closeHistoryBtn = document.getElementById('close-history-btn');
    historyListEl = document.getElementById('history-list');
    saveHistoryBtn = document.getElementById('save-history-btn');

    compareModal = document.getElementById('compare-modal');
    openCompareBtn = document.getElementById('open-compare-btn');
    closeCompareBtn = document.getElementById('close-compare-btn');
    runCompareBtn = document.getElementById('run-compare-btn');
    compareJdBTextarea = document.getElementById('compare-jd-b-textarea');
    compareResultsContainer = document.getElementById('compare-results');

    exportBtn = document.getElementById('export-report-btn');
    printBtn = document.getElementById('print-report-btn');
    themeToggleBtn = document.getElementById('theme-toggle-btn');

    // Trigger splash screen animation
    animateSplashScreen();

    // Navigation bar event handlers
    const navBrand = document.getElementById('nav-brand');
    const navBtnHome = document.getElementById('nav-btn-home');
    const navBtnAnalyzer = document.getElementById('nav-btn-analyzer');
    const navBtnTools = document.getElementById('nav-btn-tools');
    const backToHomeBtn = document.getElementById('back-to-home-btn');

    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navDrawerContainer = document.getElementById('nav-drawer-container');

    const closeMobileMenu = () => {
      if (navDrawerContainer) navDrawerContainer.classList.remove('mobile-open');
    };

    if (mobileMenuToggle && navDrawerContainer) {
      mobileMenuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        navDrawerContainer.classList.toggle('mobile-open');
      });

      // Auto close mobile drawer when clicking outside or clicking any button in drawer
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.app-header')) {
          closeMobileMenu();
        }
      });

      navDrawerContainer.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('.avatar-chip')) {
          closeMobileMenu();
        }
      });
    }

    if (navBrand) navBrand.addEventListener('click', () => {
      switchAppView('home');
      closeMobileMenu();
    });
    if (navBtnHome) navBtnHome.addEventListener('click', () => {
      switchAppView('home');
      closeMobileMenu();
    });
    if (navBtnAnalyzer) navBtnAnalyzer.addEventListener('click', () => {
      switchAppView('analyzer');
      closeMobileMenu();
    });
    if (backToHomeBtn) backToHomeBtn.addEventListener('click', () => {
      switchAppView('home');
      closeMobileMenu();
    });

    if (navBtnTools) {
      navBtnTools.addEventListener('click', () => {
        switchAppView('home');
        closeMobileMenu();
        const toolsSection = document.getElementById('tools-suite-section');
        if (toolsSection) {
          toolsSection.scrollIntoView({ behavior: 'smooth' });
          navBtnTools.classList.add('active');
          if (navBtnHome) navBtnHome.classList.remove('active');
        }
      });
    }

    // Hero Section CTAs
    const heroLaunchBtn = document.getElementById('hero-launch-analyzer-btn');
    const heroResumeBtn = document.getElementById('hero-open-resume-btn');
    const heroCompareBtn = document.getElementById('hero-compare-roles-btn');

    if (heroLaunchBtn) heroLaunchBtn.addEventListener('click', () => switchAppView('analyzer'));
    if (heroResumeBtn && profileDrawer) {
      heroResumeBtn.addEventListener('click', () => {
        profileDrawer.classList.add('open');
        profileDrawer.setAttribute('aria-hidden', 'false');
        populateProfileEditForm();
        renderProfileEditor();
        switchProfileDrawerTab('resume');
      });
    }
    if (heroCompareBtn && compareModal) {
      heroCompareBtn.addEventListener('click', () => {
        compareModal.classList.add('open');
        compareModal.setAttribute('aria-hidden', 'false');
      });
    }

    // Tools Suite Grid CTAs
    const toolLaunchAnalyzer = document.getElementById('tool-launch-analyzer');
    const toolOpenResume = document.getElementById('tool-open-resume');
    const toolOpenCompare = document.getElementById('tool-open-compare');
    const toolOpenHistory = document.getElementById('tool-open-history');

    if (toolLaunchAnalyzer) toolLaunchAnalyzer.addEventListener('click', () => switchAppView('analyzer'));
    if (toolOpenResume && profileDrawer) {
      toolOpenResume.addEventListener('click', () => {
        profileDrawer.classList.add('open');
        profileDrawer.setAttribute('aria-hidden', 'false');
        populateProfileEditForm();
        renderProfileEditor();
        switchProfileDrawerTab('resume');
      });
    }
    if (toolOpenCompare && compareModal) {
      toolOpenCompare.addEventListener('click', () => {
        compareModal.classList.add('open');
        compareModal.setAttribute('aria-hidden', 'false');
      });
    }
    if (toolOpenHistory && historyDrawer) {
      toolOpenHistory.addEventListener('click', () => {
        historyDrawer.classList.add('open');
        historyDrawer.setAttribute('aria-hidden', 'false');
        renderHistoryDrawer();
      });
    }

    // Load data & set up UI
    loadSkillsDictionary().then(() => {
      loadSampleJDs();
      setupTabs();
      setupTheme();
      updateUserHeaderUI();
      populateProfileEditForm();
      renderProfileEditor();
      executeAnalysis();
    });

    // Textarea input
    if (jdTextarea) {
      jdTextarea.addEventListener('input', debouncedAnalysis);
    }

    // Sample selection
    if (sampleSelect) {
      sampleSelect.addEventListener('change', () => {
        const sampleId = sampleSelect.value;
        const found = sampleJDs.find(s => s.id === sampleId);
        if (found && jdTextarea) {
          jdTextarea.value = found.text;
          executeAnalysis();
        }
      });
    }

    // Clear Text
    if (clearTextBtn) {
      clearTextBtn.addEventListener('click', () => {
        if (jdTextarea) {
          jdTextarea.value = '';
          if (sampleSelect) sampleSelect.value = '';
          executeAnalysis();
        }
      });
    }

    // Toggle Highlights
    if (highlightToggleBtn) {
      highlightToggleBtn.addEventListener('click', () => {
        showHighlights = !showHighlights;
        highlightToggleBtn.classList.toggle('active', showHighlights);
        highlightToggleBtn.textContent = showHighlights ? '👁️ Highlights ON' : '🙈 Highlights OFF';
        executeAnalysis();
      });
    }

    // Header & User Avatar chip click
    if (userAvatarChip && profileDrawer) {
      userAvatarChip.addEventListener('click', () => {
        profileDrawer.classList.add('open');
        profileDrawer.setAttribute('aria-hidden', 'false');
        populateProfileEditForm();
        renderProfileEditor();
        switchProfileDrawerTab('info');
      });
    }

    // Profile Drawer Listeners
    if (openProfileBtn && profileDrawer) {
      openProfileBtn.addEventListener('click', () => {
        profileDrawer.classList.add('open');
        profileDrawer.setAttribute('aria-hidden', 'false');
        populateProfileEditForm();
        renderProfileEditor();
      });
    }

    if (closeProfileBtn && profileDrawer) {
      closeProfileBtn.addEventListener('click', () => {
        profileDrawer.classList.remove('open');
        profileDrawer.setAttribute('aria-hidden', 'true');
      });
    }

    // Profile drawer inner tab switching
    if (drawerTabBtns) {
      drawerTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tabId = btn.getAttribute('data-tab');
          switchProfileDrawerTab(tabId);
        });
      });
    }

    // Avatar picture upload preview
    if (editAvatarFile) {
      editAvatarFile.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (evt) {
            pendingAvatarDataUrl = evt.target.result;
            if (editAvatarPreview && editAvatarPlaceholder) {
              editAvatarPreview.src = pendingAvatarDataUrl;
              editAvatarPreview.style.display = 'block';
              editAvatarPlaceholder.style.display = 'none';
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Profile Credentials Form Submit
    if (editProfileForm) {
      editProfileForm.addEventListener('submit', e => {
        e.preventDefault();
        const details = {
          name: editName ? editName.value : '',
          email: editEmail ? editEmail.value : '',
          phone: editPhone ? editPhone.value : '',
          whatsapp: editWhatsapp ? editWhatsapp.value : '',
          linkedin: editLinkedin ? editLinkedin.value : '',
          github: editGithub ? editGithub.value : '',
          leetcode: editLeetcode ? editLeetcode.value : '',
          address: editAddress ? editAddress.value : '',
          gender: editGender ? editGender.value : 'Other',
          avatar: pendingAvatarDataUrl || ''
        };

        AppProfile.updateProfileDetails(details);
        updateUserHeaderUI();
        executeAnalysis();
        alert('✅ Profile credentials saved successfully!');
      });
    }

    // Resume Dropzone & Browse handlers
    if (browseResumeBtn && resumeFileInput) {
      browseResumeBtn.addEventListener('click', () => resumeFileInput.click());
    }

    if (resumeFileInput) {
      resumeFileInput.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) {
          handleResumeUpload(e.target.files[0]);
        }
      });
    }

    if (resumeDropzone) {
      resumeDropzone.addEventListener('click', (e) => {
        if (e.target !== browseResumeBtn && resumeFileInput) {
          resumeFileInput.click();
        }
      });

      ['dragenter', 'dragover'].forEach(eventName => {
        resumeDropzone.addEventListener(eventName, e => {
          e.preventDefault();
          e.stopPropagation();
          resumeDropzone.classList.add('dragover');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        resumeDropzone.addEventListener(eventName, e => {
          e.preventDefault();
          e.stopPropagation();
          resumeDropzone.classList.remove('dragover');
        }, false);
      });

      resumeDropzone.addEventListener('drop', e => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files[0]) {
          handleResumeUpload(files[0]);
        }
      });
    }

    if (reparseResumeBtn) {
      reparseResumeBtn.addEventListener('click', () => {
        const user = AppProfile.getCurrentUser();
        if (user.resume && user.resume.text) {
          const details = AppParser.extractResumeDetails(user.resume.text, skillsDictionary);
          AppProfile.saveResume({ ...user.resume, skillsExtracted: details.extractedSkills }, true);
          renderActiveResumeUI(AppProfile.getCurrentUser().resume);
          renderProfileEditor();
          executeAnalysis();
          alert(`✅ Re-extracted ${details.extractedSkills.length} skills from active resume and updated your profile!`);
        }
      });
    }

    const viewResumePreviewBtn = document.getElementById('view-resume-preview-btn');
    if (viewResumePreviewBtn) {
      viewResumePreviewBtn.addEventListener('click', () => {
        switchProfileDrawerTab('preview');
      });
    }

    // Reset profile skills
    if (resetProfileBtn) {
      resetProfileBtn.addEventListener('click', () => {
        if (confirm('Reset your skill ratings to defaults?')) {
          AppProfile.resetToDefault();
          renderProfileEditor();
          executeAnalysis();
        }
      });
    }

    // Add profile skill
    if (addProfileSkillBtn && addProfileSkillSelect) {
      addProfileSkillBtn.addEventListener('click', () => {
        const skillId = addProfileSkillSelect.value;
        if (skillId) {
          AppProfile.setSkillLevel(skillId, 3);
          renderProfileEditor();
          executeAnalysis();
        }
      });
    }

    // Registration Modal Open/Close/Submit
    if (openRegisterBtn && registerModal) {
      openRegisterBtn.addEventListener('click', () => {
        registerModal.classList.add('open');
        registerModal.setAttribute('aria-hidden', 'false');
        if (regErrorMsg) regErrorMsg.style.display = 'none';
      });
    }

    if (closeRegisterBtn && registerModal) {
      closeRegisterBtn.addEventListener('click', () => {
        registerModal.classList.remove('open');
        registerModal.setAttribute('aria-hidden', 'true');
      });
    }

    if (switchToLogin && loginModal && registerModal) {
      switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.classList.remove('open');
        loginModal.classList.add('open');
      });
    }

    if (registrationForm) {
      registrationForm.addEventListener('submit', async e => {
        e.preventDefault();
        if (regErrorMsg) regErrorMsg.style.display = 'none';

        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const gender = document.getElementById('reg-gender').value;
        const phone = document.getElementById('reg-phone').value;
        const whatsapp = document.getElementById('reg-whatsapp').value;
        const address = document.getElementById('reg-address').value;

        let resumeObj = { fileName: '', fileDataUrl: '', uploadDate: '', text: '', skillsExtracted: [] };
        if (regResumeFile && regResumeFile.files && regResumeFile.files[0]) {
          try {
            const file = regResumeFile.files[0];
            const fileDataUrl = await new Promise(res => {
              const r = new FileReader();
              r.onload = ev => res(ev.target.result || '');
              r.onerror = () => res('');
              r.readAsDataURL(file);
            });
            const text = await AppParser.extractTextFromFile(file);
            const details = AppParser.extractResumeDetails(text, skillsDictionary);
            resumeObj = {
              fileName: file.name,
              fileDataUrl: fileDataUrl,
              uploadDate: new Date().toISOString(),
              text: text,
              skillsExtracted: details.extractedSkills
            };
          } catch (err) {
            console.warn('Could not parse registration resume file:', err);
          }
        }

        try {
          AppProfile.registerUser({
            name,
            email,
            password,
            gender,
            phone,
            whatsapp,
            address,
            resume: resumeObj
          });

          registerModal.classList.remove('open');
          registerModal.setAttribute('aria-hidden', 'true');
          registrationForm.reset();

          updateUserHeaderUI();
          populateProfileEditForm();
          renderProfileEditor();
          executeAnalysis();

          alert(`🎉 Welcome ${name}! Your account and profile have been created successfully.`);
        } catch (err) {
          if (regErrorMsg) {
            regErrorMsg.textContent = err.message;
            regErrorMsg.style.display = 'block';
          }
        }
      });
    }

    // Login Modal Open/Close/Submit
    if (openLoginBtn && loginModal) {
      openLoginBtn.addEventListener('click', () => {
        loginModal.classList.add('open');
        loginModal.setAttribute('aria-hidden', 'false');
        if (loginErrorMsg) loginErrorMsg.style.display = 'none';
      });
    }

    if (closeLoginBtn && loginModal) {
      closeLoginBtn.addEventListener('click', () => {
        loginModal.classList.remove('open');
        loginModal.setAttribute('aria-hidden', 'true');
      });
    }

    if (switchToRegister && loginModal && registerModal) {
      switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.classList.remove('open');
        registerModal.classList.add('open');
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', e => {
        e.preventDefault();
        if (loginErrorMsg) loginErrorMsg.style.display = 'none';

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
          AppProfile.loginUser(email, password);
          loginModal.classList.remove('open');
          loginModal.setAttribute('aria-hidden', 'true');
          loginForm.reset();

          updateUserHeaderUI();
          populateProfileEditForm();
          renderProfileEditor();
          executeAnalysis();

          alert(`🔓 Logged in as ${AppProfile.getCurrentUser().name || AppProfile.getCurrentUser().email}`);
        } catch (err) {
          if (loginErrorMsg) {
            loginErrorMsg.textContent = err.message;
            loginErrorMsg.style.display = 'block';
          }
        }
      });
    }

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to log out?')) {
          AppProfile.logoutUser();
          updateUserHeaderUI();
          populateProfileEditForm();
          renderProfileEditor();
          executeAnalysis();
        }
      });
    }

    // History Drawer Listeners
    if (openHistoryBtn && historyDrawer) {
      openHistoryBtn.addEventListener('click', () => {
        historyDrawer.classList.add('open');
        historyDrawer.setAttribute('aria-hidden', 'false');
        renderHistoryDrawer();
      });
    }

    if (closeHistoryBtn && historyDrawer) {
      closeHistoryBtn.addEventListener('click', () => {
        historyDrawer.classList.remove('open');
        historyDrawer.setAttribute('aria-hidden', 'true');
      });
    }

    if (saveHistoryBtn) {
      saveHistoryBtn.addEventListener('click', () => {
        const text = jdTextarea ? jdTextarea.value.trim() : '';
        if (!text) {
          alert('Please enter or load a job description first.');
          return;
        }

        const title = prompt('Enter a title for this analysis:', 'Job Analysis ' + new Date().toLocaleDateString());
        if (title !== null) {
          AppUI.saveToHistory(title, 'Custom Company', text, currentAnalysis);
          alert('Analysis saved to History!');
          renderHistoryDrawer();
        }
      });
    }

    // Compare Modal Listeners
    if (openCompareBtn && compareModal) {
      openCompareBtn.addEventListener('click', () => {
        compareModal.classList.add('open');
        compareModal.setAttribute('aria-hidden', 'false');
      });
    }

    if (closeCompareBtn && compareModal) {
      closeCompareBtn.addEventListener('click', () => {
        compareModal.classList.remove('open');
        compareModal.setAttribute('aria-hidden', 'true');
      });
    }

    if (runCompareBtn) {
      runCompareBtn.addEventListener('click', executeJDComparison);
    }

    // Export & Print
    if (exportBtn) {
      exportBtn.addEventListener('click', exportReportAsFile);
    }

    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }
  }

  function setupTabs() {
    const panelsMap = {
      'panel-skills': panelSkills,
      'panel-gaps': panelGaps,
      'panel-plan': panelPlan,
      'panel-cv': panelCv
    };
    AppUI.setupTabs(tabListEl, panelsMap);
  }

  // Initialize application on DOM ready
  document.addEventListener('DOMContentLoaded', init);
})();

