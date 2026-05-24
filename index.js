require('dotenv').config();
// ╔══════════════════════════════════════════════════════════════╗
// ║         CrystalHaven Network - BoxPvP Discord Bot            ║
// ║              Developed for CrystalHaven Network              ║
// ╚══════════════════════════════════════════════════════════════╝

require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
  Collection,
  bold,
  inlineCode,
  time,
} = require("discord.js");

// ─────────────────────────────────────────────
//  CONFIG  (ortam değişkeni yoksa default değer)
// ─────────────────────────────────────────────
const CONFIG = {
  TOKEN: process.env.BOT_TOKEN || "YOUR_BOT_TOKEN",
  CLIENT_ID: process.env.CLIENT_ID || "YOUR_CLIENT_ID",
  GUILD_ID: process.env.GUILD_ID || "YOUR_GUILD_ID",

  // Kanal ID'leri
  CHANNELS: {
    DUYURU: process.env.DUYURU_CHANNEL || "DUYURU_KANAL_ID",
    LOG: process.env.LOG_CHANNEL || "LOG_KANAL_ID",
    ONERI: process.env.ONERI_CHANNEL || "ONERI_KANAL_ID",
    HATA: process.env.HATA_CHANNEL || "HATA_KANAL_ID",
    CEKILIS: process.env.CEKILIS_CHANNEL || "CEKILIS_KANAL_ID",
    IHALE: process.env.IHALE_CHANNEL || "IHALE_KANAL_ID",
    HEDIYE: process.env.HEDIYE_CHANNEL || "HEDIYE_KANAL_ID",
  },

  // Rol ID'leri
  ROLES: {
    ADMIN: process.env.ADMIN_ROLE || "ADMIN_ROL_ID",
    MODERATOR: process.env.MODERATOR_ROLE || "MOD_ROL_ID",
    YARDIMCI: process.env.YARDIMCI_ROLE || "YARDIMCI_ROL_ID",
    VIP: process.env.VIP_ROLE || "VIP_ROL_ID",
    VIP_PLUS: process.env.VIP_PLUS_ROLE || "VIP_PLUS_ROL_ID",
    EFSANE: process.env.EFSANE_ROLE || "EFSANE_ROL_ID",
  },

  // Sunucu bilgisi
  SERVER: {
    IP: process.env.SERVER_IP || "play.crystalhaven.net",
    PORT: process.env.SERVER_PORT || "19132",
    VERSION: process.env.SERVER_VERSION || "1.20.x",
    WEBSITE: process.env.WEBSITE || "https://crystalhaven.net",
    STORE: process.env.STORE || "https://store.crystalhaven.net",
    DISCORD_INVITE: process.env.DISCORD_INVITE || "https://discord.gg/crystalhaven",
  },

  // Renkler
  COLORS: {
    PRIMARY: 0x00d4ff,
    SUCCESS: 0x57f287,
    ERROR: 0xff4757,
    WARNING: 0xffa502,
    INFO: 0x747d8c,
    GOLD: 0xffd700,
    PURPLE: 0x9b59b6,
    DARK: 0x2f3136,
  },

  // Cooldown ayarları (ms)
  COOLDOWNS: {
    DEFAULT: 3000,
    GUNLUK_HEDIYE: 86400000, // 24 saat
    CEKILIS: 300000, // 5 dk
    ONERI: 60000, // 1 dk
  },
};

// ─────────────────────────────────────────────
//  IN-MEMORY VERİTABANI (gerçek projelerde MongoDB kullan)
// ─────────────────────────────────────────────
const DB = {
  players: new Map(),     // oyuncu verileri
  clans: new Map(),       // klan verileri
  codes: new Map(),       // hediye kodları
  mutes: new Map(),       // aktif muteler
  bans: new Map(),        // banlar
  warnings: new Map(),    // uyarılar
  dailyClaims: new Map(), // günlük hediye talepleri
  auctions: new Map(),    // ihaleler
  cekilis: null,          // aktif çekiliş
};

// Örnek veri - başlangıç
function seedData() {
  const samplePlayers = [
    { id: "p1", name: "KristaBey", kills: 2840, deaths: 312, balance: 158000, rank: "Efsane", clan: "CrystalWarriors" },
    { id: "p2", name: "DarkStorm99", kills: 2301, deaths: 445, balance: 94000, rank: "VIP+", clan: "ShadowForce" },
    { id: "p3", name: "AsilKing", kills: 1980, deaths: 278, balance: 203000, rank: "Efsane", clan: "CrystalWarriors" },
    { id: "p4", name: "FireBreaker", kills: 1756, deaths: 503, balance: 77000, rank: "VIP", clan: "PhoenixRise" },
    { id: "p5", name: "IronFist", kills: 1643, deaths: 390, balance: 61000, rank: "VIP", clan: "ShadowForce" },
    { id: "p6", name: "XBladeMaster", kills: 1512, deaths: 412, balance: 49000, rank: "Normal", clan: null },
    { id: "p7", name: "CrystalSniper", kills: 1389, deaths: 298, balance: 88000, rank: "VIP+", clan: "CrystalWarriors" },
    { id: "p8", name: "GhostWalker", kills: 1244, deaths: 501, balance: 37000, rank: "Normal", clan: "PhoenixRise" },
    { id: "p9", name: "NightRaider", kills: 1102, deaths: 334, balance: 55000, rank: "VIP", clan: "ShadowForce" },
    { id: "p10", name: "ZenMaster", kills: 987, deaths: 267, balance: 42000, rank: "Normal", clan: null },
  ];
  samplePlayers.forEach(p => DB.players.set(p.name.toLowerCase(), p));

  const sampleClans = [
    { name: "CrystalWarriors", leader: "KristaBey", members: ["KristaBey", "AsilKing", "CrystalSniper"], kills: 6209, rank: 1 },
    { name: "ShadowForce", leader: "DarkStorm99", members: ["DarkStorm99", "IronFist", "NightRaider"], kills: 5246, rank: 2 },
    { name: "PhoenixRise", leader: "FireBreaker", members: ["FireBreaker", "GhostWalker"], kills: 2800, rank: 3 },
  ];
  sampleClans.forEach(c => DB.clans.set(c.name.toLowerCase(), c));

  // Örnek kod
  DB.codes.set("CRYSTAL2024", { reward: "Kasa Anahtarı x3", uses: 0, maxUses: 100, active: true });
  DB.codes.set("VIP7GUN", { reward: "VIP (7 Gün)", uses: 0, maxUses: 50, active: true });
}
seedData();

// ─────────────────────────────────────────────
//  YARDIMCI FONKSİYONLAR
// ─────────────────────────────────────────────
function calcKDA(kills, deaths) {
  if (deaths === 0) return kills.toFixed(2);
  return (kills / deaths).toFixed(2);
}

function formatMoney(amount) {
  return amount.toLocaleString("tr-TR") + " 💰";
}

function getRankEmoji(rank) {
  const map = { "Efsane": "👑", "VIP+": "💎", "VIP": "⭐", "Normal": "🧑" };
  return map[rank] || "🧑";
}

function hasRole(member, ...roleIds) {
  return roleIds.some(id => member.roles.cache.has(id));
}

function isStaff(member) {
  return hasRole(member, CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR, CONFIG.ROLES.YARDIMCI);
}

function isMod(member) {
  return hasRole(member, CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR) || member.permissions.has(PermissionFlagsBits.ModerateMembers);
}

function isAdmin(member) {
  return hasRole(member, CONFIG.ROLES.ADMIN) || member.permissions.has(PermissionFlagsBits.Administrator);
}

