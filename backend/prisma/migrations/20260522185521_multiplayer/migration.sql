/*
  Warnings:

  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ClientToGame` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('JOINED', 'LEFT', 'WINNER', 'LOSER');

-- DropForeignKey
ALTER TABLE "_ClientToGame" DROP CONSTRAINT "_ClientToGame_A_fkey";

-- DropForeignKey
ALTER TABLE "_ClientToGame" DROP CONSTRAINT "_ClientToGame_B_fkey";

-- AlterTable
ALTER TABLE "Game" ALTER COLUMN "name" SET DEFAULT 'Multiplayer Game';

-- DropTable
DROP TABLE "Client";

-- DropTable
DROP TABLE "_ClientToGame";

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "status" "PlayerStatus" NOT NULL DEFAULT 'JOINED',

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GameToPlayer" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_GameToPlayer_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_GameToPlayer_B_index" ON "_GameToPlayer"("B");

-- AddForeignKey
ALTER TABLE "_GameToPlayer" ADD CONSTRAINT "_GameToPlayer_A_fkey" FOREIGN KEY ("A") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToPlayer" ADD CONSTRAINT "_GameToPlayer_B_fkey" FOREIGN KEY ("B") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
