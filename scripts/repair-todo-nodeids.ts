import { prisma } from "../src/lib/prisma";
import { repairTaskItemNodeIds, syncTodoItems } from "../src/lib/todos";

async function main() {
  const records = await prisma.record.findMany({ select: { id: true, content: true } });
  let fixed = 0;

  for (const r of records) {
    const repaired = repairTaskItemNodeIds(r.content);
    if (JSON.stringify(repaired) !== JSON.stringify(r.content)) {
      await prisma.record.update({ where: { id: r.id }, data: { content: repaired as never } });
      await syncTodoItems(r.id, repaired);
      fixed++;
      console.log(`repaired ${r.id}`);
    }
  }

  console.log(`done: ${fixed} record(s) repaired`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
