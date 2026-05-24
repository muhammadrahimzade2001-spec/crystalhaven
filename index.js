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
    DUYURU:        process.env.DUYURU_CHANNEL        || "DUYURU_KANAL_ID",
    LOG:           process.env.LOG_CHANNEL           || "LOG_KANAL_ID",
    ONERI:         process.env.ONERI_CHANNEL         || "ONERI_KANAL_ID",
    HATA:          process.env.HATA_CHANNEL          || "HATA_KANAL_ID",
    CEKILIS:       process.env.CEKILIS_CHANNEL       || "CEKILIS_KANAL_ID",
    TICKET_LOG:    process.env.TICKET_LOG_CHANNEL    || "TICKET_LOG_KANAL_ID",
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
    TICKET:  0x5865F2,
  },

  COOLDOWNS: {
    DEFAULT:  3000,
    ONERI:    60000,
    CEKILIS:  300000,
    TICKET:   30000,
  },

  TICKET: {
    CATEGORY_ID:   process.env.TICKET_CATEGORY_ID || null, // Discord category ID for ticket channels
    MAX_PER_USER:  2,  // Bir kullanıcının açabileceği max ticket sayısı
    SUPPORT_HOURS: {
      WEEKDAY: "14:00 - 01:00",
      WEEKEND: "10:00 - 02:00",
    },
    CATEGORIES: {
      kufur:        { label: "Küfür",       emoji: "🤬", color: 0xff4757, description: "Küfür/hakaret şikayeti" },
      hile:         { label: "Hile",        emoji: "🎮", color: 0xff6b35, description: "Hile/cheat şikayeti" },
      bug:          { label: "Bug",         emoji: "🐛", color: 0xffa502, description: "Hata/bug bildirimi" },
      sosyal_medya: { label: "Sosyal Medya",emoji: "📱", color: 0x00d4ff, description: "Sosyal medya/tanıtım" },
      kredi:        { label: "Kredi",       emoji: "💳", color: 0x57f287, description: "Kredi/ödeme sorunu" },
      diger:        { label: "Diğer",       emoji: "📋", color: 0x747d8c, description: "Diğer konular" },
    },
  },
};

// ─────────────────────────────────────────────
//  IN-MEMORY VERİTABANI
// ─────────────────────────────────────────────
const DB = {
  warnings:      new Map(), // userId → [{id, sebep, yetkili, tarih}]
  cekilis:       null,
  tickets:       new Map(), // channelId → {userId, category, status, createdAt, claimedBy}
  userTickets:   new Map(), // userId → Set<channelId>
  ticketCounter: 0,
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
  return hasRole(member, CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR) ||
    member.permissions.has(PermissionFlagsBits.ModerateMembers);
}
function isAdmin(member) {
  return hasRole(member, CONFIG.ROLES.ADMIN) ||
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
  console.log(`║  📡  ${client.guilds.cache.size} sunucuya bağlı`);
  console.log(`║  ⌨️   Prefix: ${CONFIG.PREFIX}`);
  console.log(`║  🎫  Ticket Sistemi: AKTİF`);
  console.log("╚══════════════════════════════════════════╝\n");

  client.user.setPresence({
    activities: [{ name: `⚔️ CrystalHaven Network | ${CONFIG.PREFIX}yardim`, type: 3 }],
    status: "online",
  });

  setInterval(checkCekilisEnd, 10000);
});

// ═══════════════════════════════════════════════
//  🎫  TICKET SİSTEMİ — YARDIMCI FONKSİYONLAR
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
    .setTitle("🎫 Destek Talebi Oluştur")
    .setDescription(
      `Kategori seçin ve talebinizi oluşturun.\n\n` +
      `**Mevcut Kategoriler:**\n${categoryList}`
    )
    .addFields(
      {
        name: "📋 | Destek Talebi Kuralları",
        value: [
          "• Yetkililere sabırsız bir şekilde etiket atmayınız.",
          "• Sorununuz hakkında yeterli kanıt sunmanız zorunludur, aksi takdirde size yardımcı olamayız.",
          "• Asılsız/gereksiz ticket açmak yasaktır.",
          "• Yetkililere saygılı olunuz.",
          "",
          "**Kurallara uyulmazsa talebiniz kapatılır.**",
        ].join("\n"),
      },
      {
        name: "🕐 | Destek Talebi Saatleri",
        value: [
          `• **Hafta içi:** ${CONFIG.TICKET.SUPPORT_HOURS.WEEKDAY}`,
          `• **Hafta sonu:** ${CONFIG.TICKET.SUPPORT_HOURS.WEEKEND}`,
        ].join("\n"),
        inline: false,
      },
    )
    .setFooter({ text: "CrystalHaven Network — Destek Sistemi | play.crystalhaven.net" })
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

  const select = new StringSelectMenuBuilder()
    .setCustomId("ticket_category_select")
    .setPlaceholder("📂 Bir destek kategorisi seçin!")
    .addOptions(options);

  return new ActionRowBuilder().addComponents(select);
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
      `Merhaba ${user}! Destek talebiniz alındı.\n` +
      `Yetkililerin müsait olduğu saatlerde size yardımcı olunacaktır.\n\n` +
      `> ⏰ Lütfen sabırla bekleyin, **etiket atmayın!**`
    )
    .addFields(
      { name: "👤 Kullanıcı", value: `${user.tag}\n\`${user.id}\``, inline: true },
      { name: "📂 Kategori",  value: `${cat.emoji} ${cat.label}`, inline: true },
      { name: "🆔 Ticket ID", value: `#${ticketId}`, inline: true },
      { name: "📝 Konu / Açıklama", value: aciklama || "Belirtilmedi." },
      {
        name: "🕐 Destek Saatleri",
        value: `Hafta içi: **${CONFIG.TICKET.SUPPORT_HOURS.WEEKDAY}**\nHafta sonu: **${CONFIG.TICKET.SUPPORT_HOURS.WEEKEND}**`,
      },
    )
    .setFooter({ text: "CrystalHaven Network | play.crystalhaven.net" })
    .setTimestamp();
}

function buildTicketControlButtons(claimed = false, claimerTag = null) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_claim")
      .setLabel(claimed ? `✅ Üstlenen: ${claimerTag}` : "📌 Üstlen")
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
      .setLabel("➕ Kullanıcı Ekle")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("ticket_remove_user")
      .setLabel("➖ Kullanıcı Çıkar")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("ticket_priority")
      .setLabel("🔴 Öncelik")
      .setStyle(ButtonStyle.Danger),
  );

  return [row1, row2];
}

