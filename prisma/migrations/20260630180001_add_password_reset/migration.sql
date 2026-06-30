-- DropIndex
DROP INDEX `Session_refreshToken_idx` ON `session`;

-- DropIndex
DROP INDEX `Session_token_idx` ON `session`;

-- CreateTable
CREATE TABLE `PasswordReset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `token` TEXT NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PasswordReset_token_idx`(`token`(255)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Session_token_idx` ON `Session`(`token`(255));

-- CreateIndex
CREATE INDEX `Session_refreshToken_idx` ON `Session`(`refreshToken`(255));
