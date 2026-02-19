// BuildWise AI Construction Planning - Main Script
// =====================================================

const form = document.getElementById('projectForm');

// ⚠️ SETUP REQUIRED: Add your Google Gemini API key here
// Get it FREE from: https://ai.google.dev/
const GEMINI_API_KEY = 'AIzaSyDVBo5J_QRG8boC8w9CWuobbOvjBGTvh9E';
const GEMINI_MODEL = 'gemini-1.5-flash';

// Chart instances map and latest generated plan data
const chartInstances = {};
let latestPlan = null;

function createOrUpdateChart(canvasId, config){
  const canvas = document.getElementById(canvasId);
  if(!canvas) return null;
  // ensure canvas is visible before creating chart
  canvas.style.display = 'block';
  if(chartInstances[canvasId]){
    chartInstances[canvasId].config = config;
    chartInstances[canvasId].update();
    return chartInstances[canvasId];
  }

  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, config);
  chartInstances[canvasId] = chart;
  return chart;
}

// Smart fallback recommendations without API
function getSmartRecommendations(type, area, location, budget, totalCost) {
  let recommendations = '📊 Smart Recommendations:\n\n';
  
  // Cost optimization
  recommendations += '💰 Cost Optimization:\n';
  if(totalCost > budget) {
    recommendations += '• Design value engineering: 10-15% savings\n';
    recommendations += '• Local materials sourcing\n';
    recommendations += '• Consider phased construction\n';
  } else {
    const savings = budget - totalCost;
    recommendations += `• ₹${Math.round(savings).toLocaleString()} available buffer\n`;
    recommendations += '• Allocate for quality upgrades\n';
    recommendations += '• 5-8% contingency reserve\n';
  }
  
  // Timeline tips
  recommendations += '\n⏱️ Timeline Optimization:\n';
  if(type === 'residential') {
    recommendations += '• Modular construction: 20% time reduction\n';
    recommendations += '• Parallel block construction\n';
  } else if(type === 'commercial') {
    recommendations += '• Prefabrication strategy: 15% faster\n';
    recommendations += '• Fast-track scheduling\n';
  } else {
    recommendations += '• Equipment parallelization key\n';
    recommendations += '• Site logistics optimization\n';
  }
  
  // Risk mitigation  
  recommendations += '\n🛡️ Risk Management:\n';
  if(location === 'urban') {
    recommendations += '• Space constraint planning\n';
    recommendations += '• Traffic & safety control\n';
    recommendations += '• Environmental compliance\n';
  } else {
    recommendations += '• Supply chain logistics\n';
    recommendations += '• Weather contingency (10-15%)\n';
    recommendations += '• Remote site accessibility\n';
  }
  
  return recommendations;
}

