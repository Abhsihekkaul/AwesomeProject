import { PrismaClient, ConditionCategory } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

// Mirrors src/data/conditions.ts in the HealingSathi app, grouped into this backend's
// ConditionCategory enum. Kept here (rather than imported from the RN app) so this backend
// has no runtime dependency on the mobile app's file layout.
const CONDITIONS: { name: string; category: ConditionCategory }[] = [
  ...["Type 1 Diabetes", "Type 2 Diabetes", "Prediabetes", "Gestational Diabetes", "Obesity", "Metabolic Syndrome"]
    .map((name) => ({ name, category: ConditionCategory.DiabetesMetabolic })),
  ...["Hypertension", "High Cholesterol", "Heart Disease", "Coronary Artery Disease", "Heart Failure", "Atrial Fibrillation"]
    .map((name) => ({ name, category: ConditionCategory.Cardiovascular })),
  ...["Depression", "Anxiety Disorder", "Bipolar Disorder", "PTSD", "OCD", "ADHD", "Panic Disorder", "Social Anxiety Disorder", "Eating Disorder"]
    .map((name) => ({ name, category: ConditionCategory.MentalHealth })),
  ...["Multiple Sclerosis", "Parkinson's Disease", "Epilepsy", "Migraine", "Alzheimer's Disease", "Dementia", "Stroke Recovery", "Essential Tremor"]
    .map((name) => ({ name, category: ConditionCategory.Neurological })),
  ...["Lupus (SLE)", "Rheumatoid Arthritis", "Psoriasis", "Psoriatic Arthritis", "Sjogren's Syndrome", "Hashimoto's Thyroiditis", "Celiac Disease", "Vasculitis"]
    .map((name) => ({ name, category: ConditionCategory.Autoimmune })),
  ...["Crohn's Disease", "Ulcerative Colitis", "Irritable Bowel Syndrome (IBS)", "GERD", "Fatty Liver Disease", "Chronic Gastritis"]
    .map((name) => ({ name, category: ConditionCategory.Digestive })),
  ...["Asthma", "COPD", "Sleep Apnea", "Long COVID"]
    .map((name) => ({ name, category: ConditionCategory.Respiratory })),
  ...["Fibromyalgia", "Chronic Fatigue Syndrome", "Chronic Pain", "Arthritis", "Osteoarthritis", "Back Pain"]
    .map((name) => ({ name, category: ConditionCategory.PainChronic })),
  ...["Hypothyroidism", "Hyperthyroidism", "PCOS", "Endometriosis"]
    .map((name) => ({ name, category: ConditionCategory.EndocrineHormonal })),
  ...["Chronic Kidney Disease", "Kidney Stones", "Interstitial Cystitis"]
    .map((name) => ({ name, category: ConditionCategory.KidneyUrinary })),
  ...["Breast Cancer", "Lung Cancer", "Prostate Cancer", "Colorectal Cancer", "Leukemia", "Cancer Survivor"]
    .map((name) => ({ name, category: ConditionCategory.Cancer })),
  ...["Eczema", "Acne", "Rosacea", "Vitiligo"]
    .map((name) => ({ name, category: ConditionCategory.Skin })),
  ...["Lyme Disease", "Sickle Cell Disease", "Hemophilia", "Autism Spectrum Disorder", "Tourette Syndrome", "HIV/AIDS"]
    .map((name) => ({ name, category: ConditionCategory.RareOther })),
];

const DEMO_PASSWORD = "password123";