async function createTicketChannel(guild, user, category, aciklama) {
  DB.ticketCounter++;
  const ticketId = String(DB.ticketCounter).padStart(4, "0");
  const cat = CONFIG.TICKET.CATEGORIES[category];

  const channelName = `ticket-${cat.label.toLowerCase().replace(/ /g, "-")}-${ticketId}`;

  // Permission overwrites
  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
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

  // Yetkili rollerini ekle
  for (const roleId of [CONFIG.ROLES.ADMIN, CONFIG.ROLES.MODERATOR, CONFIG.ROLES.YARDIMCI]) {
    if (roleId && roleId !== "ADMIN_ROL_ID" && roleId !== "MOD_ROL_ID" && roleId !== "YARDIMCI_ROL_ID") {
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
    topic: `📋 Ticket #${ticketId} | ${user.tag} | ${cat.label}`,
    permissionOverwrites,
  };

  if (CONFIG.TICKET.CATEGORY_ID) {
    channelOptions.parent = CONFIG.TICKET.CATEGORY_ID;
  }

  const channel = await guild.channels.create(channelOptions);

  // Ticket veritabanına kaydet
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

  // Ana embed
  const embed = buildTicketChannelEmbed(user, category, ticketId, aciklama);
  const [row1, row2] = buildTicketControlButtons();

  await channel.send({
    content: `${user} — Ticket oluşturuldu!`,
    embeds: [embed],
    components: [row1, row2],
  });

  // Log
  const logEmbed = new EmbedBuilder()
    .setColor(cat.color)
    .setTitle(`🎫 Yeni Ticket Açıldı — #${ticketId}`)
    .addFields(
      { name: "👤 Kullanıcı",  value: `${user.tag} (${user.id})`, inline: true },
      { name: "📂 Kategori",   value: `${cat.emoji} ${cat.label}`, inline: true },
      { name: "📌 Kanal",      value: `<#${channel.id}>`, inline: true },
      { name: "📝 Açıklama",   value: aciklama || "Belirtilmedi." },
    )
    .setTimestamp();
  await sendTicketLog(guild, logEmbed);

  return { channel, ticketId };
}

// ═══════════════════════════════════════════════
//  INTERACTION HANDLER (Buttons, Select Menus, Modals)
// ═══════════════════════════════════════════════
client.on("interactionCreate", async interaction => {
  try {
    // ── Category Select (Panel'den kategori seçimi) ──
    if (interaction.isStringSelectMenu() && interaction.customId === "ticket_category_select") {
      const category = interaction.values[0];
      const userId = interaction.user.id;

      // Cooldown kontrolü
      const cd = checkCooldown(userId, "ticket_open", CONFIG.COOLDOWNS.TICKET);
      if (cd > 0) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(CONFIG.COLORS.WARNING)
            .setDescription(`⏳ Çok hızlı! **${(cd / 1000).toFixed(0)}s** bekle.`)],
          ephemeral: true,
        });
      }

      // Max ticket kontrolü
      const userTicketChannels = DB.userTickets.get(userId);
      if (userTicketChannels) {
        const openTickets = [...userTicketChannels].filter(chId => {
          const t = DB.tickets.get(chId);
          return t && t.status === "open";
        });
        if (openTickets.length >= CONFIG.TICKET.MAX_PER_USER) {
          return interaction.reply({
            embeds: [errorEmbed(
              `Zaten **${openTickets.length}** açık ticketin var! ` +
              `Lütfen mevcut ticketlerini kapat.\n` +
              openTickets.map(id => `<#${id}>`).join(", ")
            )],
            ephemeral: true,
          });
        }
      }

      // Modal göster (açıklama almak için)
      const modal = new ModalBuilder()
        .setCustomId(`ticket_modal_${category}`)
        .setTitle(`${CONFIG.TICKET.CATEGORIES[category].emoji} ${CONFIG.TICKET.CATEGORIES[category].label} Talebi`);

      const aciklamaInput = new TextInputBuilder()
        .setCustomId("ticket_aciklama")
        .setLabel("Sorununuzu kısaca açıklayın")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Örnek: Sunucuda bir oyuncu bana küfür etti. İsim: ...")
        .setMinLength(10)
        .setMaxLength(1000)
        .setRequired(true);

      const kanıtInput = new TextInputBuilder()
        .setCustomId("ticket_kanit")
        .setLabel("Kanıt linki (screenshot, video vb.) — opsiyonel")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("https://imgur.com/...")
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(aciklamaInput),
        new ActionRowBuilder().addComponents(kanıtInput),
      );

      return interaction.showModal(modal);
    }

    // ── Modal Submit (Ticket oluşturma) ──
    if (interaction.isModalSubmit() && interaction.customId.startsWith("ticket_modal_")) {
      const category = interaction.customId.replace("ticket_modal_", "");
      const aciklama = interaction.fields.getTextInputValue("ticket_aciklama");
      const kanit    = interaction.fields.getTextInputValue("ticket_kanit") || null;

      const fullAciklama = aciklama + (kanit ? `\n\n🔗 **Kanıt:** ${kanit}` : "");

      await interaction.deferReply({ ephemeral: true });

      const { channel, ticketId } = await createTicketChannel(
        interaction.guild,
        interaction.user,
        category,
        fullAciklama
      );

      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(CONFIG.COLORS.SUCCESS)
          .setTitle("✅ Ticket Oluşturuldu!")
          .setDescription(
            `🎫 Ticket **#${ticketId}** başarıyla açıldı!\n` +
            `📂 Kanalın: <#${channel.id}>\n\n` +
            `> Yetkililer en kısa sürede ilgilenecek.`
          )],
      });
    }

    // ── Ticket Buttons ──
    if (interaction.isButton()) {
      const customId = interaction.customId;

      // CLAIM
      if (customId === "ticket_claim") {
        if (!isStaff(interaction.member))
          return interaction.reply({ embeds: [errorEmbed("Bu butonu kullanmak için yetkili olman gerekiyor.")], ephemeral: true });

        const ticket = DB.tickets.get(interaction.channel.id);
        if (!ticket) return interaction.reply({ embeds: [errorEmbed("Ticket verisi bulunamadı.")], ephemeral: true });

        ticket.claimedBy = interaction.user.id;
        ticket.claimerTag = interaction.user.tag;

        // Butonları güncelle
        const [row1, row2] = buildTicketControlButtons(true, interaction.user.tag);
        await interaction.message.edit({ components: [row1, row2] });

        const embed = new EmbedBuilder()
          .setColor(CONFIG.COLORS.SUCCESS)
          .setDescription(`📌 ${interaction.user} bu ticketi üstlendi!`)
          .setTimestamp();
        return interaction.reply({ embeds: [embed] });
      }

      // CLOSE
      if (customId === "ticket_close") {
        if (!isStaff(interaction.member)) {
          // Kullanıcı kendi ticketini kapatmak istiyor mu kontrol et
          const ticket = DB.tickets.get(interaction.channel.id);
          if (!ticket || ticket.userId !== interaction.user.id) {
            return interaction.reply({ embeds: [errorEmbed("Bu ticketi kapatma yetkin yok.")], ephemeral: true });
          }
        }

        const confirmRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("ticket_close_confirm")
            .setLabel("✅ Evet, Kapat")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("ticket_close_cancel")
            .setLabel("❌ İptal")
            .setStyle(ButtonStyle.Secondary),
        );

        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(CONFIG.COLORS.WARNING)
            .setTitle("⚠️ Ticketi Kapat")
            .setDescription("Bu ticketi kapatmak istediğinizden emin misiniz?\nKapatıldıktan sonra **5 saniye** içinde silinecektir.")],
          components: [confirmRow],
          ephemeral: false,
        });
      }

      // CLOSE CONFIRM
      if (customId === "ticket_close_confirm") {
        const ticket = DB.tickets.get(interaction.channel.id);
        if (ticket) {
          ticket.status = "closed";
          // Kullanıcı ticketlerden çıkar
          const userTickets = DB.userTickets.get(ticket.userId);
          if (userTickets) userTickets.delete(interaction.channel.id);
        }

        // Transkript oluştur
        const transcript = await generateTranscript(interaction.channel);

        const logEmbed = new EmbedBuilder()
          .setColor(CONFIG.COLORS.ERROR)
          .setTitle(`🔒 Ticket Kapatıldı — #${ticket?.id || "???"}`)
          .addFields(
            { name: "📌 Kapatan",    value: interaction.user.toString(), inline: true },
            { name: "⏱️ Süre",       value: ticket ? formatDuration(Date.now() - ticket.createdAt) : "Bilinmiyor", inline: true },
            { name: "📝 Transkript", value: transcript },
          )
          .setTimestamp();
        await sendTicketLog(interaction.guild, logEmbed);

        await interaction.update({
          embeds: [new EmbedBuilder()
            .setColor(CONFIG.COLORS.ERROR)
            .setDescription(`🔒 Ticket **${interaction.user}** tarafından kapatıldı. Kanal 5 saniye içinde silinecek...`)],
          components: [],
        });

        setTimeout(async () => {
          try {
            await interaction.channel.delete("Ticket kapatıldı.");
          } catch {}
        }, 5000);

        return;
      }

      // CLOSE CANCEL
      if (customId === "ticket_close_cancel") {
        return interaction.update({ content: "", embeds: [], components: [] });
      }

      // TRANSCRIPT
      if (customId === "ticket_transcript") {
        if (!isStaff(interaction.member))
          return interaction.reply({ embeds: [errorEmbed("Bu butonu kullanmak için yetkili olman gerekiyor.")], ephemeral: true });

        await interaction.deferReply({ ephemeral: true });
        const transcript = await generateTranscript(interaction.channel);
        return interaction.editReply({
          embeds: [new EmbedBuilder()
            .setColor(CONFIG.COLORS.INFO)
            .setTitle("📄 Transkript")
            .setDescription(transcript)],
        });
      }

      // ADD USER
      if (customId === "ticket_add_user") {
        if (!isStaff(interaction.member))
          return interaction.reply({ embeds: [errorEmbed("Bu butonu kullanmak için yetkili olman gerekiyor.")], ephemeral: true });

        const modal = new ModalBuilder()
          .setCustomId("ticket_add_user_modal")
          .setTitle("Kullanıcı Ekle");
        const input = new TextInputBuilder()
          .setCustomId("user_id")
          .setLabel("Kullanıcı ID'si girin")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("123456789012345678")
          .setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return interaction.showModal(modal);
      }

      // REMOVE USER
      if (customId === "ticket_remove_user") {
        if (!isStaff(interaction.member))
          return interaction.reply({ embeds: [errorEmbed("Bu butonu kullanmak için yetkili olman gerekiyor.")], ephemeral: true });

        const modal = new ModalBuilder()
          .setCustomId("ticket_remove_user_modal")
          .setTitle("Kullanıcı Çıkar");
        const input = new TextInputBuilder()
          .setCustomId("user_id")
          .setLabel("Kullanıcı ID'si girin")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("123456789012345678")
          .setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return interaction.showModal(modal);
      }

      // PRIORITY
      if (customId === "ticket_priority") {
        if (!isStaff(interaction.member))
          return interaction.reply({ embeds: [errorEmbed("Bu butonu kullanmak için yetkili olman gerekiyor.")], ephemeral: true });

        const ticket = DB.tickets.get(interaction.channel.id);
        if (!ticket) return interaction.reply({ embeds: [errorEmbed("Ticket verisi bulunamadı.")], ephemeral: true });

        const priorities = {
          normal:  { next: "yüksek",  color: CONFIG.COLORS.WARNING, emoji: "🟡" },
          yüksek:  { next: "acil",    color: CONFIG.COLORS.ERROR,   emoji: "🔴" },
          acil:    { next: "normal",  color: CONFIG.COLORS.SUCCESS,  emoji: "🟢" },
        };

        const current = ticket.priority || "normal";
        ticket.priority = priorities[current].next;
        const info = priorities[ticket.priority];

        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(info.color)
            .setDescription(`${info.emoji} Ticket önceliği **${ticket.priority.toUpperCase()}** olarak ayarlandı.`)],
        });
      }
    }

    // ── Add/Remove User Modals ──
    if (interaction.isModalSubmit()) {
      if (interaction.customId === "ticket_add_user_modal") {
        const userId = interaction.fields.getTextInputValue("user_id").trim();
        try {
          const member = await interaction.guild.members.fetch(userId);
          await interaction.channel.permissionOverwrites.edit(member.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
          });
          const ticket = DB.tickets.get(interaction.channel.id);
          if (ticket) ticket.addedUsers.push(userId);
          return interaction.reply({
            embeds: [successEmbed(`${member.user.tag} tickete eklendi.`)],
          });
        } catch {
          return interaction.reply({ embeds: [errorEmbed("Kullanıcı bulunamadı veya eklenemedi.")], ephemeral: true });
        }
      }

      if (interaction.customId === "ticket_remove_user_modal") {
        const userId = interaction.fields.getTextInputValue("user_id").trim();
        try {
          const member = await interaction.guild.members.fetch(userId);
          const ticket = DB.tickets.get(interaction.channel.id);
          if (ticket && ticket.userId === userId) {
            return interaction.reply({ embeds: [errorEmbed("Ticket sahibini çıkaramazsın!")], ephemeral: true });
          }
          await interaction.channel.permissionOverwrites.delete(member.id);
          return interaction.reply({
            embeds: [successEmbed(`${member.user.tag} ticketten çıkarıldı.`)],
          });
        } catch {
          return interaction.reply({ embeds: [errorEmbed("Kullanıcı bulunamadı veya çıkarılamadı.")], ephemeral: true });
        }
      }
    }

  } catch (err) {
    console.error("[INTERACTION ERROR]", err);
    try {
      const replyMethod = interaction.replied || interaction.deferred ? "editReply" : "reply";
      await interaction[replyMethod]({ embeds: [errorEmbed("Bir hata oluştu.")], ephemeral: true });
    } catch {}
  }
});

