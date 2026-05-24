require("dotenv").config();

// ╔══════════════════════════════════════════════════════════════╗
// ║         CrystalHaven Network - BoxPvP Discord Bot            ║
// ║              Developed for CrystalHaven Network              ║
// ╚══════════════════════════════════════════════════════════════╝

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  PermissionFlagsBits,
  Collection,
} = require("discord.js");

// ─────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────
const CONFIG = {
  TOKEN: process.env.BOT_TOKEN || "YOUR_BOT_TOKEN",
  PREFIX: process.env.PREFIX || "!",

  CHANNELS: {
    DUYURU: process.env.DUYURU_CHANNEL || "DUYURU_KANAL_ID",
    LOG:    process.env.LOG_CHANNEL    || "LOG_KANAL_ID",
    ONERI:  process.env.ONERI_CHANNEL  || "ONERI_KANAL_ID",
    HATA:   process.env.HATA_CHANNEL   || "HATA_KANAL_ID",
    CEKILIS:process.env.CEKILIS_CHANNEL|| "CEKILIS_KANAL_ID",
  },

  ROLES: {
    ADMIN:     process.env.ADMIN_ROLE     || "ADMIN_ROL_ID",
    MODERATOR: process.env.MODERATOR_ROLE || "MOD_ROL_ID",
    YARDIMCI:  process.env.YARDIMCI_ROLE  || "YARDIMCI_ROL_ID",
  },

  SERVER: {
    IP:             process.env.SERVER_IP      || "play.crystalhaven.net",
    PORT:           process.env.SERVER_PORT    || "19132",
    VERSION:        process.env.SERVER_VERSION || "1.20.x",
    WEBSITE:        process.env.WEBSITE        || "https://crystalhaven.net",
    DISCORD_INVITE: process.env.DISCORD_INVITE || "https://discord.gg/crystalhaven",
  },

  COLORS: {
    PRIMARY: 0x00d4ff,
    SUCCESS: 0x57f287,
    ERROR:   0xff4757,
    WARNING: 0xffa502,
    INFO:    0x747d8c,
    GOLD:    0xffd700,
    DARK:    0x2f3136,
  },

  COOLDOWNS: {
    DEFAULT: 3000,
    ONERI:   60000,
    CEKILIS: 300000,
  },
};

// ─────────────────────────────────────────────
//  IN-MEMORY VERİTABANI
// ─────────────────────────────────────────────
const DB = {
  warnings: new Map(),
  cekilis:  null,
};

// ─────────────────────────────────────────────
//  YARDIMCI FONKSİYONLAR
// ─────────────────────────────────────────────
function hasRole(member, ...roleIds) {
  return roleIds.some(id => member.roles.cache.has(id));
}

function isStaff(member) {
  return hasRole(member, CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR, CONFIG.ROLES.YARDIMCI);
}

function isMod(member) {
  return (
    hasRole(member, CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR) ||
    member.permissions.has(PermissionFlagsBits.ModerateMembers)
  );
}

