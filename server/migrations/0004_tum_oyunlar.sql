-- Tüm oyun modlarındaki (klasik, günlük, arşiv) skorların tutulabilmesi için tablonun güncellenmesi.

CREATE TABLE IF NOT EXISTS scores_new (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id),
  day TEXT NOT NULL,                 -- 'YYYY-MM-DD'
  mode TEXT NOT NULL DEFAULT 'classic',
  won INTEGER NOT NULL,
  attempts INTEGER NOT NULL,
  seconds INTEGER NOT NULL,
  hints INTEGER NOT NULL,
  points INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO scores_new (id, player_id, day, mode, won, attempts, seconds, hints, points, created_at)
SELECT
  player_id || '_' || day AS id,
  player_id,
  day,
  'daily' AS mode,
  won,
  attempts,
  seconds,
  hints,
  points,
  created_at
FROM scores;

DROP TABLE scores;

ALTER TABLE scores_new RENAME TO scores;

CREATE INDEX IF NOT EXISTS scores_day ON scores(day);
CREATE INDEX IF NOT EXISTS scores_player_id ON scores(player_id);