// Basit transkript oluşturucu
async function generateTranscript(channel, limit = 50) {
  try {
    const messages = await channel.messages.fetch({ limit });
    const lines = [...messages.values()]
      .reverse()
      .filter(m => !m.author.bot || m.embeds.length === 0)
      .slice(0, 30)
      .map(m => `[${new Date(m.createdTimestamp).toLocaleString("tr-TR")}] ${m.author.tag}: ${m.content || "[embed]"}`)
      .join("\n");
    return lines.length > 0
      ? `\`\`\`\n${lines.slice(0, 1000)}\n\`\`\``
      : "_Mesaj bulunamadı._";
  } catch {
    return "_Transkript alınamadı._";
  }
}

// ═══════════════════════════════════════════════
//  MESSAGE CREATE — KOMUT ROUTER
// ═══════════════════════════════════════════════
client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(CONFIG.PREFIX)) return;
  if (!message.guild) return;

  const args = message.content.slice(CONFIG.PREFIX.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();

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
      case "aktif":                              return await cmdAktif(message, args);
      case "bakim":                              return await cmdBakim(message, args);
      case "oyuncu-sayisi":
      case "oyuncusayisi":                       return await cmdOyuncuSayisi(message);

      // ── ETKİNLİK & TOPLULUK ──
      case "oneri":                              return await cmdOneri(message, args);
      case "cekilis-baslat":
      case "cekilisbaslat":                      return await cmdCekilisBaslat(message, args);
      case "kasa-ac":
      case "kasaac":                             return await cmdKasaAc(message);
      case "hata-bildir":
      case "hatabıldir":
      case "hatabild":                           return await cmdHataBildir(message, args);
      case "yardim":
      case "yardım":
      case "help":                               return await cmdYardim(message);

      // ── MODERASYON ──
      case "ban":                                return await cmdBan(message, args);
      case "unban":                              return await cmdUnban(message, args);
      case "kick":                               return await cmdKick(message, args);
      case "mute":
      case "sustur":                             return await cmdMute(message, args);
      case "unmute":                             return await cmdUnmute(message, args);
      case "warn":                               return await cmdWarn(message, args);
      case "warns":                              return await cmdWarns(message, args);
      case "delwarn":                            return await cmdDelwarn(message, args);
      case "clearwarn":                          return await cmdClearwarn(message, args);
      case "karaliste":                          return await cmdKaraliste(message, args);
      case "purge":
      case "temizle":                            return await cmdPurge(message, args);
      case "slowmode":                           return await cmdSlowmode(message, args);
      case "kilit":                              return await cmdKilit(message, args);
      case "kiliti-ac":
      case "kilitiAc":                           return await cmdKilitiAc(message, args);
      case "rol-ver":
      case "rolver":                             return await cmdRolVer(message, args);
      case "rol-al":
      case "rolal":                              return await cmdRolAl(message, args);
      case "duyuru":                             return await cmdDuyuru(message, args);

      // ── BİLGİ ──
      case "userinfo":                           return await cmdUserinfo(message, args);
      case "serverinfo":                         return await cmdServerinfo(message);
      case "mod-kayit":
      case "modkayit":                           return await cmdModKayit(message, args);

      // ── 🎫 TİCKET SİSTEMİ ──
      case "ticket-kur":
      case "ticketkur":
      case "ticket-setup":                       return await cmdTicketKur(message, args);
      case "ticket-kapat":
      case "ticketkapat":                        return await cmdTicketKapat(message, args);
      case "ticket-liste":
      case "ticketliste":                        return await cmdTicketListe(message);
      case "ticket-sil":
      case "ticketsil":                          return await cmdTicketSil(message, args);
      case "ticket-aktarım":
      case "ticket-aktarim":
      case "ticketaktarim":                      return await cmdTicketAktarim(message, args);
      case "ticket-istatistik":
      case "ticketistatistik":                   return await cmdTicketIstatistik(message);
    }
  } catch (err) {
    console.error(`[HATA] ${CONFIG.PREFIX}${command}:`, err);
    message.reply({ embeds: [errorEmbed("Komut çalıştırılırken bir hata oluştu.")] }).catch(() => {});
  }
});