function parseDuration(str) {
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 };
  const match = str.match(/^(\d+)([smhdw])$/i);
  if (!match) return null;
  return parseInt(match[1]) * units[match[2].toLowerCase()];
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} saniye`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} dakika`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat`;
  const d = Math.floor(h / 24);
  return `${d} gün`;
}

async function sendLog(guild, embed) {
  try {
    const logCh = guild.channels.cache.get(CONFIG.CHANNELS.LOG);
    if (logCh) await logCh.send({ embeds: [embed] });
  } catch {}
}

// ─────────────────────────────────────────────
//  SLASH KOMUT TANIMLARI
// ─────────────────────────────────────────────
const commands = [

  // ══════════════════════════════
  //  ⚔️  BOXPVP & KLAN
  // ══════════════════════════════
  new SlashCommandBuilder()
    .setName("klan-bak")
    .setDescription("⚔️ Bir klanın detaylarını gösterir.")
    .addStringOption(o => o.setName("isim").setDescription("Klan adı").setRequired(true)),

  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("⚔️ Oyuncunun K/D/A istatistiklerini gösterir.")
    .addStringOption(o => o.setName("oyuncu").setDescription("Oyuncu adı").setRequired(true)),

  new SlashCommandBuilder()
    .setName("top-10")
    .setDescription("🏆 En çok öldürme yapan 10 oyuncuyu listeler."),

  new SlashCommandBuilder()
    .setName("rutbe-bak")
    .setDescription("🎖️ Rütbe atlamak için gereken miktarı gösterir.")
    .addStringOption(o =>
      o.setName("mevcut").setDescription("Mevcut rütbeniz").setRequired(true)
        .addChoices(
          { name: "Normal", value: "Normal" },
          { name: "VIP", value: "VIP" },
          { name: "VIP+", value: "VIP+" },
          { name: "Efsane", value: "Efsane" },
        )),

  new SlashCommandBuilder()
    .setName("en-zenginler")
    .setDescription("💰 Sunucunun en zengin oyuncularını listeler."),

  // ══════════════════════════════
  //  💰  EKONOMİ & MAĞAZA
  // ══════════════════════════════
  new SlashCommandBuilder()
    .setName("para")
    .setDescription("💵 Oyuncunun cüzdan bakiyesini gösterir.")
    .addStringOption(o => o.setName("oyuncu").setDescription("Oyuncu adı").setRequired(true)),

  new SlashCommandBuilder()
    .setName("magaza")
    .setDescription("🛒 Mağaza ve VIP fiyatlarını gösterir."),

  new SlashCommandBuilder()
    .setName("market")
    .setDescription("🛒 Mağaza ve VIP fiyatlarını gösterir."),

  new SlashCommandBuilder()
    .setName("gunluk-hediye")
    .setDescription("🎁 Günlük hediyeni al! (24 saatte bir)"),

  new SlashCommandBuilder()
    .setName("kod-kullan")
    .setDescription("🎟️ Hediye/etkinlik kodunu kullan.")
    .addStringOption(o => o.setName("kod").setDescription("Kodunuzu girin").setRequired(true)),

  new SlashCommandBuilder()
    .setName("ihale")
    .setDescription("📦 Satılık itemini Discord'da ilan et.")
    .addStringOption(o => o.setName("item").setDescription("Item adı").setRequired(true))
    .addIntegerOption(o => o.setName("fiyat").setDescription("Başlangıç fiyatı (coin)").setRequired(true))
    .addStringOption(o => o.setName("aciklama").setDescription("Ek açıklama").setRequired(false)),

  // ══════════════════════════════
  //  🛡️  SUNUCU YÖNETİM
  // ══════════════════════════════
  new SlashCommandBuilder()
    .setName("aktif")
    .setDescription("📢 Sunucu açıldı duyurusu yap. (Yetkili)")
    .addStringOption(o => o.setName("not").setDescription("Ek not (isteğe bağlı)").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.MentionEveryone),

  new SlashCommandBuilder()
    .setName("bakim")
    .setDescription("🔧 Sunucu bakıma alındı duyurusu. (Yetkili)")
    .addStringOption(o => o.setName("sure").setDescription("Tahmini süre (ör: 30dk, 2 saat)").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.MentionEveryone),

  new SlashCommandBuilder()
    .setName("oyuncu-sayisi")
    .setDescription("👥 Anlık aktif oyuncu sayısını gösterir."),

  // ══════════════════════════════
  //  🎁  ETKİNLİK & TOPLULUK
  // ══════════════════════════════
  new SlashCommandBuilder()
    .setName("oneri")
    .setDescription("💡 Oylamalı öneri gönder.")
    .addStringOption(o => o.setName("mesaj").setDescription("Öneriniz").setRequired(true)),

  new SlashCommandBuilder()
    .setName("cekilis-baslat")
    .setDescription("🎉 Çekiliş başlat. (Yetkili)")
    .addStringOption(o => o.setName("odul").setDescription("Ödül (VIP, Kasa Anahtarı vs.)").setRequired(true))
    .addStringOption(o => o.setName("sure").setDescription("Çekiliş süresi (ör: 1h, 30m)").setRequired(true))
    .addIntegerOption(o => o.setName("kazanan").setDescription("Kazanan sayısı").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("kasa-ac")
    .setDescription("🎰 Sanal kasa aç! (Eğlence)"),

  new SlashCommandBuilder()
    .setName("hata-bildir")
    .setDescription("🐛 Bug/hata bildir.")
    .addStringOption(o => o.setName("aciklama").setDescription("Hatayı açıklayın").setRequired(true))
    .addStringOption(o => o.setName("gorsel").setDescription("Ekran görüntüsü linki (isteğe bağlı)").setRequired(false)),

  new SlashCommandBuilder()
    .setName("yardim")
    .setDescription("📖 Tüm komutların listesini gösterir."),

  // ══════════════════════════════
  //  🔨  MODERASYON
  // ══════════════════════════════
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("🔨 Kullanıcıyı sunucudan kalıcı olarak yasakla.")
    .addUserOption(o => o.setName("kullanici").setDescription("Yasaklanacak kullanıcı").setRequired(true))
    .addStringOption(o => o.setName("sebep").setDescription("Yasak sebebi").setRequired(false))
    .addBooleanOption(o => o.setName("mesajsil").setDescription("Son 7 günün mesajlarını sil?").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("✅ Kullanıcının yasağını kaldır.")
    .addStringOption(o => o.setName("userid").setDescription("Kullanıcı ID'si").setRequired(true))
    .addStringOption(o => o.setName("sebep").setDescription("Yasak kaldırma sebebi").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("👢 Kullanıcıyı sunucudan at.")
    .addUserOption(o => o.setName("kullanici").setDescription("Atılacak kullanıcı").setRequired(true))
    .addStringOption(o => o.setName("sebep").setDescription("Atma sebebi").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("🔇 Kullanıcıyı sustur (timeout).")
    .addUserOption(o => o.setName("kullanici").setDescription("Susturulacak kullanıcı").setRequired(true))
    .addStringOption(o => o.setName("sure").setDescription("Süre (ör: 10m, 1h, 2d — max 28d)").setRequired(true))
    .addStringOption(o => o.setName("sebep").setDescription("Susturma sebebi").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("🔊 Kullanıcının susturmasını kaldır.")
    .addUserOption(o => o.setName("kullanici").setDescription("Susturması kaldırılacak kullanıcı").setRequired(true))
    .addStringOption(o => o.setName("sebep").setDescription("Kaldırma sebebi").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("⚠️ Kullanıcıya uyarı ver.")
    .addUserOption(o => o.setName("kullanici").setDescription("Uyarılacak kullanıcı").setRequired(true))
    .addStringOption(o => o.setName("sebep").setDescription("Uyarı sebebi").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("warns")
    .setDescription("📋 Kullanıcının uyarı geçmişini gösterir.")
    .addUserOption(o => o.setName("kullanici").setDescription("Kullanıcı").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("delwarn")
    .setDescription("🗑️ Kullanıcının belirli bir uyarısını sil.")
    .addUserOption(o => o.setName("kullanici").setDescription("Kullanıcı").setRequired(true))
    .addIntegerOption(o => o.setName("id").setDescription("Uyarı ID'si (/warns ile görüntüle)").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("clearwarn")
    .setDescription("🧹 Kullanıcının tüm uyarılarını temizle.")
    .addUserOption(o => o.setName("kullanici").setDescription("Kullanıcı").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("karaliste")
    .setDescription("🚫 Kullanıcıyı Discord + oyun kara listesine al.")
    .addUserOption(o => o.setName("kullanici").setDescription("Kara listeye eklenecek kullanıcı").setRequired(true))
    .addStringOption(o => o.setName("sebep").setDescription("Kara liste sebebi (hile vs.)").setRequired(true))
    .addStringOption(o => o.setName("kanit").setDescription("Kanıt linki").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("sustur")
    .setDescription("🔇 Kullanıcıyı sustur (Alias: /mute).")
    .addUserOption(o => o.setName("kullanici").setDescription("Susturulacak kullanıcı").setRequired(true))
    .addStringOption(o => o.setName("sure").setDescription("Süre (ör: 10m, 1h, 2d)").setRequired(true))
    .addStringOption(o => o.setName("sebep").setDescription("Susturma sebebi").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("purge")
    .setDescription("🧹 Kanaldan toplu mesaj sil.")
    .addIntegerOption(o => o.setName("miktar").setDescription("Silinecek mesaj sayısı (1-100)").setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o => o.setName("kullanici").setDescription("Belirli kullanıcının mesajlarını sil (isteğe bağlı)").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("⏱️ Kanalın yavaş modunu ayarla.")
    .addIntegerOption(o => o.setName("saniye").setDescription("Saniye (0 = kapat, max 21600)").setRequired(true).setMinValue(0).setMaxValue(21600))
    .addChannelOption(o => o.setName("kanal").setDescription("Kanal (boş = şu anki kanal)").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("kilit")
    .setDescription("🔒 Kanalı kilitle (mesaj gönderimi kapat).")
    .addChannelOption(o => o.setName("kanal").setDescription("Kanal (boş = şu anki)").setRequired(false))
    .addStringOption(o => o.setName("sebep").setDescription("Kilit sebebi").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("kiliti-ac")
    .setDescription("🔓 Kanalın kilidini aç.")
    .addChannelOption(o => o.setName("kanal").setDescription("Kanal (boş = şu anki)").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("mod-kayit")
    .setDescription("📊 Yetkililerin moderasyon kayıtlarını görüntüle.")
    .addUserOption(o => o.setName("yetkili").setDescription("Yetkili (boş = tüm yetkililer)").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("👤 Kullanıcı bilgilerini göster.")
    .addUserOption(o => o.setName("kullanici").setDescription("Kullanıcı (boş = kendin)").setRequired(false)),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("🏰 Sunucu bilgilerini göster."),

  new SlashCommandBuilder()
    .setName("rol-ver")
    .setDescription("🎭 Kullanıcıya rol ver.")
    .addUserOption(o => o.setName("kullanici").setDescription("Kullanıcı").setRequired(true))
    .addRoleOption(o => o.setName("rol").setDescription("Verilecek rol").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("rol-al")
    .setDescription("🎭 Kullanıcıdan rol al.")
    .addUserOption(o => o.setName("kullanici").setDescription("Kullanıcı").setRequired(true))
    .addRoleOption(o => o.setName("rol").setDescription("Alınacak rol").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("duyuru")
    .setDescription("📣 Duyuru kanalına özel mesaj gönder.")
    .addStringOption(o => o.setName("mesaj").setDescription("Duyuru metni").setRequired(true))
    .addBooleanOption(o => o.setName("etiketle").setDescription("@everyone etiketlesin mi?").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.MentionEveryone),

].map(cmd => cmd.toJSON());

// ─────────────────────────────────────────────
//  CLIENT OLUŞTUR
// ─────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
});

// Cooldown koleksiyonu
const cooldowns = new Collection();

function checkCooldown(userId, commandName, duration) {
  const key = `${userId}-${commandName}`;
  if (cooldowns.has(key)) {
    const remaining = cooldowns.get(key) - Date.now();
    if (remaining > 0) return remaining;
  }
  cooldowns.set(key, Date.now() + duration);
  setTimeout(() => cooldowns.delete(key), duration);
  return 0;
}

// ─────────────────────────────────────────────
//  READY
// ─────────────────────────────────────────────
client.once("ready", async () => {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log(`║  ✅  ${client.user.tag} aktif!`);
  console.log(`║  📡  ${client.guilds.cache.size} sunucuya bağlı`);
  console.log("╚══════════════════════════════════════════╝\n");

  client.user.setPresence({
    activities: [{ name: `⚔️ CrystalHaven Network | /yardim`, type: 3 }],
    status: "online",
  });

  // Komutları kaydet
  const rest = new REST({ version: "10" }).setToken(CONFIG.TOKEN);
  try {
    await rest.put(Routes.applicationGuildCommands(CONFIG.CLIENT_ID, CONFIG.GUILD_ID), { body: commands });
    console.log(`✅ ${commands.length} slash komutu başarıyla kaydedildi!`);
  } catch (err) {
    console.error("❌ Komut kaydında hata:", err);
  }

  // Çekiliş zamanlayıcısı
  setInterval(checkCekilisEnd, 10000);
});

// ─────────────────────────────────────────────
//  INTERACTION HANDLER
// ─────────────────────────────────────────────
client.on("interactionCreate", async interaction => {
  if (interaction.isChatInputCommand()) {
    await handleSlashCommand(interaction);
  } else if (interaction.isButton()) {
    await handleButton(interaction);
  } else if (interaction.isModalSubmit()) {
    await handleModal(interaction);
  }
});

// ─────────────────────────────────────────────
//  SLASH KOMUT ROUTER
// ─────────────────────────────────────────────
async function handleSlashCommand(interaction) {
  const { commandName } = interaction;

  // Ortak cooldown (3 saniye)
  const cd = checkCooldown(interaction.user.id, commandName, CONFIG.COOLDOWNS.DEFAULT);
  if (cd > 0) {
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(CONFIG.COLORS.WARNING)
        .setDescription(`⏳ Çok hızlı! **${(cd / 1000).toFixed(1)}s** bekle.`)],
      ephemeral: true,
    });
  }

  try {
    switch (commandName) {
      // ─ PvP / Klan ─
      case "klan-bak": return await cmdKlanBak(interaction);
      case "stats": return await cmdStats(interaction);
      case "top-10": return await cmdTop10(interaction);
      case "rutbe-bak": return await cmdRutbeBak(interaction);
      case "en-zenginler": return await cmdEnZenginler(interaction);

      // ─ Ekonomi ─
      case "para": return await cmdPara(interaction);
      case "magaza":
      case "market": return await cmdMagaza(interaction);
      case "gunluk-hediye": return await cmdGunlukHediye(interaction);
      case "kod-kullan": return await cmdKodKullan(interaction);
      case "ihale": return await cmdIhale(interaction);

      // ─ Yönetim ─
      case "aktif": return await cmdAktif(interaction);
      case "bakim": return await cmdBakim(interaction);
      case "oyuncu-sayisi": return await cmdOyuncuSayisi(interaction);

      // ─ Etkinlik ─
      case "oneri": return await cmdOneri(interaction);
      case "cekilis-baslat": return await cmdCekilisBaslat(interaction);
      case "kasa-ac": return await cmdKasaAc(interaction);
      case "hata-bildir": return await cmdHataBildir(interaction);
      case "yardim": return await cmdYardim(interaction);

      // ─ Moderasyon ─
      case "ban": return await cmdBan(interaction);
      case "unban": return await cmdUnban(interaction);
      case "kick": return await cmdKick(interaction);
      case "mute":
      case "sustur": return await cmdMute(interaction);
      case "unmute": return await cmdUnmute(interaction);
      case "warn": return await cmdWarn(interaction);
      case "warns": return await cmdWarns(interaction);
      case "delwarn": return await cmdDelwarn(interaction);
      case "clearwarn": return await cmdClearwarn(interaction);
      case "karaliste": return await cmdKaraliste(interaction);
      case "purge": return await cmdPurge(interaction);
      case "slowmode": return await cmdSlowmode(interaction);
      case "kilit": return await cmdKilit(interaction);
      case "kiliti-ac": return await cmdKilitiAc(interaction);
      case "mod-kayit": return await cmdModKayit(interaction);
      case "userinfo": return await cmdUserinfo(interaction);
      case "serverinfo": return await cmdServerinfo(interaction);
      case "rol-ver": return await cmdRolVer(interaction);
      case "rol-al": return await cmdRolAl(interaction);
      case "duyuru": return await cmdDuyuru(interaction);
    }
  } catch (err) {
    console.error(`[HATA] /${commandName}:`, err);
    const errEmbed = new EmbedBuilder()
      .setColor(CONFIG.COLORS.ERROR)
      .setDescription("❌ Komut çalıştırılırken bir hata oluştu. Lütfen tekrar dene.");
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [errEmbed], ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ embeds: [errEmbed], ephemeral: true }).catch(() => {});
    }
  }
}

// ═══════════════════════════════════════════════
//  ⚔️  PVP & KLAN KOMUTLARI
// ═══════════════════════════════════════════════

async function cmdKlanBak(interaction) {
  const name = interaction.options.getString("isim");
  const clan = DB.clans.get(name.toLowerCase());
  if (!clan) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription(`❌ **${name}** adlı klan bulunamadı.`)],
      ephemeral: true,
    });
  }
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.PRIMARY)
    .setTitle(`⚔️ ${clan.name}`)
    .setThumbnail("https://i.imgur.com/crystalhaven_clan.png")
    .addFields(
      { name: "👑 Lider", value: clan.leader, inline: true },
      { name: "👥 Üye Sayısı", value: `${clan.members.length}`, inline: true },
      { name: "🏆 Sıralama", value: `#${clan.rank}`, inline: true },
      { name: "⚔️ Toplam Kill", value: `${clan.kills.toLocaleString()}`, inline: true },
      { name: "🧑 Üyeler", value: clan.members.map(m => `• ${m}`).join("\n") || "Yok", inline: false },
    )
    .setFooter({ text: "CrystalHaven Network", iconURL: interaction.guild.iconURL() })
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}

