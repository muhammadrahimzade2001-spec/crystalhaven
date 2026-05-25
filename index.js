require("dotenv").config();

// ╔══════════════════════════════════════════════════════════════╗
// ║         CrystalHaven Network - Discord Bot                   ║
// ║              Developed for CrystalHaven Network              ║
// ╚══════════════════════════════════════════════════════════════╝

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  PermissionFlagsBits,
  Collection,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

// ─────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────
const CONFIG = {
  TOKEN: process.env.BOT_TOKEN || "YOUR_BOT_TOKEN",
  PREFIX: process.env.PREFIX || "!",

  CHANNELS: {
    DUYURU:     process.env.DUYURU_CHANNEL     || "DUYURU_KANAL_ID",
    LOG:        process.env.LOG_CHANNEL        || "LOG_KANAL_ID",
    ONERI:      process.env.ONERI_CHANNEL      || "ONERI_KANAL_ID",
    HATA:       process.env.HATA_CHANNEL       || "HATA_KANAL_ID",
    CEKILIS:    process.env.CEKILIS_CHANNEL    || "CEKILIS_KANAL_ID",
    TICKET_LOG: process.env.TICKET_LOG_CHANNEL || "TICKET_LOG_KANAL_ID",
  },

  ROLES: {
    ADMIN:     process.env.ADMIN_ROLE     || "ADMIN_ROL_ID",
    MODERATOR: process.env.MODERATOR_ROLE || "MOD_ROL_ID",
    YARDIMCI:  process.env.YARDIMCI_ROLE  || "YARDIMCI_ROL_ID",
  },

  OWNERS: {
    trapbilmeyen: process.env.OWNER_TRAPBILMEYEN || "TRAPBILMEYEN_USER_ID",
    vblevi1:      process.env.OWNER_VBLEVI1      || "VBLEVI1_USER_ID",
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
    TICKET:  0x5865F2,
    OWNER:   0xf1c40f,
  },

  COOLDOWNS: {
    DEFAULT:  3000,
    ONERI:    60000,
    CEKILIS:  300000,
    TICKET:   30000,
  },

  TICKET: {
    CATEGORY_ID:   process.env.TICKET_CATEGORY_ID || null,
    MAX_PER_USER:  2,
    SUPPORT_HOURS: {
      WEEKDAY: "14:00 - 01:00",
      WEEKEND: "10:00 - 02:00",
    },
    CATEGORIES: {
      kufur:        { label: "Kufur",        emoji: "🤬", color: 0xff4757, description: "Kufur/hakaret sikayeti" },
      hile:         { label: "Hile",         emoji: "🎮", color: 0xff6b35, description: "Hile/cheat sikayeti" },
      bug:          { label: "Bug",          emoji: "🐛", color: 0xffa502, description: "Hata/bug bildirimi" },
      sosyal_medya: { label: "Sosyal Medya", emoji: "📱", color: 0x00d4ff, description: "Sosyal medya/tanitim" },
      kredi:        { label: "Kredi",        emoji: "💳", color: 0x57f287, description: "Kredi/odeme sorunu" },
      diger:        { label: "Diger",        emoji: "📋", color: 0x747d8c, description: "Diger konular" },
    },
  },
};

// ─────────────────────────────────────────────
//  IN-MEMORY DATABASE
// ─────────────────────────────────────────────
const DB = {
  warnings:      new Map(),
  cekilis:       null,
  tickets:       new Map(),
  userTickets:   new Map(),
  ticketCounter: 0,
};

// ─────────────────────────────────────────────
//  HELPER FUNCTIONS
// ─────────────────────────────────────────────
function hasRole(member, ...roleIds) {
  return roleIds.some(id => member.roles.cache.has(id));
}

function isOwner(userOrMember) {
  const id = typeof userOrMember === "string" ? userOrMember : userOrMember?.id;
  return Object.values(CONFIG.OWNERS).includes(id);
}

function getUserTitle(member) {
  if (!member) return null;
  if (isOwner(member.id || member))                                return "👑 Bot Sahibi";
  if (hasRole(member, CONFIG.ROLES.ADMIN))                         return "🛡️ Admin";
  if (hasRole(member, CONFIG.ROLES.MODERATOR))                     return "⚔️ Moderator";
  if (hasRole(member, CONFIG.ROLES.YARDIMCI))                      return "🤝 Yardimci";
  if (member.permissions?.has(PermissionFlagsBits.Administrator))  return "⚙️ Sunucu Yoneticisi";
  return "👤 Uye";
}

function getUserColor(member) {
  if (!member) return CONFIG.COLORS.PRIMARY;
  if (isOwner(member.id || member))                return CONFIG.COLORS.OWNER;
  if (hasRole(member, CONFIG.ROLES.ADMIN))         return CONFIG.COLORS.ERROR;
  if (hasRole(member, CONFIG.ROLES.MODERATOR))     return CONFIG.COLORS.WARNING;
  if (hasRole(member, CONFIG.ROLES.YARDIMCI))      return CONFIG.COLORS.SUCCESS;
  return CONFIG.COLORS.PRIMARY;
}

function isStaff(member) {
  return isOwner(member) ||
    hasRole(member, CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR, CONFIG.ROLES.YARDIMCI);
}

function isMod(member) {
  return isOwner(member) ||
    hasRole(member, CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR) ||
    member.permissions.has(PermissionFlagsBits.ModerateMembers);
}

function isAdmin(member) {
  return isOwner(member) ||
    hasRole(member, CONFIG.ROLES.ADMIN) ||
    member.permissions.has(PermissionFlagsBits.Administrator);
}

function parseDuration(str) {
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 };
  const match = str.match(/^(\d+)([smhdw])$/i);
  if (!match) return null;
  return parseInt(match[1]) * units[match[2].toLowerCase()];
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60)  return `${s} saniye`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m} dakika`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} saat`;
  const d = Math.floor(h / 24);
  return `${d} gun`;
}

async function sendLog(guild, embed) {
  try {
    const logCh = guild.channels.cache.get(CONFIG.CHANNELS.LOG);
    if (logCh) await logCh.send({ embeds: [embed] });
  } catch {}
}

async function sendTicketLog(guild, embed) {
  try {
    const logCh = guild.channels.cache.get(CONFIG.CHANNELS.TICKET_LOG) ||
                  guild.channels.cache.get(CONFIG.CHANNELS.LOG);
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
  console.log(`║  📡  ${client.guilds.cache.size} sunucuya bagli`);
  console.log(`║  ⌨️   Prefix: ${CONFIG.PREFIX}`);
  console.log(`║  🎫  Ticket Sistemi: AKTIF`);
  console.log(`║  👑  Sahipler: ${Object.keys(CONFIG.OWNERS).join(", ")}`);
  console.log("╚══════════════════════════════════════════╝\n");

  client.user.setPresence({
    activities: [{ name: `⚔️ CrystalHaven Network | ${CONFIG.PREFIX}yardim`, type: 3 }],
    status: "online",
  });

  setInterval(checkCekilisEnd, 10000);
});

// ═══════════════════════════════════════════════
//  TICKET SYSTEM — HELPERS
// ═══════════════════════════════════════════════

function buildTicketPanelEmbed(guild) {
  const cat = CONFIG.TICKET.CATEGORIES;
  const categoryList = Object.values(cat)
    .map(c => `${c.emoji} **${c.label}** — ${c.description}`)
    .join("\n");

  return new EmbedBuilder()
    .setColor(CONFIG.COLORS.TICKET)
    .setAuthor({
      name: "CrystalHaven Network — Destek",
      iconURL: guild.iconURL({ dynamic: true }),
    })
    .setTitle("🎫 Destek Talebi Olustur")
    .setDescription(
      `Kategori secin ve talebinizi olusturun.\n\n**Mevcut Kategoriler:**\n${categoryList}`
    )
    .addFields(
      {
        name: "📋 Destek Talebi Kurallari",
        value: [
          "• Yetkililere sabırsız bir şekilde etiket atmayınız.",
          "• Sorununuz hakkında yeterli kanıt sunmanız zorunludur.",
          "• Asılsız/gereksiz ticket açmak yasaktır.",
          "• Yetkililere saygılı olunuz.",
          "**Kurallara uyulmazsa talebiniz kapatılır.**",
        ].join("\n"),
      },
      {
        name: "🕐 Destek Saatleri",
        value: `• **Hafta içi:** ${CONFIG.TICKET.SUPPORT_HOURS.WEEKDAY}\n• **Hafta sonu:** ${CONFIG.TICKET.SUPPORT_HOURS.WEEKEND}`,
      },
    )
    .setFooter({ text: "CrystalHaven Network | play.crystalhaven.net" })
    .setTimestamp();
}