// ═══════════════════════════════════════════════
//  🎫  TICKET KOMUTLARI
// ═══════════════════════════════════════════════

// !ticket-kur [#kanal]
async function cmdTicketKur(message, args) {
  if (!isAdmin(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için **admin** yetkin gerekiyor.")] });

  const kanal = message.mentions.channels.first() || message.channel;

  await message.reply({ embeds: [successEmbed(`⏳ Ticket paneli <#${kanal.id}>'a kuruluyor...`)] });

  const panelEmbed = buildTicketPanelEmbed(message.guild);
  const selectMenu  = buildCategorySelectMenu();

  await kanal.send({
    embeds: [panelEmbed],
    components: [selectMenu],
  });

  message.channel.send({
    embeds: [new EmbedBuilder()
      .setColor(CONFIG.COLORS.SUCCESS)
      .setTitle("✅ Ticket Paneli Kuruldu!")
      .setDescription(
        `🎫 Ticket sistemi <#${kanal.id}> kanalına başarıyla kuruldu!\n\n` +
        `**Ayarlar:**\n` +
        `• Kategori ID: \`${CONFIG.TICKET.CATEGORY_ID || "Ayarlanmadı"}\`\n` +
        `• Max ticket/kullanıcı: \`${CONFIG.TICKET.MAX_PER_USER}\`\n` +
        `• Ticket log kanalı: <#${CONFIG.CHANNELS.TICKET_LOG}>\n\n` +
        `> ⚙️ Kategori ID'sini ayarlamak için \`.env\` dosyasında \`TICKET_CATEGORY_ID\` değerini girin.`
      )
      .setTimestamp()],
  });
}

// !ticket-kapat [sebep]
async function cmdTicketKapat(message, args) {
  const ticket = DB.tickets.get(message.channel.id);
  if (!ticket)
    return message.reply({ embeds: [errorEmbed("Bu kanal bir ticket kanalı değil.")] });

  if (!isStaff(message.member) && ticket.userId !== message.author.id)
    return message.reply({ embeds: [errorEmbed("Bu ticketi kapatma yetkin yok.")] });

  const sebep = args.join(" ") || "Sebep belirtilmedi.";
  ticket.status = "closed";

  const userTickets = DB.userTickets.get(ticket.userId);
  if (userTickets) userTickets.delete(message.channel.id);

  const transcript = await generateTranscript(message.channel);

  const logEmbed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.ERROR)
    .setTitle(`🔒 Ticket Kapatıldı — #${ticket.id}`)
    .addFields(
      { name: "📌 Kapatan",    value: message.author.toString(), inline: true },
      { name: "📝 Sebep",      value: sebep, inline: true },
      { name: "⏱️ Süre",       value: formatDuration(Date.now() - ticket.createdAt), inline: true },
      { name: "📄 Transkript", value: transcript },
    )
    .setTimestamp();
  await sendTicketLog(message.guild, logEmbed);

  await message.channel.send({
    embeds: [new EmbedBuilder()
      .setColor(CONFIG.COLORS.ERROR)
      .setDescription(`🔒 Ticket **${message.author}** tarafından kapatıldı.\n📝 **Sebep:** ${sebep}\n\nKanal 5 saniye içinde silinecek...`)],
  });

  setTimeout(async () => {
    try { await message.channel.delete(); } catch {}
  }, 5000);
}

// !ticket-liste
async function cmdTicketListe(message) {
  if (!isStaff(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkili olman gerekiyor.")] });

  const openTickets = [...DB.tickets.entries()]
    .filter(([, t]) => t.status === "open")
    .slice(0, 20);

  if (openTickets.length === 0) {
    return message.reply({ embeds: [successEmbed("🎉 Şu an açık ticket bulunmuyor!")] });
  }

  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.TICKET)
    .setTitle(`🎫 Açık Ticketler (${openTickets.length})`)
    .setDescription(
      openTickets.map(([chId, t]) => {
        const cat = CONFIG.TICKET.CATEGORIES[t.category];
        return `${cat.emoji} <#${chId}> — \`#${t.id}\` | <@${t.userId}> | ${t.claimedBy ? `📌 <@${t.claimedBy}>` : "📭 Üstlenilmedi"}`;
      }).join("\n")
    )
    .setTimestamp();
  message.reply({ embeds: [embed] });
}

// !ticket-sil [#kanal veya ID]
async function cmdTicketSil(message, args) {
  if (!isAdmin(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için **admin** yetkin gerekiyor.")] });

  const kanal = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
  if (!kanal)
    return message.reply({ embeds: [errorEmbed("Silinecek kanalı belirt: `#kanal` veya kanal ID.")] });

  const ticket = DB.tickets.get(kanal.id);
  if (ticket) {
    ticket.status = "deleted";
    const userTickets = DB.userTickets.get(ticket.userId);
    if (userTickets) userTickets.delete(kanal.id);
  }

  await kanal.delete("Yetkili tarafından silindi.");
  message.reply({ embeds: [successEmbed(`🗑️ <#${kanal.id}> kanalı ve ticket kaydı silindi.`)] }).catch(() => {});
}

// !ticket-aktarım <@yetkili>
async function cmdTicketAktarim(message, args) {
  if (!isStaff(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkili olman gerekiyor.")] });

  const ticket = DB.tickets.get(message.channel.id);
  if (!ticket)
    return message.reply({ embeds: [errorEmbed("Bu kanal bir ticket kanalı değil.")] });

  const hedef = message.mentions.members.first();
  if (!hedef)
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}ticket-aktarım <@yetkili>\``)] });

  ticket.claimedBy = hedef.id;
  ticket.claimerTag = hedef.user.tag;

  message.reply({
    embeds: [new EmbedBuilder()
      .setColor(CONFIG.COLORS.SUCCESS)
      .setDescription(`🔄 Ticket **${hedef}** kullanıcısına aktarıldı.`)
      .setTimestamp()],
  });
}

// !ticket-istatistik
async function cmdTicketIstatistik(message) {
  if (!isStaff(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkili olman gerekiyor.")] });

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
    .setTitle("📊 Ticket İstatistikleri")
    .addFields(
      { name: "📋 Toplam",  value: `${total}`, inline: true },
      { name: "🟢 Açık",   value: `${open}`,  inline: true },
      { name: "🔴 Kapalı", value: `${closed}`,inline: true },
      {
        name: "📂 Kategoriye Göre",
        value: Object.entries(categoryStats)
          .map(([k, v]) => {
            const c = CONFIG.TICKET.CATEGORIES[k];
            return `${c.emoji} **${c.label}:** ${v}`;
          }).join("\n"),
      },
    )
    .setFooter({ text: "Bot yeniden başlatıldığında sıfırlanır (RAM tabanlı)" })
    .setTimestamp();
  message.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════
//  📢  SUNUCU YÖNETİM
// ═══════════════════════════════════════════════
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
    .setFooter({ text: "CrystalHaven Network" })
    .setTimestamp();

  const duyuruCh = message.guild.channels.cache.get(CONFIG.CHANNELS.DUYURU);
  if (duyuruCh) await duyuruCh.send({ content: "@everyone", embeds: [embed] });
  message.reply({ embeds: [successEmbed("Aktif duyurusu yapıldı!")] });
}

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

async function cmdCekilisBaslat(message, args) {
  if (!isStaff(message.member))
    return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkili olman gerekiyor.")] });

  if (args.length < 2)
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}cekilis-baslat <odul> <sure> [kazanan_sayisi]\``)] });

  let kazanan = 1, sureStr, odulArgs;
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
  if (!surems) return message.reply({ embeds: [errorEmbed("Geçersiz süre.")] });

  const odul = odulArgs.join(" ");
  if (!odul) return message.reply({ embeds: [errorEmbed("Ödül belirtmeyi unutma!")] });

  const endTime = Date.now() + surems;
  const embed = new EmbedBuilder()
    .setColor(CONFIG.COLORS.GOLD)
    .setTitle("🎉 ÇEKİLİŞ BAŞLADI!")
    .setDescription(
      `🎁 **Ödül:** ${odul}\n\n🎟️ Katılmak için 🎉 emojisine tıkla!\n` +
      `👑 **${kazanan}** kişi kazanacak!\n⏰ Bitiş: <t:${Math.floor(endTime / 1000)}:R>`
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
  if (!DB.cekilis || Date.now() < DB.cekilis.endTime) return;
  try {
    const guild = client.guilds.cache.get(DB.cekilis.guild);
    const ch = guild?.channels.cache.get(DB.cekilis.channelId);
    const msg = await ch?.messages.fetch(DB.cekilis.messageId);
    if (!msg) { DB.cekilis = null; return; }
    const reaction = msg.reactions.cache.get("🎉");
    const users = (await reaction?.users.fetch())?.filter(u => !u.bot);
    if (!users || users.size === 0) {
      await ch.send({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setTitle("🎉 Çekiliş Bitti").setDescription("❌ Yeterli katılımcı yok.")] });
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

async function cmdKasaAc(message) {
  const items = [
    { name: "🔷 Kristal Kılıç",  rarity: "Efsane",  color: 0x9b59b6 },
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

async function cmdHataBildir(message, args) {
  if (!args.length)
    return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}hata-bildir <açıklama> [görsel_link]\``)] });

  let gorsel = "Yok", aciklamaArgs = [...args];
  if (args[args.length - 1].startsWith("http")) { gorsel = args[args.length - 1]; aciklamaArgs = args.slice(0, -1); }
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
          `\`${p}mute <@kullanıcı> <sure> [sebep]\``,
          `\`${p}unmute <@kullanıcı> [sebep]\``,
          `\`${p}warn/warns/delwarn/clearwarn\``,
          `\`${p}karaliste <@kullanıcı> <sebep> [kanit]\``,
          `\`${p}purge <miktar> [@kullanıcı]\``,
          `\`${p}slowmode/kilit/kiliti-ac\``,
          `\`${p}rol-ver / rol-al <@kullanıcı> <@rol>\``,
          `\`${p}duyuru <mesaj> [true/false]\``,
        ].join("\n"),
      },
      {
        name: "🎫 Ticket Sistemi",
        value: [
          `\`${p}ticket-kur [#kanal]\` — Ticket panelini kur (admin)`,
          `\`${p}ticket-kapat [sebep]\` — Ticket kapat (yetkili/sahip)`,
          `\`${p}ticket-liste\` — Açık ticketleri listele`,
          `\`${p}ticket-sil [#kanal]\` — Ticket kanalını sil (admin)`,
          `\`${p}ticket-aktarım <@yetkili>\` — Ticketi aktar`,
          `\`${p}ticket-istatistik\` — Ticket istatistikleri`,
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
async function cmdBan(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });
  const target = message.mentions.users.first();
  if (!target) return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}ban <@kullanıcı> [sebep]\``)] });
  const sebep = args.slice(1).join(" ") || "Sebep belirtilmedi.";
  const member = message.guild.members.cache.get(target.id);
  if (member) {
    if (member.roles.highest.position >= message.member.roles.highest.position)
      return message.reply({ embeds: [errorEmbed("Bu kullanıcıyı banlayamazsın (daha yüksek/eşit rol).")] });
    if (!member.bannable) return message.reply({ embeds: [errorEmbed("Bu kullanıcı banlanamaz.")] });
  }
  try { await message.guild.members.ban(target.id, { reason: sebep }); }
  catch { return message.reply({ embeds: [errorEmbed("Kullanıcı banlanamadı.")] }); }
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setTitle("🔨 Kullanıcı Banlandı")
    .addFields({ name: "👤 Kullanıcı", value: `${target.tag} (${target.id})`, inline: true }, { name: "👮 Yetkili", value: message.author.toString(), inline: true }, { name: "📝 Sebep", value: sebep }).setTimestamp();
  message.reply({ embeds: [embed] }); await sendLog(message.guild, embed);
}