async function cmdStats(interaction) {
  const name = interaction.options.getString("oyuncu");
  const player = DB.players.get(name.toLowerCase());
  if (!player) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription(`❌ **${name}** adlı oyuncu bulunamadı.`)],
      ephemeral: true,
    });
  }
  const kda = calcKDA(player.kills, player.deaths);
  const kdaNum = parseFloat(kda);
  const kdaColor = kdaNum >= 5 ? CONFIG.COLORS.GOLD : kdaNum >= 3 ? CONFIG.COLORS.SUCCESS : kdaNum >= 1.5 ? CONFIG.COLORS.PRIMARY : CONFIG.COLORS.ERROR;

  const embed = new EmbedBuilder()
    .setColor(kdaColor)
    .setTitle(`${getRankEmoji(player.rank)} ${player.name} — İstatistikler`)
    .setDescription(`Rütbe: **${player.rank}** | Klan: **${player.clan || "Klansız"}**`)
    .addFields(
      { name: "⚔️ Kill", value: `\`${player.kills.toLocaleString()}\``, inline: true },
      { name: "💀 Death", value: `\`${player.deaths.toLocaleString()}\``, inline: true },
      { name: "📊 KDA", value: `\`${kda}\``, inline: true },
    )
    .setFooter({ text: "CrystalHaven Network" })
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}

