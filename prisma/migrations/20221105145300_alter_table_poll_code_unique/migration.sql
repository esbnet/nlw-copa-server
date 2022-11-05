/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Poll` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Poll_code_key" ON "Poll"("code");