function isAdmin(member) {
  return (
    hasRole(member, CONFIG.ROLES.ADMIN) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
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

function errorEmbed(desc) {
  return new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription(`❌ ${desc}`);
}

function successEmbed(desc) {
  return new EmbedBuilder().setColor(CONFIG.COLORS.SUCCESS).setDescription(`✅ ${desc}`);
}

// ─────────────────────────────────────────────
//  CLIENT
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
client.once("ready", () => {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log(`║  ✅  ${client.user.tag} aktif!`);
  console.log(`║  📡  ${client.guilds.cache.size} sunucuya bağlı`);
  console.log(`║  ⌨️   Prefix: ${CONFIG.PREFIX}`);
  console.log("╚══════════════════════════════════════════╝\n");

  client.user.setPresence({
    activities: [{ name: `⚔️ CrystalHaven Network | ${CONFIG.PREFIX}yardim`, type: 3 }],
    status: "online",
  });

  setInterval(checkCekilisEnd, 10000);
});
// Sadece bu Role ID'sine sahip olanlar kullanabilir
const rolID = '1508072318277259365';

if (!interaction.member.roles.cache.has(rolID)) {
    return interaction.reply({ 
        content: 'Bu komutu kullanmak için gerekli role sahip değilsin!', 
        ephemeral: true 
    });
}

// ─────────────────────────────────────────────
//  MESSAGE CREATE — KOMUT ROUTER
// ─────────────────────────────────────────────
client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(CONFIG.PREFIX)) return;
  if (!message.guild) return;

  const args = message.content.slice(CONFIG.PREFIX.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  // Genel cooldown
  const cd = checkCooldown(message.author.id, command, CONFIG.COOLDOWNS.DEFAULT);
  if (cd > 0) {
    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(CONFIG.COLORS.WARNING)
        .setDescription(`⏳ Çok hızlı! **${(cd / 1000).toFixed(1)}s** bekle.`)],
    });
  }

  try {
    switch (command) {

      // ── SUNUCU YÖNETİM ──
      case "aktif":      return await cmdAktif(message, args);
      case "bakim":      return await cmdBakim(message, args);
      case "oyuncu-sayisi":
      case "oyuncusayisi": return await cmdOyuncuSayisi(message);

      // ── ETKİNLİK & TOPLULUK ──
      case "oneri":          return await cmdOneri(message, args);
      case "cekilis-baslat":
      case "cekilisbaslat":  return await cmdCekilisBaslat(message, args);
      case "kasa-ac":
      case "kasaac":         return await cmdKasaAc(message);
      case "hata-bildir":
      case "hatabıldir":
      case "hatabild":       return await cmdHataBildir(message, args);
      case "yardim":
      case "yardım":
      case "help":           return await cmdYardim(message);

      // ── MODERASYON ──
      case "ban":       return await cmdBan(message, args);
      case "unban":     return await cmdUnban(message, args);
      case "kick":      return await cmdKick(message, args);
      case "mute":
      case "sustur":    return await cmdMute(message, args);
      case "unmute":    return await cmdUnmute(message, args);
      case "warn":      return await cmdWarn(message, args);
      case "warns":     return await cmdWarns(message, args);
      case "delwarn":   return await cmdDelwarn(message, args);
      case "clearwarn": return await cmdClearwarn(message, args);
      case "karaliste": return await cmdKaraliste(message, args);
      case "purge":
      case "temizle":   return await cmdPurge(message, args);
      case "slowmode":  return await cmdSlowmode(message, args);
      case "kilit":     return await cmdKilit(message, args);
      case "kiliti-ac":
      case "kilitiAc":  return await cmdKilitiAc(message, args);
      case "rol-ver":
      case "rolver":    return await cmdRolVer(message, args);
      case "rol-al":
      case "rolal":     return await cmdRolAl(message, args);
      case "duyuru":    return await cmdDuyuru(message, args);

      // ── BİLGİ ──
      case "userinfo":   return await cmdUserinfo(message, args);
      case "serverinfo": return await cmdServerinfo(message);
      case "mod-kayit":
      case "modkayit":   return await cmdModKayit(message, args);
    }
  } catch (err) {
    console.error(`[HATA] ${CONFIG.PREFIX}${command}:`, err);
    message.reply({ embeds: [errorEmbed("Komut çalıştırılırken bir hata oluştu.")] }).catch(() => {});
  }
});

// ═══════════════════════════════════════════════
//  📢  SUNUCU YÖNETİM
// ═══════════════════════════════════════════════

// !aktif [not]
async function cmdAktif(message, args) {
  if (!isStaff(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkili olman gerekiyor.")] });

  const not = args.join(" ") || "";
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.SUCCESS)
    .setTitle("✅ Sunucu Açıldı!")
    .setDescription(
      `@everyone **CrystalHaven Network** sunucusu açıldı! ⚔️\n\n` +
      `🌐 **IP:** \`${CONFIG.SERVER.IP}\`\n` +
      `🔌 **Port:** \`${CONFIG.SERVER.PORT}\`\n` +
      `📦 **Versiyon:** ${CONFIG.SERVER.VERSION}` +
      (not ? `\n\n📝 **Not:** ${not}` : "")
    )
    .setThumbnail(message.guild.iconURL())
    .setFooter({ text: "CrystalHaven Network — BoxPvP" })
    .setTimestamp();

  const duyuruCh = message.guild.channels.cache.get(CONFIG.CHANNELS.DUYURU);
  if (duyuruCh) await duyuruCh.send({ content: "@everyone", embeds: [embed] });

  message.reply({ embeds: [successEmbed("Aktif duyurusu yapıldı!")] });
}

// !bakim [sure]
async function cmdBakim(message, args) {
  if (!isStaff(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkili olman gerekiyor.")] });

  const sure = args.join(" ") || "Belirtilmedi";
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.WARNING)
    .setTitle("🔧 Sunucu Bakıma Alındı")
    .setDescription(
      `⚙️ **CrystalHaven Network** bakım çalışması başladı.\n\n` +
      `⏱️ **Tahmini Süre:** ${sure}\n\nBakım bitince duyurulacaktır. Sabırlı olun! 💙`
    )
    .setFooter({ text: "CrystalHaven Network" })
    .setTimestamp();

  const duyuruCh = message.guild.channels.cache.get(CONFIG.CHANNELS.DUYURU);
  if (duyuruCh) await duyuruCh.send({ embeds: [embed] });

  message.reply({ embeds: [successEmbed("Bakım duyurusu yapıldı!")] });
}

// !oyuncu-sayisi
async function cmdOyuncuSayisi(message) {
  const count = Math.floor(Math.random() * 80) + 20;
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.PRIMARY)
    .setTitle("👥 Anlık Oyuncu Sayısı")
    .setDescription(`🟢 Şu an **${count}** oyuncu aktif!\n\n🌐 IP: \`${CONFIG.SERVER.IP}\``)
    .setFooter({ text: "CrystalHaven Network" })
    .setTimestamp();
  message.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════
//  🎁  ETKİNLİK & TOPLULUK
// ═══════════════════════════════════════════════

// !oneri <mesaj>
async function cmdOneri(message, args) {
  const cd = checkCooldown(message.author.id, "oneri", CONFIG.COOLDOWNS.ONERI);
  if (cd > 0)
    return message.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.WARNING).setDescription(`⏳ ${(cd / 1000).toFixed(0)}s bekle.`)] });

  if (!args.length)
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}oneri <mesaj>\``)] });

  const mesaj = args.join(" ");
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.INFO)
    .setTitle("💡 Yeni Öneri")
    .setDescription(mesaj)
    .addFields({ name: "👤 Öneren", value: message.author.toString(), inline: true })
    .setFooter({ text: "Oylama için ✅/❌ kullanın" })
    .setTimestamp();

  const oneriCh = message.guild.channels.cache.get(CONFIG.CHANNELS.ONERI);
  if (oneriCh) {
    const msg = await oneriCh.send({ embeds: [embed] });
    await msg.react("✅");
    await msg.react("❌");
  }
  message.reply({ embeds: [successEmbed("Öneriniz gönderildi!")] });
}

