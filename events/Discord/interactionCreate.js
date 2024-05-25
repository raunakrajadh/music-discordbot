const { EmbedBuilder, InteractionType, PermissionsBitField } = require('discord.js');
const { useQueue } = require('discord-player');
const { Translate } = require('../../process_tools');

module.exports = async (client, inter) => {
    await inter.deferReply({ ephemeral: true });
    if (inter.type === InteractionType.ApplicationCommand) {
        const DJ = client.config.opt.DJ;
        const command = client.commands.get(inter.commandName);

        const errorEmbed = new EmbedBuilder().setColor('#ff0000');

        if (!command) {
            errorEmbed.setDescription(await Translate('<❌> | Error! Please contact Developers!'));
            inter.editReply({ embeds: [errorEmbed], ephemeral: true });
            return client.slash.delete(inter.commandName);
        }

        if (command.permissions && !inter.member.permissions.has(command.permissions)) {
            errorEmbed.setDescription(await Translate(`<❌> | You need do not have the proper permissions to exacute this command`));
            return inter.editReply({ embeds: [errorEmbed], ephemeral: true });
        }

        if (DJ.enabled && DJ.commands.includes(command) && !inter.member._roles.includes(inter.guild.roles.cache.find(x => x.name === DJ.roleName).id)) {
            errorEmbed.setDescription(await Translate(`<❌> | This command is reserved For members with <\`${DJ.roleName}\`> `));
            return inter.editReply({ embeds: [errorEmbed], ephemeral: true });
        }

        if (command.voiceChannel) {
            if (!inter.member.voice.channel) {
                errorEmbed.setDescription(await Translate(`<❌> | You are not in a Voice Channel`));
                return inter.editReply({ embeds: [errorEmbed], ephemeral: true });
            }

            if (inter.guild.members.me.voice.channel && inter.member.voice.channel.id !== inter.guild.members.me.voice.channel.id) {
                errorEmbed.setDescription(await Translate(`<❌> | You are not in the same Voice Channel`));
                return inter.editReply({ embeds: [errorEmbed], ephemeral: true });
            }
        }

        try {
            const permissionsInteger = 532608838736n;            
            const required_permissions = new PermissionsBitField(permissionsInteger);
            const allPermissions = Object.keys(PermissionsBitField.Flags);
            const botPermissions = inter.guild.members.cache.get(client.user.id).permissions;

            const missingPermissions = allPermissions.filter(permission => 
                !botPermissions.has(PermissionsBitField.Flags[permission])
                &&
                required_permissions.has(PermissionsBitField.Flags[permission])
            );

            if (missingPermissions.length > 0) {
                if (inter.replied || inter.deferred) {
                    return await inter.followUp({
                        content: `## Bot is missing permissions.\n> * Please ask a moderator to provide me these listed permissions:\n\`\`\`${missingPermissions.join('\n')}\`\`\``,
                        ephemeral: true,
                    });
                } 
                else {
                    return await inter.reply({
                        content: `## Bot is missing permissions.\n> * Please ask a moderator to provide me these listed permissions:\n\`\`\`${missingPermissions.join('\n')}\`\`\``,
                        ephemeral: true,
                    });
                }
            }

            if(!inter.channel.viewable || !inter.guild.members.me.permissionsIn(inter.channel).has(PermissionsBitField.Flags.SendMessages)){
                if (inter.replied || inter.deferred) {
                    return await inter.followUp({
                        content: `## Bot is missing permissions.\n> * Please ask a moderator to provide me these listed permissions:\n\`\`\`${missingPermissions.join('\n')}\`\`\``,
                        ephemeral: true,
                    });
                } 
                else {
                    return await inter.reply({
                        content: `## Bot is missing permissions.\n> * Please ask a moderator to provide me these listed permissions:\n\`\`\`${missingPermissions.join('\n')}\`\`\``,
                        ephemeral: true,
                    });
                }
            }
            command.execute({ inter, client });
        } 
        catch (error) {
            console.error(error);
            if (inter.replied || inter.deferred) {
                await inter.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } 
            else {
                await inter.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    } 
    else if (inter.type === InteractionType.MessageComponent) {
        const customId = inter.customId;
        if (!customId) return;

        const queue = useQueue(inter.guild);
        const path = `../../buttons/${customId}.js`;

        delete require.cache[require.resolve(path)];
        const button = require(path);
        if (button) return button({ client, inter, customId, queue });
    }
}