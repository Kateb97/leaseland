// Victorian Residential Tenancies Act 1997 - Key Rules
module.exports = {
  state: 'VIC',
  name: 'Victoria',
  rent: {
    maxIncreaseFrequency: 'Every 12 months',
    increaseNoticePeriod: 'At least 60 days written notice (for periodic agreements)',
    maxBond: '4 weeks rent (if rent <= $900/week). Max 6 weeks if rent > $900/week',
    rentArrearsNoticePeriod: '14 days',
    rentReceiptRequired: 'Must be provided if tenant requests',
    rentIncreaseLimits: 'No more than once every 12 months. Cannot increase to an excessive amount.',
  },
  bonds: {
    authority: 'Residential Tenancies Bond Authority (RTBA)',
    lodgingDeadline: 'Landlord must lodge bond with RTBA within 10 business days of receipt',
    bondReturn: 'Must be lodged within 10 business days. Claims via RTBA within 30 days of tenancy end.',
    maxAmount: '4 weeks rent for most properties',
    interest: 'Bond does not earn interest in Victoria unless over $2,800',
  },
  conditionReports: {
    requirement: 'Must give 2 copies to tenant before moving in or within 3 business days after',
    tenantReturn: 'Tenant returns signed copy within 5 business days',
    photos: 'Dated photos and signatures recommended for evidence',
  },
  repairs: {
    urgent: 'Urgent repairs: burst pipe, blocked toilet, serious roof leak, gas leak, dangerous electrical fault, flooding, serious storm damage, failure of hot water/gas/electricity, failure of stove/oven, failure of heating in winter (1 May-30 Sep), failure of cooling (check seasonal)',
    urgentTenantRights: 'Tenant can arrange urgent repairs up to $2,500 and be reimbursed within 7 days',
    nonUrgent: 'Landlord must respond within 14 days',
    minimumStandards: 'Property must meet minimum standards: working locks, adequate ventilation, functioning heating in living area, window coverings for privacy, working stove/oven, connected to mains water/sewerage',
  },
  leaseTermination: {
    noticeByTenantPeriodic: '28 days notice',
    noticeByTenantFixed: 'Tenant can end fixed term lease with 28 days notice (may be liable for costs)',
    noticeByLandlordPeriodic: '90 days notice (no specific reason needed - subject to changes under rental reforms)',
    noticeByLandlordFixed: 'Landlord needs valid grounds (sale, renovation, demolition, breach)',
    breakingLeaseFees: 'Tenant liable for reasonable costs incurred by landlord to re-let. Landlord must mitigate losses. Reduced to 1-4 weeks depending on how much of lease is left.',
  },
  inspections: {
    frequency: 'Maximum 2 routine inspections in first 12 months, then 1 per year',
    noticePeriod: 'At least 7 days written notice for routine inspections. 24 hours for specific purposes',
    entryTimes: 'Between 8am and 6pm, not on public holidays or weekends unless agreed',
  },
  pets: {
    rules: 'Landlord cannot unreasonably refuse pets. Must apply to VCAT if they want to refuse. Consent must be given or refused within 14 days.',
    bondAddition: 'Landlord may charge an additional pet bond (up to 2 weeks extra rent)',
  },
  discrimination: {
    rules: 'Illegal to discriminate based on gender, race, religion, sexuality, disability, marital status, children, political beliefs, or occupation. Rental providers cannot advertise "no children" or "no pets" without valid reason.',
  },
  minimumStandards: {
    overview: 'Since March 2023, all rental properties must meet minimum standards for: room sizes, heating, cooling, ventilation, window coverings, kitchen facilities, bathroom privacy, electrical safety, gas safety',
    heating: 'Fixed heater in main living area (not portable)',
    cooling: 'Not mandatory but if provided must work',
    windowCoverings: 'All windows need coverings for privacy',
    locks: 'All external doors need functioning deadlocks or key-operated locks',
  },
  resources: {
    tribunal: 'Victorian Civil and Administrative Tribunal (VCAT)',
    tenancyUnion: "Tenants Victoria (formerly Tenants Union of Victoria)",
    consumerAffairs: 'Consumer Affairs Victoria',
  },
  commonIssues: [
    'Rental providers cannot blacklist tenants for making legitimate complaints',
    'Mould remediation is landlord responsibility - tenant must notify in writing',
    'Rental providers cannot advertise or offer rental auctions (bidding above asking price)',
    'End of lease cleaning must be "reasonably clean" - not "professional clean" unless specified in agreement',
    'Water charges can only be passed to tenant if property has water efficiency measures',
  ],
};