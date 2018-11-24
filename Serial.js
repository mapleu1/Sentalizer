
class Serializer {
    static beginProcess(originalGuild, channel) {
        if (!originalGuild.available) return console.log('Original guild not available. Please try again later.');

        let collectedData = {};
        channel(`Serial: General`);
        collectedData.general = this.serializeGuild(originalGuild);
        channel(`Serial: Roles`);
        collectedData.roles = collectedData.roles = this.serializeRoles(originalGuild);
        channel(`Serial: Users`);
        collectedData.users = this.serializeUsers(originalGuild);
        channel(`Serial: Categories`);
        collectedData.categories = this.serializeCategories(originalGuild);
        channel(`Serial: Channels`);
        collectedData.channels = this.serializeChannels(originalGuild);

        //collectedData.textChannel = channels.text;
        //collectedData.voiceChannel = channels.voice;
        channel(`Serial: Emojis`);
        collectedData.emojis = this.serializeEmojis(originalGuild);

        console.log(`Saving guild data to file`);
        fileSystem.writeFileSync(`${saveDir}${originalGuild.id}.json`, JSON.stringify(collectedData));

        console.log(`finishing up [LOGS]`);
        channel(`Serial Completed. ID: ${originalGuild.id}`);
        console.log(`Serialized ${collectedData.users.length} user(s)`);
        console.log(`Serialized ${collectedData.roles.length} role(s)`);
        console.log(`Serialized ${collectedData.emojis.length} emoji(s)`);
        console.log(`Serialized ${collectedData.categories.length} category(ies)`);
        console.log(`Serialized ${collectedData.channels.text.length} text channel(s)`);
        console.log(`Serialized ${collectedData.channels.voice.length} voice channel(s)`);

        console.log(`Serialization finished and data saved as ${originalGuild.id}.json`);
        return collectedData;
    };

    static serializeGuild(guild) {
        console.log(`Serializing general data`);
        return {
            oldId: guild.id,
            newId: null,
            name: guild.name,
            reigon: guild.region,
            iconURL: guild.iconURL,
            verificationLevel: guild.verificationLevel,
            afkTimeout: guild.afkTimeout,
            explicitContentFilter: guild.explicitContentFilter,
            defaultMessageNotifications: guild.defaultMessageNotifications,
        };
    };

    static serializeEmojis(guild) {
        console.log(`Serializing emojis`);
        return guild.emojis.map(emoji => {
            return {
                name: emoji.name,
                url: emoji.url,
            };
        });
    }

    static serializeCategories(guild) {
        console.log(`Serializing categories`);
        const collectedCatagories = guild.channels.filter(c => c.type === 'category');
        const categoryCollection = collectedCatagories.sort((a, b) => a.position - b.position);
        return categoryCollection.map(category => {
            const permOverwritesCollection = category.permissionOverwrites.filter(pOver => pOver.type === 'role');
            const permOverwrites = permOverwritesCollection.map(pOver => {
                return {
                    id: pOver.id,
                    allow: pOver.allow,
                    deny: pOver.deny,
                };
            });

            return {
                oldId: category.id,
                name: category.name,
                position: category.position,
                rawPosition: category.rawPosition,
                permOverwrites: permOverwrites,
            };
        });
    };

    static serializeChannels(guild) {
        console.log(`Serializing channels`);
        var channelTypes = {
            voice: {},
            text: {},
        };

        const collectedVoiceChannels = guild.channels.filter(c => c.type === 'voice');
        const collectedTextChannels = guild.channels.filter(c => c.type === 'text');

        const voiceChannelCollection = collectedVoiceChannels.sort((a, b) => a.rawPosition - b.rawPosition);
        const textChannelCollection = collectedTextChannels.sort((a, b) => a.rawPosition - b.rawPosition);

        channelTypes.voice = voiceChannelCollection.map(vCh => {
            const permOverwritesCollection = vCh.permissionOverwrites.filter(pOver => pOver.type === 'role');
            const permOverwrites = permOverwritesCollection.map(pOver => {
                return {
                    id: pOver.id,
                    allow: pOver.allow,
                    deny: pOver.deny,
                };
            });

            return {
                id: vCh.id,
                type: `voice`,
                name: vCh.name,
                position: vCh.position,
                rawPosition: vCh.rawPosition,
                parentID: vCh.parentID,
                bitrate: vCh.bitrate,
                userLimit: vCh.userLimit,
                isAfkChannel: guild.afkChannelID === vCh.id,
                permissionsLocked: vCh.permissionsLocked ? vCh.permissionsLocked : false,
                permOverwrites: vCh.permissionsLocked ? null : permOverwrites,
            };
        });

        channelTypes.text = textChannelCollection.map(tCh => {
            const permOverwritesCollection = tCh.permissionOverwrites.filter(pOver => pOver.type === 'role');
            const permOverwrites = permOverwritesCollection.map(pOver => {
                return {
                    id: pOver.id,
                    allow: pOver.allow,
                    deny: pOver.deny,
                };
            });

            return {
                id: tCh.id,
                type: `text`,
                name: tCh.name,
                topic: tCh.topic,
                nsfw: tCh.nsfw,
                isSystemChannel: guild.systemChannelID === tCh.id,
                position: tCh.position,
                rawPosition: tCh.rawPosition,
                parentID: tCh.parentID,
                permissionsLocked: tCh.permissionsLocked ? tCh.permissionsLocked : false,
                permOverwrites: tCh.permissionsLocked ? null : permOverwrites,
            };
        });

        return channelTypes;
    };

    static serializeRoles(guild) {
        console.log(`Serializing roles`);
        const roleCollection = guild.roles.sort((a, b) => b.position - a.position);
        return roleCollection.map(role => {
            return {
                oldId: role.id,
                newId: null,
                name: role.name,
                hexColor: role.hexColor,
                hoist: role.hoist,
                mentionable: role.mentionable,
                position: role.position,
                rawPosition: role.rawPosition,
                defaultRole: guild.defaultRole.id === role.id,
                permissions: role.permissions,
            };
        })
    };

    static serializeUsers(guild) {
        console.log(`Serializing users`);
        const collectedMembers = guild.members;
        const roleToSerialize = guild.roles.find("name", roleToFind);
        
        return collectedMembers.filter(m => m.roles.has(roleToSerialize.id)).map(member => {
            const memberRoles = member.roles;
            const memberRolesReturn = memberRoles.map(role => {
                return {
                    oldId: role.id,
                    name: role.name,
                    defaultRole: guild.defaulRole == role.id,
                    newId: null,
                }
            });
            return {
                id: member.id,
                serverDeaf: member.serverDeaf,
                serverMute: member.serverMute,
                nickname: member.nickname,
                roles: memberRolesReturn,
            };
        });
    };

}

module.exports = Serializer;