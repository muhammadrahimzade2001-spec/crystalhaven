
bash

cat > /mnt/user-data/outputs/index.js << 'EOF'
const {
  Client, GatewayIntentBits, Partials, REST, Routes,
  SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, Colors
} = require('discord.js');
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

// ── Uyarı sistemi (bellekte tutar, bot yeniden başlayınca sıfırlanır) ──────────
const warnings = new Map(); // userId -> [ { sebep, tarih, yetkili } ]

// ── Slash Komutları ────────────────────────────────────────────────────────────
const commands = [
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Kullanıcıyı kalıcı olarak banlar.')
    .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Ban sebebi'))
    .addIntegerOption(o => o.setName('sil').setDescription('Kaç günlük mesaj silinsin? (0-7)').setMinValue(0).setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kullanıcıyı sunucudan atar.')
    .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Kick sebebi'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Kullanıcıya timeout verir.')
    .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    .addIntegerOption(o => o.setName('sure').setDescription('Süre (dakika)').setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption(o => o.setName('sebep').setDescription('Mute sebebi'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Kullanıcının timeout\'unu kaldırır.')
    .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('uyar')
    .setDescription('Kullanıcıya uyarı verir.')
    .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Uyarı sebebi').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('uyarilari-goster')
    .setDescription('Kullanıcının uyarılarını gösterir.')
    .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('uyari-sil')
    .setDescription('Kullanıcının tüm uyarılarını siler.')
    .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('temizle')
    .setDescription('Kanaldan mesaj siler.')
    .addIntegerOption(o => o.setName('miktar').setDescription('Silinecek mesaj (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o => o.setName('kullanici').setDescription('Sadece bu kullanıcının mesajlarını sil'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('yavasmod')
    .setDescription('Kanalda yavaş mod açar/kapatır.')
    .addIntegerOption(o => o.setName('saniye').setDescription('Bekleme süresi (0 = kapat)').setRequired(true).setMinValue(0).setMaxValue(21600))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('kilitle')
    .setDescription('Kanalı kilitler (kimse mesaj atamaz).')
    .addStringOption(o => o.setName('sebep').setDescription('Kilit sebebi'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('ac')
    .setDescription('Kilitli kanalı açar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('rol-ver')
    .setDescription('Kullanıcıya rol verir.')
    .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    .addRoleOption(o => o.setName('rol').setDescription('Verilecek rol').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName('rol-al')
    .setDescription('Kullanıcıdan rol alır.')
    .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    .addRoleOption(o => o.setName('rol').setDescription('Alınacak rol').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName('nick')
    .setDescription('Kullanıcının sunucu ismini değiştirir.')
    .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    .addStringOption(o => o.setName('isim').setDescription('Yeni isim (boş = sıfırla)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),

].map(c => c.toJSON());

// ── Bot Hazır ──────────────────────────────────────────────────────────────────
client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} olarak giriş yapıldı.`);
  client.user.setPresence({ activities: [{ name: '🛡️ Sunucuyu Koruyorum', type: 3 }], status: 'online' });

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Slash komutları kaydedildi.');
  } catch (err) {
    console.error('❌ Komut kaydı hatası:', err);
  }
});

// ── Interaction Handler ────────────────────────────────────────────────────────
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName, guild, member } = interaction;

  // /ban
  if (commandName === 'ban') {
    const target = interaction.options.getMember('kullanici');
    const sebep  = interaction.options.getString('sebep') ?? 'Sebep belirtilmedi.';
    const sil    = interaction.options.getInteger('sil') ?? 0;
    if (!target) return reply(interaction, '❌ Kullanıcı bulunamadı.');
    if (!target.bannable) return reply(interaction, '❌ Bu kullanıcıyı banlayamam (yetki sırası).');
    await target.ban({ reason: sebep, deleteMessageDays: sil });
    await logMod(guild, '🔨 Ban', target.user, member.user, sebep);
    await interaction.reply({ embeds: [modEmbed('🔨 Kullanıcı Banlandı', target.user, sebep, Colors.Red)] });
  }

  // /kick
  else if (commandName === 'kick') {
    const target = interaction.options.getMember('kullanici');
    const sebep  = interaction.options.getString('sebep') ?? 'Sebep belirtilmedi.';
    if (!target) return reply(interaction, '❌ Kullanıcı bulunamadı.');
    if (!target.kickable) return reply(interaction, '❌ Bu kullanıcıyı atamam.');
    await target.kick(sebep);
    await logMod(guild, '👢 Kick', target.user, member.user, sebep);
    await interaction.reply({ embeds: [modEmbed('👢 Kullanıcı Atıldı', target.user, sebep, Colors.Orange)] });
  }

  // /mute
  else if (commandName === 'mute') {
    const target = interaction.options.getMember('kullanici');
    const sure   = interaction.options.getInteger('sure');
    const sebep  = interaction.options.getString('sebep') ?? 'Sebep belirtilmedi.';
    if (!target) return reply(interaction, '❌ Kullanıcı bulunamadı.');
    if (!target.moderatable) return reply(interaction, '❌ Bu kullanıcıyı susturamam.');
    await target.timeout(sure * 60 * 1000, sebep);
    await logMod(guild, `🔇 Mute (${sure} dakika)`, target.user, member.user, sebep);
    await interaction.reply({ embeds: [modEmbed(`🔇 Susturuldu (${sure} dakika)`, target.user, sebep, Colors.Yellow)] });
  }

  // /unmute
  else if (commandName === 'unmute') {
    const target = interaction.options.getMember('kullanici');
    if (!target) return reply(interaction, '❌ Kullanıcı bulunamadı.');
    await target.timeout(null);
    await logMod(guild, '🔊 Unmute', target.user, member.user, '—');
    await interaction.reply({ embeds: [modEmbed('🔊 Susturma Kaldırıldı', target.user, '—', Colors.Green)] });
  }

  // /uyar
  else if (commandName === 'uyar') {
    const target = interaction.options.getUser('kullanici');
    const sebep  = interaction.options.getString('sebep');
    if (!warnings.has(target.id)) warnings.set(target.id, []);
    warnings.get(target.id).push({ sebep, tarih: new Date(), yetkili: member.user.tag });
    const toplam = warnings.get(target.id).length;
    await logMod(guild, `⚠️ Uyarı (#${toplam})`, target, member.user, sebep);
    await interaction.reply({ embeds: [modEmbed(`⚠️ Uyarı Verildi (Toplam: ${toplam})`, target, sebep, Colors.Yellow)] });
    try { await target.send(`⚠️ **${guild.name}** sunucusunda **${toplam}. uyarını** aldın.\n**Sebep:** ${sebep}`); } catch {}
  }

  // /uyarilari-goster
  else if (commandName === 'uyarilari-goster') {
    const target = interaction.options.getUser('kullanici');
    const list   = warnings.get(target.id) ?? [];
    if (list.length === 0) return reply(interaction, `✅ ${target.tag} adlı kullanıcının uyarısı yok.`);
    const embed = new EmbedBuilder()
      .setTitle(`⚠️ ${target.tag} — Uyarılar (${list.length})`)
      .setColor(Colors.Yellow)
      .setThumbnail(target.displayAvatarURL())
      .setDescription(list.map((w, i) =>
        `**${i+1}.** ${w.sebep}\n> 🛡️ ${w.yetkili} • <t:${Math.floor(w.tarih/1000)}:R>`
      ).join('\n\n'))
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }

  // /uyari-sil
  else if (commandName === 'uyari-sil') {
    const target = interaction.options.getUser('kullanici');
    warnings.delete(target.id);
    await interaction.reply({ embeds: [modEmbed('🗑️ Uyarılar Silindi', target, '—', Colors.Green)] });
  }

  // /temizle
  else if (commandName === 'temizle') {
    const miktar    = interaction.options.getInteger('miktar');
    const filtrele  = interaction.options.getUser('kullanici');
    await interaction.deferReply({ ephemeral: true });
    let mesajlar = await interaction.channel.messages.fetch({ limit: 100 });
    if (filtrele) mesajlar = mesajlar.filter(m => m.author.id === filtrele.id);
    const hedef = [...mesajlar.values()].slice(0, miktar);
    const silinen = await interaction.channel.bulkDelete(hedef, true);
    await interaction.editReply(`✅ **${silinen.size}** mesaj silindi.`);
  }

  // /yavasmod
  else if (commandName === 'yavasmod') {
    const saniye = interaction.options.getInteger('saniye');
    await interaction.channel.setRateLimitPerUser(saniye);
    const durum = saniye === 0 ? '**kapatıldı**' : `**${saniye} saniye** olarak ayarlandı`;
    await interaction.reply({ embeds: [
      new EmbedBuilder().setTitle('🐢 Yavaş Mod').setDescription(`Bu kanalda yavaş mod ${durum}.`).setColor(Colors.Blue).setTimestamp()
    ]});
  }

  // /kilitle
  else if (commandName === 'kilitle') {
    const sebep = interaction.options.getString('sebep') ?? 'Sebep belirtilmedi.';
    await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
    await logMod(guild, '🔒 Kanal Kilitleme', { tag: interaction.channel.name, id: interaction.channel.id, displayAvatarURL: ()=>null }, member.user, sebep);
    await interaction.reply({ embeds: [
      new EmbedBuilder().setTitle('🔒 Kanal Kilitlendi').setDescription(`**Sebep:** ${sebep}`).setColor(Colors.Red).setTimestamp()
    ]});
  }

  // /ac
  else if (commandName === 'ac') {
    await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null });
    await interaction.reply({ embeds: [
      new EmbedBuilder().setTitle('🔓 Kanal Açıldı').setDescription('Kanal tekrar aktif.').setColor(Colors.Green).setTimestamp()
    ]});
  }

  // /rol-ver
  else if (commandName === 'rol-ver') {
    const target = interaction.options.getMember('kullanici');
    const rol    = interaction.options.getRole('rol');
    if (!target) return reply(interaction, '❌ Kullanıcı bulunamadı.');
    await target.roles.add(rol);
    await interaction.reply({ embeds: [
      new EmbedBuilder().setTitle('✅ Rol Verildi').setColor(Colors.Green)
        .addFields({ name: '👤 Kullanıcı', value: target.user.tag, inline: true }, { name: '🎭 Rol', value: rol.name, inline: true })
        .setTimestamp()
    ]});
  }

  // /rol-al
  else if (commandName === 'rol-al') {
    const target = interaction.options.getMember('kullanici');
    const rol    = interaction.options.getRole('rol');
    if (!target) return reply(interaction, '❌ Kullanıcı bulunamadı.');
    await target.roles.remove(rol);
    await interaction.reply({ embeds: [
      new EmbedBuilder().setTitle('❌ Rol Alındı').setColor(Colors.Orange)
        .addFields({ name: '👤 Kullanıcı', value: target.user.tag, inline: true }, { name: '🎭 Rol', value: rol.name, inline: true })
        .setTimestamp()
    ]});
  }

  // /nick
  else if (commandName === 'nick') {
    const target = interaction.options.getMember('kullanici');
    const isim   = interaction.options.getString('isim') ?? null;
    if (!target) return reply(interaction, '❌ Kullanıcı bulunamadı.');
    await target.setNickname(isim);
    await interaction.reply({ embeds: [
      new EmbedBuilder().setTitle('✏️ Nickname Değiştirildi').setColor(Colors.Blue)
        .addFields({ name: '👤 Kullanıcı', value: target.user.tag, inline: true }, { name: '📝 Yeni İsim', value: isim ?? '*(sıfırlandı)*', inline: true })
        .setTimestamp()
    ]});
  }
});

// ── Yardımcı Fonksiyonlar ──────────────────────────────────────────────────────
function reply(interaction, msg) {
  return interaction.reply({ content: msg, ephemeral: true });
}

function modEmbed(başlık, user, sebep, renk) {
  const embed = new EmbedBuilder()
    .setTitle(başlık)
    .setColor(renk)
    .addFields(
      { name: '👤 Kullanıcı', value: `${user.tag} (${user.id})`, inline: true },
      { name: '📋 Sebep',     value: sebep,                      inline: true },
    )
    .setTimestamp();
  if (user.displayAvatarURL) embed.setThumbnail(user.displayAvatarURL());
  return embed;
}

async function logMod(guild, işlem, hedef, yetkili, sebep) {
  const logKanal = guild.channels.cache.find(c => c.name.includes('mod-log'));
  if (!logKanal) return;
  const embed = new EmbedBuilder()
    .setTitle(`📋 ${işlem}`)
    .setColor(0x5865F2)
    .addFields(
      { name: '👤 Hedef',    value: `${hedef.tag} (${hedef.id})`, inline: true },
      { name: '🛡️ Yetkili', value: yetkili.tag,                   inline: true },
      { name: '📋 Sebep',    value: sebep,                        inline: false },
    )
    .setTimestamp();
  await logKanal.send({ embeds: [embed] }).catch(() => {});
}

// ── Login ──────────────────────────────────────────────────────────────────────
client.login(process.env.TOKEN);