async function main() {
  console.log(`Seeding ${CONDITIONS.length} conditions...`);
  for (const condition of CONDITIONS) {
    await prisma.condition.upsert({
      where: { name: condition.name },
      create: condition,
      update: { category: condition.category },
    });
  }

  const passwordHash = await argon2.hash(DEMO_PASSWORD);

  const patient = await prisma.user.upsert({
    where: { email: "patient@healingsathi.dev" },
    create: {
      email: "patient@healingsathi.dev",
      passwordHash,
      name: "Priya Sharma",
      avatarColor: "#7453C8",
      conditions: { connect: [{ name: "Fibromyalgia" }, { name: "Anxiety Disorder" }] },
    },
    update: {},
  });

  const secondPatient = await prisma.user.upsert({
    where: { email: "alex@healingsathi.dev" },
    create: {
      email: "alex@healingsathi.dev",
      passwordHash,
      name: "Alex K.",
      avatarColor: "#4E79C7",
      conditions: { connect: [{ name: "Fibromyalgia" }] },
    },
    update: {},
  });

  const healerUser = await prisma.user.upsert({
    where: { email: "dr.chen@healingsathi.dev" },
    create: {
      email: "dr.chen@healingsathi.dev",
      passwordHash,
      name: "Dr. Sarah Chen",
      avatarColor: "#F1EBFF",
    },
    update: {},
  });

  const healerProfile = await prisma.healerProfile.upsert({
    where: { userId: healerUser.id },
    create: {
      userId: healerUser.id,
      title: "Clinical Psychologist",
      bio: "Dr. Chen specializes in helping people navigate the emotional challenges of chronic illness.",
      specialties: ["Chronic Illness Adaptation", "Health Anxiety", "CBT"],
      languages: ["English", "Mandarin"],
      sessionTypes: ["Video", "Audio", "Chat"],
      priceMin: 80,
      priceMax: 120,
      verified: true,
    },
    update: {},
  });

  await prisma.availabilityRule.deleteMany({ where: { healerId: healerProfile.id } });
  // Mon/Wed/Fri, 9am-1pm, 1-hour video sessions
  await prisma.availabilityRule.createMany({
    data: [1, 3, 5].map((dayOfWeek) => ({
      healerId: healerProfile.id,
      dayOfWeek,
      startTime: "09:00",
      endTime: "13:00",
      sessionType: "Video" as const,
      slotMinutes: 60,
    })),
  });

  const group = await prisma.group.upsert({
    where: { name: "Fibromyalgia Warriors" },
    create: {
      name: "Fibromyalgia Warriors",
      description: "A support circle for people living with fibromyalgia.",
      category: "Chronic Pain",
      accentColor: "#4E79C7",
      createdById: patient.id,
      memberships: {
        create: [
          { userId: patient.id, role: "Moderator" },
          { userId: secondPatient.id, role: "Member" },
        ],
      },
    },
    update: {},
  });

  const existingPost = await prisma.post.findFirst({ where: { groupId: group.id } });
  const post =
    existingPost ??
    (await prisma.post.create({
      data: {
        authorId: patient.id,
        groupId: group.id,
        body: "Pacing myself and warm baths before sleep have helped the most lately. What's been your biggest challenge?",
        tags: ["pacing", "sleep"],
      },
    }));

  const existingRootComment = await prisma.comment.findFirst({
    where: { postId: post.id, parentId: null },
  });
  const rootComment =
    existingRootComment ??
    (await prisma.comment.create({
      data: {
        postId: post.id,
        authorId: secondPatient.id,
        text: "Definitely the unpredictability. I've been trying journaling — it helps me notice patterns.",
      },
    }));

  const existingReply = await prisma.comment.findFirst({ where: { parentId: rootComment.id } });
  if (!existingReply) {
    await prisma.comment.create({
      data: {
        postId: post.id,
        authorId: patient.id,
        parentId: rootComment.id,
        depth: rootComment.depth + 1,
        text: "That's such a good idea, I should try that too.",
      },
    });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { AND: [{ participants: { some: { userId: patient.id } } }, { participants: { some: { userId: secondPatient.id } } }] },
  });
  const convo =
    conversation ??
    (await prisma.conversation.create({
      data: { participants: { create: [{ userId: patient.id }, { userId: secondPatient.id }] } },
    }));

  if (!(await prisma.message.findFirst({ where: { conversationId: convo.id } }))) {
    await prisma.message.create({
      data: {
        conversationId: convo.id,
        senderId: secondPatient.id,
        text: "I've found that pacing myself helps the most.",
      },
    });
  }

  await prisma.notification.upsert({
    where: { id: "seed-welcome-notification" },
    create: {
      id: "seed-welcome-notification",
      userId: patient.id,
      type: "System",
      title: "Welcome to HealingSathi",
      message: "Your account is ready. Explore groups that match your conditions.",
    },
    update: {},
  });

  console.log("Seed complete. Demo accounts (password: %s):", DEMO_PASSWORD);
  console.log("  patient@healingsathi.dev");
  console.log("  alex@healingsathi.dev");
  console.log("  dr.chen@healingsathi.dev (healer)");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