// Function to call Google Gemini AI API
async function getAIInsights(type, area, location, budget, totalCost) {
  const prompt = `You are an expert AI construction planning consultant specializing in Indian construction projects.

Project Details:
- Type: ${type}
- Area: ${area} sq ft
- Location: ${location}
- Budget: ₹${Math.round(budget).toLocaleString()}
- Estimated Cost: ₹${Math.round(totalCost).toLocaleString()}
- Budget Status: ${totalCost > budget ? 'EXCEEDS budget' : 'WITHIN budget'}

Provide 4 specific, actionable optimization recommendations:
1. Cost Optimization Strategy
2. Timeline & Efficiency Tips
3. Risk Mitigation Approach
4. Quality & Compliance Points

Format: Use bullet points. Keep each point practical and specific.`;

  try {
    console.log('Sending request to Gemini API...');
    console.log('Model:', GEMINI_MODEL);
    console.log('API Key present:', !!GEMINI_API_KEY);
    
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    console.log('Endpoint:', endpoint.replace(GEMINI_API_KEY, 'KEY_HIDDEN'));
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();
    console.log('API Response status:', response.ok, response.status);
    console.log('API Response data:', data);

    // Check for API errors in response
    if(data.error) {
      throw new Error(`API Error: ${data.error.message || data.error.code} (Status: ${response.status})`);
    }

    if(!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${data.error?.message || 'Unknown error'}`);
    }

    if(!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid API response format - no candidates returned');
    }

    const aiText = data.candidates[0].content.parts[0].text;
    return '🤖 AI-Powered Recommendations:\n\n' + aiText;
  } catch(error) {
    console.error('AI API Error:', error.message);
    throw error;
  }
}



form.addEventListener('submit', async function(e){
  e.preventDefault();

  // Get form values
  const typeEl = document.getElementById('type');
  const areaEl = document.getElementById('area');
  const locationEl = document.getElementById('location');
  const budgetEl = document.getElementById('budget');

  const type = typeEl.value.toLowerCase();
  const area = parseFloat(areaEl.value);
  const location = locationEl.value.toLowerCase();
  const budget = parseFloat(budgetEl.value);

  // Optional schedule inputs
  const startDateEl = document.getElementById('startDate');
  const workdaysEl = document.getElementById('workdays');
  const weatherBufferEl = document.getElementById('weatherBuffer');

  const startDateValue = startDateEl && startDateEl.value ? new Date(startDateEl.value) : null;
  const workdaysPerWeekInput = workdaysEl ? parseInt(workdaysEl.value, 10) : 6;
  const weatherBufferPct = weatherBufferEl ? Math.max(0, Math.min(50, parseFloat(weatherBufferEl.value || '12'))) : 12;

  if(!type || !area || !location || !budget){
    alert('Please fill all fields');
    return;
  }

  // ===== COST ESTIMATION MODEL =====
  let baseRate = 1900; // Residential baseline
  if(type === 'commercial') baseRate = 2700;
  if(type === 'industrial') baseRate = 2300;

  const locationFactor = location === 'urban' ? 1.18 : 0.95;
  const rate = baseRate * locationFactor;

  const materialCost = area * rate * 0.50;
  const laborCost = area * rate * 0.35;
  const equipmentCost = area * rate * 0.15;
  const contingency = area * rate * 0.08;
  const totalCost = materialCost + laborCost + equipmentCost + contingency;

  // ===== DISPLAY COST ESTIMATION =====
  function sanitizeOutput(text){
    if(typeof text !== 'string') return text;
    // replace tabs, trim each line's leading/trailing spaces but keep meaningful newlines
    return text.replace(/\t/g,'    ').split('\n').map(l => l.replace(/^\s+|\s+$/g,'')).join('\n');
  }

  document.getElementById('outCost').textContent = sanitizeOutput(
`Rate: ₹${Math.round(rate)}/sq ft
Material (50%): ₹${Math.round(materialCost).toLocaleString()}
Labor (35%): ₹${Math.round(laborCost).toLocaleString()}
Equipment (15%): ₹${Math.round(equipmentCost).toLocaleString()}
Contingency: ₹${Math.round(contingency).toLocaleString()}
━━━━━━━━━━━━━━━━━
TOTAL COST: ₹${Math.round(totalCost).toLocaleString()}`
  );

  // ===== RESOURCE PLANNING (refactored for reactive updates) =====
  function computeResourcePlan({ area, weatherBufferPct }){
    const engineers = Math.max(1, Math.ceil(area / 4000));
    const supervisors = Math.max(1, Math.ceil(area / 6000));
    const skilledWorkers = Math.ceil(area / 120);
    const helpers = Math.ceil(skilledWorkers * 0.6);

    // simple equipment suggestion based on area
    const equipment = [];
    if(area > 3000) equipment.push('Tower crane');
    equipment.push('Concrete mixers', 'Scaffolding', 'Power tools');

    // add a safety/availability factor reduced by buffer
    const availabilityFactor = Math.max(0.5, 1 - (weatherBufferPct || 0) / 100);
    const peakOnsite = Math.max(1, Math.round((skilledWorkers + helpers + engineers + supervisors) * availabilityFactor));

    return {
      engineers, supervisors, skilledWorkers, helpers, equipment, peakOnsite
    };
  }

  // More accurate per-phase worker needs (converts crew to individual workers)
  function computeDetailedWorkers(area, efficiencyFactor, workdaysPerWeek, productivity){
    // default average crew sizes (workers per crew)
    const crewSizes = { foundation:6, structure:8, mep:5, finishing:5 };

    // baseline: compute minimal working days for a single crew
    const daysSingleCrew = {
      foundation: Math.max(1, Math.ceil(area / (productivity.foundation * 1))),
      structure: Math.max(1, Math.ceil(area / (productivity.structure * 1))),
      mep: Math.max(1, Math.ceil(area / (productivity.mep * 1))),
      finishing: Math.max(1, Math.ceil(area / (productivity.finishing * 1)))
    };

    // Use efficiencyFactor to scale required crew counts to meet working-day expectations.
    // We'll compute required crews to finish each phase in the estimated working days (derived from area and nominal crews earlier)
    function requiredCrewsForPhase(areaSqFt, prodPerCrewPerDay, desiredWorkingDays){
      const dailyOutputPerCrew = prodPerCrewPerDay * efficiencyFactor;
      if(dailyOutputPerCrew <= 0) return 1;
      return Math.max(1, Math.ceil(areaSqFt / (dailyOutputPerCrew * desiredWorkingDays)));
    }

    return function build(areaSqFt, desiredWorkingDaysPerPhase){
      const foundationCrews = requiredCrewsForPhase(areaSqFt, productivity.foundation, desiredWorkingDaysPerPhase.foundation);
      const structureCrews = requiredCrewsForPhase(areaSqFt, productivity.structure, desiredWorkingDaysPerPhase.structure);
      const mepCrews = requiredCrewsForPhase(areaSqFt, productivity.mep, desiredWorkingDaysPerPhase.mep);
      const finishingCrews = requiredCrewsForPhase(areaSqFt, productivity.finishing, desiredWorkingDaysPerPhase.finishing);

      const foundationWorkers = foundationCrews * crewSizes.foundation;
      const structureWorkers = structureCrews * crewSizes.structure;
      const mepWorkers = mepCrews * crewSizes.mep;
      const finishingWorkers = finishingCrews * crewSizes.finishing;

      const peakWorkers = Math.max(foundationWorkers, structureWorkers, mepWorkers, finishingWorkers);

      return {
        crews: { foundation: foundationCrews, structure: structureCrews, mep: mepCrews, finishing: finishingCrews },
        workers: { foundation: foundationWorkers, structure: structureWorkers, mep: mepWorkers, finishing: finishingWorkers },
        peakWorkers
      };
    };
  }

  function renderResourcePlan(plan){
    const el = document.getElementById('outResources');
    const rawLines = [];
    rawLines.push(`Engineers: ${plan.engineers}`);
    rawLines.push(`Supervisors: ${plan.supervisors}`);
    rawLines.push(`Skilled Workers (total est): ${plan.skilledWorkers}`);
    rawLines.push(`Support Staff: ${plan.helpers}`);
    if(plan.crews){
      rawLines.push('\nPer-phase crews:');
      rawLines.push(`- Foundation crews: ${plan.crews.foundation} (≈ ${plan.workers.foundation} workers)`);
      rawLines.push(`- Structure crews: ${plan.crews.structure} (≈ ${plan.workers.structure} workers)`);
      rawLines.push(`- MEP crews: ${plan.crews.mep} (≈ ${plan.workers.mep} workers)`);
      rawLines.push(`- Finishing crews: ${plan.crews.finishing} (≈ ${plan.workers.finishing} workers)`);
      rawLines.push(`Peak workforce required (approx): ${plan.peakWorkers}`);
    } else {
      rawLines.push(`Peak on-site (est): ${plan.peakOnsite}`);
    }
    rawLines.push(`Equipment: ${plan.equipment.join(', ')}`);

    el.textContent = sanitizeOutput(rawLines.join('\n'));
  }

  // Live preview when inputs change
  function readFormInputs(){
    const areaVal = parseFloat(document.getElementById('area').value || '0');
    const weatherBufferVal = parseFloat(document.getElementById('weatherBuffer').value || '12');
    return { area: Math.max(0, areaVal), weatherBufferPct: Math.max(0, Math.min(50, weatherBufferVal)) };
  }

  function updateResourcePreview(){
    const inputs = readFormInputs();
    const plan = computeResourcePlan({ area: inputs.area, weatherBufferPct: inputs.weatherBufferPct });
    renderResourcePlan(plan);
  }

  // Attach reactive listeners to key inputs so output updates automatically
  ['area','weatherBuffer'].forEach(id => {
    const node = document.getElementById(id);
    if(node) node.addEventListener('input', updateResourcePreview);
  });

  // initialize preview on load
  updateResourcePreview();

  // compute resource plan for schedule calculations
  const resourcePlan = computeResourcePlan({ area, weatherBufferPct });
  renderResourcePlan(resourcePlan);
  const { skilledWorkers, helpers, engineers, supervisors } = resourcePlan;

  // ===== SCHEDULE PLANNING (Productivity-based, date-accurate) =====
  // Empirical productivity (sq ft per crew per day) - adjustable
  const productivity = {
    foundation: 120, // sq ft / crew / day
    structure: 45,
    mep: 90,
    finishing: 65
  };

  // Assign crews (fraction of skilledWorkers)
  const foundationCrew = Math.max(4, Math.round(skilledWorkers * 0.22));
  const structureCrew = Math.max(6, Math.round(skilledWorkers * 0.46));
  const mepCrew = Math.max(4, Math.round(skilledWorkers * 0.18));
  const finishingCrew = Math.max(3, Math.round(skilledWorkers * 0.14));

  // Workdays per week and working efficiency adjustments (use inputs)
  const workdaysPerWeek = workdaysPerWeekInput || 6;
  const baseEfficiency = 0.90; // baseline productivity factor
  const efficiencyFactor = Math.max(0.6, baseEfficiency * (1 - (weatherBufferPct / 100))); // reduce efficiency by buffer

  // Helper to compute days required for a phase
  function daysForPhase(areaSqFt, crewCount, prodPerCrewPerDay) {
    const dailyOutput = crewCount * prodPerCrewPerDay * efficiencyFactor;
    return Math.max(1, Math.ceil(areaSqFt / dailyOutput));
  }

  const foundationDays = daysForPhase(area, foundationCrew, productivity.foundation);
  const structureDays = daysForPhase(area, structureCrew, productivity.structure);
  const mepDays = daysForPhase(area, mepCrew, productivity.mep);
  const finishingDays = daysForPhase(area, finishingCrew, productivity.finishing);

  // Convert days to months (approx) and weeks
  const daysToWeeks = (d) => Math.ceil(d / workdaysPerWeek);
  const daysToMonths = (d) => (d / (workdaysPerWeek * 4)).toFixed(1);

  // Calendar helpers
  function addDays(date, days) {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }
  function fmt(date) {
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // planningMonths derived from project size
  const planningMonths = Math.max(1, Math.ceil(area / 5000));
  const start = startDateValue || new Date();
  // approximate planning days based on months and buffer
  const planningDaysWorking = Math.max(5, Math.ceil(planningMonths * 20 * (1 + weatherBufferPct / 100)));
  const planningDays = Math.ceil(planningDaysWorking * (7 / workdaysPerWeek));
  const planningEnd = addDays(start, planningDays);

  const fStart = planningEnd;
  const foundationCalendarDays = Math.ceil(foundationDays * (7 / workdaysPerWeek));
  const fEnd = addDays(fStart, foundationCalendarDays);
  const sStart = fEnd;
  const structureCalendarDays = Math.ceil(structureDays * (7 / workdaysPerWeek));
  const sEnd = addDays(sStart, structureCalendarDays);
  const mStart = sEnd;
  const mepCalendarDays = Math.ceil(mepDays * (7 / workdaysPerWeek));
  const mEnd = addDays(mStart, mepCalendarDays);
  const finStart = mEnd;
  const finishingCalendarDays = Math.ceil(finishingDays * (7 / workdaysPerWeek));
  const finEnd = addDays(finStart, finishingCalendarDays);

  const totalDays = planningDays + foundationCalendarDays + structureCalendarDays + mepCalendarDays + finishingCalendarDays;

  const scheduleText = `Project start: ${fmt(start)}\nPlanning: ${planningDays} calendar days (approx, ends ${fmt(planningEnd)})\n\nConstruction phases:\n- Foundation: ${foundationDays} working days (~${foundationCalendarDays} calendar days / ${daysToWeeks(foundationCalendarDays)} wk), Crew: ${foundationCrew} (${productivity.foundation} sq ft/crew/day), ends ${fmt(fEnd)}\n- Structure: ${structureDays} working days (~${structureCalendarDays} calendar days / ${daysToWeeks(structureCalendarDays)} wk), Crew: ${structureCrew} (${productivity.structure} sq ft/crew/day), ends ${fmt(sEnd)}\n- MEP & Services: ${mepDays} working days (~${mepCalendarDays} calendar days / ${daysToWeeks(mepCalendarDays)} wk), Crew: ${mepCrew} (${productivity.mep} sq ft/crew/day), ends ${fmt(mEnd)}\n- Finishing: ${finishingDays} working days (~${finishingCalendarDays} calendar days / ${daysToWeeks(finishingCalendarDays)} wk), Crew: ${finishingCrew} (${productivity.finishing} sq ft/crew/day), ends ${fmt(finEnd)}\n\nTotal estimated time: ${totalDays} calendar days (~${Math.ceil(totalDays/30)} months)\n\nKey milestones:\n- Planning complete: ${fmt(planningEnd)}\n- Foundation complete: ${fmt(fEnd)}\n- Structure topped out: ${fmt(sEnd)}\n- MEP complete: ${fmt(mEnd)}\n- Handover: ${fmt(finEnd)}\n\nCrew guidance:\n- Total skilled workers estimated: ${skilledWorkers}\n- Recommended peak on-site skilled workers: ${Math.max(structureCrew, foundationCrew, mepCrew, finishingCrew)}\n\nSchedule notes:\n- Efficiency factor used: ${Math.round(efficiencyFactor*100)}% (after applying weather/delay buffer)\n- Consider prefabrication of MEP/finishes to reduce finishing by 15-30%\n- Overlap procurement during planning to shorten start-of-construction by up to 25%`;

  document.getElementById('outSchedule').textContent = sanitizeOutput(scheduleText);

  // store latest plan data for interactive charts
  // compute more accurate worker needs per phase
  const detailedBuilder = computeDetailedWorkers(area, efficiencyFactor, workdaysPerWeek, productivity);
  const desiredWorkingDaysPerPhase = { foundation: foundationDays, structure: structureDays, mep: mepDays, finishing: finishingDays };
  const detailed = detailedBuilder(area, desiredWorkingDaysPerPhase);

  latestPlan = {
    costBreakdown: {
      material: Math.round(materialCost),
      labor: Math.round(laborCost),
      equipment: Math.round(equipmentCost),
      contingency: Math.round(contingency)
    },
    totalCost: Math.round(totalCost),
    budget: Math.round(budget),
    resources: {
      engineers, supervisors, skilledWorkers, helpers, peakOnsite: resourcePlan.peakOnsite,
      crews: detailed.crews, workers: detailed.workers, peakWorkers: detailed.peakWorkers
    },
    schedule: {
      foundationDays, structureDays, mepDays, finishingDays,
      foundationCalendarDays, structureCalendarDays, mepCalendarDays, finishingCalendarDays,
      totalDays
    },
    meta: {
      area, start: start ? fmt(start) : null, workdaysPerWeek, weatherBufferPct
    }
  };

  // ===== PROJECT OPTIMIZATION (AI-powered) =====
  const optimizationEl = document.getElementById('outOptimization');
  optimizationEl.textContent = '🤖 AI-Powered Analysis (Loading)...';

  // Show results immediately, then fetch AI insights asynchronously
  document.getElementById('results').style.display = 'block';
  const resultCards = document.querySelectorAll('.result-card');
  resultCards.forEach((card, i) => {
    setTimeout(() => card.classList.add('show'), i * 100);
  });

  // Fetch AI insights asynchronously (non-blocking)
  (async () => {
    try {
      if(GEMINI_API_KEY && GEMINI_API_KEY !== 'AIzaSyDVBo5J_QRG8boC8w9CWuobbOvjBGTvh9E') {
        console.log('Fetching AI insights...');
        const aiResponse = await getAIInsights(type, area, location, budget, totalCost);
        optimizationEl.textContent = sanitizeOutput(aiResponse);
        console.log('AI insights loaded successfully');
      } else {
        throw new Error('API key not configured - please add your Gemini API key to script.js');
      }
    } catch(error) {
      console.error('AI integration error:', error);
      console.error('Full error:', error.toString());
      let fallback = getSmartRecommendations(type, area, location, budget, totalCost);
      optimizationEl.textContent = sanitizeOutput(fallback);
    }
  })();
});

// ===== ANIMATIONS =====
const observer = new IntersectionObserver((entries)=>{
  entries.forEach((entry, i)=>{
    if(entry.isIntersecting){
      setTimeout(()=> entry.target.classList.add('show'), i * 120);
    }
  });
},{threshold: 0.2});

document.querySelectorAll('.result-card').forEach(card => observer.observe(card));

// ===== DARK/LIGHT MODE TOGGLE =====
const toggleBtn = document.getElementById('modeToggle');
toggleBtn.onclick = () => {
  document.body.classList.toggle('light');
  toggleBtn.textContent = document.body.classList.contains('light') ? '☀ Light' : '🌙 Dark';
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
};

// Load saved theme
if(localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light');
  toggleBtn.textContent = '☀ Light';
}

// Chart generation helpers for click-to-show charts
function buildCostConfig(){
  const cb = latestPlan && latestPlan.costBreakdown;
  if(!cb) return null;
  return {
    type: 'doughnut',
    data: {
      labels: ['Material','Labor','Equipment','Contingency'],
      datasets: [{
        data: [cb.material, cb.labor, cb.equipment, cb.contingency],
        backgroundColor: ['#34d399','#22d3ee','#a78bfa','#f59e0b']
      }]
    },
    options: { responsive:true, maintainAspectRatio:false }
  };
}

function buildResourcesConfig(){
  const r = latestPlan && latestPlan.resources;
  if(!r) return null;
  return {
    type: 'bar',
    data: {
      labels: ['Engineers','Supervisors','Skilled Workers','Support Staff','Peak On-site'],
      datasets: [{ label: 'Count', data: [r.engineers, r.supervisors, r.skilledWorkers, r.helpers, r.peakOnsite], backgroundColor: '#22d3ee' }]
    },
    options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true } } }
  };
}

function buildScheduleConfig(){
  const s = latestPlan && latestPlan.schedule;
  if(!s) return null;
  return {
    type: 'bar',
    data: {
      labels: ['Foundation','Structure','MEP','Finishing'],
      datasets: [{ label: 'Working days', data: [s.foundationDays, s.structureDays, s.mepDays, s.finishingDays], backgroundColor: ['#34d399','#22d3ee','#a78bfa','#f59e0b'] }]
    },
    options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true } } }
  };
}

function buildOptimizationConfig(){
  if(!latestPlan) return null;
  return {
    type: 'bar',
    data: {
      labels: ['Budget','Estimated Cost'],
      datasets: [{ label: '₹', data: [latestPlan.budget, latestPlan.totalCost], backgroundColor: ['#34d399','#f43f5e'] }]
    },
    options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true } }, plugins:{ legend:{ display:false } } }
  };
}

// Toggle charts on card click
document.querySelectorAll('.result-card').forEach(card => {
  card.addEventListener('click', () => {
    const key = card.dataset.key;
    const map = { cost: 'costChart', resources: 'resourcesChart', schedule: 'scheduleChart', optimization: 'optimizationChart' };
    const canvasId = map[key];
    const canvas = document.getElementById(canvasId);
    if(!canvas) return;

    // show message if no plan generated yet
    if(!latestPlan){
      alert('Generate a plan first to view charts.');
      return;
    }

    const isHidden = canvas.style.display === 'none' || canvas.style.display === '';
    if(!isHidden){
      // hide and destroy chart
      canvas.style.display = 'none';
      if(chartInstances[canvasId]){ chartInstances[canvasId].destroy(); delete chartInstances[canvasId]; }
      return;
    }

    // build appropriate config
    let config = null;
    if(key === 'cost') config = buildCostConfig();
    if(key === 'resources') config = buildResourcesConfig();
    if(key === 'schedule') config = buildScheduleConfig();
    if(key === 'optimization') config = buildOptimizationConfig();

    if(config) createOrUpdateChart(canvasId, config);
  });
});