async function cmdTop10(interaction) {
  const sorted = [...DB.players.values()].sort((a, b) => b.kills - a.kills).slice(0, 10);
  const medals = ["🥇", "🥈", "🥉"];
  const desc = sorted.map((p, i) =>
    `${medals[i] || `\`${i + 1}.\``} **${p.name}** — ⚔️ ${p.kills.toLocaleString()} kill | 📊 KDA: ${calcKDA(p.kills, p.deaths)} | ${getRankEmoji(p.rank)}`
  ).join("\n");

  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.GOLD)
    .setTitle("🏆 CrystalHaven — TOP 10 Oyuncu")
    .setDescription(desc)
    .setFooter({ text: "CrystalHaven Network" })
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}

async function cmdRutbeBak(interaction) {
  const current = interaction.options.getString("mevcut");
  const rutbeler = {
    Normal: { next: "VIP", para: 25000, maden: 500, desc: "Temel rütbe. VIP için para & maden biriktir!" },
    VIP: { next: "VIP+", para: 75000, maden: 1500, desc: "VIP özelliklerinin tadını çıkar!" },
    "VIP+": { next: "Efsane", para: 200000, maden: 5000, desc: "Bir adım daha — Efsane olmak için çalış!" },
    Efsane: { next: null, para: 0, maden: 0, desc: "🎉 En yüksek rütbedesin!" },
  };
  const info = rutbeler[current];
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.PURPLE)
    .setTitle(`🎖️ Rütbe Bilgisi — ${current}`)
    .setDescription(info.desc);
  if (info.next) {
    embed.addFields(
      { name: "➡️ Sonraki Rütbe", value: info.next, inline: true },
      { name: "💰 Gereken Para", value: formatMoney(info.para), inline: true },
      { name: "⛏️ Gereken Maden", value: `${info.maden.toLocaleString()} adet`, inline: true },
    );
  }
  embed.setFooter({ text: "CrystalHaven Network" }).setTimestamp();
  await interaction.reply({ embeds: [embed] });
}

async function cmdEnZenginler(interaction) {
  const sorted = [...DB.players.values()].sort((a, b) => b.balance - a.balance).slice(0, 10);
  const medals = ["🥇", "🥈", "🥉"];
  const desc = sorted.map((p, i) =>
    `${medals[i] || `\`${i + 1}.\``} **${p.name}** — ${formatMoney(p.balance)} | ${getRankEmoji(p.rank)}`
  ).join("\n");
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.GOLD)
    .setTitle("💰 CrystalHaven — En Zengin Oyuncular")
    .setDescription(desc)
    .setFooter({ text: "CrystalHaven Network" })
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════
//  💰  EKONOMİ KOMUTLARI
// ═══════════════════════════════════════════════

async function cmdPara(interaction) {
  const name = interaction.options.getString("oyuncu");
  const player = DB.players.get(name.toLowerCase());
  if (!player) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription(`❌ **${name}** bulunamadı.`)],
      ephemeral: true,
    });
  }
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.SUCCESS)
    .setTitle(`💵 ${player.name} — Cüzdan`)
    .addFields(
      { name: "💰 Bakiye", value: formatMoney(player.balance), inline: true },
      { name: "🎖️ Rütbe", value: `${getRankEmoji(player.rank)} ${player.rank}`, inline: true },
    )
    .setFooter({ text: "CrystalHaven Network" })
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}

async function cmdMagaza(interaction) {
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.PRIMARY)
    .setTitle("🛒 CrystalHaven Mağaza")
    .setDescription(`🌐 **${CONFIG.SERVER.STORE}**`)
    .addFields(
      { name: "⭐ VIP (30 Gün)", value: "₺49.99", inline: true },
      { name: "💎 VIP+ (30 Gün)", value: "₺89.99", inline: true },
      { name: "👑 Efsane (30 Gün)", value: "₺149.99", inline: true },
      { name: "🔑 Kasa Anahtarı x1", value: "₺9.99", inline: true },
      { name: "🔑 Kasa Anahtarı x5", value: "₺39.99 (%20 indirim)", inline: true },
      { name: "🔑 Kasa Anahtarı x10", value: "₺69.99 (%30 indirim)", inline: true },
    )
    .setFooter({ text: "Güvenli ödeme için sadece resmi site kullanın!" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel("🛒 Mağazaya Git").setStyle(ButtonStyle.Link).setURL(CONFIG.SERVER.STORE),
    new ButtonBuilder().setLabel("🌐 Web Sitesi").setStyle(ButtonStyle.Link).setURL(CONFIG.SERVER.WEBSITE),
  );
  await interaction.reply({ embeds: [embed], components: [row] });
}

async function cmdGunlukHediye(interaction) {
  const userId = interaction.user.id;
  const cd = checkCooldown(userId, "gunluk-hediye", CONFIG.COOLDOWNS.GUNLUK_HEDIYE);
  if (cd > 0) {
    const nextTime = Math.floor((Date.now() + cd) / 1000);
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(CONFIG.COLORS.WARNING)
        .setDescription(`⏳ Günlük hediyeni zaten aldın! Bir sonraki: <t:${nextTime}:R>`)],
      ephemeral: true,
    });
  }
  const rewards = ["Kasa Anahtarı x1 🔑", "500 Coin 💰", "Kasa Anahtarı x2 🔑", "1000 Coin 💰", "VIP (1 Gün) ⭐", "Özel Efekt (24s) ✨"];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.GOLD)
    .setTitle("🎁 Günlük Hediye!")
    .setDescription(`${interaction.user} **${reward}** kazandı!`)
    .setFooter({ text: "Yarın tekrar gelebilirsin! | CrystalHaven Network" })
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}

async function cmdKodKullan(interaction) {
  const code = interaction.options.getString("kod").toUpperCase();
  const codeData = DB.codes.get(code);
  if (!codeData || !codeData.active) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription("❌ Geçersiz veya süresi dolmuş kod.")],
      ephemeral: true,
    });
  }
  if (codeData.uses >= codeData.maxUses) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription("❌ Bu kodun kullanım limiti doldu.")],
      ephemeral: true,
    });
  }
  codeData.uses++;
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.SUCCESS)
    .setTitle("🎟️ Kod Kullanıldı!")
    .setDescription(`✅ **${code}** kodu başarıyla kullanıldı!`)
    .addFields({ name: "🎁 Ödül", value: codeData.reward })
    .setFooter({ text: "CrystalHaven Network" })
    .setTimestamp();
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function cmdIhale(interaction) {
  const item = interaction.options.getString("item");
  const price = interaction.options.getInteger("fiyat");
  const aciklama = interaction.options.getString("aciklama") || "Açıklama yok.";

  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.GOLD)
    .setTitle("📦 Yeni İhale İlanı!")
    .addFields(
      { name: "🎯 Item", value: item, inline: true },
      { name: "💰 Başlangıç Fiyatı", value: formatMoney(price), inline: true },
      { name: "👤 Satıcı", value: interaction.user.toString(), inline: true },
      { name: "📝 Açıklama", value: aciklama },
    )
    .setFooter({ text: "Teklif vermek için satıcıyla iletişime geç." })
    .setTimestamp();

  const ihale_ch = interaction.guild.channels.cache.get(CONFIG.CHANNELS.IHALE);
  if (ihale_ch) await ihale_ch.send({ embeds: [embed] });

  await interaction.reply({
    embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.SUCCESS).setDescription(`✅ İhaleniz <#${CONFIG.CHANNELS.IHALE}> kanalına gönderildi!`)],
    ephemeral: true,
  });
}

