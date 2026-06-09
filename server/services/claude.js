const Anthropic = require('@anthropic-ai/sdk');
const { getStateRules } = require('../knowledge');

const DISCLAIMER = '\n\n---\n*LeaseLand provides general information only — it is not legal advice. Consult a qualified professional for your specific situation.*';

let anthropic;

function getClient() {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
}

function buildLeaseCheckPrompt(leaseText, state, stateRules) {
  return `You are LeaseLand, an AI tenancy assistant for international students renting in Australia.

The user is from **${stateRules.state} - ${stateRules.name}**, Australia.

Below is a lease or rental agreement they want you to review. Analyze it against the ${stateRules.name} tenancy laws (Residential Tenancies Act) and identify:

1. **⚠️ RED FLAGS (Illegal/Unenforceable Clauses)** - Things that violate ${stateRules.name} law
2. **⚠️ YELLOW FLAGS (Worth Negotiating)** - Things that are legal but potentially unfavorable
3. **✅ Good Clauses (Fair/Protective)** - Things that are tenant-friendly
4. **📋 Summary** - Overall assessment

Key laws for ${stateRules.name}:
- Maximum bond: ${stateRules.bonds.maxAmount}
- Rent increase frequency: ${stateRules.rent.maxIncreaseFrequency}
- Rent increase notice: ${stateRules.rent.increaseNoticePeriod}
- Notice for ending periodic lease (tenant): ${stateRules.leaseTermination.noticeByTenantPeriodic}
- Notice for ending lease (landlord periodic): ${stateRules.leaseTermination.noticeByLandlordPeriodic}
- Repairs: ${stateRules.repairs.urgent}
- Tenant urgent repair rights: ${stateRules.repairs.urgentTenantRights}
- Inspection frequency: ${stateRules.inspections.frequency}
- Inspection notice: ${stateRules.inspections.noticePeriod}
- Pets policy: ${stateRules.pets.rules}
- Bond authority: ${stateRules.bonds.authority}
- Bond lodging deadline: ${stateRules.bonds.lodgingDeadline}
- Condition report rules: ${stateRules.conditionReports.requirement}

Common issues in ${stateRules.name}: ${stateRules.commonIssues.join('; ')}

LEASE TEXT:
"""
${leaseText}
"""

Respond in a clear, student-friendly format with emoji headers. Be specific about which clause numbers or sections are problematic.

${DISCLAIMER}`;
}

function buildAssistantPrompt(userMessage, state, stateRules, conversationHistory) {
  return `You are LeaseLand, an AI tenancy assistant for international students renting in Australia.

The user is from **${stateRules.state} - ${stateRules.name}**, Australia.

Answer their question about renting based on the ${stateRules.name} Residential Tenancies Act and regulations.

Key rules for ${stateRules.name}:
- Maximum bond: ${stateRules.bonds.maxAmount}
- Rent increase frequency: ${stateRules.rent.maxIncreaseFrequency}
- Notice for ending periodic lease (tenant): ${stateRules.leaseTermination.noticeByTenantPeriodic}
- Notice for ending lease (landlord periodic): ${stateRules.leaseTermination.noticeByLandlordPeriodic}
- Repairs (urgent): ${stateRules.repairs.urgent}
- Tenant urgent repair rights: ${stateRules.repairs.urgentTenantRights}
- Inspection frequency and notice: ${stateRules.inspections.frequency}, ${stateRules.inspections.noticePeriod}
- Pets: ${stateRules.pets.rules}
- Breaking lease fees: ${stateRules.leaseTermination.breakingLeaseFees}
- Bond rules: lodging deadline ${stateRules.bonds.lodgingDeadline}, max ${stateRules.bonds.maxAmount}
- Condition reports: ${stateRules.conditionReports.requirement}

Common issues: ${stateRules.commonIssues.join('; ')}

Resources: Tribunal - ${stateRules.resources.tribunal}, Tenancy Union - ${stateRules.resources.tenancyUnion}

Previous conversation context (if any):
${conversationHistory || 'No previous messages.'}

User question: "${userMessage}"

Answer in plain, simple English suitable for someone who may not be a native English speaker. Be specific, cite the law where relevant, and include links to official resources when appropriate. Keep answers concise but thorough.

${DISCLAIMER}`;
}

async function checkLease(leaseText, country, state) {
  const client = getClient();
  const stateRules = getStateRules(country, state);

  if (!stateRules) {
    return { error: `Unknown state: ${state}` };
  }

  if (!client) {
    return mockLeaseCheck(leaseText, stateRules);
  }

  try {
    const prompt = buildLeaseCheckPrompt(leaseText, state, stateRules);
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: "You are LeaseLand, a helpful AI assistant specialized in Australian residential tenancy law. Always be accurate, cite relevant laws, and remember your responses are for informational purposes only.",
      messages: [{ role: 'user', content: prompt }],
    });

    return { analysis: response.content[0].text, state: stateRules.state };
  } catch (error) {
    console.error('Claude API error:', error.message);
    return mockLeaseCheck(leaseText, stateRules);
  }
}

async function askAssistant(userId, message, country, state, conversationHistory) {
  const client = getClient();
  const stateRules = getStateRules(country, state);

  if (!stateRules) {
    return { error: `Unknown state: ${state}` };
  }

  if (!client) {
    return mockAssistantResponse(message, stateRules);
  }

  try {
    const prompt = buildAssistantPrompt(message, state, stateRules, conversationHistory);
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: "You are LeaseLand, a helpful AI assistant specialized in Australian residential tenancy law. Always be accurate, cite relevant laws, and remember your responses are for informational purposes only.",
      messages: [{ role: 'user', content: prompt }],
    });

    return { answer: response.content[0].text, state: stateRules.state };
  } catch (error) {
    console.error('Claude API error:', error.message);
    return mockAssistantResponse(message, stateRules);
  }
}