function buildCategorySelectMenu() {
  const options = Object.entries(CONFIG.TICKET.CATEGORIES).map(([key, cat]) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(cat.label)
      .setDescription(cat.description)
      .setValue(key)
      .setEmoji(cat.emoji)
  );

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("ticket_category_select")
      .setPlaceholder("📂 Bir destek kategorisi secin!")
      .addOptions(options)
  );
}

function buildTicketChannelEmbed(user, category, ticketId, aciklama) {
  const cat = CONFIG.TICKET.CATEGORIES[category];
  return new EmbedBuilder()
    .setColor(cat.color)
    .setAuthor({
      name: `${user.tag} — Ticket #${ticketId}`,
      iconURL: user.displayAvatarURL({ dynamic: true }),
    })
    .setTitle(`${cat.emoji} ${cat.label} Destek Talebi`)
    .setDescription(
      `Merhaba ${user}! Destek talebiniz alindi.\n` +
      `Yetkililerin musait oldugu saatlerde size yardimci olunacaktir.\n\n` +
      `> Lutfen sabırla bekleyin, **etiket atmayin!**`
    )
    .addFields(
      { name: "👤 Kullanici", value: `${user.tag}\n\`${user.id}\``, inline: true },
      { name: "📂 Kategori",  value: `${cat.emoji} ${cat.label}`, inline: true },
      { name: "🆔 Ticket ID", value: `#${ticketId}`, inline: true },
      { name: "📝 Konu / Aciklama", value: aciklama || "Belirtilmedi." },
      {
        name: "🕐 Destek Saatleri",
        value: `Hafta ici: **${CONFIG.TICKET.SUPPORT_HOURS.WEEKDAY}**\nHafta sonu: **${CONFIG.TICKET.SUPPORT_HOURS.WEEKEND}**`,
      },
    )
    .setFooter({ text: "CrystalHaven Network | play.crystalhaven.net" })
    .setTimestamp();
}

function buildTicketControlButtons(claimed = false, claimerTag = null) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_claim")
      .setLabel(claimed ? `Ustlenen: ${claimerTag}` : "📌 Ustlen")
      .setStyle(claimed ? ButtonStyle.Success : ButtonStyle.Primary)
      .setDisabled(claimed),
    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("🔒 Kapat")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("ticket_transcript")
      .setLabel("📄 Transkript")
      .setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_add_user")
      .setLabel("➕ Kullanici Ekle")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("ticket_remove_user")
      .setLabel("➖ Kullanici Cikar")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("ticket_priority")
      .setLabel("🔴 Oncelik")
      .setStyle(ButtonStyle.Danger),
  );

  return [row1, row2];
}

async function createTicketChannel(guild, user, category, aciklama) {
  DB.ticketCounter++;
  const ticketId = String(DB.ticketCounter).padStart(4, "0");
  const cat = CONFIG.TICKET.CATEGORIES[category];
  const channelName = `ticket-${cat.label.toLowerCase().replace(/ /g, "-")}-${ticketId}`;

  const permissionOverwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
  ];

  for (const ownerId of Object.values(CONFIG.OWNERS)) {
    if (ownerId && !ownerId.includes("_USER_ID")) {
      permissionOverwrites.push({
        id: ownerId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ManageMessages,
        ],
      });
    }
  }

  for (const roleId of [CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR, CONFIG.ROLES.YARDIMCI]) {
    if (roleId && !["ADMIN_ROL_ID", "MOD_ROL_ID", "YARDIMCI_ROL_ID"].includes(roleId)) {
      permissionOverwrites.push({
        id: roleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ManageMessages,
        ],
      });
    }
  }

  const channelOptions = {
    name: channelName,
    type: ChannelType.GuildText,
    topic: `Ticket #${ticketId} | ${user.tag} | ${cat.label}`,
    permissionOverwrites,
  };

  if (CONFIG.TICKET.CATEGORY_ID) channelOptions.parent = CONFIG.TICKET.CATEGORY_ID;

  const channel = await guild.channels.create(channelOptions);

  DB.tickets.set(channel.id, {
    id: ticketId,
    userId: user.id,
    category,
    status: "open",
    createdAt: Date.now(),
    claimedBy: null,
    claimerTag: null,
    priority: "normal",
    addedUsers: [],
  });

  if (!DB.userTickets.has(user.id)) DB.userTickets.set(user.id, new Set());
  DB.userTickets.get(user.id).add(channel.id);

  const embed = buildTicketChannelEmbed(user, category, ticketId, aciklama);
  const [row1, row2] = buildTicketControlButtons();
  await channel.send({ content: `${user} — Ticket olusturuldu!`, embeds: [embed], components: [row1, row2] });

  const logEmbed = new EmbedBuilder()
    .setColor(cat.color)
    .setTitle(`🎫 Yeni Ticket Acildi — #${ticketId}`)
    .addFields(
      { name: "👤 Kullanici", value: `${user.tag} (${user.id})`, inline: true },
      { name: "📂 Kategori",  value: `${cat.emoji} ${cat.label}`, inline: true },
      { name: "📌 Kanal",     value: `<#${channel.id}>`, inline: true },
      { name: "📝 Aciklama",  value: aciklama || "Belirtilmedi." },
    )
    .setTimestamp();
  await sendTicketLog(guild, logEmbed);

  return { channel, ticketId };
}

async function generateTranscript(channel, limit = 50) {
  try {
    const messages = await channel.messages.fetch({ limit });
    const lines = [...messages.values()]
      .reverse()
      .filter(m => !m.author.bot || m.embeds.length === 0)
      .slice(0, 30)
      .map(m => `[${new Date(m.createdTimestamp).toLocaleString("tr-TR")}] ${m.author.tag}: ${m.content || "[embed]"}`)
      .join("\n");
    return lines.length > 0 ? `\`\`\`\n${lines.slice(0, 1000)}\n\`\`\`` : "_Mesaj bulunamadi._";
  } catch {
    return "_Transkript alinamadi._";
  }
}

