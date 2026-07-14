/**
 * Agent Service — Researcher / Analyst / Publisher pipeline
 *
 * Each agent has DEDICATED TOOLS:
 *
 * RESEARCHER tools:  searchKB, searchWeb, searchRSS
 * ANALYST tools:     checkDependencies, assessRisk, crossReference
 * PUBLISHER tools:   formatReport, createApproval
 */

import ResearchTask from '../models/ResearchTask.js';
import ApprovalRequest from '../models/ApprovalRequest.js';
import { ragSearch, buildRAGContext } from './vectorStoreService.js';
import { searchDuckDuckGo, searchRSSFeeds } from './searchService.js';

const OLLAMA_BASE_URL = () => process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = () => process.env.OLLAMA_MODEL || 'llama3.2';

// Concurrency guard — prevent duplicate pipeline runs on the same task
const runningPipelines = new Set();

async function callLLM(systemPrompt, userPrompt, model) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000); // 90s timeout

  try {
    const resp = await fetch(`${OLLAMA_BASE_URL()}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || OLLAMA_MODEL(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt.slice(0, 4000) }
        ],
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 512
        }
      }),
      signal: controller.signal
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      throw new Error(`LLM error ${resp.status}: ${errBody}`);
    }

    const data = await resp.json();
    return data.message?.content || '';
  } finally {
    clearTimeout(timeout);
  }
}

// ═══════════════════════════════════════════════════════════════════
// RESEARCHER AGENT — Tools: searchKB, searchWeb, searchRSS
// ═══════════════════════════════════════════════════════════════════

const researcherTools = {
  async searchKB(query) {
    console.log(`  [Tool:searchKB] "${query}"`);
    const results = await ragSearch(query, { topK: 6 });
    return {
      context: buildRAGContext(results),
      sources: results.map(r => ({ title: r.title, source: r.source, score: r.score }))
    };
  },
  async searchWeb(query) {
    console.log(`  [Tool:searchWeb] "${query}"`);
    const results = await searchDuckDuckGo(query, 5);
    return {
      context: results.map((r, i) => `[Web ${i + 1}] "${r.title}"\n${r.snippet}\nURL: ${r.url}`).join('\n\n') || 'No web results.',
      sources: results.map(r => ({ title: r.title, url: r.url, source: 'duckduckgo' }))
    };
  },
  async searchRSS(query) {
    console.log(`  [Tool:searchRSS] "${query}"`);
    const results = await searchRSSFeeds(query, undefined, 5);
    return {
      context: results.map((r, i) => `[RSS ${i + 1}] "${r.title}" (${r.feedTitle})\n${r.snippet}\nURL: ${r.url}`).join('\n\n') || 'No RSS results.',
      sources: results.map(r => ({ title: r.title, url: r.url, source: 'rss' }))
    };
  }
};

const RESEARCHER_SYSTEM = `You are a Research Agent. Synthesize the tool outputs into a structured brief.

Format:
## Key Findings
(numbered list)
## Internal Sources Summary
(what the knowledge base says)
## External Sources Summary
(what web/RSS says)
## Gaps & Conflicts
(missing info or contradictions)

Be concise — max 1500 words.`;

async function runResearcher(task) {
  task.pipeline.researcher.status = 'running';
  task.pipeline.researcher.startedAt = new Date();
  task.status = 'researching';
  await task.save();

  try {
    console.log(`[Researcher] Starting for: "${task.query}"`);
    const allSources = { kb: [], external: [] };
    const contextParts = [];

    // Tool 1: Knowledge Base search
    if (task.settings.searchKnowledgeBase) {
      try {
        const kb = await researcherTools.searchKB(task.query);
        contextParts.push(`## Knowledge Base Results\n${kb.context}`);
        allSources.kb = kb.sources;
      } catch (err) {
        console.warn('  [Tool:searchKB] Failed:', err.message);
        contextParts.push('## Knowledge Base Results\nTool failed.');
      }
    }

    // Tool 2: DuckDuckGo web search
    if (task.settings.searchWeb) {
      try {
        const web = await researcherTools.searchWeb(task.query);
        contextParts.push(`## Web Search Results\n${web.context}`);
        allSources.external.push(...web.sources);
      } catch (err) {
        console.warn('  [Tool:searchWeb] Failed:', err.message);
        contextParts.push('## Web Search Results\nTool failed.');
      }
    }

    // Tool 3: RSS feed search
    if (task.settings.searchRss) {
      try {
        const rss = await researcherTools.searchRSS(task.query);
        contextParts.push(`## RSS Feed Results\n${rss.context}`);
        allSources.external.push(...rss.sources);
      } catch (err) {
        console.warn('  [Tool:searchRSS] Failed:', err.message);
        contextParts.push('## RSS Feed Results\nTool failed.');
      }
    }

    // Synthesize with LLM
    const toolOutputs = contextParts.join('\n\n');
    const prompt = `## Research Query\n${task.query}\n\n## Tool Outputs\n${toolOutputs}\n\nSynthesize a research brief from these tool outputs.`;

    console.log(`[Researcher] Synthesizing (${contextParts.length} tools, ${prompt.length} chars)...`);
    const brief = await callLLM(RESEARCHER_SYSTEM, prompt);
    console.log('[Researcher] Done.');

    task.pipeline.researcher.results = {
      brief,
      kbSources: allSources.kb,
      externalSources: allSources.external
    };
    task.pipeline.researcher.status = 'done';
    task.pipeline.researcher.completedAt = new Date();
    await task.save();
    return task;
  } catch (error) {
    task.pipeline.researcher.status = 'failed';
    task.pipeline.researcher.completedAt = new Date();
    task.pipeline.researcher.results = { error: error.message };
    await task.save();
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
// ANALYST AGENT — Tools: checkDependencies, assessRisk, crossReference
// ═══════════════════════════════════════════════════════════════════

const analystTools = {
  checkDependencies(brief) {
    console.log('  [Tool:checkDependencies] Scanning...');
    const nodeVersions = brief.match(/node\.?js\s*(?:v|version)?\s*([\d.]+)/gi) || [];
    const packages = brief.match(/(?:npm|yarn)\s+(?:install|add|update)\s+(\S+)/gi) || [];
    const conflicts = brief.match(/(?:conflict|incompatib|mismatch|breaking)[\w\s]*(?:version|dependency)/gi) || [];
    const security = brief.match(/(?:CVE-\d{4}-\d+|vulnerability|exploit|patch|security\s+(?:update|fix|advisory))/gi) || [];
    return [
      nodeVersions.length ? `Node.js versions: ${nodeVersions.join(', ')}` : null,
      packages.length ? `Packages: ${packages.join(', ')}` : null,
      conflicts.length ? `⚠️ ${conflicts.length} version conflicts` : null,
      security.length ? `🔴 ${security.length} security mentions` : null
    ].filter(Boolean).join('\n') || 'No dependency issues detected.';
  },
  assessRisk(brief) {
    console.log('  [Tool:assessRisk] Evaluating...');
    const c = (brief.match(/critical|severe|urgent|exploit|zero.day/gi) || []).length;
    const h = (brief.match(/breaking.change|deprecat|vulnerability|security.flaw/gi) || []).length;
    const m = (brief.match(/warning|should.update|recommend|outdated/gi) || []).length;
    const risk = c > 0 ? 'CRITICAL' : h > 0 ? 'HIGH' : m > 0 ? 'MEDIUM' : 'LOW';
    return `Overall: ${risk} (Critical:${c} High:${h} Medium:${m})`;
  },
  crossReference(brief) {
    console.log('  [Tool:crossReference] Checking contradictions...');
    const hits = (brief.match(/however|but contrary|contradicts|disagrees|on the other hand/gi) || []).length;
    return hits > 0 ? `${hits} potential contradictions found` : 'No contradictions detected.';
  }
};

const ANALYST_SYSTEM = `You are an Analyst Agent with these tool results available.

Format:
## Risk Level: [CRITICAL/HIGH/MEDIUM/LOW]
## Critical Findings
🔴 (list)
## Warnings
🟡 (list)
## Information
🟢 (list)
## Dependency Status
(issues found)
## Recommendations
(numbered action items)

Be specific. Max 1000 words.`;

async function runAnalyst(task) {
  task.pipeline.analyst.status = 'running';
  task.pipeline.analyst.startedAt = new Date();
  task.status = 'analyzing';
  await task.save();

  try {
    const brief = task.pipeline.researcher.results?.brief || '';
    console.log('[Analyst] Running analysis tools...');

    // Run dedicated analyst tools
    const depCheck = analystTools.checkDependencies(brief);
    const riskLevel = analystTools.assessRisk(brief);
    const crossRef = analystTools.crossReference(brief);

    const toolOutputs = `## Tool: checkDependencies\n${depCheck}\n\n## Tool: assessRisk\n${riskLevel}\n\n## Tool: crossReference\n${crossRef}`;

    const prompt = `## Research Brief\n${brief.slice(0, 5000)}\n\n## Analysis Tool Outputs\n${toolOutputs}\n\n## Query\n${task.query}\n\nWrite your analysis.`;

    console.log(`[Analyst] Calling LLM (${prompt.length} chars)...`);
    const analysis = await callLLM(ANALYST_SYSTEM, prompt);
    console.log('[Analyst] Done.');

    task.pipeline.analyst.analysis = analysis;
    task.pipeline.analyst.status = 'done';
    task.pipeline.analyst.completedAt = new Date();
    await task.save();

    return task;
  } catch (error) {
    task.pipeline.analyst.status = 'failed';
    task.pipeline.analyst.completedAt = new Date();
    await task.save();
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
// PUBLISHER AGENT — Tools: formatReport, createApproval
// ═══════════════════════════════════════════════════════════════════

const publisherTools = {
  buildHeader(query) {
    console.log('  [Tool:formatReport] Structuring...');
    return `# Research Report: ${query}\n_Generated by AI Agent Pipeline — ${new Date().toISOString().split('T')[0]}_\n\n---\n\n`;
  },
  async createApproval(report, task, analysis) {
    console.log('  [Tool:createApproval] Submitting for review...');
    const allSources = [
      ...(task.pipeline.researcher.results?.kbSources || []).map(s => ({
        type: s.source, title: s.title, url: '', snippet: ''
      })),
      ...(task.pipeline.researcher.results?.externalSources || []).map(s => ({
        type: s.source, title: s.title, url: s.url, snippet: ''
      }))
    ];
    return ApprovalRequest.create({
      type: 'research',
      title: `Research: ${task.query.slice(0, 80)}`,
      description: `AI agent pipeline completed for: "${task.query}"`,
      priority: detectPriority(analysis),
      agentOutput: report,
      sources: allSources,
      submittedBy: task.createdBy,
      payload: { taskId: task._id }
    });
  }
};

const PUBLISHER_SYSTEM = `You are a Publisher Agent. Produce a polished Markdown report.

Structure:
## Executive Summary
(2-3 sentences)
## Key Findings
(numbered list)
## Detailed Analysis
(expanded sections)
## Action Items
- [ ] (checkboxes)
## Sources
(list)

Max 1200 words.`;

async function runPublisher(task) {
  task.pipeline.publisher.status = 'running';
  task.pipeline.publisher.startedAt = new Date();
  task.status = 'publishing';
  await task.save();

  try {
    const brief = task.pipeline.researcher.results?.brief || '';
    const analysis = task.pipeline.analyst.analysis || '';

    console.log('[Publisher] Running tools...');

    // Tool 1: Format report header
    const header = publisherTools.buildHeader(task.query);

    const prompt = `## Research Brief\n${brief.slice(0, 3500)}\n\n## Analysis\n${analysis.slice(0, 3500)}\n\n## Query\n${task.query}\n\nStart with:\n${header}`;

    console.log(`[Publisher] Calling LLM (${prompt.length} chars)...`);
    const report = await callLLM(PUBLISHER_SYSTEM, prompt);
    console.log('[Publisher] Done.');

    task.pipeline.publisher.output = report;
    task.pipeline.publisher.status = 'done';
    task.pipeline.publisher.completedAt = new Date();

    // Tool 2: Create approval if required
    if (task.settings.requireApproval) {
      const approval = await publisherTools.createApproval(report, task, analysis);
      task.pipeline.publisher.approvalId = approval._id;
      task.status = 'awaiting-approval';
    } else {
      task.status = 'completed';
    }

    await task.save();
    return task;
  } catch (error) {
    task.pipeline.publisher.status = 'failed';
    task.pipeline.publisher.completedAt = new Date();
    task.status = 'failed';
    await task.save();
    throw error;
  }
}

/**
 * Detect priority from analysis content.
 */
function detectPriority(analysis) {
  const lower = (analysis || '').toLowerCase();
  if (lower.includes('🔴') || lower.includes('critical') || lower.includes('security vulnerability'))
    return 'critical';
  if (lower.includes('🟡') || lower.includes('warning') || lower.includes('breaking change'))
    return 'high';
  if (lower.includes('recommended') || lower.includes('should'))
    return 'medium';
  return 'low';
}

// ─── PIPELINE ORCHESTRATOR ──────────────────────────────────────────

/**
 * Run the full Researcher → Analyst → Publisher pipeline.
 */
export async function runAgentPipeline(taskId) {
  const taskIdStr = taskId.toString();

  // Prevent duplicate concurrent runs
  if (runningPipelines.has(taskIdStr)) {
    console.log(`[Pipeline] Already running for task ${taskIdStr}, skipping.`);
    return;
  }

  runningPipelines.add(taskIdStr);

  let task = await ResearchTask.findById(taskId);
  if (!task) {
    runningPipelines.delete(taskIdStr);
    throw new Error('Research task not found');
  }

  try {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`[Pipeline] "${task.query}"`);
    console.log(`${'═'.repeat(60)}`);

    console.log('\n[Stage 1/3] RESEARCHER (tools: searchKB, searchWeb, searchRSS)');
    task = await runResearcher(task);

    console.log('\n[Stage 2/3] ANALYST (tools: checkDependencies, assessRisk, crossReference)');
    task = await runAnalyst(task);

    console.log('\n[Stage 3/3] PUBLISHER (tools: formatReport, createApproval)');
    task = await runPublisher(task);

    console.log(`\n[Pipeline] ✅ Completed — status: ${task.status}\n`);
    return task;
  } catch (error) {
    console.error(`[Pipeline] ❌ Failed: ${error.message}`);
    // Only set failed if not already in a terminal state
    task = await ResearchTask.findById(taskId);
    if (task && !['completed', 'awaiting-approval'].includes(task.status)) {
      task.status = 'failed';
      await task.save();
    }
    throw error;
  } finally {
    runningPipelines.delete(taskIdStr);
  }
}

/**
 * Create a new research task and start the pipeline.
 * Returns the task immediately; pipeline runs in background.
 */
export async function createAndRunResearch(query, userId, settings = {}) {
  const task = await ResearchTask.create({
    query,
    createdBy: userId,
    settings: {
      searchWeb: settings.searchWeb !== false,
      searchRss: settings.searchRss !== false,
      searchKnowledgeBase: settings.searchKnowledgeBase !== false,
      requireApproval: settings.requireApproval !== false
    }
  });

  // Run pipeline in background (don't await)
  runAgentPipeline(task._id).catch(err => {
    console.error(`Agent pipeline failed for task ${task._id}:`, err.message);
  });

  return task;
}
