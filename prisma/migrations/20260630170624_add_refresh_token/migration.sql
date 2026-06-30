/*
  Warnings:

  - Added the required column `refreshToken` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Session_token_idx` ON `session`;

-- AlterTable
ALTER TABLE `session` ADD COLUMN `refreshToken` TEXT NOT NULL;

-- CreateIndex
CREATE INDEX `Session_token_idx` ON `Session`(`token`(255));

-- CreateIndex
CREATE INDEX `Session_refreshToken_idx` ON `Session`(`refreshToken`(255));
