class Auto {
    static retrieveNewData(newGuildId) {
        if (fileSystem.existsSync(`${confirmedCopies}${newGuildId}.json`)) {
            return require(`.${confirmedCopies}${newGuildId}.json`);
        } else
            return false
    };
    static retrieveOldData(oldGuildId) {
        if (fileSystem.existsSync(`${saveDir}${oldGuildId}.json`)) {
            return require(`.${saveDir}${oldGuildId}.json`);
        } else
            return false
    };
    static beginProcess(newGuild) {
        let newGuildData = this.retrieveNewData(newGuild.id);
        let oldGuildData = this.retrieveOldData(newGuildData.guild);

        if (!oldGuildData) return;
        if (!newGuildData) return;
      
      this.roleAll(oldGuildData, newGuildData, newGuild);
      
        newGuild.client.on('guildMemberAdd', (member) => {
            if (member.guild.id === newGuild.id) {
                this.giveRoles(oldGuildData, newGuildData, member);
            };
        });

    };
  
  static roleAll(oldGuildData, newG, guild) {
      guild.members.forEach((member) => {
        this.giveRoles(oldGuildData, newG, member);
      })
    };
  
    static giveRoles(oldGuildData, newGuildData, member) {
        return new Promise(async (resolve, reject) => {
            try {
                var roles = [];
                oldGuildData.users.forEach(serialMEM => {
                    if (serialMEM.id == member.id) {

                        serialMEM.roles.forEach(rolesxD => {
                            if (!newGuildData.roles[rolesxD.oldId]) return;
                          if (member.roles.find(role => role.id === newGuildData.roles[rolesxD.oldId])) return;
                            roles.push(newGuildData.roles[rolesxD.oldId]);
                        });

                        member.addRoles(roles).catch(console.log);
                        member.setNickname(serialMEM.nickname).catch(console.error);
                        member.setMute(serialMEM.serverMute).catch(console.error);
                        member.setDeaf(serialMEM.serverDeaf).catch(console.error);
                    };
                })

                return resolve();
            } catch (err) {
                return console.log(err);
            }
        })
    };
}

module.exports = Auto;