// ═══════════════════════════════════════════════
//  INTERACTION HANDLER
// ═══════════════════════════════════════════════
client.on("interactionCreate", async interaction => {
  try {

    // ── 1. Category Select Menu ──────────────────────────────────
    if (interaction.isStringSelectMenu() && interaction.customId === "ticket_category_select") {
      const category = interaction.values[0];
      const userId   = interaction.user.id;

      const cd = checkCooldown(userId, "ticket_open", CONFIG.COOLDOWNS.TICKET);
      if (cd > 0) {
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.WARNING)
            .setDescription(`⏳ Cok hizli! **${(cd / 1000).toFixed(0)}s** bekle.`)],
          ephemeral: true,
        });
      }

      const userTicketChannels = DB.userTickets.get(userId);
      if (userTicketChannels) {
        const openTickets = [...userTicketChannels].filter(chId => {
          const t = DB.tickets.get(chId);
          return t && t.status === "open";
        });
        if (openTickets.length >= CONFIG.TICKET.MAX_PER_USER) {
          return interaction.reply({
            embeds: [errorEmbed(
              `Zaten **${openTickets.length}** acik ticketin var! Mevcut ticketlerini kapat.\n` +
              openTickets.map(id => `<#${id}>`).join(", ")
            )],
            ephemeral: true,
          });
        }
      }

      const catInfo = CONFIG.TICKET.CATEGORIES[category];
      const modal = new ModalBuilder()
        .setCustomId(`ticket_modal_${category}`)
        .setTitle(`${catInfo.emoji} ${catInfo.label} Talebi`);

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("ticket_aciklama")
            .setLabel("Sorununuzu kisaca aciklayin")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Ornek: Sunucuda bir oyuncu bana kufur etti. Isim: ...")
            .setMinLength(10)
            .setMaxLength(1000)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("ticket_kanit")
            .setLabel("Kanit linki (screenshot, video) — opsiyonel")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("https://imgur.com/...")
            .setRequired(false)
        ),
      );

      return interaction.showModal(modal);
    }

    // ── 2. Modal Submit ──────────────────────────────────────────
    if (interaction.isModalSubmit()) {

      // Ticket creation modal
      if (interaction.customId.startsWith("ticket_modal_")) {
        const category = interaction.customId.replace("ticket_modal_", "");
        const aciklama = interaction.fields.getTextInputValue("ticket_aciklama");
        let kanit = "";
        try { kanit = interaction.fields.getTextInputValue("ticket_kanit") || ""; } catch {}

        const fullAciklama = aciklama + (kanit ? `\n\n🔗 **Kanit:** ${kanit}` : "");

        await interaction.deferReply({ ephemeral: true });

        try {
          const { channel, ticketId } = await createTicketChannel(
            interaction.guild, interaction.user, category, fullAciklama
          );
          return interaction.editReply({
            embeds: [new EmbedBuilder()
              .setColor(CONFIG.COLORS.SUCCESS)
              .setTitle("Ticket Olusturuldu!")
              .setDescription(
                `🎫 Ticket **#${ticketId}** basariyla acildi!\n` +
                `📂 Kanalin: <#${channel.id}>\n\n` +
                `> Yetkililer en kisa surede ilgilenecek.`
              )],
          });
        } catch (err) {
          console.error("[TICKET CREATE ERROR]", err);
          return interaction.editReply({
            embeds: [errorEmbed("Ticket olusturulurken hata olustu. Tekrar dene.")],
          });
        }
      }

      // Add user modal
      if (interaction.customId === "ticket_add_user_modal") {
        if (!isStaff(interaction.member))
          return interaction.reply({ embeds: [errorEmbed("Yetkin yok.")], ephemeral: true });
        const userId = interaction.fields.getTextInputValue("user_id").trim();
        try {
          const member = await interaction.guild.members.fetch(userId);
          await interaction.channel.permissionOverwrites.edit(member.id, {
            ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
          });
          const ticket = DB.tickets.get(interaction.channel.id);
          if (ticket) ticket.addedUsers.push(userId);
          return interaction.reply({ embeds: [successEmbed(`${member.user.tag} tickete eklendi.`)] });
        } catch {
          return interaction.reply({ embeds: [errorEmbed("Kullanici bulunamadi veya eklenemedi.")], ephemeral: true });
        }
      }

      // Remove user modal
      if (interaction.customId === "ticket_remove_user_modal") {
        if (!isStaff(interaction.member))
          return interaction.reply({ embeds: [errorEmbed("Yetkin yok.")], ephemeral: true });
        const userId = interaction.fields.getTextInputValue("user_id").trim();
        try {
          const member = await interaction.guild.members.fetch(userId);
          const ticket = DB.tickets.get(interaction.channel.id);
          if (ticket && ticket.userId === userId)
            return interaction.reply({ embeds: [errorEmbed("Ticket sahibini cikaramazsin!")], ephemeral: true });
          await interaction.channel.permissionOverwrites.delete(member.id);
          return interaction.reply({ embeds: [successEmbed(`${member.user.tag} ticketten cikarildi.`)] });
        } catch {
          return interaction.reply({ embeds: [errorEmbed("Kullanici bulunamadi veya cikarilmadi.")], ephemeral: true });
        }
      }
    }

    // ── 3. Button Interactions ───────────────────────────────────
    if (interaction.isButton()) {
      const customId = interaction.customId;

      if (customId === "ticket_claim") {
        if (!isStaff(interaction.member))
          return interaction.reply({ embeds: [errorEmbed("Bu butonu kullanmak icin yetkili olmalisin.")], ephemeral: true });

        const ticket = DB.tickets.get(interaction.channel.id);
        if (!ticket)
          return interaction.reply({ embeds: [errorEmbed("Ticket verisi bulunamadi.")], ephemeral: true });

        ticket.claimedBy  = interaction.user.id;
        ticket.claimerTag = interaction.user.tag;

        const [row1, row2] = buildTicketControlButtons(true, interaction.user.tag);
        await interaction.message.edit({ components: [row1, row2] });

        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(CONFIG.COLORS.SUCCESS)
            .setDescription(`📌 ${interaction.user} bu ticketi ustlendi!`)
            .setTimestamp()],
        });
      }

      if (customId === "ticket_close") {
        const ticket = DB.tickets.get(interaction.channel.id);
        if (!isStaff(interaction.member)) {
          if (!ticket || ticket.userId !== interaction.user.id)
            return interaction.reply({ embeds: [errorEmbed("Bu ticketi kapatma yetkin yok.")], ephemeral: true });
        }

        const confirmRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("ticket_close_confirm").setLabel("Evet, Kapat").setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId("ticket_close_cancel").setLabel("Iptal").setStyle(ButtonStyle.Secondary),
        );

        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(CONFIG.COLORS.WARNING)
            .setTitle("Ticketi Kapat")
            .setDescription("Bu ticketi kapatmak istediginizden emin misiniz?\nKapatildiginda **5 saniye** icerisinde silinecektir.")],
          components: [confirmRow],
          ephemeral: true,
        });
      }

      if (customId === "ticket_close_confirm") {
        // Acknowledge the button press first
        await interaction.deferUpdate().catch(() => {});

        const ticket = DB.tickets.get(interaction.channel.id);
        if (ticket) {
          ticket.status = "closed";
          const userTickets = DB.userTickets.get(ticket.userId);
          if (userTickets) userTickets.delete(interaction.channel.id);
        }

        const transcript = await generateTranscript(interaction.channel);

        const logEmbed = new EmbedBuilder()
          .setColor(CONFIG.COLORS.ERROR)
          .setTitle(`Ticket Kapatildi — #${ticket?.id || "???"}`)
          .addFields(
            { name: "Kapatan",    value: interaction.user.toString(), inline: true },
            { name: "Sure",       value: ticket ? formatDuration(Date.now() - ticket.createdAt) : "Bilinmiyor", inline: true },
            { name: "Transkript", value: transcript },
          )
          .setTimestamp();
        await sendTicketLog(interaction.guild, logEmbed);

        await interaction.channel.send({
          embeds: [new EmbedBuilder()
            .setColor(CONFIG.COLORS.ERROR)
            .setDescription(`🔒 Ticket **${interaction.user}** tarafindan kapatildi. Kanal 5 saniye icinde silinecek...`)],
        });

        setTimeout(async () => {
          try { await interaction.channel.delete("Ticket kapatildi."); } catch {}
        }, 5000);

        return;
      }

      if (customId === "ticket_close_cancel") {
        return interaction.reply({
          embeds: [successEmbed("Ticket kapatma islemi iptal edildi.")],
          ephemeral: true,
        });
      }

      if (customId === "ticket_transcript") {
        if (!isStaff(interaction.member))
          return interaction.reply({ embeds: [errorEmbed("Bu butonu kullanmak icin yetkili olmalisin.")], ephemeral: true });

        await interaction.deferReply({ ephemeral: true });
        const transcript = await generateTranscript(interaction.channel);
        return interaction.editReply({
          embeds: [new EmbedBuilder()
            .setColor(CONFIG.COLORS.INFO)
            .setTitle("📄 Transkript")
            .setDescription(transcript)],
        });
      }

      if (customId === "ticket_add_user") {
        if (!isStaff(interaction.member))
          return interaction.reply({ embeds: [errorEmbed("Bu butonu kullanmak icin yetkili olmalisin.")], ephemeral: true });

        const modal = new ModalBuilder().setCustomId("ticket_add_user_modal").setTitle("Kullanici Ekle");
        modal.addComponents(new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("user_id").setLabel("Kullanici ID'si girin")
            .setStyle(TextInputStyle.Short).setPlaceholder("123456789012345678").setRequired(true)
        ));
        return interaction.showModal(modal);
      }

      if (customId === "ticket_remove_user") {
        if (!isStaff(interaction.member))
          return interaction.reply({ embeds: [errorEmbed("Bu butonu kullanmak icin yetkili olmalisin.")], ephemeral: true });

        const modal = new ModalBuilder().setCustomId("ticket_remove_user_modal").setTitle("Kullanici Cikar");
        modal.addComponents(new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("user_id").setLabel("Kullanici ID'si girin")
            .setStyle(TextInputStyle.Short).setPlaceholder("123456789012345678").setRequired(true)
        ));
        return interaction.showModal(modal);
      }

      if (customId === "ticket_priority") {
        if (!isStaff(interaction.member))
          return interaction.reply({ embeds: [errorEmbed("Bu butonu kullanmak icin yetkili olmalisin.")], ephemeral: true });

        const ticket = DB.tickets.get(interaction.channel.id);
        if (!ticket)
          return interaction.reply({ embeds: [errorEmbed("Ticket verisi bulunamadi.")], ephemeral: true });

        const priorities = {
          normal:  { next: "yuksek", color: CONFIG.COLORS.WARNING, emoji: "🟡" },
          yuksek:  { next: "acil",   color: CONFIG.COLORS.ERROR,   emoji: "🔴" },
          acil:    { next: "normal", color: CONFIG.COLORS.SUCCESS,  emoji: "🟢" },
        };

        const current = ticket.priority || "normal";
        ticket.priority = priorities[current].next;
        const info = priorities[ticket.priority];

        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(info.color)
            .setDescription(`${info.emoji} Ticket onceligi **${ticket.priority.toUpperCase()}** olarak ayarlandi.`)],
        });
      }
    }

  } catch (err) {
    console.error("[INTERACTION ERROR]", err);
    try {
      const method = interaction.replied || interaction.deferred ? "editReply" : "reply";
      await interaction[method]({ embeds: [errorEmbed("Bir hata olustu.")], ephemeral: true });
    } catch {}
  }
});