// ═══════════════════════════════════════════════
//  🛡️  YÖNETİM KOMUTLARI
// ═══════════════════════════════════════════════

async function cmdAktif(interaction) {
  const not = interaction.options.getString("not") || "";
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.SUCCESS)
    .setTitle("✅ Sunucu Açıldı!")
    .setDescription(`@everyone **CrystalHaven Network** sunucusu açıldı! ⚔️\n\n🌐 **IP:** \`${CONFIG.SERVER.IP}\`\n🔌 **Port:** \`${CONFIG.SERVER.PORT}\`\n📦 **Versiyon:** ${CONFIG.SERVER.VERSION}${not ? `\n\n📝 **Not:** ${not}` : ""}`)
    .setThumbnail(interaction.guild.iconURL())
    .setFooter({ text: "CrystalHaven Network — BoxPvP" })
    .setTimestamp();

  const duyuruCh = interaction.guild.channels.cache.get(CONFIG.CHANNELS.DUYURU);
  if (duyuruCh) await duyuruCh.send({ content: "@everyone", embeds: [embed] });

  await interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.SUCCESS).setDescription("✅ Aktif duyurusu yapıldı!")], ephemeral: true });
}

async function cmdBakim(interaction) {
  const sure = interaction.options.getString("sure") || "Belirtilmedi";
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.WARNING)
    .setTitle("🔧 Sunucu Bakıma Alındı")
    .setDescription(`⚙️ **CrystalHaven Network** bakım çalışması başladı.\n\n⏱️ **Tahmini Süre:** ${sure}\n\nBakım bitince duyurulacaktır. Sabırlı olun! 💙`)
    .setFooter({ text: "CrystalHaven Network" })
    .setTimestamp();

  const duyuruCh = interaction.guild.channels.cache.get(CONFIG.CHANNELS.DUYURU);
  if (duyuruCh) await duyuruCh.send({ embeds: [embed] });

  await interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.SUCCESS).setDescription("✅ Bakım duyurusu yapıldı!")], ephemeral: true });
}

async function cmdOyuncuSayisi(interaction) {
  const count = Math.floor(Math.random() * 80) + 20; // gerçek projede API'den çek
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.PRIMARY)
    .setTitle("👥 Anlık Oyuncu Sayısı")
    .setDescription(`🟢 Şu an **${count}** oyuncu aktif!\n\n🌐 IP: \`${CONFIG.SERVER.IP}\``)
    .setFooter({ text: "CrystalHaven Network" })
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════
//  🎁  ETKİNLİK KOMUTLARI
// ═══════════════════════════════════════════════

