/**
 * profile.js - Skill Gap Analyzer
 * Manages user accounts, profile credentials, resume metadata,
 * skill proficiency levels (1-5), and localStorage persistence.
 */

(function (root) {
  'use strict';
  root.AppProfile = (function () {
  'use strict';

  const ACCOUNTS_KEY = 'skill_analyzer_accounts_v2';
  const CURRENT_USER_KEY = 'skill_analyzer_current_user_v2';
  const LEGACY_PROFILE_KEY = 'skill_analyzer_user_profile_v1';

  // Default initial skills
  const DEFAULT_SKILLS = {
    javascript: 4,
    html: 4,
    css: 4,
    git: 3,
    react: 3,
    nodejs: 2,
    rest_api: 3,
    responsive_design: 4,
    communication: 4,
    problem_solving: 4,
    teamwork: 4
  };

  // Default guest profile structure
  const DEFAULT_GUEST_USER = {
    id: 'guest_user',
    isRegistered: false,
    name: 'Guest Developer',
    email: 'guest@example.com',
    password: '',
    phone: '',
    whatsapp: '',
    linkedin: '',
    github: '',
    leetcode: '',
    address: '',
    gender: 'Other',
    avatar: '', // Data URL string or avatar preset
    resume: {
      fileName: '',
      uploadDate: '',
      text: '',
      skillsExtracted: []
    },
    skills: { ...DEFAULT_SKILLS }
  };

  let currentUser = { ...DEFAULT_GUEST_USER };
  let accounts = [];

  /**
   * Load accounts and current user session from storage
   */
  function loadFromStorage() {
    try {
      // Load accounts array
      const savedAccounts = localStorage.getItem(ACCOUNTS_KEY);
      if (savedAccounts) {
        accounts = JSON.parse(savedAccounts);
      }

      // Load active user session
      const savedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (savedUser) {
        currentUser = JSON.parse(savedUser);
        if (currentUser && currentUser.resume && currentUser.resume.text) {
          if (typeof root.AppParser !== 'undefined' && root.AppParser.cleanPdfSyntax) {
            currentUser.resume.text = root.AppParser.cleanPdfSyntax(currentUser.resume.text);
          } else if (currentUser.resume.text.includes('%PDF-') || currentUser.resume.text.includes('/Linearized')) {
            currentUser.resume.text = 'Visual PDF Document Uploaded. (Switch to "Visual Document View" above to view full formatted resume document layout)';
          }
        }
      } else {
        // Migration from legacy v1 profile
        const legacyProfile = localStorage.getItem(LEGACY_PROFILE_KEY);
        if (legacyProfile) {
          try {
            const parsedSkills = JSON.parse(legacyProfile);
            currentUser.skills = { ...DEFAULT_SKILLS, ...parsedSkills };
          } catch (e) {
            currentUser.skills = { ...DEFAULT_SKILLS };
          }
        } else {
          currentUser = { ...DEFAULT_GUEST_USER };
        }
        saveToStorage();
      }
    } catch (e) {
      console.warn('Could not read user profile from storage:', e);
      currentUser = { ...DEFAULT_GUEST_USER };
    }
    return currentUser;
  }

  /**
   * Save current user session & accounts to localStorage
   */
  function saveToStorage() {
    try {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      // Keep legacy profile key synced for backward compatibility
      localStorage.setItem(LEGACY_PROFILE_KEY, JSON.stringify(currentUser.skills || {}));
    } catch (e) {
      console.error('Failed to save profile state to storage:', e);
    }
  }

  /**
   * Get active user full object
   */
  function getCurrentUser() {
    return { ...currentUser };
  }

  /**
   * Check if active user is logged in / registered
   */
  function isLoggedIn() {
    return !!(currentUser && currentUser.isRegistered);
  }

  /**
   * Get active user skills map (compatible with AppScoring)
   */
  function getProfile() {
    return { ...(currentUser.skills || {}) };
  }

  /**
   * Get skill level for a specific skill ID
   */
  function getSkillLevel(skillId) {
    return currentUser.skills ? (currentUser.skills[skillId] || 0) : 0;
  }

  /**
   * Set skill level (1 to 5)
   */
  function setSkillLevel(skillId, level) {
    if (!currentUser.skills) currentUser.skills = {};
    const numericLevel = parseInt(level, 10);
    if (isNaN(numericLevel) || numericLevel < 1) {
      delete currentUser.skills[skillId];
    } else {
      currentUser.skills[skillId] = Math.min(5, Math.max(1, numericLevel));
    }
    updateAccountInList();
    saveToStorage();
    return currentUser.skills[skillId] || 0;
  }

  /**
   * Remove a skill from user profile
   */
  function removeSkill(skillId) {
    if (currentUser.skills && currentUser.skills[skillId]) {
      delete currentUser.skills[skillId];
      updateAccountInList();
      saveToStorage();
    }
  }

  /**
   * Update full profile details (Name, Contact, Links, Address, Gender, Avatar)
   */
  function updateProfileDetails(details) {
    if (!details || typeof details !== 'object') return false;

    if (details.name !== undefined) currentUser.name = details.name.trim();
    if (details.email !== undefined) currentUser.email = details.email.trim();
    if (details.phone !== undefined) currentUser.phone = details.phone.trim();
    if (details.whatsapp !== undefined) currentUser.whatsapp = details.whatsapp.trim();
    if (details.linkedin !== undefined) currentUser.linkedin = details.linkedin.trim();
    if (details.github !== undefined) currentUser.github = details.github.trim();
    if (details.leetcode !== undefined) currentUser.leetcode = details.leetcode.trim();
    if (details.address !== undefined) currentUser.address = details.address.trim();
    if (details.gender !== undefined) currentUser.gender = details.gender;
    if (details.avatar !== undefined) currentUser.avatar = details.avatar;

    updateAccountInList();
    saveToStorage();
    return true;
  }

  /**
   * Save uploaded resume & auto-update profile skills if requested
   */
  function saveResume(resumeObj, autoAddSkills = true) {
    if (!resumeObj || typeof resumeObj !== 'object') return false;

    currentUser.resume = {
      fileName: resumeObj.fileName || 'Uploaded_Resume',
      fileDataUrl: resumeObj.fileDataUrl || (currentUser.resume ? currentUser.resume.fileDataUrl : '') || '',
      uploadDate: resumeObj.uploadDate || new Date().toISOString(),
      text: resumeObj.text || '',
      skillsExtracted: resumeObj.skillsExtracted || []
    };

    // If resume contains extracted skills, set their proficiency to at least level 3 if not set
    if (autoAddSkills && Array.isArray(resumeObj.skillsExtracted)) {
      if (!currentUser.skills) currentUser.skills = {};
      resumeObj.skillsExtracted.forEach(skillId => {
        if (!currentUser.skills[skillId] || currentUser.skills[skillId] < 3) {
          currentUser.skills[skillId] = 3;
        }
      });
    }

    updateAccountInList();
    saveToStorage();
    return true;
  }

  /**
   * Register a new user account
   */
  function registerUser(regData) {
    if (!regData || !regData.email || !regData.password) {
      throw new Error('Email and password are required for registration.');
    }

    const emailClean = regData.email.trim().toLowerCase();

    // Check if account already exists
    const existing = accounts.find(acc => acc.email.toLowerCase() === emailClean);
    if (existing) {
      throw new Error('An account with this email address already exists. Please log in.');
    }

    const newUser = {
      id: 'user_' + Date.now(),
      isRegistered: true,
      name: regData.name ? regData.name.trim() : emailClean.split('@')[0],
      email: emailClean,
      password: regData.password,
      phone: regData.phone ? regData.phone.trim() : '',
      whatsapp: regData.whatsapp ? regData.whatsapp.trim() : (regData.phone ? regData.phone.trim() : ''),
      linkedin: regData.linkedin ? regData.linkedin.trim() : '',
      github: regData.github ? regData.github.trim() : '',
      leetcode: regData.leetcode ? regData.leetcode.trim() : '',
      address: regData.address ? regData.address.trim() : '',
      gender: regData.gender || 'Other',
      avatar: regData.avatar || '',
      resume: regData.resume || { fileName: '', uploadDate: '', text: '', skillsExtracted: [] },
      skills: regData.skills ? { ...regData.skills } : { ...DEFAULT_SKILLS }
    };

    accounts.push(newUser);
    currentUser = { ...newUser };
    saveToStorage();
    return currentUser;
  }

  /**
   * Log in user with email & password
   */
  function loginUser(email, password) {
    if (!email || !password) {
      throw new Error('Please enter both email and password.');
    }

    const emailClean = email.trim().toLowerCase();
    const found = accounts.find(acc => acc.email.toLowerCase() === emailClean && acc.password === password);

    if (!found) {
      throw new Error('Invalid email address or password.');
    }

    currentUser = { ...found };
    saveToStorage();
    return currentUser;
  }

  /**
   * Log out active user and revert to Guest profile
   */
  function logoutUser() {
    currentUser = { ...DEFAULT_GUEST_USER };
    saveToStorage();
    return currentUser;
  }

  /**
   * Synchronize active logged in user changes back into accounts list
   */
  function updateAccountInList() {
    if (currentUser.isRegistered && currentUser.id) {
      const idx = accounts.findIndex(acc => acc.id === currentUser.id);
      if (idx !== -1) {
        accounts[idx] = { ...currentUser };
      }
    }
  }

  /**
   * Reset profile to defaults
   */
  function resetToDefault() {
    currentUser.skills = { ...DEFAULT_SKILLS };
    updateAccountInList();
    saveToStorage();
    return currentUser;
  }

  // Initialize on script load
  loadFromStorage();

  return {
    getCurrentUser: getCurrentUser,
    isLoggedIn: isLoggedIn,
    getProfile: getProfile,
    getSkillLevel: getSkillLevel,
    setSkillLevel: setSkillLevel,
    removeSkill: removeSkill,
    updateProfileDetails: updateProfileDetails,
    saveResume: saveResume,
    registerUser: registerUser,
    loginUser: loginUser,
    logoutUser: logoutUser,
    resetToDefault: resetToDefault,
    saveToStorage: saveToStorage,
    loadFromStorage: loadFromStorage
  };
})();
})(typeof window !== 'undefined' ? window : globalThis);