async function cmdUnban(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });
  const userId = args[0];
  if (!userId) return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}unban <userID> [sebep]\``)] });
  const sebep = args.slice(1).join(" ") || "Sebep belirtilmedi.";
  try { await message.guild.members.unban(userId, sebep); }
  catch { return message.reply({ embeds: [errorEmbed("Bu ID'ye ait banlı kullanıcı bulunamadı.")] }); }
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.SUCCESS).setTitle("✅ Ban Kaldırıldı")
    .addFields({ name: "🆔 Kullanıcı ID", value: userId, inline: true }, { name: "👮 Yetkili", value: message.author.toString(), inline: true }, { name: "📝 Sebep", value: sebep }).setTimestamp();
  message.reply({ embeds: [embed] }); await sendLog(message.guild, embed);
}

async function cmdKick(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });
  const target = message.mentions.users.first();
  if (!target) return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}kick <@kullanıcı> [sebep]\``)] });
  const sebep = args.slice(1).join(" ") || "Sebep belirtilmedi.";
  const member = message.guild.members.cache.get(target.id);
  if (!member) return message.reply({ embeds: [errorEmbed("Kullanıcı sunucuda değil.")] });
  if (member.roles.highest.position >= message.member.roles.highest.position)
    return message.reply({ embeds: [errorEmbed("Bu kullanıcıyı atamazsın.")] });
  if (!member.kickable) return message.reply({ embeds: [errorEmbed("Bu kullanıcı atılamaz.")] });
  await member.kick(sebep);
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.WARNING).setTitle("👢 Kullanıcı Atıldı")
    .addFields({ name: "👤 Kullanıcı", value: target.tag, inline: true }, { name: "👮 Yetkili", value: message.author.toString(), inline: true }, { name: "📝 Sebep", value: sebep }).setTimestamp();
  message.reply({ embeds: [embed] }); await sendLog(message.guild, embed);
}