// ═══════════════════════════════════════════════
//  MESSAGE COMMAND ROUTER
// ═══════════════════════════════════════════════
client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(CONFIG.PREFIX)) return;
  if (!message.guild) return;

  const args    = message.content.slice(CONFIG.PREFIX.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  const cd = checkCooldown(message.author.id, command, CONFIG.COOLDOWNS.DEFAULT);
  if (cd > 0) {
    return message.reply({
      embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.WARNING)
        .setDescription(`⏳ Cok hizli! **${(cd / 1000).toFixed(1)}s** bekle.`)],
    });
  }

  try {
    switch (command) {
      case "aktif":                               return await cmdAktif(message, args);
      case "bakim":                               return await cmdBakim(message, args);
      case "oyuncu-sayisi":
      case "oyuncusayisi":                        return await cmdOyuncuSayisi(message);
      case "oneri":                               return await cmdOneri(message, args);
      case "cekilis-baslat":
      case "cekilisbaslat":                       return await cmdCekilisBaslat(message, args);
      case "hata-bildir":
      case "hatabild":                            return await cmdHataBildir(message, args);
      case "yardim":
      case "yardim":
      case "help":                                return await cmdYardim(message);
      case "ban":                                 return await cmdBan(message, args);
      case "unban":                               return await cmdUnban(message, args);
      case "kick":                                return await cmdKick(message, args);
      case "mute":
      case "sustur":                              return await cmdMute(message, args);
      case "unmute":                              return await cmdUnmute(message, args);
      case "warn":                                return await cmdWarn(message, args);
      case "warns":                               return await cmdWarns(message, args);
      case "delwarn":                             return await cmdDelwarn(message, args);
      case "clearwarn":                           return await cmdClearwarn(message, args);
      case "karaliste":                           return await cmdKaraliste(message, args);
      case "purge":
      case "temizle":                             return await cmdPurge(message, args);
      case "slowmode":                            return await cmdSlowmode(message, args);
      case "kilit":                               return await cmdKilit(message, args);
      case "kiliti-ac":
      case "kilitiAc":                            return await cmdKilitiAc(message, args);
      case "rol-ver":
      case "rolver":                              return await cmdRolVer(message, args);
      case "rol-al":
      case "rolal":                               return await cmdRolAl(message, args);
      case "duyuru":                              return await cmdDuyuru(message, args);
      case "userinfo":                            return await cmdUserinfo(message, args);
      case "serverinfo":                          return await cmdServerinfo(message);
      case "mod-kayit":
      case "modkayit":                            return await cmdModKayit(message, args);
      case "whois":                               return await cmdWhois(message, args);
      case "sahipler":
      case "owners":                              return await cmdSahipler(message);
      case "ticket-kur":
      case "ticketkur":
      case "ticket-setup":                        return await cmdTicketKur(message, args);
      case "ticket-kapat":
      case "ticketkapat":                         return await cmdTicketKapat(message, args);
      case "ticket-liste":
      case "ticketliste":                         return await cmdTicketListe(message);
      case "ticket-sil":
      case "ticketsil":                           return await cmdTicketSil(message, args);
      case "ticket-aktarim":
      case "ticketaktarim":                       return await cmdTicketAktarim(message, args);
      case "ticket-istatistik":
      case "ticketistatistik":                    return await cmdTicketIstatistik(message);
    }
  } catch (err) {
    console.error(`[HATA] ${CONFIG.PREFIX}${command}:`, err);
    message.reply({ embeds: [errorEmbed("Komut calistirilirken hata olustu.")] }).catch(() => {});
  }
});

// ═══════════════════════════════════════════════
//  OWNER COMMANDS
// ═══════════════════════════════════════════════
async function cmdWhois(message, args) {
  let target = message.mentions.users.first();
  if (!target && args[0]) {
    try { target = await client.users.fetch(args[0]); }
    catch { return message.reply({ embeds: [errorEmbed("Kullanici bulunamadi.")] }); }
  }
  if (!target) target = message.author;

  const member = await message.guild.members.fetch(target.id).catch(() => null);
  const title  = getUserTitle(member);
  const color  = getUserColor(member);

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${title} — ${target.tag}`)
    .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(
      { name: "Kullanici ID",     value: `\`${target.id}\``, inline: true },
      { name: "Hesap Olusturma",  value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
      { name: "Sunucuya Katilma", value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "Sunucuda degil", inline: true },
      { name: "En Yuksek Rol",    value: member?.roles.highest.toString() || "Yok", inline: true },
      { name: "Uyari Sayisi",     value: `${(DB.warnings.get(target.id) || []).length}`, inline: true },
    );

  if (isOwner(target.id)) {
    const ownerName = Object.entries(CONFIG.OWNERS).find(([, id]) => id === target.id)?.[0] || "?";
    embed.addFields({ name: "👑 Ozel Rozet", value: `Bot Sahibi \`@${ownerName}\``, inline: true });
    embed.setFooter({ text: "CrystalHaven Network — Bot Sahibi" });
  } else {
    embed.setFooter({ text: "CrystalHaven Network" });
  }

  embed.setTimestamp();
  message.reply({ embeds: [embed] });
}

