/**
 * parser.js - Skill Gap Analyzer
 * Handles text tokenization, skill extraction with safe regex,
 * context sentiment (Must-have vs Nice-to-have), and safe DOM highlighting.
 */

(function (root) {
  'use strict';
  root.AppParser = (function () {
  'use strict';

  // Helper to escape regex special characters
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Build a safe regular expression pattern for a skill synonym.
   * Special logic handles tricky tokens like C++, C#, .NET, Node.js, CI/CD.
   */
  function buildSkillRegex(synonym) {
    const escaped = escapeRegExp(synonym.toLowerCase());
    
    // For tokens starting or ending with special characters (e.g., .NET, C++, C#)
    const startsWithSpecial = /^[^a-z0-9]/i.test(synonym);
    const endsWithSpecial = /[^a-z0-9]$/i.test(synonym);

    const leftBoundary = startsWithSpecial 
      ? '(?:^|(?<=[^a-zA-Z0-9_]))' 
      : '(?:^|(?<=[^a-zA-Z0-9_+#.-]))';

    const rightBoundary = endsWithSpecial 
      ? '(?:$|(?=[^a-zA-Z0-9_]))' 
      : '(?:$|(?=[^a-zA-Z0-9_+#.-]))';

    return new RegExp(leftBoundary + escaped + rightBoundary, 'gi');
  }

  /**
   * Analyze context of a sentence to infer requirement level.
   */
  function detectRequirementLevel(sentence) {
    const s = sentence.toLowerCase();
    
    const preferredKeywords = [
      'preferred', 'nice to have', 'nice-to-have', 'plus', 'bonus', 
      'optional', 'ideal', 'desired', 'beneficial', 'advantageous', 
      'familiarity with', 'exposure to', 'good to have', 'plusses'
    ];
    
    const requiredKeywords = [
      'required', 'must have', 'must-have', 'essential', 'minimum', 
      'mandatory', 'prerequisite', 'core requirement', 'years of experience', 
      'must be proficient', 'strong proficiency', 'hands-on experience'
    ];

    for (const kw of preferredKeywords) {
      if (s.includes(kw)) return 'preferred';
    }

    for (const kw of requiredKeywords) {
      if (s.includes(kw)) return 'required';
    }

    return 'required'; // default assumption for listed skills
  }

  /**
   * Extract all skills from job description text against dictionary.
   */
  function parseJobDescription(text, skillsDictionary) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      return {
        matchedSkills: [],
        matchesBySkillId: new Map(),
        totalMatches: 0,
        wordCount: 0,
        charCount: 0
      };
    }

    const cleanText = text.trim();
    const wordCount = (cleanText.match(/\S+/g) || []).length;
    const charCount = cleanText.length;

    // Break text into sentences for context detection
    const sentences = cleanText.split(/(?<=[.!?\n])\s+/);
    
    const matchesMap = new Map(); // skillId => { skill, count, locations: [], requirementLevel }

    skillsDictionary.forEach(skill => {
      let skillMatchCount = 0;
      let highestRequirementLevel = 'preferred';
      const foundSynonyms = new Set();
      const occurrences = [];

      // Sort synonyms by length descending so longer phrases match first (e.g. "React.js" before "React")
      const sortedSynonyms = [...skill.synonyms].sort((a, b) => b.length - a.length);

      sentences.forEach((sentence, sentenceIdx) => {
        let sentenceLevel = null;

        sortedSynonyms.forEach(synonym => {
          const regex = buildSkillRegex(synonym);
          let match;

          while ((match = regex.exec(sentence)) !== null) {
            skillMatchCount++;
            foundSynonyms.add(synonym);

            if (!sentenceLevel) {
              sentenceLevel = detectRequirementLevel(sentence);
            }

            if (sentenceLevel === 'required') {
              highestRequirementLevel = 'required';
            }

            occurrences.push({
              synonymMatched: synonym,
              sentenceIndex: sentenceIdx,
              sentenceSnippet: sentence.trim(),
              indexInSentence: match.index
            });
          }
        });
      });

      if (skillMatchCount > 0) {
        matchesMap.set(skill.id, {
          skill: skill,
          count: skillMatchCount,
          synonymsFound: Array.from(foundSynonyms),
          requirementLevel: highestRequirementLevel,
          occurrences: occurrences
        });
      }
    });

    return {
      matchedSkills: Array.from(matchesMap.values()),
      matchesBySkillId: matchesMap,
      totalMatches: Array.from(matchesMap.values()).reduce((sum, item) => sum + item.count, 0),
      wordCount: wordCount,
      charCount: charCount
    };
  }

  /**
   * Safely build highlighted DOM elements for job description text without innerHTML.
   * Returns a DocumentFragment.
   */
  function createHighlightedFragment(text, matchedSkills) {
    const fragment = document.createDocumentFragment();
    if (!text) return fragment;

    // Collect all match index spans in the full text
    const spans = [];

    matchedSkills.forEach(item => {
      const skill = item.skill;
      // Sort synonyms by length descending
      const sortedSynonyms = [...skill.synonyms].sort((a, b) => b.length - a.length);

      sortedSynonyms.forEach(synonym => {
        const regex = buildSkillRegex(synonym);
        let match;
        const textLower = text.toLowerCase();

        while ((match = regex.exec(textLower)) !== null) {
          const start = match.index;
          const end = start + match[0].length;
          
          spans.push({
            start: start,
            end: end,
            originalMatchedText: text.substring(start, end),
            skill: skill,
            requirementLevel: item.requirementLevel
          });
        }
      });
    });

    // Remove overlapping spans (keep longest / earliest)
    spans.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return (b.end - b.start) - (a.end - a.start);
    });

    const nonOverlappingSpans = [];
    let lastEnd = 0;

    for (const span of spans) {
      if (span.start >= lastEnd) {
        nonOverlappingSpans.push(span);
        lastEnd = span.end;
      }
    }

    // Build DOM safely with text nodes and <mark> elements
    let currentIdx = 0;

    nonOverlappingSpans.forEach(span => {
      // Append text before match
      if (span.start > currentIdx) {
        fragment.appendChild(document.createTextNode(text.substring(currentIdx, span.start)));
      }

      // Create <mark> element
      const mark = document.createElement('mark');
      mark.className = `skill-mark cat-${span.skill.category} req-${span.requirementLevel}`;
      mark.setAttribute('data-skill-id', span.skill.id);
      mark.setAttribute('data-skill-name', span.skill.name);
      mark.setAttribute('data-category', span.skill.category);
      mark.setAttribute('data-requirement', span.requirementLevel);
      mark.textContent = span.originalMatchedText;

      // Tooltip data
      mark.setAttribute('title', `${span.skill.name} (${span.skill.category.replace('_', ' ')}) • ${span.requirementLevel.toUpperCase()}`);

      fragment.appendChild(mark);
      currentIdx = span.end;
    });

    // Append remaining text
    if (currentIdx < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(currentIdx)));
    }

    return fragment;
  }

  /**
   * Extract text from various file formats (.txt, .md, .pdf, .docx, .rtf)
   * Uses browser FileReader and standard text stream decoders.
   */
  function extractTextFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve('');
        return;
      }

      const fileName = file.name.toLowerCase();
      const reader = new FileReader();

      if (fileName.endsWith('.pdf')) {
        reader.onload = async function (e) {
          try {
            const buffer = e.target.result;
            
            // Try extracting using PDF.js if library is available
            if (typeof window !== 'undefined' && window.pdfjsLib) {
              try {
                if (window.pdfjsLib.GlobalWorkerOptions) {
                  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                }
                const typedArray = new Uint8Array(buffer);
                const loadingTask = window.pdfjsLib.getDocument({ data: typedArray });
                const pdf = await loadingTask.promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                  const page = await pdf.getPage(i);
                  const tokenized = await page.getTextContent();
                  const pageText = tokenized.items.map(item => item.str).join(' ');
                  fullText += pageText + '\n\n';
                }
                if (fullText && fullText.trim().length > 10) {
                  resolve(fullText.trim());
                  return;
                }
              } catch (pdfJsErr) {
                console.warn('PDF.js parsing error, falling back to clean regex extractor:', pdfJsErr);
              }
            }

            // Fallback PDF text extraction & thorough sanitization
            const bytes = new Uint8Array(buffer);
            const decoder = new TextDecoder('utf-8', { fatal: false });
            const rawStr = decoder.decode(bytes);

            let extractedText = '';

            // Extract text inside PDF text operator parentheses (...) Tj and [(...)] TJ
            const tjMatches = rawStr.match(/\(([^()]+)\)\s*Tj/g);
            if (tjMatches && tjMatches.length > 0) {
              extractedText = tjMatches.map(m => m.replace(/^\(|\)\s*Tj$/g, '')).join(' ');
            } else {
              const arrayMatches = rawStr.match(/\[((?:\([^()]*\)\s*)*)\]\s*TJ/gi);
              if (arrayMatches && arrayMatches.length > 0) {
                extractedText = arrayMatches.map(arr => {
                  const inner = arr.match(/\(([^()]*)\)/g) || [];
                  return inner.map(s => s.replace(/^\(|\)$/g, '')).join('');
                }).join(' ');
              } else {
                // Strip binary streams, PDF objects, and metadata keywords
                extractedText = rawStr
                  .replace(/<<[\s\S]*?>>/g, ' ')
                  .replace(/\/CreationDate[\s\S]*?\)/gi, ' ')
                  .replace(/\/PTEX[\s\S]*?\)/gi, ' ')
                  .replace(/\/Producer[\s\S]*?\)/gi, ' ')
                  .replace(/\/Creator[\s\S]*?\)/gi, ' ')
                  .replace(/\/Keywords[\s\S]*?\)/gi, ' ')
                  .replace(/\/Subject[\s\S]*?\)/gi, ' ')
                  .replace(/\/Title[\s\S]*?\)/gi, ' ')
                  .replace(/\/Author[\s\S]*?\)/gi, ' ')
                  .replace(/stream[\s\S]*?endstream/gi, ' ')
                  .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
                  .replace(/\b(?:Filter|FlateDecode|Length|Type|Catalog|Pages|Page|Font|XObject|obj|endobj|xref|trailer|startxref|FullBanner|kpathsea|pdfTeX|DecodeParms|Predictor)\b/gi, ' ');
              }
            }

            // Clean up hex strings, path tokens, and redundant spaces
            extractedText = extractedText
              .replace(/[\/\\][A-Za-z0-9._-]+/g, ' ')
              .replace(/<[a-fA-F0-9]+>/g, ' ')
              .replace(/[\(\)\[\]\{\}]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

            resolve(extractedText || `Resume PDF Document (${file.name})`);
          } catch (err) {
            resolve(`Resume PDF Document (${file.name})`);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read PDF file'));
        reader.readAsArrayBuffer(file);
      } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        reader.onload = function (e) {
          try {
            const buffer = e.target.result;
            const bytes = new Uint8Array(buffer);
            const decoder = new TextDecoder('utf-8');
            const rawStr = decoder.decode(bytes);

            // Extract text inside XML tags <w:t>text</w:t>
            const xmlMatches = rawStr.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
            if (xmlMatches && xmlMatches.length > 0) {
              const text = xmlMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
              resolve(text.trim());
            } else {
              const printable = rawStr.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
              resolve(printable.trim());
            }
          } catch (err) {
            resolve(`[Document File: ${file.name} loaded]`);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read Document file'));
        reader.readAsArrayBuffer(file);
      } else {
        // Plain text, markdown, rtf, json, csv
        reader.onload = function (e) {
          resolve(e.target.result || '');
        };
        reader.onerror = () => reject(new Error('Failed to read text file'));
        reader.readAsText(file);
      }
    });
  }

  /**
   * Extract contact details, links, and matched skills from resume text.
   */
  function extractResumeDetails(text, skillsDictionary) {
    if (!text || typeof text !== 'string') {
      return {
        name: '',
        email: '',
        phone: '',
        whatsapp: '',
        linkedin: '',
        github: '',
        leetcode: '',
        address: '',
        extractedSkills: []
      };
    }

    const cleanText = text.trim();

    // Email matching
    const emailMatch = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : '';

    // Phone / Whatsapp matching
    const phoneMatches = cleanText.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/g) || [];
    const phone = phoneMatches.length > 0 ? phoneMatches[0] : '';
    const whatsapp = phoneMatches.length > 1 ? phoneMatches[1] : phone;

    // Social links matching
    const linkedinMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
    const linkedin = linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : 'https://' + linkedinMatch[0]) : '';

    const githubMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
    const github = githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : 'https://' + githubMatch[0]) : '';

    const leetcodeMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?(?:leetcode|hackerrank)\.com\/[a-zA-Z0-9_-]+/i);
    const leetcode = leetcodeMatch ? (leetcodeMatch[0].startsWith('http') ? leetcodeMatch[0] : 'https://' + leetcodeMatch[0]) : '';

    // Heuristic Name detection (First non-empty short line without @ symbol)
    const lines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    let name = '';
    if (lines.length > 0) {
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i];
        if (line.length > 2 && line.length < 40 && !line.includes('@') && !line.toLowerCase().includes('resume') && !line.toLowerCase().includes('curriculum')) {
          name = line;
          break;
        }
      }
    }

    // Skills extraction against dictionary
    let extractedSkills = [];
    if (skillsDictionary && Array.isArray(skillsDictionary)) {
      const parsed = parseJobDescription(cleanText, skillsDictionary);
      extractedSkills = parsed.matchedSkills.map(m => m.skill.id);
    }

    return {
      name,
      email,
      phone,
      whatsapp,
      linkedin,
      github,
      leetcode,
      address: '',
      extractedSkills
    };
  }

  /**
   * Thoroughly clean PDF code/syntax keywords and metadata tags if raw PDF string leaks
   */
  function cleanPdfSyntax(text) {
    if (!text || typeof text !== 'string') return '';

    // If text contains raw PDF header or dictionary tokens (%PDF-, /Linearized, /DecodeParms, /ObjStm, etc.)
    if (text.includes('%PDF-') || text.includes('/Linearized') || text.includes('/DecodeParms') || text.includes('/ObjStm') || text.includes('<<') || text.includes('/MediaBox')) {
      let cleaned = text;

      // Strip PDF header
      cleaned = cleaned.replace(/%PDF-[0-9.]+/gi, ' ');

      // Strip dictionary constructs << ... >>
      for (let i = 0; i < 5; i++) {
        cleaned = cleaned.replace(/<<[^<>]*>>/g, ' ');
      }
      cleaned = cleaned.replace(/<<[\s\S]*?>>/g, ' ');

      // Strip hex string constructs [<...>] and <...>
      cleaned = cleaned.replace(/\[?<[a-fA-F0-9\s]{8,}>\]?/g, ' ');

      // Strip PDF object tags & slash keys (/Linearized, /DecodeParms, /Columns, /Predictor, /Font, etc.)
      cleaned = cleaned.replace(/\/[\w\d._-]+(?:\s*\[[\d\s]*\]|\s+[\d\s]+|\s*<<[\s\S]*?>>)?/g, ' ');

      // Strip keywords
      cleaned = cleaned.replace(/\b(?:Linearized|XRef|DecodeParms|Columns|Predictor|Index|Info|Root|Size|Prev|ID|Names|OpenAction|Labels|Nums|Mode|UseOutlines|ObjStm|First|MediaBox|Annots|Parent|Resources|ProcSet|stream|endstream|obj|endobj|xref|trailer|startxref|Filter|FlateDecode|FullBanner|kpathsea|pdfTeX)\b/gi, ' ');

      // Strip non-printable ASCII and unparsed binary operator sequences
      cleaned = cleaned.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      cleaned = cleaned.replace(/(?:^|\s)[^a-zA-Z0-9\s]{2,}(?=\s|$)/g, ' ');
      cleaned = cleaned.replace(/\s+/g, ' ').trim();

      if (!cleaned || cleaned.length < 15 || /^[^a-zA-Z0-9\s]+$/.test(cleaned)) {
        return 'Visual PDF Document Uploaded. (Switch to "Visual Document View" above to view full formatted resume document layout)';
      }
      return cleaned;
    }

    return text;
  }

  return {
    escapeRegExp: escapeRegExp,
    buildSkillRegex: buildSkillRegex,
    detectRequirementLevel: detectRequirementLevel,
    parseJobDescription: parseJobDescription,
    createHighlightedFragment: createHighlightedFragment,
    extractTextFromFile: extractTextFromFile,
    extractResumeDetails: extractResumeDetails,
    cleanPdfSyntax: cleanPdfSyntax
  };
})();
})(typeof window !== 'undefined' ? window : globalThis);