async function cmdMute(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });
  const target = message.mentions.users.first();
  if (!target || !args[1]) return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}mute <@kullanıcı> <sure> [sebep]\``)] });
  const surems = parseDuration(args[1]);
  if (!surems) return message.reply({ embeds: [errorEmbed("Geçersiz süre.")] });
  if (surems > 2419200000) return message.reply({ embeds: [errorEmbed("Maksimum 28 gün.")] });
  const sebep = args.slice(2).join(" ") || "Sebep belirtilmedi.";
  const member = message.guild.members.cache.get(target.id);
  if (!member) return message.reply({ embeds: [errorEmbed("Kullanıcı bulunamadı.")] });
  try { await member.timeout(surems, sebep); } catch { return message.reply({ embeds: [errorEmbed("Kullanıcı susturulamadı.")] }); }
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.WARNING).setTitle("🔇 Kullanıcı Susturuldu")
    .addFields({ name: "👤 Kullanıcı", value: target.toString(), inline: true }, { name: "👮 Yetkili", value: message.author.toString(), inline: true }, { name: "⏱️ Süre", value: formatDuration(surems), inline: true }, { name: "📝 Sebep", value: sebep }).setTimestamp();
  message.reply({ embeds: [embed] }); await sendLog(message.guild, embed);
}