async function cmdOneri(interaction) {
  const cd = checkCooldown(interaction.user.id, "oneri", CONFIG.COOLDOWNS.ONERI);
  if (cd > 0) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.WARNING).setDescription(`⏳ ${(cd / 1000).toFixed(0)}s bekle.`)],
      ephemeral: true,
    });
  }
  const mesaj = interaction.options.getString("mesaj");
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.INFO)
    .setTitle("💡 Yeni Öneri")
    .setDescription(mesaj)
    .addFields({ name: "👤 Öneren", value: interaction.user.toString(), inline: true })
    .setFooter({ text: "Oylama için ✅/❌ kullanın" })
    .setTimestamp();

  const oneriCh = interaction.guild.channels.cache.get(CONFIG.CHANNELS.ONERI);
  if (oneriCh) {
    const msg = await oneriCh.send({ embeds: [embed] });
    await msg.react("✅");
    await msg.react("❌");
  }
  await interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.SUCCESS).setDescription("✅ Öneriniz gönderildi!")], ephemeral: true });
}

async function cmdCekilisBaslat(interaction) {
  const cd = checkCooldown(interaction.user.id, "cekilis-baslat", CONFIG.COOLDOWNS.CEKILIS);
  if (cd > 0) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.WARNING).setDescription(`⏳ ${(cd / 1000).toFixed(0)}s bekle.`)],
      ephemeral: true,
    });
  }
  const odul = interaction.options.getString("odul");
  const sureStr = interaction.options.getString("sure");
  const kazanan = interaction.options.getInteger("kazanan") || 1;
  const surems = parseDuration(sureStr);
  if (!surems) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription("❌ Geçersiz süre formatı. Örnek: `30m`, `1h`, `2d`")],
      ephemeral: true,
    });
  }
  const endTime = Date.now() + surems;
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.GOLD)
    .setTitle("🎉 ÇEKİLİŞ BAŞLADI!")
    .setDescription(`🎁 **Ödül:** ${odul}\n\n🎟️ Katılmak için 🎉 emojisine tıkla!\n👑 **${kazanan}** kişi kazanacak!\n⏰ Bitiş: <t:${Math.floor(endTime / 1000)}:R>`)
    .setFooter({ text: `Düzenleyen: ${interaction.user.tag}` })
    .setTimestamp();

  const cekilishCh = interaction.guild.channels.cache.get(CONFIG.CHANNELS.CEKILIS) || interaction.channel;
  const msg = await cekilishCh.send({ embeds: [embed] });
  await msg.react("🎉");

  DB.cekilis = { messageId: msg.id, channelId: cekilishCh.id, odul, endTime, kazanan, guild: interaction.guild.id };

  await interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.SUCCESS).setDescription(`✅ Çekiliş <#${cekilishCh.id}>'da başlatıldı!`)], ephemeral: true });
}

async function checkCekilisEnd() {
  if (!DB.cekilis) return;
  if (Date.now() < DB.cekilis.endTime) return;
  try {
    const guild = client.guilds.cache.get(DB.cekilis.guild);
    const ch = guild?.channels.cache.get(DB.cekilis.channelId);
    const msg = await ch?.messages.fetch(DB.cekilis.messageId);
    if (!msg) { DB.cekilis = null; return; }
    const reaction = msg.reactions.cache.get("🎉");
    const users = (await reaction?.users.fetch())?.filter(u => !u.bot);
    if (!users || users.size === 0) {
      await ch.send({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setTitle("🎉 Çekiliş Bitti").setDescription("❌ Yeterli katılımcı yok, çekiliş iptal edildi.")] });
    } else {
      const winners = users.random(Math.min(DB.cekilis.kazanan, users.size));
      const winnerMentions = (Array.isArray(winners) ? winners : [winners]).map(u => u.toString()).join(", ");
      await ch.send({
        content: winnerMentions,
        embeds: [new EmbedBuilder()
          .setColor(CONFIG.COLORS.GOLD)
          .setTitle("🎉 Çekiliş Bitti!")
          .setDescription(`🏆 Kazananlar: ${winnerMentions}\n🎁 Ödül: **${DB.cekilis.odul}**`)
          .setTimestamp()],
      });
    }
    DB.cekilis = null;
  } catch (e) {
    DB.cekilis = null;
  }
}

async function cmdKasaAc(interaction) {
  const items = [
    { name: "💎 Elmas Kılıç", rarity: "Efsane", color: CONFIG.COLORS.PURPLE },
    { name: "🛡️ Kristal Zırh", rarity: "Nadir", color: CONFIG.COLORS.PRIMARY },
    { name: "⚡ Şimşek Ok", rarity: "Nadir", color: CONFIG.COLORS.PRIMARY },
    { name: "💰 2000 Coin", rarity: "Sıradan", color: CONFIG.COLORS.SUCCESS },
    { name: "🔑 Kasa Anahtarı", rarity: "Sıradan", color: CONFIG.COLORS.SUCCESS },
    { name: "🧪 Hız İksiri", rarity: "Yaygın", color: CONFIG.COLORS.INFO },
    { name: "💣 Bomba x5", rarity: "Yaygın", color: CONFIG.COLORS.INFO },
    { name: "🪙 50 Coin", rarity: "Yaygın", color: CONFIG.COLORS.INFO },
  ];
  const weights = [3, 8, 8, 20, 15, 20, 16, 10];
  let rand = Math.random() * weights.reduce((a, b) => a + b, 0), item = items[items.length - 1];
  for (let i = 0; i < items.length; i++) { rand -= weights[i]; if (rand <= 0) { item = items[i]; break; } }
  const embed = new EmbedBuilder()
    .setColor(item.color)
    .setTitle("🎰 Kasa Açıldı!")
    .setDescription(`> **${item.name}**\n> Nadirlik: \`${item.rarity}\``)
    .setFooter({ text: "Bu sanal bir kasa açma simülasyonudur." })
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}

async function cmdHataBildir(interaction) {
  const aciklama = interaction.options.getString("aciklama");
  const gorsel = interaction.options.getString("gorsel") || "Yok";
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.ERROR)
    .setTitle("🐛 Yeni Hata Bildirimi")
    .addFields(
      { name: "👤 Bildiren", value: interaction.user.toString(), inline: true },
      { name: "📅 Tarih", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
      { name: "📝 Açıklama", value: aciklama },
      { name: "📸 Görsel", value: gorsel },
    )
    .setFooter({ text: "CrystalHaven Bug Tracker" })
    .setTimestamp();

  const hataCh = interaction.guild.channels.cache.get(CONFIG.CHANNELS.HATA);
  if (hataCh) await hataCh.send({ embeds: [embed] });
  await interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.SUCCESS).setDescription("✅ Hata bildirimin alındı, incelenecek!")], ephemeral: true });
}

async function cmdYardim(interaction) {
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.PRIMARY)
    .setTitle("📖 CrystalHaven Network — Komut Listesi")
    .setDescription("Aşağıda tüm bot komutları listelenmiştir.")
    .addFields(
      { name: "⚔️ BoxPvP & Klan", value: "`/klan-bak` `/stats` `/top-10` `/rutbe-bak` `/en-zenginler`" },
      { name: "💰 Ekonomi & Mağaza", value: "`/para` `/magaza` `/market` `/gunluk-hediye` `/kod-kullan` `/ihale`" },
      { name: "📢 Sunucu Yönetim", value: "`/aktif` `/bakim` `/oyuncu-sayisi` *(Yetkili)*" },
      { name: "🎁 Etkinlik & Topluluk", value: "`/oneri` `/cekilis-baslat` `/kasa-ac` `/hata-bildir`" },
      { name: "🔨 Moderasyon", value: "`/ban` `/unban` `/kick` `/mute` `/unmute` `/warn` `/warns` `/delwarn` `/clearwarn` `/karaliste` `/sustur` `/purge` `/slowmode` `/kilit` `/kiliti-ac` `/rol-ver` `/rol-al` `/duyuru`" },
      { name: "ℹ️ Bilgi", value: "`/userinfo` `/serverinfo` `/mod-kayit`" },
    )
    .setFooter({ text: `CrystalHaven Network | ${CONFIG.SERVER.DISCORD_INVITE}` })
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════
//  🔨  MODERASYON KOMUTLARI
// ═══════════════════════════════════════════════

