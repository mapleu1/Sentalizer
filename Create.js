class Creator {
    static beginProcess(newGuild, retrieveDataReturns, snd) {
        let guildData = retrieveDataReturns
        if (!guildData) return;
        guildData.references = {};
        if (guildData.general.oldId === newGuild.id) return;
        return new Promise(async (resolve, reject) => {
            try {
                snd(`Create: Wiping Guild`)
                await this.wipeGuild(newGuild);
                snd(`Create:  General Information`)
                await this.setGeneralData(guildData, newGuild);

                if (guildData.emojis.length) {
                    snd(`Create:  Adding Emojis`)
                    await this.createEmojis(guildData, newGuild);
                };

                if (guildData.roles.length) {
                    snd(`Create:  Adding Roles`)
                    guildData.references.roles = await this.createRoles(guildData, newGuild);
                }

                if (guildData.categories.length) {
                    snd(`Create:  Adding Categories`)
                    guildData.references.categories = await this.createCategories(guildData, newGuild);
                }

                    snd(`Create:  Adding Channels`)
                    await this.createChannels(guildData, newGuild);

                console.log(`Done!`);
                snd(`Create:  Completed`)
                snd(`Create:  Confirming Copy`)
                console.log(`Saving guild data to file to confirm copy`);
                snd(`Create:  Confirmed`)

                newGuild.createChannel("delete-me").then(createdChannel => {
                    createdChannel.createInvite().then(invite => snd(invite.url));
                })

                newGuild.client.on('guildMemberAdd', (member) => {
                    if (member.guild.id === newGuild.id) {
                        this.giveRoles(guildData, member);
                    };
                });
                return resolve();
            } catch (err) {
                return console.log(err);
            }
        });
    };

    static wipeGuild(newGuild) {
        console.log(`Cleaning guild`);
        return new Promise(async (resolve, reject) => {
            try {
                const rolesToDelete = newGuild.roles.filter(role => role.id !== newGuild.defaultRole.id);

                console.log(`deleting objects`);
                await Promise.all(newGuild.channels.deleteAll());
                await Promise.all(newGuild.emojis.deleteAll());
                await Promise.all(rolesToDelete.deleteAll());
                console.log(`deleted objects`);

                return resolve();
            } catch (err) {
                return console.log(err);
            }
        });
    };

    static setGeneralData(guildData, newGuild) {
        console.log(`Setting guild`);
        return new Promise(async (resolve, reject) => {
            try {
                const general = guildData.general;
                const region = allowedRegions.includes(general.region) ? general.region : 'us-central';

                await newGuild.setName(general.name);
                await newGuild.setRegion(region);
                await newGuild.setIcon(general.iconURL.replace(".jpg", ".png"));
                await newGuild.setVerificationLevel(general.verificationLevel);
                await newGuild.setExplicitContentFilter(general.explicitContentFilter);
                await newGuild.setDefaultMessageNotifications(general.defaultMessageNotifications);

                return resolve();
            } catch (err) {
                return console.log(err);
            }
        });
    };

    static createRoles(guildData, newGuild) {
        var AUTOreferences = {};
        AUTOreferences.roles = {};
        AUTOreferences.guild = guildData.general.oldId;
        console.log(`Creating roles`);
        return new Promise(async (resolve, reject) => {
            try {
                let promises = [];
                let roleReferences = new Collection();
                guildData.roles.forEach(role => {
                    if (role.defaultRole) {
                        let everyoneRole = newGuild.defaultRole;
                        everyoneRole.setPermissions(role.permissions);
                        promises.push(everyoneRole.setPermissions(role.permissions));
                        roleReferences.set(role.oldId, { new: newGuild.defaultRole, old: role });

                    } else {
                        var newRole = {
                            data: {
                                name: role.name,
                                color: role.hexColor,
                                hoist: role.hoist,
                                mentionable: role.mentionable,
                                permissions: role.permissions,
                            },
                        };

                        let promise = newGuild.createRole(newRole.data).then(createdRole => {
                            roleReferences.set(role.oldId, { new: createdRole, old: role });
                            AUTOreferences.roles[role.oldId] = createdRole.id;
                        });
                        promises.push(promise);
                    }
                });

                await Promise.all(promises);
                await fileSystem.writeFileSync(`${confirmedCopies}${newGuild.id}.json`, JSON.stringify(AUTOreferences));
                return resolve(roleReferences);
            } catch (err) {
                return console.log(err);
            }
        });
    };

    static createCategories(guildData, newGuild) {
        console.log(`Creating categories`);
        return new Promise(async (resolve, reject) => {
            try {
                let promises = [];
                let categoryReferences = new Collection();
                guildData.categories.forEach(category => {
                    let overwrites = category.permOverwrites.map(permOver => {
                        return {
                            id: guildData.references.roles.get(permOver.id).new.id,
                            allow: permOver.allow,
                            deny: permOver.deny,
                        };
                    });
                    let options = {
                        type: 'category',
                        overwrites: overwrites,
                    };

                    let promise = newGuild.createChannel(category.name, options.type, options.overwrites).then(createdCategory => {
                        categoryReferences.set(category.oldId, { new: createdCategory, old: category });
                    });
                    promises.push(promise);
                });

                await Promise.all(promises);

                return resolve(categoryReferences);
            } catch (err) {
                return console.log(err);
            }
        });
    };

    static createChannels(guildData, newGuild) {
        console.log(`Creating channels`);
        return new Promise(async (resolve, reject) => {
            try {
                let promises = [];

                guildData.channels.text.forEach(textChannel => {
                    let options = {};

                    if (textChannel.parentID) {
                        options.parent = guildData.references.categories.get(textChannel.parentID).new.id;
                    }

                    if (!textChannel.permissionsLocked) {
                        options.overwrites = textChannel.permOverwrites.map(permOver => {
                            return {
                                id: guildData.references.roles.get(permOver.id).new.id,
                                allow: permOver.allow,
                                deny: permOver.deny,
                            };
                        });
                    }

                    let promise = newGuild.createChannel(textChannel.name, textChannel.type, options.overwrites).then(createdChannel => {
                        if (PresetMessages[createdChannel.name]) createdChannel.send(PresetMessages[createdChannel.name]);
                        createdChannel.setParent(options.parent);
                        createdChannel.setNSFW(textChannel.nsfw);
                        if (textChannel.isSystemChannel) newGuild.setSystemChannel(createdChannel.id);
                        if (textChannel.topic) createdChannel.setTopic(textChannel.topic);


                    });

                    promises.push(promise);
                });

                guildData.channels.voice.forEach(voiceChannel => {
                    let options = {};
                    
                    if (voiceChannel.parentID) {
                        options.parent = guildData.references.categories.get(voiceChannel.parentID).new.id;
                    }

                    if (!voiceChannel.permissionsLocked) {
                        options.overwrites = voiceChannel.permOverwrites.map(permOver => {
                            return {
                                id: guildData.references.roles.get(permOver.id).new.id,
                                allow: permOver.allow,
                                deny: permOver.deny,
                            };
                        });
                    }

                    let promise = newGuild.createChannel(voiceChannel.name, voiceChannel.type, options.overwrites).then(createdChannel => {
                        createdChannel.setParent(options.parent);
                        createdChannel.setUserLimit(validateUserLimit(voiceChannel.userLimit));
                        if (voiceChannel.isAfkChannel) newGuild.setAFKChannel(createdChannel.id);
                        newGuild.setAFKTimeout(guildData.general.afkTimeout);
                    });

                    promises.push(promise);
                });

                await Promise.all(promises);
                return resolve();
            } catch (err) {
                return console.log(err);
            }
        });
    };

    static createEmojis(guildData, newGuild) {
        console.log(`Creating emojis`);
        return new Promise(async (resolve, reject) => {
            try {
                let promises = [];
                guildData.emojis.forEach(emoji => {
                    let promise = newGuild.createEmoji(emoji.url, emoji.name)
                    promises.push(promise);
                });

                await Promise.all(promises);

                return resolve();
            } catch (err) {
                return console.log(err);
            }
        });
    };

    static giveRoles(guildData, member) {
        return new Promise(async (resolve, reject) => {
            try {
                var roles = [];
                guildData.users.forEach(serialMEM => {
                    if (serialMEM.id == member.id) {

                        serialMEM.roles.forEach(rolesxD => {
                            if (guildData.references.roles.get(rolesxD.oldId).defaultRole) return;
                            roles.push(guildData.references.roles.get(rolesxD.oldId).new.id);
                        });

                        member.addRoles(roles)
                            .catch(console.log);
                        member.setNickname(serialMEM.nickname)
                            .catch(console.error);
                        member.setMute(serialMEM.serverMute)
                            .catch(console.error);
                        member.setDeaf(serialMEM.serverDeaf)
                            .catch(console.error);
                    };
                })

                return resolve();
            } catch (err) {
                return console.log(err);
            }
        })
    };

}

module.exports = Creator;