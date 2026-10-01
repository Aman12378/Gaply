/**
 * scoring.js - Skill Gap Analyzer
 * Scoring algorithm, gap ranking, category breakdown, tailored CV generator,
 * and job description comparison engine.
 */

(function (root) {
  'use strict';
  root.AppScoring = (function () {
  'use strict';

  /**
   * Compute overall match score, skill breakdown, and category scores.
   * Uses Array.prototype.reduce() for weighted calculation.
   */
  function calculateMatch(parsedResult, userProfile) {
    const matchedSkills = parsedResult.matchedSkills || [];

    if (matchedSkills.length === 0) {
      return {
        matchPercentage: 0,
        totalRequiredWeight: 0,
        userScoreWeight: 0,
        categoryScores: {
          languages: { total: 0, user: 0, percentage: 0 },
          tooling: { total: 0, user: 0, percentage: 0 },
          concepts: { total: 0, user: 0, percentage: 0 },
          soft_skills: { total: 0, user: 0, percentage: 0 }
        },
        skillBreakdown: [],
        gaps: [],
        matchedUserSkills: []
      };
    }

    const categoryTotals = {
      languages: { total: 0, user: 0 },
      tooling: { total: 0, user: 0 },
      concepts: { total: 0, user: 0 },
      soft_skills: { total: 0, user: 0 }
    };

    const skillBreakdown = matchedSkills.map(item => {
      const skill = item.skill;
      const userLevel = userProfile[skill.id] || 0;
      const isMustHave = item.requirementLevel === 'required';

      // Requirement Multiplier: Must-Have = 1.5, Nice-To-Have = 1.0
      const reqMultiplier = isMustHave ? 1.5 : 1.0;
      
      // Frequency boost: capped multiplier based on mentions in text
      const freqMultiplier = Math.min(2.5, 1.0 + (item.count - 1) * 0.25);
      
      // Default base weight of skill (1 to 5)
      const baseWeight = skill.defaultWeight || 3;

      // Total maximum points available for this skill in the JD
      const maxPoints = baseWeight * reqMultiplier * freqMultiplier;

      // User points earned (User level 1-5 scaled to fraction 0.2 - 1.0)
      const userFraction = userLevel / 5.0;
      const userPoints = maxPoints * userFraction;

      // Category aggregation
      const catKey = skill.category || 'concepts';
      if (!categoryTotals[catKey]) {
        categoryTotals[catKey] = { total: 0, user: 0 };
      }
      categoryTotals[catKey].total += maxPoints;
      categoryTotals[catKey].user += userPoints;

      // Calculate gap severity (1 = minimal gap, 5 = missing must-have)
      const gapSize = Math.max(0, 5 - userLevel);
      const gapImportance = maxPoints * (gapSize / 5.0);

      return {
        skill: skill,
        count: item.count,
        requirementLevel: item.requirementLevel,
        userLevel: userLevel,
        maxPoints: maxPoints,
        userPoints: userPoints,
        gapSize: gapSize,
        gapImportance: gapImportance,
        isGap: userLevel < 3,
        hasSkill: userLevel >= 1
      };
    });

    // Reduce to compute total sums
    const totals = skillBreakdown.reduce(
      (acc, item) => {
        acc.totalPoints += item.maxPoints;
        acc.userPoints += item.userPoints;
        return acc;
      },
      { totalPoints: 0, userPoints: 0 }
    );

    const matchPercentage = totals.totalPoints > 0
      ? Math.min(100, Math.round((totals.userPoints / totals.totalPoints) * 100))
      : 0;

    // Calculate category percentages
    const categoryScores = {};
    Object.keys(categoryTotals).forEach(cat => {
      const catData = categoryTotals[cat];
      const pct = catData.total > 0 ? Math.round((catData.user / catData.total) * 100) : 0;
      categoryScores[cat] = {
        total: catData.total,
        user: catData.user,
        percentage: pct
      };
    });

    // Rank gaps by importance
    const gaps = skillBreakdown
      .filter(item => item.isGap)
      .sort((a, b) => b.gapImportance - a.gapImportance);

    // Filter skills user possesses
    const matchedUserSkills = skillBreakdown
      .filter(item => item.hasSkill)
      .sort((a, b) => b.userPoints - a.userPoints);

    return {
      matchPercentage: matchPercentage,
      totalRequiredWeight: totals.totalPoints,
      userScoreWeight: totals.userPoints,
      categoryScores: categoryScores,
      skillBreakdown: skillBreakdown,
      gaps: gaps,
      matchedUserSkills: matchedUserSkills
    };
  }

  /**
   * Generate tailored CV keywords ordered by relevance
   */
  function generateCVKeywords(parsedResult, userProfile) {
    const analysis = calculateMatch(parsedResult, userProfile);
    
    // Sort skills user has by relevance weight in JD
    const recommendedCVKeywords = analysis.skillBreakdown
      .filter(item => item.userLevel >= 2) // User has basic to advanced proficiency
      .sort((a, b) => b.maxPoints - a.maxPoints)
      .map(item => ({
        name: item.skill.name,
        category: item.skill.category,
        requirementLevel: item.requirementLevel,
        userLevel: item.userLevel,
        keywordFormat: item.skill.name
      }));

    return recommendedCVKeywords;
  }

  /**
   * Compare two Job Descriptions (JD A vs JD B)
   */
  function compareJobDescriptions(parsedA, parsedB) {
    const skillsA = new Map(parsedA.matchedSkills.map(item => [item.skill.id, item]));
    const skillsB = new Map(parsedB.matchedSkills.map(item => [item.skill.id, item]));

    const shared = [];
    const uniqueA = [];
    const uniqueB = [];

    const allSkillIds = new Set([...skillsA.keys(), ...skillsB.keys()]);

    allSkillIds.forEach(id => {
      const inA = skillsA.get(id);
      const inB = skillsB.get(id);

      if (inA && inB) {
        shared.push({
          skill: inA.skill,
          itemA: inA,
          itemB: inB
        });
      } else if (inA) {
        uniqueA.push({
          skill: inA.skill,
          item: inA
        });
      } else if (inB) {
        uniqueB.push({
          skill: inB.skill,
          item: inB
        });
      }
    });

    const totalUniqueSkills = allSkillIds.size;
    const similarityPercentage = totalUniqueSkills > 0
      ? Math.round((shared.length / totalUniqueSkills) * 100)
      : 0;

    return {
      shared: shared,
      uniqueA: uniqueA,
      uniqueB: uniqueB,
      similarityPercentage: similarityPercentage,
      totalSkillsA: skillsA.size,
      totalSkillsB: skillsB.size
    };
  }

  return {
    calculateMatch: calculateMatch,
    generateCVKeywords: generateCVKeywords,
    compareJobDescriptions: compareJobDescriptions
  };
})();
})(typeof window !== 'undefined' ? window : globalThis);