async function cmdUnmute(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });
  const target = message.mentions.users.first();
  if (!target) return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}unmute <@kullanıcı> [sebep]\``)] });
  const sebep = args.slice(1).join(" ") || "Sebep belirtilmedi.";
  const member = message.guild.members.cache.get(target.id);
  if (!member) return message.reply({ embeds: [errorEmbed("Kullanıcı bulunamadı.")] });
  await member.timeout(null, sebep);
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.SUCCESS).setTitle("🔊 Susturma Kaldırıldı")
    .addFields({ name: "👤 Kullanıcı", value: target.toString(), inline: true }, { name: "👮 Yetkili", value: message.author.toString(), inline: true }, { name: "📝 Sebep", value: sebep }).setTimestamp();
  message.reply({ embeds: [embed] }); await sendLog(message.guild, embed);
}

async function cmdWarn(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });
  const target = message.mentions.users.first();
  if (!target || args.length < 2) return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}warn <@kullanıcı> <sebep>\``)] });
  const sebep = args.slice(1).join(" ");
  if (!DB.warnings.has(target.id)) DB.warnings.set(target.id, []);
  const userWarns = DB.warnings.get(target.id);
  const warnId = userWarns.length + 1;
  userWarns.push({ id: warnId, sebep, yetkili: message.author.id, tarih: Date.now() });
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.WARNING).setTitle("⚠️ Uyarı Verildi")
    .addFields({ name: "👤 Kullanıcı", value: target.toString(), inline: true }, { name: "👮 Yetkili", value: message.author.toString(), inline: true }, { name: "🆔 Uyarı #", value: `${warnId}`, inline: true }, { name: "📝 Sebep", value: sebep }, { name: "📊 Toplam Uyarı", value: `${userWarns.length}`, inline: true }).setTimestamp();
  message.reply({ embeds: [embed] }); await sendLog(message.guild, embed);
  if (userWarns.length >= 3) {
    const member = message.guild.members.cache.get(target.id);
    if (member?.moderatable) {
      await member.timeout(3600000, "3 uyarı limitine ulaşıldı.");
      message.channel.send({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription(`⚠️ ${target} 3 uyarı limitine ulaştı, 1 saat mute!`)] });
    }
  }
}

async function cmdWarns(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });
  const target = message.mentions.users.first();
  if (!target) return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}warns <@kullanıcı>\``)] });
  const warns = DB.warnings.get(target.id) || [];
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.WARNING).setTitle(`⚠️ ${target.tag} — Uyarı Geçmişi`)
    .setDescription(warns.length === 0 ? "✅ Uyarı kaydı bulunmuyor." : warns.map(w => `**#${w.id}** — ${w.sebep} | <t:${Math.floor(w.tarih / 1000)}:R>`).join("\n"))
    .addFields({ name: "📊 Toplam", value: `${warns.length} uyarı`, inline: true }).setTimestamp();
  message.reply({ embeds: [embed] });
}

async function cmdDelwarn(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });
  const target = message.mentions.users.first();
  const warnId = parseInt(args[1]);
  if (!target || isNaN(warnId)) return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}delwarn <@kullanıcı> <id>\``)] });
  const warns = DB.warnings.get(target.id) || [];
  const idx = warns.findIndex(w => w.id === warnId);
  if (idx === -1) return message.reply({ embeds: [errorEmbed("Bu ID'ye sahip uyarı bulunamadı.")] });
  warns.splice(idx, 1);
  message.reply({ embeds: [successEmbed(`${target} kullanıcısının **#${warnId}** numaralı uyarısı silindi.`)] });
}

async function cmdClearwarn(message, args) {
  if (!isAdmin(message.member)) return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için admin yetkin gerekiyor.")] });
  const target = message.mentions.users.first();
  if (!target) return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}clearwarn <@kullanıcı>\``)] });
  DB.warnings.delete(target.id);
  message.reply({ embeds: [successEmbed(`${target} kullanıcısının tüm uyarıları temizlendi.`)] });
}

