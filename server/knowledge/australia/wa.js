// Western Australia Residential Tenancies Act 1987 & Regulations - Key Rules
module.exports = {
  state: 'WA',
  name: 'Western Australia',
  rent: {
    maxIncreaseFrequency: 'No limit on frequency for periodic agreements (but must be reasonable, 30 days notice for fixed term)',
    increaseNoticePeriod: 'At least 60 days written notice for periodic agreements. Fixed term: must be specified in lease and not more than once per 6 months',
    maxBond: '4 weeks rent',
    rentArrearsNoticePeriod: '14 days',
    rentReceiptRequired: 'Must provide free receipt within 7 days if tenant requests',
  },
  bonds: {
    authority: 'Bond Administrator (Department of Mines, Industry Regulation and Safety) via BondOnline',
    lodgingDeadline: 'Must be lodged with Bond Administrator within 14 days of receipt',
    bondReturn: 'Claim made via BondOnline. If disputed, matter goes to Magistrates Court or SAT.',
    maxAmount: '4 weeks rent',
    interest: 'No interest paid on rental bonds in WA',
  },
  conditionReports: {
    requirement: 'Landlord must provide condition report at start of tenancy (within 7 days before or after possession)',
    tenantReturn: 'Tenant has 7 days to return signed copy with comments',
    photos: 'Photographic evidence strongly recommended for dispute prevention',
    propertyConditionReports: 'New PCR forms introduced under recent reforms',
  },
  repairs: {
    urgent: 'Burst water pipe, blocked or broken toilet, serious roof leak, gas leak, dangerous electrical fault, flooding, failure of hot water system, failure of stove/oven, failure of heating in winter, failure of cooling (extreme heat), broken lock compromising security',
    urgentTenantRights: 'Tenant can arrange urgent repairs up to $2,500 and be reimbursed within 14 days of providing receipt',
    nonUrgent: 'Landlord must respond within 14 days of written notice',
    maintenanceObligations: 'Landlord must maintain property in good repair and fit for habitation',
  },
  leaseTermination: {
    noticeByTenantPeriodic: '21 days (3 weeks) notice (7 days if applying for public housing)',
    noticeByTenantFixed: 'Tenant can break fixed lease but liable for loss of rent until re-let and reletting costs',
    noticeByLandlordPeriodic: '60 days notice (or 30 days if selling, 7 days for breach)',
    noticeByLandlordFixed: 'Valid grounds: breach, property sale, demolition, renovation, owner/family moving in',
    breakingLeaseFees: 'Liable for rent until property is re-let + reasonable reletting costs (advertising, tenant screening). Landlord must mitigate losses.',
  },
  inspections: {
    frequency: 'Maximum 4 inspections per year (every 3 months)',
    noticePeriod: 'At least 7 days written notice for routine inspections. 48 hours for rent inspections (photographs). 24 hours for entry with specific purpose.',
    entryTimes: 'Between 7am and 9pm, not on public holidays or Sundays unless agreed',
  },
  pets: {
    rules: 'Landlord consent required. Cannot unreasonably withhold consent as of recent reforms.',
    bondAddition: 'No additional bond specifically for pets',
    refusalGrounds: 'Unreasonable to refuse assistance animals (guide dogs, hearing dogs)',
  },
  discrimination: {
    rules: 'WA Equal Opportunity Act prohibits discrimination in housing based on race, gender, sexuality, age, disability, marital status, family status, pregnancy, or religious/political belief.',
  },
  recentReforms: {
    overview: 'Major reforms under the Residential Tenancies Amendment Act 2024 (coming into effect in stages):',
    pets: 'Ban on unreasonable refusal of pets',
    modifications: 'Tenants can make minor modifications without consent (e.g., picture hooks, child safety items)',
    rentIncreases: 'Rent increases limited to once every 12 months for periodic agreements',
    minimumStandards: 'New minimum standards for rental properties (being phased in)',
    noGroundsEvictions: 'No grounds evictions abolished for periodic tenancies',
    familyViolence: 'Additional protections for victims/survivors of family violence',
  },
  resources: {
    tribunal: 'State Administrative Tribunal (SAT) or Magistrates Court',
    tenancyUnion: "Tenants' Union of Western Australia (Tenancy WA)",
    consumerProtection: 'Consumer Protection - Department of Mines, Industry Regulation and Safety',
  },
  commonIssues: [
    'WA has historically lagged in tenant protections but major reforms are being phased in from 2024',
    'Condition reports are critical - take photos on move-in day',
    'If landlord does not lodge bond within 14 days, tenant can apply to Bond Administrator',
    'End of lease cleaning must be "reasonably clean" - professional cleaning not mandatory',
    'Landlord must provide functioning smoke alarms and mains-powered or 10-year battery type',
  ],
};