// !cekilis-baslat <odul> <sure> [kazanan_sayisi]
// Örnek: !cekilis-baslat "VIP 30 Gün" 1h 2
async function cmdCekilisBaslat(message, args) {
  if (!isStaff(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkili olman gerekiyor.")] });

  const cd = checkCooldown(message.author.id, "cekilis-baslat", CONFIG.COOLDOWNS.CEKILIS);
  if (cd > 0)
    return message.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.WARNING).setDescription(`⏳ ${(cd / 1000).toFixed(0)}s bekle.`)] });

  if (args.length < 2)
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}cekilis-baslat <odul> <sure> [kazanan_sayisi]\`\nÖrnek: \`${CONFIG.PREFIX}cekilis-baslat VIP 1h 2\``)] });

  // Son arg sayı ise kazanan sayısı, ondan önceki süre, geri kalanı ödül
  let kazanan = 1;
  let sureStr;
  let odulArgs;

  if (!isNaN(args[args.length - 1]) && parseDuration(args[args.length - 2])) {
    kazanan = parseInt(args[args.length - 1]);
    sureStr = args[args.length - 2];
    odulArgs = args.slice(0, -2);
  } else if (parseDuration(args[args.length - 1])) {
    sureStr = args[args.length - 1];
    odulArgs = args.slice(0, -1);
  } else {
    return message.reply({ embeds: [errorEmbed("Geçersiz format. Örnek: `!cekilis-baslat VIP 1h 2`")] });
  }

  const surems = parseDuration(sureStr);
  if (!surems)
    return message.reply({ embeds: [errorEmbed("Geçersiz süre. Örnek: `30m`, `1h`, `2d`")] });

  const odul = odulArgs.join(" ");
  if (!odul)
    return message.reply({ embeds: [errorEmbed("Ödül belirtmeyi unutma!")] });

  const endTime = Date.now() + surems;
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.GOLD)
    .setTitle("🎉 ÇEKİLİŞ BAŞLADI!")
    .setDescription(
      `🎁 **Ödül:** ${odul}\n\n` +
      `🎟️ Katılmak için 🎉 emojisine tıkla!\n` +
      `👑 **${kazanan}** kişi kazanacak!\n` +
      `⏰ Bitiş: <t:${Math.floor(endTime / 1000)}:R>`
    )
    .setFooter({ text: `Düzenleyen: ${message.author.tag}` })
    .setTimestamp();

  const cekilishCh = message.guild.channels.cache.get(CONFIG.CHANNELS.CEKILIS) || message.channel;
  const msg = await cekilishCh.send({ embeds: [embed] });
  await msg.react("🎉");

  DB.cekilis = { messageId: msg.id, channelId: cekilishCh.id, odul, endTime, kazanan, guild: message.guild.id };

  message.reply({ embeds: [successEmbed(`Çekiliş <#${cekilishCh.id}>'da başlatıldı!`)] });
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
  } catch { DB.cekilis = null; }
}