function mockLeaseCheck(leaseText, stateRules) {
  const redFlags = [];
  const yellowFlags = [];
  const goodClauses = [];

  const textLower = leaseText.toLowerCase();

  if (textLower.includes('no pets') || textLower.includes('no pet')) {
    redFlags.push('"No pets" clause may be unenforceable - tenants have the right to request pets and landlords cannot unreasonably refuse.');
  }
  if (textLower.includes('professional clean') || textLower.includes('professionally cleaned')) {
    yellowFlags.push('Requiring "professional cleaning" at end of lease may be excessive - the property only needs to be "reasonably clean".');
  }
  if (textLower.includes('no guests') || textLower.includes('no visitors') || textLower.includes('no overnight')) {
    redFlags.push('Clause restricting guests/visitors likely infringes on tenant\'s right to quiet enjoyment.');
  }
  if (textLower.includes('inspect') && (textLower.includes('24 hours') || textLower.includes('24 hr'))) {
    yellowFlags.push('Inspection notice period appears to be 24 hours - required notice is at least 7 days for routine inspections.');
  }
  if (textLower.includes('bond') && !textLower.includes('lodge')) {
    yellowFlags.push('Make sure the bond is lodged with the state authority within the required timeframe.');
  }
  if (textLower.includes('rent increase') && textLower.includes('3 month')) {
    redFlags.push('Rent increase every 3 months is not allowed. Maximum is once every 12 months.');
  }
  if (textLower.includes('water') && (textLower.includes('tenant') || textLower.includes('renter'))) {
    yellowFlags.push('Water usage charges can only be passed to tenant if property has water efficiency measures and separate metering.');
  }

  if (redFlags.length === 0 && yellowFlags.length === 0) {
    goodClauses.push('The lease appears to use standard terms. Always read your state\'s residential tenancy authority resources.');
  }

  return {
    analysis: `# 🏠 Lease Review for ${stateRules.state} - ${stateRules.name}

${redFlags.length > 0 ? `## ⚠️ Red Flags (Illegal/Unenforceable)\n${redFlags.map(f => `- ${f}`).join('\n')}\n\n` : ''}
${yellowFlags.length > 0 ? `## ⚠️ Yellow Flags (Negotiate)\n${yellowFlags.map(f => `- ${f}`).join('\n')}\n\n` : ''}
${goodClauses.length > 0 ? `## ✅ Looks Good\n${goodClauses.map(f => `- ${f}`).join('\n')}\n\n` : ''}

## 📋 Key Facts for ${stateRules.state}
- **Max Bond:** ${stateRules.bonds.maxAmount}
- **Bond Authority:** ${stateRules.bonds.authority}
- **Rent Increase Notice:** ${stateRules.rent.increaseNoticePeriod}
- **Notice to End Lease (Tenant, Periodic):** ${stateRules.leaseTermination.noticeByTenantPeriodic}
- **Landlord Entry Notice:** ${stateRules.inspections.noticePeriod}
- **Urgent Repairs Limit:** ${stateRules.repairs.urgentTenantRights}

${DISCLAIMER}`,
    state: stateRules.state,
  };
}

function mockAssistantResponse(message, stateRules) {
  const msg = message.toLowerCase();
  let answer = '';

  if (msg.includes('bond')) {
    answer = `## 💰 Bond Information for ${stateRules.state}\n\n**Maximum bond amount:** ${stateRules.bonds.maxAmount}\n**Authority:** ${stateRules.bonds.authority}\n**Lodging deadline:** ${stateRules.bonds.lodgingDeadline}`;
  } else if (msg.includes('repair') || msg.includes('maintenance')) {
    answer = `## 🔧 Repairs & Maintenance in ${stateRules.state}\n\n**Urgent repairs:** ${stateRules.repairs.urgent}\n**Your rights:** ${stateRules.repairs.urgentTenantRights}`;
  } else if (msg.includes('break') || msg.includes('end lease') || msg.includes('terminate') || msg.includes('notice')) {
    answer = `## 📅 Ending Your Lease in ${stateRules.state}\n\n**Notice by tenant (periodic):** ${stateRules.leaseTermination.noticeByTenantPeriodic}\n**Breaking fixed-term:** ${stateRules.leaseTermination.breakingLeaseFees}`;
  } else if (msg.includes('inspect') || msg.includes('entry')) {
    answer = `## 🔍 Inspections in ${stateRules.state}\n\n**Frequency:** ${stateRules.inspections.frequency}\n**Notice:** ${stateRules.inspections.noticePeriod}`;
  } else if (msg.includes('pet')) {
    answer = `## 🐾 Pets in ${stateRules.state}\n\n**Rules:** ${stateRules.pets.rules}`;
  } else {
    answer = `## 💬 Tenancy Help for ${stateRules.state}\n\nI can help with bonds, repairs, inspections, ending a lease, pets, and more. What would you like to know?`;
  }

  return {
    answer: answer + '\n\n' + DISCLAIMER,
    state: stateRules.state,
  };
}

module.exports = { checkLease, askAssistant, mockLeaseCheck, mockAssistantResponse };
