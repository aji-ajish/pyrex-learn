-- DropIndex
DROP INDEX `Session_token_key` ON `session`;

-- AlterTable
ALTER TABLE `session` MODIFY `token` TEXT NOT NULL;

-- CreateIndex
CREATE INDEX `Session_token_idx` ON `Session`(`token`(255));