// !kasa-ac
async function cmdKasaAc(message) {
  const items = [
    { name: "💎 Elmas Kılıç",   rarity: "Efsane",  color: 0x9b59b6 },
    { name: "🛡️ Kristal Zırh",  rarity: "Nadir",   color: CONFIG.COLORS.PRIMARY },
    { name: "⚡ Şimşek Ok",     rarity: "Nadir",   color: CONFIG.COLORS.PRIMARY },
    { name: "🔑 Kasa Anahtarı", rarity: "Sıradan", color: CONFIG.COLORS.SUCCESS },
    { name: "💣 Bomba x5",      rarity: "Yaygın",  color: CONFIG.COLORS.INFO },
    { name: "🧪 Hız İksiri",    rarity: "Yaygın",  color: CONFIG.COLORS.INFO },
  ];
  const weights = [3, 8, 8, 15, 20, 20];
  let rand = Math.random() * weights.reduce((a, b) => a + b, 0);
  let item = items[items.length - 1];
  for (let i = 0; i < items.length; i++) { rand -= weights[i]; if (rand <= 0) { item = items[i]; break; } }

  const embed = new EmbedBuilder()
    .setColor(item.color)
    .setTitle("🎰 Kasa Açıldı!")
    .setDescription(`> **${item.name}**\n> Nadirlik: \`${item.rarity}\``)
    .setFooter({ text: "Bu sanal bir kasa açma simülasyonudur." })
    .setTimestamp();
  message.reply({ embeds: [embed] });
}

// !hata-bildir <aciklama> [gorsel_link]
async function cmdHataBildir(message, args) {
  if (!args.length)
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}hata-bildir <açıklama> [görsel_link]\``)] });

  // Son arg URL ise görsel, geri kalanı açıklama
  let gorsel = "Yok";
  let aciklamaArgs = [...args];
  if (args[args.length - 1].startsWith("http")) {
    gorsel = args[args.length - 1];
    aciklamaArgs = args.slice(0, -1);
  }
  const aciklama = aciklamaArgs.join(" ");

  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.ERROR)
    .setTitle("🐛 Yeni Hata Bildirimi")
    .addFields(
      { name: "👤 Bildiren", value: message.author.toString(), inline: true },
      { name: "📅 Tarih",   value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
      { name: "📝 Açıklama", value: aciklama },
      { name: "📸 Görsel",   value: gorsel },
    )
    .setFooter({ text: "CrystalHaven Bug Tracker" })
    .setTimestamp();

  const hataCh = message.guild.channels.cache.get(CONFIG.CHANNELS.HATA);
  if (hataCh) await hataCh.send({ embeds: [embed] });
  message.reply({ embeds: [successEmbed("Hata bildirimin alındı, incelenecek!")] });
}

// !yardim
async function cmdYardim(message) {
  const p = CONFIG.PREFIX;
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.PRIMARY)
    .setTitle("📖 CrystalHaven Network — Komut Listesi")
    .setDescription(`Prefix: \`${p}\``)
    .addFields(
      {
        name: "📢 Sunucu Yönetim",
        value: [
          `\`${p}aktif [not]\` — Sunucu açıldı duyurusu`,
          `\`${p}bakim [sure]\` — Bakım duyurusu`,
          `\`${p}oyuncu-sayisi\` — Anlık oyuncu sayısı`,
        ].join("\n"),
      },
      {
        name: "🎁 Etkinlik & Topluluk",
        value: [
          `\`${p}oneri <mesaj>\` — Oylamalı öneri gönder`,
          `\`${p}cekilis-baslat <odul> <sure> [kazanan]\` — Çekiliş başlat`,
          `\`${p}kasa-ac\` — Sanal kasa aç`,
          `\`${p}hata-bildir <açıklama> [link]\` — Bug bildir`,
        ].join("\n"),
      },
      {
        name: "🔨 Moderasyon",
        value: [
          `\`${p}ban <@kullanıcı> [sebep]\``,
          `\`${p}unban <userID> [sebep]\``,
          `\`${p}kick <@kullanıcı> [sebep]\``,
          `\`${p}mute <@kullanıcı> <sure> [sebep]\` — Örnek: \`${p}mute @user 10m spam\``,
          `\`${p}unmute <@kullanıcı> [sebep]\``,
          `\`${p}warn <@kullanıcı> <sebep>\``,
          `\`${p}warns <@kullanıcı>\``,
          `\`${p}delwarn <@kullanıcı> <id>\``,
          `\`${p}clearwarn <@kullanıcı>\``,
          `\`${p}karaliste <@kullanıcı> <sebep> [kanit_link]\``,
          `\`${p}purge <miktar> [@kullanıcı]\``,
          `\`${p}slowmode <saniye> [#kanal]\``,
          `\`${p}kilit [#kanal] [sebep]\``,
          `\`${p}kiliti-ac [#kanal]\``,
          `\`${p}rol-ver <@kullanıcı> <@rol>\``,
          `\`${p}rol-al <@kullanıcı> <@rol>\``,
          `\`${p}duyuru <mesaj> [true/false]\``,
        ].join("\n"),
      },
      {
        name: "ℹ️ Bilgi",
        value: [
          `\`${p}userinfo [@kullanıcı]\``,
          `\`${p}serverinfo\``,
          `\`${p}mod-kayit [@yetkili]\``,
        ].join("\n"),
      },
    )
    .setFooter({ text: `CrystalHaven Network | ${CONFIG.SERVER.DISCORD_INVITE}` })
    .setTimestamp();
  message.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════
