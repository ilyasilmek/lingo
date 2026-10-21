// Skor tablosu kuralları. Hem uygulama hem de sunucu (server/) bu dosyayı kullanır;
// sunucu, telefondan gelen puana güvenmez ve puanı buradaki kurallarla kendisi hesaplar.
import {
  DAILY_LENGTH, MAX_GUESSES, HINT_MAX, HINT_AFTER_GUESSES, EPOCH_DAY,
  evaluateGuess, seededShuffle, dailyIndex, validateName, cleanName,
} from './game.js';
import { parseDay, daysBetween, addDays } from './progress.js';

export const PERIODS = ['gun', 'hafta', 'ay', 'tum'];
export const PERIOD_LABELS = { gun: 'Bugün', hafta: 'Bu hafta', ay: 'Bu ay', tum: 'Tüm zamanlar' };
export const MIN_SECONDS_PER_GUESS = 1.5;

// Günün kelimesi: tarih ve cevap listesinden herkes için aynı kelime.
export function dailyAnswerFor(answers, day) {
  const order = seededShuffle(answers);
  return order[dailyIndex(order.length, parseDay(day))];
}

// Tablodaki puan: erken ve hızlı bilmek kazandırır, ipucu puan düşürür. Kaybeden 0 alır.
// Seri çarpanı ve iki kat ödül burada yoktur; herkes aynı ölçüyle karşılaştırılır.
export function leaderboardPoints({ won, attempts, seconds, hints = 0 }) {
  if (!won) return 0;
  const base = (MAX_GUESSES + 1 - attempts) * 100;
  const speed = Math.max(0, 120 - Math.round(seconds));
  return Math.max(10, base + speed - hints * 50);
}

// Oyuncu kimliği: uygulamanın ürettiği 32 karakterlik onaltılık sayı.
export const isPlayerId = (id) => typeof id === 'string' && /^[0-9a-f]{32}$/.test(id);
export const isSecret = (s) => typeof s === 'string' && /^[0-9a-f]{64}$/.test(s);

// Listede herkese görünecek adlar için ek süzgeç (küçük harfe çevrilip aranır).
const BLOCKED = ['amk', 'aq', 'sik', 'orospu', 'piç', 'yarrak', 'yarak', 'göt', 'gavat', 'ibne', 'pezevenk', 'kahpe', 'fuck', 'shit', 'admin', 'lingo'];
export function publicNameProblem(raw) {
  const problem = validateName(raw);
  if (problem) return problem;
  const n = cleanName(raw).toLocaleLowerCase('tr-TR');
  const words = n.split(/[\s._-]+/);
  if (BLOCKED.some((b) => words.includes(b) || (b.length > 3 && n.includes(b)))) return 'Bu ad kullanılamaz.';
  if ([...nameKey(raw)].length < 2) return 'Ad en az 2 harf ya da rakam içermeli.';
  return null;
}

// Adların benzersizliği bu anahtarla denetlenir: büyük/küçük harf, Türkçe harfler (ı/i, ş/s...),
// şapkalar ve boşluk, nokta, tire, alt çizgi fark yaratmaz. "İlyas", "ilyas" ve "i.lyas" aynı addır.
export function nameKey(raw) {
  return cleanName(raw)
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ı/g, 'i')
    .replace(/[\s._-]/g, '');
}

// Herhangi bir oyun modunun (klasik, günlük, arşiv) gönderimini doğrular.
export function checkSubmission({ day, mode = 'classic', length = 5, answer, guesses, hints = 0, seconds }, { answers, valid, answersByLen, validByLen, today }) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return { ok: false, error: 'Geçersiz tarih' };
  if (daysBetween(EPOCH_DAY, day) < 0) return { ok: false, error: 'Geçersiz tarih' };

  const len = Number(length) || (guesses?.[0] ? [...guesses[0]].length : 5);
  if (len < 4 || len > 9) return { ok: false, error: 'Geçersiz kelime uzunluğu' };

  const ansList = answersByLen?.[len] || answers || [];
  const valSet = validByLen?.[len] || valid || new Set();

  if (!Array.isArray(guesses) || guesses.length < 1 || guesses.length > MAX_GUESSES) return { ok: false, error: 'Geçersiz tahmin sayısı' };
  if (!Number.isInteger(hints) || hints < 0 || hints > HINT_MAX) return { ok: false, error: 'Geçersiz ipucu sayısı' };
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > 86400) return { ok: false, error: 'Geçersiz süre' };

  let targetAnswer = answer;
  if (mode === 'daily') {
    const offset = daysBetween(today, day);
    if (offset < -1 || offset > 1) return { ok: false, error: 'Skor yalnızca günün kelimesi için gönderilebilir' };
    targetAnswer = dailyAnswerFor(ansList, day);
    if (answer && answer !== targetAnswer) return { ok: false, error: 'Günün kelimesi eşleşmiyor' };
  } else {
    if (typeof targetAnswer !== 'string' || [...targetAnswer].length !== len) {
      targetAnswer = guesses[guesses.length - 1]; // eğer tahminlerde varsa en sonuncu
    }
  }

  const first = targetAnswer ? [...targetAnswer][0] : null;
  for (const g of guesses) {
    if (typeof g !== 'string' || [...g].length !== len) return { ok: false, error: 'Geçersiz tahmin' };
    if (valSet.size > 0 && !valSet.has(g)) return { ok: false, error: 'Geçersiz tahmin' };
    if (first && [...g][0] !== first) return { ok: false, error: 'Geçersiz tahmin' };
  }

  const hit = targetAnswer ? guesses.indexOf(targetAnswer) : -1;
  const won = hit !== -1;
  if (won && hit !== guesses.length - 1) return { ok: false, error: 'Kelime bulunduktan sonra tahmin yapılamaz' };
  if (!won && guesses.length < MAX_GUESSES) return { ok: false, error: 'Oyun bitmemiş' };
  if (hints > 0 && guesses.length <= HINT_AFTER_GUESSES) return { ok: false, error: 'İpucu kuralına uymuyor' };
  if (seconds < guesses.length * MIN_SECONDS_PER_GUESS) return { ok: false, error: 'Süre olanaksız derecede kısa' };

  const attempts = guesses.length;
  return { ok: true, won, attempts, points: leaderboardPoints({ won, attempts, seconds, hints }) };
}

// Günlük oyun gönderimini doğrular (geriye dönük uyumluluk).
export function checkDailySubmission({ day, guesses, hints = 0, seconds }, { answers, valid, today }) {
  return checkSubmission({ day, mode: 'daily', length: 5, guesses, hints, seconds }, { answers, valid, today });
}

// Dönemin başladığı gün. 'tum' için null.
export function periodStart(period, today) {
  if (period === 'gun') return today;
  if (period === 'hafta') {
    const dow = (parseDay(today).getDay() + 6) % 7; // Pazartesi = 0
    return addDays(today, -dow);
  }
  if (period === 'ay') return `${today.slice(0, 8)}01`;
  return null;
}