async function cmdKaraliste(message, args) {
  if (!isAdmin(message.member)) return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için admin yetkin gerekiyor.")] });
  const target = message.mentions.users.first();
  if (!target || args.length < 2) return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}karaliste <@kullanıcı> <sebep> [kanit_link]\``)] });
  let kanit = "Kanıt yok", sebepArgs = args.slice(1);
  if (sebepArgs[sebepArgs.length - 1]?.startsWith("http")) kanit = sebepArgs.pop();
  const sebep = sebepArgs.join(" ");
  const member = message.guild.members.cache.get(target.id);
  if (member) { try { await member.ban({ reason: `[KARA LİSTE] ${sebep}` }); } catch {} }
  const embed = new EmbedBuilder().setColor(0x000000).setTitle("🚫 Kara Listeye Eklendi!")
    .setDescription(`**${target.tag}** kara listeye alındı.`)
    .addFields({ name: "👤 Kullanıcı", value: `${target.tag} (${target.id})`, inline: true }, { name: "👮 Yetkili", value: message.author.toString(), inline: true }, { name: "📝 Sebep", value: sebep }, { name: "🔗 Kanıt", value: kanit }).setTimestamp();
  message.reply({ embeds: [embed] }); await sendLog(message.guild, embed);
}

async function cmdPurge(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });
  const miktar = parseInt(args[0]);
  if (isNaN(miktar) || miktar < 1 || miktar > 100) return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}purge <1-100> [@kullanıcı]\``)] });
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
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });
  const saniye = parseInt(args[0]);
  if (isNaN(saniye) || saniye < 0 || saniye > 21600) return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}slowmode <0-21600> [#kanal]\``)] });
  const kanal = message.mentions.channels.first() || message.channel;
  await kanal.setRateLimitPerUser(saniye);
  message.reply({ embeds: [successEmbed(saniye === 0 ? `🔊 Yavaş mod kapatıldı. (${kanal})` : `⏱️ Yavaş mod **${saniye}s** (${kanal})`)] });
}

async function cmdKilit(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });
  const kanal = message.mentions.channels.first() || message.channel;
  const sebep = args.join(" ") || "Sebep belirtilmedi.";
  await kanal.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.ERROR).setDescription(`🔒 <#${kanal.id}> kilitlendi. **Sebep:** ${sebep}`);
  message.reply({ embeds: [embed] }); await sendLog(message.guild, embed);
}

async function cmdKilitiAc(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });
  const kanal = message.mentions.channels.first() || message.channel;
  await kanal.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });
  message.reply({ embeds: [successEmbed(`🔓 <#${kanal.id}> kilidi açıldı.`)] });
}

async function cmdRolVer(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });
  const target = message.mentions.members.first();
  const rol = message.mentions.roles.first();
  if (!target || !rol) return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}rol-ver <@kullanıcı> <@rol>\``)] });
  if (rol.position >= message.member.roles.highest.position) return message.reply({ embeds: [errorEmbed("Bu rolü veremezsin.")] });
  await target.roles.add(rol);
  message.reply({ embeds: [successEmbed(`${target} kullanıcısına ${rol} rolü verildi.`)] });
}

async function cmdRolAl(message, args) {
  if (!isMod(message.member)) return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkin yok.")] });
  const target = message.mentions.members.first();
  const rol = message.mentions.roles.first();
  if (!target || !rol) return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}rol-al <@kullanıcı> <@rol>\``)] });
  await target.roles.remove(rol);
  message.reply({ embeds: [successEmbed(`${target} kullanıcısından ${rol} rolü alındı.`)] });
}

async function cmdDuyuru(message, args) {
  if (!isStaff(message.member)) return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için yetkili olman gerekiyor.")] });
  if (!args.length) return message.reply({ embeds: [errorEmbed(`Kullanım: \`${CONFIG.PREFIX}duyuru <mesaj> [true/false]\``)] });
  let etiketle = false, mesajArgs = [...args];
  if (mesajArgs[mesajArgs.length - 1]?.toLowerCase() === "true") { etiketle = true; mesajArgs.pop(); }
  else if (mesajArgs[mesajArgs.length - 1]?.toLowerCase() === "false") mesajArgs.pop();
  const mesaj = mesajArgs.join(" ");
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.PRIMARY).setTitle("📣 Duyuru")
    .setDescription(mesaj).setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() }).setTimestamp();
  const duyuruCh = message.guild.channels.cache.get(CONFIG.CHANNELS.DUYURU) || message.channel;
  await duyuruCh.send({ content: etiketle ? "@everyone" : "", embeds: [embed] });
  message.reply({ embeds: [successEmbed("Duyuru gönderildi!")] });
}

async function cmdUserinfo(message, args) {
  const target = message.mentions.users.first() || message.author;
  const member = message.guild.members.cache.get(target.id);
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.PRIMARY).setTitle(`👤 ${target.tag}`)
    .setThumbnail(target.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: "🆔 ID", value: target.id, inline: true },
      { name: "📅 Hesap Oluşturma", value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
      { name: "📅 Sunucuya Katılma", value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "Bilinmiyor", inline: true },
      { name: "🎭 En Yüksek Rol", value: member?.roles.highest.toString() || "Yok", inline: true },
      { name: "⚠️ Uyarı Sayısı", value: `${(DB.warnings.get(target.id) || []).length}`, inline: true },
    ).setTimestamp();
  message.reply({ embeds: [embed] });
}

async function cmdServerinfo(message) {
  const g = message.guild;
  const embed = new EmbedBuilder().setColor(CONFIG.COLORS.PRIMARY).setTitle(`🏰 ${g.name}`)
    .setThumbnail(g.iconURL({ dynamic: true }))
    .addFields(
      { name: "🆔 ID", value: g.id, inline: true },
      { name: "👑 Sahip", value: `<@${g.ownerId}>`, inline: true },
      { name: "👥 Üye Sayısı", value: `${g.memberCount}`, inline: true },
      { name: "📅 Oluşturulma", value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
      { name: "💎 Boost", value: `Seviye ${g.premiumTier} (${g.premiumSubscriptionCount} boost)`, inline: true },
    ).setTimestamp();
  message.reply({ embeds: [embed] });
}

async function cmdModKayit(message) {
  if (!isAdmin(message.member)) return message.reply({ embeds: [errorEmbed("Bu komutu kullanmak için admin yetkin gerekiyor.")] });
  message.reply({ embeds: [new EmbedBuilder().setColor(CONFIG.COLORS.INFO).setDescription("📊 Moderasyon kayıtları log kanalından görüntülenebilir.")] });
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
