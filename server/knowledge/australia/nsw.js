// NSW Residential Tenancies Act 2010 - Key Rules
module.exports = {
  state: 'NSW',
  name: 'New South Wales',
  rent: {
    maxIncreaseFrequency: 'Every 12 months for periodic agreements',
    increaseNoticePeriod: 'At least 60 days notice in writing',
    maxBond: '4 weeks rent (if rent < $250/week) or 6 weeks rent (if rent >= $250/week)',
    rentArrearsNoticePeriod: '14 days before termination notice can be issued',
    rentReceiptRequired: 'Landlord must provide free rent receipts if requested',
  },
  bonds: {
    authority: 'Rental Bonds Online (RBO) via NSW Fair Trading',
    lodgingDeadline: 'Landlord must lodge bond with NSW Fair Trading within 10 business days of receipt',
    bondReturn: 'Claim must be made within 14 days of tenancy end. Disputes go to NSW Civil and Administrative Tribunal (NCAT)',
    maxAmount: '4 weeks rent for properties under $250/week; 6 weeks for $250+/week',
    interest: 'Bond earns interest payable to tenant if bond exceeds certain thresholds',
  },
  conditionReports: {
    requirement: 'Landlord must provide 2 copies of condition report within 7 days of tenant moving in',
    tenantReturn: 'Tenant must return signed copy within 7 days (or note disagreements)',
    photos: 'Both parties encouraged to take dated photos',
  },
  repairs: {
    urgent: 'Landlord must arrange urgent repairs immediately (burst pipes, blocked toilet, serious roof leak, gas leak, dangerous electrical fault, flooding, serious storm damage, failure of hot water system, failure of stove/oven, failure of heating or cooling depending on season)',
    urgentTenantRights: 'Tenant can arrange urgent repairs up to $1,000 and be reimbursed within 7 days',
    nonUrgent: 'Landlord must respond within 14 days in writing',
    tenantsRightToReasonablePeace: 'Tenants have the right to quiet enjoyment of the property',
  },
  leaseTermination: {
    noticeByTenantPeriodic: '21 days notice',
    noticeByTenantFixed: 'No break clause - tenant may need to find replacement or pay costs',
    noticeByLandlordPeriodic: '90 days notice (60 days if hardship)',
    noticeByLandlordFixed: 'Limited grounds - sale, renovation, demolition, or breach',
    breakingLeaseFees: 'Tenant liable for reasonable costs to re-let (typically 1-4 weeks rent, or until new tenant found). No longer charged "break fees" as of 2024 reforms',
  },
  inspections: {
    frequency: 'Maximum 4 routine inspections per year',
    noticePeriod: 'At least 7 days written notice',
    entryTimes: 'Between 7am and 8pm, not on public holidays or Sundays unless agreed',
  },
  pets: {
    rules: 'As of 2024, tenants can have pets with landlord consent which cannot be unreasonably refused. Landlord must respond within 21 days.',
    bondAddition: 'Landlord cannot charge additional bond for pets',
  },
  discrimination: {
    rules: 'Landlords cannot discriminate based on age, gender, race, sexuality, disability, or having children. This includes in advertising, interviews, and lease terms.',
  },
  keyReforms2024: {
    petReforms: 'Tenants can keep pets unless NCAT orders otherwise',
    noGroundsEvictions: 'No grounds evictions abolished - landlords need a valid reason to end tenancy',
    rentIncreaseLimits: 'Rent increases limited to once every 12 months for periodic agreements',
    portableBonds: 'Bonds can be transferred between properties',
  },
  resources: {
    tribunal: 'NSW Civil and Administrative Tribunal (NCAT)',
    tenancyUnion: "Tenants' Union of NSW",
    fairTrading: 'NSW Fair Trading',
  },
  commonIssues: [
    'Retaliatory eviction after requesting repairs is illegal',
    'Landlord cannot lock tenant out or change locks without a court order',
    'Tenant must be given 2 working days notice for landlord to show property to prospective buyers/tenants',
    'Smoke alarms must be installed and maintained by landlord',
    'Property must meet minimum standards (habitable, structurally sound, adequate ventilation, working locks, adequate natural light)',
  ],
};