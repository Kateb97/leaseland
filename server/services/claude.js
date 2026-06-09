// LeaseLand - Anthropic Claude AI Service
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
    // Return mock analysis when no API key is configured
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

async function askAssistant(userId, message, country, state, conversationId) {
  const client = getClient();
  const stateRules = getStateRules(country, state);
  
  if (!stateRules) {
    return { error: `Unknown state: ${state}` };
  }

  if (!client) {
    return mockAssistantResponse(message, stateRules);
  }

  try {
    // Load conversation history
    let history = '';
    if (conversationId) {
      const { getDb } = require('../db');
      const db = getDb();
      const conv = db.prepare('SELECT messages FROM assistant_conversations WHERE id = ? AND user_id = ?').get(conversationId, userId);
      if (conv) {
        const msgs = JSON.parse(conv.messages);
        history = msgs.map(m => `${m.role}: ${m.content}`).join('\n');
      }
    }

    const prompt = buildAssistantPrompt(message, state, stateRules, history);
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

// Mock responses for development/demo without Claude API key
function mockLeaseCheck(leaseText, stateRules) {
  const redFlags = [];
  const yellowFlags = [];
  const goodClauses = [];

  const textLower = leaseText.toLowerCase();

  // Check for common issues
  if (textLower.includes('no pets') || textLower.includes('no pet')) {
    redFlags.push('"No pets" clause may be unenforceable - tenants have the right to request pets and landlords cannot unreasonably refuse.');
  }
  if (textLower.includes('professional clean') || textLower.includes('professionally cleaned')) {
    yellowFlags.push('Requiring "professional cleaning" at end of lease may be excessive - the property only needs to be "reasonably clean" (fair wear and tear excepted).');
  }
  if (textLower.includes('no guests') || textLower.includes('no visitors') || textLower.includes('no overnight')) {
    redFlags.push('Clause restricting guests/visitors likely infringes on tenant\'s right to quiet enjoyment of the property.');
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
    goodClauses.push('The lease appears to use standard terms. However, always read your specific state\'s residential tenancy authority resources.');
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

> Need more help? Ask our Tenancy Assistant! Just type your question below.

${DISCLAIMER}`,
    state: stateRules.state,
  };
}

function mockAssistantResponse(message, stateRules) {
  const msg = message.toLowerCase();

  let answer = '';

  if (msg.includes('bond')) {
    answer = `## 💰 Bond Information for ${stateRules.state}

**Maximum bond amount:** ${stateRules.bonds.maxAmount}
**Authority:** ${stateRules.bonds.authority}
**Lodging deadline:** ${stateRules.bonds.lodgingDeadline}

Your landlord MUST lodge your bond with the state authority within the required timeframe. If they don't, you can take action through ${stateRules.resources.tribunal} or ${stateRules.resources.tenancyUnion}.

**Getting your bond back:**
1. Submit a condition report with photos on move-in
2. Leave the property reasonably clean (not necessarily professionally cleaned)
3. Make sure the final inspection happens with you present
4. You and the landlord sign the bond claim form

If there's a dispute, it goes to ${stateRules.resources.tribunal}.`;
  } else if (msg.includes('repair') || msg.includes('maintenance')) {
    answer = `## 🔧 Repairs & Maintenance in ${stateRules.state}

**Urgent repairs** (landlord must fix immediately):\n${stateRules.repairs.urgent}

**Your rights for urgent repairs:** ${stateRules.repairs.urgentTenantRights}

**Non-urgent repairs:** ${stateRules.repairs.nonUrgent}

**Steps to take:**
1. Notify the landlord/agent in WRITING (email is fine - keep a record)
2. Give them reasonable time to respond (14 days for non-urgent)
3. If no action, escalate to ${stateRules.resources.tribunal}

**Important:** Never stop paying rent to force repairs — this could backfire legally.`;
  } else if (msg.includes('break') || msg.includes('end lease') || msg.includes('terminate') || msg.includes('notice')) {
    answer = `## 📅 Ending Your Lease in ${stateRules.state}

**Periodic lease (month-to-month) — notice by tenant:** ${stateRules.leaseTermination.noticeByTenantPeriodic}
**Periodic lease — notice by landlord:** ${stateRules.leaseTermination.noticeByLandlordPeriodic}

**Breaking a fixed-term lease:** ${stateRules.leaseTermination.breakingLeaseFees}

**Tips:**
- Give proper written notice
- Take photos of the property condition when you leave
- Request a final inspection and attend it
- Submit your bond claim promptly after the inspection`;
  } else if (msg.includes('inspect') || msg.includes('entry')) {
    answer = `## 🔍 Routine Inspections in ${stateRules.state}

**Frequency:** ${stateRules.inspections.frequency}
**Notice period:** ${stateRules.inspections.noticePeriod}
**Entry times:** ${stateRules.inspections.entryTimes}

**Your rights:**
- You don't need to have the property "perfect" — normal living mess is fine
- You can be present during the inspection
- The landlord cannot enter without proper notice (except in emergencies)
- You can request to reschedule for a reasonable reason`;
  } else if (msg.includes('pet') || msg.includes('dog') || msg.includes('cat')) {
    answer = `## 🐾 Pets in Rental Properties - ${stateRules.state}

**Rules:** ${stateRules.pets.rules}
**Extra bond:** ${stateRules.bondAddition || 'No additional pet bond may be charged'}

**What to do:**
1. Ask the landlord/agent in writing (email is fine)
2. Offer to provide references or a pet resume
3. If refused without reasonable grounds, contact ${stateRules.resources.tenancyUnion}`;
  } else if (msg.includes('condition report') || msg.includes('move in')) {
    answer = `## 📋 Condition Reports in ${stateRules.state}

**What should happen:** ${stateRules.conditionReports.requirement}
**Tenant return deadline:** ${stateRules.conditionReports.tenantReturn}

**Why it matters:** The condition report is your main defense against unfair bond claims.

**Pro tips:**
- Take photos and videos on move-in day (timestamped if possible)
- Note every existing scratch, mark, and issue on the report
- Keep a copy of the signed report
- Email photos to yourself with a description for timestamp evidence`;
  } else {
    answer = `## 💬 Tenancy Help for ${stateRules.state}

I can help you with questions about:
- **💰 Bonds** — amounts, lodging, getting it back
- **🔧 Repairs & maintenance** — urgent vs non-urgent
- **📋 Condition reports** — move-in and move-out
- **🔍 Inspections** — notice periods, frequency
- **📅 Breaking a lease / ending tenancy** — notice periods, fees
- **🐾 Pets** — rights and processes
- **📈 Rent increases** — limits and notice
- **⚖️ Disputes** — tribunal, tenancy union

**Which topic would you like to know more about?** Just ask!

For specific legal advice, contact ${stateRules.resources.tenancyUnion} or ${stateRules.resources.tribunal}.`;
  }

  return {
    answer: answer + '\n\n' + DISCLAIMER,
    state: stateRules.state,
  };
}

module.exports = { checkLease, askAssistant, mockLeaseCheck, mockAssistantResponse };