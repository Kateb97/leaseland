// South Australia Residential Tenancies Act 1995 - Key Rules
module.exports = {
  state: 'SA',
  name: 'South Australia',
  rent: {
    maxIncreaseFrequency: 'Every 12 months for periodic agreements',
    increaseNoticePeriod: 'At least 60 days written notice for periodic agreements. Limited to once per 12 months.',
    maxBond: '4 weeks rent',
    rentArrearsNoticePeriod: '14 days',
    rentReceiptRequired: 'Must provide free rent receipts if tenant requests',
    excessiveRent: 'Tenant can apply to SA Civil and Administrative Tribunal if rent increase is excessive',
  },
  bonds: {
    authority: 'Consumer and Business Services (CBS) - Rental Tenancies Bond',
    lodgingDeadline: 'Must be lodged with CBS within 28 days of receipt (or within 14 days if residential park)',
    bondReturn: 'Claim within 30 days of tenancy end. Dispute resolved by SACAT.',
    maxAmount: '4 weeks rent',
    interest: 'Bond interest paid to tenant annually if bond exceeds $500',
  },
  conditionReports: {
    requirement: 'Landlord must provide 2 copies of condition report within 7 days of tenant moving in',
    tenantReturn: 'Tenant must return signed copy within 7 days (or note disagreements)',
    photos: 'Photos and video evidence strongly encouraged',
    waterMeter: 'If water passed through, condition report should note meter reading',
  },
  repairs: {
    urgent: 'Burst water pipe, blocked toilet (only one in property), serious roof leak, gas leak, dangerous electrical fault, flooding, failure of hot water system, failure of stove/oven, failure of heating in winter, failure of cooling in extreme heat, broken external door lock, window broken creating safety risk',
    urgentTenantRights: 'Tenant can arrange urgent repairs up to $1,500 and be reimbursed within 7 days',
    nonUrgent: 'Landlord must respond within 14 days after receiving written notice',
    emergency: 'If tenant arranges emergency repair, they must attempt to notify landlord/agent and provide written details within 3 days',
  },
  leaseTermination: {
    noticeByTenantPeriodic: '28 days (4 weeks) notice (14 days if relocating due to hardship)',
    noticeByTenantFixed: 'Breaking lease - tenant liable for reasonable costs, capped at 1-6 weeks rent depending on term remaining',
    noticeByLandlordPeriodic: '90 days notice (60 days if selling, 28 days for breach)',
    noticeByLandlordFixed: 'Valid grounds only: breach, sale with vacant possession, demolition, renovation, landlord/family moving in',
    breakingLeaseFees: 'Less than 1 year remaining: 4 weeks rent. More than 1 year: 6 weeks rent. If new tenant found sooner, only pay up to when they move in.',
  },
  inspections: {
    frequency: 'Maximum 4 routine inspections per year',
    noticePeriod: 'At least 7 days written notice (at least 24 hours for specific purposes)',
    entryTimes: 'Between 8am and 8pm, not on Sundays or public holidays unless agreed',
    entryByLandlord: 'Landlord cannot enter without proper notice except in emergency',
  },
  pets: {
    rules: 'Landlord consent required. Can only refuse on reasonable grounds such as property unsuitability or potential damage.',
    bondAddition: 'No additional bond for pets',
    assistanceAnimals: 'Cannot refuse assistance animals',
  },
  discrimination: {
    rules: 'Equal Opportunity Act 1984 prohibits discrimination based on race, gender, sexuality, age, disability, marital status, family responsibilities, pregnancy, religious belief, political belief.',
  },
  minimumStandards: {
    overview: 'Properties must be fit for habitation and meet minimum standards:',
    structural: 'Sound and weatherproof',
    services: 'Connected to mains water, electricity and sewerage (or appropriate alternative)',
    safety: 'Functioning smoke alarms (hardwired or 10-year battery), RCD safety switches',
    kitchen: 'Working stove and oven',
    security: 'Functioning locks on all external doors and windows',
    vermin: 'Property must be free from vermin at start of tenancy',
  },
  resources: {
    tribunal: 'South Australian Civil and Administrative Tribunal (SACAT)',
    tenancyUnion: "Tenants' Union of South Australia",
    consumerBusiness: 'Consumer and Business Services (SA Government)',
  },
  commonIssues: [
    'Tenants can install NBN/internet connection but must not cause damage',
    'Water bills can only be passed to tenant if property has water efficiency measures and separate meter',
    'Rent bidding is not permitted - agents cannot solicit higher offers',
    'End of tenancy - carpets must be professionally cleaned only if specified in lease agreement',
    'Retaliatory eviction for making complaints is prohibited - tenant can challenge notice at SACAT',
  ],
};