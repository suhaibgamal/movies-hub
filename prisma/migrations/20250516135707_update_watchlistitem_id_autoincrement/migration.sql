-- AlterTable
CREATE SEQUENCE watchlistitem_id_seq;
ALTER TABLE "WatchlistItem" ALTER COLUMN "id" SET DEFAULT nextval('watchlistitem_id_seq');
ALTER SEQUENCE watchlistitem_id_seq OWNED BY "WatchlistItem"."id";