async function cmdBan(interaction) {
  const target = interaction.options.getUser("kullanici");
  const sebep = interaction.options.getString("sebep") || "Sebep belirtilmedi.";
  const mesajSil = interaction.options.getBoolean("mesajsil") ?? false;
  const member = interaction.guild.members.cache.get(target.id);

  if (member) {
    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription("❌ Bu kullanıcıyı banlayamazsın (daha yüksek ya da eşit rol).")], ephemeral: true });
    }
    if (!member.bannable) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription("❌ Bu kullanıcı banlanamaz.")], ephemeral: true });
    }
  }

  try {
    await interaction.guild.members.ban(target.id, { reason: sebep, deleteMessageSeconds: mesajSil ? 604800 : 0 });
  } catch {
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription("❌ Kullanıcı banlanamadı.")], ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.ERROR)
    .setTitle("🔨 Kullanıcı Banlandı")
    .addFields(
      { name: "👤 Kullanıcı", value: `${target.tag} (${target.id})`, inline: true },
      { name: "👮 Yetkili", value: interaction.user.toString(), inline: true },
      { name: "📝 Sebep", value: sebep },
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
  await sendLog(interaction.guild, embed);
}

async function cmdUnban(interaction) {
  const userId = interaction.options.getString("userid");
  const sebep = interaction.options.getString("sebep") || "Sebep belirtilmedi.";
  try {
    await interaction.guild.members.unban(userId, sebep);
  } catch {
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription("❌ Bu ID'ye ait banlı bir kullanıcı bulunamadı.")], ephemeral: true });
  }
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.SUCCESS)
    .setTitle("✅ Ban Kaldırıldı")
    .addFields(
      { name: "🆔 Kullanıcı ID", value: userId, inline: true },
      { name: "👮 Yetkili", value: interaction.user.toString(), inline: true },
      { name: "📝 Sebep", value: sebep },
    )
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
  await sendLog(interaction.guild, embed);
}

async function cmdKick(interaction) {
  const target = interaction.options.getUser("kullanici");
  const sebep = interaction.options.getString("sebep") || "Sebep belirtilmedi.";
  const member = interaction.guild.members.cache.get(target.id);
  if (!member) return interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription("❌ Kullanıcı sunucuda değil.")], ephemeral: true });
  if (member.roles.highest.position >= interaction.member.roles.highest.position) {
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription("❌ Bu kullanıcıyı atamazsın.")], ephemeral: true });
  }
  if (!member.kickable) return interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription("❌ Bu kullanıcı atılamaz.")], ephemeral: true });
  await member.kick(sebep);
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.WARNING)
    .setTitle("👢 Kullanıcı Atıldı")
    .addFields(
      { name: "👤 Kullanıcı", value: `${target.tag}`, inline: true },
      { name: "👮 Yetkili", value: interaction.user.toString(), inline: true },
      { name: "📝 Sebep", value: sebep },
    )
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
  await sendLog(interaction.guild, embed);
}

async function cmdMute(interaction) {
  const target = interaction.options.getUser("kullanici");
  const sureStr = interaction.options.getString("sure");
  const sebep = interaction.options.getString("sebep") || "Sebep belirtilmedi.";
  const member = interaction.guild.members.cache.get(target.id);
  if (!member) return interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription("❌ Kullanıcı bulunamadı.")], ephemeral: true });

  const surems = parseDuration(sureStr);
  if (!surems) return interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription("❌ Geçersiz süre. Örnek: `10m`, `1h`, `2d`")], ephemeral: true });
  if (surems > 2419200000) return interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription("❌ Maksimum timeout süresi 28 gündür.")], ephemeral: true });

  try {
    await member.timeout(surems, sebep);
  } catch {
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription("❌ Kullanıcı susturulamadı.")], ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.WARNING)
    .setTitle("🔇 Kullanıcı Susturuldu")
    .addFields(
      { name: "👤 Kullanıcı", value: target.toString(), inline: true },
      { name: "👮 Yetkili", value: interaction.user.toString(), inline: true },
      { name: "⏱️ Süre", value: formatDuration(surems), inline: true },
      { name: "📝 Sebep", value: sebep },
    )
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
  await sendLog(interaction.guild, embed);
}

async function cmdUnmute(interaction) {
  const target = interaction.options.getUser("kullanici");
  const sebep = interaction.options.getString("sebep") || "Sebep belirtilmedi.";
  const member = interaction.guild.members.cache.get(target.id);
  if (!member) return interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription("❌ Kullanıcı bulunamadı.")], ephemeral: true });
  await member.timeout(null, sebep);
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.SUCCESS)
    .setTitle("🔊 Susturma Kaldırıldı")
    .addFields(
      { name: "👤 Kullanıcı", value: target.toString(), inline: true },
      { name: "👮 Yetkili", value: interaction.user.toString(), inline: true },
      { name: "📝 Sebep", value: sebep },
    )
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
  await sendLog(interaction.guild, embed);
}

async function cmdWarn(interaction) {
  const target = interaction.options.getUser("kullanici");
  const sebep = interaction.options.getString("sebep");
  if (!DB.warnings.has(target.id)) DB.warnings.set(target.id, []);
  const userWarns = DB.warnings.get(target.id);
  const warnId = userWarns.length + 1;
  userWarns.push({ id: warnId, sebep, yetkili: interaction.user.id, tarih: Date.now() });

  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.WARNING)
    .setTitle("⚠️ Uyarı Verildi")
    .addFields(
      { name: "👤 Kullanıcı", value: target.toString(), inline: true },
      { name: "👮 Yetkili", value: interaction.user.toString(), inline: true },
      { name: "🆔 Uyarı #", value: `${warnId}`, inline: true },
      { name: "📝 Sebep", value: sebep },
      { name: "📊 Toplam Uyarı", value: `${userWarns.length}`, inline: true },
    )
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
  await sendLog(interaction.guild, embed);

  // 3 uyarıda otomatik mute
  if (userWarns.length >= 3) {
    const member = interaction.guild.members.cache.get(target.id);
    if (member?.moderatable) {
      await member.timeout(3600000, "3 uyarı limitine ulaşıldı.");
      await interaction.followUp({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription(`⚠️ ${target} 3 uyarı limitine ulaştı, 1 saat mute uygulandı!`)] });
    }
  }
}

async function cmdWarns(interaction) {
  const target = interaction.options.getUser("kullanici");
  const warns = DB.warnings.get(target.id) || [];
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.WARNING)
    .setTitle(`⚠️ ${target.tag} — Uyarı Geçmişi`)
    .setDescription(warns.length === 0 ? "✅ Uyarı kaydı bulunmuyor." : warns.map(w => `**#${w.id}** — ${w.sebep} | <t:${Math.floor(w.tarih / 1000)}:R>`).join("\n"))
    .addFields({ name: "📊 Toplam", value: `${warns.length} uyarı`, inline: true })
    .setTimestamp();
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function cmdDelwarn(interaction) {
  const target = interaction.options.getUser("kullanici");
  const warnId = interaction.options.getInteger("id");
  const warns = DB.warnings.get(target.id) || [];
  const idx = warns.findIndex(w => w.id === warnId);
  if (idx === -1) return interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription("❌ Bu ID'ye sahip uyarı bulunamadı.")], ephemeral: true });
  warns.splice(idx, 1);
  await interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.SUCCESS).setDescription(`✅ ${target} kullanıcısının **#${warnId}** numaralı uyarısı silindi.`)], ephemeral: true });
}

