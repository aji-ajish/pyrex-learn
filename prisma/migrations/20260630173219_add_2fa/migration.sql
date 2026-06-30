-- DropIndex
DROP INDEX `Session_refreshToken_idx` ON `session`;

-- DropIndex
DROP INDEX `Session_token_idx` ON `session`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `twoFactorSecret` TEXT NULL;

-- CreateIndex
CREATE INDEX `Session_token_idx` ON `Session`(`token`(255));

-- CreateIndex
CREATE INDEX `Session_refreshToken_idx` ON `Session`(`refreshToken`(255));
