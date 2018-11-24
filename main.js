const token = ``
global.Discord = require('discord.js');
global.fileSystem = require(`fs`);

global.confirmedCopies = "./ConfirmedCopies/"
global.saveDir = "./SerialStuff/";
global.funcDir = "./Stuff/"

global.serialGuild = require(`${funcDir}Serial.js`);
global.createGuild = require(`${funcDir}Create.js`);
global.autoStuff = require(`${funcDir}Auto.js`);

global.roleToFind = "@everyone";

global.prefix = "|";
global.client = new Discord.Client({
  disabledEvents: ["TYPING_START"],
  fetchAllMembers: true,
  disableEveryone: true
});

global.PresetMessages = {
  ["rules"]: `** Rules **`,
};
global.retrieveData = function(originalGuildId) {
  console.log(fileSystem.existsSync(`${saveDir}${originalGuildId}.json`));
  if (fileSystem.existsSync(`${saveDir}${originalGuildId}.json`)) {
    console.log(`Serialized data was found and will be used.`);
    return require(`${saveDir}${originalGuildId}.json`);
  } else
    return false
};

global.logMessage = function(channel, Message) {
  if (!Message) return;
  console.log(Message);
  if (!channel) return;
  return channel.send(Message).catch(console.log);
};

global.validateBitrate = origBitrate => {
  if (origBitrate > 96000) return 96000;
  else if (origBitrate < 8000) return 8000;
  else return origBitrate;
};

global.validateUserLimit = userLimit => {
  if (userLimit < 0) return 0;
  else if (userLimit > 99) return 99;
  else return userLimit;
};

global.allowedRegions = [
  'brazil',
  'us-west',
  'singapore',
  'eu-central',
  'hongkong',
  'us-south',
  'amsterdam',
  'us-central',
  'london',
  'us-east',
  'sydney',
  'japan',
  'eu-west',
  'frankfurt',
  'russia'
];

const {
  Collection
} = Discord
global.Collection = Collection;

global.ownersId = {
[`0`]: true,
};

global.notifyOwners = function(message) {
  for (x in ownersId) {
    logMessage(client.users.get(x), message)
  };
};

global.getRolePosition = function(guild, role) {
  var asd = [];
  guild.roles.map(e => asd.push(e));
  return asd.length - guild.roles.get(role.id).position
};
client.on("guildCreate", guild => {
  logMessage(null, `New guild added : ${guild.name}, owned by ${guild.owner.user.username}`)
});

client.on("guildDelete", guild => {
  logMessage(null, `guild deleted : ${guild.name}, owned by ${guild.owner.user.username}`)
  if (guild.name === "Sentinel") {
    notifyOwners(`ALERT Sentinel was deleted.`);
  }
});

client.on("message", message => {

let command = message.content.split(" ")[0];
  command = command.slice(prefix.length);
  const args = message.content.split(" ").slice(1);
  
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
   if (!ownersId[message.member.id]) return;

  function sendAsd(ds) {
    logMessage(message.channel, ds);
  }

  if (command === "serial") {
    logMessage(message.channel, "Attempting to Serial");
    serialGuild.beginProcess(message.guild, sendAsd);
  } else
  if (command === "secretserial") {
  if (client.guilds.filter(g => g.id === args[0]).first()) return serialGuild.beginProcess(client.guilds.filter(g => g.id === args[0]).first(), sendAsd);
  } else
    if (command === "recreate") {
      logMessage(message.channel, "Attempting to Recreate");
      const retrieveDataReturns = retrieveData(args[0]);
      if (!retrieveDataReturns) return logMessage(message.channel, "Failed to Recreate, Invalid Id");
      createGuild.beginProcess(message.guild, retrieveDataReturns, console.log, "old");
    } else
  if (command === "create") {
    logMessage(message.channel, "Attempting to Create");
    const retrieveDataReturns = retrieveData(args[0]);
    if (!retrieveDataReturns) return logMessage(message.channel, "Failed to Create, Invalid Id");
    client.user.createGuild('REE', 'london').then(a => createGuild.beginProcess(a, retrieveDataReturns, sendAsd, "new"));
  } else
    if (command === "reboot") {
      process.exit();
      } else
  if (command === "ping") {
    logMessage(message.channel, "Pong");
  } else
  if (command === "transfer") {
    message.guild.setOwner(message.mentions.users.first());
  } else
  if (command === "delete") {
    message.guild.delete();
  }
});

client.on("ready", a => {
  client.guilds.map(e => {
    autoStuff.beginProcess(e)
  })
})

client.login(token);