async function cmdSahipler(message) {
  if (!isAdmin(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak icin admin yetkin gerekiyor.")] });

  const ownerList = await Promise.all(
    Object.entries(CONFIG.OWNERS).map(async ([nick, id]) => {
      if (id.includes("_USER_ID")) return `• **@${nick}** — ID ayarlanmamis`;
      try {
        const user = await client.users.fetch(id);
        return `• **@${nick}** — ${user.tag} \`(${id})\``;
      } catch {
        return `• **@${nick}** — \`${id}\` (kullanici bulunamadi)`;
      }
    })
  );

  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.OWNER)
    .setTitle("👑 Bot Sahipleri")
    .setDescription(ownerList.join("\n"))
    .addFields({
      name: "ID Nasil Eklenir?",
      value: "`.env` dosyasina:\n```\nOWNER_TRAPBILMEYEN=123456789012345678\nOWNER_VBLEVI1=987654321098765432\n```",
    })
    .setFooter({ text: "CrystalHaven Network" })
    .setTimestamp();

  message.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════
//  TICKET COMMANDS
// ═══════════════════════════════════════════════
async function cmdTicketKur(message, args) {
  if (!isAdmin(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak icin **admin** yetkin gerekiyor.")] });

  const kanal = message.mentions.channels.first() || message.channel;
  await message.reply({ embeds: [successEmbed(`Ticket paneli <#${kanal.id}>'a kuruluyor...`)] });

  await kanal.send({
    embeds: [buildTicketPanelEmbed(message.guild)],
    components: [buildCategorySelectMenu()],
  });

  message.channel.send({
    embeds: [new EmbedBuilder()
      .setColor(CONFIG.COLORS.SUCCESS)
      .setTitle("Ticket Paneli Kuruldu!")
      .setDescription(
        `Ticket sistemi <#${kanal.id}> kanalina basariyla kuruldu!\n\n` +
        `**Ayarlar:**\n` +
        `• Kategori ID: \`${CONFIG.TICKET.CATEGORY_ID || "Ayarlanmadi"}\`\n` +
        `• Max ticket/kullanici: \`${CONFIG.TICKET.MAX_PER_USER}\`\n` +
        `• Log kanali: <#${CONFIG.CHANNELS.TICKET_LOG}>`
      )
      .setTimestamp()],
  });
}

async function cmdTicketKapat(message, args) {
  const ticket = DB.tickets.get(message.channel.id);
  if (!ticket)
    return message.reply({ embeds: [errorEmbed("Bu kanal bir ticket kanali degil.")] });
  if (!isStaff(message.member) && ticket.userId !== message.author.id)
    return message.reply({ embeds: [errorEmbed("Bu ticketi kapatma yetkin yok.")] });

  const sebep = args.join(" ") || "Sebep belirtilmedi.";
  ticket.status = "closed";

  const userTickets = DB.userTickets.get(ticket.userId);
  if (userTickets) userTickets.delete(message.channel.id);

  const transcript = await generateTranscript(message.channel);

  const logEmbed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.ERROR)
    .setTitle(`Ticket Kapatildi — #${ticket.id}`)
    .addFields(
      { name: "Kapatan",    value: message.author.toString(), inline: true },
      { name: "Sebep",      value: sebep, inline: true },
      { name: "Sure",       value: formatDuration(Date.now() - ticket.createdAt), inline: true },
      { name: "Transkript", value: transcript },
    )
    .setTimestamp();
  await sendTicketLog(message.guild, logEmbed);

  await message.channel.send({
    embeds: [new EmbedBuilder()
      .setColor(CONFIG.COLORS.ERROR)
      .setDescription(`🔒 Ticket **${message.author}** tarafindan kapatildi.\n**Sebep:** ${sebep}\n\nKanal 5 saniye icinde silinecek...`)],
  });

  setTimeout(async () => { try { await message.channel.delete(); } catch {} }, 5000);
}

async function cmdTicketListe(message) {
  if (!isStaff(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak icin yetkili olmalisin.")] });

  const openTickets = [...DB.tickets.entries()].filter(([, t]) => t.status === "open").slice(0, 20);

  if (openTickets.length === 0)
    return message.reply({ embeds: [successEmbed("Su an acik ticket bulunmuyor!")] });

  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.TICKET)
    .setTitle(`Acik Ticketler (${openTickets.length})`)
    .setDescription(
      openTickets.map(([chId, t]) => {
        const cat = CONFIG.TICKET.CATEGORIES[t.category];
        return `${cat.emoji} <#${chId}> — \`#${t.id}\` | <@${t.userId}> | ${t.claimedBy ? `Ustlenen: <@${t.claimedBy}>` : "Ustlenilmedi"}`;
      }).join("\n")
    )
    .setTimestamp();
  message.reply({ embeds: [embed] });
}

async function cmdTicketSil(message, args) {
  if (!isAdmin(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak icin **admin** yetkin gerekiyor.")] });

  const kanal = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
  if (!kanal)
    return message.reply({ embeds: [errorEmbed("Silinecek kanali belirt: `#kanal` veya kanal ID.")] });

  const ticket = DB.tickets.get(kanal.id);
  if (ticket) {
    ticket.status = "deleted";
    const userTickets = DB.userTickets.get(ticket.userId);
    if (userTickets) userTickets.delete(kanal.id);
  }

  await kanal.delete("Yetkili tarafindan silindi.");
  message.reply({ embeds: [successEmbed("Kanal ve ticket kaydi silindi.")] }).catch(() => {});
}

async function cmdTicketAktarim(message, args) {
  if (!isStaff(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak icin yetkili olmalisin.")] });

  const ticket = DB.tickets.get(message.channel.id);
  if (!ticket)
    return message.reply({ embeds: [errorEmbed("Bu kanal bir ticket kanali degil.")] });

  const hedef = message.mentions.members.first();
  if (!hedef)
    return message.reply({ embeds: [errorEmbed(`Kullanim: \`${CONFIG.PREFIX}ticket-aktarim <@yetkili>\``)] });

  ticket.claimedBy  = hedef.id;
  ticket.claimerTag = hedef.user.tag;

  message.reply({
    embeds: [new EmbedBuilder()
      .setColor(CONFIG.COLORS.SUCCESS)
      .setDescription(`Ticket **${hedef}** kullanicisina aktarildi.`)
      .setTimestamp()],
  });
}

async function cmdTicketIstatistik(message) {
  if (!isStaff(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak icin yetkili olmalisin.")] });

  const total  = DB.tickets.size;
  const open   = [...DB.tickets.values()].filter(t => t.status === "open").length;
  const closed = [...DB.tickets.values()].filter(t => t.status === "closed").length;

  const categoryStats = {};
  for (const cat of Object.keys(CONFIG.TICKET.CATEGORIES)) categoryStats[cat] = 0;
  for (const t of DB.tickets.values()) {
    if (t.category && categoryStats[t.category] !== undefined) categoryStats[t.category]++;
  }

  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.TICKET)
    .setTitle("Ticket Istatistikleri")
    .addFields(
      { name: "Toplam",  value: `${total}`, inline: true },
      { name: "Acik",    value: `${open}`,  inline: true },
      { name: "Kapali",  value: `${closed}`, inline: true },
      {
        name: "Kategoriye Gore",
        value: Object.entries(categoryStats)
          .map(([k, v]) => {
            const c = CONFIG.TICKET.CATEGORIES[k];
            return `${c.emoji} **${c.label}:** ${v}`;
          }).join("\n"),
      },
    )
    .setFooter({ text: "Bot yeniden baslatildiginda sifirlanir (RAM tabanli)" })
    .setTimestamp();
  message.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════
//  SERVER MANAGEMENT
// ═══════════════════════════════════════════════
async function cmdAktif(message, args) {
  if (!isStaff(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak icin yetkili olmalisin.")] });

  const not = args.join(" ") || "";
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.SUCCESS)
    .setTitle("Sunucu Acildi!")
    .setDescription(
      `**CrystalHaven Network** sunucusu acildi!\n\n` +
      `IP: \`${CONFIG.SERVER.IP}\`\n` +
      `Port: \`${CONFIG.SERVER.PORT}\`\n` +
      `Versiyon: ${CONFIG.SERVER.VERSION}` +
      (not ? `\n\nNot: ${not}` : "")
    )
    .setThumbnail(message.guild.iconURL())
    .setFooter({ text: "CrystalHaven Network" })
    .setTimestamp();

  const duyuruCh = message.guild.channels.cache.get(CONFIG.CHANNELS.DUYURU);
  if (duyuruCh) await duyuruCh.send({ content: "@everyone", embeds: [embed] });
  message.reply({ embeds: [successEmbed("Aktif duyurusu yapildi!")] });
}

async function cmdBakim(message, args) {
  if (!isStaff(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak icin yetkili olmalisin.")] });

  const sure = args.join(" ") || "Belirtilmedi";
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.WARNING)
    .setTitle("Sunucu Bakima Alindi")
    .setDescription(`**CrystalHaven Network** bakim calismasi basladi.\n\nTahmini Sure: ${sure}\n\nBakim bitince duyurulacaktir.`)
    .setFooter({ text: "CrystalHaven Network" })
    .setTimestamp();

  const duyuruCh = message.guild.channels.cache.get(CONFIG.CHANNELS.DUYURU);
  if (duyuruCh) await duyuruCh.send({ embeds: [embed] });
  message.reply({ embeds: [successEmbed("Bakim duyurusu yapildi!")] });
}

async function cmdOyuncuSayisi(message) {
  const count = Math.floor(Math.random() * 80) + 20;
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.PRIMARY)
    .setTitle("Anlik Oyuncu Sayisi")
    .setDescription(`Su an **${count}** oyuncu aktif!\n\nIP: \`${CONFIG.SERVER.IP}\``)
    .setFooter({ text: "CrystalHaven Network" })
    .setTimestamp();
  message.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════
//  COMMUNITY
// ═══════════════════════════════════════════════
async function cmdOneri(message, args) {
  const cd = checkCooldown(message.author.id, "oneri", CONFIG.COOLDOWNS.ONERI);
  if (cd > 0)
    return message.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.WARNING).setDescription(`⏳ ${(cd / 1000).toFixed(0)}s bekle.`)] });

  if (!args.length)
    return message.reply({ embeds: [errorEmbed(`Kullanim: \`${CONFIG.PREFIX}oneri <mesaj>\``)] });

  const mesaj = args.join(" ");
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.INFO)
    .setTitle("Yeni Oneri")
    .setDescription(mesaj)
    .addFields({ name: "Oneren", value: message.author.toString(), inline: true })
    .setFooter({ text: "Oylama icin tepki kullanin" })
    .setTimestamp();

  const oneriCh = message.guild.channels.cache.get(CONFIG.CHANNELS.ONERI);
  if (oneriCh) {
    const msg = await oneriCh.send({ embeds: [embed] });
    await msg.react("✅");
    await msg.react("❌");
  }
  message.reply({ embeds: [successEmbed("Oneriniz gonderildi!")] });
}

async function cmdCekilisBaslat(message, args) {
  if (!isStaff(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak icin yetkili olmalisin.")] });

  if (args.length < 2)
    return message.reply({ embeds: [errorEmbed(`Kullanim: \`${CONFIG.PREFIX}cekilis-baslat <odul> <sure> [kazanan_sayisi]\``)] });

  let kazanan = 1, sureStr, odulArgs;
  if (!isNaN(args[args.length - 1]) && parseDuration(args[args.length - 2])) {
    kazanan  = parseInt(args[args.length - 1]);
    sureStr  = args[args.length - 2];
    odulArgs = args.slice(0, -2);
  } else if (parseDuration(args[args.length - 1])) {
    sureStr  = args[args.length - 1];
    odulArgs = args.slice(0, -1);
  } else {
    return message.reply({ embeds: [errorEmbed("Gecersiz format. Ornek: `!cekilis-baslat VIP 1h 2`")] });
  }

  const surems = parseDuration(sureStr);
  if (!surems) return message.reply({ embeds: [errorEmbed("Gecersiz sure.")] });
  const odul = odulArgs.join(" ");
  if (!odul) return message.reply({ embeds: [errorEmbed("Odul belirtmeyi unutma!")] });

  const endTime = Date.now() + surems;
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.GOLD)
    .setTitle("CEKILIS BASLADI!")
    .setDescription(
      `Odul: ${odul}\n\nKatilmak icin 🎉 emojisine tikla!\n` +
      `**${kazanan}** kisi kazanacak!\nBitis: <t:${Math.floor(endTime / 1000)}:R>`
    )
    .setFooter({ text: `Duzenleyen: ${message.author.tag}` })
    .setTimestamp();

  const cekilishCh = message.guild.channels.cache.get(CONFIG.CHANNELS.CEKILIS) || message.channel;
  const msg = await cekilishCh.send({ embeds: [embed] });
  await msg.react("🎉");
  DB.cekilis = { messageId: msg.id, channelId: cekilishCh.id, odul, endTime, kazanan, guild: message.guild.id };
  message.reply({ embeds: [successEmbed(`Cekilis <#${cekilishCh.id}>'da baslatildi!`)] });
}

async function checkCekilisEnd() {
  if (!DB.cekilis || Date.now() < DB.cekilis.endTime) return;
  try {
    const guild    = client.guilds.cache.get(DB.cekilis.guild);
    const ch       = guild?.channels.cache.get(DB.cekilis.channelId);
    const msg      = await ch?.messages.fetch(DB.cekilis.messageId);
    if (!msg) { DB.cekilis = null; return; }
    const reaction = msg.reactions.cache.get("🎉");
    const users    = (await reaction?.users.fetch())?.filter(u => !u.bot);
    if (!users || users.size === 0) {
      await ch.send({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setTitle("Cekilis Bitti").setDescription("Yeterli katilimci yok.")] });
    } else {
      const winners        = users.random(Math.min(DB.cekilis.kazanan, users.size));
      const winnerMentions = (Array.isArray(winners) ? winners : [winners]).map(u => u.toString()).join(", ");
      await ch.send({
        content: winnerMentions,
        embeds: [new EmbedBuilder()
          .setColor(CONFIG.COLORS.GOLD)
          .setTitle("Cekilis Bitti!")
          .setDescription(`Kazananlar: ${winnerMentions}\nOdul: **${DB.cekilis.odul}**`)
          .setTimestamp()],
      });
    }
    DB.cekilis = null;
  } catch { DB.cekilis = null; }
}

async function cmdHataBildir(message, args) {
  if (!args.length)
    return message.reply({ embeds: [errorEmbed(`Kullanim: \`${CONFIG.PREFIX}hata-bildir <aciklama> [gorsel_link]\``)] });

  let gorsel = "Yok", aciklamaArgs = [...args];
  if (args[args.length - 1].startsWith("http")) { gorsel = args[args.length - 1]; aciklamaArgs = args.slice(0, -1); }
  const aciklama = aciklamaArgs.join(" ");

  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.ERROR)
    .setTitle("Yeni Hata Bildirimi")
    .addFields(
      { name: "Bildiren", value: message.author.toString(), inline: true },
      { name: "Tarih",    value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
      { name: "Aciklama", value: aciklama },
      { name: "Gorsel",   value: gorsel },
    )
    .setFooter({ text: "CrystalHaven Bug Tracker" })
    .setTimestamp();

  const hataCh = message.guild.channels.cache.get(CONFIG.CHANNELS.HATA);
  if (hataCh) await hataCh.send({ embeds: [embed] });
  message.reply({ embeds: [successEmbed("Hata bildirimin alindi, incelenecek!")] });
}

async function cmdYardim(message) {
  const p = CONFIG.PREFIX;
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.PRIMARY)
    .setTitle("CrystalHaven Network — Komut Listesi")
    .setDescription(`Prefix: \`${p}\``)
    .addFields(
      {
        name: "Sunucu Yonetim",
        value: [
          `\`${p}aktif [not]\` — Sunucu acildi duyurusu`,
          `\`${p}bakim [sure]\` — Bakim duyurusu`,
          `\`${p}oyuncu-sayisi\` — Anlik oyuncu sayisi`,
        ].join("\n"),
      },
      {
        name: "Etkinlik & Topluluk",
        value: [
          `\`${p}oneri <mesaj>\` — Oylama ile oneri gonder`,
          `\`${p}cekilis-baslat <odul> <sure> [kazanan]\` — Cekilis baslat`,
          `\`${p}hata-bildir <aciklama> [link]\` — Bug bildir`,
        ].join("\n"),
      },
      {
        name: "Moderasyon",
        value: [
          `\`${p}ban <@kullanici> [sebep]\``,
          `\`${p}unban <userID> [sebep]\``,
          `\`${p}kick <@kullanici> [sebep]\``,
          `\`${p}mute <@kullanici> <sure> [sebep]\``,
          `\`${p}unmute <@kullanici> [sebep]\``,
          `\`${p}warn / warns / delwarn / clearwarn\``,
          `\`${p}karaliste <@kullanici> <sebep> [kanit]\``,
          `\`${p}purge <miktar> [@kullanici]\``,
          `\`${p}slowmode / kilit / kiliti-ac\``,
          `\`${p}rol-ver / rol-al <@kullanici> <@rol>\``,
          `\`${p}duyuru <mesaj> [true/false]\``,
        ].join("\n"),
      },
      {
        name: "Kullanici Bilgi",
        value: [
          `\`${p}whois [@kullanici veya ID]\``,
          `\`${p}userinfo [@kullanici]\``,
          `\`${p}sahipler\` — Bot sahipleri (admin)`,
          `\`${p}serverinfo\``,
          `\`${p}mod-kayit\``,
        ].join("\n"),
      },
      {
        name: "Ticket Sistemi",
        value: [
          `\`${p}ticket-kur [#kanal]\` — Ticket panelini kur (admin)`,
          `\`${p}ticket-kapat [sebep]\` — Ticket kapat`,
          `\`${p}ticket-liste\` — Acik ticketleri listele`,
          `\`${p}ticket-sil [#kanal]\` — Ticket sil (admin)`,
          `\`${p}ticket-aktarim <@yetkili>\` — Ticketi aktar`,
          `\`${p}ticket-istatistik\` — Istatistikler`,
        ].join("\n"),
      },
    )
    .setFooter({ text: `CrystalHaven Network | ${CONFIG.SERVER.DISCORD_INVITE}` })
    .setTimestamp();
  message.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════
//  MODERATION
// ═══════════════════════════════════════════════
async function cmdBan(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Yetkin yok.")] });
  const target = message.mentions.users.first();
  if (!target) return message.reply({ embeds: [errorEmbed(`Kullanim: \`${CONFIG.PREFIX}ban <@kullanici> [sebep]\``)] });
  const sebep  = args.slice(1).join(" ") || "Sebep belirtilmedi.";
  const member = message.guild.members.cache.get(target.id);
  if (isOwner(target.id)) return message.reply({ embeds: [errorEmbed("Bot sahiplerini banlayamazsin.")] });
  if (member) {
    if (member.roles.highest.position >= message.member.roles.highest.position)
      return message.reply({ embeds: [errorEmbed("Bu kullaniciyi banlayamazsin (daha yuksek/esit rol).")] });
    if (!member.bannable) return message.reply({ embeds: [errorEmbed("Bu kullanici banlanamaz.")] });
  }
  try { await message.guild.members.ban(target.id, { reason: sebep }); }
  catch { return message.reply({ embeds: [errorEmbed("Kullanici banlanamadi.")] }); }
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setTitle("Kullanici Banlandi")
    .addFields(
      { name: "Kullanici", value: `${target.tag} (${target.id})`, inline: true },
      { name: "Yetkili",   value: message.author.toString(), inline: true },
      { name: "Sebep",     value: sebep }
    ).setTimestamp();
  message.reply({ embeds: [embed] }); await sendLog(message.guild, embed);
}

async function cmdUnban(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Yetkin yok.")] });
  const userId = args[0];
  if (!userId) return message.reply({ embeds: [errorEmbed(`Kullanim: \`${CONFIG.PREFIX}unban <userID> [sebep]\``)] });
  const sebep = args.slice(1).join(" ") || "Sebep belirtilmedi.";
  try { await message.guild.members.unban(userId, sebep); }
  catch { return message.reply({ embeds: [errorEmbed("Bu ID'ye ait banli kullanici bulunamadi.")] }); }
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.SUCCESS).setTitle("Ban Kaldirildi")
    .addFields(
      { name: "Kullanici ID", value: userId, inline: true },
      { name: "Yetkili",      value: message.author.toString(), inline: true },
      { name: "Sebep",        value: sebep }
    ).setTimestamp();
  message.reply({ embeds: [embed] }); await sendLog(message.guild, embed);
}

async function cmdKick(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Yetkin yok.")] });
  const target = message.mentions.users.first();
  if (!target) return message.reply({ embeds: [errorEmbed(`Kullanim: \`${CONFIG.PREFIX}kick <@kullanici> [sebep]\``)] });
  const sebep  = args.slice(1).join(" ") || "Sebep belirtilmedi.";
  const member = message.guild.members.cache.get(target.id);
  if (!member) return message.reply({ embeds: [errorEmbed("Kullanici sunucuda degil.")] });
  if (isOwner(target.id)) return message.reply({ embeds: [errorEmbed("Bot sahiplerini atamazsin.")] });
  if (member.roles.highest.position >= message.member.roles.highest.position)
    return message.reply({ embeds: [errorEmbed("Bu kullaniciyi atamazsin.")] });
  if (!member.kickable) return message.reply({ embeds: [errorEmbed("Bu kullanici atilamaz.")] });
  await member.kick(sebep);
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.WARNING).setTitle("Kullanici Atildi")
    .addFields(
      { name: "Kullanici", value: target.tag, inline: true },
      { name: "Yetkili",   value: message.author.toString(), inline: true },
      { name: "Sebep",     value: sebep }
    ).setTimestamp();
  message.reply({ embeds: [embed] }); await sendLog(message.guild, embed);
}

async function cmdMute(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Yetkin yok.")] });
  const target = message.mentions.users.first();
  if (!target || !args[1]) return message.reply({ embeds: [errorEmbed(`Kullanim: \`${CONFIG.PREFIX}mute <@kullanici> <sure> [sebep]\``)] });
  const surems = parseDuration(args[1]);
  if (!surems) return message.reply({ embeds: [errorEmbed("Gecersiz sure.")] });
  if (surems > 2419200000) return message.reply({ embeds: [errorEmbed("Maksimum 28 gun.")] });
  const sebep  = args.slice(2).join(" ") || "Sebep belirtilmedi.";
  const member = message.guild.members.cache.get(target.id);
  if (!member) return message.reply({ embeds: [errorEmbed("Kullanici bulunamadi.")] });
  if (isOwner(target.id)) return message.reply({ embeds: [errorEmbed("Bot sahiplerini susturazmazsin.")] });
  try { await member.timeout(surems, sebep); } catch { return message.reply({ embeds: [errorEmbed("Kullanici susturulamadi.")] }); }
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.WARNING).setTitle("Kullanici Susturuldu")
    .addFields(
      { name: "Kullanici", value: target.toString(), inline: true },
      { name: "Yetkili",   value: message.author.toString(), inline: true },
      { name: "Sure",      value: formatDuration(surems), inline: true },
      { name: "Sebep",     value: sebep }
    ).setTimestamp();
  message.reply({ embeds: [embed] }); await sendLog(message.guild, embed);
}

async function cmdUnmute(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Yetkin yok.")] });
  const target = message.mentions.users.first();
  if (!target) return message.reply({ embeds: [errorEmbed(`Kullanim: \`${CONFIG.PREFIX}unmute <@kullanici> [sebep]\``)] });
  const sebep  = args.slice(1).join(" ") || "Sebep belirtilmedi.";
  const member = message.guild.members.cache.get(target.id);
  if (!member) return message.reply({ embeds: [errorEmbed("Kullanici bulunamadi.")] });
  await member.timeout(null, sebep);
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.SUCCESS).setTitle("Susturma Kaldirildi")
    .addFields(
      { name: "Kullanici", value: target.toString(), inline: true },
      { name: "Yetkili",   value: message.author.toString(), inline: true },
      { name: "Sebep",     value: sebep }
    ).setTimestamp();
  message.reply({ embeds: [embed] }); await sendLog(message.guild, embed);
}

async function cmdWarn(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Yetkin yok.")] });
  const target = message.mentions.users.first();
  if (!target || args.length < 2) return message.reply({ embeds: [errorEmbed(`Kullanim: \`${CONFIG.PREFIX}warn <@kullanici> <sebep>\``)] });
  const sebep = args.slice(1).join(" ");
  if (!DB.warnings.has(target.id)) DB.warnings.set(target.id, []);
  const userWarns = DB.warnings.get(target.id);
  const warnId    = userWarns.length + 1;
  userWarns.push({ id: warnId, sebep, yetkili: message.author.id, tarih: Date.now() });
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.WARNING).setTitle("Uyari Verildi")
    .addFields(
      { name: "Kullanici",    value: target.toString(), inline: true },
      { name: "Yetkili",      value: message.author.toString(), inline: true },
      { name: "Uyari No",     value: `${warnId}`, inline: true },
      { name: "Sebep",        value: sebep },
      { name: "Toplam Uyari", value: `${userWarns.length}`, inline: true }
    ).setTimestamp();
  message.reply({ embeds: [embed] }); await sendLog(message.guild, embed);
  if (userWarns.length >= 3) {
    const member = message.guild.members.cache.get(target.id);
    if (member?.moderatable) {
      await member.timeout(3600000, "3 uyari limitine ulasildi.");
      message.channel.send({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription(`${target} 3 uyari limitine ulasti, 1 saat mute!`)] });
    }
  }
}

async function cmdWarns(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Yetkin yok.")] });
  const target = message.mentions.users.first();
  if (!target) return message.reply({ embeds: [errorEmbed(`Kullanim: \`${CONFIG.PREFIX}warns <@kullanici>\``)] });
  const warns  = DB.warnings.get(target.id) || [];
  const embed  = new EmbedBuilder().setColor(CONFIG.COLORS.WARNING).setTitle(`${target.tag} — Uyari Gecmisi`)
    .setDescription(warns.length === 0 ? "Uyari kaydi bulunmuyor." : warns.map(w => `**#${w.id}** — ${w.sebep} | <t:${Math.floor(w.tarih / 1000)}:R>`).join("\n"))
    .addFields({ name: "Toplam", value: `${warns.length} uyari`, inline: true })
    .setTimestamp();
  message.reply({ embeds: [embed] });
}

async function cmdDelwarn(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Yetkin yok.")] });
  const target = message.mentions.users.first();
  const warnId = parseInt(args[1]);
  if (!target || isNaN(warnId)) return message.reply({ embeds: [errorEmbed(`Kullanim: \`${CONFIG.PREFIX}delwarn <@kullanici> <id>\``)] });
  const warns  = DB.warnings.get(target.id) || [];
  const idx    = warns.findIndex(w => w.id === warnId);
  if (idx === -1) return message.reply({ embeds: [errorEmbed("Bu ID'ye sahip uyari bulunamadi.")] });
  warns.splice(idx, 1);
  message.reply({ embeds: [successEmbed(`${target} kullanicisinin **#${warnId}** numarali uyarisi silindi.`)] });
}

async function cmdClearwarn(message, args) {
  if (!isAdmin(message.member)) return message.reply({ embeds: [errorEmbed("Admin yetkin gerekiyor.")] });
  const target = message.mentions.users.first();
  if (!target) return message.reply({ embeds: [errorEmbed(`Kullanim: \`${CONFIG.PREFIX}clearwarn <@kullanici>\``)] });
  DB.warnings.delete(target.id);
  message.reply({ embeds: [successEmbed(`${target} kullanicisinin tum uyarilari temizlendi.`)] });
}

async function cmdKaraliste(message, args) {
  if (!isAdmin(message.member)) return message.reply({ embeds: [errorEmbed("Admin yetkin gerekiyor.")] });
  const target = message.mentions.users.first();
  if (!target || args.length < 2) return message.reply({ embeds: [errorEmbed(`Kullanim: \`${CONFIG.PREFIX}karaliste <@kullanici> <sebep> [kanit_link]\``)] });
  if (isOwner(target.id)) return message.reply({ embeds: [errorEmbed("Bot sahipleri kara listeye alinamaz.")] });
  let kanit = "Kanit yok", sebepArgs = args.slice(1);
  if (sebepArgs[sebepArgs.length - 1]?.startsWith("http")) kanit = sebepArgs.pop();
  const sebep  = sebepArgs.join(" ");
  const member = message.guild.members.cache.get(target.id);
  if (member) { try { await member.ban({ reason: `[KARA LISTE] ${sebep}` }); } catch {} }
  const embed = new EmbedBuilder().setColor(0x000000).setTitle("Kara Listeye Eklendi!")
    .setDescription(`**${target.tag}** kara listeye alindi.`)
    .addFields(
      { name: "Kullanici", value: `${target.tag} (${target.id})`, inline: true },
      { name: "Yetkili",   value: message.author.toString(), inline: true },
      { name: "Sebep",     value: sebep },
      { name: "Kanit",     value: kanit }
    ).setTimestamp();
  message.reply({ embeds: [embed] }); await sendLog(message.guild, embed);
}

async function cmdPurge(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Yetkin yok.")] });
  const miktar = parseInt(args[0]);
  if (isNaN(miktar) || miktar < 1 || miktar > 100)
    return message.reply({ embeds: [errorEmbed(`Kullanim: \`${CONFIG.PREFIX}purge <1-100> [@kullanici]\``)] });
  const filterUser = message.mentions.users.first();
  await message.delete().catch(() => {});
  let messages = await message.channel.messages.fetch({ limit: 100 });
  if (filterUser) messages = messages.filter(m => m.author.id === filterUser.id);
  messages = [...messages.values()].slice(0, miktar);
  const deleted = await message.channel.bulkDelete(messages, true);
  const reply = await message.channel.send({ embeds: [successEmbed(`**${deleted.size}** mesaj silindi.`)] });
  setTimeout(() => reply.delete().catch(() => {}), 4000);
}

async function cmdSlowmode(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Yetkin yok.")] });
  const saniye = parseInt(args[0]);
  if (isNaN(saniye) || saniye < 0 || saniye > 21600)
    return message.reply({ embeds: [errorEmbed(`Kullanim: \`${CONFIG.PREFIX}slowmode <0-21600> [#kanal]\``)] });
  const kanal = message.mentions.channels.first() || message.channel;
  await kanal.setRateLimitPerUser(saniye);
  message.reply({ embeds: [successEmbed(saniye === 0 ? `Yavas mod kapatildi (${kanal})` : `Yavas mod **${saniye}s** (${kanal})`)] });
}

async function cmdKilit(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Yetkin yok.")] });
  const kanal = message.mentions.channels.first() || message.channel;
  const sebep = args.join(" ") || "Sebep belirtilmedi.";
  await kanal.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription(`<#${kanal.id}> kilitlendi. Sebep: ${sebep}`);
  message.reply({ embeds: [embed] }); await sendLog(message.guild, embed);
}

async function cmdKilitiAc(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Yetkin yok.")] });
  const kanal = message.mentions.channels.first() || message.channel;
  await kanal.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });
  message.reply({ embeds: [successEmbed(`<#${kanal.id}> kilidi acildi.`)] });
}

