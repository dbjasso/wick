import { prisma } from "@/lib/prisma";

export async function recordForAccount(recordId: string, accountId: string) {
  return prisma.record.findFirst({ where: { id: recordId, accountId } });
}

export async function tagForAccount(tagId: string, accountId: string) {
  return prisma.tag.findFirst({ where: { id: tagId, accountId } });
}

export async function todoForAccount(todoId: string, accountId: string) {
  return prisma.todoItem.findFirst({
    where: { id: todoId, record: { accountId } },
  });
}

export async function commentForAccount(commentId: string, accountId: string) {
  return prisma.comment.findFirst({
    where: { id: commentId, record: { accountId } },
  });
}

export async function contactForAccount(contactId: string, accountId: string) {
  return prisma.contact.findFirst({
    where: { id: contactId, tag: { accountId } },
  });
}

export async function dateForAccount(dateId: string, accountId: string) {
  return prisma.importantDate.findFirst({
    where: { id: dateId, tag: { accountId } },
  });
}

export async function documentForAccount(documentId: string, accountId: string) {
  return prisma.document.findFirst({
    where: { id: documentId, tag: { accountId } },
  });
}