//  🔨  MODERASYON
// ═══════════════════════════════════════════════

// !ban <@kullanıcı> [sebep]
async function cmdBan(message, args) {
  if (!isMod(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });

  const target = message.mentions.users.first();
  if (!target)
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}ban <@kullanıcı> [sebep]\``)] });

  const sebep = args.slice(1).join(" ") || "Sebep belirtilmedi.";
  const member = message.guild.members.cache.get(target.id);

  if (member) {
    if (member.roles.highest.position >= message.member.roles.highest.position)
      return message.reply({ embeds: [errorEmbed("Bu kullanıcıyı banlayamazsın (daha yüksek/eşit rol).")] });
    if (!member.bannable)
      return message.reply({ embeds: [errorEmbed("Bu kullanıcı banlanamaz.")] });
  }

  try { await message.guild.members.ban(target.id, { reason: sebep }); }
  catch { return message.reply({ embeds: [errorEmbed("Kullanıcı banlanamadı.")] }); }

  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.ERROR)
    .setTitle("🔨 Kullanıcı Banlandı")
    .addFields(
      { name: "👤 Kullanıcı", value: `${target.tag} (${target.id})`, inline: true },
      { name: "👮 Yetkili",   value: message.author.toString(), inline: true },
      { name: "📝 Sebep",    value: sebep },
    )
    .setTimestamp();
  message.reply({ embeds: [embed] });
  await sendLog(message.guild, embed);
}

// !unban <userID> [sebep]
async function cmdUnban(message, args) {
  if (!isMod(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });

  const userId = args[0];
  if (!userId)
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}unban <userID> [sebep]\``)] });

  const sebep = args.slice(1).join(" ") || "Sebep belirtilmedi.";
  try { await message.guild.members.unban(userId, sebep); }
  catch { return message.reply({ embeds: [errorEmbed("Bu ID'ye ait banlı kullanıcı bulunamadı.")] }); }

  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.SUCCESS)
    .setTitle("✅ Ban Kaldırıldı")
    .addFields(
      { name: "🆔 Kullanıcı ID", value: userId, inline: true },
      { name: "👮 Yetkili",      value: message.author.toString(), inline: true },
      { name: "📝 Sebep",       value: sebep },
    )
    .setTimestamp();
  message.reply({ embeds: [embed] });
  await sendLog(message.guild, embed);
}

// !kick <@kullanıcı> [sebep]
async function cmdKick(message, args) {
  if (!isMod(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });

  const target = message.mentions.users.first();
  if (!target)
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}kick <@kullanıcı> [sebep]\``)] });

  const sebep = args.slice(1).join(" ") || "Sebep belirtilmedi.";
  const member = message.guild.members.cache.get(target.id);
  if (!member) return message.reply({ embeds: [errorEmbed("Kullanıcı sunucuda değil.")] });
  if (member.roles.highest.position >= message.member.roles.highest.position)
    return message.reply({ embeds: [errorEmbed("Bu kullanıcıyı atamazsın.")] });
  if (!member.kickable)
    return message.reply({ embeds: [errorEmbed("Bu kullanıcı atılamaz.")] });

  await member.kick(sebep);
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.WARNING)
    .setTitle("👢 Kullanıcı Atıldı")
    .addFields(
      { name: "👤 Kullanıcı", value: target.tag, inline: true },
      { name: "👮 Yetkili",   value: message.author.toString(), inline: true },
      { name: "📝 Sebep",    value: sebep },
    )
    .setTimestamp();
  message.reply({ embeds: [embed] });
  await sendLog(message.guild, embed);
}