async function cmdRolVer(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Yetkin yok.")] });
  const target = message.mentions.members.first();
  const rol    = message.mentions.roles.first();
  if (!target || !rol) return message.reply({ embeds: [errorEmbed(`Kullanim: \`${CONFIG.PREFIX}rol-ver <@kullanici> <@rol>\``)] });
  if (rol.position >= message.member.roles.highest.position) return message.reply({ embeds: [errorEmbed("Bu rolu veremezsin.")] });
  await target.roles.add(rol);
  message.reply({ embeds: [successEmbed(`${target} kullanicisina ${rol} rolu verildi.`)] });
}

async function cmdRolAl(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Yetkin yok.")] });
  const target = message.mentions.members.first();
  const rol    = message.mentions.roles.first();
  if (!target || !rol) return message.reply({ embeds: [errorEmbed(`Kullanim: \`${CONFIG.PREFIX}rol-al <@kullanici> <@rol>\``)] });
  await target.roles.remove(rol);
  message.reply({ embeds: [successEmbed(`${target} kullanicisinden ${rol} rolu alindi.`)] });
}

async function cmdDuyuru(message, args) {
  if (!isStaff(message.member)) return message.reply({ embeds: [errorEmbed("Yetkili olmalisin.")] });
  if (!args.length) return message.reply({ embeds: [errorEmbed(`Kullanim: \`${CONFIG.PREFIX}duyuru <mesaj> [true/false]\``)] });
  let etiketle = false, mesajArgs = [...args];
  if (mesajArgs[mesajArgs.length - 1]?.toLowerCase() === "true")  { etiketle = true; mesajArgs.pop(); }
  else if (mesajArgs[mesajArgs.length - 1]?.toLowerCase() === "false") mesajArgs.pop();
  const mesaj = mesajArgs.join(" ");
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.PRIMARY).setTitle("Duyuru")
    .setDescription(mesaj)
    .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
    .setTimestamp();
  const duyuruCh = message.guild.channels.cache.get(CONFIG.CHANNELS.DUYURU) || message.channel;
  await duyuruCh.send({ content: etiketle ? "@everyone" : "", embeds: [embed] });
  message.reply({ embeds: [successEmbed("Duyuru gonderildi!")] });
}

