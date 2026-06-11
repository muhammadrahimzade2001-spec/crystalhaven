const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.GuildMember],
});

// ─── Slash Komutları Tanımla ───────────────────────────────────────────────────
const commands = [
  new SlashCommandBuilder()
    .setName('kur')
    .setDescription('Sunucuyu otomatik olarak kurar (kanallar, roller, izinler).')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bir kullanıcıyı sunucudan banlar.')
    .addUserOption(o => o.setName('kullanici').setDescription('Banlanacak kullanıcı').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Ban sebebi'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Bir kullanıcıyı sunucudan atar.')
    .addUserOption(o => o.setName('kullanici').setDescription('Atılacak kullanıcı').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Kick sebebi'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Bir kullanıcıyı susturur.')
    .addUserOption(o => o.setName('kullanici').setDescription('Susturulacak kullanıcı').setRequired(true))
    .addIntegerOption(o => o.setName('sure').setDescription('Süre (dakika)').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Mute sebebi'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Kullanıcının susturmasını kaldırır.')
    .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('temizle')
    .setDescription('Kanaldan mesaj siler.')
    .addIntegerOption(o => o.setName('miktar').setDescription('Silinecek mesaj sayısı (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('uyar')
    .setDescription('Kullanıcıya uyarı verir.')
    .addUserOption(o => o.setName('kullanici').setDescription('Uyarılacak kullanıcı').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Uyarı sebebi').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('bilgi')
    .setDescription('Bot hakkında bilgi verir.'),

  new SlashCommandBuilder()
    .setName('sunucu')
    .setDescription('Sunucu bilgilerini gösterir.'),

  new SlashCommandBuilder()
    .setName('kullanici')
    .setDescription('Kullanıcı bilgilerini gösterir.')
    .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı (boş = kendin)')),

].map(c => c.toJSON());

// ─── Bot Hazır ─────────────────────────────────────────────────────────────────
client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} olarak giriş yapıldı.`);

  client.user.setPresence({
    activities: [{ name: '🛒 Castivol Store', type: 3 }],
    status: 'online',
  });

  // Global slash komutlarını kaydet
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Slash komutları kaydedildi.');
  } catch (err) {
    console.error('❌ Komut kaydı hatası:', err);
  }
});

// ─── Interaction Handler ───────────────────────────────────────────────────────
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName, guild, member } = interaction;

  // ── /kur ──────────────────────────────────────────────────────────────────
  if (commandName === 'kur') {
    await interaction.deferReply({ ephemeral: true });

    try {
      // ── ROLLER ──────────────────────────────────────────────────────────
      const roleTanims = [
        { name: '👑 Sahip',         color: '#FFD700', hoist: true, position: 10, perms: [PermissionFlagsBits.Administrator] },
        { name: '⚙️ Yönetici',      color: '#FF4444', hoist: true, position: 9,  perms: [PermissionFlagsBits.Administrator] },
        { name: '🛡️ Moderatör',     color: '#FF8C00', hoist: true, position: 8,  perms: [PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ModerateMembers] },
        { name: '🤖 Bot',           color: '#5865F2', hoist: true, position: 7,  perms: [PermissionFlagsBits.ManageMessages] },
        { name: '💎 VIP',           color: '#9B59B6', hoist: true, position: 6,  perms: [] },
        { name: '⭐ Boost',         color: '#FF73FA', hoist: true, position: 5,  perms: [] },
        { name: '🛒 Alıcı',         color: '#2ECC71', hoist: true, position: 4,  perms: [] },
        { name: '📦 Satıcı',        color: '#1ABC9C', hoist: true, position: 3,  perms: [] },
        { name: '👤 Üye',           color: '#99AAB5', hoist: false, position: 2, perms: [] },
        { name: '🔇 Susturulmuş',   color: '#747F8D', hoist: false, position: 1, perms: [] },
      ];

      const roles = {};
      for (const r of roleTanims) {
        const existing = guild.roles.cache.find(x => x.name === r.name);
        if (existing) { roles[r.name] = existing; continue; }
        roles[r.name] = await guild.roles.create({
          name: r.name,
          color: r.color,
          hoist: r.hoist,
          permissions: r.perms,
          reason: '/kur komutu',
        });
      }

      const muteRole = roles['🔇 Susturulmuş'];

      // ── KATEGORİ & KANALLAR ──────────────────────────────────────────────
      const yapı = [
        {
          kategori: '📢 BİLGİLENDİRME',
          kanallar: [
            { name: '📌︱kurallar',        topic: 'Sunucu kuralları', readOnly: true  },
            { name: '📣︱duyurular',       topic: 'Önemli duyurular', readOnly: true  },
            { name: '🎉︱etkinlikler',     topic: 'Yarışma ve etkinlikler', readOnly: true },
            { name: '🔄︱güncellemeler',   topic: 'Bot ve sunucu güncellemeleri', readOnly: true },
          ],
        },
        {
          kategori: '🛒 MAĞAZA',
          kanallar: [
            { name: '💰︱fiyat-listesi',   topic: 'Ürün fiyat listesi', readOnly: true  },
            { name: '🛍️︱sipariş',         topic: 'Sipariş vermek için yazın', readOnly: false },
            { name: '✅︱teslim-onay',     topic: 'Teslim edilen siparişler', readOnly: false },
            { name: '⭐︱yorumlar',        topic: 'Müşteri yorumları', readOnly: false },
          ],
        },
        {
          kategori: '💬 GENEL',
          kanallar: [
            { name: '👋︱karşılama',       topic: 'Hoş geldin!', readOnly: true  },
            { name: '💬︱genel',           topic: 'Genel sohbet', readOnly: false },
            { name: '😂︱medya',           topic: 'Resim, gif, video', readOnly: false },
            { name: '🤖︱bot-komutları',   topic: 'Bot komutlarını burada kullanın', readOnly: false },
          ],
        },
        {
          kategori: '🛡️ YÖNETİM',
          kanallar: [
            { name: '📋︱mod-log',         topic: 'Moderasyon logları', readOnly: true,  modOnly: true },
            { name: '🔧︱yönetim',         topic: 'Yönetici kanalı',   readOnly: false, modOnly: true },
            { name: '📊︱istatistik',      topic: 'Sunucu istatistikleri', readOnly: true, modOnly: true },
          ],
        },
      ];

      const everyoneRole = guild.roles.everyone;
      const modRole      = roles['🛡️ Moderatör'];
      const yoRole       = roles['⚙️ Yönetici'];

      for (const kat of yapı) {
        const cat = await guild.channels.create({
          name: kat.kategori,
          type: ChannelType.GuildCategory,
          permissionOverwrites: kat.kanallar[0]?.modOnly
            ? [
                { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: modRole.id,      allow: [PermissionFlagsBits.ViewChannel] },
                { id: yoRole.id,       allow: [PermissionFlagsBits.ViewChannel] },
              ]
            : [],
        });

        for (const k of kat.kanallar) {
          const overwrites = [];

          if (k.modOnly) {
            overwrites.push({ id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] });
            overwrites.push({ id: modRole.id,      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
            overwrites.push({ id: yoRole.id,       allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
          } else if (k.readOnly) {
            overwrites.push({ id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] });
            overwrites.push({ id: modRole.id,      allow: [PermissionFlagsBits.SendMessages] });
            overwrites.push({ id: yoRole.id,       allow: [PermissionFlagsBits.SendMessages] });
          } else {
            overwrites.push({ id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
            overwrites.push({ id: muteRole.id,     deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions] });
          }

          await guild.channels.create({
            name: k.name,
            type: ChannelType.GuildText,
            topic: k.topic,
            parent: cat.id,
            permissionOverwrites: overwrites,
          });
        }
      }

      // ── KARŞILAMA EMBED'İ ────────────────────────────────────────────────
      const welcomeCh = guild.channels.cache.find(c => c.name.includes('karşılama'));
      if (welcomeCh) {
        const embed = new EmbedBuilder()
          .setTitle('🛒 Castivol Store\'a Hoş Geldiniz!')
          .setDescription([
            '> Güvenilir, hızlı ve uygun fiyatlı dijital ürün mağazası.',
            '',
            '**📦 Sattığımız Ürünler**',
            '› Discord Boost',
            '› OWO Hesaplar',
            '› Çeşitli Discord Hesapları',
            '',
            '**📋 Kurallar** için <#' + (guild.channels.cache.find(c=>c.name.includes('kurallar'))?.id ?? '') + '>',
            '**🛒 Sipariş** için <#' + (guild.channels.cache.find(c=>c.name.includes('sipariş'))?.id ?? '') + '>',
          ].join('\n'))
          .setColor('#5865F2')
          .setFooter({ text: 'Castivol Store • Güvenilir Alışveriş' })
          .setTimestamp();
        await welcomeCh.send({ embeds: [embed] });
      }

      await interaction.editReply('✅ Sunucu başarıyla kuruldu! Kanallar, roller ve izinler oluşturuldu.');
    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ Kurulum sırasında bir hata oluştu: ' + err.message);
    }
  }

  // ── /ban ──────────────────────────────────────────────────────────────────
  else if (commandName === 'ban') {
    const target = interaction.options.getMember('kullanici');
    const sebep  = interaction.options.getString('sebep') ?? 'Sebep belirtilmedi.';
    if (!target) return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });
    if (!target.bannable) return interaction.reply({ content: '❌ Bu kullanıcıyı banlayamam.', ephemeral: true });

    await target.ban({ reason: sebep });
    await logMod(guild, '🔨 Ban', target.user, member.user, sebep, Colors.Red);
    await interaction.reply({ embeds: [modEmbed('🔨 Banned', target.user, sebep, Colors.Red)] });
  }

  // ── /kick ─────────────────────────────────────────────────────────────────
  else if (commandName === 'kick') {
    const target = interaction.options.getMember('kullanici');
    const sebep  = interaction.options.getString('sebep') ?? 'Sebep belirtilmedi.';
    if (!target) return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });
    if (!target.kickable) return interaction.reply({ content: '❌ Bu kullanıcıyı atamam.', ephemeral: true });

    await target.kick(sebep);
    await logMod(guild, '👢 Kick', target.user, member.user, sebep, Colors.Orange);
    await interaction.reply({ embeds: [modEmbed('👢 Kicked', target.user, sebep, Colors.Orange)] });
  }

  // ── /mute ─────────────────────────────────────────────────────────────────
  else if (commandName === 'mute') {
    const target = interaction.options.getMember('kullanici');
    const sure   = interaction.options.getInteger('sure');
    const sebep  = interaction.options.getString('sebep') ?? 'Sebep belirtilmedi.';
    if (!target) return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });

    await target.timeout(sure * 60 * 1000, sebep);
    await logMod(guild, `🔇 Mute (${sure}dk)`, target.user, member.user, sebep, Colors.Yellow);
    await interaction.reply({ embeds: [modEmbed(`🔇 Muted (${sure} dakika)`, target.user, sebep, Colors.Yellow)] });
  }

  // ── /unmute ───────────────────────────────────────────────────────────────
  else if (commandName === 'unmute') {
    const target = interaction.options.getMember('kullanici');
    if (!target) return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });

    await target.timeout(null);
    await logMod(guild, '🔊 Unmute', target.user, member.user, '—', Colors.Green);
    await interaction.reply({ embeds: [modEmbed('🔊 Unmuted', target.user, '—', Colors.Green)] });
  }

  // ── /temizle ──────────────────────────────────────────────────────────────
  else if (commandName === 'temizle') {
    const miktar = interaction.options.getInteger('miktar');
    await interaction.deferReply({ ephemeral: true });
    const silinen = await interaction.channel.bulkDelete(miktar, true);
    await interaction.editReply(`✅ **${silinen.size}** mesaj silindi.`);
  }

  // ── /uyar ─────────────────────────────────────────────────────────────────
  else if (commandName === 'uyar') {
    const target = interaction.options.getUser('kullanici');
    const sebep  = interaction.options.getString('sebep');
    await logMod(guild, '⚠️ Uyarı', target, member.user, sebep, Colors.Yellow);
    await interaction.reply({ embeds: [modEmbed('⚠️ Uyarıldı', target, sebep, Colors.Yellow)] });
    try { await target.send(`⚠️ **${guild.name}** sunucusunda uyarı aldınız.\n**Sebep:** ${sebep}`); } catch {}
  }

  // ── /bilgi ────────────────────────────────────────────────────────────────
  else if (commandName === 'bilgi') {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Castivol Bot')
      .setColor('#5865F2')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: '📌 Versiyon',   value: 'v1.0.0',                     inline: true },
        { name: '📚 Kütüphane', value: 'discord.js v14',               inline: true },
        { name: '⏱️ Uptime',    value: formatUptime(client.uptime),    inline: true },
        { name: '🏓 Ping',      value: `${client.ws.ping}ms`,          inline: true },
        { name: '🖥️ Sunucular', value: `${client.guilds.cache.size}`,  inline: true },
      )
      .setFooter({ text: 'Castivol Store' })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }

  // ── /sunucu ───────────────────────────────────────────────────────────────
  else if (commandName === 'sunucu') {
    const embed = new EmbedBuilder()
      .setTitle(`🏠 ${guild.name}`)
      .setThumbnail(guild.iconURL())
      .setColor('#5865F2')
      .addFields(
        { name: '👑 Sahip',         value: `<@${guild.ownerId}>`,              inline: true },
        { name: '👥 Üye Sayısı',    value: `${guild.memberCount}`,             inline: true },
        { name: '📅 Oluşturulma',   value: `<t:${Math.floor(guild.createdTimestamp/1000)}:D>`, inline: true },
        { name: '💬 Kanal Sayısı',  value: `${guild.channels.cache.size}`,     inline: true },
        { name: '🎭 Rol Sayısı',    value: `${guild.roles.cache.size}`,        inline: true },
        { name: '😀 Emoji Sayısı',  value: `${guild.emojis.cache.size}`,       inline: true },
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }

  // ── /kullanici ────────────────────────────────────────────────────────────
  else if (commandName === 'kullanici') {
    const target = interaction.options.getMember('kullanici') ?? member;
    const embed = new EmbedBuilder()
      .setTitle(`👤 ${target.user.tag}`)
      .setThumbnail(target.user.displayAvatarURL())
      .setColor(target.displayHexColor ?? '#5865F2')
      .addFields(
        { name: '🆔 ID',             value: target.user.id,                                              inline: true },
        { name: '📅 Kayıt Tarihi',   value: `<t:${Math.floor(target.user.createdTimestamp/1000)}:D>`,   inline: true },
        { name: '📥 Giriş Tarihi',   value: `<t:${Math.floor(target.joinedTimestamp/1000)}:D>`,         inline: true },
        { name: '🎭 En Yüksek Rol',  value: `${target.roles.highest}`,                                  inline: true },
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }
});

// ─── Yardımcı Fonksiyonlar ─────────────────────────────────────────────────────
function modEmbed(işlem, user, sebep, renk) {
  return new EmbedBuilder()
    .setTitle(işlem)
    .setColor(renk)
    .addFields(
      { name: '👤 Kullanıcı', value: `${user.tag} (${user.id})`, inline: true },
      { name: '📋 Sebep',     value: sebep,                      inline: true },
    )
    .setThumbnail(user.displayAvatarURL())
    .setTimestamp();
}

async function logMod(guild, işlem, hedef, yetkili, sebep, renk) {
  const logKanal = guild.channels.cache.find(c => c.name.includes('mod-log'));
  if (!logKanal) return;
  const embed = new EmbedBuilder()
    .setTitle(`📋 ${işlem}`)
    .setColor(renk)
    .addFields(
      { name: '👤 Hedef',    value: `${hedef.tag} (${hedef.id})`,     inline: true },
      { name: '🛡️ Yetkili', value: `${yetkili.tag}`,                  inline: true },
      { name: '📋 Sebep',    value: sebep,                             inline: false },
    )
    .setTimestamp();
  await logKanal.send({ embeds: [embed] });
}

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  return `${d}g ${h % 24}s ${m % 60}d`;
}

// ─── Yeni Üye Karşılama ────────────────────────────────────────────────────────
client.on('guildMemberAdd', async member => {
  const ch = member.guild.channels.cache.find(c => c.name.includes('karşılama'));
  if (!ch) return;
  const embed = new EmbedBuilder()
    .setTitle(`👋 Hoş Geldin, ${member.user.username}!`)
    .setDescription(`**Castivol Store**'a hoş geldin! Kuralları oku ve alışverişe başla.`)
    .setThumbnail(member.user.displayAvatarURL())
    .setColor('#5865F2')
    .setTimestamp();
  await ch.send({ content: `<@${member.id}>`, embeds: [embed] });

  // Otomatik üye rolü ver
  const uyeRol = member.guild.roles.cache.find(r => r.name === '👤 Üye');
  if (uyeRol) await member.roles.add(uyeRol).catch(() => {});
});

// ─── Login ─────────────────────────────────────────────────────────────────────
client.login(process.env.TOKEN);