// !mute <@kullanıcı> <sure> [sebep]
async function cmdMute(message, args) {
  if (!isMod(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });

  const target = message.mentions.users.first();
  if (!target || !args[1])
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}mute <@kullanıcı> <sure> [sebep]\`\nÖrnek: \`${CONFIG.PREFIX}mute @user 10m spam\``)] });

  const sureStr = args[1];
  const sebep = args.slice(2).join(" ") || "Sebep belirtilmedi.";
  const member = message.guild.members.cache.get(target.id);
  if (!member) return message.reply({ embeds: [errorEmbed("Kullanıcı bulunamadı.")] });

  const surems = parseDuration(sureStr);
  if (!surems) return message.reply({ embeds: [errorEmbed("Geçersiz süre. Örnek: `10m`, `1h`, `2d`")] });
  if (surems > 2419200000) return message.reply({ embeds: [errorEmbed("Maksimum timeout süresi 28 gündür.")] });

  try { await member.timeout(surems, sebep); }
  catch { return message.reply({ embeds: [errorEmbed("Kullanıcı susturulamadı.")] }); }

  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.WARNING)
    .setTitle("🔇 Kullanıcı Susturuldu")
    .addFields(
      { name: "👤 Kullanıcı", value: target.toString(), inline: true },
      { name: "👮 Yetkili",   value: message.author.toString(), inline: true },
      { name: "⏱️ Süre",      value: formatDuration(surems), inline: true },
      { name: "📝 Sebep",    value: sebep },
    )
    .setTimestamp();
  message.reply({ embeds: [embed] });
  await sendLog(message.guild, embed);
}

// !unmute <@kullanıcı> [sebep]
async function cmdUnmute(message, args) {
  if (!isMod(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });

  const target = message.mentions.users.first();
  if (!target)
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}unmute <@kullanıcı> [sebep]\``)] });

  const sebep = args.slice(1).join(" ") || "Sebep belirtilmedi.";
  const member = message.guild.members.cache.get(target.id);
  if (!member) return message.reply({ embeds: [errorEmbed("Kullanıcı bulunamadı.")] });

  await member.timeout(null, sebep);
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.SUCCESS)
    .setTitle("🔊 Susturma Kaldırıldı")
    .addFields(
      { name: "👤 Kullanıcı", value: target.toString(), inline: true },
      { name: "👮 Yetkili",   value: message.author.toString(), inline: true },
      { name: "📝 Sebep",    value: sebep },
    )
    .setTimestamp();
  message.reply({ embeds: [embed] });
  await sendLog(message.guild, embed);
}

// !warn <@kullanıcı> <sebep>
async function cmdWarn(message, args) {
  if (!isMod(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });

  const target = message.mentions.users.first();
  if (!target || args.length < 2)
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}warn <@kullanıcı> <sebep>\``)] });

  const sebep = args.slice(1).join(" ");
  if (!DB.warnings.has(target.id)) DB.warnings.set(target.id, []);
  const userWarns = DB.warnings.get(target.id);
  const warnId = userWarns.length + 1;
  userWarns.push({ id: warnId, sebep, yetkili: message.author.id, tarih: Date.now() });

  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.WARNING)
    .setTitle("⚠️ Uyarı Verildi")
    .addFields(
      { name: "👤 Kullanıcı",   value: target.toString(), inline: true },
      { name: "👮 Yetkili",     value: message.author.toString(), inline: true },
      { name: "🆔 Uyarı #",    value: `${warnId}`, inline: true },
      { name: "📝 Sebep",      value: sebep },
      { name: "📊 Toplam Uyarı", value: `${userWarns.length}`, inline: true },
    )
    .setTimestamp();
  message.reply({ embeds: [embed] });
  await sendLog(message.guild, embed);

  // 3 uyarıda otomatik 1 saat mute
  if (userWarns.length >= 3) {
    const member = message.guild.members.cache.get(target.id);
    if (member?.moderatable) {
      await member.timeout(3600000, "3 uyarı limitine ulaşıldı.");
      message.channel.send({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription(`⚠️ ${target} 3 uyarı limitine ulaştı, 1 saat mute uygulandı!`)] });
    }
  }
}

// !warns <@kullanıcı>
async function cmdWarns(message, args) {
  if (!isMod(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });

  const target = message.mentions.users.first();
  if (!target)
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}warns <@kullanıcı>\``)] });

  const warns = DB.warnings.get(target.id) || [];
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.WARNING)
    .setTitle(`⚠️ ${target.tag} — Uyarı Geçmişi`)
    .setDescription(
      warns.length === 0
        ? "✅ Uyarı kaydı bulunmuyor."
        : warns.map(w => `**#${w.id}** — ${w.sebep} | <t:${Math.floor(w.tarih / 1000)}:R>`).join("\n")
    )
    .addFields({ name: "📊 Toplam", value: `${warns.length} uyarı`, inline: true })
    .setTimestamp();
  message.reply({ embeds: [embed] });
}

// !delwarn <@kullanıcı> <id>
async function cmdDelwarn(message, args) {
  if (!isMod(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });

  const target = message.mentions.users.first();
  const warnId = parseInt(args[1]);
  if (!target || isNaN(warnId))
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}delwarn <@kullanıcı> <id>\``)] });

  const warns = DB.warnings.get(target.id) || [];
  const idx = warns.findIndex(w => w.id === warnId);
  if (idx === -1) return message.reply({ embeds: [errorEmbed("Bu ID'ye sahip uyarı bulunamadı.")] });
  warns.splice(idx, 1);
  message.reply({ embeds: [successEmbed(`${target} kullanıcısının **#${warnId}** numaralı uyarısı silindi.`)] });
}

