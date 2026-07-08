export const bookingTypeDefs = /* GraphQL */ `
  enum SessionType {
    Video
    Audio
    Chat
  }

  enum SlotStatus {
    Open
    Booked
    Cancelled
  }

  enum BookingStatus {
    Pending
    Confirmed
    Completed
    Cancelled
    NoShow
  }

  type HealerProfile {
    id: ID!
    user: User!
    title: String!
    bio: String!
    specialties: [String!]!
    languages: [String!]!
    sessionTypes: [SessionType!]!
    priceMin: Int!
    priceMax: Int!
    currency: String!
    ratingAvg: Float!
    reviewCount: Int!
    verified: Boolean!
    reviews(first: Int = 20, after: String): [Review!]!
    createdAt: DateTime!
  }

  type Review {
    id: ID!
    healer: HealerProfile!
    author: User!
    stars: Int!
    text: String!
    createdAt: DateTime!
  }

  """One calendar day in the date picker, e.g. { label: "Mon\\n10", available: true }"""
  type SlotDay {
    date: DateTime!
    label: String!
    available: Boolean!
  }

  """One bookable time slot for a chosen day, e.g. { label: "3:00 PM", available: true }"""
  type TimeSlot {
    slotId: ID!
    startAt: DateTime!
    label: String!
    available: Boolean!
  }

  type Slot {
    id: ID!
    startAt: DateTime!
    endAt: DateTime!
    sessionType: SessionType!
    status: SlotStatus!
  }

  type Booking {
    id: ID!
    slot: Slot!
    patient: User!
    healer: HealerProfile!
    sessionType: SessionType!
    status: BookingStatus!
    notes: String
    createdAt: DateTime!
    cancelledAt: DateTime
  }

  input BecomeHealerInput {
    title: String!
    bio: String!
    specialties: [String!]!
    languages: [String!]!
    sessionTypes: [SessionType!]!
    priceMin: Int!
    priceMax: Int!
    currency: String
  }

  input AvailabilityRuleInput {
    "0 = Sunday .. 6 = Saturday"
    dayOfWeek: Int!
    "24h format, e.g. 09:00"
    startTime: String!
    endTime: String!
    sessionType: SessionType!
    slotMinutes: Int
  }

  extend type User {
    healerProfile: HealerProfile
  }

  extend type Query {
    healers(specialty: String): [HealerProfile!]!
    healer(id: ID!): HealerProfile
    healerAvailableDates(healerId: ID!, from: DateTime!, to: DateTime!): [SlotDay!]!
    healerTimeSlots(healerId: ID!, date: DateTime!): [TimeSlot!]!
    myBookings: [Booking!]!
  }

  extend type Mutation {
    becomeHealer(input: BecomeHealerInput!): HealerProfile!
    setAvailabilityRules(rules: [AvailabilityRuleInput!]!): HealerProfile!
    "Materializes bookable Slot rows from the healer's AvailabilityRules for the given date range. Returns the number of slots created."
    generateSlots(fromDate: DateTime!, toDate: DateTime!): Int!
    createBooking(slotId: ID!, notes: String): Booking!
    cancelBooking(bookingId: ID!): Booking!
    writeReview(healerId: ID!, stars: Int!, text: String!): Review!
  }
`;
