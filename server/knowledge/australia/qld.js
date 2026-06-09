// Queensland Residential Tenancies and Rooming Accommodation Act 2008 - Key Rules
module.exports = {
  state: 'QLD',
  name: 'Queensland',
  rent: {
    maxIncreaseFrequency: 'Every 12 months for periodic agreements',
    increaseNoticePeriod: 'At least 60 days notice (2 months for periodic agreements)',
    maxBond: '4 weeks rent (if rent < $700/week). If rent >= $700/week, no statutory limit but must be reasonable',
    rentArrearsNoticePeriod: '14 days',
    rentReceiptRequired: 'Must provide receipts within 7 days if tenant requests',
  },
  bonds: {
    authority: 'Residential Tenancies Authority (RTA)',
    lodgingDeadline: 'Must be lodged with RTA within 10 business days of receipt',
    bondReturn: 'Claim made within 15 business days after tenancy ends. Dispute goes to RTA Conciliation or QCAT.',
    maxAmount: '4 weeks rent for most properties',
    interest: 'No interest paid on rental bonds in QLD',
  },
  conditionReports: {
    requirement: 'Landlord must provide condition report at start (before tenant moves in or within 7 days)',
    tenantReturn: 'Tenant should return signed within 7 days with comments on disagreements',
    photos: 'Photographic evidence strongly recommended for both parties',
    exitReport: 'Must be done before final inspection for bond return',
  },
  repairs: {
    urgent: 'Burst water pipe, blocked toilet, serious roof leak, gas leak, dangerous electrical fault, flooding, failure of hot water, failure of stove/oven, failure of air conditioner (if provided), failure of septic system, pest infestation, any fault that makes property unsafe or insecure',
    urgentTenantRights: 'Tenant can arrange urgent repairs up to 4 weeks rent (or $2,000, whichever is less) and be reimbursed within 7 days of providing receipt',
    nonUrgent: 'Landlord must respond within 14 days. If not addressed, tenant can apply to RTA for conciliation.',
    emergency: 'If tenant arranges emergency repairs, they must give landlord/agent opportunity to inspect within 24 hours',
  },
  leaseTermination: {
    noticeByTenantPeriodic: '2 weeks (14 days) notice (28 days if renting as a moveable dwelling)',
    noticeByTenantFixed: 'Tenant can break fixed lease - liable for reasonable re-letting costs + rent until new tenant starts, capped at 4 weeks or 2 weeks depending on how much lease is left',
    noticeByLandlordPeriodic: '2 months (60 days) notice',
    noticeByLandlordFixed: 'Valid grounds only: sale, renovation (major), demolition, breach, owner moving in',
    breakingLeaseFees: 'Reletting fee capped. If less than 3 months of fixed term remains: 1 weeks rent. If more than 3 months: 2 weeks rent. + rent until new tenant found.',
  },
  inspections: {
    frequency: 'Maximum 4 per year (every 3 months)',
    noticePeriod: 'At least 7 days written notice for routine inspections. 24 hours for entry for specific purpose (e.g., showing to prospective tenant)',
    entryTimes: 'Between 8am and 6pm, not on weekends or public holidays unless agreed',
    rentIncreaseAfter: 'Rent cannot be increased within 6 months of last increase or within 12 months for periodic agreements',
  },
  pets: {
    rules: 'Tenants can apply for pets. Landlord must respond within 14 days. Can only refuse if reasonable grounds.',
    bondAddition: 'No extra pet bond allowed',
    refusalGrounds: 'Reasonable grounds for refusal: property unsuitable, would cause damage, would unreasonably affect others',
  },
  discrimination: {
    rules: 'Unlawful to discriminate based on race, age, gender, sexuality, religion, disability, marital status, parental status, or lawful occupation. Advertising cannot include discriminatory language.',
  },
  minimumHousingStandards: {
    overview: 'From Sept 2023, rental properties must meet minimum housing standards:',
    condition: 'Structurally sound, weatherproof and waterproof',
    services: 'Connected to hot and cold water, adequate sewerage, cooking facilities',
    safety: 'Working smoke alarms in required locations, window safety devices for multi-storey',
    security: 'Functioning deadlock on external doors, lockable windows',
    pests: 'Free from vermin, pests and mould (tenant responsibility if caused by lifestyle)',
  },
  resources: {
    tribunal: 'Queensland Civil and Administrative Tribunal (QCAT)',
    tenancyUnion: "Tenants Queensland (formerly Tenants Union of Queensland)",
    rta: 'Residential Tenancies Authority (RTA)',
  },
  commonIssues: [
    'End of tenancy cleaning must be "reasonable" - cannot require professional cleaning unless lease specifies',
    'Rent bidding is illegal - cannot solicit or invite offers above asking rent',
    'Property must be let in "good order and condition" - basic cleanliness and working appliances',
    'Water consumption can be charged to tenant only if property has water efficiency measures and separate meter',
    'Tenants have the right to hang pictures and install shelves (with small holes) - considered "fair wear and tear"',
  ],
};