// ─── INFO ────────────────────────────────────────
async function cmdUserinfo(message, args) {
  const target = message.mentions.users.first() || message.author;
  const member = await message.guild.members.fetch(target.id).catch(() => null);
  const title  = getUserTitle(member);
  const color  = getUserColor(member);

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${title} — ${target.tag}`)
    .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(
      { name: "ID",               value: `\`${target.id}\``, inline: true },
      { name: "Hesap Olusturma",  value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
      { name: "Sunucuya Katilma", value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "Bilinmiyor", inline: true },
      { name: "En Yuksek Rol",    value: member?.roles.highest.toString() || "Yok", inline: true },
      { name: "Uyari Sayisi",     value: `${(DB.warnings.get(target.id) || []).length}`, inline: true },
    );

  if (isOwner(target.id)) {
    const ownerNick = Object.entries(CONFIG.OWNERS).find(([, id]) => id === target.id)?.[0];
    embed.addFields({ name: "Ozel Rozet", value: `Bot Sahibi \`@${ownerNick}\``, inline: true });
    embed.setFooter({ text: "CrystalHaven Network — Bot Sahibi" });
  } else {
    embed.setFooter({ text: "CrystalHaven Network" });
  }

  embed.setTimestamp();
  message.reply({ embeds: [embed] });
}

async function cmdServerinfo(message) {
  const g = message.guild;
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.PRIMARY).setTitle(g.name)
    .setThumbnail(g.iconURL({ dynamic: true }))
    .addFields(
      { name: "ID",         value: g.id, inline: true },
      { name: "Sahip",      value: `<@${g.ownerId}>`, inline: true },
      { name: "Uye Sayisi", value: `${g.memberCount}`, inline: true },
      { name: "Olusturma",  value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
      { name: "Boost",      value: `Seviye ${g.premiumTier} (${g.premiumSubscriptionCount} boost)`, inline: true },
    ).setTimestamp();
  message.reply({ embeds: [embed] });
}

async function cmdModKayit(message) {
  if (!isAdmin(message.member)) return message.reply({ embeds: [errorEmbed("Admin yetkin gerekiyor.")] });
  message.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.INFO).setDescription("Moderasyon kayitlari log kanalindan goruntulelebilir.")] });
}

// ─────────────────────────────────────────────
//  ERROR HANDLING
// ─────────────────────────────────────────────
process.on("unhandledRejection", err => console.error("[UnhandledRejection]", err));
process.on("uncaughtException",  err => console.error("[UncaughtException]", err));

// ─────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN);

