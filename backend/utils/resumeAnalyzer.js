const fs = require('fs');
const path = require('path');

// Advanced skill keywords database
const SKILL_SYNONYMS = {
  'javascript': ['js', 'javascript', 'es6', 'es2015', 'ecmascript', 'node.js', 'nodejs'],
  'python': ['python', 'python3', 'py', 'django', 'flask', 'fastapi'],
  'react': ['react', 'reactjs', 'react.js', 'react native'],
  'java': ['java', 'spring', 'spring boot', 'j2ee', 'jvm'],
  'sql': ['sql', 'mysql', 'postgresql', 'oracle', 'sqlite', 'mssql', 'database'],
  'machine learning': ['ml', 'machine learning', 'deep learning', 'neural network', 'ai', 'tensorflow', 'pytorch', 'scikit'],
  'docker': ['docker', 'kubernetes', 'k8s', 'containerization', 'devops'],
  'html': ['html', 'html5', 'css', 'css3', 'bootstrap', 'tailwind'],
  'mongodb': ['mongodb', 'mongoose', 'nosql', 'document database'],
  'git': ['git', 'github', 'gitlab', 'version control', 'bitbucket'],
  'aws': ['aws', 'amazon web services', 'cloud', 'azure', 'gcp', 'google cloud'],
  'typescript': ['typescript', 'ts'],
  'angular': ['angular', 'angularjs'],
  'vue': ['vue', 'vuejs', 'vue.js'],
  'php': ['php', 'laravel', 'symfony', 'wordpress'],
  'c++': ['c++', 'cpp', 'c plus plus'],
  'communication': ['communication', 'presentation', 'verbal', 'written communication', 'interpersonal'],
  'leadership': ['leadership', 'team lead', 'management', 'mentor', 'scrum master'],
  'agile': ['agile', 'scrum', 'kanban', 'sprint', 'jira'],
  'testing': ['testing', 'unit test', 'jest', 'mocha', 'selenium', 'qa', 'quality assurance']
};

// Extract text from PDF (simple extraction for built-in pdf-parse)
const extractTextFromPDF = async (filePath) => {
  try {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF parse error:', error.message);
    return '';
  }
};

// Normalize skill for matching
const normalizeSkill = (skill) => skill.toLowerCase().trim();

// Find canonical skill name
const findCanonicalSkill = (skill) => {
  const normalized = normalizeSkill(skill);
  for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    if (synonyms.some(s => normalized.includes(s) || s.includes(normalized))) {
      return canonical;
    }
  }
  return normalized;
};

// Extract skills from resume text using NLP-like approach
const extractSkillsFromText = (text) => {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  const foundSkills = new Set();
  
  // Check all known skills and synonyms
  for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    for (const synonym of synonyms) {
      const regex = new RegExp(`\\b${synonym.replace(/[.+*?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lowerText)) {
        foundSkills.add(canonical);
        break;
      }
    }
  }
  
  // Also extract words near skill section
  const skillSectionRegex = /skills?[:\s]+([^.]+)/gi;
  let match;
  while ((match = skillSectionRegex.exec(text)) !== null) {
    const skillPart = match[1].toLowerCase();
    const words = skillPart.split(/[,\s|•·]+/).filter(w => w.length > 1);
    words.forEach(w => {
      const canonical = findCanonicalSkill(w);
      if (canonical) foundSkills.add(canonical);
    });
  }
  
  return [...foundSkills];
};

// Extract experience years from text
const extractExperience = (text) => {
  if (!text) return 0;
  const patterns = [
    /(\d+)\+?\s*years?\s+of\s+experience/i,
    /experience\s+of\s+(\d+)\+?\s*years?/i,
    /(\d+)\+?\s*years?\s+experience/i,
    /(\d+)\s*yr[s]?\s+exp/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseInt(match[1]);
  }
  return 0;
};

// Calculate resume-job match score (ML-like weighted scoring)
const calculateResumeMatch = (resumeText, requiredSkills) => {
  const extractedSkills = extractSkillsFromText(resumeText);
  const experience = extractExperience(resumeText);
  
  if (!requiredSkills || requiredSkills.length === 0) {
    return { score: 50, matchedSkills: [], missingSkills: [], extractedSkills, experience };
  }
  
  const normalizedRequired = requiredSkills.map(s => findCanonicalSkill(s));
  const normalizedExtracted = extractedSkills.map(s => findCanonicalSkill(s));
  
  const matchedSkills = [];
  const missingSkills = [];
  
  normalizedRequired.forEach(reqSkill => {
    const found = normalizedExtracted.some(extSkill => 
      extSkill === reqSkill || 
      extSkill.includes(reqSkill) || 
      reqSkill.includes(extSkill)
    );
    if (found) {
      matchedSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);
    }
  });
  
  // Base score from skill match
  const skillScore = (matchedSkills.length / normalizedRequired.length) * 80;
  
  // Bonus points for experience
  const expBonus = Math.min(experience * 2, 20); // max 20 points for exp
  
  // Total score
  const totalScore = Math.round(Math.min(skillScore + expBonus, 100));
  
  // Generate AI analysis text
  const analysisText = generateAnalysisText(matchedSkills, missingSkills, experience, totalScore);
  
  return {
    score: totalScore,
    matchedSkills,
    missingSkills,
    extractedSkills,
    experience,
    analysis: analysisText
  };
};

const generateAnalysisText = (matched, missing, exp, score) => {
  let text = '';
  
  if (score >= 80) {
    text = `Excellent candidate profile! `;
  } else if (score >= 60) {
    text = `Good candidate with relevant experience. `;
  } else if (score >= 40) {
    text = `Moderate match - some key skills missing. `;
  } else {
    text = `Low match - significant skill gaps identified. `;
  }
  
  if (matched.length > 0) {
    text += `Strong skills in: ${matched.slice(0, 5).join(', ')}. `;
  }
  
  if (missing.length > 0) {
    text += `Missing required skills: ${missing.join(', ')}. `;
  }
  
  if (exp > 0) {
    text += `Has ${exp} years of experience. `;
  }
  
  return text;
};

module.exports = { extractTextFromPDF, extractSkillsFromText, calculateResumeMatch, extractExperience };