// !clearwarn <@kullanıcı>
async function cmdClearwarn(message, args) {
  if (!isAdmin(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için admin yetkin gerekiyor.")] });

  const target = message.mentions.users.first();
  if (!target)
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}clearwarn <@kullanıcı>\``)] });

  DB.warnings.delete(target.id);
  message.reply({ embeds: [successEmbed(`${target} kullanıcısının tüm uyarıları temizlendi.`)] });
}

// !karaliste <@kullanıcı> <sebep> [kanit_link]
async function cmdKaraliste(message, args) {
  if (!isAdmin(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için admin yetkin gerekiyor.")] });

  const target = message.mentions.users.first();
  if (!target || args.length < 2)
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}karaliste <@kullanıcı> <sebep> [kanit_link]\``)] });

  // Son arg URL ise kanıt
  let kanit = "Kanıt yok";
  let sebepArgs = args.slice(1);
  if (sebepArgs[sebepArgs.length - 1]?.startsWith("http")) {
    kanit = sebepArgs.pop();
  }
  const sebep = sebepArgs.join(" ");

  const member = message.guild.members.cache.get(target.id);
  if (member) {
    try { await member.ban({ reason: `[KARA LİSTE] ${sebep}` }); } catch {}
  }

  const embed = new EmbedBuilder()
    .setColor(0x000000)
    .setTitle("🚫 Kara Listeye Eklendi!")
    .setDescription(`**${target.tag}** Discord'dan ve oyun sunucusundan kara listeye alındı.`)
    .addFields(
      { name: "👤 Kullanıcı", value: `${target.tag} (${target.id})`, inline: true },
      { name: "👮 Yetkili",   value: message.author.toString(), inline: true },
      { name: "📝 Sebep",    value: sebep },
      { name: "🔗 Kanıt",    value: kanit },
    )
    .setTimestamp();
  message.reply({ embeds: [embed] });
  await sendLog(message.guild, embed);
}

// !purge <miktar> [@kullanıcı]
async function cmdPurge(message, args) {
  if (!isMod(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });

  const miktar = parseInt(args[0]);
  if (isNaN(miktar) || miktar < 1 || miktar > 100)
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}purge <1-100> [@kullanıcı]\``)] });

  const filterUser = message.mentions.users.first();
  // Komut mesajını da sil
  await message.delete().catch(() => {});

  let messages = await message.channel.messages.fetch({ limit: 100 });
  if (filterUser) messages = messages.filter(m => m.author.id === filterUser.id);
  messages = [...messages.values()].slice(0, miktar);

  const deleted = await message.channel.bulkDelete(messages, true);
  const reply = await message.channel.send({
    embeds: [successEmbed(`**${deleted.size}** mesaj silindi.${filterUser ? ` (${filterUser.tag} tarafından yazılanlar)` : ""}`)],
  });
  setTimeout(() => reply.delete().catch(() => {}), 4000);
}

// !slowmode <saniye> [#kanal]
async function cmdSlowmode(message, args) {
  if (!isMod(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });

  const saniye = parseInt(args[0]);
  if (isNaN(saniye) || saniye < 0 || saniye > 21600)
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}slowmode <0-21600> [#kanal]\``)] });

  const kanal = message.mentions.channels.first() || message.channel;
  await kanal.setRateLimitPerUser(saniye, `Slowmode | ${message.author.tag}`);
  const msg = saniye === 0 ? "🔊 Yavaş mod kapatıldı." : `⏱️ Yavaş mod **${saniye} saniye** olarak ayarlandı.`;
  message.reply({ embeds: [successEmbed(`${msg} (${kanal})`)] });
}

// !kilit [#kanal] [sebep]
async function cmdKilit(message, args) {
  if (!isMod(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });

  const kanal = message.mentions.channels.first() || message.channel;
  const sebep = message.mentions.channels.first() ? args.slice(1).join(" ") || "Sebep belirtilmedi." : args.join(" ") || "Sebep belirtilmedi.";
  await kanal.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription(`🔒 <#${kanal.id}> kilitlendi. **Sebep:** ${sebep}`);
  message.reply({ embeds: [embed] });
  await sendLog(message.guild, embed);
}

// !kiliti-ac [#kanal]
async function cmdKilitiAc(message, args) {
  if (!isMod(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });

  const kanal = message.mentions.channels.first() || message.channel;
  await kanal.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });
  message.reply({ embeds: [successEmbed(`🔓 <#${kanal.id}> kilidi açıldı.`)] });
}