async function cmdClearwarn(interaction) {
  const target = interaction.options.getUser("kullanici");
  DB.warnings.delete(target.id);
  await interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.SUCCESS).setDescription(`✅ ${target} kullanıcısının tüm uyarıları temizlendi.`)], ephemeral: true });
}

async function cmdKaraliste(interaction) {
  const target = interaction.options.getUser("kullanici");
  const sebep = interaction.options.getString("sebep");
  const kanit = interaction.options.getString("kanit") || "Kanıt yok";

  const member = interaction.guild.members.cache.get(target.id);
  if (member) {
    try { await member.ban({ reason: `[KARA LİSTE] ${sebep}` }); } catch {}
  }
  DB.bans.set(target.id, { sebep, kanit, tarih: Date.now(), yetkili: interaction.user.id, kara: true });

  const embed = new EmbedBuilder()
    .setColor(0x000000)
    .setTitle("🚫 Kara Listeye Eklendi!")
    .setDescription(`**${target.tag}** hem Discord'dan hem oyun sunucusundan kara listeye alındı.`)
    .addFields(
      { name: "👤 Kullanıcı", value: `${target.tag} (${target.id})`, inline: true },
      { name: "👮 Yetkili", value: interaction.user.toString(), inline: true },
      { name: "📝 Sebep", value: sebep },
      { name: "🔗 Kanıt", value: kanit },
    )
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
  await sendLog(interaction.guild, embed);
}

async function cmdPurge(interaction) {
  const miktar = interaction.options.getInteger("miktar");
  const filterUser = interaction.options.getUser("kullanici");
  await interaction.deferReply({ ephemeral: true });

  let messages = await interaction.channel.messages.fetch({ limit: 100 });
  if (filterUser) messages = messages.filter(m => m.author.id === filterUser.id);
  messages = [...messages.values()].slice(0, miktar);

  const deleted = await interaction.channel.bulkDelete(messages, true);
  await interaction.editReply({
    embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.SUCCESS).setDescription(`🧹 **${deleted.size}** mesaj silindi.${filterUser ? ` (${filterUser.tag} tarafından yazılanlar)` : ""}`)],
  });
}

async function cmdSlowmode(interaction) {
  const saniye = interaction.options.getInteger("saniye");
  const kanal = interaction.options.getChannel("kanal") || interaction.channel;
  await kanal.setRateLimitPerUser(saniye, `Slowmode | ${interaction.user.tag}`);
  const msg = saniye === 0 ? "🔊 Yavaş mod kapatıldı." : `⏱️ Yavaş mod **${saniye} saniye** olarak ayarlandı.`;
  await interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.SUCCESS).setDescription(`${msg} (${kanal})`)], ephemeral: true });
}

async function cmdKilit(interaction) {
  const kanal = interaction.options.getChannel("kanal") || interaction.channel;
  const sebep = interaction.options.getString("sebep") || "Sebep belirtilmedi.";
  await kanal.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription(`🔒 <#${kanal.id}> kilitlendi. **Sebep:** ${sebep}`);
  await interaction.reply({ embeds: [embed] });
  await sendLog(interaction.guild, embed);
}

async function cmdKilitiAc(interaction) {
  const kanal = interaction.options.getChannel("kanal") || interaction.channel;
  await kanal.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
  await interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.SUCCESS).setDescription(`🔓 <#${kanal.id}> kilidi açıldı.`)] });
}

async function cmdModKayit(interaction) {
  await interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.INFO).setDescription("📊 Moderasyon kayıtları log kanalından görüntülenebilir. Gelecek sürümde DB entegrasyonu yapılacak.")], ephemeral: true });
}

async function cmdUserinfo(interaction) {
  const target = interaction.options.getUser("kullanici") || interaction.user;
  const member = interaction.guild.members.cache.get(target.id);
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.PRIMARY)
    .setTitle(`👤 ${target.tag}`)
    .setThumbnail(target.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: "🆔 ID", value: target.id, inline: true },
      { name: "📅 Hesap Oluşturma", value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
      { name: "📅 Sunucuya Katılma", value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "Bilinmiyor", inline: true },
      { name: "🎭 En Yüksek Rol", value: member?.roles.highest.toString() || "Yok", inline: true },
      { name: "⚠️ Uyarı Sayısı", value: `${(DB.warnings.get(target.id) || []).length}`, inline: true },
    )
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}

async function cmdServerinfo(interaction) {
  const g = interaction.guild;
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.PRIMARY)
    .setTitle(`🏰 ${g.name}`)
    .setThumbnail(g.iconURL({ dynamic: true }))
    .addFields(
      { name: "🆔 ID", value: g.id, inline: true },
      { name: "👑 Sahip", value: `<@${g.ownerId}>`, inline: true },
      { name: "👥 Üye Sayısı", value: `${g.memberCount}`, inline: true },
      { name: "📅 Oluşturulma", value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
      { name: "💎 Boost", value: `Seviye ${g.premiumTier} (${g.premiumSubscriptionCount} boost)`, inline: true },
    )
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}

async function cmdRolVer(interaction) {
  const target = interaction.options.getMember("kullanici");
  const rol = interaction.options.getRole("rol");
  if (!target) return interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription("❌ Kullanıcı bulunamadı.")], ephemeral: true });
  if (rol.position >= interaction.member.roles.highest.position) {
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription("❌ Bu rolü veremezsin (daha yüksek).")], ephemeral: true });
  }
  await target.roles.add(rol);
  await interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.SUCCESS).setDescription(`✅ ${target} kullanıcısına ${rol} rolü verildi.`)] });
}

async function cmdRolAl(interaction) {
  const target = interaction.options.getMember("kullanici");
  const rol = interaction.options.getRole("rol");
  if (!target) return interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription("❌ Kullanıcı bulunamadı.")], ephemeral: true });
  await target.roles.remove(rol);
  await interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.SUCCESS).setDescription(`✅ ${target} kullanıcısından ${rol} rolü alındı.`)] });
}

async function cmdDuyuru(interaction) {
  const mesaj = interaction.options.getString("mesaj");
  const etiketle = interaction.options.getBoolean("etiketle") ?? false;
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.PRIMARY)
    .setTitle("📣 Duyuru")
    .setDescription(mesaj)
    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
    .setTimestamp();
  const duyuruCh = interaction.guild.channels.cache.get(CONFIG.CHANNELS.DUYURU) || interaction.channel;
  await duyuruCh.send({ content: etiketle ? "@everyone" : "", embeds: [embed] });
  await interaction.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.SUCCESS).setDescription("✅ Duyuru gönderildi!")], ephemeral: true });
}

// ─────────────────────────────────────────────
//  BUTTON HANDLER
// ─────────────────────────────────────────────
async function handleButton(interaction) {
  // Gelecek sürümde genişletilebilir
}

async function handleModal(interaction) {
  // Gelecek sürümde genişletilebilir
}

// ─────────────────────────────────────────────
//  HATA YÖNETİMİ
// ─────────────────────────────────────────────
process.on("unhandledRejection", err => console.error("[UnhandledRejection]", err));
process.on("uncaughtException", err => console.error("[UncaughtException]", err));

// ─────────────────────────────────────────────
//  BOTU BAŞLAT
// ─────────────────────────────────────────────
client.login(CONFIG.TOKEN);
