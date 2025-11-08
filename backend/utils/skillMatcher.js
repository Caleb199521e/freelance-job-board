/**
 * Skill Matching Algorithm
 * Matches freelancer skills with job requirements
 */

class SkillMatcher {
  /**
   * Calculate match score between freelancer skills and job requirements
   * @param {Array<string>} freelancerSkills - Freelancer's skills
   * @param {Array<string>} jobSkills - Job's required skills
   * @returns {Object} Match result with score and matched skills
   */
  static calculateMatchScore(freelancerSkills, jobSkills) {
    if (!freelancerSkills || !jobSkills || freelancerSkills.length === 0 || jobSkills.length === 0) {
      return { score: 0, matchedSkills: [], unmatchedSkills: jobSkills || [] };
    }

    // Normalize skills to lowercase for comparison
    const normalizedFreelancerSkills = freelancerSkills.map(skill => 
      skill.toLowerCase().trim()
    );
    const normalizedJobSkills = jobSkills.map(skill => 
      skill.toLowerCase().trim()
    );

    // Find matched skills
    const matchedSkills = normalizedJobSkills.filter(jobSkill =>
      normalizedFreelancerSkills.includes(jobSkill)
    );

    // Find unmatched skills
    const unmatchedSkills = normalizedJobSkills.filter(jobSkill =>
      !normalizedFreelancerSkills.includes(jobSkill)
    );

    // Calculate match percentage
    const matchPercentage = (matchedSkills.length / normalizedJobSkills.length) * 100;

    return {
      score: Math.round(matchPercentage),
      matchedSkills: matchedSkills,
      unmatchedSkills: unmatchedSkills,
      totalJobSkills: jobSkills.length,
      matchedCount: matchedSkills.length
    };
  }

  /**
   * Check if job matches freelancer's skills based on minimum threshold
   * @param {Array<string>} freelancerSkills - Freelancer's skills
   * @param {Array<string>} jobSkills - Job's required skills
   * @param {number} minThreshold - Minimum match percentage (default: 50)
   * @returns {boolean} True if job matches
   */
  static isMatch(freelancerSkills, jobSkills, minThreshold = 50) {
    const result = this.calculateMatchScore(freelancerSkills, jobSkills);
    return result.score >= minThreshold;
  }

  /**
   * Filter jobs based on freelancer's skills
   * @param {Array<Object>} jobs - Array of job objects
   * @param {Array<string>} freelancerSkills - Freelancer's skills
   * @param {number} minThreshold - Minimum match percentage (default: 50)
   * @returns {Array<Object>} Filtered and sorted jobs with match scores
   */
  static filterMatchingJobs(jobs, freelancerSkills, minThreshold = 50) {
    if (!jobs || jobs.length === 0) return [];
    if (!freelancerSkills || freelancerSkills.length === 0) return [];

    // Calculate match score for each job
    const jobsWithScores = jobs.map(job => {
      const matchResult = this.calculateMatchScore(
        freelancerSkills,
        job.skillsRequired || []
      );

      return {
        ...job,
        matchScore: matchResult.score,
        matchedSkills: matchResult.matchedSkills,
        unmatchedSkills: matchResult.unmatchedSkills
      };
    });

    // Filter jobs that meet minimum threshold
    const matchingJobs = jobsWithScores.filter(job => 
      job.matchScore >= minThreshold
    );

    // Sort by match score (highest first)
    matchingJobs.sort((a, b) => b.matchScore - a.matchScore);

    return matchingJobs;
  }

  /**
   * Get freelancers that match job requirements
   * @param {Array<Object>} freelancers - Array of freelancer objects
   * @param {Array<string>} jobSkills - Job's required skills
   * @param {number} minThreshold - Minimum match percentage (default: 50)
   * @returns {Array<Object>} Matching freelancers with scores
   */
  static findMatchingFreelancers(freelancers, jobSkills, minThreshold = 50) {
    if (!freelancers || freelancers.length === 0) return [];
    if (!jobSkills || jobSkills.length === 0) return [];

    const freelancersWithScores = freelancers.map(freelancer => {
      const skills = freelancer.profile?.skills || [];
      const matchResult = this.calculateMatchScore(skills, jobSkills);

      return {
        ...freelancer,
        matchScore: matchResult.score,
        matchedSkills: matchResult.matchedSkills
      };
    });

    // Filter and sort
    const matchingFreelancers = freelancersWithScores.filter(f => 
      f.matchScore >= minThreshold
    );

    matchingFreelancers.sort((a, b) => b.matchScore - a.matchScore);

    return matchingFreelancers;
  }

  /**
   * Get match quality label based on score
   * @param {number} score - Match score percentage
   * @returns {string} Quality label
   */
  static getMatchQuality(score) {
    if (score >= 90) return 'Excellent Match';
    if (score >= 75) return 'Great Match';
    if (score >= 60) return 'Good Match';
    if (score >= 50) return 'Fair Match';
    return 'Poor Match';
  }
}

export default SkillMatcher;
