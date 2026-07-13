import { PrismaClient } from "@prisma/client";
import { ensureBootstrapAdmin } from "../src/lib/bootstrap-admin";

const prisma = new PrismaClient();

// TipTap JSON mínimo para el seed. Los taskItem llevan un attr `nodeId`
// estable que se sincroniza con la tabla TodoItem (ver Tarea 6b).
function textParagraph(text: string) {
  return {
    type: "paragraph",
    content: [{ type: "text", text }],
  };
}

function taskItem(nodeId: string, text: string, checked: boolean) {
  return {
    type: "taskItem",
    attrs: { checked, nodeId },
    content: [textParagraph(text)],
  };
}

async function main() {
  await ensureBootstrapAdmin();

  const account =
    (await prisma.account.findFirst({ where: { name: "Seed" } })) ??
    (await prisma.account.create({ data: { name: "Seed" } }));

  // Limpieza en orden de dependencias para que el seed sea re-ejecutable.
  await prisma.comment.deleteMany({ where: { record: { accountId: account.id } } });
  await prisma.todoItem.deleteMany({ where: { record: { accountId: account.id } } });
  await prisma.document.deleteMany({ where: { tag: { accountId: account.id } } });
  await prisma.importantDate.deleteMany({ where: { tag: { accountId: account.id } } });
  await prisma.contact.deleteMany({ where: { tag: { accountId: account.id } } });
  await prisma.record.deleteMany({ where: { accountId: account.id } });
  await prisma.tag.deleteMany({ where: { accountId: account.id } });

  const trabajo = await prisma.tag.create({
    data: {
      name: "trabajo",
      accountId: account.id,
      description: "Temas laborales y proyectos.",
      contacts: {
        create: [
          { name: "Lucía Fernández", email: "lucia@acme.com", phone: "+54 11 5555-1234" },
        ],
      },
      importantDates: {
        create: [
          { label: "Vencimiento contrato", date: new Date("2026-09-15T00:00:00Z") },
        ],
      },
    },
  });

  const personal = await prisma.tag.create({ data: { name: "personal", accountId: account.id } });
  const lectura = await prisma.tag.create({ data: { name: "lectura", accountId: account.id } });

  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const r1 = await prisma.record.create({
    data: {
      date: today,
      accountId: account.id,
      content: {
        type: "doc",
        content: [
          textParagraph("Avances del día en el proyecto ACME."),
          {
            type: "taskList",
            content: [
              taskItem("todo-r1-1", "Revisar contrato con Lucía", true),
              taskItem("todo-r1-2", "Enviar propuesta de presupuesto", false),
            ],
          },
        ],
      },
      tags: { connect: [{ id: trabajo.id }] },
    },
  });

  await prisma.todoItem.createMany({
    data: [
      { recordId: r1.id, nodeId: "todo-r1-1", text: "Revisar contrato con Lucía", checked: true },
      { recordId: r1.id, nodeId: "todo-r1-2", text: "Enviar propuesta de presupuesto", checked: false },
    ],
  });

  await prisma.record.create({
    data: {
      date: yesterday,
      accountId: account.id,
      content: {
        type: "doc",
        content: [textParagraph("Notas de la lectura del fin de semana. Pendiente retomar el capítulo 4.")],
      },
      tags: { connect: [{ id: personal.id }, { id: lectura.id }] },
    },
  });

  const r3 = await prisma.record.create({
    data: {
      date: today,
      accountId: account.id,
      content: {
        type: "doc",
        content: [textParagraph("Reunión 1:1 con Lucía — definir próximos pasos del contrato.")],
      },
      tags: { connect: [{ id: trabajo.id }] },
      comments: {
        create: [{ content: "Confirmar fecha de la próxima reunión." }],
      },
    },
  });

  console.log("Seed OK. Registros:", [r1.id, r3.id].length, "Tags: 3");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
