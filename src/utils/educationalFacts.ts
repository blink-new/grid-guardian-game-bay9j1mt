export interface EducationalFact {
  id: string;
  title: string;
  content: string;
  triggerTime?: number; // Game time in minutes (0-24)
  triggerCondition?: 'surplus' | 'shortage' | 'balanced' | 'mining_active' | 'mining_inactive';
  category: 'renewable' | 'grid' | 'bitcoin' | 'energy' | 'demand_response';
  icon: string;
}

export const EDUCATIONAL_FACTS: EducationalFact[] = [
  {
    id: 'renewable_peak',
    title: 'Solar Power Peak',
    content: 'Solar panels generate the most electricity between 11 AM and 2 PM when the sun is highest. This creates the famous "duck curve" in energy demand!',
    triggerTime: 12,
    category: 'renewable',
    icon: '☀️'
  },
  {
    id: 'demand_response',
    title: 'Demand Response',
    content: 'Bitcoin mining can act as a "flexible load" - turning on when there\'s excess renewable energy and off during peak demand. This helps stabilize the grid!',
    triggerCondition: 'surplus',
    category: 'demand_response',
    icon: '⚡'
  },
  {
    id: 'duck_curve',
    title: 'The Duck Curve',
    content: 'The "duck curve" shows how solar power creates a dip in energy demand during midday, followed by a sharp evening peak when the sun sets.',
    triggerTime: 18,
    category: 'grid',
    icon: '🦆'
  },
  {
    id: 'grid_stability',
    title: 'Grid Frequency',
    content: 'Power grids must maintain a precise frequency (50Hz in Japan). Too much or too little power can cause blackouts affecting millions of people!',
    triggerCondition: 'shortage',
    category: 'grid',
    icon: '📊'
  },
  {
    id: 'bitcoin_energy',
    title: 'Bitcoin Mining Energy',
    content: 'Bitcoin mining uses about 0.5% of global electricity. When powered by renewable energy, it can actually help fund more clean energy projects!',
    triggerCondition: 'mining_active',
    category: 'bitcoin',
    icon: '₿'
  },
  {
    id: 'renewable_storage',
    title: 'Energy Storage Challenge',
    content: 'Storing renewable energy is expensive! Using excess power for useful work like Bitcoin mining can be more efficient than batteries.',
    triggerTime: 13,
    category: 'renewable',
    icon: '🔋'
  },
  {
    id: 'peak_demand',
    title: 'Evening Peak',
    content: 'Energy demand peaks around 6-8 PM when people come home, turn on lights, cook dinner, and use appliances. This is when electricity is most expensive!',
    triggerTime: 19,
    category: 'energy',
    icon: '🏠'
  },
  {
    id: 'renewable_intermittency',
    title: 'Renewable Intermittency',
    content: 'Wind and solar power are "intermittent" - they don\'t produce electricity 24/7. Smart grids need flexible consumers to balance this variability.',
    triggerTime: 6,
    category: 'renewable',
    icon: '🌪️'
  },
  {
    id: 'grid_modernization',
    title: 'Smart Grid Technology',
    content: 'Modern smart grids can automatically adjust power flow and communicate with devices to prevent blackouts and optimize renewable energy use.',
    triggerCondition: 'balanced',
    category: 'grid',
    icon: '🤖'
  },
  {
    id: 'carbon_footprint',
    title: 'Clean Energy Impact',
    content: 'When Bitcoin mining uses excess renewable energy that would otherwise be wasted, it actually has a negative carbon footprint!',
    triggerTime: 14,
    category: 'bitcoin',
    icon: '🌱'
  }
];

export function getTriggeredFacts(
  gameTimeMinutes: number,
  gridStatus: 'surplus' | 'shortage' | 'balanced',
  isMiningActive: boolean,
  shownFactIds: Set<string>
): EducationalFact[] {
  const triggeredFacts: EducationalFact[] = [];

  for (const fact of EDUCATIONAL_FACTS) {
    // Skip if already shown
    if (shownFactIds.has(fact.id)) continue;

    let shouldTrigger = false;

    // Check time-based triggers
    if (fact.triggerTime !== undefined) {
      const timeDiff = Math.abs(gameTimeMinutes - fact.triggerTime);
      if (timeDiff <= 0.5) { // Within 30 minutes of game time
        shouldTrigger = true;
      }
    }

    // Check condition-based triggers
    if (fact.triggerCondition) {
      switch (fact.triggerCondition) {
        case 'surplus':
          shouldTrigger = gridStatus === 'surplus';
          break;
        case 'shortage':
          shouldTrigger = gridStatus === 'shortage';
          break;
        case 'balanced':
          shouldTrigger = gridStatus === 'balanced';
          break;
        case 'mining_active':
          shouldTrigger = isMiningActive;
          break;
        case 'mining_inactive':
          shouldTrigger = !isMiningActive;
          break;
      }
    }

    if (shouldTrigger) {
      triggeredFacts.push(fact);
    }
  }

  return triggeredFacts;
}

export function getRandomFact(excludeIds: Set<string>): EducationalFact | null {
  const availableFacts = EDUCATIONAL_FACTS.filter(fact => !excludeIds.has(fact.id));
  if (availableFacts.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * availableFacts.length);
  return availableFacts[randomIndex];
}