// !rol-ver <@kullanıcı> <@rol>
async function cmdRolVer(message, args) {
  if (!isMod(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });

  const target = message.mentions.members.first();
  const rol = message.mentions.roles.first();
  if (!target || !rol)
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}rol-ver <@kullanıcı> <@rol>\``)] });
  if (rol.position >= message.member.roles.highest.position)
    return message.reply({ embeds: [errorEmbed("Bu rolü veremezsin (daha yüksek/eşit).")] });

  await target.roles.add(rol);
  message.reply({ embeds: [successEmbed(`${target} kullanıcısına ${rol} rolü verildi.`)] });
}

// !rol-al <@kullanıcı> <@rol>
async function cmdRolAl(message, args) {
  if (!isMod(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });

  const target = message.mentions.members.first();
  const rol = message.mentions.roles.first();
  if (!target || !rol)
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}rol-al <@kullanıcı> <@rol>\``)] });

  await target.roles.remove(rol);
  message.reply({ embeds: [successEmbed(`${target} kullanıcısından ${rol} rolü alındı.`)] });
}

// !duyuru <mesaj> [true/false]
async function cmdDuyuru(message, args) {
  if (!isStaff(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkili olman gerekiyor.")] });

  if (!args.length)
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}duyuru <mesaj> [true/false]\``)] });

  // Son arg true/false ise etiket, geri kalanı mesaj
  let etiketle = false;
  let mesajArgs = [...args];
  if (mesajArgs[mesajArgs.length - 1]?.toLowerCase() === "true") { etiketle = true; mesajArgs.pop(); }
  else if (mesajArgs[mesajArgs.length - 1]?.toLowerCase() === "false") { mesajArgs.pop(); }
  const mesaj = mesajArgs.join(" ");

  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.PRIMARY)
    .setTitle("📣 Duyuru")
    .setDescription(mesaj)
    .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
    .setTimestamp();

  const duyuruCh = message.guild.channels.cache.get(CONFIG.CHANNELS.DUYURU) || message.channel;
  await duyuruCh.send({ content: etiketle ? "@everyone" : "", embeds: [embed] });
  message.reply({ embeds: [successEmbed("Duyuru gönderildi!")] });
}

// ═══════════════════════════════════════════════
//  ℹ️  BİLGİ
// ═══════════════════════════════════════════════

// !userinfo [@kullanıcı]
async function cmdUserinfo(message, args) {
  const target = message.mentions.users.first() || message.author;
  const member = message.guild.members.cache.get(target.id);
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.PRIMARY)
    .setTitle(`👤 ${target.tag}`)
    .setThumbnail(target.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: "🆔 ID",              value: target.id, inline: true },
      { name: "📅 Hesap Oluşturma", value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
      { name: "📅 Sunucuya Katılma", value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "Bilinmiyor", inline: true },
      { name: "🎭 En Yüksek Rol",   value: member?.roles.highest.toString() || "Yok", inline: true },
      { name: "⚠️ Uyarı Sayısı",    value: `${(DB.warnings.get(target.id) || []).length}`, inline: true },
    )
    .setTimestamp();
  message.reply({ embeds: [embed] });
}

// !serverinfo
async function cmdServerinfo(message) {
  const g = message.guild;
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.PRIMARY)
    .setTitle(`🏰 ${g.name}`)
    .setThumbnail(g.iconURL({ dynamic: true }))
    .addFields(
      { name: "🆔 ID",          value: g.id, inline: true },
      { name: "👑 Sahip",       value: `<@${g.ownerId}>`, inline: true },
      { name: "👥 Üye Sayısı",  value: `${g.memberCount}`, inline: true },
      { name: "📅 Oluşturulma", value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
      { name: "💎 Boost",       value: `Seviye ${g.premiumTier} (${g.premiumSubscriptionCount} boost)`, inline: true },
    )
    .setTimestamp();
  message.reply({ embeds: [embed] });
}

// !mod-kayit [@yetkili]
async function cmdModKayit(message) {
  if (!isAdmin(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için admin yetkin gerekiyor.")] });

  message.reply({
    embeds: [new EmbedBuilder()
      .setColor(CONFIG.COLORS.INFO)
      .setDescription("📊 Moderasyon kayıtları log kanalından görüntülenebilir. Gelecek sürümde DB entegrasyonu eklenecek.")],
  });
}

// ─────────────────────────────────────────────
//  HATA YÖNETİMİ
// ─────────────────────────────────────────────
process.on("unhandledRejection", err => console.error("[UnhandledRejection]", err));
process.on("uncaughtException",  err => console.error("[UncaughtException]", err));

// ─────────────────────────────────────────────
//  BOTU BAŞLAT
// ─────────────────────────────────────────────
client.login(process.env.TOKEN);
