
class discord {
    constructor() {
        console.log(`[AtmosphericX Library] >> Loaded Discord Manager`);
        this.format = "returned from discord.js";
    }
    update(locations) {
        try {
            let channel_id = toolsConstructor.env('env')['DISCORD_UPDATE_CHANNEL'];
            bot_client.channels.fetch(channel_id).then(channel => {
                channel.messages.fetch({ limit: 1 }).then(messages => {
                    let lastMessage = messages.first();
                        let newDesc = generic_data[0]['eventDescription'].substring(0, 1000) + '...';
                        let newEmbed = new discordjs.EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('AtmosphericX Weather Alert System')
                        .setDescription('AtmosphericX Weather Alert System\nDownload the source at https://github.com/K3YOMI/AtmosphericX')
                        .setThumbnail('https://atmosphericx.com/Media/Content/AX.png')
                        .addFields(
                            { name: 'Active Warnings', value: `${active_total_warnings.length}`, inline: true },
                            { name: 'Active Watches', value: `${active_total_watches.length}`, inline: true },
                            { name: 'Event', value: `\`\`\`json\n${generic_data[0]['eventName']}\`\`\``, inline: false },
                            { name: 'Issued', value: `<t:${Math.floor(new Date(generic_data[0]['issued']).getTime() / 1000)}:R>`, inline: true },
                            { name: 'Expires', value: `<t:${Math.floor(new Date(generic_data[0]['expires']).getTime() / 1000)}:R>`, inline: true },
                            { name: 'Affected Locations', value: `\`\`\`json\n${generic_data[0]['locations']}\`\`\``, inline: false },
                            { name: 'Event Description', value: `\`\`\`json\n${newDesc}\`\`\``, inline: false },
                            { name: 'Last Updated', value: `<t:${Math.floor(new Date().getTime() / 1000)}:R>`},
                        )
                        .setTimestamp()
                        .setFooter({text: `AtmosphericX - ${configurations['VERSION']}`})
                        channel.send({ embeds: [newEmbed] }).then(message => {
                        if (lastMessage != undefined) {
                            lastMessage.delete()
                        }
                    })
                })
            })
        } catch (error) {
            toolsConstructor.log(`[Error] [DiscordJS] ${error.message}`)
        }
    }
}


module.exports = discord;
